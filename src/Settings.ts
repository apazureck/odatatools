import * as vscode from 'vscode';

export type UsageVersion = "0.4" | "1.0";
export class Settings {
    static get IsInInsiderMode(): boolean {
        return vscode.workspace.getConfiguration("odatatools").get("insiders", false);
    }

    static get UsageVersion(): UsageVersion {
        return vscode.workspace.getConfiguration("odatatools").get("version", "1.0");
    }
}