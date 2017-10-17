import { IEntityType } from './v200/outtypes';
import { log } from './extension';
import * as xml2js from 'xml2js';
import * as request from 'request';
import { window, workspace } from "vscode";
import * as path from 'path';
import { Global } from './extension';
import * as fs from 'fs';
import * as fse from 'fs-extra';

export type Modularity = "Ambient" | "Modular";

export interface GeneratorSettings {
    source: string,
    modularity: Modularity,
    requestOptions: request.CoreOptions
}


export interface TemplateGeneratorSettings extends GeneratorSettings {
    useTemplate: string;
}

export class NoHeaderError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

export function createHeader(options: GeneratorSettings): string {
    // Create update information
    const headerobject = JSON.stringify(options, null, '\t');
    let header = `/**************************************************************************
Created by odatatools: https://marketplace.visualstudio.com/items?itemName=apazureck.odatatools\n`;
    header += "Use Command 'odata: xyUpdate to refresh data while this file is active in the editor.\n"
    header += "Creation Time: " + Date() + "\n";
    header += "DO NOT DELETE THIS IN ORDER TO UPDATE YOUR SERVICE\n";
    header += "#ODATATOOLSOPTIONS\n"
    header += headerobject + "\n";
    header += "#ODATATOOLSOPTIONSEND\n";
    return header + "**************************************************************************/\n\n"
}

export function getGeneratorSettingsFromDocumentText(input: string): TemplateGeneratorSettings {
    const header = input.match(/#ODATATOOLSOPTIONS([\s\S]*)#ODATATOOLSOPTIONSEND/m);
    if (!header)
        throw new NoHeaderError("No valid odata tools header found.");
    return JSON.parse(header[1]);
}

export async function getMetadata(maddr: string, options?: request.CoreOptions): Promise<Edmx> {
    return new Promise<Edmx>((resolve, reject) => {
        let rData = '';
        request.get(maddr, options)
            .on('data', (data) => {
                rData += data;
            })
            .on('complete', (resp) => {
                xml2js.parseString(rData, (err, data) => {
                    try {
                        if (!data["edmx:Edmx"]) {
                            log.appendLine("Received invalid data:\n");
                            log.append(data.toString());
                            return reject(window.showErrorMessage("Response is not valid oData metadata. See output for more information"));
                        }
                        if (data["edmx:Edmx"])
                            return resolve(data["edmx:Edmx"]);
                        return reject("Not valid metadata")
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            });
    });
}

export async function GetOutputStyleFromUser(): Promise<Modularity> {
    return await window.showQuickPick(["Modular", "Ambient"], {
        placeHolder: "Select to generate the service as a modular or ambient version."
    }) as Modularity;
}

export function getModifiedTemplates(): { [x: string]: string } {
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
        ret[file] = fs.readFileSync(path.join(rootpath, ".vscode", "odatatools", "templates", file), 'utf-8');
    }
    return ret;
}

export function getEntityTypeInterface(type: EntityType, schema: Schema): IEntityType {
    const p: Partial<IEntityType> = {
        Key: type.Key ? type.Key[0].PropertyRef[0].$.Name : undefined,
        Name: type.$.Name,
        Fullname: schema.$.Namespace + "." + type.$.Name,
        Properties: [],
        NavigationProperties: [],
        BaseType: type.$.BaseType || undefined,
        OpenType: type.$.OpenType || false,
        Actions: [],
        Functions: [],
    };
    if (type.Property)
        for (let prop of type.Property)
            p.Properties.push({
                Name: prop.$.Name,
                Type: getType(prop.$.Type),
                Nullable: prop.$.Nullable || true,
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
    return p as IEntityType;
}

export function getType(typestring: string): string {
    let m = typestring.match(/Collection\((.*)\)/);
    if (m) {
        return m[1] + "[]";
    }
    return typestring;
}