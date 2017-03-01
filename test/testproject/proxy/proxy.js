var MovieService;
(function (MovieService) {
    var ProxyBase = odatatools.ProxyBase;
    var EntitySet = odatatools.EntitySet;
    var ThenableCaller = odatatools.ThenableCaller;
    class MovieContainer extends ProxyBase {
        constructor(address, name, additionalHeaders) {
            super(address, name, additionalHeaders);
            this.Movies = new MovieEntitySet("Movies", address, "Id", additionalHeaders);
            this.Customers = new EntitySet("Customers", address, "Id", additionalHeaders);
            this.Addresses = new EntitySet("Addresses", address, "Id", additionalHeaders);
        }
        SetSomething(value) {
            let callback = new ThenableCaller();
            let request = {
                headers: this.Headers,
                method: "GET",
                requestUri: this.Address + "/SetSomething",
                data: {
                    value: value
                }
            };
            odatajs.oData.request(request, (data, response) => {
                callback.resolve(data.value);
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }
        CurrentTime() {
            let callback = new ThenableCaller();
            let request = {
                headers: this.Headers,
                method: "GET",
                requestUri: this.Address + "/CurrentTime",
            };
            odatajs.oData.request(request, (data, response) => {
                callback.resolve(data.value);
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }
    }
    MovieService.MovieContainer = MovieContainer;
    class MovieEntitySet extends EntitySet {
        constructor(name, address, key, additionalHeaders) {
            super(name, address, key, additionalHeaders);
        }
        Rate(key, rating, reason) {
            let callback = new ThenableCaller();
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
                callback.resolve(data.value);
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }
        ResetRating(key) {
            let callback = new ThenableCaller();
            let request = {
                headers: this.Headers,
                method: "POST",
                requestUri: this.Address + "(" + key + ")/MovieService.ResetRating",
            };
            odatajs.oData.request(request, (data, response) => {
                callback.resolve();
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }
        GetBestMovie(Genre) {
            let callback = new ThenableCaller();
            let request = {
                headers: this.Headers,
                method: "GET",
                requestUri: this.Address + "/MovieService.GetBestMovie",
                data: {
                    Genre: Genre
                }
            };
            odatajs.oData.request(request, (data, response) => {
                callback.resolve(data.value);
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }
    }
    MovieService.MovieEntitySet = MovieEntitySet;
})(MovieService || (MovieService = {}));
//# sourceMappingURL=proxy.js.map