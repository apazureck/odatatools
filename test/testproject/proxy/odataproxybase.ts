namespace odatatools {
    enum Method {
        GET, POST, PUT, PATCH, DELETE
    }

    export class ProxyBase {
        constructor(public readonly Address: string, public readonly Name?: string, additonalHeaders?: odatajs.Header) {
            this.Name = this.Name || "ProxyService";

            this.Headers = { "Content-Type": "application/json", Accept: "application/json" };

            for (var attrname in additonalHeaders) { this.Headers[attrname] = additonalHeaders[attrname]; };
        }

        /**
         * All headers appended to each request.
         * 
         * @type {odatajs.Header}
         * @memberOf EntitySet
         */
        readonly Headers: odatajs.Header;
    }

    export abstract class ODataQueryOptionBase {
        private query: string[] = [];

        protected resolveODataOptions(): string {
            if (this.query.length > 0)
                return "?" + this.query.join("&");
            else
                return "";
        }

        protected addToQuery(element: string) {
            this.query.push(element);
        }
        protected emptyQuery(): void {
            this.query = [];
        }
    }

    export abstract class ODataQueryOptionsGetSingle<T> extends ODataQueryOptionBase {

    }

    export abstract class ODataQueryFilterOptions<T> extends ODataQueryOptionsGetSingle<T> {

        abstract Get(): Promise<T[]>;
        abstract Get(id: string): Promise<T>;

        abstract Count(): Promise<number>;

        /**
         * Selects properties on the elements. Works on Get() and Get(id).
         * 
         * @param {keyof T | (keyof T)[]} properties Use comma separated names without spaces
         * @returns {ODataQueryOptions<T>} 
         * 
         * @memberof ODataQueryOptions
         */
        Select(properties: keyof T | (keyof T)[]): ODataQueryFilterOptions<T> {
            if (typeof properties === "string")
                this.addToQuery("$select=" + properties);
            else
                this.addToQuery("$select=" + (<(keyof T)[]>properties).join(","));
            return this;
        }

        /**
         * Orders elements by the given property. Works only on Get()
         * 
         * @param {string} property Property on dataset to order by
         * @param {Order} [order=asc] Order "asc" for ascending and "desc" for descending.
         * @returns {ODataQueryFilterOptions<T>} 
         * 
         * @memberof ODataQueryFilterOptions
         */
        OrderBy(property: keyof T, order?: Order): ODataQueryFilterOptions<T> {
            this.addToQuery("$orderby=" + property + order ? " " + order : "");
            return this;
        }

        /**
         * Top selects the given number of element. Works only on Get()
         * 
         * @param {number} select number of elements to select
         * @returns {ODataQueryFilterOptions<T>} 
         * 
         * @memberof ODataQueryFilterOptions
         */
        Top(select: number): ODataQueryFilterOptions<T> {
            this.addToQuery("$top=" + select);
            return this;
        }

        /**
         * Skips the given number of elements and starts with element n + 1
         * 
         * @param {number} select Number of elements to skip
         * @returns {ODataQueryFilterOptions<T>} 
         * 
         * @memberof ODataQueryFilterOptions
         */
        Skip(select: number): ODataQueryFilterOptions<T> {
            this.addToQuery("$skip=" + select);
            return this;
        }

        /**
         * Filters by given criteria. See odata $filter convention for information on syntax.
         * 
         * @param {string} filter Filter syntax specified by odata V4 standard.
         * @returns {ODataQueryFilterOptions<T>} 
         * 
         * @memberof ODataQueryFilterOptions
         */
        Filter(filter: string): ODataQueryFilterOptions<T> {
            this.addToQuery("$filter=" + filter);
            return this;
        }


        /**
         * Expands given property or array of properties.
         * 
         * @param {(keyof T | (keyof T)[])} properties Properties to expand on.
         * @returns {ODataQueryFilterOptions<T>}
         * 
         * @memberof ODataQueryFilterOptions
         */
        Expand(properties: keyof T | (keyof T)[]): ODataQueryFilterOptions<T> {
            if (typeof properties === "string")
                this.addToQuery("$expand=" + properties);
            else
                this.addToQuery("$expand=" + (<(keyof T)[]>properties).join(","));
            return this;
        }

        /**
         * Searches for a value in the entity set as specified in OData protocol
         * 
         * @param {string} searchExpression Search specified in OData protocol
         * @returns {ODataQueryFilterOptions<T>} 
         * 
         * @memberof ODataQueryFilterOptions
         */
        Search(searchExpression: string): ODataQueryFilterOptions<T> {
            this.addToQuery("$search=" + searchExpression)
            return this;
        }

        Custom(customData: string): ODataQueryFilterOptions<T> {
            this.addToQuery(customData);
            return this;
        }
    }

    export type Order = "asc" | "desc";

    export type Partial<T> = {
        [P in keyof T]?: T[P];
    };

    /**
     * 
     * A generic entity set which represents the content of the entity container.
     * 
     * @export
     * @class EntitySet
     * @template T
     */
    export class EntitySet<T> extends ODataQueryFilterOptions<T> {

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
        constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
            super();
            this.Name = name;
            this.Address = address.replace(/\/$/, "") + "/" + name;
            this.Key = key;
            this.Headers = { "Content-Type": "application/json", Accept: "application/json" };

            for (var attrname in additionalHeaders) { this.Headers[attrname] = additionalHeaders[attrname]; };
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
         * All headers appended to each request.
         * 
         * @type {odatajs.Header}
         * @memberOf EntitySet
         */
        readonly Headers: odatajs.Header;

        /**
         * Key of the entity
         * @memberOf EntitySet
         */
        readonly Key: string;

        /**
         * Gets all entries of an entity set. Use method chaining (call.Skip(10).Top(10).Get() before you call this method to create a query.
         * 
         * @returns {Promise<T[]>} 
         * 
         * @memberof EntitySet
         */
        Get(): Promise<T[]>
        /**
         * Gets one entry of the entity set by id.
         * 
         * @param {string} id 
         * @returns {Promise<T>} 
         * 
         * @memberof EntitySet
         */
        Get(id: string): Promise<T>;
        Get(id?: string): Promise<T | T[]> {
            return new Promise((resolve, reject) => {
                let requri: string;
                if (id) {
                    requri = this.Address + "(" + id + ")";
                } else {
                    requri = this.Address;
                }
                requri += this.resolveODataOptions();
                let request: odatajs.Request = {
                    headers: this.Headers,
                    method: Method[Method.GET],
                    requestUri: requri
                }
                const that = this;
                // if id starts with $ it is additional odata parameters

                odatajs.oData.request(request, (data, response) => {
                    resolve(data);
                    that.emptyQuery();
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                    reject(error);
                    that.emptyQuery();
                });
            });
        }

        /**
         * Replaces an existing value in the entity collection.
         * 
         * @param {T} value to replace
         * @returns {Promise<T>} for async Operation. Use `await` keyword to get value or `.then` callback.
         * 
         * @memberOf EntitySet
         */
        Put(value: T): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                let request: odatajs.Request = {
                    headers: this.Headers,
                    method: Method[Method.PUT],
                    requestUri: this.Address + "(" + value[this.Key] + ")",
                    data: value
                }
                odatajs.oData.request(request, (data, response) => {
                    resolve();
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                    reject(error);
                });
            });
        }

        /**
         * Adds a new entry to an EntitySet
         * 
         * @param {T} value to ad to the EntitySet
         * @returns {Promise<T>} for async Operation. Use `await` keyword to get value or `.then` callback.
         * 
         * @memberOf EntitySet
         */
        Post(value: T): Promise<T> {
            return new Promise<T>((resolve, reject) => {
                let request: odatajs.Request = {
                    headers: this.Headers,
                    method: Method[Method.POST],
                    requestUri: this.Address,
                    data: value
                }
                odatajs.oData.request(request, (data, response) => {
                    resolve(data as T);
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                    reject(error);
                });
            });
        }
        Patch(delta: Partial<T> | T): Promise<void>
        Patch(oldvalue: T, newValue: T): Promise<void>
        Patch(oldvalordelta: T | Partial<T>, newval?: T): Promise<void> {
            if (newval)
                oldvalordelta = this.getDelta(oldvalordelta as T, newval);

            return new Promise<void>((resolve, reject) => {
                let request: odatajs.Request = {
                    headers: this.Headers,
                    method: Method[Method.PATCH],
                    requestUri: this.Address,
                    data: oldvalordelta
                }
                odatajs.oData.request(request, (data, response) => {
                    resolve();
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                    reject(error);
                });
            });
        }

        private getDelta(oldval: T, newVal: T): Partial<T> {
            let ret: any = {};
            for (let prop in newVal)
                if (oldval[prop] != newVal[prop])
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
        Delete(value: T): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                let request: odatajs.Request = {
                    headers: this.Headers,
                    method: Method[Method.DELETE],
                    requestUri: this.Address + "(" + value[this.Key] + ")"
                }
                odatajs.oData.request(request, (data, response) => {
                    resolve();
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                    reject(error);
                });
            });
        }

        Count(): Promise<number> {
            return new Promise<number>((resolve, reject) => {
                const requri = this.Address + "/$count/" + this.resolveODataOptions();
                let request: odatajs.Request = {
                    headers: this.Headers,
                    method: Method[Method.GET],
                    requestUri: requri
                }

                odatajs.oData.request(request, (data, response) => {
                    resolve(data);
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                    reject(error);
                });
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