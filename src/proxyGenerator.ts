import { Client } from 'node-rest-client';
import { window, TextEdit, Range, commands, ExtensionContext} from 'vscode';
import { log, Global } from './extension';
import * as enumerable from 'linq-es2015';
import * as fs from 'fs';
import * as path from 'path';

export async function createProxy() {
    let maddr = await window.showInputBox({
        placeHolder: "http://my.odata.service/service.svc",
        value: Global.lastval,
        prompt: "Please enter uri of your oData service."
    });

    if(!maddr)
        return;

    maddr = maddr.replace("$metadata", "");
    if(maddr.endsWith("/"))
        maddr = maddr.substr(0, maddr.length-1);

    maddr = maddr + "/$metadata";

    Global.lastval = maddr;

    log.appendLine("Getting Metadata from '" + maddr + "'");
    let metadata = await getMetadata(maddr);

    let proxyname = await window.showInputBox({
        placeHolder: "MyProxy",
        prompt: "Please enter the name of your proxy service class."
    });

    let proxystring = await getProxyString(maddr.replace("$metadata", ""), metadata["edmx:DataServices"][0], proxyname);

    log.appendLine("Updating current file.");
    window.activeTextEditor.edit((editbuilder) => {
        editbuilder.replace(new Range(0, 0, window.activeTextEditor.document.lineCount-1, window.activeTextEditor.document.lineAt(window.activeTextEditor.document.lineCount-1).text.length), proxystring);
    }).then((value) => {
        log.appendLine("Successfully pasted data. Formatting Document.")
        commands.executeCommand("editor.action.formatDocument").then(()=>log.appendLine("Finished"));
    });

    log.appendLine("Copying Proxy Base module");
    fs.createReadStream(path.join(Global.context.extensionPath, "dist", "odatajs-4.0.0.js")).pipe(fs.createWriteStream(path.join(path.dirname(window.activeTextEditor.document.fileName), "odatajs-4.0.0.js")));
    fs.createReadStream(path.join(Global.context.extensionPath, "dist", "odataproxybase.ts")).pipe(fs.createWriteStream(path.join(path.dirname(window.activeTextEditor.document.fileName), "odataproxybase.ts")));
}

async function getMetadata(maddr: string): Promise<Edmx> {
    return new Promise<Edmx>((resolve, reject) => {
        let client = new Client();
        client.get(maddr, (data, response) => {
            try {
                if(!data["edmx:Edmx"]) {
                    log.appendLine("Received invalid data:\n");
                    log.append(data.toString());
                    return reject(window.showErrorMessage("Response is not valid oData metadata. See output for more information"));
                }
                if(data["edmx:Edmx"])
                    return resolve(data["edmx:Edmx"]);
                return reject("Not valid metadata")
            }
            catch(error) {
                reject(error);
            }
        });
    });
}

async function getProxyString(uri: string, metadata: DataService, proxyname: string) : Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let ret = "import { ProxyBase, EntitySet} from './odataproxybase';\n";
        let ec = enumerable.asEnumerable(metadata.Schema).FirstOrDefault(x => x.EntityContainer != undefined).EntityContainer[0];
        if(!ec)
            return reject("Could not find any EntityContainer");
        ret += "class " + proxyname + " extends ProxyBase {\n";
        ret += "constructor(name: string, address: string) {\n"
        ret += "super(name, address);\n";
        for(let set of ec.EntitySet) {
            ret += "this." + set.$.Name + " = new EntitySet<" + set.$.EntityType + ">(\""+set.$.Name+"\", address);\n"
        }
        ret += "}\n"
        for(let set of ec.EntitySet) {
            ret += set.$.Name + ": EntitySet<" + set.$.EntityType + ">;\n"
        }
        ret += "}";
        resolve(ret);
    });
}