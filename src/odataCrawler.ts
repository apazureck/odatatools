import { Client } from 'node-rest-client';
import { window, TextEdit, Range, commands} from 'vscode';
import { log } from './extension';

interface EdmxBase {
    
}

interface Edmx extends EdmxBase {
    $: {
        Version: string;
        "xmlns:edmx": string;
    }
    "edmx:DataServices": { Schema: Schema[] };
}

interface Schema extends EdmxBase {
    $: { Namespace: string; }
    ComplexType: ComplexType[];
    EntityType: EntityType[];
    EnumType: EnumType[];
}

interface EnumType {
    $: { Name: string; }
    Member: {
        $: {
            Name: string;
            Value: number;
        }
    }[]
}

interface NavigationProperty {
    ReferentialConstraint?: {
        $: {
            Name: string;
            Type: string;
            Property: string;
            ReferencedProperty: string;
        }
    }
}

interface ComplexType extends EdmxBase {
    $: { Name: string; }
    Property: Property[];
}

interface Property extends EdmxBase {
    $: {
        Name: string;
        Type: string;
        Nullable?: boolean;
    }
}

interface EntityType extends ComplexType {
    Key?: { PropertyRef: { $: { Name: string } } }[];
    NavigationProperty: NavigationProperty[];
}

var lastval: string = null;

export async function getInterfaces() {
    let input = await window.showInputBox({
        placeHolder: "http://my.odata.service/service.svc",
        value: lastval,
        prompt: "Please enter uri of your oData service."
    });

    if(!input)
        return;

    input = input.replace("$metadata", "");
    if(input.endsWith("/"))
        input = input.substr(0, input.length-1);

    input = input + "/$metadata";

    lastval = input;

    let interfacesstring = await receiveInterfaces(input);

    log.appendLine("Putting generated code to the current Editor window.");
    if(!window.activeTextEditor)
        return window.showErrorMessage("No active window selected.");

    window.activeTextEditor.edit((editBuilder) => {
        editBuilder.replace(window.activeTextEditor.selection, interfacesstring);
    }).then((value) => {
        commands.executeCommand("editor.action.formatDocument");
    });
}

async function receiveInterfaces(input): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let client = new Client();
        client.get(input, (data, response) => {
            try {
                if(!data["edmx:Edmx"]) {
                    log.appendLine("Received invalid data:\n");
                    log.append(data.toString());
                    return reject(window.showErrorMessage("Response is not valid oData metadata. See output for more information"));
                }
                let edmx: Edmx = data["edmx:Edmx"];
                let version = edmx.$.Version;
                log.appendLine("oData version: " + version);
                if(version!="4.0")
                    window.showWarningMessage("WARNING! Current oDate Service Version is '"+version+"'. Trying to get interfaces, but service only supports Version 4.0! Outcome might be unexpected.");

                log.appendLine("Creating Interfaces");
                let interfacesstring = getInterfacesString(edmx["edmx:DataServices"][0].Schema);

                log.appendLine("Creating Edm Types");
                interfacesstring += edmTypes();

                log.appendLine("Creating source line");
                interfacesstring += "\n/// Do not modify this line to being able to update your interfaces again:"
                interfacesstring += "\n/// #odata.source = '"+input+"'";
                resolve(interfacesstring)
            } catch (error) {
                console.error("Unknown error:\n", error.toString())
                window.showErrorMessage("Unknown error occurred, see console output for more information.");
                reject(error);
            }
        });
    });
}

export async function updateInterfaces() {
    log.appendLine("Looking for #odata.source hook");
    let m = window.activeTextEditor.document.getText().match("/// #odata.source = '(.*?)'");
    if(!m)
        return window.showErrorMessage("Did not find odata source in document: '" + window.activeTextEditor.document.fileName + "'");

    let interfacesstring = await receiveInterfaces(m[1]);

    log.appendLine("Updating current file.");
    window.activeTextEditor.edit((editbuilder) => {
        editbuilder.replace(new Range(0, 0, window.activeTextEditor.document.lineCount-1, window.activeTextEditor.document.lineAt(window.activeTextEditor.document.lineCount-1).text.length), interfacesstring)
    }).then((value) => {
        log.appendLine("Successfully pasted data. Formatting Document.")
        commands.executeCommand("editor.action.formatDocument").then(()=>log.appendLine("Finished"));
    });
}

var typedefs = {
    Duration: "string",
    Binary: "string",
    Boolean: "boolean",
    Byte: "number",
    Date: "string",
    DateTimeOffset: "string",
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

function edmTypes(): string {
    let input = "\n";
    input += "namespace Edm {\n";
    for(let key in typedefs)
        input += "export type "+key+" = "+typedefs[key]+";\n";
    input += "}";
    return input;
}

function getInterfacesString(schemas: Schema[]): string {
    let ret = "";
    for(let schema of schemas) {
        ret += "namespace " + schema.$.Namespace + " {\n";
        if(schema.EntityType)
            for(let type of schema.EntityType) {
                ret += "export interface " + type.$.Name + " {\n";
                if(type.Property)
                    for(let prop of type.Property)
                        ret += getProperty(prop);
                if(type.NavigationProperty)
                    for(let prop of type.NavigationProperty)
                        ret += getProperty(prop);
                ret += "}\n";
            }
        if(schema.ComplexType)
            for(let type of schema.ComplexType) {
                ret += "export interface " + type.$.Name + " {\n";
                if(type.Property)
                    for(let prop of type.Property)
                        ret += getProperty(prop);
                ret += "}\n";
            }
        if(schema.EnumType)
            for(let enumtype of schema.EnumType) {
                ret += "export enum " + enumtype.$.Name + " {\n";
                let i = 0;
                if(enumtype.$.Name)
                    for(let member of enumtype.Member)
                        ret += member.$.Name + " = " + member.$.Value + (++i < enumtype.Member.length ? "," : "")
                ret += "}\n";
            }
        ret += "}\n";
    }
    return ret;
}

function getType(typestring: string): string {
    let m = typestring.match(/Collection\((.*)\)/);
    if(m) {
        checkEdmType(m[1]);
        return m[1] + "[]";
    }
    checkEdmType(typestring);
    return typestring;
}

function checkEdmType(typestring: string) {
    if(!typestring)
        return;
    if(!typestring.startsWith("Edm."))
        return;
    let typename = typestring.replace("Edm.", "");
    if(!typedefs[typename])
        typedefs[typename] = "any";
}

function getProperty(inprop: Property | NavigationProperty) {
    let prop = inprop as Property;
    if(typeof inprop === 'NavigationProperty')
        prop.$.Nullable = true;
    return prop.$.Name + (typeof prop.$.Nullable !== 'undefined' ? (prop.$.Nullable ? "" : "?") : "?") + ": " + getType(prop.$.Type) + ";\n"
}