export namespace MovieService {
    import ProxyBase = odatatools.ProxyBase;
    import EntitySet = odatatools.EntitySet;
    import ThenableCaller = odatatools.ThenableCaller;
    import Thenable = odatatools.Thenable;

    export class MovieContainer extends ProxyBase {
        constructor(address: string, name?: string, additionalHeaders?: odatajs.Header) {
            super(address, name, additionalHeaders);
            this.Movies = new MovieEntitySet("Movies", address, "Id", additionalHeaders);
            this.Customers = new EntitySet<ODataTestService.Models.Customer, ODataTestService.Models.DeltaCustomer>("Customers", address, "Id", additionalHeaders);
            this.Addresses = new EntitySet<ODataTestService.Models.Address, ODataTestService.Models.DeltaAddress>("Addresses", address, "Id", additionalHeaders);
        }
        Movies: MovieEntitySet;
        Customers: EntitySet<ODataTestService.Models.Customer, ODataTestService.Models.DeltaCustomer>;
        Addresses: EntitySet<ODataTestService.Models.Address, ODataTestService.Models.DeltaAddress>;
        SetSomething(value: Edm.Int32): Thenable<Edm.Int32> {
            let callback = new ThenableCaller<Edm.Int32>();
            let request: odatajs.Request = {
                headers: this.Headers,
                method: "GET",
                requestUri: this.Address + "/SetSomething(value=" + value + ")",
            }
            odatajs.oData.request(request, (data, response) => {
                callback.resolve(data.value);
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }
        CurrentTime(): Thenable<Edm.DateTimeOffset> {
            let callback = new ThenableCaller<Edm.DateTimeOffset>();
            let request: odatajs.Request = {
                headers: this.Headers,
                method: "GET",
                requestUri: this.Address + "/CurrentTime",
            }
            odatajs.oData.request(request, (data, response) => {
                callback.resolve(data.value);
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }
        GetSomething(value: Edm.Int32): Thenable<Edm.Int32> {
            let callback = new ThenableCaller<Edm.Int32>();
            let request: odatajs.Request = {
                headers: this.Headers,
                method: "GET",
                requestUri: this.Address + "/GetSomething(value=" + value + ")",
            }
            odatajs.oData.request(request, (data, response) => {
                callback.resolve(data.value);
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }

    }
    export class MovieEntitySet extends EntitySet<ODataTestService.Models.Movie, ODataTestService.Models.DeltaMovie> {
        constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
            super(name, address, key, additionalHeaders);
        }
        Rate(key: Edm.Int32, rating: Edm.Single, reason: Edm.String): Thenable<Edm.String> {
            let callback = new ThenableCaller<Edm.String>();
            let request: odatajs.Request = {
                headers: this.Headers,
                method: "POST",
                requestUri: this.Address + "(" + key + ")/MovieService.Rate",
                data: {
                    rating: rating,
                    reason: reason
                }
            }
            odatajs.oData.request(request, (data, response) => {
                callback.resolve(data.value);
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }

        ResetRating(key: Edm.Int32): Thenable<void> {
            let callback = new ThenableCaller<void>();
            let request: odatajs.Request = {
                headers: this.Headers,
                method: "POST",
                requestUri: this.Address + "(" + key + ")/MovieService.ResetRating",
            }
            odatajs.oData.request(request, (data, response) => {
                callback.resolve();
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }

        GetBestMovie(Genre: Edm.String): Thenable<ODataTestService.Models.Movie> {
            let callback = new ThenableCaller<ODataTestService.Models.Movie>();
            let request: odatajs.Request = {
                headers: this.Headers,
                method: "GET",
                requestUri: this.Address + "/MovieService.GetBestMovie(Genre=" + Genre + ")",
            }
            odatajs.oData.request(request, (data, response) => {
                callback.resolve(data.value);
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }

    }


}