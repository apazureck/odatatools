namespace odatajs.proxy {
    enum Method {
        GET, POST, PUT, PATCH, DELETE
    }

    /**
     * A generic entity set which represents the content of the entity container.
     * @class EntitySet
     * @template T
     */
    class EntitySet<T> {
        constructor(name: string, address: string) {
            this.Name = name;
            this.Address = address;
        }
        readonly Name: string;
        readonly Address: string;

        /**
         * Gets the entities from the oData service. Expand gets the navigation properties.
         * 
         * @param {string} [expands] It is attached to the request as ?$expand=<yourValues>. For complex expands use the odata syntax. For example: Prop1($expand=SubProp1,SubProp2),Prop2(...)
         * @returns {Promise<T[]>}
         * 
         * @memberOf EntitySet
         */
        async Get(expands?: string): Promise<T[]> {
            return new Promise<T[]> ((resolve, reject) => {
                let headers = { "Content-Type": "application/json", Accept: "application/json" };
                let request: odatajs.Request = {
                    headers: headers,
                    method: Method[Method.GET],
                    requestUri: this.Address + expands ? "?$expand=" + expands : ""
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