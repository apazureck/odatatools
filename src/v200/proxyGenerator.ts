import { getEdmTypes } from './odataCrawler';
import * as hb from 'handlebars';
import {
    IAction,
    IActionImport,
    IComplexType,
    IEntityContainer,
    IEntitySet,
    IEntityType,
    IEnum,
    IEnumType,
    IFunction,
    IFunctionImport,
    IMethod,
    INavigationProperty,
    INavigationPropertyBinding,
    IODataEntities,
    IODataSchema,
    IParameter,
} from './outtypes';
import { window, TextEdit, Range, commands, ExtensionContext } from 'vscode';
import { log, Global } from '../extension';
import * as enumerable from 'linq-es2015';
import { Enumerable } from "linq-es2015";
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request';
import * as xml2js from 'xml2js';
import { } from './outtypes';
import {
    createHeader,
    GeneratorSettings,
    getEntityTypeInterface,
    getGeneratorSettingsFromDocumentText,
    getMetadata,
    getModifiedTemplates,
    GetOutputStyleFromUser,
    getType,
    Modularity,
    NoHeaderError,
    TemplateGeneratorSettings,
} from '../helper';

const methodhook = "//${unboundMethods}"

hb.logger.log = (level, obj) => {
    log.appendLine("# " + obj);
}

export async function createProxy() {
    let generatorSettings: TemplateGeneratorSettings = {
        modularity: "Ambient",
        requestOptions: {},
        source: "unknown",
        useTemplate: undefined
    };
    try {
        // TODO: Change to quickpick to provide full file list
        let maddr = await window.showInputBox({
            placeHolder: "http://my.odata.service/service.svc",
            value: Global.recentlyUsedAddresses.pop(),
            prompt: "Please enter uri of your oData service.",
            ignoreFocusOut: true,
        });

        if (!maddr)
            return;

        maddr = maddr.replace("$metadata", "");
        if (maddr.endsWith("/"))
            maddr = maddr.substr(0, maddr.length - 1);

        maddr = maddr + "/$metadata";

        Global.lastval = maddr;
        generatorSettings.source = maddr;

        const templates: { [key: string]: string } = getModifiedTemplates();

        log.appendLine("Getting Metadata from '" + maddr + "'");
        const metadata = await getMetadata(maddr);

        // generatorSettings.modularity = await GetOutputStyleFromUser();

        await generateProxy(metadata, generatorSettings, templates);

    } catch (error) {
        window.showErrorMessage("Could not create proxy. See output window for detail.");
        log.appendLine("Creating proxy returned following error:");
        if (error.originalStack)
            log.appendLine(error.originalStack);
        else
            log.appendLine(error.toString());

        log.appendLine("Updating current file.");
        await window.activeTextEditor.edit((editbuilder) => {
            editbuilder.replace(new Range(0, 0, window.activeTextEditor.document.lineCount - 1, window.activeTextEditor.document.lineAt(window.activeTextEditor.document.lineCount - 1).text.length), createHeader(generatorSettings));
        });

        log.appendLine("Successfully pasted data. Formatting Document.")
        commands.executeCommand("editor.action.formatDocument").then(() => log.appendLine("Finished"));
    }
}

async function generateProxy(metadata: Edmx, options: TemplateGeneratorSettings, templates: { [key: string]: string }) {
    // window.showInformationMessage("Select import type (ambient or modular) for generation.");

    let schemas = getProxy(options.source.replace("$metadata", ""), metadata["edmx:DataServices"][0], options);
    const proxystring = parseTemplate(options, schemas, templates);

    // proxystring = await addActionsAndFunctions(proxystring, metadata["edmx:DataServices"][0]);
    // let proxystring = surroundWithNamespace(metadata["edmx:DataServices"][0], options, proxystring);

    log.appendLine("Updating current file.");
    await window.activeTextEditor.edit((editbuilder) => {
        editbuilder.replace(new Range(0, 0, window.activeTextEditor.document.lineCount - 1, window.activeTextEditor.document.lineAt(window.activeTextEditor.document.lineCount - 1).text.length), proxystring);
    });

    log.appendLine("Successfully pasted data. Formatting Document.")
    commands.executeCommand("editor.action.formatDocument").then(() => log.appendLine("Finished"));

    // log.appendLine("Copying Proxy Base module");
    // if (options.modularity === "Ambient") {
    //     fs.createReadStream(path.join(Global.context.extensionPath, "dist", "odatajs-4.0.0.js")).pipe(fs.createWriteStream(path.join(path.dirname(window.activeTextEditor.document.fileName), "odatajs.js")));
    //     fs.createReadStream(path.join(Global.context.extensionPath, "dist", "odataproxybaseAsync.ts")).pipe(fs.createWriteStream(path.join(path.dirname(window.activeTextEditor.document.fileName), "odataproxybase.ts")));
    // }

    // else {
    //     fs.createReadStream(path.join(Global.context.extensionPath, "dist", "odataproxybaseAsyncModular.ts")).pipe(fs.createWriteStream(path.join(path.dirname(window.activeTextEditor.document.fileName), "odataproxybase.ts")));
    //     fs.createReadStream(path.join(Global.context.extensionPath, "dist", "odatajs.d.ts")).pipe(fs.createWriteStream(path.join(path.dirname(window.activeTextEditor.document.fileName), "odatajs.d.ts")));
    // }
    Global.AddToRecentlyUsedAddresses(options.source);
}

