declare namespace ODataTestService.Models {
    export interface Movie {
        Id: Edm.Int32;
        LenderId: Edm.Int32;
        Avaiable: Edm.Boolean;
        Rating: Edm.Single;
        Genre?: Edm.String;
        Lender?: ODataTestService.Models.Customer;
    }
    export interface DeltaMovie {
        Id?: Edm.Int32;
        LenderId?: Edm.Int32;
        Avaiable?: Edm.Boolean;
        Rating?: Edm.Single;
        Genre?: Edm.String;
        Lender?: ODataTestService.Models.Customer;
    }
    export interface Customer {
        Id: Edm.Int32;
        Name?: Edm.String;
        Age: Edm.Int32;
        Gender: ODataTestService.Models.Gender;
        Balance: Edm.Double;
        AddressId: Edm.Int32;
        Address: ODataTestService.Models.Address;
        Borrowed?: ODataTestService.Models.Movie[];
    }
    export interface DeltaCustomer {
        Id?: Edm.Int32;
        Name?: Edm.String;
        Age?: Edm.Int32;
        Gender?: ODataTestService.Models.Gender;
        Balance?: Edm.Double;
        AddressId?: Edm.Int32;
        Address?: ODataTestService.Models.Address;
        Borrowed?: ODataTestService.Models.Movie[];
    }
    export interface Address {
        Id: Edm.Int32;
        Street?: Edm.String;
        Zip?: Edm.String;
        Inhabitants?: ODataTestService.Models.Customer[];
    }
    export interface DeltaAddress {
        Id?: Edm.Int32;
        Street?: Edm.String;
        Zip?: Edm.String;
        Inhabitants?: ODataTestService.Models.Customer[];
    }
    type Gender = "Male" | "Female" | "Other";
}
declare namespace MovieService {
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
}
/// Do not modify this line to being able to update your interfaces again:
/// #odata.source = 'http://localhost:2200/moviedb/$metadata'