import { window, TextEdit, Range, commands, ExtensionContext } from 'vscode';
import { Global } from '../extension';
import { Log } from '../log';
import * as enumerable from 'linq-es2015';
import { Enumerable } from "linq-es2015";
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request';
import * as xml2js from 'xml2js';
import {
    createHeader,
    GeneratorSettings,
    getGeneratorSettingsFromDocumentText,
    getMetadata,
    GetOutputStyleFromUser,
    Modularity,
    NoHeaderError
} from '../helper';

const methodhook = "//${unboundMethods}";
const log = new Log("proxyGeneratorV100");

export async function createProxy() {
    let generatorSettings: GeneratorSettings = {
        modularity: "Ambient",
        requestOptions: {},
        source: "unknown"
    };
    try {
        // TODO: Change to quickpick to provide full file list
        let maddr = await window.showInputBox({
            placeHolder: "http://my.odata.service/service.svc",
            value: Global.recentlyUsedAddresses.pop(),
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
        generatorSettings.source = maddr;

        log.Info("Getting Metadata from '" + maddr + "'");
        const metadata = await getMetadata(maddr);

        generatorSettings.modularity = await GetOutputStyleFromUser();

        generateProxy(metadata, generatorSettings);

    } catch (error) {
        window.showErrorMessage("Could not create proxy. See output window for detail.");
        log.Info("Creating proxy returned following error:");
        if (error.originalStack)
            log.Error(error.originalStack);
        else
            log.Error(error.toString());

        log.Info("Updating current file.");
        await window.activeTextEditor.edit((editbuilder) => {
            editbuilder.replace(new Range(0, 0, window.activeTextEditor.document.lineCount - 1, window.activeTextEditor.document.lineAt(window.activeTextEditor.document.lineCount - 1).text.length), createHeader(generatorSettings));
        });

        log.Info("Successfully pasted data. Formatting Document.")
        commands.executeCommand("editor.action.formatDocument").then(() => log.Info("Finished"));
    }
}

async function generateProxy(metadata: Edmx, options: GeneratorSettings) {
    // window.showInformationMessage("Select import type (ambient or modular) for generation.");

    let proxystring = await getProxyString(options.source.replace("$metadata", ""), metadata["edmx:DataServices"][0], options.modularity);
    proxystring = await addActionsAndFunctions(proxystring, metadata["edmx:DataServices"][0]);
    proxystring = surroundWithNamespace(metadata["edmx:DataServices"][0], options, proxystring);

    log.Info("Updating current file.");
    await window.activeTextEditor.edit((editbuilder) => {
        editbuilder.replace(new Range(0, 0, window.activeTextEditor.document.lineCount - 1, window.activeTextEditor.document.lineAt(window.activeTextEditor.document.lineCount - 1).text.length), proxystring);
    });

    log.Info("Successfully pasted data. Formatting Document.")
    commands.executeCommand("editor.action.formatDocument").then(() => log.Info("Finished"));

    log.Info("Copying Proxy Base module");
    if (options.modularity === "Ambient") {
        fs.createReadStream(path.join(Global.context.extensionPath, "dist", "odatajs-4.0.0.js")).pipe(fs.createWriteStream(path.join(path.dirname(window.activeTextEditor.document.fileName), "odatajs.js")));
        fs.createReadStream(path.join(Global.context.extensionPath, "dist", "odataproxybaseAsync.ts")).pipe(fs.createWriteStream(path.join(path.dirname(window.activeTextEditor.document.fileName), "odataproxybase.ts")));
    }

    else {
        fs.createReadStream(path.join(Global.context.extensionPath, "dist", "odataproxybaseAsyncModular.ts")).pipe(fs.createWriteStream(path.join(path.dirname(window.activeTextEditor.document.fileName), "odataproxybase.ts")));
        fs.createReadStream(path.join(Global.context.extensionPath, "dist", "odatajs.d.ts")).pipe(fs.createWriteStream(path.join(path.dirname(window.activeTextEditor.document.fileName), "odatajs.d.ts")));
    }
    Global.AddToRecentlyUsedAddresses(options.source);
}

export async function updateProxy() {
    let header: GeneratorSettings;
    try {
        header = getGeneratorSettingsFromDocumentText(window.activeTextEditor.document.getText());

        if (!header)
            return window.showErrorMessage("Could not find valid odatatools header to generate proxy from. Use 'Create Proxy' command instead.");

        if (!header.source)
            return window.showErrorMessage("No source property in odatatools header. Use 'Create Proxy' command instead.");

        log.Info("Getting Metadata from '" + header.source + "'");
        const metadata = await getMetadata(header.source, header.requestOptions);

        generateProxy(metadata, header);

    } catch (error) {
        window.showErrorMessage("Could not create proxy. See output window for detail.");
        log.Info("Creating proxy returned following error:");
        if (error.originalStack)
            log.Error(error.originalStack);
        else
            log.Error(error.toString());

        log.Info("Updating current file.");
        await window.activeTextEditor.edit((editbuilder) => {
            editbuilder.replace(new Range(0, 0, window.activeTextEditor.document.lineCount - 1, window.activeTextEditor.document.lineAt(window.activeTextEditor.document.lineCount - 1).text.length), createHeader(error instanceof NoHeaderError ? {
                source: "unknown", modularity: "Ambient", requestOptions: {}
            } : header));
        });

        log.Info("Created header");
        commands.executeCommand("editor.action.formatDocument").then(() => log.Info("Finished"));
    }
}

function surroundWithNamespace(metadata: DataService, options: GeneratorSettings, proxystring: string): string {
    const ecschema = enumerable.asEnumerable(metadata.Schema).FirstOrDefault(x => x.EntityContainer != undefined);
    if (!ecschema)
        throw new Error("No entity container found on odata service.");

    let ret = createHeader(options);

    if (options.modularity === "Modular")
        return ret + proxystring;

    ret += "namespace " + ecschema.$.Namespace + " {\n";
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
            ret += createMethod(a, "POST", keytype) + "\n";
        for (let f of this.Functions)
            ret += createMethod(f, "GET", keytype) + "\n";
        ret += "}\n"
        return ret;
    }

    getSubstitutedType(): string {
        return "EntitySet<" + this.Type + ">";
    }

    private _getDeltaType(): string {
        let tcomponents = this.Type.split(".");
        let name = tcomponents.pop();
        return enumerable.asEnumerable(tcomponents).Aggregate<string>((a, b) => a + b + ".") + "Delta" + name;
    }

    getTypeName(): string {
        return this.Type.split(".").pop() + "EntitySet";
    }
}

type GetOrPost = "GET" | "POST";

async function addActionsAndFunctions(proxystring: string, metadata: DataService): Promise<string> {
    log.Info("Looking for actions and functions")
    return new Promise<string>((resolve, reject) => {
        let ecschema = enumerable.asEnumerable(metadata.Schema).FirstOrDefault(x => x.EntityContainer != undefined);
        if (!ecschema)
            reject("No entity container found on odata service.");

        let entitysets = getBoundActionsAndFunctions(ecschema);

        for (let typename in entitysets) {
            proxystring = proxystring.replace(new RegExp(entitysets[typename].getSubstitutedType(), 'g'), entitysets[typename].getTypeName())
            proxystring += "\n" + entitysets[typename].getImplementedClass(metadata) + "\n";
        }

        let unboundmethods: string = "";
        for (let method of getUnboundActionsAndFunctions(ecschema)) {
            unboundmethods += createMethod(method, method.Type === "Function" ? "GET" : "POST");
        }
        proxystring = proxystring.replace(methodhook, unboundmethods)

        resolve(proxystring);
    });
}

function getUnboundActionsAndFunctions(ecschema: Schema): Method[] {
    let all: Method[] = [];
    if (ecschema.Action) {
        log.Info("Found " + ecschema.Action.length + " OData Actions");
        let acts = ecschema.Action.filter(x => !x.$.IsBound);
        for (let a of acts) {
            a.Type = "Function";
            all.push(a);
        }
    }
    if (ecschema.Function) {
        log.Info("Found " + ecschema.Function.length + " OData Functions");
        let fcts = ecschema.Function.filter(x => !x.$.IsBound);
        for (let f of fcts) {
            f.Type = "Function";
            all.push(f);
        }
    }

    return all;
}

function getBoundActionsAndFunctions(ecschema: Schema): { [type: string]: EntitySet } {
    let entitySets: { [type: string]: EntitySet } = {};

    if (ecschema.Action) {
        log.Info("Found " + ecschema.Action.length + " OData Actions");
        for (let a of ecschema.Action) {
            try {
                if (!a.$.IsBound)
                    continue;
                log.Info("Adding bound Action " + a.$.Name);

                // if parameter bindingparameter exists it is a bound action/function
                let bindingParameter = a.Parameter.find(x => x.$.Name === "bindingParameter");

                if (bindingParameter) {
                    let curset = getSet(bindingParameter, entitySets);
                    // get rest of Parameters
                    a.Parameter = a.Parameter.filter(x => x.$.Name !== "bindingParameter");
                    a.Namespace = ecschema.$.Namespace;
                    a.Type = "Action";
                    curset.Actions.push(a);
                    entitySets[curset.Type] = curset;
                } else {
                    // Method is not a bound action or function (NOT IMPLEMENTED SO FAR)
                    log.Warn("Does not support unbound function or action");
                }
            } catch (error) {
                log.Error("Error occurred when adding action " + a.$.Name + ": " + error.toString())
            }
        }
    }

    if (ecschema.Function) {
        log.Info("Found " + ecschema.Function.length + " OData Functions");
        for (let f of ecschema.Function) {
            try {
                if (!f.$.IsBound)
                    continue;
                log.Info("Adding bound Function " + f.$.Name);

                // if parameter bindingparameter exists it is a bound action/function
                let bindingParameter = f.Parameter.find(x => x.$.Name === "bindingParameter");

                if (bindingParameter) {
                    let curset = getSet(bindingParameter, entitySets);
                    // get rest of Parameters
                    f.Parameter = f.Parameter.filter(x => x.$.Name !== "bindingParameter");
                    f.IsBoundToCollection = bindingParameter.$.Type.match(/Collection\(.*\)/) != undefined;
                    f.Namespace = ecschema.$.Namespace;
                    f.Type = "Function";
                    curset.Functions.push(f);
                    entitySets[curset.Type] = curset;
                } else {
                    // Method is not a bound action or function (NOT IMPLEMENTED SO FAR)
                    log.Warn("Does not support unbound function or action");
                }
            } catch (error) {
                log.Error("Error occurred when adding function " + f.$.Name + ": " + error.toString());
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

async function getProxyString(uri: string, metadata: DataService, selectString: Modularity): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        log.Trace();
        // make the imports based on 
        let ret = "";
        if (selectString === "Modular") {
            ret += "import { ProxyBase, EntitySet} from './odataproxybase';\n";
            ret += "import * as odatajs from './odatajs';\n\n"
        }
        else
            ret += "import ProxyBase = odatatools.ProxyBase;\nimport EntitySet = odatatools.EntitySet;\n\n";
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
            ret += "this." + set.$.Name + " = new EntitySet<" + set.$.EntityType + ">(\"" + set.$.Name + "\", address, \"" + keys.get(set.$.EntityType) + "\", additionalHeaders);\n";
        }
        ret += "}\n"
        for (let set of ec.EntitySet) {
            ret += set.$.Name + ": EntitySet<" + set.$.EntityType + ">;\n";
        }
        ret += methodhook + "\n"
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

function _getParameters(parameters: Parameter[]): string {
    let ret = "";
    if (!parameters)
        return "";
    for (let param of parameters) {
        ret += param.$.Name + ": " + param.$.Type + ", "
    }
    // return list without last ", "
    return ret.substr(0, ret.length - 2);
}

function _getReturnType(returntype: ReturnType[]): string {
    if (!returntype)
        return "void"
    return returntype[0].$.Type;
}

function _getParameterJSON(parameters: Parameter[]): string {
    let ret = "{\n"
    for (let param of parameters) {
        ret += param.$.Name + ": " + param.$.Name + ",\n";
    }
    ret = ret.substr(0, ret.length - 2) + "\n";
    return ret + "}";
}

function createMethod(method: Method, requesttype: GetOrPost, key?: string): string {
    // TODO: get key type
    let ret = method.$.Name + "(" + (method.$.IsBound ? (method.IsBoundToCollection ? "" : "key: " + key + (method.Parameter.length > 0 ? ", " : "")) : "") + _getParameters(method.Parameter) + "): " + "Promise" + "<" + _getReturnType(method.ReturnType) + ">{\n";
    ret += "return new Promise<" + _getReturnType(method.ReturnType) + ">((resolve, reject) => {\n";

    ret += "let request: odatajs.Request = {\n";
    ret += "headers: this.Headers,\n";
    ret += "method: \"" + requesttype + "\",\n";
    ret += _getRequestUri(method)
    if (method.Type === "Action" && method.Parameter && method.Parameter.length > 0)
        ret += "data: " + _getParameterJSON(method.Parameter) + "\n";
    ret += "}\n";
    ret += "odatajs.oData.request(request, (data, response) => {\n";
    ret += "resolve(" + (method.ReturnType ? "data.value" : "") + ");\n";
    ret += "}, (error) => {\n";
    ret += "console.error(error.name + \" \" + error.message + \" | \" + (error.response | error.response.statusText) + \":\" + (error.response | error.response.body));\n";
    ret += "reject(error);\n";
    ret += "});\n";
    ret += "});\n";
    ret += "}\n";
    return ret;
}

function _getRequestUri(method: Method): string {
    let uri = "requestUri: this.Address  + \""
    if (method.Type === "Function") {
        uri += (method.$.IsBound ? (method.IsBoundToCollection ? "" : "(\"+key+\")") : "") + "/" + (method.$.IsBound ? method.Namespace + "." : "") + method.$.Name + _getRequestParameters(method.Parameter) + "\",\n";
    } else
        uri += (method.$.IsBound ? (method.IsBoundToCollection ? "" : "(\"+key+\")") : "") + "/" + (method.$.IsBound ? method.Namespace + "." : "") + method.$.Name + "\",\n";
    return uri;
}

function _getRequestParameters(parameters: Parameter[]) {
    if (!parameters)
        return "";
    let ret = "("
    for (let param of parameters) {
        ret += param.$.Name + "=\" + " + param.$.Name + " + \", ";
    }
    ret = ret.substr(0, ret.length - 2);
    return ret + ")";
}