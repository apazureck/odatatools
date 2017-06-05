export class oData {
        static request(request: Request, success?: (data: any, response: any) => void, error?: (error: any) => void, handler?, httpClient?, metadata?);
    }

export interface Request {
        requestUri: string,
        method: string,
        headers: Header | Header[],
        data?: any
    }

export interface Header { [name: string]: string }
