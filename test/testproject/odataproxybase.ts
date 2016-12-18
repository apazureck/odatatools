namespace odatajs.proxy {
    enum Method {
        GET, POST, PUT, PATCH, DELETE
    }

    export class ProxyBase {
        constructor(name: string, address: string) {
            this.Name = name;
            this.Address = address;
        }
        readonly Name: string;
        readonly Address: string;
    }

    /**
     * A generic entity set which represents the content of the entity container.
     * @class EntitySet
     * @template T
     */
    export class EntitySet<T> {
        constructor(name: string, address: string) {
            this.Name = name;
            this.Address = address + address.endsWith("/") ? "": "/" + name;
        }

        readonly Name: string;
        readonly Address: string;

        /**
         * Gets the entities from the oData service. Expand gets the navigation properties.
         * 
         * @param {string} [parameters] It is attached to the request as `http://your.uri.com/EntitySet?<parameters>`. For complex expands use the odata syntax. For example: `Prop1($expand=SubProp1,SubProp2),Prop2(...)` or `$select=Prop1,Prop2,Prop3&$expand=Prop2`
         * @returns {Promise<T[]>}
         * 
         * @memberOf EntitySet
         */
        async Get(parameters?: string): Promise<T[]> {
            return new Promise<T[]> ((resolve, reject) => {
                let headers = { "Content-Type": "application/json", Accept: "application/json" };
                let request: odatajs.Request = {
                    headers: headers,
                    method: Method[Method.GET],
                    requestUri: this.Address + parameters ? "?" + parameters : ""
                }
                odatajs.oData.request(request, (data, response) => {
                    resolve(data as T[]);
                }, (error) => {
                    reject(error);
                })
            });
        }

        async Put(value: T): Promise<T> {
            return new Promise<T> ((resolve, reject) => {
                let headers = { "Content-Type": "application/json", Accept: "application/json" };
                let request: odatajs.Request = {
                    headers: headers,
                    method: Method[Method.PUT],
                    requestUri: this.Address
                }
                odatajs.oData.request(request, (data, response) => {
                    resolve(data as T);
                }, (error) => {
                    reject(error);
                })
            });
        }

        async Post(value: T): Promise<T> {
            return new Promise<T> ((resolve, reject) => {
                let headers = { "Content-Type": "application/json", Accept: "application/json" };
                let request: odatajs.Request = {
                    headers: headers,
                    method: Method[Method.PUT],
                    requestUri: this.Address
                }
                odatajs.oData.request(request, (data, response) => {
                    resolve(data as T);
                }, (error) => {
                    reject(error);
                })
            });
        }

        async Delete(value: T): Promise<T> {
            return new Promise<T> ((resolve, reject) => {
                let headers = { "Content-Type": "application/json", Accept: "application/json" };
                let request: odatajs.Request = {
                    headers: headers,
                    method: Method[Method.PUT],
                    requestUri: this.Address
                }
                odatajs.oData.request(request, (data, response) => {
                    resolve(data as T);
                }, (error) => {
                    reject(error);
                })
            });
        }
    }

    class EntityContainer {
        constructor(name: string, uri: string) {
            this.Name = name;
            this.Uri = uri;
        }
        readonly Name: string;
        readonly Uri: string;
    }
}

export = odatajs.proxy;

declare namespace odatajs {
    class oData {
        static request(request: Request, success?: (data: any, response: any) => void, error?: (error: any) => void, handler?, httpClient?, metadata?);
    }

    interface Request {
        requestUri: string,
        method: string,
        headers: Header | Header[],
        data?: any
    }

    interface Header { "Content-Type": string; Accept: string }
}