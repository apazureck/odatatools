'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as v040Crawler from './v040/odataCrawler';
import * as v040ProxyGenerator from './v040/proxyGenerator';
import * as v100Crawler from './v100/odataCrawler';
import * as v100ProxyGenerator from './v100/proxyGenerator';
import { Settings } from './settings';
import * as fs from 'fs';
import * as path from 'path';

export class Global {
    static lastval: string = null;
    static context: vscode.ExtensionContext = null;

    static get recentlyUsedAddresses(): string[] {
        return (JSON.parse(fs.readFileSync(path.join(Global.context.extensionPath, "recentlyused.json"), 'utf-8')) as string[]).reverse();
    }

    static AddToRecentlyUsedAddresses(address: string) {
        let recentlyused = JSON.parse(fs.readFileSync(path.join(Global.context.extensionPath, "recentlyused.json"), 'utf-8')) as string[];

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

        fs.writeFile(path.join(Global.context.extensionPath, "recentlyused.json"), JSON.stringify(recentlyused));
    }
}

export var log: vscode.OutputChannel;
export var lastval: string = null;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    Global.context = context;
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Extension "odatatools" is now active!');
    log = vscode.window.createOutputChannel("oData Tools");
    log.show();

    vscode.workspace.onDidChangeConfiguration(onDidChangeConfiguration);
    onDidChangeConfiguration();
}

// this method is called when your extension is deactivated
export function deactivate() {
}

function onDidChangeConfiguration() {
    log.appendLine("Using Extension Version: " + Settings.UsageVersion);
    log.appendLine("Insider mode active: " + Settings.IsInInsiderMode ? "Yes" : "No");
    if (Settings.UsageVersion === "0.4") {
        try {
            registerV40Commands();
        } catch (error) {
            for (const cmd of Global.context.subscriptions)
                cmd.dispose();
            Global.context.subscriptions = [];
            registerV40Commands();
        }
    } else {
        try {
            registerV100Commands();
        } catch (error) {
            for (const cmd of Global.context.subscriptions)
                cmd.dispose();
            Global.context.subscriptions = [];
            registerV100Commands();
        }
    }
}

function registerV40Commands(): void {
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetInterfaces', v040Crawler.getInterfaces));
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.UpdateInterfaces', v040Crawler.updateInterfaces));
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetProxy', v040ProxyGenerator.createProxy));
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.UpdateProxy', () => vscode.window.showErrorMessage("Update proxy is not available for V4.0 legacy support")));
}

function registerV100Commands(): void {
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetInterfaces', v100Crawler.getInterfaces));
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.UpdateInterfaces', v100Crawler.updateInterfaces));
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetProxy', v100ProxyGenerator.createProxy));
    Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.UpdateProxy', v100ProxyGenerator.updateProxy));
}