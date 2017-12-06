import { createHeader, getGeneratorSettingsFromDocumentText, getMetadata, GeneratorSettings, GetOutputStyleFromUser } from '../helper';
import * as request from 'request';
import * as xml2js from 'xml2js';
import { window, TextEdit, Range, commands } from 'vscode';
import { log, Global } from '../extension';

export async function getInterfaces() {
    try {
        let input = await window.showInputBox({
            placeHolder: "http://my.odata.service/service.svc",
            value: Global.recentlyUsedAddresses.pop(),
            prompt: "Please enter uri of your oData service.",
            ignoreFocusOut: true
        });

        if (!input)
            return;

        input = input.replace("$metadata", "");
        if (input.endsWith("/"))
            input = input.substr(0, input.length - 1);

        input = input + "/$metadata";

        Global.lastval = input;

        let generatorSettings: GeneratorSettings = {
            source: input,
            modularity: await GetOutputStyleFromUser(),
            requestOptions: {}
        }

        let interfacesstring = await receiveInterfaces(generatorSettings);

        log.appendLine("Putting generated code to the current Editor window.");
        if (!window.activeTextEditor)
            return window.showErrorMessage("No active window selected.");

        window.activeTextEditor.edit((editBuilder) => {
            editBuilder.replace(window.activeTextEditor.selection, interfacesstring);
        }).then((value) => {
            commands.executeCommand("editor.action.formatDocument");
        });
    } catch (error) {
        window.showErrorMessage("Could not create interfaces. See output window for detail.");
        log.appendLine("Creating proxy returned following error:");
        log.appendLine(JSON.stringify(error));
    }
}

async function receiveInterfaces(options: GeneratorSettings): Promise<string> {
    try {
        const edmx = await getMetadata(options.source);
        log.appendLine("Creating Interfaces");
        let interfacesstring = getInterfacesString(edmx["edmx:DataServices"][0].Schema, options);

        log.appendLine("Creating Edm Types");
        interfacesstring += edmTypes(options.modularity === "Ambient");

        log.appendLine("Creating source line");
        interfacesstring += "\n/// Do not modify this line to being able to update your interfaces again:"
        return createHeader(options) + interfacesstring;
    } catch (error) {
        log.appendLine("Unknown error:\n" + error.toString());
        window.showErrorMessage("Error occurred, see console output for more information.");
        return createHeader(options);
    }
}

export async function updateInterfaces() {
    try {
        log.appendLine("Looking for header.");
        let generatorSettings = getGeneratorSettingsFromDocumentText(window.activeTextEditor.document.getText());
        if (!generatorSettings)
            return window.showErrorMessage("Did not find odata source in document: '" + window.activeTextEditor.document.fileName + "'");

        let interfacesstring = await receiveInterfaces(generatorSettings);

        log.appendLine("Updating current file.");
        window.activeTextEditor.edit((editbuilder) => {
            editbuilder.replace(new Range(0, 0, window.activeTextEditor.document.lineCount - 1, window.activeTextEditor.document.lineAt(window.activeTextEditor.document.lineCount - 1).text.length), interfacesstring)
        }).then((value) => {
            log.appendLine("Successfully pasted data. Formatting Document.")
            commands.executeCommand("editor.action.formatDocument").then(() => log.appendLine("Finished"));
        });
    } catch (error) {
        window.showErrorMessage("Could not update interfaces. See output window for detail.");
        log.appendLine("Creating proxy returned following error:");
        if (error.originalStack)
            log.appendLine(error.originalStack);
        else
            log.appendLine(error.toString());
    }
}

var typedefs = {
    Duration: "string",
    Binary: "string",
    Boolean: "boolean",
    Byte: "number",
    Date: "JSDate",
    DateTimeOffset: "JSDate",
    Decimal: "number",
    Double: "number",
    Guid: "string",
    Int16: "number",
    Int32: "number",
    Int64: "number",
    SByte: "number",
    Single: "number",
    String: "string",
    TimeOfDay: "string"
}

function edmTypes(ambient: boolean): string {
    let input = "\n";
    input += "type JSDate = Date;\n\n"
    input += (ambient ? "declare " : "") + "namespace Edm {\n";
    for (let key in typedefs)
        input += "export type " + key + " = " + typedefs[key] + ";\n";
    input += "}";
    return input;
}

function getInterfacesString(schemas: Schema[], generatorSettings: GeneratorSettings): string {
    let ret = "";
    for (let schema of schemas) {
        ret += (generatorSettings.modularity === "Ambient" ? "declare " : "") + "namespace " + schema.$.Namespace + " {\n";
        if (schema.EntityType)
            for (let type of schema.EntityType) {
                ret += "export interface " + type.$.Name + " {\n";
                if (type.Property)
                    for (let prop of type.Property)
                        ret += getProperty(prop);
                if (type.NavigationProperty)
                    for (let prop of type.NavigationProperty)
                        ret += getProperty(prop);
                ret += "}\n";
            }
        if (schema.ComplexType)
            for (let type of schema.ComplexType) {
                ret += "export interface " + type.$.Name + " {\n";
                if (type.Property)
                    for (let prop of type.Property)
                        ret += getProperty(prop);
                ret += "}\n";
            }
        if (schema.EnumType)
            for (let enumtype of schema.EnumType) {
                ret += "type " + enumtype.$.Name + " = ";
                let i = 0;
                if (enumtype.$.Name)
                    for (let member of enumtype.Member)
                        ret += "\"" + member.$.Name + "\"" + (++i < enumtype.Member.length ? " | " : "")
                ret += ";\n";
            }
        ret += "}\n";
    }
    return ret;
}

function getType(typestring: string): string {
    let m = typestring.match(/Collection\((.*)\)/);
    if (m) {
        checkEdmType(m[1]);
        return m[1] + "[]";
    }
    checkEdmType(typestring);
    return typestring;
}

function checkEdmType(typestring: string) {
    if (!typestring)
        return;
    if (!typestring.startsWith("Edm."))
        return;
    let typename = typestring.replace("Edm.", "");
    if (!typedefs[typename])
        typedefs[typename] = "any";
}

function getProperty(inprop: Property | NavigationProperty, forceoptional?: boolean) {
    let prop = inprop as Property;
    return prop.$.Name + (typeof prop.$.Nullable !== 'undefined' ? (forceoptional ? "?" : (prop.$.Nullable ? "" : "?")) : "?") + ": " + getType(prop.$.Type) + ";\n"
}