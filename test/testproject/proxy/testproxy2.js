/**************************************************************************
Created by odatatools: https://marketplace.visualstudio.com/items?itemName=apazureck.odatatools
Use Command 'odata: xyUpdate to refresh data while this file is active in the editor.
Creation Time: Tue Dec 05 2017 15:06:25 GMT+0100 (Mitteleuropäische Zeit)
DO NOT DELETE THIS IN ORDER TO UPDATE YOUR SERVICE
#ODATATOOLSOPTIONS
{
    "modularity": "Ambient",
    "requestOptions": {},
    "source": "http://localhost:2200/moviedb/$metadata",
    "useTemplate": "proxy.ot",
    "testTemplate": true
}
#ODATATOOLSOPTIONSEND
**************************************************************************/
// Base classes ##########################################################
// Leave this in order to use the base classes
var odatatools;
(function (odatatools) {
    let Method;
    (function (Method) {
        Method[Method["GET"] = 0] = "GET";
        Method[Method["POST"] = 1] = "POST";
        Method[Method["PUT"] = 2] = "PUT";
        Method[Method["PATCH"] = 3] = "PATCH";
        Method[Method["DELETE"] = 4] = "DELETE";
    })(Method || (Method = {}));
    class ProxyBase {
        constructor(Address, Name, additonalHeaders) {
            this.Address = Address;
            this.Name = Name;
            this.Name = this.Name || "ProxyService";
            this.Headers = { "Content-Type": "application/json", Accept: "application/json" };
            for (var attrname in additonalHeaders) {
                this.Headers[attrname] = additonalHeaders[attrname];
            }
            ;
        }
    }
    odatatools.ProxyBase = ProxyBase;
    class ODataQueryOptionBase {
        constructor() {
            this.query = [];
        }
        resolveODataOptions() {
            if (this.query.length > 0)
                return "?" + this.query.join("&");
            else
                return "";
        }
        addToQuery(element) {
            this.query.push(element);
        }
        emptyQuery() {
            this.query = [];
        }
    }
    odatatools.ODataQueryOptionBase = ODataQueryOptionBase;
    class ODataQueryOptionsGetSingle extends ODataQueryOptionBase {
    }
    odatatools.ODataQueryOptionsGetSingle = ODataQueryOptionsGetSingle;
    class ODataQueryFilterOptions extends ODataQueryOptionsGetSingle {
        /**
         * Selects properties on the elements. Works on Get() and Get(id).
         *
         * @param {keyof T | (keyof T)[]} properties Use comma separated names without spaces
         * @returns {ODataQueryOptions<T>}
         *
         * @memberof ODataQueryOptions
         */
        Select(properties) {
            if (typeof properties === "string")
                this.addToQuery("$select=" + properties);
            else
                this.addToQuery("$select=" + properties.join(","));
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
        OrderBy(property, order) {
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
        Top(select) {
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
        Skip(select) {
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
        Filter(filter) {
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
        Expand(properties) {
            if (typeof properties === "string")
                this.addToQuery("$expand=" + properties);
            else
                this.addToQuery("$expand=" + properties.join(","));
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
        Search(searchExpression) {
            this.addToQuery("$search=" + searchExpression);
            return this;
        }
        Custom(customData) {
            this.addToQuery(customData);
            return this;
        }
    }
    odatatools.ODataQueryFilterOptions = ODataQueryFilterOptions;
    /**
     *
     * A generic entity set which represents the content of the entity container.
     *
     * @export
     * @class EntitySet
     * @template T
     */
    class EntitySet extends ODataQueryFilterOptions {
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
        constructor(name, address, key, additionalHeaders) {
            super();
            this.Name = name;
            this.Address = address.replace(/\/$/, "") + "/" + name;
            this.Key = key;
            this.Headers = { "Content-Type": "application/json", Accept: "application/json" };
            for (var attrname in additionalHeaders) {
                this.Headers[attrname] = additionalHeaders[attrname];
            }
            ;
        }
        Get(id) {
            return new Promise((resolve, reject) => {
                let requri;
                if (id) {
                    requri = this.Address + "(" + id + ")";
                }
                else {
                    requri = this.Address;
                }
                requri += this.resolveODataOptions();
                this.emptyQuery();
                let request = {
                    headers: this.Headers,
                    method: Method[Method.GET],
                    requestUri: requri
                };
                odatajs.oData.request(request, (data, response) => {
                    if (id) {
                        resolve(data);
                    }
                    else {
                        resolve(data.value);
                    }
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                    reject(error);
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
        Put(value) {
            return new Promise((resolve, reject) => {
                let request = {
                    headers: this.Headers,
                    method: Method[Method.PUT],
                    requestUri: this.Address + "(" + value[this.Key] + ")",
                    data: value
                };
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
        Post(value) {
            return new Promise((resolve, reject) => {
                let request = {
                    headers: this.Headers,
                    method: Method[Method.POST],
                    requestUri: this.Address,
                    data: value
                };
                odatajs.oData.request(request, (data, response) => {
                    resolve(data);
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                    reject(error);
                });
            });
        }
        Patch(oldvalordelta, newval) {
            if (newval)
                oldvalordelta = this.getDelta(oldvalordelta, newval);
            return new Promise((resolve, reject) => {
                let request = {
                    headers: this.Headers,
                    method: Method[Method.PATCH],
                    requestUri: this.Address,
                    data: oldvalordelta
                };
                odatajs.oData.request(request, (data, response) => {
                    resolve();
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                    reject(error);
                });
            });
        }
        getDelta(oldval, newVal) {
            let ret = {};
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
        Delete(value) {
            return new Promise((resolve, reject) => {
                let request = {
                    headers: this.Headers,
                    method: Method[Method.DELETE],
                    requestUri: this.Address + "(" + value[this.Key] + ")"
                };
                odatajs.oData.request(request, (data, response) => {
                    resolve();
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                    reject(error);
                });
            });
        }
        Count() {
            return new Promise((resolve, reject) => {
                const requri = this.Address + "/$count/" + this.resolveODataOptions();
                let request = {
                    headers: this.Headers,
                    method: Method[Method.GET],
                    requestUri: requri
                };
                odatajs.oData.request(request, (data, response) => {
                    resolve(data);
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                    reject(error);
                });
            });
        }
    }
    odatatools.EntitySet = EntitySet;
    class EntityContainer {
        constructor(name, uri) {
            this.Name = name;
            this.Uri = uri;
        }
    }
})(odatatools || (odatatools = {}));
console.log("Loaded odataproxybase");
var MovieService;
(function (MovieService) {
    class MovieContainer extends odatatools.ProxyBase {
        constructor(address, name, additionalHeaders) {
            super(address, name, additionalHeaders);
            this.Movies = new MoviesEntitySet("Movies", address, "[object Object]", additionalHeaders);
            this.Customers = new CustomersEntitySet("Customers", address, "[object Object]", additionalHeaders);
            this.Addresses = new AddressesEntitySet("Addresses", address, "[object Object]", additionalHeaders);
        }
        // Unbound Functions
        CurrentTime() {
            return new Promise((resolve, reject) => {
                let request = {
                    headers: this.Headers,
                    method: "GET",
                    requestUri: this.Address + "/CurrentTime()",
                };
                odatajs.oData.request(request, (data, response) => {
                    resolve(data.value || data);
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                    reject(error);
                });
            });
        }
        GetSomething(value) {
            return new Promise((resolve, reject) => {
                let request = {
                    headers: this.Headers,
                    method: "GET",
                    requestUri: this.Address + "/GetSomething(value=" + value + ")",
                };
                odatajs.oData.request(request, (data, response) => {
                    resolve(data.value || data);
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                    reject(error);
                });
            });
        }
        //Unbound Actions
        SetSomething(value) {
            return new Promise((resolve, reject) => {
                let request = {
                    headers: this.Headers,
                    method: "POST",
                    requestUri: this.Address + "/SetSomething()",
                    data: {
                        value: value,
                    },
                };
                odatajs.oData.request(request, (data, response) => {
                    resolve(data.value || data);
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                    reject(error);
                });
            });
        }
    }
    MovieService.MovieContainer = MovieContainer;
    //EntitySets
    class MoviesEntitySet extends odatatools.EntitySet {
        constructor(name, address, key, additionalHeaders) {
            super(name, address, key, additionalHeaders);
        }
        // Bound to entity Actions
        Rate(key, rating, reason) {
            return new Promise((resolve, reject) => {
                let request = {
                    headers: this.Headers,
                    method: "POST",
                    requestUri: this.Address + "(" + key + ")/MovieService.Rate()",
                    data: {
                        rating: rating,
                        reason: reason,
                    },
                };
                odatajs.oData.request(request, (data, response) => {
                    resolve(data.value || data);
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                    reject(error);
                });
            });
        }
        ResetRating(key) {
            return new Promise((resolve, reject) => {
                let request = {
                    headers: this.Headers,
                    method: "POST",
                    requestUri: this.Address + "(" + key + ")/MovieService.ResetRating()",
                    data: {},
                };
                odatajs.oData.request(request, (data, response) => {
                    resolve(data.value || data);
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                    reject(error);
                });
            });
        }
    }
    MovieService.MoviesEntitySet = MoviesEntitySet;
    class CustomersEntitySet extends odatatools.EntitySet {
        constructor(name, address, key, additionalHeaders) {
            super(name, address, key, additionalHeaders);
        }
    }
    MovieService.CustomersEntitySet = CustomersEntitySet;
    class AddressesEntitySet extends odatatools.EntitySet {
        constructor(name, address, key, additionalHeaders) {
            super(name, address, key, additionalHeaders);
        }
    }
    MovieService.AddressesEntitySet = AddressesEntitySet;
})(MovieService || (MovieService = {}));
//# sourceMappingURL=testproxy2.js.map