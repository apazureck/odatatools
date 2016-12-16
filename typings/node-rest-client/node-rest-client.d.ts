declare module 'node-rest-client' {
    class Client {
        get(uri: string, callback: (data: any, response: any) => any );
    }
}