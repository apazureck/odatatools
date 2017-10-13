import { createHeader, getGeneratorSettingsFromDocumentText, getMetadata, GeneratorSettings, GetOutputStyleFromUser } from '../helper';
import * as request from 'request';
import * as xml2js from 'xml2js';
import { window, TextEdit, Range, commands, workspace } from 'vscode';
import { log, Global } from '../extension';
import * as fs from 'fs';
import * as path from 'path';
import { ncp } from 'ncp';
import * as fse from 'fs-extra';
import * as hb from 'handlebars'

interface TemplateGeneratorSettings extends GeneratorSettings {
    useTemplate: string;
}

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

        let generatorSettings: TemplateGeneratorSettings = {
            source: input,
            modularity: undefined,
            requestOptions: {},
            useTemplate: undefined
        }

        const templates: { [key: string]: string } = getModifiedTemplates();

        let interfaces = await receiveInterfaces(generatorSettings);

        log.appendLine("Putting generated code to the current Editor window.");
        if (!window.activeTextEditor)
            return window.showErrorMessage("No active window selected.");

        window.activeTextEditor.edit((editBuilder) => {
            editBuilder.replace(window.activeTextEditor.selection, parseTemplate(generatorSettings, interfaces, templates));
        }).then((value) => {
            commands.executeCommand("editor.action.formatDocument");
        });
    } catch (error) {
        window.showErrorMessage("Could not create interfaces. See output window for detail.");
        log.appendLine("Creating proxy returned following error:");
        log.appendLine(JSON.stringify(error));
    }
}

function parseTemplate(generatorSettings: TemplateGeneratorSettings, interfaces: IOut, templates: { [key: string]: string }): string {
    if (!generatorSettings.useTemplate) {
        generatorSettings.useTemplate = Object.keys(templates)[0];
    }

    const template = hb.compile(templates[generatorSettings.useTemplate], {
        noEscape: true
    });
    return template(interfaces);
}

function getModifiedTemplates(): { [x: string]: string } {
    let files: string[];
    const rootpath = workspace.rootPath;
    let ret: { [x: string]: string } = {};
    try {
        files = fs.readdirSync(path.join(rootpath, ".vscode", "odatatools", "templates"));
    } catch (error) {
        fs.mkdirSync(path.join(rootpath, ".vscode", "odatatools"));
        fs.mkdirSync(path.join(rootpath, ".vscode", "odatatools", "templates"));
        fse.copySync(path.join(Global.context.extensionPath, "dist", "templates"), path.join(rootpath, ".vscode", "odatatools", "templates"), { recursive: false });
        files = fs.readdirSync(path.join(rootpath, ".vscode", "odatatools", "templates"));
    }
    for (const file of files) {
        ret[file.replace(/\..*$/, "")] = fs.readFileSync(path.join(rootpath, ".vscode", "odatatools", "templates", file), 'utf-8');
    }
    return ret;
}

async function receiveInterfaces(options: GeneratorSettings): Promise<IOut> {
    try {
        const edmx = await getMetadata(options.source);
        log.appendLine("Creating Interfaces");
        let interfaces = getEdmTypes(edmx["edmx:DataServices"][0].Schema, options);
        interfaces.Header = createHeader(options)

        log.appendLine("Creating source line");
        // interfacesstring += "\n/// Do not modify this line to being able to update your interfaces again:"
        return interfaces;
    } catch (error) {
        log.appendLine("Unknown error:\n" + error.toString());
        window.showErrorMessage("Error occurred, see console output for more information.");
        return {
            Header: createHeader(options),
            EntityTypes: [],
            Namespace: "",
            ComplexTypes: [],
            EnumTypes: [],
        }
    }
}

