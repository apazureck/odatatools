/**************************************************************************
Created by odatatools: https://marketplace.visualstudio.com/items?itemName=apazureck.odatatools
Use Command 'odata: xyUpdate to refresh data while this file is active in the editor.
Creation Time: Tue Jun 06 2017 00:24:44 GMT+0200 (Mitteleuropäische Sommerzeit)
DO NOT DELETE THIS IN ORDER TO UPDATE YOUR SERVICE
#ODATATOOLSOPTIONS
{
    "modularity": "Ambient",
    "requestOptions": {},
    "source": "http://localhost:2200/moviedb/$metadata"
}
#ODATATOOLSOPTIONSEND
**************************************************************************/
var MovieService;
(function (MovieService) {
    var ProxyBase = odatatools.ProxyBase;
    var EntitySet = odatatools.EntitySet;
    class MovieContainer extends ProxyBase {
        constructor(address, name, additionalHeaders) {
            super(address, name, additionalHeaders);
            this.Movies = new MovieEntitySet("Movies", address, "Id", additionalHeaders);
            this.Customers = new EntitySet("Customers", address, "Id", additionalHeaders);
            this.Addresses = new EntitySet("Addresses", address, "Id", additionalHeaders);
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
    MovieService.MovieContainer = MovieContainer;
    class MovieEntitySet extends EntitySet {
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
    MovieService.MovieEntitySet = MovieEntitySet;
})(MovieService || (MovieService = {}));
//# sourceMappingURL=proxy.js.map