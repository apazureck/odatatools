import { Client } from 'node-rest-client';
import { window, TextEdit, Range, commands, ExtensionContext } from 'vscode';
import { log, Global } from './extension';
import * as enumerable from 'linq-es2015';
import { Enumerable } from "linq-es2015";
import * as fs from 'fs';
import * as path from 'path';

type ftype = "Action" | "Function"

export async function createProxy() {
    try {
        let maddr = await window.showInputBox({
            placeHolder: "http://my.odata.service/service.svc",
            value: Global.lastval,
            prompt: "Please enter uri of your oData service.",
            ignoreFocusOut: true
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

        let ambientorImport = await window.showInputBox({
            placeHolder: "import",
            prompt: "Type (a)mbient to generate ambient namespace instead of import module. Otherwise leave empty"
        })

        let proxystring = await getProxyString(maddr.replace("$metadata", ""), metadata["edmx:DataServices"][0], ambientorImport);
        proxystring = await replaceWithBoundActions(proxystring, metadata["edmx:DataServices"][0])
        proxystring = surroundWithNamespace(proxystring, metadata["edmx:DataServices"][0]);

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
        log.appendLine(error.toString());
    }
}

function surroundWithNamespace(proxystring: string, metadata: DataService): string {
    let ecschema = enumerable.asEnumerable(metadata.Schema).FirstOrDefault(x => x.EntityContainer != undefined);
    if (!ecschema)
        throw new Error("No entity container found on odata service.");

    let ret = "namespace " + ecschema.$.Namespace + " {\n";
    ret += proxystring + "\n"
    ret += "}";
    return ret;
}

class EntitySet {
    constructor(public Type: string) {
        this.Actions = [];
        this.Functions = [];
    }

    Actions: Method[];
    Functions: Method[];

    getImplementedClass(metadata: DataService): string {
        let typedef = (enumerable.asEnumerable(metadata.Schema)
            .SelectMany(x => {
                if (!x.EntityType)
                    return [];
                return x.EntityType ? x.EntityType : [];
            }) as Enumerable<EntityType>)
            .FirstOrDefault(x => x.$.Name == this.Type);
        let key = typedef.Key[0].PropertyRef[0].$.Name;
        let keytype = enumerable.asEnumerable<Property>(typedef.Property).FirstOrDefault(x => x.$.Name === key).$.Type;

        let ret = "export class " + this.getTypeName() + " extends " + this.getSubstitutedType() + " {\n";
        ret += "constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {";
        ret += "super(name, address, key, additionalHeaders);\n";
        ret += "}\n"
        for (let a of this.Actions)
            ret += this.createMethod(a, "POST", keytype) + "\n";
        for (let f of this.Functions)
            ret += this.createMethod(f, "GET", keytype) + "\n";
        ret += "}\n"
        return ret;
    }

    getSubstitutedType(): string {
        return "EntitySet<" + this.Type + ", " + this._getDeltaType() + ">";
    }

    private _getDeltaType(): string {
        let tcomponents = this.Type.split(".");
        let name = tcomponents.pop();
        return enumerable.asEnumerable(tcomponents).Aggregate<string>((a, b) => a + b + ".") + "Delta" + name;
    }

    getTypeName(): string {
        return this.Type.split(".").pop() + "EntitySet";
    }

    private _getParameters(parameters: Parameter[]): string {
        let ret = "";
        for(let param of parameters) {
            ret += param.$.Name + ": " + param.$.Type + ", "
        }
        // return list without last ", "
        return ret.substr(0, ret.length-2);
    }

    private _getReturnType(returntype: ReturnType[]): string {
        if(!returntype)
            return "void"
        return returntype[0].Type;
    }

    private _getParameterJSON(parameters: Parameter[]): string {
        let ret = "{\n"
        for(let param of parameters) {
            ret += param.$.Name + ": " + param.$.Name + ",\n";
        }
        ret = ret.substr(0, ret.length-2) + "\n";
        return ret + "}";
    }

    private createMethod(method: Method, requesttype: GetOrPost, key: string): string {
        // TODO: get key type
        let ret = method.$.Name + "(" + (method.IsBoundToCollection ? "" : "key: " + key + (method.Parameter.length>0?", ":"")) + this._getParameters(method.Parameter) + "): Thenable<"+this._getReturnType(method.ReturnType)+">{\n";
        ret += "let callback = new ThenableCaller<"+this._getReturnType(method.ReturnType)+">();\n";
        ret += "let request: odatajs.Request = {\n";
        ret += "headers: this.Headers,\n";
        ret += "method: \""+requesttype+"\",\n";
        ret += "requestUri: this.Address  + \"" + (method.IsBoundToCollection ? "" : "(\"+key+\")") + "/" + method.Namespace + "." + method.$.Name + "\",\n";
        if(method.Parameter.length>0)
            ret += "data: " + this._getParameterJSON(method.Parameter) + "\n";
        ret += "}\n";
        ret += "odatajs.oData.request(request, (data, response) => {\n";
        ret += "callback.resolve();\n"
        ret += "}, (error) => {\n";
        ret += "console.error(error.name + \" \" + error.message + \" | \" + (error.response | error.response.statusText) + \":\" + (error.response | error.response.body));\n";
        ret += "callback.reject(error);\n";
        ret += "});\n";
        ret += "return callback;\n";
        ret += "}\n";
        return ret;
    }
}

type GetOrPost = "GET" | "POST";

async function replaceWithBoundActions(proxystring: string, metadata: DataService): Promise<string> {
    log.appendLine("Looking for actions and functions")
    return new Promise<string>((resolve, reject) => {
        let ecschema = enumerable.asEnumerable(metadata.Schema).FirstOrDefault(x => x.EntityContainer != undefined);
        if (!ecschema)
            reject("No entity container found on odata service.");

        let entitysets = getEntitySetsWithActionsOrFunctions(ecschema);

        for (let typename in entitysets) {
            proxystring = proxystring.replace(new RegExp(entitysets[typename].getSubstitutedType(), 'g'), entitysets[typename].getTypeName())
            proxystring += "\n" + entitysets[typename].getImplementedClass(metadata) + "\n";
        }

        resolve(proxystring);
    });
}

function getEntitySetsWithActionsOrFunctions(ecschema: Schema): { [type: string]: EntitySet } {
    let entitySets: { [type: string]: EntitySet } = {};

    if (ecschema.Action) {
        log.appendLine("Found " + ecschema.Action.length + " OData Actions");
        for (let a of ecschema.Action) {
            try {
                log.appendLine("Adding" + (a.$.IsBound ? " bound " : " ") + "Action " + a.$.Name);
                // Try and get entity set
                let params = enumerable.AsEnumerable(a.Parameter);
                // if parameter bindingparameter exists it is a bound action/function
                let bindingParameter = params.FirstOrDefault(x => x.$.Name === "bindingParameter");

                if (bindingParameter) {
                    let curset = getSet(bindingParameter, entitySets);
                    // get rest of Parameters
                    let methodparams = params.Where(x => x.$.Name !== "bindingParameter");
                    a.Parameter = methodparams.ToArray();
                    a.Namespace = ecschema.$.Namespace;
                    curset.Actions.push(a);
                    entitySets[curset.Type] = curset;
                } else {
                    // Method is not a bound action or function (NOT IMPLEMENTED SO FAR)
                    log.appendLine("Does not support unbound function or action");
                }
            } catch (error) {
                log.appendLine("Error occurred when adding action " + a.$.Name + ": " + error.toString())
            }
        }
    }

    if (ecschema.Function) {
        log.appendLine("Found " + ecschema.Function.length + " OData Functions");
        for (let f of ecschema.Function) {
            try {
                log.appendLine("Adding" + f.$.IsBound ? " bound " : " " + "Function " + f.$.Name);
                // Try and get entity set
                let params = enumerable.AsEnumerable(f.Parameter);
                // if parameter bindingparameter exists it is a bound action/function
                let bindingParameter = params.FirstOrDefault(x => x.$.Name === "bindingParameter");

                if (bindingParameter) {
                    let curset = getSet(bindingParameter, entitySets);
                    // get rest of Parameters
                    let methodparams = params.Where(x => x.$.Name !== "bindingParameter");
                    f.Parameter = methodparams.ToArray();
                    f.IsBoundToCollection = bindingParameter.$.Type.match(/Collection\(.*\)/) != undefined;
                    f.Namespace = ecschema.$.Namespace;
                    curset.Functions.push(f);
                    entitySets[curset.Type] = curset;
                } else {
                    // Method is not a bound action or function (NOT IMPLEMENTED SO FAR)
                    log.appendLine("Does not support unbound function or action");
                }
            } catch (error) {
                log.appendLine("Error occurred when adding function " + f.$.Name + ": " + error.toString());
            }
        }
    }

    return entitySets;
}

function getSet(bindingParameter: Parameter, entitySets: { [type: string]: EntitySet }): EntitySet {
    let type: string;
    let colmatch = bindingParameter.$.Type.match(/Collection\((.*)\)/);
    if (colmatch) {
        type = colmatch[1];
    } else {
        type = bindingParameter.$.Type;
    }
    // Return new entity set if not found.
    try {
        if (!entitySets[type]) throw new Error();
        return entitySets[type];
    } catch (error) {
        return new EntitySet(type);
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

async function getProxyString(uri: string, metadata: DataService, ambentorimport: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        // make the imports based on 
        let ret = "";
        if (ambentorimport.startsWith("i"))
            ret += "import { ProxyBase, EntitySet} from './odataproxybase';\n\n";
        else
            ret += "import ProxyBase = odatatools.ProxyBase;\nimport EntitySet = odatatools.EntitySet;\nimport ThenableCaller = odatatools.ThenableCaller;\nimport Thenable = odatatools.Thenable;\n\n";
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
        ret += "export class " + ec.$.Name + " extends ProxyBase {\n";
        ret += "constructor(address: string, name?: string, additionalHeaders?: odatajs.Header) {\n"
        ret += "super(address, name, additionalHeaders);\n";
        for (let set of ec.EntitySet) {
            ret += "this." + set.$.Name + " = new EntitySet<" + set.$.EntityType + ", " + getDeltaName(set.$.EntityType) + ">(\"" + set.$.Name + "\", address, \"" + keys.get(set.$.EntityType) + "\", additionalHeaders);\n"
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