export async function updateInterfaces() {
    try {
        log.appendLine("Looking for header.");
        let generatorSettings = getGeneratorSettingsFromDocumentText(window.activeTextEditor.document.getText()) as TemplateGeneratorSettings;
        if (!generatorSettings)
            return window.showErrorMessage("Did not find odata source in document: '" + window.activeTextEditor.document.fileName + "'");

        let interfaces = await receiveInterfaces(generatorSettings);

        const templates: { [key: string]: string } = getModifiedTemplates();

        log.appendLine("Updating current file.");
        window.activeTextEditor.edit((editbuilder) => {
            editbuilder.replace(new Range(0, 0, window.activeTextEditor.document.lineCount - 1, window.activeTextEditor.document.lineAt(window.activeTextEditor.document.lineCount - 1).text.length), parseTemplate(generatorSettings, interfaces, templates))
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

interface IInterfaces {
    ComplexTypes: ComplexType[];
    EntityTypes: EntityType[];
    EnumTypes: EnumType[];
}

interface IMethod {
    Name: string;
    IsBound: boolean;
    ReturnType: string
}

interface IEntityType extends IComplexType {
    Key: string;
    NavigationProperties: INavigationProperty[];
}

interface IComplexType {
    Name: string;
    Properties: IProperty[];
    BaseType: string;
    OpenType: boolean;
}

interface IEnumType {
    Name: string;
    Value: number;
}

interface IProperty {
    Name: string;
    Type: string;
    Nullable: boolean;
}

interface IEnum {
    Name: string;
    Members: {
        Key: string;
        Value: number;
    }[];
}

interface INavigationProperty extends IProperty {

}

interface IOut {
    Header: string;
    Namespace: string;
    EntityTypes: IEntityType[];
    ComplexTypes: IComplexType[];
    EnumTypes: IEnum[];
}

type Partial<T> = {[P in keyof T]?: T[P]}

function getEdmTypes(schemas: Schema[], generatorSettings: GeneratorSettings): IOut {
    let ret: IOut = {
        Header: "",
        Namespace: "",
        EntityTypes: [],
        ComplexTypes: [],
        EnumTypes: [],
    };
    for (let schema of schemas) {
        ret.Namespace = schema.$.Namespace;
        if (schema.EntityType) {
            for (let type of schema.EntityType) {
                const p: Partial<IEntityType> = {
                    Key: type.Key ? type.Key[0].PropertyRef[0].$.Name : undefined,
                    Name: type.$.Name,
                    Properties: [],
                    NavigationProperties: [],
                    BaseType: type.$.BaseType || undefined,
                    OpenType: type.$.OpenType || false,
                };
                if (type.Property)
                    for (let prop of type.Property)
                        p.Properties.push({
                            Name: prop.$.Name,
                            Type: getType(prop.$.Type),
                            Nullable: prop.$.Nullable || true
                        });
                if (type.NavigationProperty)
                    for (const prop of type.NavigationProperty) {
                        let navprop = prop as Property;
                        p.NavigationProperties.push({
                            Name: navprop.$.Name,
                            Type: getType(navprop.$.Type),
                            Nullable: navprop.$.Nullable || true
                        });
                    }
                ret.EntityTypes.push(p as IEntityType);
            }
        }
        if (schema.ComplexType) {
            for (let type of schema.ComplexType) {
                const p: IComplexType = {
                    Name: type.$.Name,
                    Properties: [],
                    BaseType: type.$.BaseType || undefined,
                    OpenType: type.$.OpenType || false,
                }
                if (type.Property)
                    for (let prop of type.Property)
                        p.Properties.push({
                            Name: prop.$.Name,
                            Type: getType(prop.$.Type),
                            Nullable: prop.$.Nullable || true
                        });
                ret.ComplexTypes.push(p);
            }
        }
        if (schema.EnumType)
            for (let enumtype of schema.EnumType) {
                const p: IEnum = {
                    Name: enumtype.$.Name,
                    Members: [],
                }
                for (const member of enumtype.Member) {
                    p.Members.push({
                        Key: member.$.Name,
                        Value: member.$.Value,
                    })
                }
                ret.EnumTypes.push(p);
            }
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