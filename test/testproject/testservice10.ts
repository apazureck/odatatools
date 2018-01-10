/**************************************************************************
Created by odatatools: https://marketplace.visualstudio.com/items?itemName=apazureck.odatatools
Use Command 'odata: xyUpdate to refresh data while this file is active in the editor.
Creation Time: Tue Jan 09 2018 10:59:30 GMT+0100 (Mitteleuropäische Zeit)
DO NOT DELETE THIS IN ORDER TO UPDATE YOUR SERVICE
#ODATATOOLSOPTIONS
{
	"modularity": "Ambient",
	"requestOptions": {},
	"source": "http://localhost:2200/moviedb/$metadata"
}
#ODATATOOLSOPTIONSEND
**************************************************************************/

namespace MovieService {
  import ProxyBase = odatatools.ProxyBase;
  import EntitySet = odatatools.EntitySet;

  export class MovieContainer extends ProxyBase {
    constructor(
      address: string,
      name?: string,
      additionalHeaders?: odatajs.Header
    ) {
      super(address, name, additionalHeaders);
      this.Movies = new MovieEntitySet(
        "Movies",
        address,
        "Id",
        additionalHeaders
      );
      this.Customers = new EntitySet<ODataTestService.Models.Customer>(
        "Customers",
        address,
        "Id",
        additionalHeaders
      );
      this.Addresses = new EntitySet<ODataTestService.Models.Address>(
        "Addresses",
        address,
        "Id",
        additionalHeaders
      );
    }
    Movies: MovieEntitySet;
    Customers: EntitySet<ODataTestService.Models.Customer>;
    Addresses: EntitySet<ODataTestService.Models.Address>;
    SetSomething(value: Edm.Int32): Promise<Edm.Int32> {
      return new Promise<Edm.Int32>((resolve, reject) => {
        let request: odatajs.Request = {
          headers: this.Headers,
          method: "GET",
          requestUri: this.Address + "/SetSomething(value=" + value + ")"
        };
        odatajs.oData.request(
          request,
          (data, response) => {
            resolve(data.value);
          },
          error => {
            console.error(
              error.name +
                " " +
                error.message +
                " | " +
                (error.response | error.response.statusText) +
                ":" +
                (error.response | error.response.body)
            );
            reject(error);
          }
        );
      });
    }
    CurrentTime(): Promise<Edm.DateTimeOffset> {
      return new Promise<Edm.DateTimeOffset>((resolve, reject) => {
        let request: odatajs.Request = {
          headers: this.Headers,
          method: "GET",
          requestUri: this.Address + "/CurrentTime"
        };
        odatajs.oData.request(
          request,
          (data, response) => {
            resolve(data.value);
          },
          error => {
            console.error(
              error.name +
                " " +
                error.message +
                " | " +
                (error.response | error.response.statusText) +
                ":" +
                (error.response | error.response.body)
            );
            reject(error);
          }
        );
      });
    }
    GetSomething(value: Edm.Int32): Promise<Edm.Int32> {
      return new Promise<Edm.Int32>((resolve, reject) => {
        let request: odatajs.Request = {
          headers: this.Headers,
          method: "GET",
          requestUri: this.Address + "/GetSomething(value=" + value + ")"
        };
        odatajs.oData.request(
          request,
          (data, response) => {
            resolve(data.value);
          },
          error => {
            console.error(
              error.name +
                " " +
                error.message +
                " | " +
                (error.response | error.response.statusText) +
                ":" +
                (error.response | error.response.body)
            );
            reject(error);
          }
        );
      });
    }
  }
  export class MovieEntitySet extends EntitySet<ODataTestService.Models.Movie> {
    constructor(
      name: string,
      address: string,
      key: string,
      additionalHeaders?: odatajs.Header
    ) {
      super(name, address, key, additionalHeaders);
    }
    Rate(
      key: Edm.Int32,
      rating: Edm.Single,
      reason: Edm.String
    ): Promise<Edm.String> {
      return new Promise<Edm.String>((resolve, reject) => {
        let request: odatajs.Request = {
          headers: this.Headers,
          method: "POST",
          requestUri: this.Address + "(" + key + ")/MovieService.Rate",
          data: {
            rating: rating,
            reason: reason
          }
        };
        odatajs.oData.request(
          request,
          (data, response) => {
            resolve(data.value);
          },
          error => {
            console.error(
              error.name +
                " " +
                error.message +
                " | " +
                (error.response | error.response.statusText) +
                ":" +
                (error.response | error.response.body)
            );
            reject(error);
          }
        );
      });
    }

    ResetRating(key: Edm.Int32): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        let request: odatajs.Request = {
          headers: this.Headers,
          method: "POST",
          requestUri: this.Address + "(" + key + ")/MovieService.ResetRating"
        };
        odatajs.oData.request(
          request,
          (data, response) => {
            resolve();
          },
          error => {
            console.error(
              error.name +
                " " +
                error.message +
                " | " +
                (error.response | error.response.statusText) +
                ":" +
                (error.response | error.response.body)
            );
            reject(error);
          }
        );
      });
    }

    GetBestMovie(Genre: Edm.String): Promise<ODataTestService.Models.Movie> {
      return new Promise<ODataTestService.Models.Movie>((resolve, reject) => {
        let request: odatajs.Request = {
          headers: this.Headers,
          method: "GET",
          requestUri:
            this.Address + "/MovieService.GetBestMovie(Genre=" + Genre + ")"
        };
        odatajs.oData.request(
          request,
          (data, response) => {
            resolve(data.value);
          },
          error => {
            console.error(
              error.name +
                " " +
                error.message +
                " | " +
                (error.response | error.response.statusText) +
                ":" +
                (error.response | error.response.body)
            );
            reject(error);
          }
        );
      });
    }
  }
}
