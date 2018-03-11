import { IEntityType, ISimpleType } from './v200/outtypes';
import { Log } from './log';
import * as xml2js from 'xml2js';
import * as request from 'request';
import { window, workspace, Uri } from "vscode";
import * as path from 'path';
import { Global } from './extension';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as mkd from 'mkdirp';

declare interface OpenDialogOptions {
    defaultUri?: Uri;
    openLabel?: string;
    canSelectFiles?: boolean;
    canSelectFolders?: boolean;
    canSelectMany?: boolean;
    filters: {
        [name: string]: string[];
    }
}

declare interface SaveDialogOptions {
    defaultResource?: Uri;
    saveLabel?: string;
}

export type Modularity = "Ambient" | "Modular";

const log = new Log("helpers");

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
    log.TraceEnterFunction();
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
    log.TraceEnterFunction();
    const header = input.match(/#ODATATOOLSOPTIONS([\s\S]*)#ODATATOOLSOPTIONSEND/m);
    if (!header)
        throw new NoHeaderError("No valid odata tools header found.");
    return JSON.parse(header[1]);
}

export async function getMetadata(maddr: string, options?: request.CoreOptions): Promise<Edmx> {
    log.TraceEnterFunction();
    if (maddr.startsWith("file:///")) {
        return getMetadataFromFile(maddr.replace(/^file:\/\/\//, ""));
    } else {
        return getMetadataFromHttpAddress(maddr, options);
    }
}

function getMetadataFromFile(filename: string): Promise<Edmx> {
    return new Promise<Edmx>((resolve, reject) => {
        const input: string = fs.readFileSync(filename, "utf-8");
        xml2js.parseString(input, (err, data) => {
            parseXmlMetadataString(data, resolve, reject);
        })
    });
}

function getMetadataFromHttpAddress(maddr: string, options?: request.CoreOptions): Promise<Edmx> {
    return new Promise<Edmx>((resolve, reject) => {
        let rData = '';
        request.get(maddr, options)
            .on('data', (data) => {
                rData += data;
            })
            .on('complete', (resp) => {
                xml2js.parseString(rData, (err, data) => {
                    parseXmlMetadataString(data, resolve, reject);
                });
            })
            .on('error', (resp) => {
                return 0;
            });
    });
}

function parseXmlMetadataString(data: {}, resolve: Function, reject: Function) {
    try {
        if (!data["edmx:Edmx"]) {
            log.Error("Received invalid data:\n");
            log.Error(data.toString());
            return reject(window.showErrorMessage("Response is not valid oData metadata. See output for more information"));
        }
        if (data["edmx:Edmx"])
            return resolve(data["edmx:Edmx"]);
        return reject("Not valid metadata")
    }
    catch (error) {
        return reject(error);
    }
}

export async function GetOutputStyleFromUser(): Promise<Modularity> {
    log.TraceEnterFunction();
    return await window.showQuickPick(["Modular", "Ambient"], {
        placeHolder: "Select to generate the service as a modular or ambient version."
    }) as Modularity;
}

export function getModifiedTemplates(): { [x: string]: string } {
    log.TraceEnterFunction();
    let files: string[];
    const rootpath = workspace.rootPath;
    let ret: { [x: string]: string } = {};
    try {
        files = fs.readdirSync(path.join(rootpath, ".vscode", "odatatools", "templates"));
        if (files.length == 0)
            throw new Error("No templates found");
    } catch (error) {
        try {
            fs.mkdirSync(path.join(rootpath, ".vscode", "odatatools"));
            fs.mkdirSync(path.join(rootpath, ".vscode", "odatatools", "templates"));
        } catch (error) {

        }
        fse.copySync(path.join(Global.context.extensionPath, "dist", "templates", "promise"), path.join(rootpath, ".vscode", "odatatools", "templates"), { recursive: false });
        files = fs.readdirSync(path.join(rootpath, ".vscode", "odatatools", "templates"));
    }
    for (const file of files) {
        // Get all OData Templates
        if (path.extname(file) === ".ot")
            ret[file] = fs.readFileSync(path.join(rootpath, ".vscode", "odatatools", "templates", file), 'utf-8');
    }
    return ret;
}

export function getType(typestring: string): ISimpleType {
    log.TraceEnterFunction();
    let m = typestring.match(/Collection\((.*)\)/);
    if (m) {
        return {
            IsCollection: true,
            Name: m[1],
            IsVoid: m[1] === "void",
        }
    }
    return {
        Name: typestring,
        IsCollection: false,
        IsVoid: typestring === "void",
    }
}

export async function getHostAddressFromUser(): Promise<string | Uri> {
    log.TraceEnterFunction();
    let pick: string = "New Url...";
    const rul = Global.recentlyUsedAddresses
    if (rul && rul.length > 0)
        pick = await window.showQuickPick(["New Entry...", "New File..."].concat(Global.recentlyUsedAddresses), {
            placeHolder: "Select from recently used addresses or add new entry"
        });
    if (pick === "New File...") {
        const options: OpenDialogOptions = {
            canSelectMany: false,
            filters: {
                "XML": ["xml"]
            },
            openLabel: "Open Metadata"
        }
        return (await (window as any).showOpenDialog(options) as Thenable<Uri[]>)[0];
    } else if (pick === "New Url...")
        pick = await window.showInputBox({
            placeHolder: "http://my.odata.service/service.svc",
            value: Global.recentlyUsedAddresses.pop(),
            prompt: "Please enter uri of your oData service.",
            ignoreFocusOut: true,
        });

    if (!pick)
        throw new Error("User did not input valid address");

    pick = pick.replace("$metadata", "");
    if (pick.endsWith("/"))
        pick = pick.substr(0, pick.length - 1);

    return pick.startsWith("file:///") ? pick : pick + "/$metadata";
}

export function getEntityTypeInterface(type: EntityType, schema: Schema): IEntityType {
    log.TraceEnterFunction();
    const p: Partial<IEntityType> = {
        // Key: type.Key ? type.Key[0].PropertyRef[0].$.Name : undefined,
        Name: type.$.Name,
        Fullname: schema.$.Namespace + "." + type.$.Name,
        Properties: [],
        NavigationProperties: [],
        BaseTypeFullName: type.$.BaseType || undefined,
        OpenType: type.$.OpenType || false,
        Actions: [],
        Functions: [],
    };
    if (type.Property)
        for (let prop of type.Property)
            p.Properties.push({
                Name: prop.$.Name,
                Type: getType(prop.$.Type),
                Nullable: prop.$.Nullable ? (prop.$.Nullable == "false" ? false : true) : true,
            });
    if (type.Key) {
        p.Key = p.Properties[0];
    }
    if (type.NavigationProperty)
        for (const prop of type.NavigationProperty) {
            let navprop = prop as Property;
            p.NavigationProperties.push({
                Name: navprop.$.Name,
                Type: getType(navprop.$.Type),
                Nullable: true,
            });
        }
    return p as IEntityType;
}