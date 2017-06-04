'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as v040Crawler from './v040/odataCrawler';
import * as v040ProxyGenerator from './v040/proxyGenerator';
import * as v100Crawler from './v100/odataCrawler';
import * as v100ProxyGenerator from './v100/proxyGenerator';
import { Settings } from './settings'

export class Global {
    static lastval: string = null;
    static context: vscode.ExtensionContext = null;
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
            Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetInterfaces', v040Crawler.getInterfaces));
            Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.UpdateInterfaces', v040Crawler.updateInterfaces));
            Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetProxy', v040ProxyGenerator.createProxy));
        } catch (error) {
            for (const cmd of Global.context.subscriptions)
                cmd.dispose();
            Global.context.subscriptions = [];
            Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetInterfaces', v040Crawler.getInterfaces));
            Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.UpdateInterfaces', v040Crawler.updateInterfaces));
            Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetProxy', v040ProxyGenerator.createProxy));
        }
    } else {
        try {
            Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetInterfaces', v100Crawler.getInterfaces));
            Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.UpdateInterfaces', v100Crawler.updateInterfaces));
            Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetProxy', v100ProxyGenerator.createProxy));
        } catch (error) {
            for (const cmd of Global.context.subscriptions)
                cmd.dispose();
            Global.context.subscriptions = [];
            Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetInterfaces', v100Crawler.getInterfaces));
            Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.UpdateInterfaces', v100Crawler.updateInterfaces));
            Global.context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetProxy', v100ProxyGenerator.createProxy));
        }
    }
}