import { generateProxy } from './proxyGenerator';
import { Global, log } from '../extension';
import { TemplateGeneratorSettings, getModifiedTemplates, getMetadata, createHeader, getGeneratorSettingsFromDocumentText, NoHeaderError } from '../helper';
import { window, Range, commands } from 'vscode';
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