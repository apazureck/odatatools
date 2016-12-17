'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getInterfaces, updateInterfaces } from './odataCrawler';
export var log: vscode.OutputChannel;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Extension "odatatools" is now active!');
    log = vscode.window.createOutputChannel("oData Tools");
    log.show();

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    context.subscriptions.push(vscode.commands.registerCommand('odatatools.GetInterfaces', getInterfaces));
    context.subscriptions.push(vscode.commands.registerCommand('odatatools.UpdateInterfaces', updateInterfaces));
    
}

// this method is called when your extension is deactivated
export function deactivate() {
}