namespace MovieService {
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
    }
    export class MovieEntitySet extends EntitySet<ODataTestService.Models.Movie, ODataTestService.Models.DeltaMovie> {
        constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
            super(name, address, key, additionalHeaders);
        }
        Rate(key: Edm.Int32, rating: Edm.Single, reason: Edm.String): Thenable<void> {
            let callback = new ThenableCaller<void>();
            let request: odatajs.Request = {
                headers: this.headers,
                method: "POST",
                requestUri: this.Address + "(" + key + ")/MovieService.Rate",
                data: {
                    rating: rating,
                    reason: reason
                }
            }
            odatajs.oData.request(request, (data, response) => {
                callback.resolve();
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }

        ResetRating(key: Edm.Int32): Thenable<void> {
            let callback = new ThenableCaller<void>();
            let request: odatajs.Request = {
                headers: this.headers,
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

        GetBestMovie(Genre: Edm.String): Thenable<undefined> {
            let callback = new ThenableCaller<undefined>();
            let request: odatajs.Request = {
                headers: this.headers,
                method: "GET",
                requestUri: this.Address + "/MovieService.GetBestMovie",
                data: {
                    Genre: Genre
                }
            }
            odatajs.oData.request(request, (data, response) => {
                callback.resolve();
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }

    }
}