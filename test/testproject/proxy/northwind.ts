/**************************************************************************
Created by odatatools: https://marketplace.visualstudio.com/items?itemName=apazureck.odatatools
Use Command 'odata: xyUpdate to refresh data while this file is active in the editor.
Creation Time: Thu Jan 18 2018 11:09:28 GMT+0100 (Mitteleuropäische Zeit)
DO NOT DELETE THIS IN ORDER TO UPDATE YOUR SERVICE
#ODATATOOLSOPTIONS
{
	"modularity": "Ambient",
	"requestOptions": {},
	"source": "http://services.odata.org/V4/Northwind/Northwind.svc/$metadata",
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
          if (id) {
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


namespace NorthwindModel {

  export interface Category {
    CategoryID: Edm.Int32;
    CategoryName: Edm.String;
    Description: Edm.String;
    Picture: Edm.Binary;
    Products?: NorthwindModel.Product;

  }
  export interface CustomerDemographic {
    CustomerTypeID: Edm.String;
    CustomerDesc: Edm.String;
    Customers?: NorthwindModel.Customer;

  }
  export interface Customer {
    CustomerID: Edm.String;
    CompanyName: Edm.String;
    ContactName: Edm.String;
    ContactTitle: Edm.String;
    Address: Edm.String;
    City: Edm.String;
    Region: Edm.String;
    PostalCode: Edm.String;
    Country: Edm.String;
    Phone: Edm.String;
    Fax: Edm.String;
    Orders?: NorthwindModel.Order;
    CustomerDemographics?: NorthwindModel.CustomerDemographic;

  }
  export interface Employee {
    EmployeeID: Edm.Int32;
    LastName: Edm.String;
    FirstName: Edm.String;
    Title: Edm.String;
    TitleOfCourtesy: Edm.String;
    BirthDate: Edm.DateTimeOffset;
    HireDate: Edm.DateTimeOffset;
    Address: Edm.String;
    City: Edm.String;
    Region: Edm.String;
    PostalCode: Edm.String;
    Country: Edm.String;
    HomePhone: Edm.String;
    Extension: Edm.String;
    Photo: Edm.Binary;
    Notes: Edm.String;
    ReportsTo: Edm.Int32;
    PhotoPath: Edm.String;
    Employees1?: NorthwindModel.Employee;
    Employee1?: NorthwindModel.Employee;
    Orders?: NorthwindModel.Order;
    Territories?: NorthwindModel.Territory;

  }
  export interface Order_Detail {
    OrderID: Edm.Int32;
    ProductID: Edm.Int32;
    UnitPrice: Edm.Decimal;
    Quantity: Edm.Int16;
    Discount: Edm.Single;
    Order?: NorthwindModel.Order;
    Product?: NorthwindModel.Product;

  }
  export interface Order {
    OrderID: Edm.Int32;
    CustomerID: Edm.String;
    EmployeeID: Edm.Int32;
    OrderDate: Edm.DateTimeOffset;
    RequiredDate: Edm.DateTimeOffset;
    ShippedDate: Edm.DateTimeOffset;
    ShipVia: Edm.Int32;
    Freight: Edm.Decimal;
    ShipName: Edm.String;
    ShipAddress: Edm.String;
    ShipCity: Edm.String;
    ShipRegion: Edm.String;
    ShipPostalCode: Edm.String;
    ShipCountry: Edm.String;
    Customer?: NorthwindModel.Customer;
    Employee?: NorthwindModel.Employee;
    Order_Details?: NorthwindModel.Order_Detail;
    Shipper?: NorthwindModel.Shipper;

  }
  export interface Product {
    ProductID: Edm.Int32;
    ProductName: Edm.String;
    SupplierID: Edm.Int32;
    CategoryID: Edm.Int32;
    QuantityPerUnit: Edm.String;
    UnitPrice: Edm.Decimal;
    UnitsInStock: Edm.Int16;
    UnitsOnOrder: Edm.Int16;
    ReorderLevel: Edm.Int16;
    Discontinued: Edm.Boolean;
    Category?: NorthwindModel.Category;
    Order_Details?: NorthwindModel.Order_Detail;
    Supplier?: NorthwindModel.Supplier;

  }
  export interface Region {
    RegionID: Edm.Int32;
    RegionDescription: Edm.String;
    Territories?: NorthwindModel.Territory;

  }
  export interface Shipper {
    ShipperID: Edm.Int32;
    CompanyName: Edm.String;
    Phone: Edm.String;
    Orders?: NorthwindModel.Order;

  }
  export interface Supplier {
    SupplierID: Edm.Int32;
    CompanyName: Edm.String;
    ContactName: Edm.String;
    ContactTitle: Edm.String;
    Address: Edm.String;
    City: Edm.String;
    Region: Edm.String;
    PostalCode: Edm.String;
    Country: Edm.String;
    Phone: Edm.String;
    Fax: Edm.String;
    HomePage: Edm.String;
    Products?: NorthwindModel.Product;

  }
  export interface Territory {
    TerritoryID: Edm.String;
    TerritoryDescription: Edm.String;
    RegionID: Edm.Int32;
    Region?: NorthwindModel.Region;
    Employees?: NorthwindModel.Employee;

  }
  export interface Alphabetical_list_of_product {
    ProductID: Edm.Int32;
    ProductName: Edm.String;
    SupplierID: Edm.Int32;
    CategoryID: Edm.Int32;
    QuantityPerUnit: Edm.String;
    UnitPrice: Edm.Decimal;
    UnitsInStock: Edm.Int16;
    UnitsOnOrder: Edm.Int16;
    ReorderLevel: Edm.Int16;
    Discontinued: Edm.Boolean;
    CategoryName: Edm.String;

  }
  export interface Category_Sales_for_1997 {
    CategoryName: Edm.String;
    CategorySales: Edm.Decimal;

  }
  export interface Current_Product_List {
    ProductID: Edm.Int32;
    ProductName: Edm.String;

  }
  export interface Customer_and_Suppliers_by_City {
    City: Edm.String;
    CompanyName: Edm.String;
    ContactName: Edm.String;
    Relationship: Edm.String;

  }
  export interface Invoice {
    ShipName: Edm.String;
    ShipAddress: Edm.String;
    ShipCity: Edm.String;
    ShipRegion: Edm.String;
    ShipPostalCode: Edm.String;
    ShipCountry: Edm.String;
    CustomerID: Edm.String;
    CustomerName: Edm.String;
    Address: Edm.String;
    City: Edm.String;
    Region: Edm.String;
    PostalCode: Edm.String;
    Country: Edm.String;
    Salesperson: Edm.String;
    OrderID: Edm.Int32;
    OrderDate: Edm.DateTimeOffset;
    RequiredDate: Edm.DateTimeOffset;
    ShippedDate: Edm.DateTimeOffset;
    ShipperName: Edm.String;
    ProductID: Edm.Int32;
    ProductName: Edm.String;
    UnitPrice: Edm.Decimal;
    Quantity: Edm.Int16;
    Discount: Edm.Single;
    ExtendedPrice: Edm.Decimal;
    Freight: Edm.Decimal;

  }
  export interface Order_Details_Extended {
    OrderID: Edm.Int32;
    ProductID: Edm.Int32;
    ProductName: Edm.String;
    UnitPrice: Edm.Decimal;
    Quantity: Edm.Int16;
    Discount: Edm.Single;
    ExtendedPrice: Edm.Decimal;

  }
  export interface Order_Subtotal {
    OrderID: Edm.Int32;
    Subtotal: Edm.Decimal;

  }
  export interface Orders_Qry {
    OrderID: Edm.Int32;
    CustomerID: Edm.String;
    EmployeeID: Edm.Int32;
    OrderDate: Edm.DateTimeOffset;
    RequiredDate: Edm.DateTimeOffset;
    ShippedDate: Edm.DateTimeOffset;
    ShipVia: Edm.Int32;
    Freight: Edm.Decimal;
    ShipName: Edm.String;
    ShipAddress: Edm.String;
    ShipCity: Edm.String;
    ShipRegion: Edm.String;
    ShipPostalCode: Edm.String;
    ShipCountry: Edm.String;
    CompanyName: Edm.String;
    Address: Edm.String;
    City: Edm.String;
    Region: Edm.String;
    PostalCode: Edm.String;
    Country: Edm.String;

  }
  export interface Product_Sales_for_1997 {
    CategoryName: Edm.String;
    ProductName: Edm.String;
    ProductSales: Edm.Decimal;

  }
  export interface Products_Above_Average_Price {
    ProductName: Edm.String;
    UnitPrice: Edm.Decimal;

  }
  export interface Products_by_Category {
    CategoryName: Edm.String;
    ProductName: Edm.String;
    QuantityPerUnit: Edm.String;
    UnitsInStock: Edm.Int16;
    Discontinued: Edm.Boolean;

  }
  export interface Sales_by_Category {
    CategoryID: Edm.Int32;
    CategoryName: Edm.String;
    ProductName: Edm.String;
    ProductSales: Edm.Decimal;

  }
  export interface Sales_Totals_by_Amount {
    SaleAmount: Edm.Decimal;
    OrderID: Edm.Int32;
    CompanyName: Edm.String;
    ShippedDate: Edm.DateTimeOffset;

  }
  export interface Summary_of_Sales_by_Quarter {
    ShippedDate: Edm.DateTimeOffset;
    OrderID: Edm.Int32;
    Subtotal: Edm.Decimal;

  }
  export interface Summary_of_Sales_by_Year {
    ShippedDate: Edm.DateTimeOffset;
    OrderID: Edm.Int32;
    Subtotal: Edm.Decimal;

  }

  //EntitySets
}


namespace ODataWebExperimental.Northwind.Model {


  export class NorthwindEntities extends odatatools.ProxyBase {
    constructor(address: string, name?: string, additionalHeaders?: odatajs.Header) {
      super(address, name, additionalHeaders);
      this.Categories = new CategoriesEntitySet("Categories", address, "CategoryID", additionalHeaders);
      this.CustomerDemographics = new CustomerDemographicsEntitySet("CustomerDemographics", address, "CustomerTypeID", additionalHeaders);
      this.Customers = new CustomersEntitySet("Customers", address, "CustomerID", additionalHeaders);
      this.Employees = new EmployeesEntitySet("Employees", address, "EmployeeID", additionalHeaders);
      this.Order_Details = new Order_DetailsEntitySet("Order_Details", address, "OrderID", additionalHeaders);
      this.Orders = new OrdersEntitySet("Orders", address, "OrderID", additionalHeaders);
      this.Products = new ProductsEntitySet("Products", address, "ProductID", additionalHeaders);
      this.Regions = new RegionsEntitySet("Regions", address, "RegionID", additionalHeaders);
      this.Shippers = new ShippersEntitySet("Shippers", address, "ShipperID", additionalHeaders);
      this.Suppliers = new SuppliersEntitySet("Suppliers", address, "SupplierID", additionalHeaders);
      this.Territories = new TerritoriesEntitySet("Territories", address, "TerritoryID", additionalHeaders);
      this.Alphabetical_list_of_products = new Alphabetical_list_of_productsEntitySet("Alphabetical_list_of_products", address, "ProductID", additionalHeaders);
      this.Category_Sales_for_1997 = new Category_Sales_for_1997EntitySet("Category_Sales_for_1997", address, "CategoryName", additionalHeaders);
      this.Current_Product_Lists = new Current_Product_ListsEntitySet("Current_Product_Lists", address, "ProductID", additionalHeaders);
      this.Customer_and_Suppliers_by_Cities = new Customer_and_Suppliers_by_CitiesEntitySet("Customer_and_Suppliers_by_Cities", address, "City", additionalHeaders);
      this.Invoices = new InvoicesEntitySet("Invoices", address, "ShipName", additionalHeaders);
      this.Order_Details_Extendeds = new Order_Details_ExtendedsEntitySet("Order_Details_Extendeds", address, "OrderID", additionalHeaders);
      this.Order_Subtotals = new Order_SubtotalsEntitySet("Order_Subtotals", address, "OrderID", additionalHeaders);
      this.Orders_Qries = new Orders_QriesEntitySet("Orders_Qries", address, "OrderID", additionalHeaders);
      this.Product_Sales_for_1997 = new Product_Sales_for_1997EntitySet("Product_Sales_for_1997", address, "CategoryName", additionalHeaders);
      this.Products_Above_Average_Prices = new Products_Above_Average_PricesEntitySet("Products_Above_Average_Prices", address, "ProductName", additionalHeaders);
      this.Products_by_Categories = new Products_by_CategoriesEntitySet("Products_by_Categories", address, "CategoryName", additionalHeaders);
      this.Sales_by_Categories = new Sales_by_CategoriesEntitySet("Sales_by_Categories", address, "CategoryID", additionalHeaders);
      this.Sales_Totals_by_Amounts = new Sales_Totals_by_AmountsEntitySet("Sales_Totals_by_Amounts", address, "SaleAmount", additionalHeaders);
      this.Summary_of_Sales_by_Quarters = new Summary_of_Sales_by_QuartersEntitySet("Summary_of_Sales_by_Quarters", address, "ShippedDate", additionalHeaders);
      this.Summary_of_Sales_by_Years = new Summary_of_Sales_by_YearsEntitySet("Summary_of_Sales_by_Years", address, "ShippedDate", additionalHeaders);
    }
    Categories: CategoriesEntitySet;
    CustomerDemographics: CustomerDemographicsEntitySet;
    Customers: CustomersEntitySet;
    Employees: EmployeesEntitySet;
    Order_Details: Order_DetailsEntitySet;
    Orders: OrdersEntitySet;
    Products: ProductsEntitySet;
    Regions: RegionsEntitySet;
    Shippers: ShippersEntitySet;
    Suppliers: SuppliersEntitySet;
    Territories: TerritoriesEntitySet;
    Alphabetical_list_of_products: Alphabetical_list_of_productsEntitySet;
    Category_Sales_for_1997: Category_Sales_for_1997EntitySet;
    Current_Product_Lists: Current_Product_ListsEntitySet;
    Customer_and_Suppliers_by_Cities: Customer_and_Suppliers_by_CitiesEntitySet;
    Invoices: InvoicesEntitySet;
    Order_Details_Extendeds: Order_Details_ExtendedsEntitySet;
    Order_Subtotals: Order_SubtotalsEntitySet;
    Orders_Qries: Orders_QriesEntitySet;
    Product_Sales_for_1997: Product_Sales_for_1997EntitySet;
    Products_Above_Average_Prices: Products_Above_Average_PricesEntitySet;
    Products_by_Categories: Products_by_CategoriesEntitySet;
    Sales_by_Categories: Sales_by_CategoriesEntitySet;
    Sales_Totals_by_Amounts: Sales_Totals_by_AmountsEntitySet;
    Summary_of_Sales_by_Quarters: Summary_of_Sales_by_QuartersEntitySet;
    Summary_of_Sales_by_Years: Summary_of_Sales_by_YearsEntitySet;

    // Unbound Functions


    //Unbound Actions

  }
  //EntitySets
  export class CategoriesEntitySet extends odatatools.EntitySet<NorthwindModel.Category> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class CustomerDemographicsEntitySet extends odatatools.EntitySet<NorthwindModel.CustomerDemographic> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class CustomersEntitySet extends odatatools.EntitySet<NorthwindModel.Customer> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class EmployeesEntitySet extends odatatools.EntitySet<NorthwindModel.Employee> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class Order_DetailsEntitySet extends odatatools.EntitySet<NorthwindModel.Order_Detail> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class OrdersEntitySet extends odatatools.EntitySet<NorthwindModel.Order> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class ProductsEntitySet extends odatatools.EntitySet<NorthwindModel.Product> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class RegionsEntitySet extends odatatools.EntitySet<NorthwindModel.Region> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class ShippersEntitySet extends odatatools.EntitySet<NorthwindModel.Shipper> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class SuppliersEntitySet extends odatatools.EntitySet<NorthwindModel.Supplier> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class TerritoriesEntitySet extends odatatools.EntitySet<NorthwindModel.Territory> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class Alphabetical_list_of_productsEntitySet extends odatatools.EntitySet<NorthwindModel.Alphabetical_list_of_product> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class Category_Sales_for_1997EntitySet extends odatatools.EntitySet<NorthwindModel.Category_Sales_for_1997> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class Current_Product_ListsEntitySet extends odatatools.EntitySet<NorthwindModel.Current_Product_List> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class Customer_and_Suppliers_by_CitiesEntitySet extends odatatools.EntitySet<NorthwindModel.Customer_and_Suppliers_by_City> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class InvoicesEntitySet extends odatatools.EntitySet<NorthwindModel.Invoice> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class Order_Details_ExtendedsEntitySet extends odatatools.EntitySet<NorthwindModel.Order_Details_Extended> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class Order_SubtotalsEntitySet extends odatatools.EntitySet<NorthwindModel.Order_Subtotal> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class Orders_QriesEntitySet extends odatatools.EntitySet<NorthwindModel.Orders_Qry> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class Product_Sales_for_1997EntitySet extends odatatools.EntitySet<NorthwindModel.Product_Sales_for_1997> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class Products_Above_Average_PricesEntitySet extends odatatools.EntitySet<NorthwindModel.Products_Above_Average_Price> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class Products_by_CategoriesEntitySet extends odatatools.EntitySet<NorthwindModel.Products_by_Category> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class Sales_by_CategoriesEntitySet extends odatatools.EntitySet<NorthwindModel.Sales_by_Category> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class Sales_Totals_by_AmountsEntitySet extends odatatools.EntitySet<NorthwindModel.Sales_Totals_by_Amount> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class Summary_of_Sales_by_QuartersEntitySet extends odatatools.EntitySet<NorthwindModel.Summary_of_Sales_by_Quarter> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
  export class Summary_of_Sales_by_YearsEntitySet extends odatatools.EntitySet<NorthwindModel.Summary_of_Sales_by_Year> {
    constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
      super(name, address, key, additionalHeaders);
    }



  }
}

