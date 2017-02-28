namespace odatatools {
    enum Method {
        GET, POST, PUT, PATCH, DELETE
    }

    export class ProxyBase {
        constructor(public readonly Address: string, public readonly Name?: string, protected additonalHeaders?: odatajs.Header) {
            this.Name = this.Name || "ProxyService";
            this.additonalHeaders || {};
        }
    }

    /**
     * 
     * A generic entity set which represents the content of the entity container.
     * 
     * @export
     * @class EntitySet
     * @template T
     */
    export class EntitySet<T, deltaT> {
        
        /**
         * Creates an instance of EntitySet.
         * 
         * @param {string} name of the EntitySet (Will determine the address of the entityset, too -> address + "/" + name)
         * @param {string} address of the service
         * @param {string} key of the EntitySet
         * @param {odatajs.Header} [headers] additional headers: Per default there are "Content-Type" and "Accept".
         * 
         * @memberOf EntitySet
         */
        constructor(name: string, address: string, key: string, protected headers?: odatajs.Header) {
            this.Name = name;
            this.Address = address.replace(/\/$/, "") + "/" + name;
            this.Key = key;
            let h = { "Content-Type": "application/json", Accept: "application/json" };
            // Merge headers
            this.headers = this.headers || {};
            for (var attrname in h) { headers[attrname] = h[attrname]; };
        }

        /**
         * Name of the Entity Set (which is appended to the URI)
         * @memberOf EntitySet
         */
        readonly Name: string;
        /**
         * Address of the OData Service
         * @memberOf EntitySet
         */
        readonly Address: string;
        
        /**
         * Key of the entity
         * @memberOf EntitySet
         */
        readonly Key: string;

        /**
         * Gets the entities from the oData service. Expand gets the navigation properties.
         * 
         * @param {string} [parameters] It is attached to the request as `http://your.uri.com/EntitySet?<parameters>`. For complex expands use the odata syntax. For example: `Prop1($expand=SubProp1,SubProp2),Prop2(...)` or `$select=Prop1,Prop2,Prop3&$expand=Prop2`
         * @returns {Thenable<T[]>} for async Operation. Use `await` keyword to get value or `.then` callback.
         * 
         * @memberOf EntitySet
         */
        Get(parametersOrId?: string): Thenable<T|T[]>
        Get(id: string, parameters: string): Thenable<T>;
        Get(idOrParams?: string, parameters?: string): Thenable<T|T[]>
        {
            let requri: string;
            
            let paramsonly = idOrParams && idOrParams.match(/^\$/);
            if(!idOrParams) {
                requri = this.Address;
            } else if(paramsonly) {
                requri = this.Address + (idOrParams ? "?" + idOrParams : "");
            } else if(parameters) {
                requri = this.Address + "(" + idOrParams + ")" + "?" + parameters;
            } else {
                requri = this.Address + "(" + idOrParams + ")"
            }
            let request: odatajs.Request = {
                headers: this.headers,
                method: Method[Method.GET],
                requestUri: requri
            }
            // if id starts with $ it is additional odata parameters
            if(!paramsonly) {
                let callback = new ThenableCaller<T>();
                odatajs.oData.request(request, (data, response) => {
                    if(callback.then) {
                        callback.resolve(data);
                    }
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                    if(callback.catch) {
                        callback.reject(error);
                    }
                });
                return callback;
            } else {
                let callback = new ThenableCaller<T[]>();
                odatajs.oData.request(request, (data, response) => {
                    if(callback.then) {
                        callback.resolve(data);
                    }
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                    if(callback.catch) {
                        callback.reject(error);
                    }
                });
                return callback;
            }
        }

        
        /**
         * Replaces an existing value in the entity collection.
         * 
         * @param {T} value to replace
         * @returns {Thenable<T>} for async Operation. Use `await` keyword to get value or `.then` callback.
         * 
         * @memberOf EntitySet
         */
        Put(value: T): Thenable<void> {
            let callback = new ThenableCaller<void>();
            
            let request: odatajs.Request = {
                headers: this.headers,
                method: Method[Method.PUT],
                requestUri: this.Address  + "("+value[this.Key]+")",
                data: value
            }
            odatajs.oData.request(request, (data, response) => {
                callback.resolve();
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }

        /**
         * Adds a new entry to an EntitySet
         * 
         * @param {T} value to ad to the EntitySet
         * @returns {Thenable<T>} for async Operation. Use `await` keyword to get value or `.then` callback.
         * 
         * @memberOf EntitySet
         */
        Post(value: T): Thenable<T> {
            let callback = new ThenableCaller<T>();
            let request: odatajs.Request = {
                headers: this.headers,
                method: Method[Method.POST],
                requestUri: this.Address,
                data: value
            }
            odatajs.oData.request(request, (data, response) => {
                callback.resolve(data as T);
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }
        Patch(delta: deltaT): Thenable<void>
        Patch(oldvalue: T, newValue: T) : Thenable<void>
        Patch(oldvalordelta: T|deltaT, newval?: T): Thenable<void> {
            if(newval)
                oldvalordelta = this.getDelta(oldvalordelta as T, newval);

            let callback = new ThenableCaller<void>();
            let request: odatajs.Request = {
                headers: this.headers,
                method: Method[Method.PATCH],
                requestUri: this.Address,
                data: oldvalordelta
            }
            odatajs.oData.request(request, (data, response) => {
                callback.resolve();
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }

        private getDelta(oldval: T, newVal: T): deltaT {
            let ret: any = { };
            for(let prop in newVal)
                if(oldval[prop] != newVal[prop])
                    ret[prop] = newVal[prop];
            return ret;
        }
        /**
         * Deletes a value from the entity set.
         * 
         * @param {T} value to delete
         * @returns {Promise<T>} for async Operation. Use `await` keyword to get value or `.then` callback.
         * 
         * @memberOf EntitySet
         */
        Delete(value: T): Thenable<void> {
            let callback = new ThenableCaller<void>()
            let request: odatajs.Request = {
                headers: this.headers,
                method: Method[Method.DELETE],
                requestUri: this.Address + "("+value[this.Key]+")"
            }
            odatajs.oData.request(request, (data, response) => {
                callback.resolve();
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
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

    
    /**
     * Class that implements thenable callbacks is used to call the callbacks handed by the user.
     * 
     * @class ThenableCaller
     * @implements {Thenable<T>}
     * @template T
     */
    export class ThenableCaller<T> implements Thenable<T> {
        private _then?: ((value: T) => void)[] = [];
        private _catch?: ((error: any) => void)[] = [];
        public then(then?: (value: T) => void): Thenable<T> {
            this._then.push(then);
            return this;
        }
        public catch(reject: (error: any) => void): Thenable<T> {
            this._catch.push(reject);
            return this;
        }
        public resolve(value?: T) {
            if(this._then)
                for(let t of this._then)
                    t(value);
        }
        public reject(error: any) {
            if(this._catch)
                for(let c of this._catch)
                    c(error);
        }
    }

    /**
     * An interface to add callbacks as in ES6 Promiselike
     * 
     * @interface Thenable
     * @template T
     */
    export interface Thenable<T> {
        
        /**
         * Gets called if async function returns successfully
         * 
         * @param {(value: T) => void} then
         * @returns {Thenable<T>} for method stacking
         * 
         * @memberOf Thenable
         */
        then(then: (value?: T) => void): Thenable<T>;
        
        /**
         * Gets called if async function returns an error
         * 
         * @param {(error: any) => void} reject
         * @returns {Thenable<T>} for method stacking
         * 
         * @memberOf Thenable
         */
        catch(reject: (error: any) => void): Thenable<T>;
    }
}

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

    interface Header { [name: string]: string }
}
console.log("Loaded odataproxybase");