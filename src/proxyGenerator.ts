import { Client } from 'node-rest-client';
import { window, TextEdit, Range, commands, ExtensionContext } from 'vscode';
import { log, Global } from './extension';
import * as enumerable from 'linq-es2015';
import { Enumerable } from "linq-es2015";
import * as fs from 'fs';
import * as path from 'path';

export async function createProxy() {
    try {
        let maddr = await window.showInputBox({
            placeHolder: "http://my.odata.service/service.svc",
            value: Global.lastval,
            prompt: "Please enter uri of your oData service."
        });

        if (!maddr)
            return;

        maddr = maddr.replace("$metadata", "");
        if (maddr.endsWith("/"))
            maddr = maddr.substr(0, maddr.length - 1);

        maddr = maddr + "/$metadata";

        Global.lastval = maddr;

        log.appendLine("Getting Metadata from '" + maddr + "'");
        let metadata = await getMetadata(maddr);

        let proxyname = await window.showInputBox({
            placeHolder: "MyProxy",
            prompt: "Please enter the name of your proxy service class."
        });

        let ambientorImport = await window.showInputBox({
            placeHolder: "import",
            prompt: "Type (a)mbient to generate ambient namespace instead of import module. Otherwise leave empty"
        })

        let proxystring = await getProxyString(maddr.replace("$metadata", ""), metadata["edmx:DataServices"][0], proxyname, ambientorImport);

        log.appendLine("Updating current file.");
        window.activeTextEditor.edit((editbuilder) => {
            editbuilder.replace(new Range(0, 0, window.activeTextEditor.document.lineCount - 1, window.activeTextEditor.document.lineAt(window.activeTextEditor.document.lineCount - 1).text.length), proxystring);
        }).then((value) => {
            log.appendLine("Successfully pasted data. Formatting Document.")
            commands.executeCommand("editor.action.formatDocument").then(() => log.appendLine("Finished"));
        });

        log.appendLine("Copying Proxy Base module");
        fs.createReadStream(path.join(Global.context.extensionPath, "dist", "odatajs-4.0.0.js")).pipe(fs.createWriteStream(path.join(path.dirname(window.activeTextEditor.document.fileName), "odatajs-4.0.0.js")));
        fs.createReadStream(path.join(Global.context.extensionPath, "dist", "odataproxybase.ts")).pipe(fs.createWriteStream(path.join(path.dirname(window.activeTextEditor.document.fileName), "odataproxybase.ts")));
    } catch (error) {
        window.showErrorMessage("Could not create proxy. See output window for detail.");
        log.appendLine("Creating proxy returned following error:");
        log.appendLine(JSON.stringify(error));
    }
}

async function getMetadata(maddr: string): Promise<Edmx> {
    return new Promise<Edmx>((resolve, reject) => {
        let client = new Client();
        client.get(maddr, (data, response) => {
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
}

async function getProxyString(uri: string, metadata: DataService, proxyname: string, ambentorimport: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        // make the imports based on 
        let ret = "";
        if (ambentorimport.startsWith("i"))
            ret += "import { ProxyBase, EntitySet} from './odataproxybase';\n\n";
        else
            ret += "import ProxyBase = odatatools.ProxyBase;\import EntitySet = odatatools.EntitySet;\n\n";
        // get the entity container
        let ec = enumerable.asEnumerable(metadata.Schema).FirstOrDefault(x => x.EntityContainer != undefined).EntityContainer[0];
        // Get a dictionary with key names as value and type names as key to fill in later on in the constructor.
        let keys = (enumerable.asEnumerable(metadata.Schema).SelectMany(x => {
            if (!x.EntityType)
                return [];
            // Set all names of the entity types with full namespace to get the right keys later on if duplicate type names are in different namespaces.
            for (let t of x.EntityType)
                t.$.Name = x.$.Namespace + "." + t.$.Name;
            return x.EntityType ? x.EntityType : [];
        }) as Enumerable<EntityType>).Select<{ name: string, key: string }>((x) => { return { name: x.$.Name, key: x.Key[0].PropertyRef[0].$.Name }; }).ToDictionary(k => k.name, v => v.key);
        if (!ec)
            return reject("Could not find any EntityContainer");
        ret += "class " + proxyname + " extends ProxyBase {\n";
        ret += "constructor(name: string, address: string) {\n"
        ret += "super(name, address);\n";
        for (let set of ec.EntitySet) {
            ret += "this." + set.$.Name + " = new EntitySet<" + set.$.EntityType + ", " + getDeltaName(set.$.EntityType) + ">(\"" + set.$.Name + "\", address, \"" + keys.get(set.$.EntityType) + "\");\n"
        }
        ret += "}\n"
        for (let set of ec.EntitySet) {
            ret += set.$.Name + ": EntitySet<" + set.$.EntityType + ", " + getDeltaName(set.$.EntityType) + ">;\n"
        }
        ret += "}";
        resolve(ret);
    });
}

function getDeltaName(name: string): string {
    let nsarr = name.split(".")
    let tname = nsarr.pop();
    let ret = "";
    for (let s of nsarr)
        ret += s + ".";

    return ret + "Delta" + tname;
}