export async function updateProxy() {
    let header: TemplateGeneratorSettings;
    try {
        header = getGeneratorSettingsFromDocumentText(window.activeTextEditor.document.getText());

        if (!header)
            return window.showErrorMessage("Could not find valid odatatools header to generate proxy from. Use 'Create Proxy' command instead.");

        if (!header.source)
            return window.showErrorMessage("No source property in odatatools header. Use 'Create Proxy' command instead.");

        log.appendLine("Getting Metadata from '" + header.source + "'");
        const metadata = await getMetadata(header.source, header.requestOptions);

        generateProxy(metadata, header, getModifiedTemplates());

    } catch (error) {
        window.showErrorMessage("Could not create proxy. See output window for detail.");
        log.appendLine("Creating proxy returned following error:");
        if (error.originalStack)
            log.appendLine(error.originalStack);
        else
            log.appendLine(error.toString());

        log.appendLine("Updating current file.");
        await window.activeTextEditor.edit((editbuilder) => {
            editbuilder.replace(new Range(0, 0, window.activeTextEditor.document.lineCount - 1, window.activeTextEditor.document.lineAt(window.activeTextEditor.document.lineCount - 1).text.length), createHeader(error instanceof NoHeaderError ? {
                source: "unknown", modularity: "Ambient", requestOptions: {}
            } : header));
        });

        log.appendLine("Created header");
        commands.executeCommand("editor.action.formatDocument").then(() => log.appendLine("Finished"));
    }
}

function getUnboundActionsAndFunctions(ecschema: Schema): Method[] {
    let all: Method[] = [];
    if (ecschema.Action) {
        log.appendLine("Found " + ecschema.Action.length + " OData Actions");
        let acts = ecschema.Action.filter(x => !x.$.IsBound);
        for (let a of acts) {
            a.Type = "Function";
            all.push(a);
        }
    }
    if (ecschema.Function) {
        log.appendLine("Found " + ecschema.Function.length + " OData Functions");
        let fcts = ecschema.Function.filter(x => !x.$.IsBound);
        for (let f of fcts) {
            f.Type = "Function";
            all.push(f);
        }
    }

    return all;
}

function getSet(bindingParameter: Parameter, metadata: IODataSchema): IEntitySet {
    let type: string;
    let colmatch = bindingParameter.$.Type.match(/Collection\((.*)\)/);
    if (colmatch) {
        type = colmatch[1];
    } else {
        type = bindingParameter.$.Type;
    }
    return metadata.EntityContainer.EntitySets.find(x => x.EntityType.Fullname === bindingParameter.$.Name);
}

interface ITypeStorage {
    complex: IComplexType[];
    entity: IEntityType[];
    enums: IEnum[];
    actions: IMethod[];
    functions: IMethod[];
}

