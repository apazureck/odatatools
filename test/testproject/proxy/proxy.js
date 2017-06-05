"use strict";
const odataproxybase_1 = require("./odataproxybase");
const odatajs = require("odatajs");
class MovieContainer extends odataproxybase_1.ProxyBase {
    constructor(address, name, additionalHeaders) {
        super(address, name, additionalHeaders);
        this.Movies = new MovieEntitySet("Movies", address, "Id", additionalHeaders);
        this.Customers = new odataproxybase_1.EntitySet("Customers", address, "Id", additionalHeaders);
        this.Addresses = new odataproxybase_1.EntitySet("Addresses", address, "Id", additionalHeaders);
    }
    SetSomething(value) {
        return new Promise((reject, resolve) => {
            let request = {
                headers: this.Headers,
                method: "GET",
                requestUri: this.Address + "/SetSomething(value=" + value + ")",
            };
            odatajs.oData.request(request, (data, response) => {
                resolve(data.value);
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                reject(error);
            });
        });
    }
    CurrentTime() {
        return new Promise((reject, resolve) => {
            let request = {
                headers: this.Headers,
                method: "GET",
                requestUri: this.Address + "/CurrentTime",
            };
            odatajs.oData.request(request, (data, response) => {
                resolve(data.value);
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                reject(error);
            });
        });
    }
    GetSomething(value) {
        return new Promise((reject, resolve) => {
            let request = {
                headers: this.Headers,
                method: "GET",
                requestUri: this.Address + "/GetSomething(value=" + value + ")",
            };
            odatajs.oData.request(request, (data, response) => {
                resolve(data.value);
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                reject(error);
            });
        });
    }
}
exports.MovieContainer = MovieContainer;
class MovieEntitySet extends odataproxybase_1.EntitySet {
    constructor(name, address, key, additionalHeaders) {
        super(name, address, key, additionalHeaders);
    }
    Rate(key, rating, reason) {
        return new Promise((reject, resolve) => {
            let request = {
                headers: this.Headers,
                method: "POST",
                requestUri: this.Address + "(" + key + ")/MovieService.Rate",
                data: {
                    rating: rating,
                    reason: reason
                }
            };
            odatajs.oData.request(request, (data, response) => {
                resolve(data.value);
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                reject(error);
            });
        });
    }
    ResetRating(key) {
        return new Promise((reject, resolve) => {
            let request = {
                headers: this.Headers,
                method: "POST",
                requestUri: this.Address + "(" + key + ")/MovieService.ResetRating",
            };
            odatajs.oData.request(request, (data, response) => {
                resolve();
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                reject(error);
            });
        });
    }
    GetBestMovie(Genre) {
        return new Promise((reject, resolve) => {
            let request = {
                headers: this.Headers,
                method: "GET",
                requestUri: this.Address + "/MovieService.GetBestMovie(Genre=" + Genre + ")",
            };
            odatajs.oData.request(request, (data, response) => {
                resolve(data.value);
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                reject(error);
            });
        });
    }
}
exports.MovieEntitySet = MovieEntitySet;
//# sourceMappingURL=proxy.js.map