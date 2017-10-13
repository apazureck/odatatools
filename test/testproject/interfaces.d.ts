/**************************************************************************
Created by odatatools: https://marketplace.visualstudio.com/items?itemName=apazureck.odatatools
Use Command 'odata: xyUpdate to refresh data while this file is active in the editor.
Creation Time: Fri Oct 13 2017 18:48:48 GMT+0200 (Mitteleuropäische Sommerzeit)
DO NOT DELETE THIS IN ORDER TO UPDATE YOUR SERVICE
#ODATATOOLSOPTIONS
{
	"source": "http://http://services.odata.org/V4/(S(orqah5cghxizm4lomf2flrt0))/TripPinServiceRW/$metadata",
	"requestOptions": {}
}
#ODATATOOLSOPTIONSEND
**************************************************************************/



declare namespace ODataDemo {
    export interface Product {
        ID: Edm.Int32;
        Name: Edm.String;
        Description: Edm.String;
        ReleaseDate: Edm.DateTimeOffset;
        DiscontinuedDate: Edm.DateTimeOffset;
        Rating: Edm.Int16;
        Price: Edm.Double;
        Categories?: ODataDemo.Category[];
        Supplier?: ODataDemo.Supplier;
        ProductDetail?: ODataDemo.ProductDetail;

    }
    export interface FeaturedProduct {
        Advertisement?: ODataDemo.Advertisement;

    }
    export interface ProductDetail {
        ProductID: Edm.Int32;
        Details: Edm.String;
        Product?: ODataDemo.Product;

    }
    export interface Category {
        ID: Edm.Int32;
        Name: Edm.String;
        Products?: ODataDemo.Product[];
        [x: string]: any;
    }
    export interface Supplier {
        ID: Edm.Int32;
        Name: Edm.String;
        Address: ODataDemo.Address;
        Location: Edm.GeographyPoint;
        Concurrency: Edm.Int32;
        Products?: ODataDemo.Product[];

    }
    export interface Person {
        ID: Edm.Int32;
        Name: Edm.String;
        PersonDetail?: ODataDemo.PersonDetail;

    }
    export interface Customer {
        TotalExpense: Edm.Decimal;

    }
    export interface Employee {
        EmployeeID: Edm.Int64;
        HireDate: Edm.DateTimeOffset;
        Salary: Edm.Single;

    }
    export interface PersonDetail {
        PersonID: Edm.Int32;
        Age: Edm.Byte;
        Gender: Edm.Boolean;
        Phone: Edm.String;
        Address: ODataDemo.Address;
        Photo: Edm.Stream;
        Person?: ODataDemo.Person;

    }
    export interface Advertisement {
        ID: Edm.Guid;
        Name: Edm.String;
        AirDate: Edm.DateTimeOffset;
        FeaturedProduct?: ODataDemo.FeaturedProduct;

    }
    export interface Address {
        Street: Edm.String;
        City: Edm.String;
        State: Edm.String;
        ZipCode: Edm.String;
        Country: Edm.String;

    }
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