function getProxy(uri: string, metadata: DataService, options: TemplateGeneratorSettings): IODataSchema[] {
    // get the entity container
    let schemas: Schema[];
    try {
        schemas = metadata.Schema;
    } catch (error) {
        throw new Error("Could not find any entity container on OData Service");
    }

    // Get all types, actions and functions. Get all first in allBaseTypes to process later, as some types can be dependent on schemas later in the odata service.
    const allBaseTypes: ITypeStorage = {
        actions: [],
        complex: [],
        entity: [],
        enums: [],
        functions: [],
    }

    const allschemas: IODataSchema[] = [];
    const typesOfSchema: { [x: string]: IODataEntities } = {};

    for (const schema of schemas) {
        const types = getEdmTypes(schema, options);
        allBaseTypes.complex = allBaseTypes.complex.concat(types.ComplexTypes);
        allBaseTypes.entity = allBaseTypes.entity.concat(types.EntityTypes);
        allBaseTypes.enums = allBaseTypes.enums.concat(types.EnumTypes);
        if (schema.Action) {
            allBaseTypes.actions = allBaseTypes.actions.concat(schema.Action.map<IAction>(x => {
                return {
                    Name: x.$.Name,
                    FullName: schema.$.Namespace + "." + x.$.Name,
                    IsBound: x.$.IsBound || false,
                    IsBoundToCollection: x.$.IsBound && x.Parameter[0].$.Type.startsWith("Collection("),
                    Parameters: getParameters(x.Parameter),
                    ReturnType: _getReturnType(x.ReturnType),
                };
            }));
        }
        if (schema.Function) {
            allBaseTypes.functions = allBaseTypes.functions.concat(schema.Function.map<IFunction>(x => {
                return {
                    Name: x.$.Name,
                    FullName: schema.$.Namespace + "." + x.$.Name,
                    IsBound: x.$.IsBound || false,
                    IsBoundToCollection: x.$.IsBound && x.Parameter[0].$.Type.startsWith("Collection("),
                    Parameters: getParameters(x.Parameter),
                    ReturnType: _getReturnType(x.ReturnType),
                }
            }))
        }
        typesOfSchema[schema.$.Namespace] = types;
    }

    // Get all Bound Actions and Functions. This has to be done seperately, as first of all all types and functions/actions must exist
    for (const action of allBaseTypes.actions) {
        if (!action.IsBound || action.IsBoundToCollection) {
            continue;
        }
        // Get corresponding entity type to which the action is bound to
        const et = allBaseTypes.entity.find(x => x.Fullname === action.Parameters[0].Type);
        if (et) {
            et.Actions.push(action);
        }
    }

    for (const func of allBaseTypes.functions) {
        if (!func.IsBound || func.IsBoundToCollection) {
            continue;
        }
        // Get corresponding entity type to which the action is bound to
        const et = allBaseTypes.entity.find(x => x.Fullname === func.Parameters[0].Type);
        if (et) {
            et.Functions.push(func);
        }
    }

    for (const schema of schemas) {
        const types = typesOfSchema[schema.$.Namespace];
        const curSchema: IODataSchema = {
            Namespace: schema.$.Namespace,

            Header: "",
            ComplexTypes: types.ComplexTypes,
            EntityTypes: types.EntityTypes,
            EnumTypes: types.EnumTypes,
            Functions: [],
            Actions: [],
        }
        if (schema.EntityContainer) {
            const ec = schema.EntityContainer[0];
            curSchema.EntityContainer = {
                Namespace: schema.$.Namespace,
                Name: ec.$.Name,
                EntitySets: [],
                Singletons: [],
                FunctionImports: [],
                ActionImports: [],
                FullName: schema.$.Namespace + "." + ec.$.Name,
            }

            for (const set of ec.EntitySet) {
                const eset: IEntitySet = {
                    EntityType: allBaseTypes.entity.find(x => {
                        return x.Fullname === set.$.EntityType;
                    }),
                    Namespace: curSchema.Namespace,
                    FullName: curSchema.Namespace + "." + set.$.Name,
                    Name: set.$.Name,
                    NavigationPropertyBindings: set.NavigationPropertyBinding ? set.NavigationPropertyBinding.map<INavigationPropertyBinding>((x) => {
                        return {
                            Path: x.$.Path,
                            Target: x.$.Target,
                        }
                    }) : [],
                    Actions: [],
                    Functions: [],
                }
                eset.Actions = getBoundActionsToCollections(eset, allBaseTypes);
                eset.Functions = getBoundFunctionsToCollections(eset, allBaseTypes);
                curSchema.EntityContainer.EntitySets.push(eset);
            }
            // getBoundMethodsToEntities(curSchema, allBaseTypes);
            getUnboundMethods(curSchema, schema);
        }
        allschemas.push(curSchema);
    }
    return allschemas;
}

function getMethods(schema: Schema, allTypes: ITypeStorage): IMethod[] {
    const ret: IMethod[] = [];
    for (const m of schema.Function.concat(schema.Action)) {
        ret.push(getMethod(m, allTypes))
    }
    return ret;
}

function getMethod(method: Method, allTypes: ITypeStorage): IMethod {
    if (method.IsBoundToCollection) {
        return getBoundMethod(method, allTypes.entity.filter(x => x.Fullname === method.$.Name)[0]);
    }
}

function getUnboundMethods(meta: IODataSchema, schema: Schema): void {
    const ec = schema.EntityContainer[0];
    if (ec.FunctionImport) {
        for (const fi of ec.FunctionImport) {
            const funcImport: IFunctionImport = {
                EntitySet: meta.EntityContainer.EntitySets.find(x => x.Name === fi.$.EntitySet),
                Function: getUnboundMethod(schema.Function.find(x => schema.$.Namespace + "." + x.$.Name === fi.$.Function)),
                IncludeInServiceDocument: fi.$.IncludeInServiceDocument,
                Name: fi.$.Name,
            }
            meta.EntityContainer.FunctionImports.push(funcImport);
        }
    }
    if (ec.ActionImport) {
        for (const ai of ec.ActionImport) {
            const actionImport: IActionImport = {
                EntitySet: meta.EntityContainer.EntitySets.find(x => x.Name === ai.$.EntitySet),
                Action: getUnboundMethod(schema.Action.find(x => schema.$.Namespace + "." + x.$.Name === ai.$.Action)),
                Name: ai.$.Name,
            }
            meta.EntityContainer.ActionImports.push(actionImport);
        }
    }
}

