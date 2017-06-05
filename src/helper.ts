import { log } from './extension';
import * as xml2js from 'xml2js';
import * as request from 'request';
import { window } from "vscode";

export type Modularity = "Ambient" | "Modular";

export interface GeneratorSettings {
    source: string,
    modularity: Modularity,
    requestOptions: request.CoreOptions
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

export function getGeneratorSettingsFromDocumentText(input: string): GeneratorSettings {
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