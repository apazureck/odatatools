import * as vscode from 'vscode';

export type UsageVersion = "0.4" | "1.0" | "2.0";
export class Settings {
    static get IsInInsiderMode(): boolean {
        return vscode.workspace.getConfiguration("odatatools").get("insiders", false);
    }

    static get UsageVersion(): UsageVersion {
        return vscode.workspace.getConfiguration("odatatools").get("version", "2.0");
    }

    static get recentlyUsedLength(): number {
        return vscode.workspace.getConfiguration("odatatools").get("recentlyUsedLength", 5);
    }
}