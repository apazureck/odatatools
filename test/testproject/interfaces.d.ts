/**************************************************************************
Created by odatatools: https://marketplace.visualstudio.com/items?itemName=apazureck.odatatools
Use Command 'odata: xyUpdate to refresh data while this file is active in the editor.
Creation Time: Mon Oct 16 2017 22:26:15 GMT+0200 (Mitteleuropäische Sommerzeit)
DO NOT DELETE THIS IN ORDER TO UPDATE YOUR SERVICE
#ODATATOOLSOPTIONS
{
	"source": "http://services.odata.org/TripPinRESTierService/(S(tq0v4cxv3cph5pkpi1qziqzc))/$metadata",
	"requestOptions": {},
	"useTemplate": "interfaces.ot"
}
#ODATATOOLSOPTIONSEND
**************************************************************************/



declare namespace Microsoft.OData.Service.Sample.TrippinInMemory.Models {
    export interface Person {
        UserName: Edm.String;
        FirstName: Edm.String;
        LastName: Edm.String;
        MiddleName: Edm.String;
        Gender: Microsoft.OData.Service.Sample.TrippinInMemory.Models.PersonGender;
        Age: Edm.Int64;
        Emails: Edm.String[];
        AddressInfo: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Location[];
        HomeAddress: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Location;
        FavoriteFeature: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Feature;
        Features: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Feature[];
        Friends?: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Person[];
        BestFriend?: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Person;
        Trips?: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Trip[];

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
        Tags: Edm.String[];
        StartsAt: Edm.DateTimeOffset;
        EndsAt: Edm.DateTimeOffset;
        PlanItems?: Microsoft.OData.Service.Sample.TrippinInMemory.Models.PlanItem[];

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
        Peers?: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Person[];

    }
    export interface Manager {
        Budget: Edm.Int64;
        BossOffice: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Location;
        DirectReports?: Microsoft.OData.Service.Sample.TrippinInMemory.Models.Person[];

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