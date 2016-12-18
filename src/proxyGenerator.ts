import { Client } from 'node-rest-client';
import { window, TextEdit, Range, commands} from 'vscode';
import { log } from './extension';

declare var lastval;

export async function createProxy() {
    let input = await window.showInputBox({
        placeHolder: "http://my.odata.service/service.svc",
        value: lastval,
        prompt: "Please enter uri of your oData service."
    });

    if(!input)
        return;

    input = input.replace("$metadata", "");
    if(input.endsWith("/"))
        input = input.substr(0, input.length-1);

    input = input + "/$metadata";

    lastval = input;
}

async function getProxy(input: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
    });
}