function getBoundMethodsToEntities(meta: IODataSchema, schema: Schema): void {
    if (schema.Action) {
        for (const action of schema.Action) {
            for (const type of meta.EntityTypes) {
                const m = getBoundMethod(action, type);
                if (m && !m.IsBoundToCollection) {
                    type.Actions.push(m);
                }
            }
        }
    }
    if (schema.Function) {
        for (const func of schema.Function) {
            for (const type of meta.EntityTypes) {
                const m = getBoundMethod(func, type);
                if (m && !m.IsBoundToCollection) {
                    type.Functions.push(m);
                }
            }
        }
    }
}

function getBoundActionsToCollections(set: IEntitySet, schema: ITypeStorage): IMethod[] {
    const ret: IMethod[] = [];
    for (const action of schema.actions) {
        if (action.IsBoundToCollection) {
            const boundTypeName = action.Parameters[0].Type.match(/^Collection\((.*)\)$/)[1];
            if (set.EntityType.Fullname === boundTypeName) {
                ret.push(action);
            }
        }
    }
    return ret;
}

function getBoundFunctionsToCollections(set: IEntitySet, schema: ITypeStorage): IMethod[] {
    const ret: IMethod[] = [];
    for (const func of schema.functions) {
        if (func.IsBoundToCollection) {
            const boundTypeName = func.Parameters[0].Type.match(/^Collection\((.*)\)$/)[1];
            if (set.EntityType.Fullname === boundTypeName) {
                ret.push(func);
            }
        }
    }
    return ret;
}

function getUnboundMethod(method: Method): IMethod {
    if (!method) {
        return undefined;
    }
    if (method.$.IsBound) {
        return undefined;
    }
    return {
        IsBoundToCollection: method.$.IsBound && method.Parameter[0].$.Name.startsWith("Collection("),
        FullName: method.Namespace,
        IsBound: method.$.IsBound,
        Name: method.$.Name,
        ReturnType: method.ReturnType ? method.ReturnType[0].$.Type : "void",
        Parameters: getParameters(method.Parameter),
    }
}

function getBoundMethod(method: Method, type: IEntityType): IMethod {
    // check if method is bound
    if (!method.$.IsBound) {
        return undefined;
    }
    // check if parameters array exists
    if (!method.Parameter) {
        return undefined;
    }
    // get first parameter, which is the binding parameter and check if it is a collection
    const collectionMatch = method.Parameter[0].$.Type.match(/^(Collection\()?(.*)\)?$/);
    if (collectionMatch[2] === type.Fullname) {
        // map to get copy of array
        const params = method.Parameter.map(x => x);
        params.splice(0, 1);
        const outaction: IMethod = {
            IsBoundToCollection: collectionMatch[1] === "Collection(",
            IsBound: method.$.IsBound || false,
            Name: method.$.Name,
            FullName: type.Namespace + method.$.Name,
            ReturnType: method.ReturnType ? getType(method.ReturnType[0].$.Type) : "void",
            Parameters: getParameters(params),
        }
        return outaction;
    }
}

function getParameters(params: Parameter[]): IParameter[] {
    const ret: IParameter[] = [];
    if (!params)
        return [];
    for (const param of params) {
        ret.push({
            Name: param.$.Name,
            Nullable: param.$.Nullable,
            Unicode: param.$.Unicode,
            Type: param.$.Type,
            MaxLength: param.$.MaxLength,
            Precision: param.$.Precision,
            Scale: param.$.Scale,
            SRID: param.$.SRID,
        })
    }
    return ret;
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

function parseTemplate(generatorSettings: TemplateGeneratorSettings, schemas: IODataSchema[], templates: { [key: string]: string }): string {
    if (!generatorSettings.useTemplate) {
        generatorSettings.useTemplate = Object.keys(templates)[1];
    }

    const proxy = {
        schemas,
        Header: createHeader(generatorSettings),
    }

    log.appendLine("Produced Data:");
    try {
        log.appendLine(JSON.stringify(proxy, null, 2));
    } catch(error) {
        
    }

    const template = hb.compile(templates[generatorSettings.useTemplate], {
        noEscape: true
    });

    try {
        return template(proxy);
    } catch (error) {
        log.append("Parsing your Template caused an error: ");
        log.appendLine(error.message);
        throw error;
    }
}