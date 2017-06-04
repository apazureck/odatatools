import * as vscode from 'vscode';

export type UsageVersion = "0.5.0+" | "0.4.0-";
export class Settings {
    get IsInInsiderMode(): boolean {
        return vscode.workspace.getConfiguration("odatatools").get("insiders", false);
    }

    get UsageVersion(): UsageVersion {
        return vscode.workspace.getConfiguration("odatatools").get("version", "0.5.0+");
    }
}