namespace test {
  /**************************************************************************
Created by odatatools: https://marketplace.visualstudio.com/items?itemName=apazureck.odatatools
Use Command 'odata: xyUpdate to refresh data while this file is active in the editor.
Creation Time: Thu Jan 11 2018 18:32:28 GMT+0100 (Mitteleuropäische Zeit)
DO NOT DELETE THIS IN ORDER TO UPDATE YOUR SERVICE
#ODATATOOLSOPTIONS
{
	"modularity": "Ambient",
	"requestOptions": {},
	"source": "http://services.odata.org/TripPinRESTierService/(S(tq0v4cxv3cph5pkpi1qziqzc))/$metadata",
	"useTemplate": "proxy.ot"
}
#ODATATOOLSOPTIONSEND
**************************************************************************/



// Base classes ##########################################################
// Leave this in order to use the base classes
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
              this.emptyQuery();
              let request: odatajs.Request = {
                  headers: this.Headers,
                  method: Method[Method.GET],
                  requestUri: requri
              }

              odatajs.oData.request(request, (data, response) => {
                  if(id) {
                      resolve(data);
                  } else {
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

type JSDate = Date;

declare namespace Edm {
  export type Duration = string;
  export type Binary = string;
  export type Boolean = boolean;
  export type Byte = number;
  export type Date = JSDate;
  export type DateTimeOffset = JSDate;
  export type Decimal = number;
  export type Double = number;
  export type Guid = string;
  export type Int16 = number;
  export type Int32 = number;
  export type Int64 = number;
  export type SByte = number;
  export type Single = number;
  export type String = string;
  export type TimeOfDay = string;
  export type Stream = string;
  export type GeographyPoint = any;
}

console.log("Loaded odataproxybase");

// ###################################### Implementation ################


namespace Microsoft.OData.Service.Sample.TrippinInMemory.Models {

  export interface Person {
      UserName: Edm.String;
      FirstName: Edm.String;
      LastName: Edm.String;
      MiddleName: Edm.String;
      Gender: Microsoft.OData.Service.Sample.TrippinInMemory.Models.PersonGender;
      Age: Edm.Int64;
      Emails: Edm.String;
      AddressInfo: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Location;
      HomeAddress: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Location;
      FavoriteFeature: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Feature;
      Features: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Feature;
      Friends?: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Person;
      BestFriend?: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Person;
      Trips?: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Trip;
      
  }
  export interface Airline {
      AirlineCode: Edm.String;
      Name: Edm.String;
      
  }
  export interface Airport {
      Name: Edm.String;
      IcaoCode: Edm.String;
      IataCode: Edm.String;
      Location: Microsoft.OData.Service.Sample.TrippinInMemory.Models.AirportLocation;
      
  }
  export interface Trip {
      TripId: Edm.Int32;
      ShareId: Edm.Guid;
      Name: Edm.String;
      Budget: Edm.Single;
      Description: Edm.String;
      Tags: Edm.String;
      StartsAt: Edm.DateTimeOffset;
      EndsAt: Edm.DateTimeOffset;
      PlanItems?: Microsoft.OData.Service.Sample.TrippinInMemory.Models.PlanItem;
      
  }
  export interface PlanItem {
      PlanItemId: Edm.Int32;
      ConfirmationCode: Edm.String;
      StartsAt: Edm.DateTimeOffset;
      EndsAt: Edm.DateTimeOffset;
      Duration: Edm.Duration;
      
  }
  export interface Event {
      OccursAt: Microsoft.OData.Service.Sample.TrippinInMemory.Models.EventLocation;
      Description: Edm.String;
      
  }
  export interface PublicTransportation {
      SeatNumber: Edm.String;
      
  }
  export interface Flight {
      FlightNumber: Edm.String;
      Airline?: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Airline;
      From?: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Airport;
      To?: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Airport;
      
  }
  export interface Employee {
      Cost: Edm.Int64;
      Peers?: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Person;
      
  }
  export interface Manager {
      Budget: Edm.Int64;
      BossOffice: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Location;
      DirectReports?: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Person;
      
  }
  export interface Location {
      Address: Edm.String;
      City: Microsoft.OData.Service.Sample.TrippinInMemory.Models.City;
      
  }
  export interface City {
      Name: Edm.String;
      CountryRegion: Edm.String;
      Region: Edm.String;
      
  }
  export interface AirportLocation {
      Loc: Edm.GeographyPoint;
      
  }
  export interface EventLocation {
      BuildingInfo: Edm.String;
      
  }
  // Enum Values: Male = 0, Female = 1, Unknow = 2
  export type PersonGender = "Male" | "Female" | "Unknow";
  // Enum Values: Feature1 = 0, Feature2 = 1, Feature3 = 2, Feature4 = 3
  export type Feature = "Feature1" | "Feature2" | "Feature3" | "Feature4";

  export class Container extends odatatools.ProxyBase {
      constructor(address: string, name?: string, additionalHeaders?: odatajs.Header) {
          super(address, name, additionalHeaders);
          this.People = new PeopleEntitySet("People", address, "UserName", additionalHeaders);
          this.Airlines = new AirlinesEntitySet("Airlines", address, "AirlineCode", additionalHeaders);
          this.Airports = new AirportsEntitySet("Airports", address, "Name", additionalHeaders);
          this.NewComePeople = new NewComePeopleEntitySet("NewComePeople", address, "UserName", additionalHeaders);
      }
      People: PeopleEntitySet;
      Airlines: AirlinesEntitySet;
      Airports: AirportsEntitySet;
      NewComePeople: NewComePeopleEntitySet;
      
      // Unbound Functions

      GetPersonWithMostFriends(): Promise<Microsoft.OData.Service.Sample.TrippinInMemory.Models.Person> {
          return new Promise<Microsoft.OData.Service.Sample.TrippinInMemory.Models.Person>((resolve, reject) => {
              let request: odatajs.Request = {
                  headers: this.Headers,
                  method: "GET",
                  requestUri: this.Address + "/GetPersonWithMostFriends()",
              }
              odatajs.oData.request(request, (data, response) => {
                  resolve(data.value || data);
              }, (error) => {
                  console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                  reject(error);
              });
          });
      }
      GetNearestAirport(lat: Edm.Double, lon: Edm.Double): Promise<Microsoft.OData.Service.Sample.TrippinInMemory.Models.Airport> {
          return new Promise<Microsoft.OData.Service.Sample.TrippinInMemory.Models.Airport>((resolve, reject) => {
              let request: odatajs.Request = {
                  headers: this.Headers,
                  method: "GET",
                  requestUri: this.Address + "/GetNearestAirport(lat="+lat+",lon="+lon+")",
              }
              odatajs.oData.request(request, (data, response) => {
                  resolve(data.value || data);
              }, (error) => {
                  console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                  reject(error);
              });
          });
      }

      //Unbound Actions

      ResetDataSource(): Promise<void> {
          return new Promise<void>((resolve, reject) => {
              let request: odatajs.Request = {
                  headers: this.Headers,
                  method: "POST",
                  requestUri: this.Address + "/ResetDataSource()",
                  data: {
                  },
              }
              odatajs.oData.request(request, (data, response) => {
                  resolve(data.value || data);
              }, (error) => {
                  console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                  reject(error);
              });
          });
      }
  }
  //EntitySets
  export class PeopleEntitySet extends odatatools.EntitySet<Microsoft.OData.Service.Sample.TrippinInMemory.Models.Person> {
      constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
          super(name, address, key, additionalHeaders);
      }

      // Bound to entity Actions
      ShareTrip(key: Edm.String, userName: Edm.String, tripId: Edm.Int32): Promise<void> {
          return new Promise<void>((resolve, reject) => {
              let request: odatajs.Request = {
                  headers: this.Headers,
                  method: "POST",
                  requestUri: this.Address + "(" + key + ")/Microsoft.OData.Service.Sample.TrippinInMemory.Models.ShareTrip()",
                  data: {
                      userName: userName,
                      tripId: tripId,
                  },
              }
              odatajs.oData.request(request, (data, response) => {
                  resolve(data.value || data);
              }, (error) => {
                  console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                  reject(error);
              });
          });
      }
      // Bound to entity Functions
      GetFavoriteAirline(person: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Person): Promise<Microsoft.OData.Service.Sample.TrippinInMemory.Models.Airline> {
          return new Promise<Microsoft.OData.Service.Sample.TrippinInMemory.Models.Airline>((resolve, reject) => {
              let request: odatajs.Request = {
                  headers: this.Headers,
                  method: "GET",
                  requestUri: this.Address + "(" + person + ")/Microsoft.OData.Service.Sample.TrippinInMemory.Models.GetFavoriteAirline()",
              }
              odatajs.oData.request(request, (data, response) => {
                  resolve(data.value || data);
              }, (error) => {
                  console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                  reject(error);
              });
          });
      }
      GetFriendsTrips(person: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Person, userName: Edm.String): Promise<Microsoft.OData.Service.Sample.TrippinInMemory.Models.Trip> {
          return new Promise<Microsoft.OData.Service.Sample.TrippinInMemory.Models.Trip>((resolve, reject) => {
              let request: odatajs.Request = {
                  headers: this.Headers,
                  method: "GET",
                  requestUri: this.Address + "(" + person + ")/Microsoft.OData.Service.Sample.TrippinInMemory.Models.GetFriendsTrips(userName="+userName+")",
              }
              odatajs.oData.request(request, (data, response) => {
                  resolve(data.value || data);
              }, (error) => {
                  console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                  reject(error);
              });
          });
      }
      UpdatePersonLastName(person: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Person, lastName: Edm.String): Promise<Edm.Boolean> {
          return new Promise<Edm.Boolean>((resolve, reject) => {
              let request: odatajs.Request = {
                  headers: this.Headers,
                  method: "GET",
                  requestUri: this.Address + "(" + person + ")/Microsoft.OData.Service.Sample.TrippinInMemory.Models.UpdatePersonLastName(lastName="+lastName+")",
              }
              odatajs.oData.request(request, (data, response) => {
                  resolve(data.value || data);
              }, (error) => {
                  console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                  reject(error);
              });
          });
      }
  }
  export class AirlinesEntitySet extends odatatools.EntitySet<Microsoft.OData.Service.Sample.TrippinInMemory.Models.Airline> {
      constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
          super(name, address, key, additionalHeaders);
      }

      
      
  }
  export class AirportsEntitySet extends odatatools.EntitySet<Microsoft.OData.Service.Sample.TrippinInMemory.Models.Airport> {
      constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
          super(name, address, key, additionalHeaders);
      }

      
      
  }
  export class NewComePeopleEntitySet extends odatatools.EntitySet<Microsoft.OData.Service.Sample.TrippinInMemory.Models.Person> {
      constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
          super(name, address, key, additionalHeaders);
      }

      // Bound to entity Actions
      ShareTrip(key: Edm.String, userName: Edm.String, tripId: Edm.Int32): Promise<void> {
          return new Promise<void>((resolve, reject) => {
              let request: odatajs.Request = {
                  headers: this.Headers,
                  method: "POST",
                  requestUri: this.Address + "(" + key + ")/Microsoft.OData.Service.Sample.TrippinInMemory.Models.ShareTrip()",
                  data: {
                      userName: userName,
                      tripId: tripId,
                  },
              }
              odatajs.oData.request(request, (data, response) => {
                  resolve(data.value || data);
              }, (error) => {
                  console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                  reject(error);
              });
          });
      }
      // Bound to entity Functions
      GetFavoriteAirline(person: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Person): Promise<Microsoft.OData.Service.Sample.TrippinInMemory.Models.Airline> {
          return new Promise<Microsoft.OData.Service.Sample.TrippinInMemory.Models.Airline>((resolve, reject) => {
              let request: odatajs.Request = {
                  headers: this.Headers,
                  method: "GET",
                  requestUri: this.Address + "(" + person + ")/Microsoft.OData.Service.Sample.TrippinInMemory.Models.GetFavoriteAirline()",
              }
              odatajs.oData.request(request, (data, response) => {
                  resolve(data.value || data);
              }, (error) => {
                  console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                  reject(error);
              });
          });
      }
      GetFriendsTrips(person: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Person, userName: Edm.String): Promise<Microsoft.OData.Service.Sample.TrippinInMemory.Models.Trip> {
          return new Promise<Microsoft.OData.Service.Sample.TrippinInMemory.Models.Trip>((resolve, reject) => {
              let request: odatajs.Request = {
                  headers: this.Headers,
                  method: "GET",
                  requestUri: this.Address + "(" + person + ")/Microsoft.OData.Service.Sample.TrippinInMemory.Models.GetFriendsTrips(userName="+userName+")",
              }
              odatajs.oData.request(request, (data, response) => {
                  resolve(data.value || data);
              }, (error) => {
                  console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                  reject(error);
              });
          });
      }
      UpdatePersonLastName(person: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Person, lastName: Edm.String): Promise<Edm.Boolean> {
          return new Promise<Edm.Boolean>((resolve, reject) => {
              let request: odatajs.Request = {
                  headers: this.Headers,
                  method: "GET",
                  requestUri: this.Address + "(" + person + ")/Microsoft.OData.Service.Sample.TrippinInMemory.Models.UpdatePersonLastName(lastName="+lastName+")",
              }
              odatajs.oData.request(request, (data, response) => {
                  resolve(data.value || data);
              }, (error) => {
                  console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                  reject(error);
              });
          });
      }
  }
}


}