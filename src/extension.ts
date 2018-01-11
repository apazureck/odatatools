'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as v040Crawler from './v040/odataCrawler';
import * as v040ProxyGenerator from './v040/proxyGenerator';
import * as v100Crawler from './v100/odataCrawler';
import * as v100ProxyGenerator from './v100/proxyGenerator';
import * as v200ProxyGenerator from './v200/v200commands';
import { Settings } from './settings';
import * as fs from 'fs';
import * as path from 'path';
import * as mkd from 'mkdirp';
import { Log, LogLevel } from './log';

const logger = vscode.window.createOutputChannel("oData Tools");
logger.show();

Log.activate((message: string, logLevel: LogLevel) => {
    logger.appendLine(message);
    switch (logLevel) {
        case LogLevel.Trace:
        case LogLevel.Debug:
            console.log(message);
            break;
        case LogLevel.Info:
            console.info(message);
            break;
        case LogLevel.Warning:
            console.warn(message);
            break;
        case LogLevel.Error:
        case LogLevel.Fatal:
            console.error(message);
            break;
        default:
            break;
    }
});

const log = new Log("extension");

if (!('toJSON' in Error.prototype))
    Object.defineProperty(Error.prototype, 'toJSON', {
        value: function () {
            var alt = {};

            Object.getOwnPropertyNames(this).forEach(function (key) {
                alt[key] = this[key];
            }, this);

            return alt;
        },
        configurable: true,
        writable: true
    });


export class Global {
    static lastval: string = null;
    static context: vscode.ExtensionContext = null;
    private static readonly recentlyUsedJsonPath = path.join(vscode.workspace.rootPath, ".vscode", "odatatools", "recentlyused.json");
    /**
     * Gets recently used address from project folder ${workspaceRoot}/.vscode/odatatools/recentlyused.json
     * 
     * @readonly
     * @static
     * @type {string[]}
     * @memberof Global
     */
    static get recentlyUsedAddresses(): string[] {
        log.TraceEnterFunction();
        if (fs.existsSync(this.recentlyUsedJsonPath))
            return (JSON.parse(fs.readFileSync(this.recentlyUsedJsonPath, 'utf-8')) as string[]).reverse();
        else
            return [];
    }

    static AddToRecentlyUsedAddresses(address: string) {
        log.TraceEnterFunction();
        // Check if recently used json exists and create if not
        if(!fs.existsSync(this.recentlyUsedJsonPath)) {
            mkd.sync(path.dirname(this.recentlyUsedJsonPath));
            fs.writeFileSync(this.recentlyUsedJsonPath, "[]");
        }

        // Read recently used json file
        let recentlyused = JSON.parse(fs.readFileSync(this.recentlyUsedJsonPath, 'utf-8')) as string[];

        // Check if already in list and push it to the top.
        const foundelement = recentlyused.indexOf(address);
        if (foundelement > 0) {
            recentlyused.splice(foundelement, 1);
            recentlyused.push(address);
            // Else check if max number is exceeded
        } else if (recentlyused.length > Settings.recentlyUsedLength) {
            recentlyused.splice(0, 1);
            recentlyused.push(address);
        } else {
            recentlyused.push(address);
        }

        fs.writeFile(path.join(Global.context.extensionPath, "recentlyused.json"), JSON.stringify(recentlyused), (error) => {
            log.Error(() => ("An error occurred writing recently used file: " + JSON.stringify(error)));
        });
    }
}

export var lastval: string = null;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    log.TraceEnterFunction();
    Global.context = context;
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    log.Info('Extension "odatatools" is now active!');

    vscode.workspace.onDidChangeConfiguration(onDidChangeConfiguration);
    onDidChangeConfiguration();
}

// this method is called when your extension is deactivated
export function deactivate() {
    log.TraceEnterFunction();
}

function onDidChangeConfiguration() {
    log.TraceEnterFunction();
    log.Info("Using Extension Version: " + Settings.UsageVersion);
    log.Info("Insider mode active: " + (Settings.IsInInsiderMode ? "Yes" : "No"));
    switch (Settings.UsageVersion) {
        case "0.4":
            try {
                registerV40Commands();
            } catch (error) {
                for (const cmd of Global.context.subscriptions)
                    cmd.dispose();
                Global.context.subscriptions = [];
                registerV40Commands();
            }
            break;
        case "1.0":
            try {
                registerV100Commands();
            } catch (error) {
                for (const cmd of Global.context.subscriptions)
                    cmd.dispose();
                Global.context.subscriptions = [];
                registerV100Commands();
            }
            break;
        case "2.0":
            try {
                registerV200Commands();
            } catch (error) {
                for (const cmd of Global.context.subscriptions)
                    cmd.dispose();
                Global.context.subscriptions = [];
                registerV200Commands();
            }
            break;
        default:
            vscode.window.showErrorMessage("Could not determine version " + Settings.UsageVersion + ". Please use valid version entries");
            break;
    }
}

function registerV40Commands(): void {
    log.TraceEnterFunction();
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetInterfaces', v040Crawler.getInterfaces));
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.UpdateInterfaces', v040Crawler.updateInterfaces));
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetProxy', v040ProxyGenerator.createProxy));
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.UpdateProxy', () => vscode.window.showErrorMessage("Update proxy is not available for V0.4 legacy support")));
}

function registerV100Commands(): void {
    log.TraceEnterFunction();
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetInterfaces', v100Crawler.getInterfaces));
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.UpdateInterfaces', v100Crawler.updateInterfaces));
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetProxy', v100ProxyGenerator.createProxy));
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.UpdateProxy', v100ProxyGenerator.updateProxy));
}
function registerV200Commands(): void {
    log.TraceEnterFunction();
    if (!Settings.IsInInsiderMode) {
        vscode.window.showErrorMessage("Version 2.0 using templates is still in a beta phase. Please activate the insider mode in your settings.\nUse it at own risk. Features may greatly change in the future and your template might not work anymore!");
        return;
    }
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetInterfaces', () => vscode.window.showErrorMessage("Get Interfaces is deprecated. Use Get Proxy instead.")));
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.UpdateInterfaces', () => vscode.window.showErrorMessage("Update Interfaces is deprecated. Use Update Proxy instead.")));
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetProxy', v200ProxyGenerator.createProxy));
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.UpdateProxy', v200ProxyGenerator.updateProxy));
}