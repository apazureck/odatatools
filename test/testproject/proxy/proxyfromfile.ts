/**************************************************************************
Created by odatatools: https://marketplace.visualstudio.com/items?itemName=apazureck.odatatools
Use Command 'odata: xyUpdate to refresh data while this file is active in the editor.
Creation Time: Sun Mar 11 2018 21:33:26 GMT+0100 (Mitteleuropäische Zeit)
DO NOT DELETE THIS IN ORDER TO UPDATE YOUR SERVICE
#ODATATOOLSOPTIONS
{
	"modularity": "Ambient",
	"requestOptions": {},
	"source": "file:///C:/dev/odatatools/test/testproject/test/testmetadata.xml",
	"useTemplate": "fileproxy.ot"
}
#ODATATOOLSOPTIONSEND
**************************************************************************/



// Base classes ##########################################################
// Leave this in order to use the base classes

namespace filewrapper {
    namespace odatatools {
        enum Method {
            GET, POST, PUT, PATCH, DELETE
        }

        export class ProxyBase {
            constructor(protected readonly _odataServiceAddress: string, public readonly Name?: string, additonalHeaders?: odatajs.Header) {
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
                this._odataServiceAddress = address.replace(/\/$/, "") + "/" + name;
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
            protected readonly _odataServiceAddress: string;

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
                        requri = this._odataServiceAddress + "(" + id + ")";
                    } else {
                        requri = this._odataServiceAddress;
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
                        requestUri: this._odataServiceAddress + "(" + value[this.Key] + ")",
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
                        requestUri: this._odataServiceAddress,
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
                        requestUri: this._odataServiceAddress,
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
                        requestUri: this._odataServiceAddress + "(" + value[this.Key] + ")"
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
                    const requri = this._odataServiceAddress + "/$count/" + this.resolveODataOptions();
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


    namespace Ephorte {

        // Entity types
        export interface BuildingFloor {
            Id: Edm.Int32;
            BuildingApplicationInitiativeId: Edm.Int32;
            SortOrder: Edm.Int16;
            FloorTypeId: Edm.String;
            FloorNumber: Edm.Int16;
            NumberOfLivingUnits: Edm.Int16;
            LivableArea: Edm.Decimal;
            GrossArea: Edm.Decimal;
            MatrikkelStatusId: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            BuildingApplicationInitiative?: Ephorte.BuildingApplicationInitiative;
            FloorType?: Ephorte.FloorType;
            MatrikkelStatus?: Ephorte.MatrikkelStatus;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface BuildingInformation {
            DummyKey: Edm.Int32;
            AreaBuiltAreaExistingBuildings: Edm.Double;
            AreaBuiltAreaNewBuildings: Edm.Double;
            AreaBuiltAreaOpenAreas: Edm.Double;
            AreaBuiltAreaSummary: Edm.Double;
            AreaLivingAreaExistingBuildings: Edm.Double;
            AreaLivingAreaNewBuildings: Edm.Double;
            AreaLivingAreaOpenAreas: Edm.Double;
            AreaLivingAreaSummary: Edm.Double;
            AreaBuiltAreaExistingBuildingsMiscellaneous: Edm.Double;
            AreaBuiltAreaNewBuildingsMiscellaneous: Edm.Double;
            AreaBuiltAreaOpenAreasMiscellaneous: Edm.Double;
            AreaLivingAreaMiscellaneousSummary: Edm.Double;
            AreaBuiltAreaExistingBuildingsTotal: Edm.Double;
            AreaLivingAreaNewBuildingsTotal: Edm.Double;
            AreaLivingAreaOpenAreasTotal: Edm.Double;
            AreaLivingAreaBuildingsTotalSummary: Edm.Double;
            NumberOfFloors: Edm.Int32;
            NumberOfUsageUnits: Edm.Int32;
            NumberOfUsageUnitsHousing: Edm.Int32;
            NumberOfUsageUnitsMiscellaneous: Edm.Int32;
            NumberOfExistingUsageUnits: Edm.Int32;
            NumberOfExistingUsageUnitsHousing: Edm.Int32;
            NumberOfExistingUsageUnitsMiscellaneous: Edm.Int32;
            NumberOfNewUsageUnits: Edm.Int32;
            NumberOfNewUsageUnitsHousing: Edm.Int32;
            NumberOfNewUsageUnitsMiscellaneous: Edm.Int32;
            NumberOfRemovedUsageUnits: Edm.Int32;
            NumberOfRemovedUsageUnitsHousing: Edm.Int32;
            NumberOfRemovedUsageUnitsMiscellaneous: Edm.Int32;
            FormFields?: Ephorte.FormFieldMetadata[];

        }
        export interface Buildings {
            DummyKey: Edm.Int32;
            LandUse?: Ephorte.LandUse;
            BuildingInformation?: Ephorte.BuildingInformation;
            TechnicalInstallations?: Ephorte.TechnicalInstallations;

        }
        export interface Formal {
            DummyKey: Edm.Int32;
            ConstructionTypeId: Edm.Int32;
            IndustryGroupId: Edm.String;
            BuildingTypeId: Edm.String;
            ConstructionType?: Ephorte.ConstructionType;
            IndustryGroup?: Ephorte.IndustryGroup;
            BuildingType?: Ephorte.BuildingType;

        }
        export interface GeneralTerms {
            DummyKey: Edm.Int32;
            IsSelfBuilder: Edm.Boolean;
            IsApprovedFor3WeekDeadLine: Edm.Boolean;
            IsBuildingsBefore1850: Edm.Boolean;
            HasAppliedForDeviationFromTEK: Edm.Boolean;
            IsPreConstructionMeetingHeld: Edm.Boolean;
            IsIndependentControlMandatory: Edm.Boolean;
            IsAffectingJobs: Edm.Boolean;
            IsWastePlanMade: Edm.Boolean;
            NeedsPermission: Edm.Boolean;

        }
        export interface Infrastructure {
            DummyKey: Edm.Int32;
            Sewage: Edm.String;
            SewageConnectionTypeId: Edm.Int32;
            ShouldWcBeInstalled: Edm.Boolean;
            ExistsEmissionPermit: Edm.Boolean;
            IsSewerageCrossingOtherProperty: Edm.Boolean;
            ExistsCrossingPermit: Edm.Boolean;
            SurfaceWater: Edm.String;
            Road?: Ephorte.Road;
            WaterSupply?: Ephorte.WaterSupply;
            SewageConnectionType?: Ephorte.SewageConnectionType;

        }
        export interface LandUse {
            DummyKey: Edm.Int32;
            PropertyAreaBuildings: Edm.Double;
            PropertyAreaDeduction: Edm.Double;
            PropertyAreaAddition: Edm.Double;
            PropertyAreaCalculated: Edm.Double;
            CalculatedMaxBuildingArea: Edm.Double;
            AreaExistingBuildings: Edm.Double;
            AreaToTearDown: Edm.Double;
            AreaNewBuildings: Edm.Double;
            ParkingArea: Edm.Double;
            SummaryArea: Edm.Double;
            ExploitationDegree: Edm.Double;
            BuiltAreaNewDevelopment: Edm.Double;
            LivableAreaNewDevelopment: Edm.Double;
            FormFields?: Ephorte.FormFieldMetadata[];

        }
        export interface LocationConflict {
            DummyKey: Edm.Int32;
            HasConflictHighVoltagePowerLine: Edm.Boolean;
            HasConflictWaterAndSewerage: Edm.Boolean;

        }
        export interface MatrikkelStatus {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface MetadataMapping {
            Id: Edm.Int32;
            TableType: Edm.String;
            Tag: Edm.String;
            Format: Edm.String;
            Field: Edm.String;
            Default: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Notification {
            Id: Edm.Int32;
            PredefinedQueryId: Edm.Int32;
            NotifyUserId: Edm.Int32;
            JobSchedule: Edm.String;
            NotificationMethodId: Edm.String;
            LastUpdated: Edm.DateTimeOffset;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            PredefinedQuery?: Ephorte.PredefinedQuery;
            NotifyUser?: Ephorte.User;
            NotificationMethod?: Ephorte.NotificationMethod;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface NotificationMethod {
            Id: Edm.String;
            Description: Edm.String;
            LastUpdated: Edm.DateTimeOffset;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Notifications {
            DummyKey: Edm.Int32;
            AreAllNeigboursNotified: Edm.Boolean;
            IsExemptedFromNeighbourNotice: Edm.Boolean;
            HaveNeighbourRemarks: Edm.Boolean;
            NumberOfProtests: Edm.Boolean;
            EvaluationOfProtest: Edm.String;
            ApplicationUrl: Edm.String;
            ApplicationLocation: Edm.String;
            ApplicationContact: Edm.String;

        }
        export interface ObjectStatus {
            SystemId: Edm.Guid;
            ObjectType: Edm.String;
            ObjectSystemId: Edm.Guid;
            Status: Edm.String;
            Timestamp: Edm.DateTimeOffset;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Plan {
            DummyKey: Edm.Int32;
            UtilizationRate: Edm.Double;
            PlanTypeId: Edm.String;
            PlanName: Edm.String;
            RegulationPurpose: Edm.String;
            OtherRequirements: Edm.String;
            CalculationRuleId: Edm.Int32;
            PlanType?: Ephorte.LandPlanType;
            CalculationRule?: Ephorte.CalculationRule;
            FormFields?: Ephorte.FormFieldMetadata[];

        }
        export interface GeographicalObject {
            Id: Edm.Int32;
            GeographicalObjectTypeId: Edm.String;
            HasAttemptedToDetermineCoordinates: Edm.Boolean;
            CreatedByUserNameId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            LastUpdated: Edm.DateTimeOffset;
            SynchronizedDate: Edm.DateTimeOffset;
            Description: Edm.String;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            WktData: Edm.String;
            IncludeWktData: Edm.Boolean;
            Operation: Ephorte.Operation;
            GeographicalObjectType?: Ephorte.GeographicalObjectType;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            Wkt?: Ephorte.Wkt;
            EntityLink?: Ephorte.GeographicalObjectLink;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Area extends Ephorte.GeographicalObject {
            CoordinateSystem: Edm.String;

        }
        export interface RequirementsBuildingFoundation {
            DummyKey: Edm.Int32;
            IsFloodExposed: Edm.Boolean;
            IsFloodExposedF1: Edm.Boolean;
            IsFloodExposedF2: Edm.Boolean;
            IsFloodExposedF3: Edm.Boolean;
            IsAvalancheExposed: Edm.Boolean;
            IsAvalancheExposedS1: Edm.Boolean;
            IsAvalancheExposedS2: Edm.Boolean;
            IsAvalancheExposedS3: Edm.Boolean;
            OtherEnvironmentalInconvenience: Edm.Boolean;

        }
        export interface Road {
            DummyKey: Edm.Int32;
            HasNewOrChangedAccess: Edm.Boolean;
            IsPermissionGivenCountyRoad: Edm.Boolean;
            IsPermissionGivenMunicipalityRoad: Edm.Boolean;
            IsPermissionGivenPrivateRoad: Edm.Boolean;

        }
        export interface ShortageSeverityType {
            Id: Edm.Int32;
            ShortCode: Edm.String;
            Description: Edm.String;
            Remark: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface TaskCheckPointType {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface TaskDMB {
            Id: Edm.Int32;
            TaskId: Edm.Int32;
            DmbId: Edm.Int32;
            MeetingCaseTypeId: Edm.String;
            SortOrder: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Task?: Ephorte.Task;
            Dmb?: Ephorte.DMB;
            MeetingCaseType?: Ephorte.MeetingCaseType;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface TaskDocument {
            Id: Edm.Int32;
            TaskDecisionCodeId: Edm.String;
            TaskId: Edm.Int32;
            Document: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            TaskDecisionCode?: Ephorte.TaskDecisionCode;
            Task?: Ephorte.Task;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface TaskDocumentTemplateModel {
            Id: Edm.Int32;
            Category: Edm.String;
            Reference: Edm.String;
            Remark: Edm.String;
            ProcessingText: Edm.String;
            DecisionText: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface TaskFunction {
            DummyKey: Edm.Int32;
            Id: Edm.String;
            Description: Edm.String;

        }
        export interface TechnicalInstallations {
            DummyKey: Edm.Int32;
            IsLiftingDeviceInBuilding: Edm.Boolean;
            IsLiftingDeviceInBuildingPlanned: Edm.Boolean;
            IsElevatorPlanned: Edm.Boolean;
            IsStairLiftPlanned: Edm.Boolean;
            IsEscalatorPlanned: Edm.Boolean;
            FormFields?: Ephorte.FormFieldMetadata[];

        }
        export interface UsageUnit {
            Id: Edm.Int32;
            BuildingApplicationInitiativeId: Edm.Int32;
            UnityNumber: Edm.String;
            NumberOfRooms: Edm.Int16;
            NumberOfBathRooms: Edm.Int16;
            NumberOfWC: Edm.Int16;
            AddressId: Edm.Int32;
            MatrikkelUnit: Edm.String;
            MatrikkelStatusId: Edm.String;
            UsageUnitCodeId: Edm.String;
            KitchenCodeId: Edm.String;
            LivableArea: Edm.Decimal;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            BuildingApplicationInitiative?: Ephorte.BuildingApplicationInitiative;
            Address?: Ephorte.HomeAddress;
            MatrikkelStatus?: Ephorte.MatrikkelStatus;
            UsageUnitCode?: Ephorte.UsageUnitCode;
            KitchenCode?: Ephorte.KitchenCode;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface UsageUnitCode {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface WorkItem {
            ItemId: Edm.Int32;
            Description: Edm.String;
            Seektype: Edm.String;
            DueDate: Edm.Date;
            Type: Edm.String;
            Status: Edm.String;
            DoneDate: Edm.Date;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            CaseWorker?: Ephorte.DOM.Model.CaseWorkerWorkItem;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface WaterSupply {
            DummyKey: Edm.Int32;
            WaterSupplyConnectionTypeId: Edm.Int32;
            OtherWaterSupplyConnection: Edm.String;
            IsWaterSupplyConnectionCrossingOtherProperty: Edm.Boolean;
            RegisteredDeclaration: Edm.Boolean;
            WaterSupplyConnectionType?: Ephorte.WaterSupplyConnectionType;

        }
        export interface ActionLink {
            Id: Edm.Int32;
            ApplicationInitiativeId: Edm.Int32;
            ActionTypeId: Edm.String;
            SortOrder: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            ApplicationInitiative?: Ephorte.BuildingApplicationInitiative;
            ActionType?: Ephorte.BuildingAction;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface BuildingCaseLocationLink {
            Id: Edm.Int32;
            CaseId: Edm.Int32;
            PropertyBuildingSiteId: Edm.Int32;
            SortOrder: Edm.Int32;
            PointCoordinates: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Case?: Ephorte.Case;
            PropertyBuildingSite?: Ephorte.PropertyBuildingSite;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CalculationRule {
            Id: Edm.Int32;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CaseTitleTemplate {
            Id: Edm.Int32;
            Title: Edm.String;
            ProcessCategoryId: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            ProcessCategory?: Ephorte.ProcessCategory;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ActionPurpose {
            Id: Edm.Int32;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ApplicationBuildingLocationLink {
            Id: Edm.Int32;
            RegistryEntryId: Edm.Int32;
            PropertyBuildingSiteId: Edm.Int32;
            SortOrder: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            RegistryEntry?: Ephorte.RegistryEntry;
            PropertyBuildingSite?: Ephorte.PropertyBuildingSite;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface BuildingApplicationInitiative {
            Id: Edm.Int32;
            RegistryEntryId: Edm.Int32;
            BuildingId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            CoverLetter: Edm.String;
            Operation: Ephorte.Operation;
            RegistryEntry?: Ephorte.RegistryEntry;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            Formal?: Ephorte.Formal;
            LocationConflict?: Ephorte.LocationConflict;
            Infrastructure?: Ephorte.Infrastructure;
            Buildings?: Ephorte.Buildings;
            ActionPurposes?: Ephorte.InitiativePurposeLink[];
            ActionLinks?: Ephorte.ActionLink[];
            RoadTypes?: Ephorte.RoadTypeLink[];
            EnergySupplies?: Ephorte.EnergySupply[];
            HeatDistributions?: Ephorte.HeatDistribution[];
            UsageUnits?: Ephorte.UsageUnit[];
            BuildingFloors?: Ephorte.BuildingFloor[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ConstructionType {
            Id: Edm.Int32;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Country {
            TwoLetterCountryCode: Edm.String;
            Name: Edm.String;
            ThreeLetterCountryCode: Edm.String;
            ThreeDigitCountryCode: Edm.Int16;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface EnergySupply {
            Id: Edm.Int32;
            ApplicationInitiativeId: Edm.Int32;
            EnergySupplyTypeId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            ApplicationInitiative?: Ephorte.BuildingApplicationInitiative;
            EnergySupplyType?: Ephorte.EnergySupplyType;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface EnergySupplyType {
            Id: Edm.Int32;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface GeneralConditions {
            Id: Edm.Int32;
            RegistryEntryId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            RegistryEntry?: Ephorte.RegistryEntry;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            GeneralTerms?: Ephorte.GeneralTerms;
            Plan?: Ephorte.Plan;
            RequirementsBuildingFoundation?: Ephorte.RequirementsBuildingFoundation;
            Notifications?: Ephorte.Notifications;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface GiRegulationPlan {
            PlanId: Edm.String;
            PlanName: Edm.String;
            PlanStatus: Edm.String;
            PlanType: Edm.String;
            PlanDocumentationUpdated: Edm.Boolean;
            UnprocessedProtest: Edm.Boolean;
            UnprocessedComplain: Edm.Boolean;
            DecisionDate: Edm.DateTimeOffset;

        }
        export interface ProcessCategory {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface RegistryEntryTitleTemplate {
            Id: Edm.Int32;
            Title: Edm.String;
            DocumentCategoryId: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            DocumentCategory?: Ephorte.DocumentCategory;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface FloorType {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface HeatDistribution {
            Id: Edm.Int32;
            ApplicationInitiativeId: Edm.Int32;
            HeatDistributionTypeId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            ApplicationInitiative?: Ephorte.BuildingApplicationInitiative;
            HeatDistributionType?: Ephorte.HeatDistributionType;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface HeatDistributionType {
            Id: Edm.Int32;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface HomeAddress {
            Id: Edm.Int32;
            AddressCode: Edm.String;
            AddressName: Edm.String;
            AddressNumber: Edm.String;
            AddressLetter: Edm.String;
            SectionNumber: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface IndustryGroup {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface InitiativePurposeLink {
            Id: Edm.Int32;
            ApplicationInitiativeId: Edm.Int32;
            ActionPurposeId: Edm.Int32;
            SortOrder: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            ApplicationInitiative?: Ephorte.BuildingApplicationInitiative;
            ActionPurpose?: Ephorte.ActionPurpose;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface KitchenCode {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface PropertyBuildingSite {
            Id: Edm.Int32;
            MunicipalityNumber: Edm.String;
            CadastralUnitNumber: Edm.Int32;
            PropertyUnitNumber: Edm.Int32;
            LeaseholdUnitNumber: Edm.Int32;
            SectionUnitNumber: Edm.Int32;
            Address: Edm.String;
            PostalCode: Edm.String;
            City: Edm.String;
            TwoLetterCountryCode: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Country?: Ephorte.Country;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface RoadType {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface RoadTypeLink {
            Id: Edm.Int32;
            ApplicationInitiativeId: Edm.Int32;
            RoadTypeId: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            ApplicationInitiative?: Ephorte.BuildingApplicationInitiative;
            RoadType?: Ephorte.RoadType;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface SewageConnectionType {
            Id: Edm.Int32;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface WaterSupplyConnectionType {
            Id: Edm.Int32;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Widget {
            Id: Edm.Int32;
            Title: Edm.String;
            Type: Edm.String;
            Description: Edm.String;
            QueryId: Edm.Int32;
            MinWidth: Edm.Int32;
            MinHeight: Edm.Int32;
            DefaultWidth: Edm.Int32;
            DefaultHeight: Edm.Int32;
            Settings: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            AvailableForModule: Edm.String;
            Operation: Ephorte.Operation;
            Query?: Ephorte.PredefinedQuery;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            Roles?: Ephorte.WidgetRoleLink[];
            Users?: Ephorte.WidgetUserLink[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface WidgetRoleLink {
            Id: Edm.Int32;
            RoleId: Edm.Int32;
            WidgetId: Edm.Int32;
            HorisontalPotition: Edm.Int32;
            VerticalPotition: Edm.Int32;
            Height: Edm.Int32;
            Width: Edm.Int32;
            AvailableFromDate: Edm.Date;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Settings: Edm.String;
            Operation: Ephorte.Operation;
            Role?: Ephorte.Role;
            Widget?: Ephorte.Widget;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface WidgetUserLink {
            Id: Edm.Int32;
            UserId: Edm.Int32;
            WidgetId: Edm.Int32;
            HorisontalPotition: Edm.Int32;
            VerticalPotition: Edm.Int32;
            Height: Edm.Int32;
            Width: Edm.Int32;
            Settings: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            User?: Ephorte.User;
            Widget?: Ephorte.Widget;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface AccessGroupMembership {
            UserId: Edm.Int32;
            AccessGroupId: Edm.Int32;
            UserRoleId: Edm.Int32;
            HasWriteAccess: Edm.Boolean;
            GrantedByUserId: Edm.Int32;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            SuspendedByUserId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            User?: Ephorte.User;
            AccessGroup?: Ephorte.AccessGroup;
            UserRole?: Ephorte.Role;
            GrantedByUser?: Ephorte.User;
            SuspendedByUser?: Ephorte.User;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface AdditionalLogin {
            Id: Edm.Int32;
            Database: Edm.String;
            UserId: Edm.Int32;
            LoginUserId: Edm.String;
            LoginPassword: Edm.String;
            LoginRoleTitle: Edm.String;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            DatabaseInfo?: Ephorte.DatabaseInfo;
            User?: Ephorte.User;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface AddressGroupMembership {
            AddressGroupId: Edm.Int32;
            AddressId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            AddressGroup?: Ephorte.AddressGroup;
            Address?: Ephorte.Address;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface AdministrativeUnitRelation {
            SuccessorAdministrativeUnitId: Edm.Int32;
            PredecessorAdministrativeUnitId: Edm.Int32;
            Remark: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            SuccessorAdministrativeUnit?: Ephorte.AdministrativeUnit;
            PredecessorAdministrativeUnit?: Ephorte.AdministrativeUnit;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CommitteeHandlingStatus {
            Id: Edm.String;
            Description: Edm.String;
            IsAllowedOnCasePlan: Edm.Boolean;
            IsAllowedOnQueueList: Edm.Boolean;
            IsOnCasePlan: Edm.Boolean;
            IsProcessed: Edm.Boolean;
            SortOrderQueueList: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CustomerFunctions {
            Id: Edm.Int32;
            Description: Edm.String;
            ObjectType: Edm.Int32;
            SortOrder: Edm.Int32;
            ProfileNumber: Edm.Int32;
            Function: Edm.String;
            ParametersList: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CustomField {
            Id: Edm.Int32;
            ObjectType: Edm.Int32;
            ObjectCode: Edm.String;
            SortOrder: Edm.Int32;
            Text: Edm.String;
            FieldType: Edm.Int32;
            FieldLength: Edm.Int32;
            SqlString: Edm.String;
            Required: Edm.Boolean;
            DefaultValue: Edm.String;
            Description: Edm.String;
            Format: Edm.String;
            IsRestricted: Edm.Boolean;
            ValueListId: Edm.Boolean;
            Repeating: Edm.Boolean;
            Xsd: Edm.String;
            CaseSensitive: Edm.Boolean;
            IncludeInSchema: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Dispensation {
            Id: Edm.Int32;
            CaseId: Edm.Int32;
            RegistryEntryId: Edm.Int32;
            DispensationTypeId: Edm.String;
            ReasonDescription: Edm.String;
            PlanId: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Case?: Ephorte.Case;
            RegistryEntry?: Ephorte.RegistryEntry;
            DispensationType?: Ephorte.DispensationType;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DocumentType {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface FormFieldMetadata {
            DummyKey: Edm.Int32;
            Name: Edm.String;
            Header: Edm.String;
            Description: Edm.String;
            Caption: Edm.String;
            MaxSize: Edm.Int32;
            Format: Ephorte.DOM.Model.FieldFormatEnum;

        }
        export interface FondsCreatorMembership {
            FondsId: Edm.String;
            FondsCreatorId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Fonds?: Ephorte.Fonds;
            FondsCreator?: Ephorte.FondsCreator;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface LogEvent {
            Id: Edm.Int32;
            TableName: Edm.String;
            FieldName: Edm.String;
            TextTemplate: Edm.String;
            LogRead: Edm.Boolean;
            LogCreate: Edm.Boolean;
            LogUpdate: Edm.Boolean;
            LogDelete: Edm.Boolean;
            IsActive: Edm.Boolean;
            DaysToKeep: Edm.Int32;
            LogForAllUsers: Edm.Boolean;
            LogAllObjects: Edm.Boolean;
            Noark: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Table?: Ephorte.Table;
            Field?: Ephorte.TableField;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            LogObjects?: Ephorte.LogEventObject[];
            LogForUserNames?: Ephorte.LogEventUserName[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface MergeField {
            Name: Edm.String;
            Description: Edm.String;
            IsMailMerge: Edm.Boolean;
            FileTypeId: Edm.String;
            IsTableField: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            FileType?: Ephorte.FileType;
            MergeFieldContent?: Ephorte.MergeFieldContent;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface PositionType {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Table {
            Id: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface TableField {
            Id: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface OrganizationIdentifier extends Ephorte.GeographicalObject {
            OrganizationNumber: Edm.String;

        }
        export interface PersonIdentifier extends Ephorte.GeographicalObject {
            SocialSecurityNumber: Edm.String;
            Dnumber: Edm.String;

        }
        export interface Phrase {
            Id: Edm.Int32;
            Phrase_ZZ: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ValueListItem {
            DummyKey: Edm.Int32;
            Value: Edm.String;
            Description: Edm.String;

        }
        export interface ValueList {
            DummyKey: Edm.Int32;
            Name: Edm.String;
            Values?: Ephorte.ValueListItem[];

        }
        export interface Fonds {
            Id: Edm.String;
            Description: Edm.String;
            DefaultClassificationSystemId: Edm.String;
            DefaultSequenceId: Edm.Int32;
            FondsDatabase: Edm.Int32;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            Remark: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            ClosedDate: Edm.Date;
            ClosedByUserNameId: Edm.Int32;
            FondsStatusId: Edm.String;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            DefaultClassificationSystem?: Ephorte.ClassificationSystem;
            DefaultSequence?: Ephorte.NumberSeries;
            CreatedByUserName?: Ephorte.UserName;
            ClosedByUserName?: Ephorte.UserName;
            FondsStatus?: Ephorte.FondsStatus;
            LastUpdatedByUserName?: Ephorte.UserName;
            Series?: Ephorte.Series[];
            FondsCreators?: Ephorte.FondsCreatorMembership[];
            Periods?: Ephorte.FondsPeriod[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface FondsCreator {
            Id: Edm.Int32;
            Name: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FondsCreated?: Ephorte.FondsCreatorMembership[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface OnBehalfOf {
            UserId: Edm.Int32;
            OnBehalfOfUserRoleId: Edm.Int32;
            Remark: Edm.String;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            User?: Ephorte.User;
            OnBehalfOfUserRole?: Ephorte.UserRole;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface SearchIndexKeyword {
            Keyword: Edm.String;
            ClassificationSystemId: Edm.String;
            ClassId: Edm.String;
            NotKeyword: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            ClassificationSystem?: Ephorte.ClassificationSystem;
            Class?: Ephorte.Class;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface SearchIndexStopword {
            Word: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface SeriesLink {
            RegistryManagementUnitId: Edm.String;
            SeriesId: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            RegistryManagementUnit?: Ephorte.RegistryManagementUnit;
            Series?: Ephorte.Series;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface AccessCode {
            Id: Edm.String;
            Description: Edm.String;
            Group: Edm.Int32;
            Rank: Edm.Int32;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            IsSenderRecipientRestrictedByDefault: Edm.Boolean;
            IsTitleRestricted: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            DefaultStatutoryAutority?: Ephorte.StatutoryAutority;
            StatutoryAutorities?: Ephorte.StatutoryAutority[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface AccessGroup {
            Id: Edm.Int32;
            Description: Edm.String;
            IsGeneral: Edm.Boolean;
            CreatedByUserId: Edm.Int32;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            Type: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUser?: Ephorte.User;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            Memberships?: Ephorte.AccessGroupMembership[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ActivityPhaseType {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface AdditionalCode {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface AdditionalInformation {
            Id: Edm.Int32;
            CaseId: Edm.String;
            RegistryEntryId: Edm.String;
            DocumentDescriptionId: Edm.String;
            VersionNumber: Edm.String;
            VariantFormatId: Edm.String;
            SortOrder: Edm.String;
            InformationTypeId: Edm.String;
            AccessCodeId: Edm.String;
            AccessGroupId: Edm.String;
            KeepUntilDate: Edm.Date;
            CreatedDateTime: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            OnBehalfOfUserNameId: Edm.Int32;
            Text: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Case?: Ephorte.Case;
            RegistryEntry?: Ephorte.RegistryEntry;
            DocumentDescription?: Ephorte.DocumentDescription;
            InformationType?: Ephorte.InformationType;
            AccessCode?: Ephorte.AccessCode;
            AccessGroup?: Ephorte.AccessGroup;
            CreatedByUserName?: Ephorte.UserName;
            OnBehalfOfUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface AddressGroup {
            Id: Edm.Int32;
            ShortCode: Edm.String;
            Name: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            Addresses?: Ephorte.AddressGroupMembership[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Address {
            Id: Edm.Int32;
            ShortCode: Edm.String;
            Name: Edm.String;
            ToDate: Edm.Date;
            AccessGroupId: Edm.Int32;
            UpdateByAccessGroupId: Edm.Int32;
            AddressTypeId: Edm.String;
            IsPublished: Edm.Boolean;
            Provider: Edm.String;
            PostAddress: Edm.String;
            PostalCode: Edm.String;
            City: Edm.String;
            ForeignAddress: Edm.String;
            Email: Edm.String;
            Fax: Edm.String;
            Telephone: Edm.String;
            Mobile: Edm.String;
            Pager: Edm.String;
            IdentificationTypeId: Edm.String;
            ExternalId: Edm.String;
            NoarkBaseId: Edm.Int32;
            AutoRegisterEmail: Edm.Boolean;
            BankAccount: Edm.String;
            VisitAddress: Edm.String;
            MunicipalityNumber: Edm.String;
            PostalGiroNumber: Edm.String;
            PrivateAddressUserId: Edm.Int32;
            DefaultSendingMethodId: Edm.String;
            TwoLetterCountryCode: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            AccessGroup?: Ephorte.AccessGroup;
            UpdateByAccessGroup?: Ephorte.AccessGroup;
            AddressType?: Ephorte.AddressType;
            IdentificationType?: Ephorte.IdentificationType;
            DefaultSendingMethod?: Ephorte.SendingMethod;
            Country?: Ephorte.Country;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            AsSenderRecipient?: Ephorte.SenderRecipient;
            AddressGroups?: Ephorte.AddressGroupMembership[];
            AsAddressGroupMembership?: Ephorte.AddressGroupMembership;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface AddressType {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface AdministrativeUnit {
            Id: Edm.Int32;
            ParentalUnitId: Edm.Int32;
            ShortCodeThisLevel: Edm.String;
            ShortCode: Edm.String;
            Description: Edm.String;
            AdministrativeUnitTypeId: Edm.String;
            ReportGroup: Edm.String;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            BreadCrumb: Edm.String;
            RegistryManagementUnitId: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            ParentalUnit?: Ephorte.AdministrativeUnit;
            AdministrativeUnitType?: Ephorte.UnitType;
            RegistryManagementUnit?: Ephorte.RegistryManagementUnit;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            SubUnits?: Ephorte.AdministrativeUnit[];
            Addresses?: Ephorte.AdministrativeUnitAddress[];
            Predecessors?: Ephorte.AdministrativeUnitRelation[];
            Successors?: Ephorte.AdministrativeUnitRelation[];
            UserRoles?: Ephorte.UserRole[];
            Profiles?: Ephorte.RoleProfile[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface AdministrativeUnitAddress {
            AdministrativeUnitId: Edm.Int32;
            AddressId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            AdministrativeUnit?: Ephorte.AdministrativeUnit;
            Address?: Ephorte.Address;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Applicant {
            Id: Edm.Int32;
            NationalIdentificationNumber: Edm.String;
            BirthDate: Edm.Date;
            Gender: Edm.String;
            FirstName: Edm.String;
            LastName: Edm.String;
            Address: Edm.String;
            PostalCode: Edm.String;
            City: Edm.String;
            Email: Edm.String;
            Fax: Edm.String;
            TelephonePrivate: Edm.String;
            TelephoneWork: Edm.String;
            Mobile: Edm.String;
            Employer: Edm.String;
            WorkMunicipality: Edm.String;
            Position: Edm.String;
            Remark: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            Applications?: Ephorte.PositionApplication[];
            Competences?: Ephorte.ApplicantCompetence[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ApplicantCompetence {
            Id: Edm.Int32;
            ApplicantId: Edm.Int32;
            CompetenceTypeId: Edm.String;
            Description: Edm.String;
            Company: Edm.String;
            Miscellanous1: Edm.String;
            Miscellanous2: Edm.String;
            FromDate: Edm.String;
            ToDate: Edm.String;
            Remark: Edm.String;
            ApprovedDuration: Edm.Int32;
            Order: Edm.Int32;
            Relevance: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Applicant?: Ephorte.Applicant;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface PositionApplication {
            ApplicantId: Edm.Int32;
            PositionId: Edm.Int32;
            RegistryEntryId: Edm.Int32;
            ApplicationStatusId: Edm.Int32;
            ApplicationDate: Edm.Date;
            Remark: Edm.String;
            IsRestricted: Edm.Boolean;
            Pursuant: Edm.String;
            InterviewDateTime: Edm.DateTimeOffset;
            InterviewLocation: Edm.String;
            QualificationRating: Edm.Int32;
            AccessCodeId: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Applicant?: Ephorte.Applicant;
            Position?: Ephorte.Position;
            RegistryEntry?: Ephorte.RegistryEntry;
            ApplicationStatus?: Ephorte.ApplicationStatus;
            AccessCode?: Ephorte.AccessCode;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ApplicationStatus {
            Id: Edm.Int32;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ApplicationType {
            Id: Edm.String;
            Description: Edm.String;
            TaskId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Task?: Ephorte.Task;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface AutorizationForAdmUnit {
            UserId: Edm.String;
            RegistryManagementUnitId: Edm.String;
            AdministrativeUnitId: Edm.String;
            AutorizationGrantedByUserNameId: Edm.String;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            AutorizationSuspendedByUserId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            User?: Ephorte.UserName;
            RegistryManagementUnit?: Ephorte.RegistryManagementUnit;
            AdministrativeUnit?: Ephorte.AdministrativeUnit;
            AutorizationGrantedByUser?: Ephorte.User;
            AutorizationSuspendedByUser?: Ephorte.User;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface BuildingAction {
            Id: Edm.String;
            Description: Edm.String;
            Remark: Edm.String;
            FileTypeId: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            FileType?: Ephorte.FileType;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface BuildingIdent extends Ephorte.GeographicalObject {
            BuildingNumber: Edm.Int32;
            BuildingSequenceNumber: Edm.Int32;

        }
        export interface BuildingType {
            Id: Edm.String;
            Description: Edm.String;
            IsValidForRegistration: Edm.Boolean;
            ParentBuildingTypeId: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            ParentBuildingType?: Ephorte.BuildingType;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface AdministrativeUnitAuthorization {
            UserId: Edm.Int32;
            AccessCodeId: Edm.String;
            AdministrativeUnitId: Edm.Int32;
            AuthorizedByUserNameId: Edm.Int32;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            AuthorizationRemovedByUserNameId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            AdministrativeUnit?: Ephorte.AdministrativeUnit;
            AuthorizedByUserName?: Ephorte.User;
            AuthorizationRemovedByUserName?: Ephorte.User;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Authorization {
            UserId: Edm.Int32;
            AccessCodeId: Edm.String;
            IsAutorizedForAllUnits: Edm.Boolean;
            ClearedById: Edm.Int32;
            ClearanceLiftedByUserId: Edm.Int32;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            Remark: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            User?: Ephorte.User;
            AccessCode?: Ephorte.AccessCode;
            ClearedBy?: Ephorte.User;
            ClearanceLiftedByUser?: Ephorte.User;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            UnitAuthorizations?: Ephorte.AdministrativeUnitAuthorization[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Context {
            DummyKey: Edm.Int32;
            CurrentUserInfo?: Ephorte.CurrentUserInfo;
            Configuration?: Ephorte.Configuration;
            CustomFieldDescriptors?: Ephorte.CustomFieldDescriptor[];

        }
        export interface Configuration {
            DummyKey: Edm.Int32;
            CanCreateDistributionList: Edm.Boolean;
            DispatchmentMethodsForOrganization: Edm.String;
            DispatchmentMethodsForPerson: Edm.String;

        }
        export interface PendingImport {
            Id: Edm.String;
            ToName: Edm.String;
            ToMailAddress: Edm.String;
            CcName: Edm.String;
            CcMailAddress: Edm.String;
            FromName: Edm.String;
            FromMailAddress: Edm.String;
            Body: Edm.String;
            HtmlBody: Edm.String;
            Subject: Edm.String;
            Received: Edm.DateTimeOffset;
            IsUnread: Edm.Boolean;
            Priority: Edm.String;
            AttachmentCount: Edm.Int32;
            ImportCenterId: Edm.Int32;
            FileType: Edm.String;
            ObjectTypeId: Edm.String;
            HasAttachments: Edm.Boolean;
            MailUrl: Edm.String;
            Certificate: Edm.Boolean;
            FileExtension: Edm.String;
            Operation: Ephorte.Operation;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ImportCenter {
            Id: Edm.Int32;
            TypeId: Edm.Int32;
            OwningUserId: Edm.Int32;
            OwningAdministrativeUnitId: Edm.Int32;
            Description: Edm.String;
            ImportSource: Edm.String;
            SourceUsername: Edm.String;
            DisplayXsl: Edm.String;
            ImportsSchemaXml: Edm.Boolean;
            DeleteFile: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Type?: Ephorte.ImportCenterType;
            OwningUser?: Ephorte.User;
            OwningAdministrativeUnit?: Ephorte.AdministrativeUnit;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            PendingImports?: Ephorte.PendingImport[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ImportCenterObjectType {
            Id: Edm.String;
            Description: Edm.String;
            Object: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ImportCenterType {
            Id: Edm.Int32;
            Description: Edm.String;
            ClassId: Edm.String;
            ConnectionString: Edm.String;
            Server: Edm.String;
            ObjectTypeId: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            ObjectType?: Ephorte.ImportCenterObjectType;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface MeetingAllowance {
            DMBId: Edm.Int32;
            FunctionId: Edm.String;
            FromDate: Edm.DateTimeOffset;
            ToDate: Edm.DateTimeOffset;
            Allowance: Edm.Decimal;
            Id: Edm.Int32;
            Description: Edm.String;
            IsStandard: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            DMB?: Ephorte.DMB;
            Function?: Ephorte.DMBMemberRole;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface MeetingStatus {
            Id: Edm.Int32;
            ShortCode: Edm.String;
            Description: Edm.String;
            IsScheduled: Edm.Boolean;
            IsOnGoing: Edm.Boolean;
            IsFinished: Edm.Boolean;
            IsCanceled: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DatabaseInfo {
            Name: Edm.String;
            Description: Edm.String;
            Theme: Edm.String;
            Operation: Ephorte.Operation;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Case {
            Id: Edm.Int32;
            CaseYear: Edm.Int32;
            SequenceNumber: Edm.Int32;
            CaseNumber: Edm.String;
            IsPhysical: Edm.Boolean;
            CaseDate: Edm.Date;
            Title: Edm.String;
            PublicTitle: Edm.String;
            PublicTitleNames: Edm.String;
            IsRestricted: Edm.Boolean;
            CaseStatusId: Edm.String;
            SeriesId: Edm.String;
            RegistryManagementUnitId: Edm.String;
            AccessCodeId: Edm.String;
            Pursuant: Edm.String;
            AccessGroupId: Edm.Int32;
            LastRecordDate: Edm.Date;
            CountOfRegistryEntries: Edm.Int32;
            PreservationTime: Edm.Int32;
            DisposalCodeId: Edm.String;
            DisposalDate: Edm.Date;
            ProjectId: Edm.String;
            AlertDate: Edm.Date;
            FromSeriesId: Edm.String;
            LoanDate: Edm.Date;
            LoanedToUserNameId: Edm.Int32;
            FileTypeId: Edm.String;
            IsPublished: Edm.Boolean;
            LastUpdated: Edm.DateTimeOffset;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            ClosedDate: Edm.Date;
            ClosedByUserNameId: Edm.Int32;
            ParentCaseId: Edm.Int32;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CaseStatus?: Ephorte.CaseStatus;
            Series?: Ephorte.Series;
            RegistryManagementUnit?: Ephorte.RegistryManagementUnit;
            CaseWorker?: Ephorte.CaseWorkerCase;
            AccessCode?: Ephorte.AccessCode;
            AccessGroup?: Ephorte.AccessGroup;
            DisposalCode?: Ephorte.DisposalCode;
            Project?: Ephorte.Project;
            FromSeries?: Ephorte.Series;
            LoanedToUserName?: Ephorte.UserName;
            FileType?: Ephorte.FileType;
            ReadStatus?: Ephorte.CaseReadStatus;
            PrimaryClassification?: Ephorte.CaseClassification;
            SecondaryClassification?: Ephorte.CaseClassification;
            CreatedByUserName?: Ephorte.UserName;
            ParentCase?: Ephorte.Case;
            LastUpdatedByUserName?: Ephorte.UserName;
            ChildCases?: Ephorte.Case[];
            RegistryEntries?: Ephorte.RegistryEntry[];
            Remarks?: Ephorte.Remark[];
            Links?: Ephorte.LinkFromCase[];
            Invoices?: Ephorte.Invoice[];
            Precedents?: Ephorte.Precedent[];
            CaseParties?: Ephorte.CaseParty[];
            Documents?: Ephorte.RegistryEntryDocument[];
            Classifications?: Ephorte.CaseClassification[];
            Tasks?: Ephorte.Task[];
            ConstructionCases?: Ephorte.ConstructionCase[];
            LandPlans?: Ephorte.LandPlan[];
            LogEntries?: Ephorte.LogEntry[];
            GeographicalObjects?: Ephorte.GeographicalObject[];
            Dispensations?: Ephorte.Dispensation[];
            Positions?: Ephorte.Position[];
            BuildingCaseLocationLinks?: Ephorte.BuildingCaseLocationLink[];
            ApplicationsAggregation?: Ephorte.ApplicationsAggregation;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;
            [x: string]: any;
        }
        export interface CaseReadStatus {
            DummyKey: Edm.Int32;
            IsRead: Edm.Boolean;

        }
        export interface CaseWorker {
            DummyKey: Edm.Int32;
            OfficerNameId: Edm.Int32;
            AdministrativeUnitId: Edm.Int32;
            OfficerName?: Ephorte.UserName;
            AdministrativeUnit?: Ephorte.AdministrativeUnit;
            Permissions?: Ephorte.Permissions;

        }
        export interface CaseWorkerCase extends Ephorte.CaseWorker {

        }
        export interface EntityCollectionAggregation {
            DummyKey: Edm.Int32;
            Count: Edm.Int32;

        }
        export interface ApplicationsAggregation extends Ephorte.EntityCollectionAggregation {

        }
        export interface CaseCategory {
            Id: Edm.String;
            Description: Edm.String;
            MeetingCaseTypeId: Edm.String;
            IsRestricted: Edm.Boolean;
            Pursuant: Edm.String;
            CanAppeal: Edm.Boolean;
            Remark: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CasePartySenderRecipient {
            DummyKey: Edm.Int32;
            CasePartyId: Edm.Int32;
            SenderRecipient?: Ephorte.SenderRecipient;
            CaseParty?: Ephorte.CaseParty;
            Roles?: Ephorte.CasePartyRole[];

        }
        export interface ClassificationBase {
            Id: Edm.Int32;
            CaseId: Edm.Int32;
            SortOrder: Edm.String;
            ClassificationSystemId: Edm.String;
            ClassId: Edm.String;
            IsRestricted: Edm.Boolean;
            Remark: Edm.String;
            Description: Edm.String;
            LastUpdated: Edm.DateTimeOffset;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Case?: Ephorte.Case;
            ClassificationSystem?: Ephorte.ClassificationSystem;
            Class?: Ephorte.Class;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CaseClassification extends Ephorte.ClassificationBase {

        }
        export interface LinkFromCase extends Ephorte.DOM.Model.LinkFrom {
            CaseId: Edm.Int32;
            Case?: Ephorte.Case;

        }
        export interface CaseParty {
            Id: Edm.Int32;
            CaseId: Edm.Int32;
            IsRestricted: Edm.Boolean;
            ShortCode: Edm.String;
            Name: Edm.String;
            PostalAddress: Edm.String;
            PostalCode: Edm.String;
            City: Edm.String;
            ForeignAddress: Edm.String;
            Email: Edm.String;
            Attention: Edm.String;
            IdentificationTypeId: Edm.String;
            ExternalId: Edm.String;
            Fax: Edm.String;
            Telephone: Edm.String;
            Remark: Edm.String;
            AddressId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            CreatedDate: Edm.DateTimeOffset;
            TwoLetterCountryCode: Edm.String;
            CustomAttribute1: Edm.String;
            CustomAttribute2: Edm.String;
            CustomAttribute3: Edm.String;
            CustomAttribute4: Edm.String;
            CustomAttribute5: Edm.String;
            CustomAttribute6: Edm.String;
            CustomAttribute7: Edm.String;
            CustomAttribute8: Edm.String;
            CustomAttribute9: Edm.String;
            CustomAttribute10: Edm.String;
            CreatedByUserNameId: Edm.Int32;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            RegistryEntryId: Edm.Int32;
            Operation: Ephorte.Operation;
            Case?: Ephorte.Case;
            IdentificationType?: Ephorte.IdentificationType;
            Country?: Ephorte.Country;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            RegistryEntry?: Ephorte.RegistryEntry;
            Roles?: Ephorte.CasePartyRoleMember[];
            AsSenderRecipient?: Ephorte.SenderRecipient;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CasePartyRole {
            Id: Edm.String;
            Description: Edm.String;
            FileTypeId: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            FileType?: Ephorte.FileType;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            AsSenderRecipient?: Ephorte.SenderRecipient;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CasePartyRoleMember {
            Id: Edm.Int32;
            CasePartyId: Edm.Int32;
            CasePartyRoleId: Edm.String;
            Remark: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            AreaOfExpertise: Edm.String;
            InitiativeClass: Edm.Int32;
            Operation: Ephorte.Operation;
            CaseParty?: Ephorte.CaseParty;
            CasePartyRole?: Ephorte.CasePartyRole;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CaseRead {
            CaseId: Edm.Int32;
            ReadByUnitId: Edm.Int32;
            ReadByUserId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Case?: Ephorte.Case;
            ReadByUnit?: Ephorte.AdministrativeUnit;
            ReadByUser?: Ephorte.UserName;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CaseStatus {
            Id: Edm.String;
            Description: Edm.String;
            IsTemporary: Edm.Boolean;
            IsClosed: Edm.Boolean;
            IsDeleted: Edm.Boolean;
            IsDone: Edm.Boolean;
            IsUsedByRegistrar: Edm.Boolean;
            IsUsedByLeader: Edm.Boolean;
            IsUsedByCaseworker: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CaseWorkerKey {
            DummyKey: Edm.Int32;
            UserNameId: Edm.Int32;
            AdministrativeUnitId: Edm.Int32;

        }
        export interface Class {
            ClassificationSystemId: Edm.String;
            Id: Edm.String;
            ParentId: Edm.String;
            Description: Edm.String;
            IsValidForRegistration: Edm.Boolean;
            IsSecondaryClassAllowed: Edm.Boolean;
            SecondaryClassId: Edm.String;
            SeriesId: Edm.String;
            PreservationTime: Edm.Int32;
            DisposalCodeId: Edm.String;
            DisposalPrinciple: Edm.String;
            AccessCodeId: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            ClosedDate: Edm.Date;
            ClosedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            ClassificationSystem?: Ephorte.ClassificationSystem;
            Parent?: Ephorte.Class;
            SecondaryClass?: Ephorte.ClassificationSystem;
            Series?: Ephorte.Series;
            DisposalCode?: Ephorte.DisposalCode;
            AccessCode?: Ephorte.AccessCode;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ClassificationSystem {
            Id: Edm.String;
            Description: Edm.String;
            Caption: Edm.String;
            ClassificationSystemTypeId: Edm.String;
            IsDescriptionMandatory: Edm.Boolean;
            IsValidForClassification: Edm.Boolean;
            IsUndefinedClassesAllowed: Edm.Boolean;
            AutoCreateUndefinedClasses: Edm.Boolean;
            IsSecondaryClassAllowed: Edm.Boolean;
            SecondaryClassificationSystemId: Edm.String;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            MaxLength: Edm.Int32;
            AccessCodeId: Edm.String;
            Remark: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            ClosedDate: Edm.Date;
            ClosedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            ClassificationSystemType?: Ephorte.ClassificationSystemType;
            SecondaryClassificationSystem?: Ephorte.ClassificationSystem;
            AccessCode?: Ephorte.AccessCode;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            Classes?: Ephorte.Class[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ClassificationSystemType {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DMBCaseListType {
            DMBId: Edm.Int32;
            MeetingCaseTypeId: Edm.String;
            SortOrder: Edm.Int32;
            Heading: Edm.String;
            NumberSequenceId: Edm.Int32;
            FormatMeetingCaseNumber: Edm.String;
            HasHeading: Edm.Boolean;
            HasOnlyHeading: Edm.Boolean;
            InsertCaseNo: Edm.Boolean;
            InsertCaseTitle: Edm.Boolean;
            InsertCaseFileNo: Edm.Boolean;
            InsertCaseAndDocNo: Edm.Boolean;
            InsertDocumentContent: Edm.Boolean;
            InsertDocumentDate: Edm.Boolean;
            InsertSenderRecipient: Edm.Boolean;
            SeparatDocumentForMinutesAndHandling: Edm.Boolean;
            InsertAdmDecisions: Edm.Boolean;
            HasMinutes: Edm.Boolean;
            TemplateId: Edm.Int32;
            InsertCaseTypePrefix: Edm.Boolean;
            InsertDocuments: Edm.Boolean;
            InsertPreviousMinutesOfMeetingId: Edm.Int32;
            InsertAttachments: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            DMB?: Ephorte.DMB;
            MeetingCaseType?: Ephorte.MeetingCaseType;
            NumberSequence?: Ephorte.NumberSeries;
            Template?: Ephorte.DocumentTemplate;
            InsertPreviousMinutesOfMeeting?: Ephorte.PreviousMinutesOfMeeting;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DMBHandlingDocument {
            DMBHandlingId: Edm.Int32;
            DocumentDescriptionId: Edm.Int32;
            DMBDocumenttypeId: Edm.String;
            RegistryEntryId: Edm.Int32;
            RegistryEntryTypeId: Edm.String;
            DMBDocumentStatusId: Edm.String;
            ApprovedDate: Edm.Date;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            DMBHandling?: Ephorte.DMBHandling;
            DocumentDescription?: Ephorte.DocumentDescription;
            DMBDocumentType?: Ephorte.DMBDocumentType;
            RegistryEntry?: Ephorte.RegistryEntry;
            RegistryEntryType?: Ephorte.RegistryEntryType;
            DMBDocumentStatus?: Ephorte.StatusMeetingDocument;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DMBHandlingStatus {
            Id: Edm.String;
            Description: Edm.String;
            IsAllowedOnQueueList: Edm.Boolean;
            IsAllowedOnCasePlan: Edm.Boolean;
            IsOnCasePlan: Edm.Boolean;
            IsProcessed: Edm.Boolean;
            SortOrderQueueList: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ConferCase {
            Id: Edm.Int32;
            FromCaseId: Edm.Int32;
            FromRegistryEntryId: Edm.Int32;
            ToCaseId: Edm.Int32;
            ToRegistryEntryId: Edm.Int32;
            LinkToPrecedentId: Edm.Int32;
            Remark: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            FromCase?: Ephorte.Case;
            FromRegistryEntry?: Ephorte.RegistryEntry;
            ToCase?: Ephorte.Case;
            ToRegistryEntry?: Ephorte.RegistryEntry;
            LinkToPrecedent?: Ephorte.Precedent;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ConstructionCase {
            Id: Edm.Int32;
            CaseId: Edm.Int32;
            BuildingActionId: Edm.String;
            ActionRemark: Edm.String;
            PropertyUnitNumber: Edm.String;
            UsableFloorArea: Edm.String;
            BuildingId: Edm.Int32;
            BuildingSequenceNumber: Edm.Int32;
            LeaseholdUnitNumber: Edm.String;
            BuildingTypeId: Edm.String;
            StreetId: Edm.String;
            StreetName: Edm.String;
            CadastralUnitNumber: Edm.String;
            HouseId: Edm.String;
            MapSheet: Edm.String;
            MunicipalityNumber: Edm.String;
            ApplicationTypeId: Edm.String;
            CoordinateSystem: Edm.String;
            Remark: Edm.String;
            Owner: Edm.String;
            PostalCode: Edm.String;
            City: Edm.String;
            SectionUnitNumber: Edm.String;
            PropertyArea: Edm.String;
            IsRestricted: Edm.Boolean;
            Xcoordinate: Edm.String;
            Ycoordinate: Edm.String;
            Zcoordinate: Edm.String;
            RegistryEntryId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Case?: Ephorte.Case;
            BuildingAction?: Ephorte.BuildingAction;
            BuildingType?: Ephorte.BuildingType;
            ApplicationType?: Ephorte.ApplicationType;
            RegistryEntry?: Ephorte.RegistryEntry;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Coordinate extends Ephorte.GeographicalObject {
            Xcoordinate: Edm.Double;
            Ycoordinate: Edm.Double;
            Zcoordinate: Edm.Double;
            CoordinateSystem: Edm.String;

        }
        export interface County {
            Id: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CurrentUserInfo {
            DummyKey: Edm.Int32;
            Name: Edm.String;
            Locale: Edm.String;
            UserNameId: Edm.Int32;
            UserName: Edm.String;
            UserId: Edm.Int32;
            ActiveRole: Edm.String;
            ActiveRoleId: Edm.Int32;
            Database: Edm.String;
            DatabaseInfo?: Ephorte.DatabaseInfo;
            WorkAddress?: Ephorte.Address;
            Role?: Ephorte.Role;
            UserRoles?: Ephorte.UserRole[];

        }
        export interface CustomFieldDescriptor {
            Id: Edm.Int32;
            OwningType: Edm.String;
            Discriminator: Edm.String;
            Name: Edm.String;
            Description: Edm.String;
            Order: Edm.Int32;
            Required: Edm.Boolean;
            LegalValues: Edm.String;
            Format: Edm.String;
            MaxLength: Edm.Int32;
            DefaultValue: Edm.String;
            DataType: Ephorte.FieldDataType;
            Operation: Ephorte.Operation;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DataObjectChange {
            ID: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DecisionStatus {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DecisionType {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DefaultValues {
            AdminstrativeUnitId: Edm.Int32;
            SeparatorSign: Edm.String;
            CaseStatusFondsPersonellId: Edm.String;
            CaseStatusCaseWorkerId: Edm.String;
            AccessCodeCaseId: Edm.String;
            AccessCodeIncomingId: Edm.String;
            AccessCodeInternalId: Edm.String;
            StorageUnitId: Edm.String;
            HandlingTimeIncoming: Edm.Int32;
            HandlingTimeInternal: Edm.Int32;
            HandlingTimeIncomingWithDueDate: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            AdminstrativeUnit?: Ephorte.AdministrativeUnit;
            CaseStatusFondsPersonell?: Ephorte.CaseStatus;
            CaseStatusCaseWorker?: Ephorte.CaseStatus;
            AccessCodeCase?: Ephorte.AccessCode;
            AccessCodeIncoming?: Ephorte.AccessCode;
            AccessCodeInternal?: Ephorte.AccessCode;
            StorageUnit?: Ephorte.StorageUnit;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Deputize {
            UserRoleId: Edm.Int32;
            DelegateId: Edm.Int32;
            Remark: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            UserRole?: Ephorte.UserRole;
            Delegate?: Ephorte.UserRole;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DigitalCertificatDocument {
            Id: Edm.Int32;
            DocumentDescriptionId: Edm.Int32;
            VariantId: Edm.String;
            VersionNumber: Edm.Int32;
            SignatureType: Edm.String;
            SignatureVerificationStatus: Edm.String;
            SignatureVerifiedDate: Edm.DateTimeOffset;
            SignatureVerifiedById: Edm.Int32;
            DocumentDescriptionIdForDocumentDescriptionParent: Edm.Int32;
            RegistryEntryId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            SignatureVerifiedBy?: Ephorte.UserName;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DispensationType {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DisposalCode {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DMB {
            Id: Edm.Int32;
            ShortCode: Edm.String;
            Name: Edm.String;
            Description: Edm.String;
            DMBTypeId: Edm.String;
            AdministrativeUnitId: Edm.Int32;
            FunctionFromDate: Edm.Date;
            FunctionToDate: Edm.Date;
            AppointedByAddressId: Edm.Int32;
            AppointedByDMBId: Edm.Int32;
            AppointedDate: Edm.Date;
            NumberOfMembers: Edm.Int32;
            DateEstablished: Edm.Date;
            Closed: Edm.Date;
            SeriesId: Edm.String;
            ClassId: Edm.String;
            NumberSequenceId: Edm.Int32;
            FormatMeetingNumber: Edm.String;
            AssignDMBCaseNumber: Edm.Int32;
            IsPublished: Edm.Boolean;
            AutoRegisterAttendance: Edm.Boolean;
            NumberingScheme: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            DMBType?: Ephorte.DMBType;
            AdministrativeUnit?: Ephorte.AdministrativeUnit;
            AppointedByAddress?: Ephorte.Address;
            AppointedByDMB?: Ephorte.DMB;
            Series?: Ephorte.Series;
            Class?: Ephorte.Class;
            NumberSequence?: Ephorte.NumberSeries;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            Meetings?: Ephorte.Meeting[];
            QueueList?: Ephorte.DMBHandling[];
            DMBHandlings?: Ephorte.DMBHandling[];
            Members?: Ephorte.DMBMember[];
            MeetingAllowances?: Ephorte.MeetingAllowance[];
            RecurringCasePlanListItems?: Ephorte.RecurringCasePlanListItem[];
            CasePlanListTypes?: Ephorte.DMBCaseListType[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DMBCaseHandling {
            Id: Edm.Int32;
            CaseId: Edm.Int32;
            MeetingCaseTypeId: Edm.String;
            CanAppeal: Edm.Boolean;
            IsRestricted: Edm.Boolean;
            Pursuant: Edm.String;
            StartDate: Edm.Date;
            FinalDecisionDate: Edm.Date;
            LastDecisionId: Edm.Int32;
            Remark: Edm.String;
            RegistryEntryId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Case?: Ephorte.Case;
            MeetingCaseType?: Ephorte.MeetingCaseType;
            RegistryEntry?: Ephorte.RegistryEntry;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DMBDocumentType {
            Id: Edm.String;
            Description: Edm.String;
            RegistryEntryTypeId: Edm.String;
            IsMeetingDocument: Edm.Boolean;
            IsRegistryEntry: Edm.Boolean;
            IsNotRegistryEntry: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            RegistryEntryType?: Ephorte.RegistryEntryType;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DMBHandling {
            Id: Edm.Int32;
            DMBHandlingStatusId: Edm.String;
            MeetingId: Edm.Int32;
            ZZ_SortOrder: Edm.Int32;
            IsMinutesApproved: Edm.Boolean;
            SortOrder: Edm.Int32;
            IsHeading: Edm.Boolean;
            IsPublished: Edm.Boolean;
            HeadingForId: Edm.String;
            SequenceNumber: Edm.Int32;
            Year: Edm.Int32;
            RegistryEntryId: Edm.Int32;
            IsClosed: Edm.Boolean;
            Remark: Edm.String;
            DMBCaseHandlingId: Edm.Int32;
            CaseId: Edm.Int32;
            MeetingCaseTypeId: Edm.String;
            AccessGroupId: Edm.Int32;
            AccessCodeId: Edm.String;
            Title: Edm.String;
            PublicTitle: Edm.String;
            IsTitleRestricted: Edm.Boolean;
            Pursuant: Edm.String;
            DMBId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            CreatedDate: Edm.DateTimeOffset;
            Handling: Edm.String;
            Decision: Edm.String;
            SpokesPersonId: Edm.Int32;
            CreatedByUserNameId: Edm.Int32;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CaseWorker?: Ephorte.CaseWorkerDMBHandling;
            DMBHandlingStatus?: Ephorte.DMBHandlingStatus;
            Meeting?: Ephorte.Meeting;
            HeadingFor?: Ephorte.MeetingCaseType;
            RegistryEntry?: Ephorte.RegistryEntry;
            DMBCaseHandling?: Ephorte.DMBCaseHandling;
            Case?: Ephorte.Case;
            MeetingCaseType?: Ephorte.MeetingCaseType;
            AccessGroup?: Ephorte.AccessGroup;
            AccessCode?: Ephorte.AccessCode;
            DMB?: Ephorte.DMB;
            HasMinutes?: Ephorte.DMBHandlingDocument;
            SpokesPerson?: Ephorte.UserName;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            DMBCaseListType?: Ephorte.DMBCaseListType;
            DmbProposals?: Ephorte.DmbProposal[];
            AdditionalDmbHandlings?: Ephorte.DMBHandling[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CaseWorkerDMBHandling extends Ephorte.CaseWorker {

        }
        export interface DMBHandlingValidation {
            DummyKey: Edm.Int32;
            IsValid: Edm.Boolean;
            Message: Edm.String;
            DmbHandlingId: Edm.Int32;

        }
        export interface DMBMember {
            DMBId: Edm.Int32;
            UserNameId: Edm.Int32;
            ToDate: Edm.DateTimeOffset;
            SortOrder: Edm.Int32;
            PersonalDeputyForId: Edm.Int32;
            FunctionId: Edm.String;
            FromDate: Edm.Date;
            DefaultSortOrder: Edm.Int32;
            Duration: Edm.String;
            RepresentsId: Edm.Int32;
            IsDMBSecretary: Edm.Boolean;
            IsMainDMBLeader: Edm.Boolean;
            IsMainDMBSecretary: Edm.Boolean;
            Title: Edm.String;
            IsMember: Edm.Boolean;
            Remark: Edm.String;
            MeetingFee: Edm.Decimal;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            DMB?: Ephorte.DMB;
            UserName?: Ephorte.UserName;
            PersonalDeputyFor?: Ephorte.UserName;
            Function?: Ephorte.DMBMemberRole;
            Represents?: Ephorte.Address;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DMBMemberRole {
            Id: Edm.String;
            Description: Edm.String;
            CanSpeak: Edm.Boolean;
            IsMember: Edm.Boolean;
            IsDMBSecretary: Edm.Boolean;
            IsUsedForPrescenceState: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DMBType {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DocumentCategory {
            Id: Edm.String;
            Description: Edm.String;
            Pursuant: Edm.String;
            AccessCodeId: Edm.String;
            Barcode: Edm.String;
            ActivityTemplateId: Edm.Int32;
            DueDays: Edm.Int32;
            FileTypeId: Edm.String;
            DocumentTemplateId: Edm.Int32;
            VAT: Edm.Boolean;
            PreservationTime: Edm.Int32;
            DisposalCodeId: Edm.String;
            DisposalPrinciple: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            AccessCode?: Ephorte.AccessCode;
            ActivityTemplate?: Ephorte.Task;
            FileType?: Ephorte.FileType;
            DocumentTemplate?: Ephorte.DocumentTemplate;
            DisposalCode?: Ephorte.DisposalCode;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DocumentDescription {
            Id: Edm.Int32;
            DocumentCategoryId: Edm.String;
            DocumentTitle: Edm.String;
            IsPhysical: Edm.Boolean;
            Localization: Edm.String;
            DocumentStatusId: Edm.String;
            PreparedById: Edm.Int32;
            AccessCodeId: Edm.String;
            Pursuant: Edm.String;
            DowngradingDate: Edm.Date;
            DowngradingCodeId: Edm.String;
            AccessGroupId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            CreatedDate: Edm.DateTimeOffset;
            IsPublished: Edm.Boolean;
            CreatedByUserNameId: Edm.Int32;
            PreservationTime: Edm.Int32;
            DisposalCodeId: Edm.String;
            DisposalDate: Edm.Date;
            DisposedBy: Edm.Int32;
            DisposedDate: Edm.Date;
            CustomAttribute1: Edm.String;
            CustomAttribute2: Edm.String;
            CustomAttribute3: Edm.String;
            CustomAttribute4: Edm.String;
            CustomAttribute5: Edm.String;
            CustomAttribute6: Edm.String;
            CustomAttribute7: Edm.String;
            CustomAttribute8: Edm.String;
            CustomAttribute9: Edm.String;
            CustomAttribute10: Edm.String;
            Source: Edm.String;
            ApprovedDate: Edm.Date;
            ApprovedByUserNameId: Edm.Int32;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            DocumentCategory?: Ephorte.DocumentCategory;
            DocumentStatus?: Ephorte.DocumentStatus;
            PreparedBy?: Ephorte.UserName;
            AccessCode?: Ephorte.AccessCode;
            DowngradingCode?: Ephorte.DowngradingCode;
            AccessGroup?: Ephorte.AccessGroup;
            CurrentVersion?: Ephorte.DocumentObject;
            CreatedByUserName?: Ephorte.UserName;
            DisposalCode?: Ephorte.DisposalCode;
            ApprovedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            LinksInfo?: Ephorte.DocumentDescriptionLinksInfo;
            Versions?: Ephorte.DocumentObject[];
            Links?: Ephorte.LinkFromDocumentDescription[];
            LogEntries?: Ephorte.LogEntry[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DocumentDescriptionLinksInfo {
            DummyKey: Edm.Int32;
            HasLinks: Edm.Boolean;

        }
        export interface LinkFromDocumentDescription extends Ephorte.DOM.Model.LinkFrom {
            DocumentDescriptionId: Edm.Int32;
            DocumentDescription?: Ephorte.DocumentDescription;

        }
        export interface DocumentLinkType {
            Id: Edm.String;
            Description: Edm.String;
            IsUsedForRegistryentries: Edm.Boolean;
            IsUsedForMeetingDocuments: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DocumentObject {
            DocumentDescriptionId: Edm.Int32;
            VersionNumber: Edm.Int32;
            VariantFormatId: Edm.String;
            CurrentVersion: Edm.Boolean;
            FileFormatId: Edm.String;
            CreatedByUserNameId: Edm.Int32;
            KeepUntilDate: Edm.Date;
            AccessCodeId: Edm.String;
            ArchiveRemark: Edm.String;
            StorageUnitId: Edm.String;
            FilePath: Edm.String;
            IsCompound: Edm.Boolean;
            LocalFilePath: Edm.String;
            CheckedOutToFilePath: Edm.String;
            UpdatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            CreatedDate: Edm.DateTimeOffset;
            ReservedByUserNameId: Edm.Int32;
            CheckedOutByUserId: Edm.Int32;
            Checksum: Edm.String;
            FileSize: Edm.Int32;
            CheckSumAlgorithm: Edm.String;
            DocumentTemplateId: Edm.Int32;
            PreviewChecksum: Edm.String;
            PreviewError: Edm.String;
            UploadIdentifier: Edm.String;
            CustomAttribute1: Edm.String;
            CustomAttribute2: Edm.String;
            CustomAttribute3: Edm.String;
            CustomAttribute4: Edm.String;
            CustomAttribute5: Edm.String;
            CustomAttribute6: Edm.String;
            CustomAttribute7: Edm.String;
            CustomAttribute8: Edm.String;
            CustomAttribute9: Edm.String;
            CustomAttribute10: Edm.String;
            CanRead: Edm.Boolean;
            ContentType: Edm.String;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            DocumentTemplateData: Ephorte.DOM.Model.CasePartyLetterTemplateData;
            Operation: Ephorte.Operation;
            DocumentDescription?: Ephorte.DocumentDescription;
            VariantFormat?: Ephorte.VariantFormat;
            FileFormat?: Ephorte.FileFormat;
            CreatedByUserName?: Ephorte.UserName;
            AccessCode?: Ephorte.AccessCode;
            StorageUnit?: Ephorte.StorageUnit;
            UpdatedByUserName?: Ephorte.UserName;
            ReservedByUserName?: Ephorte.UserName;
            CheckedOutByUser?: Ephorte.User;
            DocumentTemplate?: Ephorte.DocumentTemplate;
            LastUpdatedByUserName?: Ephorte.UserName;
            PreauthenticatedReadDocumentUris?: Ephorte.PreauthenticatedReadDocumentUris;
            PreauthenticatedWriteDocumentUris?: Ephorte.PreauthenticatedWriteDocumentUris;
            LogEntries?: Ephorte.LogEntry[];
            DigitalCertificatDocument?: Ephorte.DigitalCertificatDocument;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DocumentStatus {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DocumentTemplate {
            Id: Edm.Int32;
            Description: Edm.String;
            DocumentTypeId: Edm.String;
            DocumentTemplateTypeId: Edm.Int32;
            FileFormatId: Edm.String;
            Macro: Edm.String;
            Autotext: Edm.String;
            AdditionalTemplate: Edm.String;
            AdditionalTemplateUploadIdentifier: Edm.String;
            FileTypeId: Edm.String;
            AdministrativeUnitId: Edm.Int32;
            UserId: Edm.Int32;
            FileExtension: Edm.String;
            DataFile: Edm.String;
            FilePath: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            FilePathUploadIdentifier: Edm.String;
            Operation: Ephorte.Operation;
            DocumentType?: Ephorte.DocumentType;
            DocumentTemplateType?: Ephorte.DocumentTemplateType;
            FileFormat?: Ephorte.FileFormat;
            FileType?: Ephorte.FileType;
            AdministrativeUnit?: Ephorte.AdministrativeUnit;
            User?: Ephorte.User;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            PreauthenticatedReadDocumentTemplateUris?: Ephorte.PreauthenticatedReadDocumentTemplateUris;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DocumentTemplateType {
            Id: Edm.Int32;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DowngradingCode {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ExternalSystem {
            Id: Edm.Int32;
            ExternalSystemName: Edm.String;
            IsActive: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ExternalSystemLinkCase {
            DummyKey: Edm.Int32;
            CaseId: Edm.Int32;
            Id: Edm.Int32;
            ExternalSystemCode: Edm.Int32;
            ExternalKey: Edm.String;
            GeographicalEntityId: Edm.Int32;
            ForeignKeyId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            ExternalSystem?: Ephorte.ExternalSystem;
            GeographicalEntity?: Ephorte.GeographicalEntity;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ExternalSystemLinkRegistryEntry {
            DummyKey: Edm.Int32;
            RegistryEntryId: Edm.Int32;
            Id: Edm.Int32;
            ExternalSystemCode: Edm.Int32;
            ExternalKey: Edm.String;
            GeographicalEntityId: Edm.Int32;
            ForeignKeyId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            ExternalSystem?: Ephorte.ExternalSystem;
            GeographicalEntity?: Ephorte.GeographicalEntity;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface FeeType {
            Id: Edm.Int32;
            Description: Edm.String;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            UnitPrice: Edm.Decimal;
            FileTypeId: Edm.String;
            AccountNumber: Edm.String;
            SalesTaxCode: Edm.Int32;
            ContractingAuthority: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            ExternalReference: Edm.String;
            Operation: Ephorte.Operation;
            FileType?: Ephorte.FileType;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Field {
            DummyKey: Edm.Int32;
            Name: Edm.String;

        }
        export interface FileFormat {
            Id: Edm.String;
            Description: Edm.String;
            IsArchivalFormat: Edm.Boolean;
            FileExtension: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            MimeType: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface FileType {
            Id: Edm.String;
            Description: Edm.String;
            SeriesId: Edm.String;
            Category: Edm.Int32;
            AccessCodeId: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Series?: Ephorte.Series;
            AccessCode?: Ephorte.AccessCode;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface RecurringCasePlanListItem {
            SortOrder: Edm.Int32;
            DMBId: Edm.Int32;
            MeetingCaseTypeId: Edm.String;
            Description: Edm.String;
            IsClosed: Edm.Boolean;
            IsCollectedCase: Edm.Boolean;
            ForMeetingCaseTypeId: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            DMB?: Ephorte.DMB;
            MeetingCaseType?: Ephorte.MeetingCaseType;
            ForMeetingCaseType?: Ephorte.MeetingCaseType;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Folder {
            Id: Edm.Int32;
            Description: Edm.String;
            Remark: Edm.String;
            AdministrativeUnitId: Edm.Int32;
            UserNameId: Edm.Int32;
            AccessGroupId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            AdministrativeUnit?: Ephorte.AdministrativeUnit;
            AccessGroup?: Ephorte.AccessGroup;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface FolderCaseLink {
            CaseId: Edm.Int32;
            Id: Edm.Int32;
            FolderId: Edm.Int32;
            ObjectId: Edm.Int32;
            SortOrder: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Case?: Ephorte.Case;
            Folder?: Ephorte.Folder;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface FolderDocumentLink {
            DocumentDescriptionId: Edm.Int32;
            Id: Edm.Int32;
            FolderId: Edm.Int32;
            ObjectId: Edm.Int32;
            SortOrder: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            DocumentDescription?: Ephorte.DocumentDescription;
            Folder?: Ephorte.Folder;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface FolderRegistryEntryLink {
            RegistryEntryId: Edm.Int32;
            Id: Edm.Int32;
            FolderId: Edm.Int32;
            ObjectId: Edm.Int32;
            SortOrder: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            RegistryEntry?: Ephorte.RegistryEntry;
            Folder?: Ephorte.Folder;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface FollowUpMethod {
            Id: Edm.String;
            Description: Edm.String;
            IsTemporary: Edm.Boolean;
            IsReplied: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface FondsPeriod {
            Id: Edm.Int32;
            FondsId: Edm.String;
            FondsStatusId: Edm.String;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            Remark: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Fonds?: Ephorte.Fonds;
            FondsStatus?: Ephorte.FondsStatus;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface FondsStatus {
            Id: Edm.String;
            Description: Edm.String;
            IsNewCaseAllowed: Edm.Boolean;
            IsNewDocAllowed: Edm.Boolean;
            IsClosed: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface GeographicalEntity {
            Id: Edm.Int32;
            Description: Edm.String;
            IsActive: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Wkt {
            DummyKey: Edm.Int32;
            WktData: Edm.String;

        }
        export interface GeographicalObjectLink {
            Id: Edm.Int32;
            GeographicalObjectId: Edm.Int32;
            GeographicalEntityId: Edm.Int32;
            ForeignKeyId: Edm.Int32;
            Name: Edm.String;
            ObjectId: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            GeographicalObject?: Ephorte.GeographicalObject;
            GeographicalEntity?: Ephorte.GeographicalEntity;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface GeographicalObjectType {
            Id: Edm.String;
            Description: Edm.String;
            IsActive: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface IdentificationType {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface InformationType {
            Id: Edm.String;
            Description: Edm.String;
            Caption: Edm.String;
            Caption2: Edm.String;
            RemarkType: Edm.Boolean;
            IsLogged: Edm.Boolean;
            PreservationTime: Edm.Int32;
            AccessCodeId: Edm.String;
            Group: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            AccessCode?: Ephorte.AccessCode;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface InvoiceStatus {
            Id: Edm.String;

        }
        export interface Invoice {
            Id: Edm.Int32;
            CaseId: Edm.Int32;
            Description: Edm.String;
            AccountingDocumentNumber: Edm.String;
            ExternalReference: Edm.String;
            AgressoCustomerId: Edm.String;
            Date: Edm.Date;
            IsExported: Edm.Boolean;
            Remark: Edm.String;
            ExternalId: Edm.String;
            Name: Edm.String;
            Address: Edm.String;
            PostalCode: Edm.String;
            City: Edm.String;
            Status: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Case?: Ephorte.Case;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            LineItems?: Ephorte.InvoiceLineItem[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface InvoiceLineItem {
            Id: Edm.Int32;
            InvoiceId: Edm.Int32;
            FeeTypeId: Edm.Int32;
            Description: Edm.String;
            Order: Edm.Int32;
            Date: Edm.Date;
            Remark: Edm.String;
            UnitPrice: Edm.Decimal;
            Number: Edm.Decimal;
            Amount: Edm.Decimal;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Invoice?: Ephorte.Invoice;
            FeeType?: Ephorte.FeeType;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Keyword {
            Text: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface KeywordReference {
            KeyWord1Id: Edm.String;
            KeyWord2Id: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            KeyWord?: Ephorte.Keyword;
            KeyWord2?: Ephorte.Keyword;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface KeywordsPrecedents {
            PrecedentId: Edm.Int32;
            Keyword: Edm.String;
            IsKeyWord: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Precedent?: Ephorte.Precedent;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface LandPlan {
            Id: Edm.Int32;
            CaseId: Edm.Int32;
            PlanRegulationId: Edm.String;
            ValidFromDate: Edm.DateTimeOffset;
            LawReference: Edm.String;
            PlanNumber: Edm.String;
            LandPlanStatusId: Edm.String;
            LandPlanTypeId: Edm.String;
            MunicipalityNumber: Edm.String;
            CountyNumber: Edm.String;
            GovernmentNumber: Edm.String;
            PropertyNumber: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Case?: Ephorte.Case;
            PlanRegulations?: Ephorte.PlanRegulations;
            LandPlanStatus?: Ephorte.LandPlanStatus;
            LandPlanType?: Ephorte.LandPlanType;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface LandPlanStatus {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface LandPlanType {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface LandRegister extends Ephorte.GeographicalObject {
            MunicipalityNumber: Edm.Int32;
            CadastralUnitNumber: Edm.Int32;
            PropertyUnitNumber: Edm.Int32;
            LeaseholdUnitNumber: Edm.Int32;
            SectionUnitNumber: Edm.Int32;

        }
        export interface LawAndRegulations {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface LawRegulationReferenceToPrecedent {
            PrecedentId: Edm.String;
            LawAndRegulationId: Edm.String;
            Remark: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Precedent?: Ephorte.Precedent;
            LawAndRegulation?: Ephorte.LawAndRegulations;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DmbProposal {
            Id: Edm.Int32;
            Description: Edm.String;
            ProposernameId: Edm.Int32;
            ProposedDate: Edm.DateTimeOffset;
            SortOrder: Edm.Int32;
            DmbHandlingId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Proposername?: Ephorte.UserName;
            DmbHandling?: Ephorte.DMBHandling;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface PreauthenticatedReadDocumentTemplateUris {
            GetDocument: Edm.String;
            DummyKey: Edm.Int32;
            Token: Edm.String;
            Expiration: Edm.DateTimeOffset;

        }
        export interface PreauthenticatedReadDocumentUris {
            GetDocument: Edm.String;
            GetDocumentPreview: Edm.String;
            GetDocumentThumbnail: Edm.String;
            DummyKey: Edm.Int32;
            Token: Edm.String;
            Expiration: Edm.DateTimeOffset;

        }
        export interface PreauthenticatedWriteDocumentUris {
            DummyKey: Edm.Int32;
            Token: Edm.String;
            Expiration: Edm.DateTimeOffset;

        }
        export interface FieldMetadata {
            Id: Edm.Int32;
            TableId: Edm.Int32;
            DbFieldName: Edm.String;
            Caption: Edm.String;
            Header: Edm.String;
            Description: Edm.String;
            DataType: Ephorte.FieldDataType;
            FieldNames: Edm.String[];
            Options: Ephorte.FieldOption[];

        }
        export interface PredefinedQueryFavorite {
            Id: Edm.Int32;
            Description: Edm.String;
            QueryId: Edm.Int32;
            UserId: Edm.Int32;
            SortOrderInNavigationBar: Edm.Int32;
            DisplayInLocation: Edm.String;
            ViewId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Query?: Ephorte.PredefinedQuery;
            User?: Ephorte.User;
            View?: Ephorte.PredefinedQueryView;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface PredefinedQueryView {
            Id: Edm.Int32;
            Description: Edm.String;
            SeekType: Edm.String;
            ViewType: Ephorte.ViewType;
            QueryId: Edm.Int32;
            AdministrativeUnitId: Edm.Int32;
            RoleId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Query?: Ephorte.PredefinedQuery;
            Role?: Ephorte.Role;
            AdministrativeUnit?: Ephorte.AdministrativeUnit;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            Fields?: Ephorte.PredefinedQueryViewField[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface PredefinedQueryViewField {
            Id: Edm.Int32;
            ViewId: Edm.Int32;
            FieldName: Edm.String;
            Order: Edm.Int32;
            RowNumber: Edm.Int32;
            ColumnNumber: Edm.Int32;
            Table: Edm.String;
            TableId: Edm.Int32;
            Label: Edm.String;
            DisplayLabel: Edm.Boolean;
            HorizontalAlignment: Ephorte.ViewFieldHorizontalAlignment;
            DisplayWidth: Edm.Int32;
            DisplayWidthType: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            View?: Ephorte.PredefinedQueryView;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface TableMetadata {
            Id: Edm.Int32;
            TableId: Edm.Int32;
            DbTableName: Edm.String;
            Caption: Edm.String;
            Header: Edm.String;
            Description: Edm.String;
            ObjectNames: Edm.String[];
            Fields?: Ephorte.FieldMetadata[];

        }
        export interface PendingImportDocument {
            Id: Edm.String;
            IsMainDocument: Edm.Boolean;
            ImportCenterId: Edm.Int32;
            PendingImportId: Edm.String;
            Name: Edm.String;
            DisplayName: Edm.String;
            Length: Edm.Int64;
            FileFormatId: Edm.String;
            MimeType: Edm.String;
            Operation: Ephorte.Operation;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface PredefinedQueryParentsTree {
            PredefinedQueryId: Edm.Int32;
            PredefinedQueryPath: Edm.String;

        }
        export interface ImportTemplateResult {
            DummyKey: Edm.Int32;
            CaseTemplate?: Ephorte.Case;
            RegistryEntryTemplate?: Ephorte.RegistryEntry;
            ImportDocuments?: Ephorte.PendingImportDocument[];

        }
        export interface SenderRecipient {
            Id: Edm.Int32;
            IsRecipient: Edm.Boolean;
            RegistryEntryId: Edm.Int32;
            IsResponsible: Edm.Boolean;
            Name: Edm.String;
            IsAddressGroup: Edm.Boolean;
            AddressGroupName: Edm.String;
            IsRestricted: Edm.Boolean;
            ShortCode: Edm.String;
            PostalAddress: Edm.String;
            PostalCode: Edm.String;
            City: Edm.String;
            ForeignAddress: Edm.String;
            Email: Edm.String;
            IdTypeId: Edm.String;
            LastUpdated: Edm.DateTimeOffset;
            CreatedDate: Edm.DateTimeOffset;
            ExternalId: Edm.String;
            EncryptedSocialSecurityNumber: Edm.String;
            Reference: Edm.String;
            RegistryManagementUnitId: Edm.String;
            FollowUpMethodId: Edm.String;
            FollowedUpByRegistryEntryId: Edm.Int32;
            FollowedUpDate: Edm.DateTimeOffset;
            RepliesToRegistryEntryId: Edm.Int32;
            DueDate: Edm.Date;
            SendingMethodId: Edm.String;
            SendingStatusId: Edm.String;
            AddressId: Edm.Int32;
            Fax: Edm.String;
            Telephone: Edm.String;
            MustFollowUp: Edm.Boolean;
            Attention: Edm.String;
            ReferenceDate: Edm.Date;
            NotifyByEmail: Edm.Boolean;
            IsRead: Edm.Date;
            AssignedDate: Edm.DateTimeOffset;
            IsPerson: Edm.Boolean;
            ConversationId: Edm.String;
            TwoLetterCountryCode: Edm.String;
            CustomAttribute1: Edm.String;
            CustomAttribute2: Edm.String;
            CustomAttribute3: Edm.String;
            CustomAttribute4: Edm.String;
            CustomAttribute5: Edm.String;
            CustomAttribute6: Edm.String;
            CustomAttribute7: Edm.String;
            CustomAttribute8: Edm.String;
            CustomAttribute9: Edm.String;
            CustomAttribute10: Edm.String;
            Source: Edm.String;
            IsExternal: Edm.Boolean;
            IsCopy: Edm.Boolean;
            CreatedByUserNameId: Edm.Int32;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            FromAccessGroupId: Edm.Int32;
            Operation: Ephorte.Operation;
            RegistryEntry?: Ephorte.RegistryEntry;
            IdType?: Ephorte.IdentificationType;
            CaseWorker?: Ephorte.CaseWorkerSenderRecipient;
            RegistryManagementUnit?: Ephorte.RegistryManagementUnit;
            FollowUpMethod?: Ephorte.FollowUpMethod;
            FollowedUpByRegistryEntry?: Ephorte.RegistryEntry;
            RepliesToRegistryEntry?: Ephorte.RegistryEntry;
            SendingMethod?: Ephorte.SendingMethod;
            SendingStatus?: Ephorte.SendingStatus;
            Address?: Ephorte.Address;
            Country?: Ephorte.Country;
            SaveAsContact?: Ephorte.Address;
            SaveAsCaseParty?: Ephorte.CaseParty;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CaseWorkerSenderRecipient extends Ephorte.CaseWorker {

        }
        export interface LinkType {
            Id: Edm.String;
            Description: Edm.String;
            DefaultLink: Edm.String;
            Target: Edm.String;
            LinkParameters: Edm.String;
            Caption: Edm.String;
            Remark: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface LogEventType {
            Id: Edm.Int32;
            EventType: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface LogEventObject {
            Id: Edm.Int32;
            IsActive: Edm.Boolean;
            LogEventId: Edm.Int32;
            Key0: Edm.String;
            Key1: Edm.String;
            Key2: Edm.String;
            Key3: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            KeyFields: Edm.String[];
            Operation: Ephorte.Operation;
            LogEvent?: Ephorte.LogEvent;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface LogEventUserName {
            LogEventId: Edm.Int32;
            UserNameId: Edm.Int32;
            IsActive: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            LogEvent?: Ephorte.LogEvent;
            UserName?: Ephorte.UserName;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface LogEntry {
            Id: Edm.Int32;
            DatabaseTable: Edm.String;
            Date: Edm.DateTimeOffset;
            Time: Edm.DateTimeOffset;
            FieldName: Edm.String;
            PrimaryKey0: Edm.String;
            PrimaryKey1: Edm.String;
            PrimaryKey2: Edm.String;
            PrimaryKey3: Edm.String;
            PrimaryKeyFields: Edm.String;
            EventType: Edm.Int32;
            Text: Edm.String;
            CreatedByUserNameId: Edm.Int32;
            StoreTime: Edm.DateTimeOffset;
            Noark: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Meeting {
            Id: Edm.Int32;
            MeetingNumber: Edm.Int32;
            DMBId: Edm.Int32;
            IsClosed: Edm.Boolean;
            Pursuant: Edm.String;
            StartDateTime: Edm.DateTimeOffset;
            EndingDateTime: Edm.DateTimeOffset;
            MeetingLocation: Edm.String;
            MeetingRoom: Edm.String;
            DeadLine: Edm.DateTimeOffset;
            IsCasePlanLocked: Edm.Boolean;
            MinutesLocked: Edm.Boolean;
            Remark: Edm.String;
            IsPublished: Edm.Boolean;
            MeetingStatusId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            DMB?: Ephorte.DMB;
            MeetingStatus?: Ephorte.MeetingStatus;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            MeetingPermissions?: Ephorte.MeetingPermissions;
            RegistryEntries?: Ephorte.RegistryEntry[];
            DmbHandlings?: Ephorte.DMBHandling[];
            MeetingDocuments?: Ephorte.MeetingDocument[];
            CasePlanList?: Ephorte.DMBHandling[];
            Attendants?: Ephorte.MeetingAttendant[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface MeetingDistributionItem {
            FilePath: Edm.String;
            FileSize: Edm.Int32;
            LastWriteTime: Edm.DateTimeOffset;
            IsConvertedToPdf: Edm.Boolean;
            DocType: Edm.String;

        }
        export interface MeetingPermissions {
            DummyKey: Edm.Int32;
            IsValidForDeletion: Edm.Boolean;
            IsValidForCancellation: Edm.Boolean;

        }
        export interface MeetingAttendant {
            MeetingId: Edm.Int32;
            RepresentativeId: Edm.Int32;
            SortOrder: Edm.Int32;
            AttendanceCodeId: Edm.String;
            RepresentativeForId: Edm.Int32;
            IsDMBSecretary: Edm.Boolean;
            IsDMBLeader: Edm.Boolean;
            Remark: Edm.String;
            MeetingFee: Edm.Decimal;
            AttendanceRatio: Edm.Int32;
            RepresentativeAddressName: Edm.String;
            MeetingAllowanceId: Edm.Int32;
            DmbId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            DMBMeeting?: Ephorte.Meeting;
            Representative?: Ephorte.UserName;
            AttendanceCode?: Ephorte.DMBMemberRole;
            RepresentativeFor?: Ephorte.UserName;
            RepresentativeAddress?: Ephorte.Address;
            MeetingAllowance?: Ephorte.MeetingAllowance;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            PersonalRepresentativeFor?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface MeetingCaseType {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface MeetingDocument {
            Id: Edm.Int32;
            DMBId: Edm.Int32;
            MeetingId: Edm.Int32;
            DMBDocumentTypeId: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            StatusId: Edm.String;
            ClassId: Edm.String;
            IsPhysical: Edm.Boolean;
            Title: Edm.String;
            IsTitleRestricted: Edm.Boolean;
            AccessCodeId: Edm.String;
            AccessGroupId: Edm.Int32;
            Pursuant: Edm.String;
            DowngradingDate: Edm.Date;
            DowngradingCodeId: Edm.String;
            PreservationTime: Edm.Int32;
            DisposalDate: Edm.Date;
            DisposalCodeId: Edm.String;
            TitleRestricted: Edm.String;
            IsPublished: Edm.Boolean;
            PrimaryApprovedDate: Edm.Date;
            PrimaryApproverId: Edm.Int32;
            SecondaryApprovedDate: Edm.Date;
            SecondaryApproverId: Edm.Int32;
            Remark: Edm.String;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            DMB?: Ephorte.DMB;
            Meeting?: Ephorte.Meeting;
            DMBDocumentType?: Ephorte.DMBDocumentType;
            Status?: Ephorte.StatusMeetingDocument;
            Class?: Ephorte.Class;
            CaseWorker?: Ephorte.CaseWorkerMeetingDocument;
            AccessCode?: Ephorte.AccessCode;
            AccessGroup?: Ephorte.AccessGroup;
            DowngradingCode?: Ephorte.DowngradingCode;
            DisposalCode?: Ephorte.DisposalCode;
            PrimaryApprover?: Ephorte.UserName;
            SecondaryApprover?: Ephorte.UserName;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            MainDocument?: Ephorte.MeetingDocumentLink;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CaseWorkerMeetingDocument extends Ephorte.CaseWorker {

        }
        export interface MeetingDocumentLink {
            MeetingDocumentId: Edm.Int32;
            SortOrder: Edm.Int32;
            DocumentDescriptionId: Edm.Int32;
            DocumentLinkTypeId: Edm.String;
            AttachedDate: Edm.Date;
            AttachedByUserNameId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            MeetingDocument?: Ephorte.MeetingDocument;
            DocumentDescription?: Ephorte.DocumentDescription;
            DocumentLinkType?: Ephorte.DocumentLinkType;
            AttachedByUserName?: Ephorte.UserName;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface MergeFieldContent {
            MergeFieldName: Edm.String;
            Content: Edm.String;
            Caption: Edm.String;
            MinimumOccurences: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface NumberSeries {
            Id: Edm.Int32;
            Description: Edm.String;
            Year: Edm.Int32;
            Sequence1: Edm.Int32;
            Sequence2: Edm.Int32;
            Operation: Ephorte.Operation;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Permissions {
            DummyKey: Edm.Int32;
            CanCreate: Edm.Boolean;
            CanEdit: Edm.Boolean;
            CanDelete: Edm.Boolean;
            ReadOnlyFields?: Ephorte.Field[];
            RequiredFields?: Ephorte.Field[];

        }
        export interface PlanIdent extends Ephorte.GeographicalObject {
            PlanNumber: Edm.String;
            MunicipalityNumber: Edm.Int32;
            CountyNumber: Edm.Int32;
            GovernmentalNumber: Edm.Int32;

        }
        export interface PlanRegulations {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Position {
            Id: Edm.Int32;
            CaseId: Edm.Int32;
            PositionTypeId: Edm.String;
            Description: Edm.String;
            WorkLocation: Edm.String;
            IsClosed: Edm.Boolean;
            ContactInfo: Edm.String;
            AnnouncementDate: Edm.Date;
            PositionAnnouncementTypeId: Edm.String;
            Remark: Edm.String;
            ApplicationDueDate: Edm.Date;
            PercentageOfFullTime: Edm.Decimal;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Case?: Ephorte.Case;
            PositionType?: Ephorte.PositionType;
            PositionAnnouncementType?: Ephorte.PositionAnnouncementType;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            Applications?: Ephorte.PositionApplication[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface PositionAnnouncementType {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface PostalCode {
            Id: Edm.String;
            Description: Edm.String;
            MunicipalityNumber: Edm.String;
            MunicipalityName: Edm.String;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Precedent {
            Id: Edm.Int32;
            IsExternal: Edm.Boolean;
            CaseId: Edm.Int32;
            RegistryEntryId: Edm.Int32;
            PrecedentDate: Edm.Date;
            IsObsolete: Edm.Boolean;
            Title: Edm.String;
            CaseCategoryId: Edm.String;
            AdministrativeUnitId: Edm.Int32;
            AccessCodeId: Edm.String;
            AccessGroupId: Edm.Int32;
            Pursuant: Edm.String;
            LegalSourceFactor: Edm.String;
            Localization: Edm.String;
            Summary: Edm.String;
            DocumentDescriptionId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            ClosedDate: Edm.Date;
            CreatedByUserNameId: Edm.Int32;
            ClosedByUserNameId: Edm.Int32;
            CustomAttribute1: Edm.String;
            CustomAttribute2: Edm.String;
            CustomAttribute3: Edm.String;
            CustomAttribute4: Edm.String;
            CustomAttribute5: Edm.String;
            CustomAttribute6: Edm.String;
            CustomAttribute7: Edm.String;
            CustomAttribute8: Edm.String;
            CustomAttribute9: Edm.String;
            CustomAttribute10: Edm.String;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Case?: Ephorte.Case;
            RegistryEntry?: Ephorte.RegistryEntry;
            CaseCategory?: Ephorte.CaseCategory;
            AdministrativeUnit?: Ephorte.AdministrativeUnit;
            AccessCode?: Ephorte.AccessCode;
            AccessGroup?: Ephorte.AccessGroup;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface PrecedentReference {
            ReferenceFromPrecedentId: Edm.String;
            ReferenceToPrecedentId: Edm.String;
            IsToWays: Edm.Boolean;
            Remark: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            ReferenceFromPrecedent?: Ephorte.Precedent;
            ReferenceToPrecedent?: Ephorte.Precedent;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface PreviousMinutesOfMeeting {
            Id: Edm.Int32;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface RoleProfile {
            Id: Edm.Int32;
            AdministrativeUnitId: Edm.Int32;
            NavigationPane: Edm.String;
            Profile: Edm.String;
            RoleId: Edm.Int32;
            Languauge: Edm.String;
            SearchProfile: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Role?: Ephorte.Role;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Project {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface AddressProvider {
            DummyKey: Edm.Int32;
            ProviderName: Edm.String;

        }
        export interface PredefinedQuery {
            Id: Edm.Int32;
            Description: Edm.String;
            Remark: Edm.String;
            ParentId: Edm.Int32;
            SortOrderInNavigationBar: Edm.Int32;
            IntendedForUserRole: Edm.String;
            Module: Edm.String;
            SeekType: Edm.String;
            Target: Edm.String;
            ResultOrder: Edm.String;
            DistinctFields: Edm.String;
            MaxRows: Edm.Int32;
            DisplayCriteria: Edm.Boolean;
            DisplayUnreadForAdministrativeUnit: Edm.Boolean;
            DisplayUnreadForUser: Edm.Boolean;
            CountOfUnread: Edm.Int32;
            RunAtLogin: Edm.Boolean;
            AppliesToId: Edm.Int32;
            Image: Edm.String;
            ElementType: Edm.String;
            IntendedForRoleId: Edm.Int32;
            StyleSheet: Edm.String;
            Link: Edm.String;
            Variant: Edm.String;
            ClientType: Edm.Int32;
            IsVisibleInWeb: Edm.Boolean;
            Lookup: Edm.String;
            IsForNotification: Edm.Boolean;
            UserId: Edm.Int32;
            AdministrativeUnitId: Edm.Int32;
            AppliesTo: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            IsVisibleInSmallScreens: Edm.Boolean;
            IsExpanded: Edm.Boolean;
            TableId: Edm.Int32;
            Operation: Ephorte.Operation;
            Parent?: Ephorte.PredefinedQuery;
            FileType?: Ephorte.FileType;
            IntendedForRole?: Ephorte.Role;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            AdministrativeUnit?: Ephorte.AdministrativeUnit;
            User?: Ephorte.User;
            RegistryEntries?: Ephorte.RegistryEntry[];
            RegistryEntryDecisions?: Ephorte.RegistryEntry[];
            Cases?: Ephorte.Case[];
            Tasks?: Ephorte.Task[];
            PredefinedQueries?: Ephorte.PredefinedQuery[];
            Criterias?: Ephorte.QueryCriteria[];
            PredefinedQueryAggregation?: Ephorte.PredefinedQueryAggregation;
            PredefinedQueryParentsTree?: Ephorte.PredefinedQueryParentsTree;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface PredefinedQueryAggregation extends Ephorte.EntityCollectionAggregation {

        }
        export interface QueryCriteria {
            QueryId: Edm.Int32;
            AppliesToUserId: Edm.Int32;
            SeekType: Edm.String;
            SortOrder: Edm.String;
            IsEditable: Edm.Boolean;
            FieldName: Edm.String;
            Label: Edm.String;
            Table: Edm.String;
            Operator: Edm.String;
            DisplayValue: Edm.String;
            Value: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            IsRequired: Edm.Boolean;
            TableId: Edm.Int32;
            Operation: Ephorte.Operation;
            PredefinedQuery?: Ephorte.PredefinedQuery;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface RegistryEntryDispatch {
            DummyKey: Edm.Int32;
            FromName: Edm.String;
            FromMailAddress: Edm.String;
            ToNameCount: Edm.Int32;
            CcNameCount: Edm.Int32;
            BccNameCount: Edm.Int32;
            AttachmentsCount: Edm.Int32;

        }
        export interface RecordStatus {
            Id: Edm.Int32;
            NoarkStatus: Edm.String;
            Description: Edm.String;
            RegistrationResponsability: Edm.String;
            DocumentControl: Edm.String;
            CheckIfDispatched: Edm.Boolean;
            IsUsedByFondsPersonell: Edm.Boolean;
            IsUsedByManagers: Edm.Boolean;
            IsUsedByOfficers: Edm.Boolean;
            IsUsedForExternalDocuments: Edm.Boolean;
            IsUsedForInternalDocuments: Edm.Boolean;
            ShortCode: Edm.String;
            IsStandard: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface RegistryEntry {
            Id: Edm.Int32;
            RegisterYear: Edm.Int32;
            SequenceNumber: Edm.Int32;
            CaseId: Edm.Int32;
            DocumentNumber: Edm.Int32;
            RegistryDate: Edm.Date;
            RegistryEntryTypeId: Edm.String;
            DocumentDate: Edm.Date;
            IsUndated: Edm.Boolean;
            NoarkStatus: Edm.String;
            RecordStatusId: Edm.Int32;
            Title: Edm.String;
            TitleRestricted: Edm.String;
            TitlePersonNameTagged: Edm.String;
            IsRestricted: Edm.Boolean;
            FollowedUpDate: Edm.Date;
            SentDate: Edm.Date;
            DueDate: Edm.Date;
            ReceivedDate: Edm.Date;
            AccessCodeId: Edm.String;
            LastUpdated: Edm.DateTimeOffset;
            CreatedDate: Edm.DateTimeOffset;
            Pursuant: Edm.String;
            PublicDate: Edm.Date;
            DowngradedDate: Edm.Date;
            DowngradingCodeId: Edm.String;
            AccessGroupId: Edm.Int32;
            SeriesId: Edm.String;
            IsPhysical: Edm.Boolean;
            AdditionalClassId: Edm.String;
            NumberOfSubDocuments: Edm.Int32;
            LoanDate: Edm.Date;
            LoanedToUserNameId: Edm.Int32;
            IsSenderRecipientRestricted: Edm.Boolean;
            DocumentCategoryId: Edm.String;
            SenderRecipient: Edm.String;
            WorkFlowTaskId: Edm.Int32;
            ApprovedByUserNameId: Edm.Int32;
            ApprovalDate: Edm.Date;
            MustFollowUp: Edm.Int32;
            FileExtensionMainDocument: Edm.String;
            RegistryManagementUnitId: Edm.String;
            IsPublished: Edm.Boolean;
            CreatedByUserNameId: Edm.Int32;
            ArchivalDate: Edm.Date;
            ArchivedByUserNameId: Edm.Int32;
            LastRejectedDate: Edm.Date;
            PreservationTime: Edm.Int32;
            DisposalCodeId: Edm.String;
            DisposalDate: Edm.Date;
            CaseDraftRegistryEntryId: Edm.Int32;
            CasePartyLetterContent: Edm.String;
            CompletedDate: Edm.Date;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            DocumentTemplateId: Edm.Int32;
            Operation: Ephorte.Operation;
            Case?: Ephorte.Case;
            RegistryEntryType?: Ephorte.RegistryEntryType;
            RecordStatus?: Ephorte.RecordStatus;
            AccessCode?: Ephorte.AccessCode;
            DowngradingCode?: Ephorte.DowngradingCode;
            AccessGroup?: Ephorte.AccessGroup;
            Series?: Ephorte.Series;
            AdditionalClass?: Ephorte.AdditionalCode;
            LoanedToUserName?: Ephorte.UserName;
            CaseWorker?: Ephorte.CaseWorkerRegistryEntry;
            DocumentCategory?: Ephorte.DocumentCategory;
            ApprovedByUserName?: Ephorte.UserName;
            RegistryManagementUnit?: Ephorte.RegistryManagementUnit;
            ReadStatus?: Ephorte.RegistryEntryReadStatus;
            Registration?: Ephorte.RegistryEntryRegistration;
            CreatedByUserName?: Ephorte.UserName;
            DisposalCode?: Ephorte.DisposalCode;
            LastUpdatedByUserName?: Ephorte.UserName;
            MainDocument?: Ephorte.RegistryEntryDocument;
            MessageDocument?: Ephorte.RegistryEntryDocument;
            DocumentTemplate?: Ephorte.DocumentTemplate;
            RegistryEntryPermissions?: Ephorte.RegistryEntryPermissions;
            TasksAggregation?: Ephorte.RegistryEntryTasksAggregation;
            GeneralConditions?: Ephorte.GeneralConditions;
            Senders?: Ephorte.SenderRecipient[];
            Recipients?: Ephorte.SenderRecipient[];
            Remarks?: Ephorte.Remark[];
            DMBHandlings?: Ephorte.DMBHandling[];
            Tasks?: Ephorte.Task[];
            Links?: Ephorte.LinkFromRegistryEntry[];
            Documents?: Ephorte.RegistryEntryDocument[];
            Decisions?: Ephorte.RegistryEntryDecision[];
            CustomFieldDescriptors?: Ephorte.CustomFieldDescriptor[];
            RepliedBy?: Ephorte.RegistryEntry[];
            LogEntries?: Ephorte.LogEntry[];
            GeographicalObjects?: Ephorte.GeographicalObject[];
            ConstructionCases?: Ephorte.ConstructionCase[];
            Dispensations?: Ephorte.Dispensation[];
            Classifications?: Ephorte.RegistryEntryClassification[];
            ApplicationInitiatives?: Ephorte.BuildingApplicationInitiative[];
            ApplicationBuildingLocationLinks?: Ephorte.ApplicationBuildingLocationLink[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;
            [x: string]: any;
        }
        export interface RegistryEntryPermissions {
            DummyKey: Edm.Int32;
            CanAssign: Edm.Boolean;
            CanReject: Edm.Boolean;
            CanSendByEmail: Edm.Boolean;
            CanCreateEmailMessage: Edm.Boolean;
            CanSendToDigitalMailbox: Edm.Boolean;
            CanSendMeetingInvitation: Edm.Boolean;

        }
        export interface RegistryEntryReadStatus {
            DummyKey: Edm.Int32;
            IsRead: Edm.Boolean;

        }
        export interface CaseWorkerRegistryEntry extends Ephorte.CaseWorker {

        }
        export interface RegistryEntryTasksAggregation extends Ephorte.EntityCollectionAggregation {

        }
        export interface RegistryEntryRegistration {
            DummyKey: Edm.Int32;
            RegistrationId: Edm.String;

        }
        export interface RegistryEntryClassification extends Ephorte.ClassificationBase {
            RegistryEntryId: Edm.Int32;
            RegistryEntry?: Ephorte.RegistryEntry;

        }
        export interface RegistryEntryDecision {
            Id: Edm.Int32;
            Title: Edm.String;
            Description: Edm.String;
            DecisionNumber: Edm.Int32;
            DecisionTypeId: Edm.String;
            DMBId: Edm.Int32;
            DecisionDate: Edm.Date;
            DeadlineDate: Edm.Date;
            ImplementedDate: Edm.Date;
            ObjectId: Edm.Int32;
            ObjectType: Edm.Int32;
            ProcessingTime: Edm.Int32;
            DecisionStatusId: Edm.String;
            DmbCaseNumber: Edm.String;
            RegistryEntryId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            DecisionType?: Ephorte.DecisionType;
            CaseWorker?: Ephorte.CaseWorkerRegistryEntryDecision;
            DMB?: Ephorte.DMB;
            DecisionStatus?: Ephorte.DecisionStatus;
            RegistryEntry?: Ephorte.RegistryEntry;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CaseWorkerRegistryEntryDecision extends Ephorte.CaseWorker {

        }
        export interface RegistryEntryDocument {
            RegistryEntryId: Edm.Int32;
            DocumentDescriptionId: Edm.Int32;
            SortOrder: Edm.Int32;
            ReplacedByDocumentDescriptionId: Edm.Int32;
            ReplacesDocumentDescriptionId: Edm.Int32;
            DocumentLinkTypeId: Edm.String;
            AttachedByUserNameId: Edm.Int32;
            ConnectedDate: Edm.DateTimeOffset;
            LastUpdated: Edm.DateTimeOffset;
            CreatedDate: Edm.DateTimeOffset;
            IsMainDocument: Edm.Boolean;
            CustomAttribute1: Edm.String;
            CustomAttribute2: Edm.String;
            CustomAttribute3: Edm.String;
            CustomAttribute4: Edm.String;
            CustomAttribute5: Edm.String;
            CustomAttribute6: Edm.String;
            CustomAttribute7: Edm.String;
            CustomAttribute8: Edm.String;
            CustomAttribute9: Edm.String;
            CustomAttribute10: Edm.String;
            CreatedByUserNameId: Edm.Int32;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            RegistryEntry?: Ephorte.RegistryEntry;
            DocumentDescription?: Ephorte.DocumentDescription;
            ReplacedByDocumentDescription?: Ephorte.DocumentDescription;
            ReplacesDocumentDescription?: Ephorte.DocumentDescription;
            DocumentLinkType?: Ephorte.DocumentLinkType;
            AttachedByUserName?: Ephorte.UserName;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            RegistryEntryDocumentPermissions?: Ephorte.RegistryEntryDocumentPermissions;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface RegistryEntryDocumentPermissions {
            DummyKey: Edm.Int32;
            HasCrossReferencedDocuments: Edm.Boolean;

        }
        export interface LinkFromRegistryEntry extends Ephorte.DOM.Model.LinkFrom {
            RegistryEntryId: Edm.Int32;
            RegistryEntry?: Ephorte.RegistryEntry;

        }
        export interface RegistryEntryRead {
            RegistryEntryId: Edm.Int32;
            ReadByUnitId: Edm.Int32;
            ReadByUserId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            RegistryEntry?: Ephorte.RegistryEntry;
            ReadByUnit?: Ephorte.AdministrativeUnit;
            ReadByUser?: Ephorte.UserName;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface RegistryEntryType {
            Id: Edm.String;
            Description: Edm.String;
            IsExternal: Edm.Boolean;
            InternalRecipientAllowedFlag: Edm.Int32;
            ExternalRecipientAllowedFlag: Edm.Int32;
            HasToBeFollowedUp: Edm.Boolean;
            FollowUpMethodId: Edm.String;
            RegistryEntryTypeId: Edm.String;
            RecordType: Edm.Int32;
            DMBHandlingAllowedFlag: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            MainDocumentLinkTypeId: Edm.String;
            Operation: Ephorte.Operation;
            FollowUpMethod?: Ephorte.FollowUpMethod;
            ZZ_RegistryEntryType?: Ephorte.RegistryEntryType;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface RegistryManagementUnit {
            Id: Edm.String;
            Description: Edm.String;
            DefaultRecStatusIncomingArchiveId: Edm.Int32;
            DefaultRecStatusOutgoingArchiveId: Edm.Int32;
            DefaultRecStatusInternalArchiveId: Edm.Int32;
            DefaultRecStatusIncomingOfficerId: Edm.Int32;
            DefaultRecStatusOutgoingOfficerId: Edm.Int32;
            DefaultRecStatusInternalOfficerId: Edm.Int32;
            ReportGroup: Edm.String;
            ClosedDate: Edm.Date;
            Localization: Edm.String;
            IsPublished: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            DefaultRecStatusIncomingArchive?: Ephorte.RecordStatus;
            DefaultRecStatusOutgoingArchive?: Ephorte.RecordStatus;
            DefaultRecStatusInternalArchive?: Ephorte.RecordStatus;
            DefaultRecStatusIncomingOfficer?: Ephorte.RecordStatus;
            DefaultRecStatusOutgoingOfficer?: Ephorte.RecordStatus;
            DefaultRecStatusInternalOfficer?: Ephorte.RecordStatus;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            SeriesLinks?: Ephorte.SeriesLink[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Remark {
            Id: Edm.Int32;
            CaseId: Edm.Int32;
            DocumentDescriptionId: Edm.Int32;
            VersionNumber: Edm.Int32;
            VariantFormatId: Edm.String;
            SortOrder: Edm.Int32;
            RemarkTypeId: Edm.String;
            AccessCodeId: Edm.String;
            AccessGroupId: Edm.Int32;
            KeepUntilDate: Edm.Date;
            RegisteredDateTime: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            OnbehalfOfUserNameId: Edm.Int32;
            Text: Edm.String;
            DocumentId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            CreatedDate: Edm.DateTimeOffset;
            CustomAttribute1: Edm.String;
            CustomAttribute2: Edm.String;
            CustomAttribute3: Edm.String;
            CustomAttribute4: Edm.String;
            CustomAttribute5: Edm.String;
            CustomAttribute6: Edm.String;
            CustomAttribute7: Edm.String;
            CustomAttribute8: Edm.String;
            CustomAttribute9: Edm.String;
            CustomAttribute10: Edm.String;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Case?: Ephorte.Case;
            RegistryEntry?: Ephorte.RegistryEntry;
            DocumentDescription?: Ephorte.DocumentDescription;
            RemarkType?: Ephorte.InformationType;
            AccessCode?: Ephorte.AccessCode;
            AccessGroup?: Ephorte.AccessGroup;
            CreatedByUserName?: Ephorte.UserName;
            OnBehalfOfUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface RemoteStorageCode {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Role {
            Id: Edm.Int32;
            ShortCode: Edm.String;
            Description: Edm.String;
            IsAdministrator: Edm.Boolean;
            IsFondsAdministrator: Edm.Boolean;
            IsFondsPersonnel: Edm.Boolean;
            IsManager: Edm.Boolean;
            IsOfficer: Edm.Boolean;
            IsDMBSecretary: Edm.Boolean;
            IsGuest: Edm.Boolean;
            IsServiceRead: Edm.Boolean;
            IsServiceReadWrite: Edm.Boolean;
            CanUpdateDMBsAndMembers: Edm.Boolean;
            CanUseOperatingFunctions: Edm.Boolean;
            CanCreateNewRoles: Edm.Boolean;
            AuthorizationRights: Edm.Int32;
            AssignRoleRights: Edm.Int32;
            AddAdmUnitRights: Edm.Int32;
            CanAddPersons: Edm.Boolean;
            CanAddFondsInformation: Edm.Boolean;
            CanAddAddresses: Edm.Boolean;
            AddCaseRights: Edm.Int32;
            UpdateCaseResponsibleRights: Edm.Int32;
            CaseClassificationRights: Edm.Int32;
            CaseClassificationRightsAdditional: Edm.Int32;
            UpdateStatusRights: Edm.Int32;
            MoveRegistryEntryRights: Edm.Int32;
            AddInternalRegistryEntryRights: Edm.Int32;
            AddExternalRegistryEntryRights: Edm.Int32;
            UpdateCaseManagerRights: Edm.Int32;
            FollowUpDocumentRights: Edm.Int32;
            DispatchDocumentRights: Edm.Int32;
            ChangeCasePart: Edm.String;
            ChangeDeadlineRights: Edm.Int32;
            ChangeAccessRights: Edm.Int32;
            AddDocumentRights: Edm.Int32;
            ArchiveDraftsRights: Edm.Int32;
            AddRemarkRights: Edm.Int32;
            AddWorkflowLogRights: Edm.Int32;
            CanAddCcRecipient: Edm.Boolean;
            AddFolderRights: Edm.Int32;
            AddAccessGroupRights: Edm.Int32;
            AddTemplateRights: Edm.Int32;
            ReadAuditTrailLogRights: Edm.Int32;
            CanAddImportCenter: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Schema {
            Id: Edm.Int32;
            Name: Edm.String;
            Template: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface SendingMethod {
            Id: Edm.String;
            Description: Edm.String;
            ConvertToPdf: Edm.Boolean;
            UseEmail: Edm.Boolean;
            UseEde: Edm.Boolean;
            UsePrint: Edm.Boolean;
            OnlyMetadata: Edm.Boolean;
            UseEdf: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface SendingStatus {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Series {
            Id: Edm.String;
            Description: Edm.String;
            FondsId: Edm.String;
            RecordsPeriodId: Edm.Int32;
            FondsStatusId: Edm.String;
            PrimaryClassificationSystemId: Edm.String;
            PrimaryClassId: Edm.String;
            SecondaryClassificationSystemId: Edm.String;
            HasOptionalSecondaryClassificationSystem: Edm.Boolean;
            BlocedForNewCases: Edm.Boolean;
            BlockedForNewRecords: Edm.Boolean;
            IsClosed: Edm.Boolean;
            RemoteStoragePrinciple: Edm.String;
            RemoteStorageCodeId: Edm.String;
            SuccessorSeriesId: Edm.String;
            IsPhysical: Edm.Boolean;
            IsDigital: Edm.Boolean;
            DefaultSequenceId: Edm.Int32;
            ReportGroup: Edm.String;
            StartDate: Edm.Date;
            ToDate: Edm.Date;
            Localization: Edm.String;
            Remark: Edm.String;
            ReportSelection: Edm.String;
            TransferDate: Edm.Date;
            TransferControlledDate: Edm.Date;
            TransferControlledById: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            ClosedDate: Edm.Date;
            ClosedByUserNameId: Edm.Int32;
            AccessCodeId: Edm.String;
            PreservationTime: Edm.Int32;
            DisposalCodeId: Edm.String;
            DisposalPrinciple: Edm.String;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Fonds?: Ephorte.Fonds;
            RecordsPeriod?: Ephorte.FondsPeriod;
            FondsStatus?: Ephorte.FondsStatus;
            PrimaryClassificationSystem?: Ephorte.ClassificationSystem;
            SecondaryClassificationSystem?: Ephorte.ClassificationSystem;
            RemoteStorageCode?: Ephorte.RemoteStorageCode;
            SuccessorSeries?: Ephorte.Series;
            TransferControlledBy?: Ephorte.UserName;
            CreatedByUserName?: Ephorte.UserName;
            ClosedByUserName?: Ephorte.UserName;
            AccessCode?: Ephorte.AccessCode;
            DisposalCode?: Ephorte.DisposalCode;
            LastUpdatedByUserName?: Ephorte.UserName;
            AsSeriesLink?: Ephorte.SeriesLink;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface StatusMeetingDocument {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface StatutoryAutority {
            AccessCodeId: Edm.String;
            Pursuant: Edm.String;
            DowngradingCodeId: Edm.String;
            NumberOfYearsTillDowngrade: Edm.Int32;
            NumberOfDaysTillDowngrade: Edm.Int32;
            Application: Edm.String;
            Default: Edm.Boolean;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            AccessCode?: Ephorte.AccessCode;
            DowngradingCode?: Ephorte.DowngradingCode;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface StorageUnit {
            Id: Edm.String;
            Description: Edm.String;
            DocumentPath: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface SubdivisionApplication {
            Id: Edm.Int32;
            CaseId: Edm.Int32;
            RegistryEntryId: Edm.Int32;
            SequenceNumber: Edm.Int32;
            RegisterYear: Edm.Int32;
            Remark: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Case?: Ephorte.Case;
            RegistryEntry?: Ephorte.RegistryEntry;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface SubdivisionConference {
            Id: Edm.Int32;
            SequenceNumber: Edm.Int32;
            RegisterYear: Edm.Int32;
            Remark: Edm.String;
            Date: Edm.Date;
            NewAddress: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface Task {
            Id: Edm.Int32;
            AdditionalId: Edm.Int32;
            LegalDecisionCodes: Edm.String;
            PercentComplete: Edm.Int32;
            FollowUpMethodId: Edm.String;
            TaskHandlingSequenceId: Edm.String;
            IsMandatory: Edm.Boolean;
            HandlingTime: Edm.Int32;
            Title: Edm.String;
            TaskDecisionCodeId: Edm.String;
            EstimatedTime: Edm.Int32;
            DocumentCategoryId: Edm.String;
            DocumentTemplateId: Edm.Int32;
            DocumentTitle: Edm.String;
            IsDublicateable: Edm.Boolean;
            ParentId: Edm.Int32;
            DueDate: Edm.Date;
            TaskTemplateId: Edm.Int32;
            CompletedByUserNameId: Edm.Int32;
            CompleteDate: Edm.Date;
            HierarchyPath: Edm.Int32[];
            IsPartOfTotal: Edm.Boolean;
            AccessCodeId: Edm.String;
            RecordStatusId: Edm.Int32;
            NoarkStatus: Edm.String;
            Remark: Edm.String;
            Description: Edm.String;
            RegistryEntryTypeId: Edm.String;
            ObjectId: Edm.Int32;
            ObjectType: Edm.Int32;
            ObjectOrder: Edm.Int32;
            ScheduledDate: Edm.Date;
            PriorityId: Edm.String;
            ReportCategoryId: Edm.String;
            ActualWork: Edm.Decimal;
            DocumentDescriptionId: Edm.String;
            CreatedByUserNameId: Edm.Int32;
            ZZ_CreatedDate: Edm.Date;
            SortOrder: Edm.Int32;
            RoleId: Edm.Int32;
            CaseTypeId: Edm.String;
            SendToCaseParty: Edm.Boolean;
            CasePartyCriteria: Edm.String;
            FileTypeId: Edm.String;
            StartDate: Edm.Date;
            BelongsToAdmUnitId: Edm.Int32;
            BelongsToUserId: Edm.Int32;
            TaskTypeId: Edm.String;
            IsRestricted: Edm.Boolean;
            Link: Edm.String;
            DoneDate: Edm.Date;
            TaskStatusId: Edm.Int32;
            TaskAlertCodeId: Edm.String;
            Number: Edm.String;
            LastUpdated: Edm.DateTimeOffset;
            CreatedDate: Edm.DateTimeOffset;
            PhaseTypeId: Edm.Int32;
            CasePartyRoleId: Edm.String;
            CustomAttribute1: Edm.String;
            CustomAttribute2: Edm.String;
            CustomAttribute3: Edm.String;
            CustomAttribute4: Edm.String;
            CustomAttribute5: Edm.String;
            DisplayNumber: Edm.String;
            CheckPointTypeId: Edm.String;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            ProcessCategoryId: Edm.String;
            WithDispensation: Edm.Boolean;
            WithRegulationChange: Edm.Boolean;
            ProcessQueue: Edm.String;
            ConditionalSubTasks: Edm.Boolean;
            ParentDecisionCodeId: Edm.String;
            ShortageDecisionCodeId: Edm.String;
            Function: Edm.String;
            ShortageSeverityTypeId: Edm.Int32;
            MergeFieldId: Edm.String;
            AutoExecution: Edm.Boolean;
            Operation: Ephorte.Operation;
            FollowUpMethod?: Ephorte.FollowUpMethod;
            CaseWorker?: Ephorte.CaseWorkerTask;
            TaskHandlingSequence?: Ephorte.TaskHandlingSequence;
            TaskDecisionCode?: Ephorte.TaskDecisionCode;
            DocumentCategory?: Ephorte.DocumentCategory;
            DocumentTemplate?: Ephorte.DocumentTemplate;
            CompletedByUserName?: Ephorte.UserName;
            AccessCode?: Ephorte.AccessCode;
            RecordStatus?: Ephorte.RecordStatus;
            RegistryEntryType?: Ephorte.RegistryEntryType;
            Priority?: Ephorte.TaskPriority;
            ReportCategory?: Ephorte.TaskReportCategory;
            DocumentDescription?: Ephorte.DocumentDescription;
            CreatedByUserName?: Ephorte.UserName;
            Role?: Ephorte.Role;
            CaseType?: Ephorte.CaseCategory;
            BelongsToAdmUnit?: Ephorte.AdministrativeUnit;
            BelongsToUser?: Ephorte.User;
            TaskType?: Ephorte.TaskType;
            TaskStatus?: Ephorte.TaskStatus;
            TaskAlertCode?: Ephorte.TaskAlertCode;
            PhaseType?: Ephorte.ActivityPhaseType;
            CasePartyRole?: Ephorte.CasePartyRole;
            Case?: Ephorte.Case;
            TaskTemplate?: Ephorte.Task;
            Tasks?: Ephorte.Task[];
            RegistryEntry?: Ephorte.RegistryEntry;
            Parent?: Ephorte.Task;
            CheckPointType?: Ephorte.TaskCheckPointType;
            LastUpdatedByUserName?: Ephorte.UserName;
            ProcessCategory?: Ephorte.ProcessCategory;
            ParentDecisionCode?: Ephorte.TaskDecisionCode;
            ShortageDecisionCode?: Ephorte.TaskDecisionCode;
            FunctionObject?: Ephorte.TaskFunction;
            ShortageSeverityType?: Ephorte.ShortageSeverityType;
            MergeField?: Ephorte.MergeField;
            TaskDocuments?: Ephorte.TaskDocument[];
            Recipients?: Ephorte.TaskRecipient[];
            TaskBranchRoots?: Ephorte.TaskBranchRoot[];
            DMB?: Ephorte.TaskDMB[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CaseWorkerTask extends Ephorte.CaseWorker {

        }
        export interface TaskAlertCode {
            Id: Edm.String;
            Description: Edm.String;
            NotifyByEmail: Edm.Boolean;
            IsUnread: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface TaskBranchRoot {
            TaskId: Edm.Int32;
            TaskTemplateId: Edm.Int32;
            ObjectType: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Task?: Ephorte.Task;
            TaskTemplate?: Ephorte.Task;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface TaskDecisionCode {
            Id: Edm.String;
            Description: Edm.String;
            IsNegative: Edm.Boolean;
            IsPositive: Edm.Boolean;
            TaskStatusId: Edm.Int32;
            CancelWorkFlow: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            TaskStatus?: Ephorte.TaskStatus;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface TaskHandlingSequence {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface TaskPriority {
            Id: Edm.String;
            Description: Edm.String;
            SortOrder: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface TaskRecipient {
            Id: Edm.Int32;
            TaskId: Edm.Int32;
            IsRecipient: Edm.Boolean;
            IsExternal: Edm.Boolean;
            CC: Edm.Boolean;
            ResponsibleUserName: Edm.Boolean;
            Name: Edm.String;
            ShortCode: Edm.String;
            PostalAddress: Edm.String;
            PostalCode: Edm.String;
            City: Edm.String;
            ForeignAddress: Edm.String;
            Email: Edm.String;
            Reference: Edm.String;
            RegistryManagementUnitId: Edm.String;
            SendingMethodId: Edm.String;
            SendingStatusId: Edm.String;
            AddressId: Edm.Int32;
            Fax: Edm.String;
            Attention: Edm.String;
            MeetingCaseTypeId: Edm.String;
            DMBId: Edm.Int32;
            SortOrder: Edm.Int32;
            Source: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Task?: Ephorte.Task;
            CaseWorker?: Ephorte.CaseWorkerTaskRecipient;
            RegistryManagementUnit?: Ephorte.RegistryManagementUnit;
            SendingMethod?: Ephorte.SendingMethod;
            SendingStatus?: Ephorte.SendingStatus;
            Address?: Ephorte.Address;
            MeetingCaseType?: Ephorte.MeetingCaseType;
            DMB?: Ephorte.DMB;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CaseWorkerTaskRecipient extends Ephorte.CaseWorker {

        }
        export interface TaskReportCategory {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface TaskStatus {
            Id: Edm.Int32;
            Description: Edm.String;
            IsActive: Edm.Boolean;
            IsComplete: Edm.Boolean;
            SortOrder: Edm.Int32;
            GeoIntegrationStatusId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface TaskType {
            Id: Edm.String;
            Description: Edm.String;
            Milestone: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface UnitType {
            Id: Edm.String;
            Description: Edm.String;
            ParentId: Edm.String;
            Caption: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Parent?: Ephorte.UnitType;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface User {
            Id: Edm.Int32;
            UserId: Edm.String;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            ExternalRef: Edm.Int32;
            AccessToAllUserRoles: Edm.Boolean;
            Picture: Edm.String;
            Password: Edm.String;
            PoliticalPartyId: Edm.Int32;
            Constituency: Edm.String;
            Gender: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CurrentUserName?: Ephorte.UserName;
            DefaultRole?: Ephorte.UserRole;
            PoliticalParty?: Ephorte.Address;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            Roles?: Ephorte.UserRole[];
            PredefinedQueryFavorites?: Ephorte.PredefinedQueryFavorite[];
            Authorizations?: Ephorte.Authorization[];
            Addresses?: Ephorte.UserAddress[];
            OnBehalfOfs?: Ephorte.OnBehalfOf[];
            AdditionalLogins?: Ephorte.AdditionalLogin[];
            AccessGroupMemberships?: Ephorte.AccessGroupMembership[];
            Names?: Ephorte.UserName[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface UserAddress {
            UserId: Edm.Int32;
            AddressId: Edm.Int32;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            User?: Ephorte.User;
            Address?: Ephorte.Address;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface UserName {
            Id: Edm.Int32;
            UserId: Edm.Int32;
            IsCurrent: Edm.Boolean;
            Initials: Edm.String;
            Name: Edm.String;
            FirstName: Edm.String;
            MiddleName: Edm.String;
            LastName: Edm.String;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            User?: Ephorte.User;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            UserAddressAggregate?: Ephorte.UserAddressAggregate;
            DmbMemberAggregates?: Ephorte.DmbMemberAggregate[];
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface UserRole {
            Id: Edm.Int32;
            UserId: Edm.Int32;
            RoleId: Edm.Int32;
            DefaultRole: Edm.Boolean;
            Title: Edm.String;
            FormattedTitle: Edm.String;
            AdministrativeUnitId: Edm.Int32;
            RegistryManagementUnitId: Edm.String;
            SeriesId: Edm.String;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            JobTitle: Edm.String;
            IsAvailable: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Module: Edm.String;
            Operation: Ephorte.Operation;
            User?: Ephorte.User;
            CurrentUserName?: Ephorte.UserName;
            Role?: Ephorte.Role;
            AdministrativeUnit?: Ephorte.AdministrativeUnit;
            RegistryManagementUnit?: Ephorte.RegistryManagementUnit;
            Series?: Ephorte.Series;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface VariantFormat {
            Id: Edm.String;
            Description: Edm.String;
            AllowUpdate: Edm.Boolean;
            AllowDelete: Edm.Boolean;
            AllowNewVersions: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ZoningCode {
            Id: Edm.String;
            Description: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface ZoningCodes {
            Id: Edm.Int32;
            CaseId: Edm.Int32;
            Remark: Edm.String;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            Case?: Ephorte.Case;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface DmbMemberAggregate {
            Id: Edm.Int32;
            IsMember: Edm.Boolean;
            IsActive: Edm.Boolean;
            DmbId: Edm.Int32;
            DmbName: Edm.String;
            Function: Edm.String;
            Represents: Edm.String;
            FromDate: Edm.Date;
            ToDate: Edm.Date;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface UserAddressAggregate {
            Id: Edm.Int32;
            UserId: Edm.Int32;
            WorkPostAddress: Edm.String;
            WorkShortCode: Edm.String;
            WorkCity: Edm.String;
            WorkEmail: Edm.String;
            WorkTelephone: Edm.String;
            WorkMobile: Edm.String;
            WorkVisitAddress: Edm.String;
            WorkOverseas: Edm.String;
            WorkFax: Edm.String;
            PrivatePostAddress: Edm.String;
            PrivateShortCode: Edm.String;
            PrivateCity: Edm.String;
            PrivateEmail: Edm.String;
            PrivateTelephone: Edm.String;
            PrivateMobile: Edm.String;
            PrivateBankAccount: Edm.String;
            PrivateExternalId: Edm.String;
            PrivateVisitAddress: Edm.String;
            PrivateOverseas: Edm.String;
            PrivateFax: Edm.String;
            Name: Edm.String;
            Initials: Edm.String;
            FirstName: Edm.String;
            MiddleName: Edm.String;
            LastName: Edm.String;
            IsCurrent: Edm.Boolean;
            Picture: Edm.String;
            PrivateCreatedDate: Edm.DateTimeOffset;
            PrivateCreatedByUserNameId: Edm.Int32;
            PrivateLastUpdated: Edm.DateTimeOffset;
            PrivateLastUpdatedByUserNameId: Edm.Int32;
            PrivateChangeId: Edm.Int64;
            PrivateSystemId: Edm.Guid;
            PrivateLastUpdatedByExternalSystem: Edm.String;
            PrivateCreatedByExternalSystem: Edm.String;
            WorkCreatedDate: Edm.DateTimeOffset;
            WorkCreatedByUserNameId: Edm.Int32;
            WorkLastUpdated: Edm.DateTimeOffset;
            WorkLastUpdatedByUserNameId: Edm.Int32;
            WorkChangeId: Edm.Int64;
            WorkSystemId: Edm.Guid;
            WorkLastUpdatedByExternalSystem: Edm.String;
            WorkCreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            PrivateCreatedByUserName?: Ephorte.UserName;
            PrivateLastUpdatedByUserName?: Ephorte.UserName;
            WorkCreatedByUserName?: Ephorte.UserName;
            WorkLastUpdatedByUserName?: Ephorte.UserName;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }

        // Complex types
        export interface FieldOption {
            Text: Edm.String;
            Value: Edm.String;

        }
        export interface License {
            CustomerId: Edm.Int32;
            ExternalSystemName: Edm.String;
            ModuleName: Edm.String;
            IsValid: Edm.Boolean;
            Message: Edm.String;
            ExpirationDate: Edm.DateTimeOffset;
            GracePeriodExpirationDate: Edm.DateTimeOffset;

        }

        // Enum Types
        // Enum Values: Table = 0, List = 1
        export type ViewType = "Table" | "List";
        // Enum Values: Undefined = 0, String = 1, Numeric = 2, Boolean = 3, DateTime = 4, Options = 5
        export type FieldDataType = "Undefined" | "String" | "Numeric" | "Boolean" | "DateTime" | "Options";
        // Enum Values: Delete = 1, Create = 2, Update = 3
        export type Operation = "Delete" | "Create" | "Update";
        // Enum Values: Left = 0, Right = 1, Center = 2
        export type ViewFieldHorizontalAlignment = "Left" | "Right" | "Center";

        // Entity container
        export class Container extends odatatools.ProxyBase {
            constructor(address: string, name?: string, additionalHeaders?: odatajs.Header) {
                super(address, name, additionalHeaders);
                this.BuildingFloor = new BuildingFloorEntitySet("BuildingFloor", address, "Id", additionalHeaders);
                this.BuildingInformation = new BuildingInformationEntitySet("BuildingInformation", address, "DummyKey", additionalHeaders);
                this.Buildings = new BuildingsEntitySet("Buildings", address, "DummyKey", additionalHeaders);
                this.Formal = new FormalEntitySet("Formal", address, "DummyKey", additionalHeaders);
                this.GeneralTerms = new GeneralTermsEntitySet("GeneralTerms", address, "DummyKey", additionalHeaders);
                this.Infrastructure = new InfrastructureEntitySet("Infrastructure", address, "DummyKey", additionalHeaders);
                this.LandUse = new LandUseEntitySet("LandUse", address, "DummyKey", additionalHeaders);
                this.LocationConflict = new LocationConflictEntitySet("LocationConflict", address, "DummyKey", additionalHeaders);
                this.MatrikkelStatus = new MatrikkelStatusEntitySet("MatrikkelStatus", address, "Id", additionalHeaders);
                this.MetadataMapping = new MetadataMappingEntitySet("MetadataMapping", address, "Id", additionalHeaders);
                this.Notification = new NotificationEntitySet("Notification", address, "Id", additionalHeaders);
                this.NotificationMethod = new NotificationMethodEntitySet("NotificationMethod", address, "Id", additionalHeaders);
                this.Notifications = new NotificationsEntitySet("Notifications", address, "DummyKey", additionalHeaders);
                this.ObjectStatus = new ObjectStatusEntitySet("ObjectStatus", address, "SystemId", additionalHeaders);
                this.Plan = new PlanEntitySet("Plan", address, "DummyKey", additionalHeaders);
                this.Area = new AreaEntitySet("Area", address, "", additionalHeaders);
                this.RequirementsBuildingFoundation = new RequirementsBuildingFoundationEntitySet("RequirementsBuildingFoundation", address, "DummyKey", additionalHeaders);
                this.Road = new RoadEntitySet("Road", address, "DummyKey", additionalHeaders);
                this.ShortageSeverityType = new ShortageSeverityTypeEntitySet("ShortageSeverityType", address, "Id", additionalHeaders);
                this.TaskCheckPointType = new TaskCheckPointTypeEntitySet("TaskCheckPointType", address, "Id", additionalHeaders);
                this.TaskDMB = new TaskDMBEntitySet("TaskDMB", address, "Id", additionalHeaders);
                this.TaskDocument = new TaskDocumentEntitySet("TaskDocument", address, "Id", additionalHeaders);
                this.TaskDocumentTemplateModel = new TaskDocumentTemplateModelEntitySet("TaskDocumentTemplateModel", address, "Id", additionalHeaders);
                this.TaskFunction = new TaskFunctionEntitySet("TaskFunction", address, "DummyKey", additionalHeaders);
                this.TechnicalInstallations = new TechnicalInstallationsEntitySet("TechnicalInstallations", address, "DummyKey", additionalHeaders);
                this.UsageUnit = new UsageUnitEntitySet("UsageUnit", address, "Id", additionalHeaders);
                this.UsageUnitCode = new UsageUnitCodeEntitySet("UsageUnitCode", address, "Id", additionalHeaders);
                this.WorkItem = new WorkItemEntitySet("WorkItem", address, "ItemId", additionalHeaders);
                this.WaterSupply = new WaterSupplyEntitySet("WaterSupply", address, "DummyKey", additionalHeaders);
                this.ActionLink = new ActionLinkEntitySet("ActionLink", address, "Id", additionalHeaders);
                this.BuildingCaseLocationLink = new BuildingCaseLocationLinkEntitySet("BuildingCaseLocationLink", address, "Id", additionalHeaders);
                this.CalculationRule = new CalculationRuleEntitySet("CalculationRule", address, "Id", additionalHeaders);
                this.CaseTitleTemplate = new CaseTitleTemplateEntitySet("CaseTitleTemplate", address, "Id", additionalHeaders);
                this.ActionPurpose = new ActionPurposeEntitySet("ActionPurpose", address, "Id", additionalHeaders);
                this.ApplicationBuildingLocationLink = new ApplicationBuildingLocationLinkEntitySet("ApplicationBuildingLocationLink", address, "Id", additionalHeaders);
                this.BuildingApplicationInitiative = new BuildingApplicationInitiativeEntitySet("BuildingApplicationInitiative", address, "Id", additionalHeaders);
                this.ConstructionType = new ConstructionTypeEntitySet("ConstructionType", address, "Id", additionalHeaders);
                this.Country = new CountryEntitySet("Country", address, "TwoLetterCountryCode", additionalHeaders);
                this.EnergySupply = new EnergySupplyEntitySet("EnergySupply", address, "Id", additionalHeaders);
                this.EnergySupplyType = new EnergySupplyTypeEntitySet("EnergySupplyType", address, "Id", additionalHeaders);
                this.GeneralConditions = new GeneralConditionsEntitySet("GeneralConditions", address, "Id", additionalHeaders);
                this.GiRegulationPlan = new GiRegulationPlanEntitySet("GiRegulationPlan", address, "PlanId", additionalHeaders);
                this.ProcessCategory = new ProcessCategoryEntitySet("ProcessCategory", address, "Id", additionalHeaders);
                this.RegistryEntryTitleTemplate = new RegistryEntryTitleTemplateEntitySet("RegistryEntryTitleTemplate", address, "Id", additionalHeaders);
                this.FloorType = new FloorTypeEntitySet("FloorType", address, "Id", additionalHeaders);
                this.HeatDistribution = new HeatDistributionEntitySet("HeatDistribution", address, "Id", additionalHeaders);
                this.HeatDistributionType = new HeatDistributionTypeEntitySet("HeatDistributionType", address, "Id", additionalHeaders);
                this.HomeAddress = new HomeAddressEntitySet("HomeAddress", address, "Id", additionalHeaders);
                this.IndustryGroup = new IndustryGroupEntitySet("IndustryGroup", address, "Id", additionalHeaders);
                this.InitiativePurposeLink = new InitiativePurposeLinkEntitySet("InitiativePurposeLink", address, "Id", additionalHeaders);
                this.KitchenCode = new KitchenCodeEntitySet("KitchenCode", address, "Id", additionalHeaders);
                this.PropertyBuildingSite = new PropertyBuildingSiteEntitySet("PropertyBuildingSite", address, "Id", additionalHeaders);
                this.RoadType = new RoadTypeEntitySet("RoadType", address, "Id", additionalHeaders);
                this.RoadTypeLink = new RoadTypeLinkEntitySet("RoadTypeLink", address, "Id", additionalHeaders);
                this.SewageConnectionType = new SewageConnectionTypeEntitySet("SewageConnectionType", address, "Id", additionalHeaders);
                this.WaterSupplyConnectionType = new WaterSupplyConnectionTypeEntitySet("WaterSupplyConnectionType", address, "Id", additionalHeaders);
                this.Widget = new WidgetEntitySet("Widget", address, "Id", additionalHeaders);
                this.WidgetRoleLink = new WidgetRoleLinkEntitySet("WidgetRoleLink", address, "Id", additionalHeaders);
                this.WidgetUserLink = new WidgetUserLinkEntitySet("WidgetUserLink", address, "Id", additionalHeaders);
                this.AccessGroupMembership = new AccessGroupMembershipEntitySet("AccessGroupMembership", address, "UserId", additionalHeaders);
                this.AdditionalLogin = new AdditionalLoginEntitySet("AdditionalLogin", address, "Id", additionalHeaders);
                this.AddressGroupMembership = new AddressGroupMembershipEntitySet("AddressGroupMembership", address, "AddressGroupId", additionalHeaders);
                this.AdministrativeUnitRelation = new AdministrativeUnitRelationEntitySet("AdministrativeUnitRelation", address, "SuccessorAdministrativeUnitId", additionalHeaders);
                this.CommitteeHandlingStatus = new CommitteeHandlingStatusEntitySet("CommitteeHandlingStatus", address, "Id", additionalHeaders);
                this.CustomerFunctions = new CustomerFunctionsEntitySet("CustomerFunctions", address, "Id", additionalHeaders);
                this.CustomField = new CustomFieldEntitySet("CustomField", address, "Id", additionalHeaders);
                this.Dispensation = new DispensationEntitySet("Dispensation", address, "Id", additionalHeaders);
                this.DocumentType = new DocumentTypeEntitySet("DocumentType", address, "Id", additionalHeaders);
                this.FormFieldMetadata = new FormFieldMetadataEntitySet("FormFieldMetadata", address, "DummyKey", additionalHeaders);
                this.FondsCreatorMembership = new FondsCreatorMembershipEntitySet("FondsCreatorMembership", address, "FondsId", additionalHeaders);
                this.LogEvent = new LogEventEntitySet("LogEvent", address, "Id", additionalHeaders);
                this.MergeField = new MergeFieldEntitySet("MergeField", address, "Name", additionalHeaders);
                this.PositionType = new PositionTypeEntitySet("PositionType", address, "Id", additionalHeaders);
                this.Table = new TableEntitySet("Table", address, "Id", additionalHeaders);
                this.TableField = new TableFieldEntitySet("TableField", address, "Id", additionalHeaders);
                this.OrganizationIdentifier = new OrganizationIdentifierEntitySet("OrganizationIdentifier", address, "", additionalHeaders);
                this.PersonIdentifier = new PersonIdentifierEntitySet("PersonIdentifier", address, "", additionalHeaders);
                this.Phrase = new PhraseEntitySet("Phrase", address, "Id", additionalHeaders);
                this.ValueListItem = new ValueListItemEntitySet("ValueListItem", address, "DummyKey", additionalHeaders);
                this.ValueList = new ValueListEntitySet("ValueList", address, "DummyKey", additionalHeaders);
                this.Fonds = new FondsEntitySet("Fonds", address, "Id", additionalHeaders);
                this.FondsCreator = new FondsCreatorEntitySet("FondsCreator", address, "Id", additionalHeaders);
                this.OnBehalfOf = new OnBehalfOfEntitySet("OnBehalfOf", address, "UserId", additionalHeaders);
                this.SearchIndexKeyword = new SearchIndexKeywordEntitySet("SearchIndexKeyword", address, "Keyword", additionalHeaders);
                this.SearchIndexStopword = new SearchIndexStopwordEntitySet("SearchIndexStopword", address, "Word", additionalHeaders);
                this.SeriesLink = new SeriesLinkEntitySet("SeriesLink", address, "RegistryManagementUnitId", additionalHeaders);
                this.AccessCode = new AccessCodeEntitySet("AccessCode", address, "Id", additionalHeaders);
                this.AccessGroup = new AccessGroupEntitySet("AccessGroup", address, "Id", additionalHeaders);
                this.ActivityPhaseType = new ActivityPhaseTypeEntitySet("ActivityPhaseType", address, "Id", additionalHeaders);
                this.AdditionalCode = new AdditionalCodeEntitySet("AdditionalCode", address, "Id", additionalHeaders);
                this.AdditionalInformation = new AdditionalInformationEntitySet("AdditionalInformation", address, "Id", additionalHeaders);
                this.AddressGroup = new AddressGroupEntitySet("AddressGroup", address, "Id", additionalHeaders);
                this.Address = new AddressEntitySet("Address", address, "Id", additionalHeaders);
                this.AddressType = new AddressTypeEntitySet("AddressType", address, "Id", additionalHeaders);
                this.AdministrativeUnit = new AdministrativeUnitEntitySet("AdministrativeUnit", address, "Id", additionalHeaders);
                this.AdministrativeUnitAddress = new AdministrativeUnitAddressEntitySet("AdministrativeUnitAddress", address, "AdministrativeUnitId", additionalHeaders);
                this.Applicant = new ApplicantEntitySet("Applicant", address, "Id", additionalHeaders);
                this.ApplicantCompetence = new ApplicantCompetenceEntitySet("ApplicantCompetence", address, "Id", additionalHeaders);
                this.PositionApplication = new PositionApplicationEntitySet("PositionApplication", address, "ApplicantId", additionalHeaders);
                this.ApplicationStatus = new ApplicationStatusEntitySet("ApplicationStatus", address, "Id", additionalHeaders);
                this.ApplicationType = new ApplicationTypeEntitySet("ApplicationType", address, "Id", additionalHeaders);
                this.AutorizationForAdmUnit = new AutorizationForAdmUnitEntitySet("AutorizationForAdmUnit", address, "UserId", additionalHeaders);
                this.BuildingAction = new BuildingActionEntitySet("BuildingAction", address, "Id", additionalHeaders);
                this.BuildingIdent = new BuildingIdentEntitySet("BuildingIdent", address, "", additionalHeaders);
                this.BuildingType = new BuildingTypeEntitySet("BuildingType", address, "Id", additionalHeaders);
                this.AdministrativeUnitAuthorization = new AdministrativeUnitAuthorizationEntitySet("AdministrativeUnitAuthorization", address, "UserId", additionalHeaders);
                this.Authorization = new AuthorizationEntitySet("Authorization", address, "UserId", additionalHeaders);
                this.Context = new ContextEntitySet("Context", address, "DummyKey", additionalHeaders);
                this.Configuration = new ConfigurationEntitySet("Configuration", address, "DummyKey", additionalHeaders);
                this.PendingImport = new PendingImportEntitySet("PendingImport", address, "Id", additionalHeaders);
                this.ImportCenter = new ImportCenterEntitySet("ImportCenter", address, "Id", additionalHeaders);
                this.ImportCenterObjectType = new ImportCenterObjectTypeEntitySet("ImportCenterObjectType", address, "Id", additionalHeaders);
                this.ImportCenterType = new ImportCenterTypeEntitySet("ImportCenterType", address, "Id", additionalHeaders);
                this.MeetingAllowance = new MeetingAllowanceEntitySet("MeetingAllowance", address, "DMBId", additionalHeaders);
                this.MeetingStatus = new MeetingStatusEntitySet("MeetingStatus", address, "Id", additionalHeaders);
                this.DatabaseInfo = new DatabaseInfoEntitySet("DatabaseInfo", address, "Name", additionalHeaders);
                this.Case = new CaseEntitySet("Case", address, "Id", additionalHeaders);
                this.CaseReadStatus = new CaseReadStatusEntitySet("CaseReadStatus", address, "DummyKey", additionalHeaders);
                this.CaseWorkerCase = new CaseWorkerCaseEntitySet("CaseWorkerCase", address, "", additionalHeaders);
                this.ApplicationsAggregation = new ApplicationsAggregationEntitySet("ApplicationsAggregation", address, "", additionalHeaders);
                this.CaseCategory = new CaseCategoryEntitySet("CaseCategory", address, "Id", additionalHeaders);
                this.CasePartySenderRecipient = new CasePartySenderRecipientEntitySet("CasePartySenderRecipient", address, "DummyKey", additionalHeaders);
                this.CaseClassification = new CaseClassificationEntitySet("CaseClassification", address, "", additionalHeaders);
                this.LinkFromCase = new LinkFromCaseEntitySet("LinkFromCase", address, "", additionalHeaders);
                this.CaseParty = new CasePartyEntitySet("CaseParty", address, "Id", additionalHeaders);
                this.CasePartyRole = new CasePartyRoleEntitySet("CasePartyRole", address, "Id", additionalHeaders);
                this.CasePartyRoleMember = new CasePartyRoleMemberEntitySet("CasePartyRoleMember", address, "Id", additionalHeaders);
                this.CaseRead = new CaseReadEntitySet("CaseRead", address, "CaseId", additionalHeaders);
                this.CaseStatus = new CaseStatusEntitySet("CaseStatus", address, "Id", additionalHeaders);
                this.CaseWorkerKey = new CaseWorkerKeyEntitySet("CaseWorkerKey", address, "DummyKey", additionalHeaders);
                this.CaseWorker = new CaseWorkerEntitySet("CaseWorker", address, "DummyKey", additionalHeaders);
                this.Class = new ClassEntitySet("Class", address, "ClassificationSystemId", additionalHeaders);
                this.ClassificationBase = new ClassificationBaseEntitySet("ClassificationBase", address, "Id", additionalHeaders);
                this.ClassificationSystem = new ClassificationSystemEntitySet("ClassificationSystem", address, "Id", additionalHeaders);
                this.ClassificationSystemType = new ClassificationSystemTypeEntitySet("ClassificationSystemType", address, "Id", additionalHeaders);
                this.DMBCaseListType = new DMBCaseListTypeEntitySet("DMBCaseListType", address, "DMBId", additionalHeaders);
                this.DMBHandlingDocument = new DMBHandlingDocumentEntitySet("DMBHandlingDocument", address, "DMBHandlingId", additionalHeaders);
                this.DMBHandlingStatus = new DMBHandlingStatusEntitySet("DMBHandlingStatus", address, "Id", additionalHeaders);
                this.ConferCase = new ConferCaseEntitySet("ConferCase", address, "Id", additionalHeaders);
                this.ConstructionCase = new ConstructionCaseEntitySet("ConstructionCase", address, "Id", additionalHeaders);
                this.Coordinate = new CoordinateEntitySet("Coordinate", address, "", additionalHeaders);
                this.County = new CountyEntitySet("County", address, "Id", additionalHeaders);
                this.CurrentUserInfo = new CurrentUserInfoEntitySet("CurrentUserInfo", address, "DummyKey", additionalHeaders);
                this.CustomFieldDescriptor = new CustomFieldDescriptorEntitySet("CustomFieldDescriptor", address, "Id", additionalHeaders);
                this.DataObjectChange = new DataObjectChangeEntitySet("DataObjectChange", address, "ID", additionalHeaders);
                this.DecisionStatus = new DecisionStatusEntitySet("DecisionStatus", address, "Id", additionalHeaders);
                this.DecisionType = new DecisionTypeEntitySet("DecisionType", address, "Id", additionalHeaders);
                this.DefaultValues = new DefaultValuesEntitySet("DefaultValues", address, "AdminstrativeUnitId", additionalHeaders);
                this.Deputize = new DeputizeEntitySet("Deputize", address, "UserRoleId", additionalHeaders);
                this.DigitalCertificatDocument = new DigitalCertificatDocumentEntitySet("DigitalCertificatDocument", address, "Id", additionalHeaders);
                this.DispensationType = new DispensationTypeEntitySet("DispensationType", address, "Id", additionalHeaders);
                this.DisposalCode = new DisposalCodeEntitySet("DisposalCode", address, "Id", additionalHeaders);
                this.DMB = new DMBEntitySet("DMB", address, "Id", additionalHeaders);
                this.DMBCaseHandling = new DMBCaseHandlingEntitySet("DMBCaseHandling", address, "Id", additionalHeaders);
                this.DMBDocumentType = new DMBDocumentTypeEntitySet("DMBDocumentType", address, "Id", additionalHeaders);
                this.DMBHandling = new DMBHandlingEntitySet("DMBHandling", address, "Id", additionalHeaders);
                this.CaseWorkerDMBHandling = new CaseWorkerDMBHandlingEntitySet("CaseWorkerDMBHandling", address, "", additionalHeaders);
                this.DMBHandlingValidation = new DMBHandlingValidationEntitySet("DMBHandlingValidation", address, "DummyKey", additionalHeaders);
                this.DMBMember = new DMBMemberEntitySet("DMBMember", address, "DMBId", additionalHeaders);
                this.DMBMemberRole = new DMBMemberRoleEntitySet("DMBMemberRole", address, "Id", additionalHeaders);
                this.DMBType = new DMBTypeEntitySet("DMBType", address, "Id", additionalHeaders);
                this.DocumentCategory = new DocumentCategoryEntitySet("DocumentCategory", address, "Id", additionalHeaders);
                this.DocumentDescription = new DocumentDescriptionEntitySet("DocumentDescription", address, "Id", additionalHeaders);
                this.DocumentDescriptionLinksInfo = new DocumentDescriptionLinksInfoEntitySet("DocumentDescriptionLinksInfo", address, "DummyKey", additionalHeaders);
                this.LinkFromDocumentDescription = new LinkFromDocumentDescriptionEntitySet("LinkFromDocumentDescription", address, "", additionalHeaders);
                this.DocumentLinkType = new DocumentLinkTypeEntitySet("DocumentLinkType", address, "Id", additionalHeaders);
                this.DocumentObject = new DocumentObjectEntitySet("DocumentObject", address, "DocumentDescriptionId", additionalHeaders);
                this.DocumentStatus = new DocumentStatusEntitySet("DocumentStatus", address, "Id", additionalHeaders);
                this.DocumentTemplate = new DocumentTemplateEntitySet("DocumentTemplate", address, "Id", additionalHeaders);
                this.DocumentTemplateType = new DocumentTemplateTypeEntitySet("DocumentTemplateType", address, "Id", additionalHeaders);
                this.DowngradingCode = new DowngradingCodeEntitySet("DowngradingCode", address, "Id", additionalHeaders);
                this.EntityCollectionAggregation = new EntityCollectionAggregationEntitySet("EntityCollectionAggregation", address, "DummyKey", additionalHeaders);
                this.ExternalSystem = new ExternalSystemEntitySet("ExternalSystem", address, "Id", additionalHeaders);
                this.ExternalSystemLinkCase = new ExternalSystemLinkCaseEntitySet("ExternalSystemLinkCase", address, "DummyKey", additionalHeaders);
                this.ExternalSystemLinkRegistryEntry = new ExternalSystemLinkRegistryEntryEntitySet("ExternalSystemLinkRegistryEntry", address, "DummyKey", additionalHeaders);
                this.FeeType = new FeeTypeEntitySet("FeeType", address, "Id", additionalHeaders);
                this.Field = new FieldEntitySet("Field", address, "DummyKey", additionalHeaders);
                this.FileFormat = new FileFormatEntitySet("FileFormat", address, "Id", additionalHeaders);
                this.FileType = new FileTypeEntitySet("FileType", address, "Id", additionalHeaders);
                this.RecurringCasePlanListItem = new RecurringCasePlanListItemEntitySet("RecurringCasePlanListItem", address, "SortOrder", additionalHeaders);
                this.Folder = new FolderEntitySet("Folder", address, "Id", additionalHeaders);
                this.FolderCaseLink = new FolderCaseLinkEntitySet("FolderCaseLink", address, "CaseId", additionalHeaders);
                this.FolderDocumentLink = new FolderDocumentLinkEntitySet("FolderDocumentLink", address, "DocumentDescriptionId", additionalHeaders);
                this.FolderRegistryEntryLink = new FolderRegistryEntryLinkEntitySet("FolderRegistryEntryLink", address, "RegistryEntryId", additionalHeaders);
                this.FollowUpMethod = new FollowUpMethodEntitySet("FollowUpMethod", address, "Id", additionalHeaders);
                this.FondsPeriod = new FondsPeriodEntitySet("FondsPeriod", address, "Id", additionalHeaders);
                this.FondsStatus = new FondsStatusEntitySet("FondsStatus", address, "Id", additionalHeaders);
                this.GeographicalEntity = new GeographicalEntityEntitySet("GeographicalEntity", address, "Id", additionalHeaders);
                this.Wkt = new WktEntitySet("Wkt", address, "DummyKey", additionalHeaders);
                this.GeographicalObjectLink = new GeographicalObjectLinkEntitySet("GeographicalObjectLink", address, "Id", additionalHeaders);
                this.GeographicalObjectType = new GeographicalObjectTypeEntitySet("GeographicalObjectType", address, "Id", additionalHeaders);
                this.IdentificationType = new IdentificationTypeEntitySet("IdentificationType", address, "Id", additionalHeaders);
                this.InformationType = new InformationTypeEntitySet("InformationType", address, "Id", additionalHeaders);
                this.InvoiceStatus = new InvoiceStatusEntitySet("InvoiceStatus", address, "Id", additionalHeaders);
                this.Invoice = new InvoiceEntitySet("Invoice", address, "Id", additionalHeaders);
                this.InvoiceLineItem = new InvoiceLineItemEntitySet("InvoiceLineItem", address, "Id", additionalHeaders);
                this.Keyword = new KeywordEntitySet("Keyword", address, "Text", additionalHeaders);
                this.KeywordReference = new KeywordReferenceEntitySet("KeywordReference", address, "KeyWord1Id", additionalHeaders);
                this.KeywordsPrecedents = new KeywordsPrecedentsEntitySet("KeywordsPrecedents", address, "PrecedentId", additionalHeaders);
                this.LandPlan = new LandPlanEntitySet("LandPlan", address, "Id", additionalHeaders);
                this.LandPlanStatus = new LandPlanStatusEntitySet("LandPlanStatus", address, "Id", additionalHeaders);
                this.LandPlanType = new LandPlanTypeEntitySet("LandPlanType", address, "Id", additionalHeaders);
                this.LandRegister = new LandRegisterEntitySet("LandRegister", address, "", additionalHeaders);
                this.LawAndRegulations = new LawAndRegulationsEntitySet("LawAndRegulations", address, "Id", additionalHeaders);
                this.LawRegulationReferenceToPrecedent = new LawRegulationReferenceToPrecedentEntitySet("LawRegulationReferenceToPrecedent", address, "PrecedentId", additionalHeaders);
                this.DmbProposal = new DmbProposalEntitySet("DmbProposal", address, "Id", additionalHeaders);
                this.PreauthenticatedReadDocumentTemplateUris = new PreauthenticatedReadDocumentTemplateUrisEntitySet("PreauthenticatedReadDocumentTemplateUris", address, "GetDocument", additionalHeaders);
                this.PreauthenticatedReadDocumentUris = new PreauthenticatedReadDocumentUrisEntitySet("PreauthenticatedReadDocumentUris", address, "GetDocument", additionalHeaders);
                this.PreauthenticatedWriteDocumentUris = new PreauthenticatedWriteDocumentUrisEntitySet("PreauthenticatedWriteDocumentUris", address, "DummyKey", additionalHeaders);
                this.FieldMetadata = new FieldMetadataEntitySet("FieldMetadata", address, "Id", additionalHeaders);
                this.PredefinedQueryFavorite = new PredefinedQueryFavoriteEntitySet("PredefinedQueryFavorite", address, "Id", additionalHeaders);
                this.PredefinedQueryView = new PredefinedQueryViewEntitySet("PredefinedQueryView", address, "Id", additionalHeaders);
                this.PredefinedQueryViewField = new PredefinedQueryViewFieldEntitySet("PredefinedQueryViewField", address, "Id", additionalHeaders);
                this.TableMetadata = new TableMetadataEntitySet("TableMetadata", address, "Id", additionalHeaders);
                this.PendingImportDocument = new PendingImportDocumentEntitySet("PendingImportDocument", address, "Id", additionalHeaders);
                this.PredefinedQueryParentsTree = new PredefinedQueryParentsTreeEntitySet("PredefinedQueryParentsTree", address, "PredefinedQueryId", additionalHeaders);
                this.ImportTemplateResult = new ImportTemplateResultEntitySet("ImportTemplateResult", address, "DummyKey", additionalHeaders);
                this.SenderRecipient = new SenderRecipientEntitySet("SenderRecipient", address, "Id", additionalHeaders);
                this.CaseWorkerSenderRecipient = new CaseWorkerSenderRecipientEntitySet("CaseWorkerSenderRecipient", address, "", additionalHeaders);
                this.LinkType = new LinkTypeEntitySet("LinkType", address, "Id", additionalHeaders);
                this.LogEventType = new LogEventTypeEntitySet("LogEventType", address, "Id", additionalHeaders);
                this.LogEventObject = new LogEventObjectEntitySet("LogEventObject", address, "Id", additionalHeaders);
                this.LogEventUserName = new LogEventUserNameEntitySet("LogEventUserName", address, "LogEventId", additionalHeaders);
                this.LogEntry = new LogEntryEntitySet("LogEntry", address, "Id", additionalHeaders);
                this.Meeting = new MeetingEntitySet("Meeting", address, "Id", additionalHeaders);
                this.MeetingDistributionItem = new MeetingDistributionItemEntitySet("MeetingDistributionItem", address, "FilePath", additionalHeaders);
                this.MeetingPermissions = new MeetingPermissionsEntitySet("MeetingPermissions", address, "DummyKey", additionalHeaders);
                this.MeetingAttendant = new MeetingAttendantEntitySet("MeetingAttendant", address, "MeetingId", additionalHeaders);
                this.MeetingCaseType = new MeetingCaseTypeEntitySet("MeetingCaseType", address, "Id", additionalHeaders);
                this.MeetingDocument = new MeetingDocumentEntitySet("MeetingDocument", address, "Id", additionalHeaders);
                this.CaseWorkerMeetingDocument = new CaseWorkerMeetingDocumentEntitySet("CaseWorkerMeetingDocument", address, "", additionalHeaders);
                this.MeetingDocumentLink = new MeetingDocumentLinkEntitySet("MeetingDocumentLink", address, "MeetingDocumentId", additionalHeaders);
                this.MergeFieldContent = new MergeFieldContentEntitySet("MergeFieldContent", address, "MergeFieldName", additionalHeaders);
                this.NumberSeries = new NumberSeriesEntitySet("NumberSeries", address, "Id", additionalHeaders);
                this.Permissions = new PermissionsEntitySet("Permissions", address, "DummyKey", additionalHeaders);
                this.PlanIdent = new PlanIdentEntitySet("PlanIdent", address, "", additionalHeaders);
                this.PlanRegulations = new PlanRegulationsEntitySet("PlanRegulations", address, "Id", additionalHeaders);
                this.Position = new PositionEntitySet("Position", address, "Id", additionalHeaders);
                this.PositionAnnouncementType = new PositionAnnouncementTypeEntitySet("PositionAnnouncementType", address, "Id", additionalHeaders);
                this.PostalCode = new PostalCodeEntitySet("PostalCode", address, "Id", additionalHeaders);
                this.Precedent = new PrecedentEntitySet("Precedent", address, "Id", additionalHeaders);
                this.PrecedentReference = new PrecedentReferenceEntitySet("PrecedentReference", address, "ReferenceFromPrecedentId", additionalHeaders);
                this.PreviousMinutesOfMeeting = new PreviousMinutesOfMeetingEntitySet("PreviousMinutesOfMeeting", address, "Id", additionalHeaders);
                this.RoleProfile = new RoleProfileEntitySet("RoleProfile", address, "Id", additionalHeaders);
                this.Project = new ProjectEntitySet("Project", address, "Id", additionalHeaders);
                this.AddressProvider = new AddressProviderEntitySet("AddressProvider", address, "DummyKey", additionalHeaders);
                this.PredefinedQuery = new PredefinedQueryEntitySet("PredefinedQuery", address, "Id", additionalHeaders);
                this.PredefinedQueryAggregation = new PredefinedQueryAggregationEntitySet("PredefinedQueryAggregation", address, "", additionalHeaders);
                this.QueryCriteria = new QueryCriteriaEntitySet("QueryCriteria", address, "QueryId", additionalHeaders);
                this.RegistryEntryDispatch = new RegistryEntryDispatchEntitySet("RegistryEntryDispatch", address, "DummyKey", additionalHeaders);
                this.RecordStatus = new RecordStatusEntitySet("RecordStatus", address, "Id", additionalHeaders);
                this.RegistryEntry = new RegistryEntryEntitySet("RegistryEntry", address, "Id", additionalHeaders);
                this.RegistryEntryPermissions = new RegistryEntryPermissionsEntitySet("RegistryEntryPermissions", address, "DummyKey", additionalHeaders);
                this.RegistryEntryReadStatus = new RegistryEntryReadStatusEntitySet("RegistryEntryReadStatus", address, "DummyKey", additionalHeaders);
                this.CaseWorkerRegistryEntry = new CaseWorkerRegistryEntryEntitySet("CaseWorkerRegistryEntry", address, "", additionalHeaders);
                this.RegistryEntryTasksAggregation = new RegistryEntryTasksAggregationEntitySet("RegistryEntryTasksAggregation", address, "", additionalHeaders);
                this.RegistryEntryRegistration = new RegistryEntryRegistrationEntitySet("RegistryEntryRegistration", address, "DummyKey", additionalHeaders);
                this.RegistryEntryClassification = new RegistryEntryClassificationEntitySet("RegistryEntryClassification", address, "", additionalHeaders);
                this.RegistryEntryDecision = new RegistryEntryDecisionEntitySet("RegistryEntryDecision", address, "Id", additionalHeaders);
                this.CaseWorkerRegistryEntryDecision = new CaseWorkerRegistryEntryDecisionEntitySet("CaseWorkerRegistryEntryDecision", address, "", additionalHeaders);
                this.RegistryEntryDocument = new RegistryEntryDocumentEntitySet("RegistryEntryDocument", address, "RegistryEntryId", additionalHeaders);
                this.RegistryEntryDocumentPermissions = new RegistryEntryDocumentPermissionsEntitySet("RegistryEntryDocumentPermissions", address, "DummyKey", additionalHeaders);
                this.LinkFromRegistryEntry = new LinkFromRegistryEntryEntitySet("LinkFromRegistryEntry", address, "", additionalHeaders);
                this.RegistryEntryRead = new RegistryEntryReadEntitySet("RegistryEntryRead", address, "RegistryEntryId", additionalHeaders);
                this.RegistryEntryType = new RegistryEntryTypeEntitySet("RegistryEntryType", address, "Id", additionalHeaders);
                this.RegistryManagementUnit = new RegistryManagementUnitEntitySet("RegistryManagementUnit", address, "Id", additionalHeaders);
                this.Remark = new RemarkEntitySet("Remark", address, "Id", additionalHeaders);
                this.RemoteStorageCode = new RemoteStorageCodeEntitySet("RemoteStorageCode", address, "Id", additionalHeaders);
                this.Role = new RoleEntitySet("Role", address, "Id", additionalHeaders);
                this.Schema = new SchemaEntitySet("Schema", address, "Id", additionalHeaders);
                this.SendingMethod = new SendingMethodEntitySet("SendingMethod", address, "Id", additionalHeaders);
                this.SendingStatus = new SendingStatusEntitySet("SendingStatus", address, "Id", additionalHeaders);
                this.Series = new SeriesEntitySet("Series", address, "Id", additionalHeaders);
                this.StatusMeetingDocument = new StatusMeetingDocumentEntitySet("StatusMeetingDocument", address, "Id", additionalHeaders);
                this.StatutoryAutority = new StatutoryAutorityEntitySet("StatutoryAutority", address, "AccessCodeId", additionalHeaders);
                this.StorageUnit = new StorageUnitEntitySet("StorageUnit", address, "Id", additionalHeaders);
                this.SubdivisionApplication = new SubdivisionApplicationEntitySet("SubdivisionApplication", address, "Id", additionalHeaders);
                this.SubdivisionConference = new SubdivisionConferenceEntitySet("SubdivisionConference", address, "Id", additionalHeaders);
                this.Task = new TaskEntitySet("Task", address, "Id", additionalHeaders);
                this.CaseWorkerTask = new CaseWorkerTaskEntitySet("CaseWorkerTask", address, "", additionalHeaders);
                this.TaskAlertCode = new TaskAlertCodeEntitySet("TaskAlertCode", address, "Id", additionalHeaders);
                this.TaskBranchRoot = new TaskBranchRootEntitySet("TaskBranchRoot", address, "TaskId", additionalHeaders);
                this.TaskDecisionCode = new TaskDecisionCodeEntitySet("TaskDecisionCode", address, "Id", additionalHeaders);
                this.TaskHandlingSequence = new TaskHandlingSequenceEntitySet("TaskHandlingSequence", address, "Id", additionalHeaders);
                this.TaskPriority = new TaskPriorityEntitySet("TaskPriority", address, "Id", additionalHeaders);
                this.TaskRecipient = new TaskRecipientEntitySet("TaskRecipient", address, "Id", additionalHeaders);
                this.CaseWorkerTaskRecipient = new CaseWorkerTaskRecipientEntitySet("CaseWorkerTaskRecipient", address, "", additionalHeaders);
                this.TaskReportCategory = new TaskReportCategoryEntitySet("TaskReportCategory", address, "Id", additionalHeaders);
                this.TaskStatus = new TaskStatusEntitySet("TaskStatus", address, "Id", additionalHeaders);
                this.TaskType = new TaskTypeEntitySet("TaskType", address, "Id", additionalHeaders);
                this.UnitType = new UnitTypeEntitySet("UnitType", address, "Id", additionalHeaders);
                this.User = new UserEntitySet("User", address, "Id", additionalHeaders);
                this.UserAddress = new UserAddressEntitySet("UserAddress", address, "UserId", additionalHeaders);
                this.UserName = new UserNameEntitySet("UserName", address, "Id", additionalHeaders);
                this.UserRole = new UserRoleEntitySet("UserRole", address, "Id", additionalHeaders);
                this.VariantFormat = new VariantFormatEntitySet("VariantFormat", address, "Id", additionalHeaders);
                this.ZoningCode = new ZoningCodeEntitySet("ZoningCode", address, "Id", additionalHeaders);
                this.ZoningCodes = new ZoningCodesEntitySet("ZoningCodes", address, "Id", additionalHeaders);
                this.DmbMemberAggregate = new DmbMemberAggregateEntitySet("DmbMemberAggregate", address, "Id", additionalHeaders);
                this.UserAddressAggregate = new UserAddressAggregateEntitySet("UserAddressAggregate", address, "Id", additionalHeaders);
                this.GeographicalObject = new GeographicalObjectEntitySet("GeographicalObject", address, "Id", additionalHeaders);
            }
            BuildingFloor: BuildingFloorEntitySet;
            BuildingInformation: BuildingInformationEntitySet;
            Buildings: BuildingsEntitySet;
            Formal: FormalEntitySet;
            GeneralTerms: GeneralTermsEntitySet;
            Infrastructure: InfrastructureEntitySet;
            LandUse: LandUseEntitySet;
            LocationConflict: LocationConflictEntitySet;
            MatrikkelStatus: MatrikkelStatusEntitySet;
            MetadataMapping: MetadataMappingEntitySet;
            Notification: NotificationEntitySet;
            NotificationMethod: NotificationMethodEntitySet;
            Notifications: NotificationsEntitySet;
            ObjectStatus: ObjectStatusEntitySet;
            Plan: PlanEntitySet;
            Area: AreaEntitySet;
            RequirementsBuildingFoundation: RequirementsBuildingFoundationEntitySet;
            Road: RoadEntitySet;
            ShortageSeverityType: ShortageSeverityTypeEntitySet;
            TaskCheckPointType: TaskCheckPointTypeEntitySet;
            TaskDMB: TaskDMBEntitySet;
            TaskDocument: TaskDocumentEntitySet;
            TaskDocumentTemplateModel: TaskDocumentTemplateModelEntitySet;
            TaskFunction: TaskFunctionEntitySet;
            TechnicalInstallations: TechnicalInstallationsEntitySet;
            UsageUnit: UsageUnitEntitySet;
            UsageUnitCode: UsageUnitCodeEntitySet;
            WorkItem: WorkItemEntitySet;
            WaterSupply: WaterSupplyEntitySet;
            ActionLink: ActionLinkEntitySet;
            BuildingCaseLocationLink: BuildingCaseLocationLinkEntitySet;
            CalculationRule: CalculationRuleEntitySet;
            CaseTitleTemplate: CaseTitleTemplateEntitySet;
            ActionPurpose: ActionPurposeEntitySet;
            ApplicationBuildingLocationLink: ApplicationBuildingLocationLinkEntitySet;
            BuildingApplicationInitiative: BuildingApplicationInitiativeEntitySet;
            ConstructionType: ConstructionTypeEntitySet;
            Country: CountryEntitySet;
            EnergySupply: EnergySupplyEntitySet;
            EnergySupplyType: EnergySupplyTypeEntitySet;
            GeneralConditions: GeneralConditionsEntitySet;
            GiRegulationPlan: GiRegulationPlanEntitySet;
            ProcessCategory: ProcessCategoryEntitySet;
            RegistryEntryTitleTemplate: RegistryEntryTitleTemplateEntitySet;
            FloorType: FloorTypeEntitySet;
            HeatDistribution: HeatDistributionEntitySet;
            HeatDistributionType: HeatDistributionTypeEntitySet;
            HomeAddress: HomeAddressEntitySet;
            IndustryGroup: IndustryGroupEntitySet;
            InitiativePurposeLink: InitiativePurposeLinkEntitySet;
            KitchenCode: KitchenCodeEntitySet;
            PropertyBuildingSite: PropertyBuildingSiteEntitySet;
            RoadType: RoadTypeEntitySet;
            RoadTypeLink: RoadTypeLinkEntitySet;
            SewageConnectionType: SewageConnectionTypeEntitySet;
            WaterSupplyConnectionType: WaterSupplyConnectionTypeEntitySet;
            Widget: WidgetEntitySet;
            WidgetRoleLink: WidgetRoleLinkEntitySet;
            WidgetUserLink: WidgetUserLinkEntitySet;
            AccessGroupMembership: AccessGroupMembershipEntitySet;
            AdditionalLogin: AdditionalLoginEntitySet;
            AddressGroupMembership: AddressGroupMembershipEntitySet;
            AdministrativeUnitRelation: AdministrativeUnitRelationEntitySet;
            CommitteeHandlingStatus: CommitteeHandlingStatusEntitySet;
            CustomerFunctions: CustomerFunctionsEntitySet;
            CustomField: CustomFieldEntitySet;
            Dispensation: DispensationEntitySet;
            DocumentType: DocumentTypeEntitySet;
            FormFieldMetadata: FormFieldMetadataEntitySet;
            FondsCreatorMembership: FondsCreatorMembershipEntitySet;
            LogEvent: LogEventEntitySet;
            MergeField: MergeFieldEntitySet;
            PositionType: PositionTypeEntitySet;
            Table: TableEntitySet;
            TableField: TableFieldEntitySet;
            OrganizationIdentifier: OrganizationIdentifierEntitySet;
            PersonIdentifier: PersonIdentifierEntitySet;
            Phrase: PhraseEntitySet;
            ValueListItem: ValueListItemEntitySet;
            ValueList: ValueListEntitySet;
            Fonds: FondsEntitySet;
            FondsCreator: FondsCreatorEntitySet;
            OnBehalfOf: OnBehalfOfEntitySet;
            SearchIndexKeyword: SearchIndexKeywordEntitySet;
            SearchIndexStopword: SearchIndexStopwordEntitySet;
            SeriesLink: SeriesLinkEntitySet;
            AccessCode: AccessCodeEntitySet;
            AccessGroup: AccessGroupEntitySet;
            ActivityPhaseType: ActivityPhaseTypeEntitySet;
            AdditionalCode: AdditionalCodeEntitySet;
            AdditionalInformation: AdditionalInformationEntitySet;
            AddressGroup: AddressGroupEntitySet;
            Address: AddressEntitySet;
            AddressType: AddressTypeEntitySet;
            AdministrativeUnit: AdministrativeUnitEntitySet;
            AdministrativeUnitAddress: AdministrativeUnitAddressEntitySet;
            Applicant: ApplicantEntitySet;
            ApplicantCompetence: ApplicantCompetenceEntitySet;
            PositionApplication: PositionApplicationEntitySet;
            ApplicationStatus: ApplicationStatusEntitySet;
            ApplicationType: ApplicationTypeEntitySet;
            AutorizationForAdmUnit: AutorizationForAdmUnitEntitySet;
            BuildingAction: BuildingActionEntitySet;
            BuildingIdent: BuildingIdentEntitySet;
            BuildingType: BuildingTypeEntitySet;
            AdministrativeUnitAuthorization: AdministrativeUnitAuthorizationEntitySet;
            Authorization: AuthorizationEntitySet;
            Context: ContextEntitySet;
            Configuration: ConfigurationEntitySet;
            PendingImport: PendingImportEntitySet;
            ImportCenter: ImportCenterEntitySet;
            ImportCenterObjectType: ImportCenterObjectTypeEntitySet;
            ImportCenterType: ImportCenterTypeEntitySet;
            MeetingAllowance: MeetingAllowanceEntitySet;
            MeetingStatus: MeetingStatusEntitySet;
            DatabaseInfo: DatabaseInfoEntitySet;
            Case: CaseEntitySet;
            CaseReadStatus: CaseReadStatusEntitySet;
            CaseWorkerCase: CaseWorkerCaseEntitySet;
            ApplicationsAggregation: ApplicationsAggregationEntitySet;
            CaseCategory: CaseCategoryEntitySet;
            CasePartySenderRecipient: CasePartySenderRecipientEntitySet;
            CaseClassification: CaseClassificationEntitySet;
            LinkFromCase: LinkFromCaseEntitySet;
            CaseParty: CasePartyEntitySet;
            CasePartyRole: CasePartyRoleEntitySet;
            CasePartyRoleMember: CasePartyRoleMemberEntitySet;
            CaseRead: CaseReadEntitySet;
            CaseStatus: CaseStatusEntitySet;
            CaseWorkerKey: CaseWorkerKeyEntitySet;
            CaseWorker: CaseWorkerEntitySet;
            Class: ClassEntitySet;
            ClassificationBase: ClassificationBaseEntitySet;
            ClassificationSystem: ClassificationSystemEntitySet;
            ClassificationSystemType: ClassificationSystemTypeEntitySet;
            DMBCaseListType: DMBCaseListTypeEntitySet;
            DMBHandlingDocument: DMBHandlingDocumentEntitySet;
            DMBHandlingStatus: DMBHandlingStatusEntitySet;
            ConferCase: ConferCaseEntitySet;
            ConstructionCase: ConstructionCaseEntitySet;
            Coordinate: CoordinateEntitySet;
            County: CountyEntitySet;
            CurrentUserInfo: CurrentUserInfoEntitySet;
            CustomFieldDescriptor: CustomFieldDescriptorEntitySet;
            DataObjectChange: DataObjectChangeEntitySet;
            DecisionStatus: DecisionStatusEntitySet;
            DecisionType: DecisionTypeEntitySet;
            DefaultValues: DefaultValuesEntitySet;
            Deputize: DeputizeEntitySet;
            DigitalCertificatDocument: DigitalCertificatDocumentEntitySet;
            DispensationType: DispensationTypeEntitySet;
            DisposalCode: DisposalCodeEntitySet;
            DMB: DMBEntitySet;
            DMBCaseHandling: DMBCaseHandlingEntitySet;
            DMBDocumentType: DMBDocumentTypeEntitySet;
            DMBHandling: DMBHandlingEntitySet;
            CaseWorkerDMBHandling: CaseWorkerDMBHandlingEntitySet;
            DMBHandlingValidation: DMBHandlingValidationEntitySet;
            DMBMember: DMBMemberEntitySet;
            DMBMemberRole: DMBMemberRoleEntitySet;
            DMBType: DMBTypeEntitySet;
            DocumentCategory: DocumentCategoryEntitySet;
            DocumentDescription: DocumentDescriptionEntitySet;
            DocumentDescriptionLinksInfo: DocumentDescriptionLinksInfoEntitySet;
            LinkFromDocumentDescription: LinkFromDocumentDescriptionEntitySet;
            DocumentLinkType: DocumentLinkTypeEntitySet;
            DocumentObject: DocumentObjectEntitySet;
            DocumentStatus: DocumentStatusEntitySet;
            DocumentTemplate: DocumentTemplateEntitySet;
            DocumentTemplateType: DocumentTemplateTypeEntitySet;
            DowngradingCode: DowngradingCodeEntitySet;
            EntityCollectionAggregation: EntityCollectionAggregationEntitySet;
            ExternalSystem: ExternalSystemEntitySet;
            ExternalSystemLinkCase: ExternalSystemLinkCaseEntitySet;
            ExternalSystemLinkRegistryEntry: ExternalSystemLinkRegistryEntryEntitySet;
            FeeType: FeeTypeEntitySet;
            Field: FieldEntitySet;
            FileFormat: FileFormatEntitySet;
            FileType: FileTypeEntitySet;
            RecurringCasePlanListItem: RecurringCasePlanListItemEntitySet;
            Folder: FolderEntitySet;
            FolderCaseLink: FolderCaseLinkEntitySet;
            FolderDocumentLink: FolderDocumentLinkEntitySet;
            FolderRegistryEntryLink: FolderRegistryEntryLinkEntitySet;
            FollowUpMethod: FollowUpMethodEntitySet;
            FondsPeriod: FondsPeriodEntitySet;
            FondsStatus: FondsStatusEntitySet;
            GeographicalEntity: GeographicalEntityEntitySet;
            Wkt: WktEntitySet;
            GeographicalObjectLink: GeographicalObjectLinkEntitySet;
            GeographicalObjectType: GeographicalObjectTypeEntitySet;
            IdentificationType: IdentificationTypeEntitySet;
            InformationType: InformationTypeEntitySet;
            InvoiceStatus: InvoiceStatusEntitySet;
            Invoice: InvoiceEntitySet;
            InvoiceLineItem: InvoiceLineItemEntitySet;
            Keyword: KeywordEntitySet;
            KeywordReference: KeywordReferenceEntitySet;
            KeywordsPrecedents: KeywordsPrecedentsEntitySet;
            LandPlan: LandPlanEntitySet;
            LandPlanStatus: LandPlanStatusEntitySet;
            LandPlanType: LandPlanTypeEntitySet;
            LandRegister: LandRegisterEntitySet;
            LawAndRegulations: LawAndRegulationsEntitySet;
            LawRegulationReferenceToPrecedent: LawRegulationReferenceToPrecedentEntitySet;
            DmbProposal: DmbProposalEntitySet;
            PreauthenticatedReadDocumentTemplateUris: PreauthenticatedReadDocumentTemplateUrisEntitySet;
            PreauthenticatedReadDocumentUris: PreauthenticatedReadDocumentUrisEntitySet;
            PreauthenticatedWriteDocumentUris: PreauthenticatedWriteDocumentUrisEntitySet;
            FieldMetadata: FieldMetadataEntitySet;
            PredefinedQueryFavorite: PredefinedQueryFavoriteEntitySet;
            PredefinedQueryView: PredefinedQueryViewEntitySet;
            PredefinedQueryViewField: PredefinedQueryViewFieldEntitySet;
            TableMetadata: TableMetadataEntitySet;
            PendingImportDocument: PendingImportDocumentEntitySet;
            PredefinedQueryParentsTree: PredefinedQueryParentsTreeEntitySet;
            ImportTemplateResult: ImportTemplateResultEntitySet;
            SenderRecipient: SenderRecipientEntitySet;
            CaseWorkerSenderRecipient: CaseWorkerSenderRecipientEntitySet;
            LinkType: LinkTypeEntitySet;
            LogEventType: LogEventTypeEntitySet;
            LogEventObject: LogEventObjectEntitySet;
            LogEventUserName: LogEventUserNameEntitySet;
            LogEntry: LogEntryEntitySet;
            Meeting: MeetingEntitySet;
            MeetingDistributionItem: MeetingDistributionItemEntitySet;
            MeetingPermissions: MeetingPermissionsEntitySet;
            MeetingAttendant: MeetingAttendantEntitySet;
            MeetingCaseType: MeetingCaseTypeEntitySet;
            MeetingDocument: MeetingDocumentEntitySet;
            CaseWorkerMeetingDocument: CaseWorkerMeetingDocumentEntitySet;
            MeetingDocumentLink: MeetingDocumentLinkEntitySet;
            MergeFieldContent: MergeFieldContentEntitySet;
            NumberSeries: NumberSeriesEntitySet;
            Permissions: PermissionsEntitySet;
            PlanIdent: PlanIdentEntitySet;
            PlanRegulations: PlanRegulationsEntitySet;
            Position: PositionEntitySet;
            PositionAnnouncementType: PositionAnnouncementTypeEntitySet;
            PostalCode: PostalCodeEntitySet;
            Precedent: PrecedentEntitySet;
            PrecedentReference: PrecedentReferenceEntitySet;
            PreviousMinutesOfMeeting: PreviousMinutesOfMeetingEntitySet;
            RoleProfile: RoleProfileEntitySet;
            Project: ProjectEntitySet;
            AddressProvider: AddressProviderEntitySet;
            PredefinedQuery: PredefinedQueryEntitySet;
            PredefinedQueryAggregation: PredefinedQueryAggregationEntitySet;
            QueryCriteria: QueryCriteriaEntitySet;
            RegistryEntryDispatch: RegistryEntryDispatchEntitySet;
            RecordStatus: RecordStatusEntitySet;
            RegistryEntry: RegistryEntryEntitySet;
            RegistryEntryPermissions: RegistryEntryPermissionsEntitySet;
            RegistryEntryReadStatus: RegistryEntryReadStatusEntitySet;
            CaseWorkerRegistryEntry: CaseWorkerRegistryEntryEntitySet;
            RegistryEntryTasksAggregation: RegistryEntryTasksAggregationEntitySet;
            RegistryEntryRegistration: RegistryEntryRegistrationEntitySet;
            RegistryEntryClassification: RegistryEntryClassificationEntitySet;
            RegistryEntryDecision: RegistryEntryDecisionEntitySet;
            CaseWorkerRegistryEntryDecision: CaseWorkerRegistryEntryDecisionEntitySet;
            RegistryEntryDocument: RegistryEntryDocumentEntitySet;
            RegistryEntryDocumentPermissions: RegistryEntryDocumentPermissionsEntitySet;
            LinkFromRegistryEntry: LinkFromRegistryEntryEntitySet;
            RegistryEntryRead: RegistryEntryReadEntitySet;
            RegistryEntryType: RegistryEntryTypeEntitySet;
            RegistryManagementUnit: RegistryManagementUnitEntitySet;
            Remark: RemarkEntitySet;
            RemoteStorageCode: RemoteStorageCodeEntitySet;
            Role: RoleEntitySet;
            Schema: SchemaEntitySet;
            SendingMethod: SendingMethodEntitySet;
            SendingStatus: SendingStatusEntitySet;
            Series: SeriesEntitySet;
            StatusMeetingDocument: StatusMeetingDocumentEntitySet;
            StatutoryAutority: StatutoryAutorityEntitySet;
            StorageUnit: StorageUnitEntitySet;
            SubdivisionApplication: SubdivisionApplicationEntitySet;
            SubdivisionConference: SubdivisionConferenceEntitySet;
            Task: TaskEntitySet;
            CaseWorkerTask: CaseWorkerTaskEntitySet;
            TaskAlertCode: TaskAlertCodeEntitySet;
            TaskBranchRoot: TaskBranchRootEntitySet;
            TaskDecisionCode: TaskDecisionCodeEntitySet;
            TaskHandlingSequence: TaskHandlingSequenceEntitySet;
            TaskPriority: TaskPriorityEntitySet;
            TaskRecipient: TaskRecipientEntitySet;
            CaseWorkerTaskRecipient: CaseWorkerTaskRecipientEntitySet;
            TaskReportCategory: TaskReportCategoryEntitySet;
            TaskStatus: TaskStatusEntitySet;
            TaskType: TaskTypeEntitySet;
            UnitType: UnitTypeEntitySet;
            User: UserEntitySet;
            UserAddress: UserAddressEntitySet;
            UserName: UserNameEntitySet;
            UserRole: UserRoleEntitySet;
            VariantFormat: VariantFormatEntitySet;
            ZoningCode: ZoningCodeEntitySet;
            ZoningCodes: ZoningCodesEntitySet;
            DmbMemberAggregate: DmbMemberAggregateEntitySet;
            UserAddressAggregate: UserAddressAggregateEntitySet;
            GeographicalObject: GeographicalObjectEntitySet;

            // Unbound Functions

            _Context(): Promise<Ephorte.Context[]> {
                return new Promise<Ephorte.Context[]>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Context()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            Licenses(): Promise<Ephorte.License[]> {
                return new Promise<Ephorte.License[]>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Licenses()",
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

            ChangePassword(): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/()",
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
        export class BuildingFloorEntitySet extends odatatools.EntitySet<Ephorte.BuildingFloor> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class BuildingInformationEntitySet extends odatatools.EntitySet<Ephorte.BuildingInformation> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class BuildingsEntitySet extends odatatools.EntitySet<Ephorte.Buildings> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class FormalEntitySet extends odatatools.EntitySet<Ephorte.Formal> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class GeneralTermsEntitySet extends odatatools.EntitySet<Ephorte.GeneralTerms> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class InfrastructureEntitySet extends odatatools.EntitySet<Ephorte.Infrastructure> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class LandUseEntitySet extends odatatools.EntitySet<Ephorte.LandUse> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class LocationConflictEntitySet extends odatatools.EntitySet<Ephorte.LocationConflict> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class MatrikkelStatusEntitySet extends odatatools.EntitySet<Ephorte.MatrikkelStatus> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalMatrikkelStatuses(bindingParameter: Ephorte.MatrikkelStatus[]): Promise<Ephorte.MatrikkelStatus> {
                return new Promise<Ephorte.MatrikkelStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalMatrikkelStatuses()",
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
        export class MetadataMappingEntitySet extends odatatools.EntitySet<Ephorte.MetadataMapping> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            MetadataMappingTemplate(bindingParameter: Ephorte.MetadataMapping[]): Promise<Ephorte.MetadataMapping> {
                return new Promise<Ephorte.MetadataMapping>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.MetadataMappingTemplate()",
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
        export class NotificationEntitySet extends odatatools.EntitySet<Ephorte.Notification> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            NotificationTemplate(bindingParameter: Ephorte.Notification[]): Promise<Ephorte.Notification> {
                return new Promise<Ephorte.Notification>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.NotificationTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            UserNotifications(bindingParameter: Ephorte.Notification[], UserId: Edm.Int32): Promise<Ephorte.Notification> {
                return new Promise<Ephorte.Notification>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.UserNotifications(UserId=" + UserId + ")",
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
        export class NotificationMethodEntitySet extends odatatools.EntitySet<Ephorte.NotificationMethod> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalNotificationMethods(bindingParameter: Ephorte.NotificationMethod[]): Promise<Ephorte.NotificationMethod> {
                return new Promise<Ephorte.NotificationMethod>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalNotificationMethods()",
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
        export class NotificationsEntitySet extends odatatools.EntitySet<Ephorte.Notifications> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class ObjectStatusEntitySet extends odatatools.EntitySet<Ephorte.ObjectStatus> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalTables(bindingParameter: Ephorte.ObjectStatus[]): Promise<Edm.String> {
                return new Promise<Edm.String>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalTables()",
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
        export class PlanEntitySet extends odatatools.EntitySet<Ephorte.Plan> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class AreaEntitySet extends odatatools.EntitySet<Ephorte.Area> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class RequirementsBuildingFoundationEntitySet extends odatatools.EntitySet<Ephorte.RequirementsBuildingFoundation> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class RoadEntitySet extends odatatools.EntitySet<Ephorte.Road> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class ShortageSeverityTypeEntitySet extends odatatools.EntitySet<Ephorte.ShortageSeverityType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class TaskCheckPointTypeEntitySet extends odatatools.EntitySet<Ephorte.TaskCheckPointType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            TaskCheckPointTypeTemplate(bindingParameter: Ephorte.TaskCheckPointType[]): Promise<Ephorte.TaskCheckPointType> {
                return new Promise<Ephorte.TaskCheckPointType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.TaskCheckPointTypeTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalTaskCheckPointTypes(bindingParameter: Ephorte.TaskCheckPointType[]): Promise<Ephorte.TaskCheckPointType> {
                return new Promise<Ephorte.TaskCheckPointType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalTaskCheckPointTypes()",
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
        export class TaskDMBEntitySet extends odatatools.EntitySet<Ephorte.TaskDMB> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class TaskDocumentEntitySet extends odatatools.EntitySet<Ephorte.TaskDocument> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            TaskDocumentTemplate(bindingParameter: Ephorte.TaskDocument[]): Promise<Ephorte.TaskDocument> {
                return new Promise<Ephorte.TaskDocument>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.TaskDocumentTemplate()",
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
        export class TaskDocumentTemplateModelEntitySet extends odatatools.EntitySet<Ephorte.TaskDocumentTemplateModel> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            TaskDocumentTemplateModelTemplate(bindingParameter: Ephorte.TaskDocumentTemplateModel[]): Promise<Ephorte.TaskDocumentTemplateModel> {
                return new Promise<Ephorte.TaskDocumentTemplateModel>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.TaskDocumentTemplateModelTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalTaskDocumentTemplateModels(bindingParameter: Ephorte.TaskDocumentTemplateModel[]): Promise<Ephorte.TaskDocumentTemplateModel> {
                return new Promise<Ephorte.TaskDocumentTemplateModel>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalTaskDocumentTemplateModels()",
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
        export class TaskFunctionEntitySet extends odatatools.EntitySet<Ephorte.TaskFunction> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class TechnicalInstallationsEntitySet extends odatatools.EntitySet<Ephorte.TechnicalInstallations> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class UsageUnitEntitySet extends odatatools.EntitySet<Ephorte.UsageUnit> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class UsageUnitCodeEntitySet extends odatatools.EntitySet<Ephorte.UsageUnitCode> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalUsageUnitCodes(bindingParameter: Ephorte.UsageUnitCode[]): Promise<Ephorte.UsageUnitCode> {
                return new Promise<Ephorte.UsageUnitCode>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalUsageUnitCodes()",
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
        export class WorkItemEntitySet extends odatatools.EntitySet<Ephorte.WorkItem> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            AdministrativeUnitWorkItems(bindingParameter: Ephorte.WorkItem[], AdministrativeUnitId: Edm.Int32): Promise<Ephorte.WorkItem> {
                return new Promise<Ephorte.WorkItem>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.AdministrativeUnitWorkItems(AdministrativeUnitId=" + AdministrativeUnitId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            OfficerWorkItems(bindingParameter: Ephorte.WorkItem[], OfficerNameId: Edm.Int32): Promise<Ephorte.WorkItem> {
                return new Promise<Ephorte.WorkItem>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.OfficerWorkItems(OfficerNameId=" + OfficerNameId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            OfficerWithinAdministrativeUnitWorkItems(bindingParameter: Ephorte.WorkItem[], AdministrativeUnitId: Edm.Int32, OfficerNameId: Edm.Int32): Promise<Ephorte.WorkItem> {
                return new Promise<Ephorte.WorkItem>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.OfficerWithinAdministrativeUnitWorkItems(AdministrativeUnitId=" + AdministrativeUnitId + ",OfficerNameId=" + OfficerNameId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            WorkItemsBySeektype(bindingParameter: Ephorte.WorkItem[], Seektype: Edm.String): Promise<Ephorte.WorkItem> {
                return new Promise<Ephorte.WorkItem>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.WorkItemsBySeektype(Seektype=" + Seektype + ")",
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
        export class WaterSupplyEntitySet extends odatatools.EntitySet<Ephorte.WaterSupply> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class ActionLinkEntitySet extends odatatools.EntitySet<Ephorte.ActionLink> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalActionLinks(bindingParameter: Ephorte.ActionLink[]): Promise<Ephorte.ActionLink> {
                return new Promise<Ephorte.ActionLink>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalActionLinks()",
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
        export class BuildingCaseLocationLinkEntitySet extends odatatools.EntitySet<Ephorte.BuildingCaseLocationLink> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }





            // Bound to set Actions
            SimilarBuildingCaseLocationLinks(bindingParameter: Ephorte.BuildingCaseLocationLink[], MunicipalityNumber: Edm.String, BuildingCaseLocationLinkId: Edm.Int32, CadastralUnitNumber: Edm.Int32, PropertyUnitNumber: Edm.Int32, LeaseholdUnitNumber: Edm.Int32, SectionUnitNumber: Edm.Int32): Promise<Ephorte.BuildingCaseLocationLink> {
                return new Promise<Ephorte.BuildingCaseLocationLink>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.SimilarBuildingCaseLocationLinks()",
                        data: {
                            MunicipalityNumber: MunicipalityNumber,
                            BuildingCaseLocationLinkId: BuildingCaseLocationLinkId,
                            CadastralUnitNumber: CadastralUnitNumber,
                            PropertyUnitNumber: PropertyUnitNumber,
                            LeaseholdUnitNumber: LeaseholdUnitNumber,
                            SectionUnitNumber: SectionUnitNumber,
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
        export class CalculationRuleEntitySet extends odatatools.EntitySet<Ephorte.CalculationRule> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalCalculationRules(bindingParameter: Ephorte.CalculationRule[]): Promise<Ephorte.CalculationRule> {
                return new Promise<Ephorte.CalculationRule>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalCalculationRules()",
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
        export class CaseTitleTemplateEntitySet extends odatatools.EntitySet<Ephorte.CaseTitleTemplate> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            CaseTitleTemplateTemplate(bindingParameter: Ephorte.CaseTitleTemplate[]): Promise<Ephorte.CaseTitleTemplate> {
                return new Promise<Ephorte.CaseTitleTemplate>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.CaseTitleTemplateTemplate()",
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
        export class ActionPurposeEntitySet extends odatatools.EntitySet<Ephorte.ActionPurpose> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalActionPurposes(bindingParameter: Ephorte.ActionPurpose[]): Promise<Ephorte.ActionPurpose> {
                return new Promise<Ephorte.ActionPurpose>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalActionPurposes()",
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
        export class ApplicationBuildingLocationLinkEntitySet extends odatatools.EntitySet<Ephorte.ApplicationBuildingLocationLink> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class BuildingApplicationInitiativeEntitySet extends odatatools.EntitySet<Ephorte.BuildingApplicationInitiative> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalBuildingApplicationInitiatives(bindingParameter: Ephorte.BuildingApplicationInitiative[]): Promise<Ephorte.BuildingApplicationInitiative> {
                return new Promise<Ephorte.BuildingApplicationInitiative>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalBuildingApplicationInitiatives()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            BuildingNumbersByLandRegisterNumber(bindingParameter: Ephorte.BuildingApplicationInitiative[], LandRegisterNumber: Edm.String): Promise<Edm.Int64> {
                return new Promise<Edm.Int64>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.BuildingNumbersByLandRegisterNumber(LandRegisterNumber=" + LandRegisterNumber + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            BuildingApplicationInitiativeTemplate(bindingParameter: Ephorte.BuildingApplicationInitiative[]): Promise<Ephorte.BuildingApplicationInitiative> {
                return new Promise<Ephorte.BuildingApplicationInitiative>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.BuildingApplicationInitiativeTemplate()",
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
        export class ConstructionTypeEntitySet extends odatatools.EntitySet<Ephorte.ConstructionType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalConstructionTypes(bindingParameter: Ephorte.ConstructionType[]): Promise<Ephorte.ConstructionType> {
                return new Promise<Ephorte.ConstructionType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalConstructionTypes()",
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
        export class CountryEntitySet extends odatatools.EntitySet<Ephorte.Country> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalCountries(bindingParameter: Ephorte.Country[]): Promise<Ephorte.Country> {
                return new Promise<Ephorte.Country>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalCountries()",
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
        export class EnergySupplyEntitySet extends odatatools.EntitySet<Ephorte.EnergySupply> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class EnergySupplyTypeEntitySet extends odatatools.EntitySet<Ephorte.EnergySupplyType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalEnergySupplyTypes(bindingParameter: Ephorte.EnergySupplyType[]): Promise<Ephorte.EnergySupplyType> {
                return new Promise<Ephorte.EnergySupplyType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalEnergySupplyTypes()",
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
        export class GeneralConditionsEntitySet extends odatatools.EntitySet<Ephorte.GeneralConditions> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class GiRegulationPlanEntitySet extends odatatools.EntitySet<Ephorte.GiRegulationPlan> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class ProcessCategoryEntitySet extends odatatools.EntitySet<Ephorte.ProcessCategory> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalProcessCategories(bindingParameter: Ephorte.ProcessCategory[]): Promise<Ephorte.ProcessCategory> {
                return new Promise<Ephorte.ProcessCategory>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalProcessCategories()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            ProcessCategoryTemplate(bindingParameter: Ephorte.ProcessCategory[]): Promise<Ephorte.ProcessCategory> {
                return new Promise<Ephorte.ProcessCategory>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.ProcessCategoryTemplate()",
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
        export class RegistryEntryTitleTemplateEntitySet extends odatatools.EntitySet<Ephorte.RegistryEntryTitleTemplate> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            RegistryEntryTitleTemplateTemplate(bindingParameter: Ephorte.RegistryEntryTitleTemplate[]): Promise<Ephorte.RegistryEntryTitleTemplate> {
                return new Promise<Ephorte.RegistryEntryTitleTemplate>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.RegistryEntryTitleTemplateTemplate()",
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
        export class FloorTypeEntitySet extends odatatools.EntitySet<Ephorte.FloorType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalFloorTypes(bindingParameter: Ephorte.FloorType[]): Promise<Ephorte.FloorType> {
                return new Promise<Ephorte.FloorType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalFloorTypes()",
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
        export class HeatDistributionEntitySet extends odatatools.EntitySet<Ephorte.HeatDistribution> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class HeatDistributionTypeEntitySet extends odatatools.EntitySet<Ephorte.HeatDistributionType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalHeatDistributionTypes(bindingParameter: Ephorte.HeatDistributionType[]): Promise<Ephorte.HeatDistributionType> {
                return new Promise<Ephorte.HeatDistributionType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalHeatDistributionTypes()",
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
        export class HomeAddressEntitySet extends odatatools.EntitySet<Ephorte.HomeAddress> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class IndustryGroupEntitySet extends odatatools.EntitySet<Ephorte.IndustryGroup> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalIndustryGroups(bindingParameter: Ephorte.IndustryGroup[]): Promise<Ephorte.IndustryGroup> {
                return new Promise<Ephorte.IndustryGroup>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalIndustryGroups()",
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
        export class InitiativePurposeLinkEntitySet extends odatatools.EntitySet<Ephorte.InitiativePurposeLink> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class KitchenCodeEntitySet extends odatatools.EntitySet<Ephorte.KitchenCode> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalKitchenCodes(bindingParameter: Ephorte.KitchenCode[]): Promise<Ephorte.KitchenCode> {
                return new Promise<Ephorte.KitchenCode>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalKitchenCodes()",
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
        export class PropertyBuildingSiteEntitySet extends odatatools.EntitySet<Ephorte.PropertyBuildingSite> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalPropertyBuildingSites(bindingParameter: Ephorte.PropertyBuildingSite[]): Promise<Ephorte.PropertyBuildingSite> {
                return new Promise<Ephorte.PropertyBuildingSite>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalPropertyBuildingSites()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            PropertyBuildingSiteTemplate(bindingParameter: Ephorte.PropertyBuildingSite[]): Promise<Ephorte.PropertyBuildingSite> {
                return new Promise<Ephorte.PropertyBuildingSite>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.PropertyBuildingSiteTemplate()",
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
        export class RoadTypeEntitySet extends odatatools.EntitySet<Ephorte.RoadType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalRoadTypes(bindingParameter: Ephorte.RoadType[]): Promise<Ephorte.RoadType> {
                return new Promise<Ephorte.RoadType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalRoadTypes()",
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
        export class RoadTypeLinkEntitySet extends odatatools.EntitySet<Ephorte.RoadTypeLink> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class SewageConnectionTypeEntitySet extends odatatools.EntitySet<Ephorte.SewageConnectionType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalSewageConnectionTypes(bindingParameter: Ephorte.SewageConnectionType[]): Promise<Ephorte.SewageConnectionType> {
                return new Promise<Ephorte.SewageConnectionType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalSewageConnectionTypes()",
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
        export class WaterSupplyConnectionTypeEntitySet extends odatatools.EntitySet<Ephorte.WaterSupplyConnectionType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalWaterSupplyConnectionTypes(bindingParameter: Ephorte.WaterSupplyConnectionType[]): Promise<Ephorte.WaterSupplyConnectionType> {
                return new Promise<Ephorte.WaterSupplyConnectionType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalWaterSupplyConnectionTypes()",
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
        export class WidgetEntitySet extends odatatools.EntitySet<Ephorte.Widget> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalWidgets(bindingParameter: Ephorte.Widget[]): Promise<Ephorte.Widget> {
                return new Promise<Ephorte.Widget>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalWidgets()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            WidgetTemplate(bindingParameter: Ephorte.Widget[]): Promise<Ephorte.Widget> {
                return new Promise<Ephorte.Widget>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.WidgetTemplate()",
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
        export class WidgetRoleLinkEntitySet extends odatatools.EntitySet<Ephorte.WidgetRoleLink> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }





            // Bound to set Actions
            RemoveWidgetsByRole(bindingParameter: Ephorte.WidgetRoleLink[], RoleId: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.RemoveWidgetsByRole()",
                        data: {
                            RoleId: RoleId,
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

            // Bound to set Functions
            RolesWithWidgets(bindingParameter: Ephorte.WidgetRoleLink[]): Promise<Ephorte.Role> {
                return new Promise<Ephorte.Role>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.RolesWithWidgets()",
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
        export class WidgetUserLinkEntitySet extends odatatools.EntitySet<Ephorte.WidgetUserLink> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class AccessGroupMembershipEntitySet extends odatatools.EntitySet<Ephorte.AccessGroupMembership> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalAccessGroupMemberships(bindingParameter: Ephorte.AccessGroupMembership[]): Promise<Ephorte.AccessGroupMembership> {
                return new Promise<Ephorte.AccessGroupMembership>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalAccessGroupMemberships()",
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
        export class AdditionalLoginEntitySet extends odatatools.EntitySet<Ephorte.AdditionalLogin> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalDatabases(bindingParameter: Ephorte.AdditionalLogin[]): Promise<Ephorte.DatabaseInfo> {
                return new Promise<Ephorte.DatabaseInfo>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDatabases()",
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
        export class AddressGroupMembershipEntitySet extends odatatools.EntitySet<Ephorte.AddressGroupMembership> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class AdministrativeUnitRelationEntitySet extends odatatools.EntitySet<Ephorte.AdministrativeUnitRelation> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class CommitteeHandlingStatusEntitySet extends odatatools.EntitySet<Ephorte.CommitteeHandlingStatus> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            CommitteeHandlingStatusTemplate(bindingParameter: Ephorte.CommitteeHandlingStatus[]): Promise<Ephorte.CommitteeHandlingStatus> {
                return new Promise<Ephorte.CommitteeHandlingStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.CommitteeHandlingStatusTemplate()",
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
        export class CustomerFunctionsEntitySet extends odatatools.EntitySet<Ephorte.CustomerFunctions> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            CustomerFunctionsTemplate(bindingParameter: Ephorte.CustomerFunctions[]): Promise<Ephorte.CustomerFunctions> {
                return new Promise<Ephorte.CustomerFunctions>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.CustomerFunctionsTemplate()",
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
        export class CustomFieldEntitySet extends odatatools.EntitySet<Ephorte.CustomField> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            CustomFieldTemplate(bindingParameter: Ephorte.CustomField[]): Promise<Ephorte.CustomField> {
                return new Promise<Ephorte.CustomField>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.CustomFieldTemplate()",
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
        export class DispensationEntitySet extends odatatools.EntitySet<Ephorte.Dispensation> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            DispensationTemplate(bindingParameter: Ephorte.Dispensation[]): Promise<Ephorte.Dispensation> {
                return new Promise<Ephorte.Dispensation>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DispensationTemplate()",
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
        export class DocumentTypeEntitySet extends odatatools.EntitySet<Ephorte.DocumentType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalDocumentTypes(bindingParameter: Ephorte.DocumentType[]): Promise<Ephorte.DocumentType> {
                return new Promise<Ephorte.DocumentType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDocumentTypes()",
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
        export class FormFieldMetadataEntitySet extends odatatools.EntitySet<Ephorte.FormFieldMetadata> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class FondsCreatorMembershipEntitySet extends odatatools.EntitySet<Ephorte.FondsCreatorMembership> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class LogEventEntitySet extends odatatools.EntitySet<Ephorte.LogEvent> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }



            // Bound to entity Functions
            LogEventObjectTemplate(bindingParameter: Ephorte.LogEvent): Promise<Ephorte.LogEventObject> {
                return new Promise<Ephorte.LogEventObject>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.LogEventObjectTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LogEventUserNameTemplate(bindingParameter: Ephorte.LogEvent): Promise<Ephorte.LogEventUserName> {
                return new Promise<Ephorte.LogEventUserName>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.LogEventUserNameTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }



            // Bound to set Functions
            LogEventTemplate(bindingParameter: Ephorte.LogEvent[]): Promise<Ephorte.LogEvent> {
                return new Promise<Ephorte.LogEvent>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LogEventTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalTableNames(bindingParameter: Ephorte.LogEvent[]): Promise<Ephorte.Table> {
                return new Promise<Ephorte.Table>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalTableNames()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalFieldNames(bindingParameter: Ephorte.LogEvent[], TableName: Edm.String): Promise<Ephorte.TableField> {
                return new Promise<Ephorte.TableField>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalFieldNames(TableName=" + TableName + ")",
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
        export class MergeFieldEntitySet extends odatatools.EntitySet<Ephorte.MergeField> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalMergeFields(bindingParameter: Ephorte.MergeField[]): Promise<Ephorte.MergeField> {
                return new Promise<Ephorte.MergeField>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalMergeFields()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            MergeFieldTemplate(bindingParameter: Ephorte.MergeField[]): Promise<Ephorte.MergeField> {
                return new Promise<Ephorte.MergeField>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.MergeFieldTemplate()",
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
        export class PositionTypeEntitySet extends odatatools.EntitySet<Ephorte.PositionType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            PositionTypeTemplate(bindingParameter: Ephorte.PositionType[]): Promise<Ephorte.PositionType> {
                return new Promise<Ephorte.PositionType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.PositionTypeTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalPositionTypes(bindingParameter: Ephorte.PositionType[]): Promise<Ephorte.PositionType> {
                return new Promise<Ephorte.PositionType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalPositionTypes()",
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
        export class TableEntitySet extends odatatools.EntitySet<Ephorte.Table> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class TableFieldEntitySet extends odatatools.EntitySet<Ephorte.TableField> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class OrganizationIdentifierEntitySet extends odatatools.EntitySet<Ephorte.OrganizationIdentifier> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class PersonIdentifierEntitySet extends odatatools.EntitySet<Ephorte.PersonIdentifier> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class PhraseEntitySet extends odatatools.EntitySet<Ephorte.Phrase> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            PhraseTemplate(bindingParameter: Ephorte.Phrase[]): Promise<Ephorte.Phrase> {
                return new Promise<Ephorte.Phrase>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.PhraseTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalPhrases(bindingParameter: Ephorte.Phrase[]): Promise<Ephorte.Phrase> {
                return new Promise<Ephorte.Phrase>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalPhrases()",
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
        export class ValueListItemEntitySet extends odatatools.EntitySet<Ephorte.ValueListItem> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class ValueListEntitySet extends odatatools.EntitySet<Ephorte.ValueList> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class FondsEntitySet extends odatatools.EntitySet<Ephorte.Fonds> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }



            // Bound to entity Functions
            SeriesTemplate(bindingParameter: Ephorte.Fonds): Promise<Ephorte.Series> {
                return new Promise<Ephorte.Series>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.SeriesTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }



            // Bound to set Functions
            LegalFonds(bindingParameter: Ephorte.Fonds[]): Promise<Ephorte.Fonds> {
                return new Promise<Ephorte.Fonds>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalFonds()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            FondsTemplate(bindingParameter: Ephorte.Fonds[]): Promise<Ephorte.Fonds> {
                return new Promise<Ephorte.Fonds>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.FondsTemplate()",
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
        export class FondsCreatorEntitySet extends odatatools.EntitySet<Ephorte.FondsCreator> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalFondsCreators(bindingParameter: Ephorte.FondsCreator[]): Promise<Ephorte.FondsCreator> {
                return new Promise<Ephorte.FondsCreator>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalFondsCreators()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            FondsCreatorTemplate(bindingParameter: Ephorte.FondsCreator[]): Promise<Ephorte.FondsCreator> {
                return new Promise<Ephorte.FondsCreator>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.FondsCreatorTemplate()",
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
        export class OnBehalfOfEntitySet extends odatatools.EntitySet<Ephorte.OnBehalfOf> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class SearchIndexKeywordEntitySet extends odatatools.EntitySet<Ephorte.SearchIndexKeyword> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            SearchIndexKeywordTemplate(bindingParameter: Ephorte.SearchIndexKeyword[]): Promise<Ephorte.SearchIndexKeyword> {
                return new Promise<Ephorte.SearchIndexKeyword>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.SearchIndexKeywordTemplate()",
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
        export class SearchIndexStopwordEntitySet extends odatatools.EntitySet<Ephorte.SearchIndexStopword> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            SearchIndexStopwordTemplate(bindingParameter: Ephorte.SearchIndexStopword[]): Promise<Ephorte.SearchIndexStopword> {
                return new Promise<Ephorte.SearchIndexStopword>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.SearchIndexStopwordTemplate()",
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
        export class SeriesLinkEntitySet extends odatatools.EntitySet<Ephorte.SeriesLink> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class AccessCodeEntitySet extends odatatools.EntitySet<Ephorte.AccessCode> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalAccessCodes(bindingParameter: Ephorte.AccessCode[]): Promise<Ephorte.AccessCode> {
                return new Promise<Ephorte.AccessCode>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalAccessCodes()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalUserAccessCodes(bindingParameter: Ephorte.AccessCode[], UserId: Edm.Int32): Promise<Ephorte.AccessCode> {
                return new Promise<Ephorte.AccessCode>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalUserAccessCodes(UserId=" + UserId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AccessCodeTemplate(bindingParameter: Ephorte.AccessCode[]): Promise<Ephorte.AccessCode> {
                return new Promise<Ephorte.AccessCode>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.AccessCodeTemplate()",
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
        export class AccessGroupEntitySet extends odatatools.EntitySet<Ephorte.AccessGroup> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }



            // Bound to entity Functions
            AdHocMemberships(bindingParameter: Ephorte.AccessGroup): Promise<Ephorte.AccessGroupMembership> {
                return new Promise<Ephorte.AccessGroupMembership>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.AdHocMemberships()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }



            // Bound to set Functions
            LegalAccessGroups(bindingParameter: Ephorte.AccessGroup[]): Promise<Ephorte.AccessGroup> {
                return new Promise<Ephorte.AccessGroup>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalAccessGroups()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AccessGroupTemplate(bindingParameter: Ephorte.AccessGroup[]): Promise<Ephorte.AccessGroup> {
                return new Promise<Ephorte.AccessGroup>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.AccessGroupTemplate()",
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
        export class ActivityPhaseTypeEntitySet extends odatatools.EntitySet<Ephorte.ActivityPhaseType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalActivityPhaseTypes(bindingParameter: Ephorte.ActivityPhaseType[]): Promise<Ephorte.ActivityPhaseType> {
                return new Promise<Ephorte.ActivityPhaseType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalActivityPhaseTypes()",
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
        export class AdditionalCodeEntitySet extends odatatools.EntitySet<Ephorte.AdditionalCode> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            AdditionalCodeTemplate(bindingParameter: Ephorte.AdditionalCode[]): Promise<Ephorte.AdditionalCode> {
                return new Promise<Ephorte.AdditionalCode>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.AdditionalCodeTemplate()",
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
        export class AdditionalInformationEntitySet extends odatatools.EntitySet<Ephorte.AdditionalInformation> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class AddressGroupEntitySet extends odatatools.EntitySet<Ephorte.AddressGroup> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalAddressGroups(bindingParameter: Ephorte.AddressGroup[]): Promise<Ephorte.AddressGroup> {
                return new Promise<Ephorte.AddressGroup>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalAddressGroups()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AddressGroupTemplate(bindingParameter: Ephorte.AddressGroup[]): Promise<Ephorte.AddressGroup> {
                return new Promise<Ephorte.AddressGroup>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.AddressGroupTemplate()",
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
        export class AddressEntitySet extends odatatools.EntitySet<Ephorte.Address> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalAddresses(bindingParameter: Ephorte.Address[], AddressTypeId: Edm.String): Promise<Ephorte.Address> {
                return new Promise<Ephorte.Address>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalAddresses(AddressTypeId=" + AddressTypeId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalSearchProviders(bindingParameter: Ephorte.Address[]): Promise<Ephorte.AddressProvider> {
                return new Promise<Ephorte.AddressProvider>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalSearchProviders()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalSearchProvidersForElements(bindingParameter: Ephorte.Address[]): Promise<Ephorte.AddressProvider> {
                return new Promise<Ephorte.AddressProvider>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalSearchProvidersForElements()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalAddressGroupMemberships(bindingParameter: Ephorte.Address[], AddressTypeId: Edm.String): Promise<Ephorte.AddressGroupMembership> {
                return new Promise<Ephorte.AddressGroupMembership>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalAddressGroupMemberships(AddressTypeId=" + AddressTypeId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AddressTemplate(bindingParameter: Ephorte.Address[]): Promise<Ephorte.Address> {
                return new Promise<Ephorte.Address>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.AddressTemplate()",
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
        export class AddressTypeEntitySet extends odatatools.EntitySet<Ephorte.AddressType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalAddressTypes(bindingParameter: Ephorte.AddressType[]): Promise<Ephorte.AddressType> {
                return new Promise<Ephorte.AddressType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalAddressTypes()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AddressTypeTemplate(bindingParameter: Ephorte.AddressType[]): Promise<Ephorte.AddressType> {
                return new Promise<Ephorte.AddressType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.AddressTypeTemplate()",
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
        export class AdministrativeUnitEntitySet extends odatatools.EntitySet<Ephorte.AdministrativeUnit> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }



            // Bound to entity Functions
            SubUnitTemplate(bindingParameter: Ephorte.AdministrativeUnit): Promise<Ephorte.AdministrativeUnit> {
                return new Promise<Ephorte.AdministrativeUnit>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.SubUnitTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            RoleProfileTemplate(bindingParameter: Ephorte.AdministrativeUnit): Promise<Ephorte.RoleProfile> {
                return new Promise<Ephorte.RoleProfile>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.RoleProfileTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AdministrativeUnitRelationTemplate(bindingParameter: Ephorte.AdministrativeUnit): Promise<Ephorte.AdministrativeUnitRelation> {
                return new Promise<Ephorte.AdministrativeUnitRelation>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.AdministrativeUnitRelationTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AdministrativeUnitAddressTemplate(bindingParameter: Ephorte.AdministrativeUnit): Promise<Ephorte.AdministrativeUnitAddress> {
                return new Promise<Ephorte.AdministrativeUnitAddress>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.AdministrativeUnitAddressTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }



            // Bound to set Functions
            LegalAdministrativeUnits(bindingParameter: Ephorte.AdministrativeUnit[], OfficerNameId: Edm.Int32, ParentalUnitId: Edm.Int32, PredecessorAdministrativeUnitId: Edm.Int32): Promise<Ephorte.AdministrativeUnit> {
                return new Promise<Ephorte.AdministrativeUnit>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalAdministrativeUnits(OfficerNameId=" + OfficerNameId + ",ParentalUnitId=" + ParentalUnitId + ",PredecessorAdministrativeUnitId=" + PredecessorAdministrativeUnitId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            RootAdministrativeUnits(bindingParameter: Ephorte.AdministrativeUnit[]): Promise<Ephorte.AdministrativeUnit> {
                return new Promise<Ephorte.AdministrativeUnit>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.RootAdministrativeUnits()",
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
        export class AdministrativeUnitAddressEntitySet extends odatatools.EntitySet<Ephorte.AdministrativeUnitAddress> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class ApplicantEntitySet extends odatatools.EntitySet<Ephorte.Applicant> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }



            // Bound to entity Functions
            ApplicantCompetenceTemplate(bindingParameter: Ephorte.Applicant): Promise<Ephorte.ApplicantCompetence> {
                return new Promise<Ephorte.ApplicantCompetence>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.ApplicantCompetenceTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }



            // Bound to set Functions
            ApplicantTemplate(bindingParameter: Ephorte.Applicant[]): Promise<Ephorte.Applicant> {
                return new Promise<Ephorte.Applicant>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.ApplicantTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalApplicants(bindingParameter: Ephorte.Applicant[]): Promise<Ephorte.Applicant> {
                return new Promise<Ephorte.Applicant>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalApplicants()",
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
        export class ApplicantCompetenceEntitySet extends odatatools.EntitySet<Ephorte.ApplicantCompetence> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class PositionApplicationEntitySet extends odatatools.EntitySet<Ephorte.PositionApplication> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            PositionApplicationTemplate(bindingParameter: Ephorte.PositionApplication[], ApplicantId: Edm.Int32, PositionId: Edm.Int32): Promise<Ephorte.PositionApplication> {
                return new Promise<Ephorte.PositionApplication>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.PositionApplicationTemplate(ApplicantId=" + ApplicantId + ",PositionId=" + PositionId + ")",
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
        export class ApplicationStatusEntitySet extends odatatools.EntitySet<Ephorte.ApplicationStatus> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            ApplicationStatusTemplate(bindingParameter: Ephorte.ApplicationStatus[]): Promise<Ephorte.ApplicationStatus> {
                return new Promise<Ephorte.ApplicationStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.ApplicationStatusTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalApplicationStatuses(bindingParameter: Ephorte.ApplicationStatus[]): Promise<Ephorte.ApplicationStatus> {
                return new Promise<Ephorte.ApplicationStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalApplicationStatuses()",
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
        export class ApplicationTypeEntitySet extends odatatools.EntitySet<Ephorte.ApplicationType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class AutorizationForAdmUnitEntitySet extends odatatools.EntitySet<Ephorte.AutorizationForAdmUnit> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class BuildingActionEntitySet extends odatatools.EntitySet<Ephorte.BuildingAction> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            BuildingActionTemplate(bindingParameter: Ephorte.BuildingAction[]): Promise<Ephorte.BuildingAction> {
                return new Promise<Ephorte.BuildingAction>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.BuildingActionTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalBuildingActions(bindingParameter: Ephorte.BuildingAction[]): Promise<Ephorte.BuildingAction> {
                return new Promise<Ephorte.BuildingAction>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalBuildingActions()",
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
        export class BuildingIdentEntitySet extends odatatools.EntitySet<Ephorte.BuildingIdent> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class BuildingTypeEntitySet extends odatatools.EntitySet<Ephorte.BuildingType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            BuildingTypeTemplate(bindingParameter: Ephorte.BuildingType[]): Promise<Ephorte.BuildingType> {
                return new Promise<Ephorte.BuildingType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.BuildingTypeTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalBuildingTypes(bindingParameter: Ephorte.BuildingType[]): Promise<Ephorte.BuildingType> {
                return new Promise<Ephorte.BuildingType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalBuildingTypes()",
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
        export class AdministrativeUnitAuthorizationEntitySet extends odatatools.EntitySet<Ephorte.AdministrativeUnitAuthorization> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class AuthorizationEntitySet extends odatatools.EntitySet<Ephorte.Authorization> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }



            // Bound to entity Functions
            UnitAuthorizationTemplate(bindingParameter: Ephorte.Authorization): Promise<Ephorte.AdministrativeUnitAuthorization> {
                return new Promise<Ephorte.AdministrativeUnitAuthorization>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.UnitAuthorizationTemplate()",
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
        export class ContextEntitySet extends odatatools.EntitySet<Ephorte.Context> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class ConfigurationEntitySet extends odatatools.EntitySet<Ephorte.Configuration> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class PendingImportEntitySet extends odatatools.EntitySet<Ephorte.PendingImport> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class ImportCenterEntitySet extends odatatools.EntitySet<Ephorte.ImportCenter> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }

            // Bound to entity Actions
            ImportTemplate(key: Edm.Int32, PendingImportId: Edm.String, CaseId: Edm.Int32, RegistryEntryTypeId: Edm.String): Promise<Ephorte.ImportTemplateResult> {
                return new Promise<Ephorte.ImportTemplateResult>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.ImportTemplate()",
                        data: {
                            PendingImportId: PendingImportId,
                            CaseId: CaseId,
                            RegistryEntryTypeId: RegistryEntryTypeId,
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
            UploadImportDocument(key: Edm.Int32, PendingImportId: Edm.String, PendingImportDocumentId: Edm.String): Promise<Ephorte.DOM.Model.UploadImportDocumentResult> {
                return new Promise<Ephorte.DOM.Model.UploadImportDocumentResult>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.UploadImportDocument()",
                        data: {
                            PendingImportId: PendingImportId,
                            PendingImportDocumentId: PendingImportDocumentId,
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
            DeletePendingImport(key: Edm.Int32, PendingImportId: Edm.String): Promise<Ephorte.DOM.Model.UploadImportDocumentResult> {
                return new Promise<Ephorte.DOM.Model.UploadImportDocumentResult>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.DeletePendingImport()",
                        data: {
                            PendingImportId: PendingImportId,
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
            ChangePassword(key: Edm.Int32, OldPassword: Edm.String, NewPassword: Edm.String): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.ChangePassword()",
                        data: {
                            OldPassword: OldPassword,
                            NewPassword: NewPassword,
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
            ClearPassword(key: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.ClearPassword()",
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

            // Bound to entity Functions
            PendingImports(bindingParameter: Ephorte.ImportCenter): Promise<Ephorte.PendingImport> {
                return new Promise<Ephorte.PendingImport>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.PendingImports()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }



            // Bound to set Functions
            CurrentUserImportCenters(bindingParameter: Ephorte.ImportCenter[]): Promise<Ephorte.ImportCenter> {
                return new Promise<Ephorte.ImportCenter>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.CurrentUserImportCenters()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            ImportCenterTemplate(bindingParameter: Ephorte.ImportCenter[]): Promise<Ephorte.ImportCenter> {
                return new Promise<Ephorte.ImportCenter>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.ImportCenterTemplate()",
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
        export class ImportCenterObjectTypeEntitySet extends odatatools.EntitySet<Ephorte.ImportCenterObjectType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalImportCenterObjectTypes(bindingParameter: Ephorte.ImportCenterObjectType[]): Promise<Ephorte.ImportCenterObjectType> {
                return new Promise<Ephorte.ImportCenterObjectType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalImportCenterObjectTypes()",
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
        export class ImportCenterTypeEntitySet extends odatatools.EntitySet<Ephorte.ImportCenterType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalImportCenterTypes(bindingParameter: Ephorte.ImportCenterType[]): Promise<Ephorte.ImportCenterType> {
                return new Promise<Ephorte.ImportCenterType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalImportCenterTypes()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            ImportCenterTypeTemplate(bindingParameter: Ephorte.ImportCenterType[]): Promise<Ephorte.ImportCenterType> {
                return new Promise<Ephorte.ImportCenterType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.ImportCenterTypeTemplate()",
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
        export class MeetingAllowanceEntitySet extends odatatools.EntitySet<Ephorte.MeetingAllowance> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class MeetingStatusEntitySet extends odatatools.EntitySet<Ephorte.MeetingStatus> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class DatabaseInfoEntitySet extends odatatools.EntitySet<Ephorte.DatabaseInfo> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalDatabases(bindingParameter: Ephorte.DatabaseInfo[]): Promise<Ephorte.DatabaseInfo> {
                return new Promise<Ephorte.DatabaseInfo>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDatabases()",
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
        export class CaseEntitySet extends odatatools.EntitySet<Ephorte.Case> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }

            // Bound to entity Actions
            MarkAsUnRead(key: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.MarkAsUnRead()",
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
            MarkAsReadAndRecent(key: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.MarkAsReadAndRecent()",
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
            TaskFromTemplate(key: Edm.Int32, TaskTemplateId: Edm.Int32): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.TaskFromTemplate()",
                        data: {
                            TaskTemplateId: TaskTemplateId,
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
            MarkAsCompleted(key: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.MarkAsCompleted()",
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
            RenumberRegistryEntries(key: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.RenumberRegistryEntries()",
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
            CopyCase(key: Edm.Int32): Promise<Ephorte.Case> {
                return new Promise<Ephorte.Case>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.CopyCase()",
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
            CloneCase(key: Edm.Int32): Promise<Ephorte.Case> {
                return new Promise<Ephorte.Case>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.CloneCase()",
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
            PublishCase(key: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.PublishCase()",
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
            UnpublishCase(key: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.UnpublishCase()",
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
            SetDisposal(key: Edm.Int32, DisposalCodeId: Edm.String, PreservationTime: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.SetDisposal()",
                        data: {
                            DisposalCodeId: DisposalCodeId,
                            PreservationTime: PreservationTime,
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
            CloseCase(key: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.CloseCase()",
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
            RemoveFollowUpsAndCloseCase(key: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.RemoveFollowUpsAndCloseCase()",
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
            CopyAccessGroupToRegistryEntries(key: Edm.Int32, AccessGroupId: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.CopyAccessGroupToRegistryEntries()",
                        data: {
                            AccessGroupId: AccessGroupId,
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
            CreateNotification(key: Edm.Int32, Title: Edm.String, Notification: Ephorte.Notification): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.CreateNotification()",
                        data: {
                            Title: Title,
                            Notification: Notification,
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
            AssignTo(key: Edm.Int32, OfficerNameId: Edm.Int32, AdministrativeUnitId: Edm.Int32, SendEmail: Edm.Boolean, Remark: Edm.String): Promise<Ephorte.Case> {
                return new Promise<Ephorte.Case>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.AssignTo()",
                        data: {
                            OfficerNameId: OfficerNameId,
                            AdministrativeUnitId: AdministrativeUnitId,
                            SendEmail: SendEmail,
                            Remark: Remark,
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
            AddAnalysisDataReport(key: Edm.Int32, MatrikkelNumber: Edm.String): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.AddAnalysisDataReport()",
                        data: {
                            MatrikkelNumber: MatrikkelNumber,
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
            RegistryEntryTemplate(bindingParameter: Ephorte.Case, RegistryEntryTypeId: Edm.String): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.RegistryEntryTemplate(RegistryEntryTypeId=" + RegistryEntryTypeId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            ConstructionCaseTemplate(bindingParameter: Ephorte.Case): Promise<Ephorte.ConstructionCase> {
                return new Promise<Ephorte.ConstructionCase>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.ConstructionCaseTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LandPlanTemplate(bindingParameter: Ephorte.Case): Promise<Ephorte.LandPlan> {
                return new Promise<Ephorte.LandPlan>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.LandPlanTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LinkTemplate(bindingParameter: Ephorte.Case, LinkTypeId: Edm.String): Promise<Ephorte.LinkFromCase> {
                return new Promise<Ephorte.LinkFromCase>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.LinkTemplate(LinkTypeId=" + LinkTypeId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            CasePartyTemplate(bindingParameter: Ephorte.Case): Promise<Ephorte.CaseParty> {
                return new Promise<Ephorte.CaseParty>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.CasePartyTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            RemarkTemplate(bindingParameter: Ephorte.Case): Promise<Ephorte.Remark> {
                return new Promise<Ephorte.Remark>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.RemarkTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            InvoiceTemplate(bindingParameter: Ephorte.Case): Promise<Ephorte.Invoice> {
                return new Promise<Ephorte.Invoice>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.InvoiceTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            CasePartiesByRoleId(bindingParameter: Ephorte.Case, RoleId: Edm.String): Promise<Ephorte.CaseParty> {
                return new Promise<Ephorte.CaseParty>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.CasePartiesByRoleId(RoleId=" + RoleId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalExternalSenderRecipientsFromCaseParties(bindingParameter: Ephorte.Case): Promise<Ephorte.CasePartySenderRecipient> {
                return new Promise<Ephorte.CasePartySenderRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.LegalExternalSenderRecipientsFromCaseParties()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalRecipients(bindingParameter: Ephorte.Case): Promise<Ephorte.SenderRecipient> {
                return new Promise<Ephorte.SenderRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.LegalRecipients()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            RegistryEntryOffset(bindingParameter: Ephorte.Case, RegistryEntryId: Edm.Int32): Promise<Edm.Int32> {
                return new Promise<Edm.Int32>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.RegistryEntryOffset(RegistryEntryId=" + RegistryEntryId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            CasePartyRoleMembers(bindingParameter: Ephorte.Case, CasePartyRoleId: Edm.String): Promise<Ephorte.CasePartyRoleMember> {
                return new Promise<Ephorte.CasePartyRoleMember>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.CasePartyRoleMembers(CasePartyRoleId=" + CasePartyRoleId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            GetLinks(bindingParameter: Ephorte.Case): Promise<Ephorte.LinkFromCase> {
                return new Promise<Ephorte.LinkFromCase>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.GetLinks()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AllTasks(bindingParameter: Ephorte.Case): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.AllTasks()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            TaskTemplate(bindingParameter: Ephorte.Case, TaskTypeId: Edm.String): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.TaskTemplate(TaskTypeId=" + TaskTypeId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            GetNotification(bindingParameter: Ephorte.Case, UserId: Edm.Int32): Promise<Ephorte.Notification> {
                return new Promise<Ephorte.Notification>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.GetNotification(UserId=" + UserId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }



            // Bound to set Functions
            CaseTemplate(bindingParameter: Ephorte.Case[], FileTypeId: Edm.String): Promise<Ephorte.Case> {
                return new Promise<Ephorte.Case>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.CaseTemplate(FileTypeId=" + FileTypeId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalCases(bindingParameter: Ephorte.Case[]): Promise<Ephorte.Case> {
                return new Promise<Ephorte.Case>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalCases()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalTaskTemplates(bindingParameter: Ephorte.Case[], FileTypeId: Edm.String): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalTaskTemplates(FileTypeId=" + FileTypeId + ")",
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
        export class CaseReadStatusEntitySet extends odatatools.EntitySet<Ephorte.CaseReadStatus> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class CaseWorkerCaseEntitySet extends odatatools.EntitySet<Ephorte.CaseWorkerCase> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class ApplicationsAggregationEntitySet extends odatatools.EntitySet<Ephorte.ApplicationsAggregation> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class CaseCategoryEntitySet extends odatatools.EntitySet<Ephorte.CaseCategory> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class CasePartySenderRecipientEntitySet extends odatatools.EntitySet<Ephorte.CasePartySenderRecipient> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class CaseClassificationEntitySet extends odatatools.EntitySet<Ephorte.CaseClassification> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class LinkFromCaseEntitySet extends odatatools.EntitySet<Ephorte.LinkFromCase> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class CasePartyEntitySet extends odatatools.EntitySet<Ephorte.CaseParty> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }



            // Bound to entity Functions
            FoundInRegistryEntries(bindingParameter: Ephorte.CaseParty): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.FoundInRegistryEntries()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalRoles(bindingParameter: Ephorte.CaseParty): Promise<Ephorte.CasePartyRoleMember> {
                return new Promise<Ephorte.CasePartyRoleMember>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.LegalRoles()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }



            // Bound to set Functions
            CasePartyTemplate(bindingParameter: Ephorte.CaseParty[]): Promise<Ephorte.CasePartyRoleMember> {
                return new Promise<Ephorte.CasePartyRoleMember>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.CasePartyTemplate()",
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
        export class CasePartyRoleEntitySet extends odatatools.EntitySet<Ephorte.CasePartyRole> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalCasePartyRoles(bindingParameter: Ephorte.CasePartyRole[]): Promise<Ephorte.CasePartyRole> {
                return new Promise<Ephorte.CasePartyRole>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalCasePartyRoles()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            CasePartyRoleTemplate(bindingParameter: Ephorte.CasePartyRole[]): Promise<Ephorte.CasePartyRole> {
                return new Promise<Ephorte.CasePartyRole>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.CasePartyRoleTemplate()",
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
        export class CasePartyRoleMemberEntitySet extends odatatools.EntitySet<Ephorte.CasePartyRoleMember> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class CaseReadEntitySet extends odatatools.EntitySet<Ephorte.CaseRead> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class CaseStatusEntitySet extends odatatools.EntitySet<Ephorte.CaseStatus> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalCaseStatuses(bindingParameter: Ephorte.CaseStatus[]): Promise<Ephorte.CaseStatus> {
                return new Promise<Ephorte.CaseStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalCaseStatuses()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            CaseStatusTemplate(bindingParameter: Ephorte.CaseStatus[]): Promise<Ephorte.CaseStatus> {
                return new Promise<Ephorte.CaseStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.CaseStatusTemplate()",
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
        export class CaseWorkerKeyEntitySet extends odatatools.EntitySet<Ephorte.CaseWorkerKey> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class CaseWorkerEntitySet extends odatatools.EntitySet<Ephorte.CaseWorker> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            AllLegal(bindingParameter: Ephorte.CaseWorker[]): Promise<Ephorte.CaseWorker> {
                return new Promise<Ephorte.CaseWorker>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.AllLegal()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AllLegalByAdministrativeUnit(bindingParameter: Ephorte.CaseWorker[], AdministrativeUnitId: Edm.Int32): Promise<Ephorte.CaseWorker> {
                return new Promise<Ephorte.CaseWorker>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.AllLegalByAdministrativeUnit(AdministrativeUnitId=" + AdministrativeUnitId + ")",
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
        export class ClassEntitySet extends odatatools.EntitySet<Ephorte.Class> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalClasses(bindingParameter: Ephorte.Class[]): Promise<Ephorte.Class> {
                return new Promise<Ephorte.Class>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalClasses()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            ClassTemplate(bindingParameter: Ephorte.Class[]): Promise<Ephorte.Class> {
                return new Promise<Ephorte.Class>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.ClassTemplate()",
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
        export class ClassificationBaseEntitySet extends odatatools.EntitySet<Ephorte.ClassificationBase> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class ClassificationSystemEntitySet extends odatatools.EntitySet<Ephorte.ClassificationSystem> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }



            // Bound to entity Functions
            LegalClasses(bindingParameter: Ephorte.ClassificationSystem): Promise<Ephorte.Class> {
                return new Promise<Ephorte.Class>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.LegalClasses()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            ClassTemplate(bindingParameter: Ephorte.ClassificationSystem): Promise<Ephorte.Class> {
                return new Promise<Ephorte.Class>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.ClassTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }



            // Bound to set Functions
            LegalClassificationSystems(bindingParameter: Ephorte.ClassificationSystem[]): Promise<Ephorte.ClassificationSystem> {
                return new Promise<Ephorte.ClassificationSystem>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalClassificationSystems()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            ClassificationSystemTemplate(bindingParameter: Ephorte.ClassificationSystem[]): Promise<Ephorte.ClassificationSystem> {
                return new Promise<Ephorte.ClassificationSystem>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.ClassificationSystemTemplate()",
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
        export class ClassificationSystemTypeEntitySet extends odatatools.EntitySet<Ephorte.ClassificationSystemType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalClassificationSystemTypes(bindingParameter: Ephorte.ClassificationSystemType[]): Promise<Ephorte.ClassificationSystemType> {
                return new Promise<Ephorte.ClassificationSystemType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalClassificationSystemTypes()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            ClassificationSystemTypeTemplate(bindingParameter: Ephorte.ClassificationSystemType[]): Promise<Ephorte.ClassificationSystemType> {
                return new Promise<Ephorte.ClassificationSystemType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.ClassificationSystemTypeTemplate()",
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
        export class DMBCaseListTypeEntitySet extends odatatools.EntitySet<Ephorte.DMBCaseListType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class DMBHandlingDocumentEntitySet extends odatatools.EntitySet<Ephorte.DMBHandlingDocument> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class DMBHandlingStatusEntitySet extends odatatools.EntitySet<Ephorte.DMBHandlingStatus> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalDMBHandlingStatuses(bindingParameter: Ephorte.DMBHandlingStatus[]): Promise<Ephorte.DMBHandlingStatus> {
                return new Promise<Ephorte.DMBHandlingStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDMBHandlingStatuses()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            DMBHandlingStatuses(bindingParameter: Ephorte.DMBHandlingStatus[]): Promise<Ephorte.DMBHandlingStatus> {
                return new Promise<Ephorte.DMBHandlingStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DMBHandlingStatuses()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            CasePlanStatusesNotProcessed(bindingParameter: Ephorte.DMBHandlingStatus[]): Promise<Ephorte.DMBHandlingStatus> {
                return new Promise<Ephorte.DMBHandlingStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.CasePlanStatusesNotProcessed()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalDMBHandlingStatusForCaseList(bindingParameter: Ephorte.DMBHandlingStatus[]): Promise<Ephorte.DMBHandlingStatus> {
                return new Promise<Ephorte.DMBHandlingStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDMBHandlingStatusForCaseList()",
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
        export class ConferCaseEntitySet extends odatatools.EntitySet<Ephorte.ConferCase> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class ConstructionCaseEntitySet extends odatatools.EntitySet<Ephorte.ConstructionCase> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class CoordinateEntitySet extends odatatools.EntitySet<Ephorte.Coordinate> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class CountyEntitySet extends odatatools.EntitySet<Ephorte.County> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class CurrentUserInfoEntitySet extends odatatools.EntitySet<Ephorte.CurrentUserInfo> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class CustomFieldDescriptorEntitySet extends odatatools.EntitySet<Ephorte.CustomFieldDescriptor> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class DataObjectChangeEntitySet extends odatatools.EntitySet<Ephorte.DataObjectChange> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class DecisionStatusEntitySet extends odatatools.EntitySet<Ephorte.DecisionStatus> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalDecisionStatuses(bindingParameter: Ephorte.DecisionStatus[]): Promise<Ephorte.DMBHandlingStatus> {
                return new Promise<Ephorte.DMBHandlingStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDecisionStatuses()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            DecisionStatusTemplate(bindingParameter: Ephorte.DecisionStatus[]): Promise<Ephorte.DecisionStatus> {
                return new Promise<Ephorte.DecisionStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DecisionStatusTemplate()",
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
        export class DecisionTypeEntitySet extends odatatools.EntitySet<Ephorte.DecisionType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            DecisionTypeTemplate(bindingParameter: Ephorte.DecisionType[]): Promise<Ephorte.DecisionType> {
                return new Promise<Ephorte.DecisionType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DecisionTypeTemplate()",
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
        export class DefaultValuesEntitySet extends odatatools.EntitySet<Ephorte.DefaultValues> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            DefaultValuesTemplate(bindingParameter: Ephorte.DefaultValues[]): Promise<Ephorte.DefaultValues> {
                return new Promise<Ephorte.DefaultValues>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DefaultValuesTemplate()",
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
        export class DeputizeEntitySet extends odatatools.EntitySet<Ephorte.Deputize> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class DigitalCertificatDocumentEntitySet extends odatatools.EntitySet<Ephorte.DigitalCertificatDocument> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class DispensationTypeEntitySet extends odatatools.EntitySet<Ephorte.DispensationType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalDispensationTypes(bindingParameter: Ephorte.DispensationType[]): Promise<Ephorte.DispensationType> {
                return new Promise<Ephorte.DispensationType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDispensationTypes()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            DispensationTypeTemplate(bindingParameter: Ephorte.DispensationType[]): Promise<Ephorte.DispensationType> {
                return new Promise<Ephorte.DispensationType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DispensationTypeTemplate()",
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
        export class DisposalCodeEntitySet extends odatatools.EntitySet<Ephorte.DisposalCode> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalDisposalCodes(bindingParameter: Ephorte.DisposalCode[]): Promise<Ephorte.DisposalCode> {
                return new Promise<Ephorte.DisposalCode>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDisposalCodes()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            DisposalCodeTemplate(bindingParameter: Ephorte.DisposalCode[]): Promise<Ephorte.DisposalCode> {
                return new Promise<Ephorte.DisposalCode>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DisposalCodeTemplate()",
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
        export class DMBEntitySet extends odatatools.EntitySet<Ephorte.DMB> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }

            // Bound to entity Actions
            GetAllowances(key: Edm.Int32, dmbId: Edm.Int32, dmbFunction: Edm.String): Promise<Ephorte.MeetingAllowance> {
                return new Promise<Ephorte.MeetingAllowance>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.GetAllowances()",
                        data: {
                            dmbId: dmbId,
                            dmbFunction: dmbFunction,
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
            MeetingAllowanceTemplate(bindingParameter: Ephorte.DMB): Promise<Ephorte.MeetingAllowance> {
                return new Promise<Ephorte.MeetingAllowance>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.MeetingAllowanceTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            DMBMemberTemplate(bindingParameter: Ephorte.DMB): Promise<Ephorte.DMBMember> {
                return new Promise<Ephorte.DMBMember>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.DMBMemberTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            DMBCaseListTypeTemplate(bindingParameter: Ephorte.DMB): Promise<Ephorte.DMBCaseListType> {
                return new Promise<Ephorte.DMBCaseListType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.DMBCaseListTypeTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            RecurringCasePlanListItemTemplate(bindingParameter: Ephorte.DMB): Promise<Ephorte.RecurringCasePlanListItem> {
                return new Promise<Ephorte.RecurringCasePlanListItem>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.RecurringCasePlanListItemTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            ValidateQueueList(bindingParameter: Ephorte.DMB): Promise<Ephorte.DMBHandlingValidation> {
                return new Promise<Ephorte.DMBHandlingValidation>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.ValidateQueueList()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            MemberHistory(bindingParameter: Ephorte.DMB): Promise<Ephorte.DMBMember> {
                return new Promise<Ephorte.DMBMember>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.MemberHistory()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }

            // Bound to set Actions
            GetMeetingsByDmbIds(bindingParameter: Ephorte.DMB[], DmbIds: Edm.Int32[], StartDate: Edm.DateTimeOffset, EndDate: Edm.DateTimeOffset): Promise<Ephorte.Meeting> {
                return new Promise<Ephorte.Meeting>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.GetMeetingsByDmbIds()",
                        data: {
                            DmbIds: DmbIds,
                            StartDate: StartDate,
                            EndDate: EndDate,
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

            // Bound to set Functions
            LegalDMBs(bindingParameter: Ephorte.DMB[], MeetingCaseTypeId: Edm.String): Promise<Ephorte.DMB> {
                return new Promise<Ephorte.DMB>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDMBs(MeetingCaseTypeId=" + MeetingCaseTypeId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            DMBTemplate(bindingParameter: Ephorte.DMB[]): Promise<Ephorte.DMB> {
                return new Promise<Ephorte.DMB>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DMBTemplate()",
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
        export class DMBCaseHandlingEntitySet extends odatatools.EntitySet<Ephorte.DMBCaseHandling> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class DMBDocumentTypeEntitySet extends odatatools.EntitySet<Ephorte.DMBDocumentType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            DMBDocumentTypeTemplate(bindingParameter: Ephorte.DMBDocumentType[]): Promise<Ephorte.DMBDocumentType> {
                return new Promise<Ephorte.DMBDocumentType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DMBDocumentTypeTemplate()",
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
        export class DMBHandlingEntitySet extends odatatools.EntitySet<Ephorte.DMBHandling> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }

            // Bound to entity Actions
            Publish(key: Edm.Int32, PublishFlag: Edm.Int32, DMBHandlingIds: Edm.String): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.Publish()",
                        data: {
                            PublishFlag: PublishFlag,
                            DMBHandlingIds: DMBHandlingIds,
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
            PublishDocument(key: Edm.Int32, DocumentDescriptionId: Edm.Int32, PublishFlag: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.PublishDocument()",
                        data: {
                            DocumentDescriptionId: DocumentDescriptionId,
                            PublishFlag: PublishFlag,
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
            CopyDecisionToNextDmbHandlings(key: Edm.Int32): Promise<Edm.Boolean> {
                return new Promise<Edm.Boolean>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.CopyDecisionToNextDmbHandlings()",
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
            CopyDecisionFromPreviousDmbHandlings(key: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.CopyDecisionFromPreviousDmbHandlings()",
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

            // Bound to entity Functions
            ValidateCasePlanListItem(bindingParameter: Ephorte.DMBHandling): Promise<Ephorte.DMBHandlingValidation> {
                return new Promise<Ephorte.DMBHandlingValidation>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.ValidateCasePlanListItem()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            RegistryEntryDecisionTemplate(bindingParameter: Ephorte.DMBHandling): Promise<Ephorte.RegistryEntryDecision> {
                return new Promise<Ephorte.RegistryEntryDecision>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.RegistryEntryDecisionTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }



            // Bound to set Functions
            LegalDmbHandlings(bindingParameter: Ephorte.DMBHandling[]): Promise<Ephorte.DMBHandling> {
                return new Promise<Ephorte.DMBHandling>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDmbHandlings()",
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
        export class CaseWorkerDMBHandlingEntitySet extends odatatools.EntitySet<Ephorte.CaseWorkerDMBHandling> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class DMBHandlingValidationEntitySet extends odatatools.EntitySet<Ephorte.DMBHandlingValidation> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class DMBMemberEntitySet extends odatatools.EntitySet<Ephorte.DMBMember> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            DMBMembershipsForCurrentUser(bindingParameter: Ephorte.DMBMember[]): Promise<Ephorte.DMBMember> {
                return new Promise<Ephorte.DMBMember>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DMBMembershipsForCurrentUser()",
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
        export class DMBMemberRoleEntitySet extends odatatools.EntitySet<Ephorte.DMBMemberRole> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            DMBMemberRoleTemplate(bindingParameter: Ephorte.DMBMemberRole[]): Promise<Ephorte.DMBMemberRole> {
                return new Promise<Ephorte.DMBMemberRole>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DMBMemberRoleTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalDMBMemberRoles(bindingParameter: Ephorte.DMBMemberRole[]): Promise<Ephorte.DMBMemberRole> {
                return new Promise<Ephorte.DMBMemberRole>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDMBMemberRoles()",
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
        export class DMBTypeEntitySet extends odatatools.EntitySet<Ephorte.DMBType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalDMBTypes(bindingParameter: Ephorte.DMBType[]): Promise<Ephorte.DMBType> {
                return new Promise<Ephorte.DMBType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDMBTypes()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            DMBTypeTemplate(bindingParameter: Ephorte.DMBType[]): Promise<Ephorte.DMBType> {
                return new Promise<Ephorte.DMBType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DMBTypeTemplate()",
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
        export class DocumentCategoryEntitySet extends odatatools.EntitySet<Ephorte.DocumentCategory> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalDocumentCategories(bindingParameter: Ephorte.DocumentCategory[], FileTypeId: Edm.String): Promise<Ephorte.DocumentCategory> {
                return new Promise<Ephorte.DocumentCategory>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDocumentCategories(FileTypeId=" + FileTypeId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalDocumentCategoriesExactMatch(bindingParameter: Ephorte.DocumentCategory[], FileTypeId: Edm.String): Promise<Ephorte.DocumentCategory> {
                return new Promise<Ephorte.DocumentCategory>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDocumentCategoriesExactMatch(FileTypeId=" + FileTypeId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            DocumentCategoryTemplate(bindingParameter: Ephorte.DocumentCategory[]): Promise<Ephorte.DocumentCategory> {
                return new Promise<Ephorte.DocumentCategory>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DocumentCategoryTemplate()",
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
        export class DocumentDescriptionEntitySet extends odatatools.EntitySet<Ephorte.DocumentDescription> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }

            // Bound to entity Actions
            AddNewVersionFromCurrentVersion(key: Edm.Int32): Promise<Ephorte.DocumentObject> {
                return new Promise<Ephorte.DocumentObject>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.AddNewVersionFromCurrentVersion()",
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
            AddNewPublicVersionFromCurrentVersion(key: Edm.Int32): Promise<Ephorte.DocumentObject> {
                return new Promise<Ephorte.DocumentObject>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.AddNewPublicVersionFromCurrentVersion()",
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
            MergeDocumentWithTemplate(key: Edm.Int32, DocumentTemplateId: Edm.Int32): Promise<Ephorte.DocumentObject> {
                return new Promise<Ephorte.DocumentObject>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.MergeDocumentWithTemplate()",
                        data: {
                            DocumentTemplateId: DocumentTemplateId,
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
            ReplacedBy(bindingParameter: Ephorte.DocumentDescription): Promise<Ephorte.RegistryEntryDocument> {
                return new Promise<Ephorte.RegistryEntryDocument>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.ReplacedBy()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            GetRegistryEntryDocumentIsMain(bindingParameter: Ephorte.DocumentDescription): Promise<Ephorte.RegistryEntryDocument> {
                return new Promise<Ephorte.RegistryEntryDocument>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.GetRegistryEntryDocumentIsMain()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LinkTemplate(bindingParameter: Ephorte.DocumentDescription, LinkTypeId: Edm.String): Promise<Ephorte.LinkFromDocumentDescription> {
                return new Promise<Ephorte.LinkFromDocumentDescription>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.LinkTemplate(LinkTypeId=" + LinkTypeId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }



            // Bound to set Functions
            LegalDocumentDescriptions(bindingParameter: Ephorte.DocumentDescription[]): Promise<Ephorte.DocumentDescription> {
                return new Promise<Ephorte.DocumentDescription>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDocumentDescriptions()",
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
        export class DocumentDescriptionLinksInfoEntitySet extends odatatools.EntitySet<Ephorte.DocumentDescriptionLinksInfo> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class LinkFromDocumentDescriptionEntitySet extends odatatools.EntitySet<Ephorte.LinkFromDocumentDescription> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class DocumentLinkTypeEntitySet extends odatatools.EntitySet<Ephorte.DocumentLinkType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            DocumentLinkTypeTemplate(bindingParameter: Ephorte.DocumentLinkType[]): Promise<Ephorte.DocumentLinkType> {
                return new Promise<Ephorte.DocumentLinkType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DocumentLinkTypeTemplate()",
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
        export class DocumentObjectEntitySet extends odatatools.EntitySet<Ephorte.DocumentObject> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }

            // Bound to entity Actions
            UndoCheckout(key: Edm.Int32, RegistryEntryId: Edm.Int32): Promise<Ephorte.DocumentObject> {
                return new Promise<Ephorte.DocumentObject>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.UndoCheckout()",
                        data: {
                            RegistryEntryId: RegistryEntryId,
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
            DocumentPreviewGenerated(key: Edm.Int32, Checksum: Edm.String): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.DocumentPreviewGenerated()",
                        data: {
                            Checksum: Checksum,
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
            DocumentPreviewGenerationFailed(key: Edm.Int32, Checksum: Edm.String, Error: Edm.String): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.DocumentPreviewGenerationFailed()",
                        data: {
                            Checksum: Checksum,
                            Error: Error,
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





            // Bound to set Functions
            CreatedDateRange(bindingParameter: Ephorte.DocumentObject[]): Promise<Ephorte.DOM.Model.DateRange> {
                return new Promise<Ephorte.DOM.Model.DateRange>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.CreatedDateRange()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            DocumentsWithoutPreview(bindingParameter: Ephorte.DocumentObject[], DocumentDescriptionId: Edm.Int32, DateStartTicks: Edm.Int64, DateEndTicks: Edm.Int64): Promise<Ephorte.DocumentObject> {
                return new Promise<Ephorte.DocumentObject>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DocumentsWithoutPreview(DocumentDescriptionId=" + DocumentDescriptionId + ",DateStartTicks=" + DateStartTicks + ",DateEndTicks=" + DateEndTicks + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalDocumentObjects(bindingParameter: Ephorte.DocumentObject[]): Promise<Ephorte.DocumentObject> {
                return new Promise<Ephorte.DocumentObject>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDocumentObjects()",
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
        export class DocumentStatusEntitySet extends odatatools.EntitySet<Ephorte.DocumentStatus> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalDocumentStatuses(bindingParameter: Ephorte.DocumentStatus[]): Promise<Ephorte.DocumentStatus> {
                return new Promise<Ephorte.DocumentStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDocumentStatuses()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            DocumentStatusTemplate(bindingParameter: Ephorte.DocumentStatus[]): Promise<Ephorte.DocumentStatus> {
                return new Promise<Ephorte.DocumentStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DocumentStatusTemplate()",
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
        export class DocumentTemplateEntitySet extends odatatools.EntitySet<Ephorte.DocumentTemplate> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalDocumentTemplates(bindingParameter: Ephorte.DocumentTemplate[], RegistryEntryTypeId: Edm.String, DocumentTemplateTypeId: Edm.Int32, FileTypeId: Edm.String): Promise<Ephorte.DocumentTemplate> {
                return new Promise<Ephorte.DocumentTemplate>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDocumentTemplates(RegistryEntryTypeId=" + RegistryEntryTypeId + ",DocumentTemplateTypeId=" + DocumentTemplateTypeId + ",FileTypeId=" + FileTypeId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalHtmlDocumentTemplates(bindingParameter: Ephorte.DocumentTemplate[], RegistryEntryTypeId: Edm.String, DocumentTemplateTypeId: Edm.Int32, FileTypeId: Edm.String): Promise<Ephorte.DocumentTemplate> {
                return new Promise<Ephorte.DocumentTemplate>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalHtmlDocumentTemplates(RegistryEntryTypeId=" + RegistryEntryTypeId + ",DocumentTemplateTypeId=" + DocumentTemplateTypeId + ",FileTypeId=" + FileTypeId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            DocumentTemplateTemplate(bindingParameter: Ephorte.DocumentTemplate[]): Promise<Ephorte.DocumentTemplate> {
                return new Promise<Ephorte.DocumentTemplate>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DocumentTemplateTemplate()",
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
        export class DocumentTemplateTypeEntitySet extends odatatools.EntitySet<Ephorte.DocumentTemplateType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            DocumentTemplateTypeTemplate(bindingParameter: Ephorte.DocumentTemplateType[]): Promise<Ephorte.DocumentTemplateType> {
                return new Promise<Ephorte.DocumentTemplateType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DocumentTemplateTypeTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalDocumentTemplateTypes(bindingParameter: Ephorte.DocumentTemplateType[]): Promise<Ephorte.DocumentTemplateType> {
                return new Promise<Ephorte.DocumentTemplateType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDocumentTemplateTypes()",
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
        export class DowngradingCodeEntitySet extends odatatools.EntitySet<Ephorte.DowngradingCode> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            DowngradingCodeTemplate(bindingParameter: Ephorte.DowngradingCode[]): Promise<Ephorte.DowngradingCode> {
                return new Promise<Ephorte.DowngradingCode>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DowngradingCodeTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalDowngradingCodes(bindingParameter: Ephorte.DowngradingCode[]): Promise<Ephorte.DowngradingCode> {
                return new Promise<Ephorte.DowngradingCode>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalDowngradingCodes()",
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
        export class EntityCollectionAggregationEntitySet extends odatatools.EntitySet<Ephorte.EntityCollectionAggregation> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class ExternalSystemEntitySet extends odatatools.EntitySet<Ephorte.ExternalSystem> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class ExternalSystemLinkCaseEntitySet extends odatatools.EntitySet<Ephorte.ExternalSystemLinkCase> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class ExternalSystemLinkRegistryEntryEntitySet extends odatatools.EntitySet<Ephorte.ExternalSystemLinkRegistryEntry> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class FeeTypeEntitySet extends odatatools.EntitySet<Ephorte.FeeType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            FeeTypeTemplate(bindingParameter: Ephorte.FeeType[]): Promise<Ephorte.FeeType> {
                return new Promise<Ephorte.FeeType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.FeeTypeTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalFeeTypes(bindingParameter: Ephorte.FeeType[]): Promise<Ephorte.FeeType> {
                return new Promise<Ephorte.FeeType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalFeeTypes()",
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
        export class FieldEntitySet extends odatatools.EntitySet<Ephorte.Field> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class FileFormatEntitySet extends odatatools.EntitySet<Ephorte.FileFormat> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            FileFormatTemplate(bindingParameter: Ephorte.FileFormat[]): Promise<Ephorte.FileFormat> {
                return new Promise<Ephorte.FileFormat>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.FileFormatTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalFileFormats(bindingParameter: Ephorte.FileFormat[]): Promise<Ephorte.FileFormat> {
                return new Promise<Ephorte.FileFormat>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalFileFormats()",
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
        export class FileTypeEntitySet extends odatatools.EntitySet<Ephorte.FileType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalFileTypes(bindingParameter: Ephorte.FileType[]): Promise<Ephorte.FileType> {
                return new Promise<Ephorte.FileType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalFileTypes()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            FileTypeTemplate(bindingParameter: Ephorte.FileType[]): Promise<Ephorte.FileType> {
                return new Promise<Ephorte.FileType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.FileTypeTemplate()",
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
        export class RecurringCasePlanListItemEntitySet extends odatatools.EntitySet<Ephorte.RecurringCasePlanListItem> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class FolderEntitySet extends odatatools.EntitySet<Ephorte.Folder> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class FolderCaseLinkEntitySet extends odatatools.EntitySet<Ephorte.FolderCaseLink> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class FolderDocumentLinkEntitySet extends odatatools.EntitySet<Ephorte.FolderDocumentLink> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class FolderRegistryEntryLinkEntitySet extends odatatools.EntitySet<Ephorte.FolderRegistryEntryLink> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class FollowUpMethodEntitySet extends odatatools.EntitySet<Ephorte.FollowUpMethod> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalFollowUpMethodsForRegistryEntry(bindingParameter: Ephorte.FollowUpMethod[]): Promise<Ephorte.FollowUpMethod> {
                return new Promise<Ephorte.FollowUpMethod>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalFollowUpMethodsForRegistryEntry()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            FollowUpMethodTemplate(bindingParameter: Ephorte.FollowUpMethod[]): Promise<Ephorte.FollowUpMethod> {
                return new Promise<Ephorte.FollowUpMethod>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.FollowUpMethodTemplate()",
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
        export class FondsPeriodEntitySet extends odatatools.EntitySet<Ephorte.FondsPeriod> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalFondsPeriods(bindingParameter: Ephorte.FondsPeriod[]): Promise<Ephorte.FondsPeriod> {
                return new Promise<Ephorte.FondsPeriod>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalFondsPeriods()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            FondsPeriodTemplate(bindingParameter: Ephorte.FondsPeriod[]): Promise<Ephorte.FondsPeriod> {
                return new Promise<Ephorte.FondsPeriod>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.FondsPeriodTemplate()",
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
        export class FondsStatusEntitySet extends odatatools.EntitySet<Ephorte.FondsStatus> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalFondsStatuses(bindingParameter: Ephorte.FondsStatus[]): Promise<Ephorte.FondsStatus> {
                return new Promise<Ephorte.FondsStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalFondsStatuses()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            FondsStatusTemplate(bindingParameter: Ephorte.FondsStatus[]): Promise<Ephorte.FondsStatus> {
                return new Promise<Ephorte.FondsStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.FondsStatusTemplate()",
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
        export class GeographicalEntityEntitySet extends odatatools.EntitySet<Ephorte.GeographicalEntity> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class WktEntitySet extends odatatools.EntitySet<Ephorte.Wkt> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class GeographicalObjectLinkEntitySet extends odatatools.EntitySet<Ephorte.GeographicalObjectLink> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class GeographicalObjectTypeEntitySet extends odatatools.EntitySet<Ephorte.GeographicalObjectType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class IdentificationTypeEntitySet extends odatatools.EntitySet<Ephorte.IdentificationType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalIdentificationTypes(bindingParameter: Ephorte.IdentificationType[]): Promise<Ephorte.IdentificationType> {
                return new Promise<Ephorte.IdentificationType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalIdentificationTypes()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            IdentificationTypeTemplate(bindingParameter: Ephorte.IdentificationType[]): Promise<Ephorte.IdentificationType> {
                return new Promise<Ephorte.IdentificationType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.IdentificationTypeTemplate()",
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
        export class InformationTypeEntitySet extends odatatools.EntitySet<Ephorte.InformationType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalInformationTypes(bindingParameter: Ephorte.InformationType[]): Promise<Ephorte.InformationType> {
                return new Promise<Ephorte.InformationType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalInformationTypes()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            InformationTypeTemplate(bindingParameter: Ephorte.InformationType[]): Promise<Ephorte.InformationType> {
                return new Promise<Ephorte.InformationType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.InformationTypeTemplate()",
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
        export class InvoiceStatusEntitySet extends odatatools.EntitySet<Ephorte.InvoiceStatus> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalStatuses(bindingParameter: Ephorte.InvoiceStatus[]): Promise<Ephorte.InvoiceStatus> {
                return new Promise<Ephorte.InvoiceStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalStatuses()",
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
        export class InvoiceEntitySet extends odatatools.EntitySet<Ephorte.Invoice> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }



            // Bound to entity Functions
            LineItemTemplate(bindingParameter: Ephorte.Invoice): Promise<Ephorte.InvoiceLineItem> {
                return new Promise<Ephorte.InvoiceLineItem>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.LineItemTemplate()",
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
        export class InvoiceLineItemEntitySet extends odatatools.EntitySet<Ephorte.InvoiceLineItem> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class KeywordEntitySet extends odatatools.EntitySet<Ephorte.Keyword> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalKeywords(bindingParameter: Ephorte.Keyword[]): Promise<Ephorte.Keyword> {
                return new Promise<Ephorte.Keyword>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalKeywords()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            KeywordTemplate(bindingParameter: Ephorte.Keyword[]): Promise<Ephorte.Keyword> {
                return new Promise<Ephorte.Keyword>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.KeywordTemplate()",
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
        export class KeywordReferenceEntitySet extends odatatools.EntitySet<Ephorte.KeywordReference> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class KeywordsPrecedentsEntitySet extends odatatools.EntitySet<Ephorte.KeywordsPrecedents> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class LandPlanEntitySet extends odatatools.EntitySet<Ephorte.LandPlan> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class LandPlanStatusEntitySet extends odatatools.EntitySet<Ephorte.LandPlanStatus> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LandPlanStatusTemplate(bindingParameter: Ephorte.LandPlanStatus[]): Promise<Ephorte.LandPlanStatus> {
                return new Promise<Ephorte.LandPlanStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LandPlanStatusTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalLandPlanStatuses(bindingParameter: Ephorte.LandPlanStatus[]): Promise<Ephorte.LandPlanStatus> {
                return new Promise<Ephorte.LandPlanStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalLandPlanStatuses()",
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
        export class LandPlanTypeEntitySet extends odatatools.EntitySet<Ephorte.LandPlanType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LandPlanTypeTemplate(bindingParameter: Ephorte.LandPlanType[]): Promise<Ephorte.LandPlanType> {
                return new Promise<Ephorte.LandPlanType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LandPlanTypeTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalLandPlanTypes(bindingParameter: Ephorte.LandPlanType[]): Promise<Ephorte.LandPlanType> {
                return new Promise<Ephorte.LandPlanType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalLandPlanTypes()",
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
        export class LandRegisterEntitySet extends odatatools.EntitySet<Ephorte.LandRegister> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class LawAndRegulationsEntitySet extends odatatools.EntitySet<Ephorte.LawAndRegulations> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LawAndRegulationsTemplate(bindingParameter: Ephorte.LawAndRegulations[]): Promise<Ephorte.LawAndRegulations> {
                return new Promise<Ephorte.LawAndRegulations>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LawAndRegulationsTemplate()",
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
        export class LawRegulationReferenceToPrecedentEntitySet extends odatatools.EntitySet<Ephorte.LawRegulationReferenceToPrecedent> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class DmbProposalEntitySet extends odatatools.EntitySet<Ephorte.DmbProposal> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class PreauthenticatedReadDocumentTemplateUrisEntitySet extends odatatools.EntitySet<Ephorte.PreauthenticatedReadDocumentTemplateUris> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class PreauthenticatedReadDocumentUrisEntitySet extends odatatools.EntitySet<Ephorte.PreauthenticatedReadDocumentUris> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class PreauthenticatedWriteDocumentUrisEntitySet extends odatatools.EntitySet<Ephorte.PreauthenticatedWriteDocumentUris> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class FieldMetadataEntitySet extends odatatools.EntitySet<Ephorte.FieldMetadata> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class PredefinedQueryFavoriteEntitySet extends odatatools.EntitySet<Ephorte.PredefinedQueryFavorite> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class PredefinedQueryViewEntitySet extends odatatools.EntitySet<Ephorte.PredefinedQueryView> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            EffectiveView(bindingParameter: Ephorte.PredefinedQueryView[], ObjectType: Edm.String, ViewType: Ephorte.ViewType, QueryId: Edm.Int32): Promise<Ephorte.PredefinedQueryView> {
                return new Promise<Ephorte.PredefinedQueryView>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.EffectiveView(ObjectType=" + ObjectType + ",ViewType=" + ViewType + ",QueryId=" + QueryId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            ViewsForObjectType(bindingParameter: Ephorte.PredefinedQueryView[], ObjectType: Edm.String, ViewType: Ephorte.ViewType): Promise<Ephorte.PredefinedQueryView> {
                return new Promise<Ephorte.PredefinedQueryView>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.ViewsForObjectType(ObjectType=" + ObjectType + ",ViewType=" + ViewType + ")",
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
        export class PredefinedQueryViewFieldEntitySet extends odatatools.EntitySet<Ephorte.PredefinedQueryViewField> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            PredefinedQueryViewFieldTemplate(bindingParameter: Ephorte.PredefinedQueryViewField[]): Promise<Ephorte.PredefinedQueryViewField> {
                return new Promise<Ephorte.PredefinedQueryViewField>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.PredefinedQueryViewFieldTemplate()",
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
        export class TableMetadataEntitySet extends odatatools.EntitySet<Ephorte.TableMetadata> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }



            // Bound to entity Functions
            FilterableFields(bindingParameter: Ephorte.TableMetadata): Promise<Ephorte.FieldMetadata> {
                return new Promise<Ephorte.FieldMetadata>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.FilterableFields()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }



            // Bound to set Functions
            FieldsByObjectId(bindingParameter: Ephorte.TableMetadata[], ObjectId: Edm.Int32): Promise<Ephorte.TableMetadata> {
                return new Promise<Ephorte.TableMetadata>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.FieldsByObjectId(ObjectId=" + ObjectId + ")",
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
        export class PendingImportDocumentEntitySet extends odatatools.EntitySet<Ephorte.PendingImportDocument> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class PredefinedQueryParentsTreeEntitySet extends odatatools.EntitySet<Ephorte.PredefinedQueryParentsTree> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class ImportTemplateResultEntitySet extends odatatools.EntitySet<Ephorte.ImportTemplateResult> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class SenderRecipientEntitySet extends odatatools.EntitySet<Ephorte.SenderRecipient> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalExternalSenders(bindingParameter: Ephorte.SenderRecipient[]): Promise<Ephorte.SenderRecipient> {
                return new Promise<Ephorte.SenderRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalExternalSenders()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalExternalRecipients(bindingParameter: Ephorte.SenderRecipient[]): Promise<Ephorte.SenderRecipient> {
                return new Promise<Ephorte.SenderRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalExternalRecipients()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalRecipients(bindingParameter: Ephorte.SenderRecipient[], CaseId: Edm.Int32): Promise<Ephorte.SenderRecipient> {
                return new Promise<Ephorte.SenderRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalRecipients(CaseId=" + CaseId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalInternalRecipients(bindingParameter: Ephorte.SenderRecipient[]): Promise<Ephorte.SenderRecipient> {
                return new Promise<Ephorte.SenderRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalInternalRecipients()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AddressGroupRecipients(bindingParameter: Ephorte.SenderRecipient[], AddressGroupShortCode: Edm.String): Promise<Ephorte.SenderRecipient> {
                return new Promise<Ephorte.SenderRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.AddressGroupRecipients(AddressGroupShortCode=" + AddressGroupShortCode + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AccessGroupRecipients(bindingParameter: Ephorte.SenderRecipient[], AccessGroupId: Edm.Int32): Promise<Ephorte.SenderRecipient> {
                return new Promise<Ephorte.SenderRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.AccessGroupRecipients(AccessGroupId=" + AccessGroupId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            FromAddress(bindingParameter: Ephorte.SenderRecipient[], AddressIds: Edm.String, AddressProvider: Edm.String, ShortCodes: Edm.String): Promise<Ephorte.SenderRecipient> {
                return new Promise<Ephorte.SenderRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.FromAddress(AddressIds=" + AddressIds + ",AddressProvider=" + AddressProvider + ",ShortCodes=" + ShortCodes + ")",
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
        export class CaseWorkerSenderRecipientEntitySet extends odatatools.EntitySet<Ephorte.CaseWorkerSenderRecipient> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class LinkTypeEntitySet extends odatatools.EntitySet<Ephorte.LinkType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LinkTypeTemplate(bindingParameter: Ephorte.LinkType[]): Promise<Ephorte.LinkType> {
                return new Promise<Ephorte.LinkType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LinkTypeTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalLinkTypes(bindingParameter: Ephorte.LinkType[]): Promise<Ephorte.LinkType> {
                return new Promise<Ephorte.LinkType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalLinkTypes()",
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
        export class LogEventTypeEntitySet extends odatatools.EntitySet<Ephorte.LogEventType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class LogEventObjectEntitySet extends odatatools.EntitySet<Ephorte.LogEventObject> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            CaseLogEventTemplate(bindingParameter: Ephorte.LogEventObject[], CaseId: Edm.Int32): Promise<Ephorte.LogEventObject> {
                return new Promise<Ephorte.LogEventObject>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.CaseLogEventTemplate(CaseId=" + CaseId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            RegistryEntryLogEventTemplate(bindingParameter: Ephorte.LogEventObject[], RegistryEntryId: Edm.Int32): Promise<Ephorte.LogEventObject> {
                return new Promise<Ephorte.LogEventObject>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.RegistryEntryLogEventTemplate(RegistryEntryId=" + RegistryEntryId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            DocumentDescriptionLogEventTemplate(bindingParameter: Ephorte.LogEventObject[], DocumentDescriptionId: Edm.Int32, VersionNumber: Edm.Int32, VariantFormatId: Edm.String): Promise<Ephorte.LogEventObject> {
                return new Promise<Ephorte.LogEventObject>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.DocumentDescriptionLogEventTemplate(DocumentDescriptionId=" + DocumentDescriptionId + ",VersionNumber=" + VersionNumber + ",VariantFormatId=" + VariantFormatId + ")",
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
        export class LogEventUserNameEntitySet extends odatatools.EntitySet<Ephorte.LogEventUserName> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class LogEntryEntitySet extends odatatools.EntitySet<Ephorte.LogEntry> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class MeetingEntitySet extends odatatools.EntitySet<Ephorte.Meeting> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }

            // Bound to entity Actions
            SaveCasePlanList(key: Edm.Int32, DmbId: Edm.Int32, DmbHandlingIds: Edm.String, CasePlanListOperation: Edm.Int32): Promise<Ephorte.DOM.OperationResult> {
                return new Promise<Ephorte.DOM.OperationResult>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.SaveCasePlanList()",
                        data: {
                            DmbId: DmbId,
                            DmbHandlingIds: DmbHandlingIds,
                            CasePlanListOperation: CasePlanListOperation,
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
            GenerateCasePlanListSequenceNumbers(key: Edm.Int32, DmbId: Edm.Int32, DmbHandlingIds: Edm.String, CasePlanListOperation: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.GenerateCasePlanListSequenceNumbers()",
                        data: {
                            DmbId: DmbId,
                            DmbHandlingIds: DmbHandlingIds,
                            CasePlanListOperation: CasePlanListOperation,
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
            NumberCasePlanList(key: Edm.Int32, DmbId: Edm.Int32, NumberFromThisMeeting: Edm.Boolean): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.NumberCasePlanList()",
                        data: {
                            DmbId: DmbId,
                            NumberFromThisMeeting: NumberFromThisMeeting,
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
            PrepareDmbDocuments(key: Edm.Int32, DmbId: Edm.Int32, DocumentLinkTypeId: Edm.String, IsPublic: Edm.Boolean): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.PrepareDmbDocuments()",
                        data: {
                            DmbId: DmbId,
                            DocumentLinkTypeId: DocumentLinkTypeId,
                            IsPublic: IsPublic,
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
            AutoRegisterAttendanceForAllMembers(key: Edm.Int32, DmbId: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.AutoRegisterAttendanceForAllMembers()",
                        data: {
                            DmbId: DmbId,
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
            SetMeetingSecretary(key: Edm.Int32, DmbId: Edm.Int32, PnId: Edm.Int32, Value: Edm.Boolean): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.SetMeetingSecretary()",
                        data: {
                            DmbId: DmbId,
                            PnId: PnId,
                            Value: Value,
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
            SetMeetingLeader(key: Edm.Int32, DmbId: Edm.Int32, PnId: Edm.Int32, Value: Edm.Boolean): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.SetMeetingLeader()",
                        data: {
                            DmbId: DmbId,
                            PnId: PnId,
                            Value: Value,
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
            GenerateMeetingNotice(key: Edm.Int32, DmbId: Edm.Int32, IsPublic: Edm.Boolean): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.GenerateMeetingNotice()",
                        data: {
                            DmbId: DmbId,
                            IsPublic: IsPublic,
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
            GenerateMinutesOfMeeting(key: Edm.Int32, DmbId: Edm.Int32, IsPublic: Edm.Boolean): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.GenerateMinutesOfMeeting()",
                        data: {
                            DmbId: DmbId,
                            IsPublic: IsPublic,
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
            GenerateMinutesOfMeetingApprovedInMeeting(key: Edm.Int32, DmbId: Edm.Int32, IsPublic: Edm.Boolean): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.GenerateMinutesOfMeetingApprovedInMeeting()",
                        data: {
                            DmbId: DmbId,
                            IsPublic: IsPublic,
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
            GenerateMeetingDistributionList(key: Edm.Int32, DmbId: Edm.Int32, DocumentType: Edm.String, IsPublic: Edm.Boolean, UsePdfFormat: Edm.Boolean): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.GenerateMeetingDistributionList()",
                        data: {
                            DmbId: DmbId,
                            DocumentType: DocumentType,
                            IsPublic: IsPublic,
                            UsePdfFormat: UsePdfFormat,
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
            ZipMeetingDistributionList(key: Edm.Int32, DmbId: Edm.Int32, DocumentType: Edm.String, IsPublic: Edm.Boolean): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.ZipMeetingDistributionList()",
                        data: {
                            DmbId: DmbId,
                            DocumentType: DocumentType,
                            IsPublic: IsPublic,
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
            MergeMinutes(key: Edm.Int32, DmbHandlingId: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.MergeMinutes()",
                        data: {
                            DmbHandlingId: DmbHandlingId,
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
            MergeMeetingDocument(key: Edm.Int32, DmbDocumentTypeId: Edm.String): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.MergeMeetingDocument()",
                        data: {
                            DmbDocumentTypeId: DmbDocumentTypeId,
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
            RemoveAttendantFromMeeting(key: Edm.Int32, PnId: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.RemoveAttendantFromMeeting()",
                        data: {
                            PnId: PnId,
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
            RegisterAttendantToMeeting(key: Edm.Int32, PnId: Edm.Int32, DmbId: Edm.Int32): Promise<Ephorte.MeetingAttendant> {
                return new Promise<Ephorte.MeetingAttendant>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.RegisterAttendantToMeeting()",
                        data: {
                            PnId: PnId,
                            DmbId: DmbId,
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
            ProtocolAgendaItem(key: Edm.Int32, DmbHandlingId: Edm.Int32, CaseId: Edm.Int32, RegistryEntryId: Edm.Int32): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.ProtocolAgendaItem()",
                        data: {
                            DmbHandlingId: DmbHandlingId,
                            CaseId: CaseId,
                            RegistryEntryId: RegistryEntryId,
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
            ReorderAttendants(key: Edm.Int32, MeetingAttendants: Ephorte.MeetingAttendant[]): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.ReorderAttendants()",
                        data: {
                            MeetingAttendants: MeetingAttendants,
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
            DeleteWithAttendance(key: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.DeleteWithAttendance()",
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
            CancelMeeting(key: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.CancelMeeting()",
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
            LockMinutes(key: Edm.Int32): Promise<Ephorte.Meeting> {
                return new Promise<Ephorte.Meeting>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.LockMinutes()",
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
            GetMeetingPermissions(key: Edm.Int32): Promise<Ephorte.MeetingPermissions> {
                return new Promise<Ephorte.MeetingPermissions>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.GetMeetingPermissions()",
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

            // Bound to entity Functions
            AvailableReplacements(bindingParameter: Ephorte.Meeting, DmbId: Edm.Int32): Promise<Ephorte.MeetingAttendant> {
                return new Promise<Ephorte.MeetingAttendant>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.AvailableReplacements(DmbId=" + DmbId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            HasCasePlanListRestrictedItems(bindingParameter: Ephorte.Meeting): Promise<Edm.Boolean> {
                return new Promise<Edm.Boolean>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.HasCasePlanListRestrictedItems()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalAttendantsForMeeting(bindingParameter: Ephorte.Meeting, DmbId: Edm.Int32): Promise<Ephorte.MeetingAttendant> {
                return new Promise<Ephorte.MeetingAttendant>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.LegalAttendantsForMeeting(DmbId=" + DmbId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            MeetingDistributionList(bindingParameter: Ephorte.Meeting, DocumentType: Edm.String): Promise<Ephorte.MeetingDistributionItem> {
                return new Promise<Ephorte.MeetingDistributionItem>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.MeetingDistributionList(DocumentType=" + DocumentType + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            ValidateCasePlanList(bindingParameter: Ephorte.Meeting): Promise<Ephorte.DMBHandlingValidation> {
                return new Promise<Ephorte.DMBHandlingValidation>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.ValidateCasePlanList()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            MeetingAttendantTemplate(bindingParameter: Ephorte.Meeting): Promise<Ephorte.MeetingAttendant> {
                return new Promise<Ephorte.MeetingAttendant>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.MeetingAttendantTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }

            // Bound to set Actions
            RegisterReplacementForAttendant(bindingParameter: Ephorte.Meeting[], ReplacementForId: Edm.Int32, PnId: Edm.Int32, DmbId: Edm.Int32, MeetingId: Edm.Int32, SortOrder: Edm.Int32): Promise<Ephorte.MeetingAttendant> {
                return new Promise<Ephorte.MeetingAttendant>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.RegisterReplacementForAttendant()",
                        data: {
                            ReplacementForId: ReplacementForId,
                            PnId: PnId,
                            DmbId: DmbId,
                            MeetingId: MeetingId,
                            SortOrder: SortOrder,
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

            // Bound to set Functions
            LegalMeetings(bindingParameter: Ephorte.Meeting[], DMBId: Edm.Int32): Promise<Ephorte.Meeting> {
                return new Promise<Ephorte.Meeting>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalMeetings(DMBId=" + DMBId + ")",
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
        export class MeetingDistributionItemEntitySet extends odatatools.EntitySet<Ephorte.MeetingDistributionItem> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class MeetingPermissionsEntitySet extends odatatools.EntitySet<Ephorte.MeetingPermissions> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class MeetingAttendantEntitySet extends odatatools.EntitySet<Ephorte.MeetingAttendant> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class MeetingCaseTypeEntitySet extends odatatools.EntitySet<Ephorte.MeetingCaseType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalMeetingCaseTypes(bindingParameter: Ephorte.MeetingCaseType[], DMBId: Edm.Int32): Promise<Ephorte.MeetingCaseType> {
                return new Promise<Ephorte.MeetingCaseType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalMeetingCaseTypes(DMBId=" + DMBId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AllLegalMeetingCaseTypes(bindingParameter: Ephorte.MeetingCaseType[]): Promise<Ephorte.MeetingCaseType> {
                return new Promise<Ephorte.MeetingCaseType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.AllLegalMeetingCaseTypes()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            MeetingCaseTypeTemplate(bindingParameter: Ephorte.MeetingCaseType[]): Promise<Ephorte.MeetingCaseType> {
                return new Promise<Ephorte.MeetingCaseType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.MeetingCaseTypeTemplate()",
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
        export class MeetingDocumentEntitySet extends odatatools.EntitySet<Ephorte.MeetingDocument> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }

            // Bound to entity Actions
            Publish(key: Edm.Int32, PublishFlag: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.Publish()",
                        data: {
                            PublishFlag: PublishFlag,
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
        export class CaseWorkerMeetingDocumentEntitySet extends odatatools.EntitySet<Ephorte.CaseWorkerMeetingDocument> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class MeetingDocumentLinkEntitySet extends odatatools.EntitySet<Ephorte.MeetingDocumentLink> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class MergeFieldContentEntitySet extends odatatools.EntitySet<Ephorte.MergeFieldContent> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            MergeFieldContentTemplate(bindingParameter: Ephorte.MergeFieldContent[]): Promise<Ephorte.MergeFieldContent> {
                return new Promise<Ephorte.MergeFieldContent>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.MergeFieldContentTemplate()",
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
        export class NumberSeriesEntitySet extends odatatools.EntitySet<Ephorte.NumberSeries> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalNumberSeries(bindingParameter: Ephorte.NumberSeries[]): Promise<Ephorte.NumberSeries> {
                return new Promise<Ephorte.NumberSeries>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalNumberSeries()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            NumberSeriesTemplate(bindingParameter: Ephorte.NumberSeries[]): Promise<Ephorte.NumberSeries> {
                return new Promise<Ephorte.NumberSeries>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.NumberSeriesTemplate()",
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
        export class PermissionsEntitySet extends odatatools.EntitySet<Ephorte.Permissions> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class PlanIdentEntitySet extends odatatools.EntitySet<Ephorte.PlanIdent> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class PlanRegulationsEntitySet extends odatatools.EntitySet<Ephorte.PlanRegulations> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            PlanRegulationsTemplate(bindingParameter: Ephorte.PlanRegulations[]): Promise<Ephorte.PlanRegulations> {
                return new Promise<Ephorte.PlanRegulations>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.PlanRegulationsTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalPlanRegulations(bindingParameter: Ephorte.PlanRegulations[]): Promise<Ephorte.PlanRegulations> {
                return new Promise<Ephorte.PlanRegulations>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalPlanRegulations()",
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
        export class PositionEntitySet extends odatatools.EntitySet<Ephorte.Position> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            PositionTemplate(bindingParameter: Ephorte.Position[], CaseId: Edm.Int32): Promise<Ephorte.Position> {
                return new Promise<Ephorte.Position>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.PositionTemplate(CaseId=" + CaseId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalPositions(bindingParameter: Ephorte.Position[]): Promise<Ephorte.Position> {
                return new Promise<Ephorte.Position>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalPositions()",
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
        export class PositionAnnouncementTypeEntitySet extends odatatools.EntitySet<Ephorte.PositionAnnouncementType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            PositionAnnouncementTypeTemplate(bindingParameter: Ephorte.PositionAnnouncementType[]): Promise<Ephorte.PositionAnnouncementType> {
                return new Promise<Ephorte.PositionAnnouncementType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.PositionAnnouncementTypeTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalPositionAnnouncementTypes(bindingParameter: Ephorte.PositionAnnouncementType[]): Promise<Ephorte.PositionAnnouncementType> {
                return new Promise<Ephorte.PositionAnnouncementType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalPositionAnnouncementTypes()",
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
        export class PostalCodeEntitySet extends odatatools.EntitySet<Ephorte.PostalCode> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalPostalCodes(bindingParameter: Ephorte.PostalCode[]): Promise<Ephorte.PostalCode> {
                return new Promise<Ephorte.PostalCode>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalPostalCodes()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            PostalCodeTemplate(bindingParameter: Ephorte.PostalCode[]): Promise<Ephorte.PostalCode> {
                return new Promise<Ephorte.PostalCode>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.PostalCodeTemplate()",
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
        export class PrecedentEntitySet extends odatatools.EntitySet<Ephorte.Precedent> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class PrecedentReferenceEntitySet extends odatatools.EntitySet<Ephorte.PrecedentReference> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class PreviousMinutesOfMeetingEntitySet extends odatatools.EntitySet<Ephorte.PreviousMinutesOfMeeting> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalPreviousMinutesOfMeetings(bindingParameter: Ephorte.PreviousMinutesOfMeeting[]): Promise<Ephorte.PreviousMinutesOfMeeting> {
                return new Promise<Ephorte.PreviousMinutesOfMeeting>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalPreviousMinutesOfMeetings()",
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
        export class RoleProfileEntitySet extends odatatools.EntitySet<Ephorte.RoleProfile> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class ProjectEntitySet extends odatatools.EntitySet<Ephorte.Project> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalProjects(bindingParameter: Ephorte.Project[]): Promise<Ephorte.Project> {
                return new Promise<Ephorte.Project>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalProjects()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            ProjectTemplate(bindingParameter: Ephorte.Project[]): Promise<Ephorte.Project> {
                return new Promise<Ephorte.Project>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.ProjectTemplate()",
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
        export class AddressProviderEntitySet extends odatatools.EntitySet<Ephorte.AddressProvider> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class PredefinedQueryEntitySet extends odatatools.EntitySet<Ephorte.PredefinedQuery> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }





            // Bound to set Actions
            UnreadCountForPredefinedQueries(bindingParameter: Ephorte.PredefinedQuery[], PredefinedQueryIds: Edm.Int32[]): Promise<Ephorte.PredefinedQuery> {
                return new Promise<Ephorte.PredefinedQuery>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.UnreadCountForPredefinedQueries()",
                        data: {
                            PredefinedQueryIds: PredefinedQueryIds,
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
            CasesByCriteria(bindingParameter: Ephorte.PredefinedQuery[], Criterias: Ephorte.QueryCriteria[]): Promise<Ephorte.Case> {
                return new Promise<Ephorte.Case>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.CasesByCriteria()",
                        data: {
                            Criterias: Criterias,
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
            CasesByCriteriaCount(bindingParameter: Ephorte.PredefinedQuery[], Criterias: Ephorte.QueryCriteria[]): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.CasesByCriteriaCount()",
                        data: {
                            Criterias: Criterias,
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
            RegistryEntriesByCriteria(bindingParameter: Ephorte.PredefinedQuery[], Criterias: Ephorte.QueryCriteria[]): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.RegistryEntriesByCriteria()",
                        data: {
                            Criterias: Criterias,
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
            RegistryEntriesByCriteriaCount(bindingParameter: Ephorte.PredefinedQuery[], Criterias: Ephorte.QueryCriteria[]): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.RegistryEntriesByCriteriaCount()",
                        data: {
                            Criterias: Criterias,
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
            RegistryEntryDecisionsByCriteria(bindingParameter: Ephorte.PredefinedQuery[], Criterias: Ephorte.QueryCriteria[]): Promise<Ephorte.RegistryEntryDecision> {
                return new Promise<Ephorte.RegistryEntryDecision>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.RegistryEntryDecisionsByCriteria()",
                        data: {
                            Criterias: Criterias,
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
            RegistryEntryDecisionsByCriteriaCount(bindingParameter: Ephorte.PredefinedQuery[], Criterias: Ephorte.QueryCriteria[]): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.RegistryEntryDecisionsByCriteriaCount()",
                        data: {
                            Criterias: Criterias,
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
            TasksByCriteria(bindingParameter: Ephorte.PredefinedQuery[], Criterias: Ephorte.QueryCriteria[]): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.TasksByCriteria()",
                        data: {
                            Criterias: Criterias,
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
            TasksByCriteriaCount(bindingParameter: Ephorte.PredefinedQuery[], Criterias: Ephorte.QueryCriteria[]): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.TasksByCriteriaCount()",
                        data: {
                            Criterias: Criterias,
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

            // Bound to set Functions
            RootPredefinedQueries(bindingParameter: Ephorte.PredefinedQuery[]): Promise<Ephorte.PredefinedQuery> {
                return new Promise<Ephorte.PredefinedQuery>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.RootPredefinedQueries()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalPredefinedQueries(bindingParameter: Ephorte.PredefinedQuery[]): Promise<Ephorte.PredefinedQueryParentsTree> {
                return new Promise<Ephorte.PredefinedQueryParentsTree>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalPredefinedQueries()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            PredefinedQueryTemplate(bindingParameter: Ephorte.PredefinedQuery[], ParentId: Edm.Int32, ElementType: Edm.String, SeekType: Edm.String): Promise<Ephorte.PredefinedQuery> {
                return new Promise<Ephorte.PredefinedQuery>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.PredefinedQueryTemplate(ParentId=" + ParentId + ",ElementType=" + ElementType + ",SeekType=" + SeekType + ")",
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
        export class PredefinedQueryAggregationEntitySet extends odatatools.EntitySet<Ephorte.PredefinedQueryAggregation> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class QueryCriteriaEntitySet extends odatatools.EntitySet<Ephorte.QueryCriteria> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class RegistryEntryDispatchEntitySet extends odatatools.EntitySet<Ephorte.RegistryEntryDispatch> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class RecordStatusEntitySet extends odatatools.EntitySet<Ephorte.RecordStatus> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }





            // Bound to set Actions
            GetRecordStatusByNoarkStatus(bindingParameter: Ephorte.RecordStatus[], NoarkStatus: Edm.String): Promise<Ephorte.RecordStatus> {
                return new Promise<Ephorte.RecordStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.GetRecordStatusByNoarkStatus()",
                        data: {
                            NoarkStatus: NoarkStatus,
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

            // Bound to set Functions
            LegalRecordStatuses(bindingParameter: Ephorte.RecordStatus[]): Promise<Ephorte.RecordStatus> {
                return new Promise<Ephorte.RecordStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalRecordStatuses()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            RecordStatusTemplate(bindingParameter: Ephorte.RecordStatus[]): Promise<Ephorte.RecordStatus> {
                return new Promise<Ephorte.RecordStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.RecordStatusTemplate()",
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
        export class RegistryEntryEntitySet extends odatatools.EntitySet<Ephorte.RegistryEntry> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }

            // Bound to entity Actions
            MergeDocument(key: Edm.Int32, DocumentDescriptionId: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.MergeDocument()",
                        data: {
                            DocumentDescriptionId: DocumentDescriptionId,
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
            DepreciateRegistryEntry(key: Edm.Int32, FollowupMethod: Edm.String, Remark: Edm.String): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.DepreciateRegistryEntry()",
                        data: {
                            FollowupMethod: FollowupMethod,
                            Remark: Remark,
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
            RemoveFollowupFlag(key: Edm.Int32): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.RemoveFollowupFlag()",
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
            CreateCasePartyLetter(key: Edm.Int32, Content: Edm.String, AddCaseParties: Edm.Boolean): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.CreateCasePartyLetter()",
                        data: {
                            Content: Content,
                            AddCaseParties: AddCaseParties,
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
            CreateOverallDmbCasePresentationDocument(key: Edm.Int32, CaseId: Edm.Int32): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.CreateOverallDmbCasePresentationDocument()",
                        data: {
                            CaseId: CaseId,
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
            CopyRegistryEntryToCase(key: Edm.Int32, CopyRegistryEntryToCase: Edm.Int32, IncludeDocuments: Edm.Boolean): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.CopyRegistryEntryToCase()",
                        data: {
                            CopyRegistryEntryToCase: CopyRegistryEntryToCase,
                            IncludeDocuments: IncludeDocuments,
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
            AssignTo(key: Edm.Int32, CaseId: Edm.Int32, OfficerNameId: Edm.Int32, AdministrativeUnitId: Edm.Int32, SendEmail: Edm.Boolean, SendEmailToCopyRecipients: Edm.Boolean, CopyRecipientsIds: Edm.Int32[], Remark: Edm.String): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.AssignTo()",
                        data: {
                            CaseId: CaseId,
                            OfficerNameId: OfficerNameId,
                            AdministrativeUnitId: AdministrativeUnitId,
                            SendEmail: SendEmail,
                            SendEmailToCopyRecipients: SendEmailToCopyRecipients,
                            CopyRecipientsIds: CopyRecipientsIds,
                            Remark: Remark,
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
            SendByEmail(key: Edm.Int32, updateRegistryEntryStatus: Edm.Boolean, includeDocuments: Edm.Boolean, sendEmail: Edm.Boolean, senderRecipientIds: Edm.Int32[]): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.SendByEmail()",
                        data: {
                            updateRegistryEntryStatus: updateRegistryEntryStatus,
                            includeDocuments: includeDocuments,
                            sendEmail: sendEmail,
                            senderRecipientIds: senderRecipientIds,
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
            SendToDigitalMailBox(key: Edm.Int32): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.SendToDigitalMailBox()",
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
            MarkAsRead(key: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.MarkAsRead()",
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
            CloneRegistryEntryApplication(key: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.CloneRegistryEntryApplication()",
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
            MarkAsUnRead(key: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.MarkAsUnRead()",
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
            TaskFromTemplate(key: Edm.Int32, TaskTemplateId: Edm.Int32): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.TaskFromTemplate()",
                        data: {
                            TaskTemplateId: TaskTemplateId,
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
            SendToRoundOfApproval(key: Edm.Int32, Recipients: Ephorte.CaseWorkerKey[], DueDate: Edm.Date, Title: Edm.String, TaskHandlingSequenceId: Edm.String): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.SendToRoundOfApproval()",
                        data: {
                            Recipients: Recipients,
                            DueDate: DueDate,
                            Title: Title,
                            TaskHandlingSequenceId: TaskHandlingSequenceId,
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
            SendToRoundOfComments(key: Edm.Int32, Recipients: Ephorte.CaseWorkerKey[], DueDate: Edm.Date, Title: Edm.String, TaskHandlingSequenceId: Edm.String): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.SendToRoundOfComments()",
                        data: {
                            Recipients: Recipients,
                            DueDate: DueDate,
                            Title: Title,
                            TaskHandlingSequenceId: TaskHandlingSequenceId,
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
            NotifyRegistryEntryChanged(key: Edm.Int32, SignalrConnectionId: Edm.String): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.NotifyRegistryEntryChanged()",
                        data: {
                            SignalrConnectionId: SignalrConnectionId,
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
            Approve(key: Edm.Int32, NotifyByEmail: Edm.Boolean, Remark: Edm.String): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.Approve()",
                        data: {
                            NotifyByEmail: NotifyByEmail,
                            Remark: Remark,
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
            Reject(key: Edm.Int32, NotifyByEmail: Edm.Boolean, Remark: Edm.String): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.Reject()",
                        data: {
                            NotifyByEmail: NotifyByEmail,
                            Remark: Remark,
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
            CopyRegistryEntry(key: Edm.Int32): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.CopyRegistryEntry()",
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
            RecallFollowUpFlag(key: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.RecallFollowUpFlag()",
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
            MoveToCase(key: Edm.Int32, ToCaseId: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.MoveToCase()",
                        data: {
                            ToCaseId: ToCaseId,
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
            ReferAsReplyTo(key: Edm.Int32, RegistryEntryIds: Edm.Int32[], ModeOfDepreciation: Edm.String): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.ReferAsReplyTo()",
                        data: {
                            RegistryEntryIds: RegistryEntryIds,
                            ModeOfDepreciation: ModeOfDepreciation,
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
            ConvertDocumentToPdf(key: Edm.Int32, DocumentDescriptionId: Edm.Int32, VariantFormatId: Edm.String, VersionNumber: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.ConvertDocumentToPdf()",
                        data: {
                            DocumentDescriptionId: DocumentDescriptionId,
                            VariantFormatId: VariantFormatId,
                            VersionNumber: VersionNumber,
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
            CreateNotification(key: Edm.Int32, Title: Edm.String, Notification: Ephorte.Notification): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.CreateNotification()",
                        data: {
                            Title: Title,
                            Notification: Notification,
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
            GetNotification(bindingParameter: Ephorte.RegistryEntry, UserId: Edm.Int32): Promise<Ephorte.Notification> {
                return new Promise<Ephorte.Notification>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.GetNotification(UserId=" + UserId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            RecipientTemplate(bindingParameter: Ephorte.RegistryEntry): Promise<Ephorte.SenderRecipient> {
                return new Promise<Ephorte.SenderRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.RecipientTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AssignToRecipient(bindingParameter: Ephorte.RegistryEntry): Promise<Ephorte.SenderRecipient> {
                return new Promise<Ephorte.SenderRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.AssignToRecipient()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AssignedToUnitRecipient(bindingParameter: Ephorte.RegistryEntry): Promise<Ephorte.SenderRecipient> {
                return new Promise<Ephorte.SenderRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.AssignedToUnitRecipient()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            SenderTemplate(bindingParameter: Ephorte.RegistryEntry): Promise<Ephorte.SenderRecipient> {
                return new Promise<Ephorte.SenderRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.SenderTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            RemarkTemplate(bindingParameter: Ephorte.RegistryEntry): Promise<Ephorte.Remark> {
                return new Promise<Ephorte.Remark>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.RemarkTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            DmbHandlingTemplate(bindingParameter: Ephorte.RegistryEntry): Promise<Ephorte.DMBHandling> {
                return new Promise<Ephorte.DMBHandling>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.DmbHandlingTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            ClassificationTemplate(bindingParameter: Ephorte.RegistryEntry): Promise<Ephorte.RegistryEntryClassification> {
                return new Promise<Ephorte.RegistryEntryClassification>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.ClassificationTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LinkTemplate(bindingParameter: Ephorte.RegistryEntry, LinkTypeId: Edm.String): Promise<Ephorte.LinkFromRegistryEntry> {
                return new Promise<Ephorte.LinkFromRegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.LinkTemplate(LinkTypeId=" + LinkTypeId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            RegistryEntryDecisionTemplate(bindingParameter: Ephorte.RegistryEntry): Promise<Ephorte.RegistryEntryDecision> {
                return new Promise<Ephorte.RegistryEntryDecision>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.RegistryEntryDecisionTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            ReplyTemplate(bindingParameter: Ephorte.RegistryEntry): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.ReplyTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            ReplyRecipientsTemplate(bindingParameter: Ephorte.RegistryEntry): Promise<Ephorte.SenderRecipient> {
                return new Promise<Ephorte.SenderRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.ReplyRecipientsTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalTaskTemplates(bindingParameter: Ephorte.RegistryEntry): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.LegalTaskTemplates()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            GeneralConditionsTemplate(bindingParameter: Ephorte.RegistryEntry): Promise<Ephorte.GeneralConditions> {
                return new Promise<Ephorte.GeneralConditions>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.GeneralConditionsTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            ApplicationDocuments(bindingParameter: Ephorte.RegistryEntry): Promise<Ephorte.RegistryEntryDocument> {
                return new Promise<Ephorte.RegistryEntryDocument>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.ApplicationDocuments()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AllTasks(bindingParameter: Ephorte.RegistryEntry): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.AllTasks()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalValuesRecordStatusByRegistryEntryId(bindingParameter: Ephorte.RegistryEntry): Promise<Ephorte.RecordStatus> {
                return new Promise<Ephorte.RecordStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.LegalValuesRecordStatusByRegistryEntryId()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            TaskTemplate(bindingParameter: Ephorte.RegistryEntry, TaskTypeId: Edm.String): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.TaskTemplate(TaskTypeId=" + TaskTypeId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            BuildingApplicationInitiativeTemplate(bindingParameter: Ephorte.RegistryEntry): Promise<Ephorte.BuildingApplicationInitiative> {
                return new Promise<Ephorte.BuildingApplicationInitiative>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.BuildingApplicationInitiativeTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }

            // Bound to set Actions
            ReplyMultipleRecipientsTemplate(bindingParameter: Ephorte.RegistryEntry[], RegistryEntryIds: Edm.Int32[]): Promise<Ephorte.SenderRecipient> {
                return new Promise<Ephorte.SenderRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.ReplyMultipleRecipientsTemplate()",
                        data: {
                            RegistryEntryIds: RegistryEntryIds,
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
            ReplyMultipleRegistryEntries(bindingParameter: Ephorte.RegistryEntry[], RegistryEntryIds: Edm.Int32[], ReplyRegistryEntry: Ephorte.RegistryEntry): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.ReplyMultipleRegistryEntries()",
                        data: {
                            RegistryEntryIds: RegistryEntryIds,
                            ReplyRegistryEntry: ReplyRegistryEntry,
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
            SetPublishFlag(bindingParameter: Ephorte.RegistryEntry[], RegistryEntryIds: Edm.Int32[], Flag: Edm.Boolean): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.SetPublishFlag()",
                        data: {
                            RegistryEntryIds: RegistryEntryIds,
                            Flag: Flag,
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
            SetStatus(bindingParameter: Ephorte.RegistryEntry[], RegistryEntryIds: Edm.Int32[], Status: Edm.String): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.SetStatus()",
                        data: {
                            RegistryEntryIds: RegistryEntryIds,
                            Status: Status,
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

            // Bound to set Functions
            RegistryEntryTemplate(bindingParameter: Ephorte.RegistryEntry[], RegistryEntryTypeId: Edm.String): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.RegistryEntryTemplate(RegistryEntryTypeId=" + RegistryEntryTypeId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalRegistryEntries(bindingParameter: Ephorte.RegistryEntry[]): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalRegistryEntries()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalValuesRecordStatusByRegistryEntryTypeId(bindingParameter: Ephorte.RegistryEntry[], RegistryEntryTypeId: Edm.String): Promise<Ephorte.RecordStatus> {
                return new Promise<Ephorte.RecordStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalValuesRecordStatusByRegistryEntryTypeId(RegistryEntryTypeId=" + RegistryEntryTypeId + ")",
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
        export class RegistryEntryPermissionsEntitySet extends odatatools.EntitySet<Ephorte.RegistryEntryPermissions> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class RegistryEntryReadStatusEntitySet extends odatatools.EntitySet<Ephorte.RegistryEntryReadStatus> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class CaseWorkerRegistryEntryEntitySet extends odatatools.EntitySet<Ephorte.CaseWorkerRegistryEntry> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class RegistryEntryTasksAggregationEntitySet extends odatatools.EntitySet<Ephorte.RegistryEntryTasksAggregation> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class RegistryEntryRegistrationEntitySet extends odatatools.EntitySet<Ephorte.RegistryEntryRegistration> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class RegistryEntryClassificationEntitySet extends odatatools.EntitySet<Ephorte.RegistryEntryClassification> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class RegistryEntryDecisionEntitySet extends odatatools.EntitySet<Ephorte.RegistryEntryDecision> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class CaseWorkerRegistryEntryDecisionEntitySet extends odatatools.EntitySet<Ephorte.CaseWorkerRegistryEntryDecision> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class RegistryEntryDocumentEntitySet extends odatatools.EntitySet<Ephorte.RegistryEntryDocument> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }

            // Bound to entity Actions
            MarkAsCompleted(key: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.MarkAsCompleted()",
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
            SendDocumentForApproval(key: Edm.Int32, CaseWorkerId: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.SendDocumentForApproval()",
                        data: {
                            CaseWorkerId: CaseWorkerId,
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
            ReplaceByDocument(key: Edm.Int32, ReplaceByDocumentDescriptionId: Edm.Int32): Promise<Ephorte.RegistryEntryDocument> {
                return new Promise<Ephorte.RegistryEntryDocument>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.ReplaceByDocument()",
                        data: {
                            ReplaceByDocumentDescriptionId: ReplaceByDocumentDescriptionId,
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
            SetDocumentRevision(key: Edm.Int32, ReplacedByRegistryEntryId: Edm.Int32, ReplacedByDocumentDescriptionId: Edm.Int32): Promise<Ephorte.RegistryEntryDocument> {
                return new Promise<Ephorte.RegistryEntryDocument>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.SetDocumentRevision()",
                        data: {
                            ReplacedByRegistryEntryId: ReplacedByRegistryEntryId,
                            ReplacedByDocumentDescriptionId: ReplacedByDocumentDescriptionId,
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
            ResetDocumentRevision(key: Edm.Int32, ReplacedByRegistryEntryId: Edm.Int32, ReplacedByDocumentDescriptionId: Edm.Int32): Promise<Ephorte.RegistryEntryDocument> {
                return new Promise<Ephorte.RegistryEntryDocument>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.ResetDocumentRevision()",
                        data: {
                            ReplacedByRegistryEntryId: ReplacedByRegistryEntryId,
                            ReplacedByDocumentDescriptionId: ReplacedByDocumentDescriptionId,
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
            MarkAsMainDocument(key: Edm.Int32): Promise<Ephorte.RegistryEntryDocument> {
                return new Promise<Ephorte.RegistryEntryDocument>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.MarkAsMainDocument()",
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

            // Bound to entity Functions
            LegalDocumentRevisions(bindingParameter: Ephorte.RegistryEntryDocument): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.LegalDocumentRevisions()",
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
        export class RegistryEntryDocumentPermissionsEntitySet extends odatatools.EntitySet<Ephorte.RegistryEntryDocumentPermissions> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class LinkFromRegistryEntryEntitySet extends odatatools.EntitySet<Ephorte.LinkFromRegistryEntry> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class RegistryEntryReadEntitySet extends odatatools.EntitySet<Ephorte.RegistryEntryRead> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class RegistryEntryTypeEntitySet extends odatatools.EntitySet<Ephorte.RegistryEntryType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalRegistryEntryTypes(bindingParameter: Ephorte.RegistryEntryType[]): Promise<Ephorte.RegistryEntryType> {
                return new Promise<Ephorte.RegistryEntryType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalRegistryEntryTypes()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            RegistryEntryTypeTemplate(bindingParameter: Ephorte.RegistryEntryType[]): Promise<Ephorte.RegistryEntryType> {
                return new Promise<Ephorte.RegistryEntryType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.RegistryEntryTypeTemplate()",
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
        export class RegistryManagementUnitEntitySet extends odatatools.EntitySet<Ephorte.RegistryManagementUnit> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalRegistryEntryManagementUnits(bindingParameter: Ephorte.RegistryManagementUnit[]): Promise<Ephorte.RegistryManagementUnit> {
                return new Promise<Ephorte.RegistryManagementUnit>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalRegistryEntryManagementUnits()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            SeriesTemplate(bindingParameter: Ephorte.RegistryManagementUnit[]): Promise<Ephorte.Series> {
                return new Promise<Ephorte.Series>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.SeriesTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            RegistryManagementUnitTemplate(bindingParameter: Ephorte.RegistryManagementUnit[]): Promise<Ephorte.RegistryManagementUnit> {
                return new Promise<Ephorte.RegistryManagementUnit>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.RegistryManagementUnitTemplate()",
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
        export class RemarkEntitySet extends odatatools.EntitySet<Ephorte.Remark> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class RemoteStorageCodeEntitySet extends odatatools.EntitySet<Ephorte.RemoteStorageCode> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalRemoteStorageCodes(bindingParameter: Ephorte.RemoteStorageCode[]): Promise<Ephorte.RemoteStorageCode> {
                return new Promise<Ephorte.RemoteStorageCode>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalRemoteStorageCodes()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            RemoteStorageCodeTemplate(bindingParameter: Ephorte.RemoteStorageCode[]): Promise<Ephorte.RemoteStorageCode> {
                return new Promise<Ephorte.RemoteStorageCode>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.RemoteStorageCodeTemplate()",
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
        export class RoleEntitySet extends odatatools.EntitySet<Ephorte.Role> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalRoles(bindingParameter: Ephorte.Role[]): Promise<Ephorte.Role> {
                return new Promise<Ephorte.Role>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalRoles()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            RoleTemplate(bindingParameter: Ephorte.Role[]): Promise<Ephorte.Role> {
                return new Promise<Ephorte.Role>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.RoleTemplate()",
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
        export class SchemaEntitySet extends odatatools.EntitySet<Ephorte.Schema> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            SchemaTemplate(bindingParameter: Ephorte.Schema[]): Promise<Ephorte.Schema> {
                return new Promise<Ephorte.Schema>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.SchemaTemplate()",
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
        export class SendingMethodEntitySet extends odatatools.EntitySet<Ephorte.SendingMethod> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalSendingMethods(bindingParameter: Ephorte.SendingMethod[]): Promise<Ephorte.SendingMethod> {
                return new Promise<Ephorte.SendingMethod>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalSendingMethods()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            SendingMethodTemplate(bindingParameter: Ephorte.SendingMethod[]): Promise<Ephorte.SendingMethod> {
                return new Promise<Ephorte.SendingMethod>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.SendingMethodTemplate()",
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
        export class SendingStatusEntitySet extends odatatools.EntitySet<Ephorte.SendingStatus> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalSendingStatuses(bindingParameter: Ephorte.SendingStatus[]): Promise<Ephorte.SendingStatus> {
                return new Promise<Ephorte.SendingStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalSendingStatuses()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            SendingStatusTemplate(bindingParameter: Ephorte.SendingStatus[]): Promise<Ephorte.SendingStatus> {
                return new Promise<Ephorte.SendingStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.SendingStatusTemplate()",
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
        export class SeriesEntitySet extends odatatools.EntitySet<Ephorte.Series> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalSeries(bindingParameter: Ephorte.Series[]): Promise<Ephorte.Series> {
                return new Promise<Ephorte.Series>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalSeries()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalSeriesLinks(bindingParameter: Ephorte.Series[]): Promise<Ephorte.SeriesLink> {
                return new Promise<Ephorte.SeriesLink>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalSeriesLinks()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            SeriesTemplate(bindingParameter: Ephorte.Series[]): Promise<Ephorte.Series> {
                return new Promise<Ephorte.Series>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.SeriesTemplate()",
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
        export class StatusMeetingDocumentEntitySet extends odatatools.EntitySet<Ephorte.StatusMeetingDocument> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            StatusMeetingDocumentTemplate(bindingParameter: Ephorte.StatusMeetingDocument[]): Promise<Ephorte.StatusMeetingDocument> {
                return new Promise<Ephorte.StatusMeetingDocument>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.StatusMeetingDocumentTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalStatusMeetingDocuments(bindingParameter: Ephorte.StatusMeetingDocument[]): Promise<Ephorte.StatusMeetingDocument> {
                return new Promise<Ephorte.StatusMeetingDocument>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalStatusMeetingDocuments()",
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
        export class StatutoryAutorityEntitySet extends odatatools.EntitySet<Ephorte.StatutoryAutority> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            StatutoryAutorityTemplate(bindingParameter: Ephorte.StatutoryAutority[]): Promise<Ephorte.StatutoryAutority> {
                return new Promise<Ephorte.StatutoryAutority>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.StatutoryAutorityTemplate()",
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
        export class StorageUnitEntitySet extends odatatools.EntitySet<Ephorte.StorageUnit> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalStorageUnits(bindingParameter: Ephorte.StorageUnit[]): Promise<Ephorte.StorageUnit> {
                return new Promise<Ephorte.StorageUnit>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalStorageUnits()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            StorageUnitTemplate(bindingParameter: Ephorte.StorageUnit[]): Promise<Ephorte.StorageUnit> {
                return new Promise<Ephorte.StorageUnit>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.StorageUnitTemplate()",
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
        export class SubdivisionApplicationEntitySet extends odatatools.EntitySet<Ephorte.SubdivisionApplication> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class SubdivisionConferenceEntitySet extends odatatools.EntitySet<Ephorte.SubdivisionConference> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class TaskEntitySet extends odatatools.EntitySet<Ephorte.Task> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }

            // Bound to entity Actions
            ExecuteCheckpoint(key: Edm.Int32, TaskDecisionCodeId: Edm.String, Remark: Edm.String): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.ExecuteCheckpoint()",
                        data: {
                            TaskDecisionCodeId: TaskDecisionCodeId,
                            Remark: Remark,
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
            OD(key: Edm.Int32): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.OD()",
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
            ODS(key: Edm.Int32): Promise<Ephorte.RegistryEntry> {
                return new Promise<Ephorte.RegistryEntry>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.ODS()",
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
            ODSRecipients(key: Edm.Int32): Promise<Ephorte.SenderRecipient> {
                return new Promise<Ephorte.SenderRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.ODSRecipients()",
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
            ApplyChecklist(key: Edm.Int32, ChecklistId: Edm.Int32): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.ApplyChecklist()",
                        data: {
                            ChecklistId: ChecklistId,
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
            ReactivateTask(key: Edm.Int32): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.ReactivateTask()",
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
            MoveTask(key: Edm.Int32, AfterMovePreviousTaskId: Edm.Int32): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.MoveTask()",
                        data: {
                            AfterMovePreviousTaskId: AfterMovePreviousTaskId,
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
            UpdateNationalChecklist(key: Edm.Int32): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.UpdateNationalChecklist()",
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
            RefreshChecklist(key: Edm.Int32, ChecklistId: Edm.Int32): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "(" + key + ")/Ephorte.RefreshChecklist()",
                        data: {
                            ChecklistId: ChecklistId,
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
            DuplicateTemplate(bindingParameter: Ephorte.Task): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.DuplicateTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            TaskRecipientTemplate(bindingParameter: Ephorte.Task): Promise<Ephorte.TaskRecipient> {
                return new Promise<Ephorte.TaskRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.TaskRecipientTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            TaskTemplate(bindingParameter: Ephorte.Task, TaskTypeId: Edm.String): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.TaskTemplate(TaskTypeId=" + TaskTypeId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AllTasks(bindingParameter: Ephorte.Task): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.AllTasks()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AllTasksTaskDocuments(bindingParameter: Ephorte.Task): Promise<Ephorte.TaskDocument> {
                return new Promise<Ephorte.TaskDocument>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.AllTasksTaskDocuments()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }

            // Bound to set Actions
            CaseTaskTemplate(bindingParameter: Ephorte.Task[], Task: Ephorte.Task): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.CaseTaskTemplate()",
                        data: {
                            Task: Task,
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
            RegistryEntryTaskTemplate(bindingParameter: Ephorte.Task[], Task: Ephorte.Task): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "POST",
                        requestUri: this._odataServiceAddress + "/Ephorte.RegistryEntryTaskTemplate()",
                        data: {
                            Task: Task,
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

            // Bound to set Functions
            LegalTaskTemplates(bindingParameter: Ephorte.Task[]): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalTaskTemplates()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalChecklists(bindingParameter: Ephorte.Task[]): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalChecklists()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalSubWorkflows(bindingParameter: Ephorte.Task[]): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalSubWorkflows()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalTaskFunctions(bindingParameter: Ephorte.Task[]): Promise<Ephorte.TaskFunction> {
                return new Promise<Ephorte.TaskFunction>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalTaskFunctions()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            TemplateTaskTemplate(bindingParameter: Ephorte.Task[], TaskTypeId: Edm.String): Promise<Ephorte.Task> {
                return new Promise<Ephorte.Task>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.TemplateTaskTemplate(TaskTypeId=" + TaskTypeId + ")",
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
        export class CaseWorkerTaskEntitySet extends odatatools.EntitySet<Ephorte.CaseWorkerTask> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class TaskAlertCodeEntitySet extends odatatools.EntitySet<Ephorte.TaskAlertCode> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            TaskAlertCodeTemplate(bindingParameter: Ephorte.TaskAlertCode[]): Promise<Ephorte.TaskAlertCode> {
                return new Promise<Ephorte.TaskAlertCode>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.TaskAlertCodeTemplate()",
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
        export class TaskBranchRootEntitySet extends odatatools.EntitySet<Ephorte.TaskBranchRoot> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class TaskDecisionCodeEntitySet extends odatatools.EntitySet<Ephorte.TaskDecisionCode> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalTaskDecisionCodes(bindingParameter: Ephorte.TaskDecisionCode[]): Promise<Ephorte.TaskDecisionCode> {
                return new Promise<Ephorte.TaskDecisionCode>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalTaskDecisionCodes()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            TaskDecisionCodeTemplate(bindingParameter: Ephorte.TaskDecisionCode[]): Promise<Ephorte.TaskDecisionCode> {
                return new Promise<Ephorte.TaskDecisionCode>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.TaskDecisionCodeTemplate()",
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
        export class TaskHandlingSequenceEntitySet extends odatatools.EntitySet<Ephorte.TaskHandlingSequence> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            TaskHandlingSequenceTemplate(bindingParameter: Ephorte.TaskHandlingSequence[]): Promise<Ephorte.TaskHandlingSequence> {
                return new Promise<Ephorte.TaskHandlingSequence>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.TaskHandlingSequenceTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalTaskHandlingSequences(bindingParameter: Ephorte.TaskHandlingSequence[]): Promise<Ephorte.TaskHandlingSequence> {
                return new Promise<Ephorte.TaskHandlingSequence>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalTaskHandlingSequences()",
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
        export class TaskPriorityEntitySet extends odatatools.EntitySet<Ephorte.TaskPriority> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalTaskPriorities(bindingParameter: Ephorte.TaskPriority[]): Promise<Ephorte.TaskPriority> {
                return new Promise<Ephorte.TaskPriority>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalTaskPriorities()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            TaskPriorityTemplate(bindingParameter: Ephorte.TaskPriority[]): Promise<Ephorte.TaskPriority> {
                return new Promise<Ephorte.TaskPriority>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.TaskPriorityTemplate()",
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
        export class TaskRecipientEntitySet extends odatatools.EntitySet<Ephorte.TaskRecipient> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalTaskRecipients(bindingParameter: Ephorte.TaskRecipient[]): Promise<Ephorte.TaskRecipient> {
                return new Promise<Ephorte.TaskRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalTaskRecipients()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalInternalTaskRecipients(bindingParameter: Ephorte.TaskRecipient[]): Promise<Ephorte.TaskRecipient> {
                return new Promise<Ephorte.TaskRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalInternalTaskRecipients()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalExternalTaskRecipients(bindingParameter: Ephorte.TaskRecipient[]): Promise<Ephorte.TaskRecipient> {
                return new Promise<Ephorte.TaskRecipient>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalExternalTaskRecipients()",
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
        export class CaseWorkerTaskRecipientEntitySet extends odatatools.EntitySet<Ephorte.CaseWorkerTaskRecipient> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class TaskReportCategoryEntitySet extends odatatools.EntitySet<Ephorte.TaskReportCategory> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalTaskReportCategories(bindingParameter: Ephorte.TaskReportCategory[]): Promise<Ephorte.TaskReportCategory> {
                return new Promise<Ephorte.TaskReportCategory>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalTaskReportCategories()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            TaskReportCategoryTemplate(bindingParameter: Ephorte.TaskReportCategory[]): Promise<Ephorte.TaskReportCategory> {
                return new Promise<Ephorte.TaskReportCategory>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.TaskReportCategoryTemplate()",
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
        export class TaskStatusEntitySet extends odatatools.EntitySet<Ephorte.TaskStatus> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalTaskStatuses(bindingParameter: Ephorte.TaskStatus[]): Promise<Ephorte.TaskStatus> {
                return new Promise<Ephorte.TaskStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalTaskStatuses()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            TaskStatusTemplate(bindingParameter: Ephorte.TaskStatus[]): Promise<Ephorte.TaskStatus> {
                return new Promise<Ephorte.TaskStatus>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.TaskStatusTemplate()",
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
        export class TaskTypeEntitySet extends odatatools.EntitySet<Ephorte.TaskType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            TaskTypeTemplate(bindingParameter: Ephorte.TaskType[]): Promise<Ephorte.TaskType> {
                return new Promise<Ephorte.TaskType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.TaskTypeTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalTaskTypes(bindingParameter: Ephorte.TaskType[]): Promise<Ephorte.TaskType> {
                return new Promise<Ephorte.TaskType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalTaskTypes()",
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
        export class UnitTypeEntitySet extends odatatools.EntitySet<Ephorte.UnitType> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalUnitTypes(bindingParameter: Ephorte.UnitType[]): Promise<Ephorte.UnitType> {
                return new Promise<Ephorte.UnitType>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalUnitTypes()",
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
        export class UserEntitySet extends odatatools.EntitySet<Ephorte.User> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }



            // Bound to entity Functions
            OnBehalfOfsTemplate(bindingParameter: Ephorte.User): Promise<Ephorte.OnBehalfOf> {
                return new Promise<Ephorte.OnBehalfOf>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.OnBehalfOfsTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            UserAddressTemplate(bindingParameter: Ephorte.User): Promise<Ephorte.UserAddress> {
                return new Promise<Ephorte.UserAddress>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.UserAddressTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            UserRoleTemplate(bindingParameter: Ephorte.User): Promise<Ephorte.UserRole> {
                return new Promise<Ephorte.UserRole>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.UserRoleTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            UserNameTemplate(bindingParameter: Ephorte.User): Promise<Ephorte.UserName> {
                return new Promise<Ephorte.UserName>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.UserNameTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AuthorizationTemplate(bindingParameter: Ephorte.User): Promise<Ephorte.Authorization> {
                return new Promise<Ephorte.Authorization>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.AuthorizationTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AdditionalLoginTemplate(bindingParameter: Ephorte.User): Promise<Ephorte.AdditionalLogin> {
                return new Promise<Ephorte.AdditionalLogin>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.AdditionalLoginTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            AccessGroupMembershipTemplate(bindingParameter: Ephorte.User, AccessGroupId: Edm.Int32): Promise<Ephorte.AccessGroupMembership> {
                return new Promise<Ephorte.AccessGroupMembership>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "(" + bindingParameter + ")/Ephorte.AccessGroupMembershipTemplate(AccessGroupId=" + AccessGroupId + ")",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }



            // Bound to set Functions
            UserTemplate(bindingParameter: Ephorte.User[]): Promise<Ephorte.User> {
                return new Promise<Ephorte.User>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.UserTemplate()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            LegalUsers(bindingParameter: Ephorte.User[], AdministrativeUnitId: Edm.Int32): Promise<Ephorte.User> {
                return new Promise<Ephorte.User>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalUsers(AdministrativeUnitId=" + AdministrativeUnitId + ")",
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
        export class UserAddressEntitySet extends odatatools.EntitySet<Ephorte.UserAddress> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class UserNameEntitySet extends odatatools.EntitySet<Ephorte.UserName> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalUserNames(bindingParameter: Ephorte.UserName[], AdministrativeUnitId: Edm.Int32): Promise<Ephorte.UserName> {
                return new Promise<Ephorte.UserName>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalUserNames(AdministrativeUnitId=" + AdministrativeUnitId + ")",
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
        export class UserRoleEntitySet extends odatatools.EntitySet<Ephorte.UserRole> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalUserRoles(bindingParameter: Ephorte.UserRole[]): Promise<Ephorte.UserRole> {
                return new Promise<Ephorte.UserRole>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalUserRoles()",
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
        export class VariantFormatEntitySet extends odatatools.EntitySet<Ephorte.VariantFormat> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            LegalVariantFormats(bindingParameter: Ephorte.VariantFormat[]): Promise<Ephorte.VariantFormat> {
                return new Promise<Ephorte.VariantFormat>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.LegalVariantFormats()",
                    }
                    odatajs.oData.request(request, (data, response) => {
                        resolve(data.value || data);
                    }, (error) => {
                        console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                        reject(error);
                    });
                });
            }
            VariantFormatTemplate(bindingParameter: Ephorte.VariantFormat[]): Promise<Ephorte.VariantFormat> {
                return new Promise<Ephorte.VariantFormat>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.VariantFormatTemplate()",
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
        export class ZoningCodeEntitySet extends odatatools.EntitySet<Ephorte.ZoningCode> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }







            // Bound to set Functions
            ZoningCodeTemplate(bindingParameter: Ephorte.ZoningCode[]): Promise<Ephorte.ZoningCode> {
                return new Promise<Ephorte.ZoningCode>((resolve, reject) => {
                    let request: odatajs.Request = {
                        headers: this.Headers,
                        method: "GET",
                        requestUri: this._odataServiceAddress + "/Ephorte.ZoningCodeTemplate()",
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
        export class ZoningCodesEntitySet extends odatatools.EntitySet<Ephorte.ZoningCodes> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class DmbMemberAggregateEntitySet extends odatatools.EntitySet<Ephorte.DmbMemberAggregate> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class UserAddressAggregateEntitySet extends odatatools.EntitySet<Ephorte.UserAddressAggregate> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
        export class GeographicalObjectEntitySet extends odatatools.EntitySet<Ephorte.GeographicalObject> {
            constructor(name: string, address: string, key: string, additionalHeaders?: odatajs.Header) {
                super(name, address, key, additionalHeaders);
            }








        }
    }


    namespace Ephorte.DOM.Model {

        // Entity types
        export interface LinkFrom {
            Id: Edm.Int32;
            Description: Edm.String;
            LinkUrl: Edm.String;
            LinkTypeId: Edm.String;
            SortOrder: Edm.String;
            AccessCodeId: Edm.String;
            IsRestricted: Edm.Boolean;
            Bidirectional: Edm.Boolean;
            CreatedDate: Edm.DateTimeOffset;
            CreatedByUserNameId: Edm.Int32;
            LastUpdated: Edm.DateTimeOffset;
            LastUpdatedByUserNameId: Edm.Int32;
            ChangeId: Edm.Int64;
            SystemId: Edm.Guid;
            LastUpdatedByExternalSystem: Edm.String;
            CreatedByExternalSystem: Edm.String;
            Operation: Ephorte.Operation;
            LinkType?: Ephorte.LinkType;
            AccessCode?: Ephorte.AccessCode;
            CreatedByUserName?: Ephorte.UserName;
            LastUpdatedByUserName?: Ephorte.UserName;
            TargetCase?: Ephorte.Case;
            TargetRegistryEntry?: Ephorte.RegistryEntry;
            TargetDocumentDescription?: Ephorte.DocumentDescription;
            FormFields?: Ephorte.FormFieldMetadata[];
            ValueLists?: Ephorte.ValueList[];
            Permissions?: Ephorte.Permissions;

        }
        export interface CaseWorkerWorkItem extends Ephorte.CaseWorker {

        }

        // Complex types
        export interface DateRange {
            Start: Edm.DateTimeOffset;
            End: Edm.DateTimeOffset;

        }
        export interface UploadImportDocumentResult {
            UploadIdentifier: Edm.String;
            EncodedUploadIdentifier: Edm.String;

        }
        export interface CasePartyLetterTemplateData {
            CaseDraftRegistryEntryId: Edm.Int32;
            CasePartyLetterContent: Edm.String;
            BookmarkName: Edm.String;
            SortHandlingsChronological: Edm.Boolean;

        }

        // Enum Types
        // Enum Values: Uppercase = 0, Date = 1, Html = 2, Time = 3, Password = 4, Barcode = 5, UnitNumber = 6, Unknown = 7
        export type FieldFormatEnum = "Uppercase" | "Date" | "Html" | "Time" | "Password" | "Barcode" | "UnitNumber" | "Unknown";

        // Entity container
        //EntitySets
    }


    namespace Ephorte.DOM {

        // Entity types

        // Complex types
        export interface OperationResult {
            DummyKey: Edm.Int32;
            IsSuccess: Edm.Boolean;
            OperationDataList: Ephorte.DOM.OperationData[];

        }
        export interface OperationData {
            DummyKey: Edm.Int32;
            Operation: Edm.String;
            Message: Edm.String;
            IsSuccess: Edm.Boolean;

        }

        // Enum Types
        // Enum Values: NoarkSak = 0, JournPost = 1, DokBeskriv = 2, NotAssigned = -1
        export type LinkObjectTypeEnum = "NoarkSak" | "JournPost" | "DokBeskriv" | "NotAssigned";

        // Entity container
        //EntitySets
    }

}