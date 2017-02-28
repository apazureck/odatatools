var odatatools;
(function (odatatools) {
    var Method;
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
    /**
     *
     * A generic entity set which represents the content of the entity container.
     *
     * @export
     * @class EntitySet
     * @template T
     */
    class EntitySet {
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
            this.Name = name;
            this.Address = address.replace(/\/$/, "") + "/" + name;
            this.Key = key;
            this.Headers = { "Content-Type": "application/json", Accept: "application/json" };
            for (var attrname in additionalHeaders) {
                this.Headers[attrname] = additionalHeaders[attrname];
            }
            ;
        }
        Get(idOrParams, parameters) {
            let requri;
            let paramsonly = idOrParams && idOrParams.match(/^\$/);
            if (!idOrParams) {
                requri = this.Address;
            }
            else if (paramsonly) {
                requri = this.Address + (idOrParams ? "?" + idOrParams : "");
            }
            else if (parameters) {
                requri = this.Address + "(" + idOrParams + ")" + "?" + parameters;
            }
            else {
                requri = this.Address + "(" + idOrParams + ")";
            }
            let request = {
                headers: this.Headers,
                method: Method[Method.GET],
                requestUri: requri
            };
            // if id starts with $ it is additional odata parameters
            if (!paramsonly) {
                let callback = new ThenableCaller();
                odatajs.oData.request(request, (data, response) => {
                    if (callback.then) {
                        callback.resolve(data);
                    }
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                    if (callback.catch) {
                        callback.reject(error);
                    }
                });
                return callback;
            }
            else {
                let callback = new ThenableCaller();
                odatajs.oData.request(request, (data, response) => {
                    if (callback.then) {
                        callback.resolve(data);
                    }
                }, (error) => {
                    console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                    if (callback.catch) {
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
        Put(value) {
            let callback = new ThenableCaller();
            let request = {
                headers: this.Headers,
                method: Method[Method.PUT],
                requestUri: this.Address + "(" + value[this.Key] + ")",
                data: value
            };
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
        Post(value) {
            let callback = new ThenableCaller();
            let request = {
                headers: this.Headers,
                method: Method[Method.POST],
                requestUri: this.Address,
                data: value
            };
            odatajs.oData.request(request, (data, response) => {
                callback.resolve(data);
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }
        Patch(oldvalordelta, newval) {
            if (newval)
                oldvalordelta = this.getDelta(oldvalordelta, newval);
            let callback = new ThenableCaller();
            let request = {
                headers: this.Headers,
                method: Method[Method.PATCH],
                requestUri: this.Address,
                data: oldvalordelta
            };
            odatajs.oData.request(request, (data, response) => {
                callback.resolve();
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
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
            let callback = new ThenableCaller();
            let request = {
                headers: this.Headers,
                method: Method[Method.DELETE],
                requestUri: this.Address + "(" + value[this.Key] + ")"
            };
            odatajs.oData.request(request, (data, response) => {
                callback.resolve();
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":\n" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }
    }
    odatatools.EntitySet = EntitySet;
    class EntityContainer {
        constructor(name, uri) {
            this.Name = name;
            this.Uri = uri;
        }
    }
    /**
     * Class that implements thenable callbacks is used to call the callbacks handed by the user.
     *
     * @class ThenableCaller
     * @implements {Thenable<T>}
     * @template T
     */
    class ThenableCaller {
        constructor() {
            this._then = [];
            this._catch = [];
        }
        then(then) {
            this._then.push(then);
            return this;
        }
        catch(reject) {
            this._catch.push(reject);
            return this;
        }
        resolve(value) {
            if (this._then)
                for (let t of this._then)
                    t(value);
        }
        reject(error) {
            if (this._catch)
                for (let c of this._catch)
                    c(error);
        }
    }
    odatatools.ThenableCaller = ThenableCaller;
})(odatatools || (odatatools = {}));
console.log("Loaded odataproxybase");
//# sourceMappingURL=odataproxybase.js.map