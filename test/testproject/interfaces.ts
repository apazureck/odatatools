namespace NorthwindModel {
    export interface Category {
        CategoryID: Edm.Int32;
        CategoryName: Edm.String;
        Description?: Edm.String;
        Picture?: Edm.Binary;
        Products?: NorthwindModel.Product[];
    }
    export interface CustomerDemographic {
        CustomerTypeID: Edm.String;
        CustomerDesc?: Edm.String;
        Customers?: NorthwindModel.Customer[];
    }
    export interface Customer {
        CustomerID: Edm.String;
        CompanyName: Edm.String;
        ContactName?: Edm.String;
        ContactTitle?: Edm.String;
        Address?: Edm.String;
        City?: Edm.String;
        Region?: Edm.String;
        PostalCode?: Edm.String;
        Country?: Edm.String;
        Phone?: Edm.String;
        Fax?: Edm.String;
        Orders?: NorthwindModel.Order[];
        CustomerDemographics?: NorthwindModel.CustomerDemographic[];
    }
    export interface Employee {
        EmployeeID: Edm.Int32;
        LastName: Edm.String;
        FirstName: Edm.String;
        Title?: Edm.String;
        TitleOfCourtesy?: Edm.String;
        BirthDate?: Edm.DateTimeOffset;
        HireDate?: Edm.DateTimeOffset;
        Address?: Edm.String;
        City?: Edm.String;
        Region?: Edm.String;
        PostalCode?: Edm.String;
        Country?: Edm.String;
        HomePhone?: Edm.String;
        Extension?: Edm.String;
        Photo?: Edm.Binary;
        Notes?: Edm.String;
        ReportsTo?: Edm.Int32;
        PhotoPath?: Edm.String;
        Employees1?: NorthwindModel.Employee[];
        Employee1?: NorthwindModel.Employee;
        Orders?: NorthwindModel.Order[];
        Territories?: NorthwindModel.Territory[];
    }
    export interface Order_Detail {
        OrderID: Edm.Int32;
        ProductID: Edm.Int32;
        UnitPrice: Edm.Decimal;
        Quantity: Edm.Int16;
        Discount: Edm.Single;
        Order: NorthwindModel.Order;
        Product: NorthwindModel.Product;
    }
    export interface Order {
        OrderID: Edm.Int32;
        CustomerID?: Edm.String;
        EmployeeID?: Edm.Int32;
        OrderDate?: Edm.DateTimeOffset;
        RequiredDate?: Edm.DateTimeOffset;
        ShippedDate?: Edm.DateTimeOffset;
        ShipVia?: Edm.Int32;
        Freight?: Edm.Decimal;
        ShipName?: Edm.String;
        ShipAddress?: Edm.String;
        ShipCity?: Edm.String;
        ShipRegion?: Edm.String;
        ShipPostalCode?: Edm.String;
        ShipCountry?: Edm.String;
        Customer?: NorthwindModel.Customer;
        Employee?: NorthwindModel.Employee;
        Order_Details?: NorthwindModel.Order_Detail[];
        Shipper?: NorthwindModel.Shipper;
    }
    export interface Product {
        ProductID: Edm.Int32;
        ProductName: Edm.String;
        SupplierID?: Edm.Int32;
        CategoryID?: Edm.Int32;
        QuantityPerUnit?: Edm.String;
        UnitPrice?: Edm.Decimal;
        UnitsInStock?: Edm.Int16;
        UnitsOnOrder?: Edm.Int16;
        ReorderLevel?: Edm.Int16;
        Discontinued: Edm.Boolean;
        Category?: NorthwindModel.Category;
        Order_Details?: NorthwindModel.Order_Detail[];
        Supplier?: NorthwindModel.Supplier;
    }
    export interface Region {
        RegionID: Edm.Int32;
        RegionDescription: Edm.String;
        Territories?: NorthwindModel.Territory[];
    }
    export interface Shipper {
        ShipperID: Edm.Int32;
        CompanyName: Edm.String;
        Phone?: Edm.String;
        Orders?: NorthwindModel.Order[];
    }
    export interface Supplier {
        SupplierID: Edm.Int32;
        CompanyName: Edm.String;
        ContactName?: Edm.String;
        ContactTitle?: Edm.String;
        Address?: Edm.String;
        City?: Edm.String;
        Region?: Edm.String;
        PostalCode?: Edm.String;
        Country?: Edm.String;
        Phone?: Edm.String;
        Fax?: Edm.String;
        HomePage?: Edm.String;
        Products?: NorthwindModel.Product[];
    }
    export interface Territory {
        TerritoryID: Edm.String;
        TerritoryDescription: Edm.String;
        RegionID: Edm.Int32;
        Region: NorthwindModel.Region;
        Employees?: NorthwindModel.Employee[];
    }
    export interface Alphabetical_list_of_product {
        ProductID: Edm.Int32;
        ProductName: Edm.String;
        SupplierID?: Edm.Int32;
        CategoryID?: Edm.Int32;
        QuantityPerUnit?: Edm.String;
        UnitPrice?: Edm.Decimal;
        UnitsInStock?: Edm.Int16;
        UnitsOnOrder?: Edm.Int16;
        ReorderLevel?: Edm.Int16;
        Discontinued: Edm.Boolean;
        CategoryName: Edm.String;
    }
    export interface Category_Sales_for_1997 {
        CategoryName: Edm.String;
        CategorySales?: Edm.Decimal;
    }
    export interface Current_Product_List {
        ProductID: Edm.Int32;
        ProductName: Edm.String;
    }
    export interface Customer_and_Suppliers_by_City {
        City?: Edm.String;
        CompanyName: Edm.String;
        ContactName?: Edm.String;
        Relationship: Edm.String;
    }
    export interface Invoice {
        ShipName?: Edm.String;
        ShipAddress?: Edm.String;
        ShipCity?: Edm.String;
        ShipRegion?: Edm.String;
        ShipPostalCode?: Edm.String;
        ShipCountry?: Edm.String;
        CustomerID?: Edm.String;
        CustomerName: Edm.String;
        Address?: Edm.String;
        City?: Edm.String;
        Region?: Edm.String;
        PostalCode?: Edm.String;
        Country?: Edm.String;
        Salesperson: Edm.String;
        OrderID: Edm.Int32;
        OrderDate?: Edm.DateTimeOffset;
        RequiredDate?: Edm.DateTimeOffset;
        ShippedDate?: Edm.DateTimeOffset;
        ShipperName: Edm.String;
        ProductID: Edm.Int32;
        ProductName: Edm.String;
        UnitPrice: Edm.Decimal;
        Quantity: Edm.Int16;
        Discount: Edm.Single;
        ExtendedPrice?: Edm.Decimal;
        Freight?: Edm.Decimal;
    }
    export interface Order_Details_Extended {
        OrderID: Edm.Int32;
        ProductID: Edm.Int32;
        ProductName: Edm.String;
        UnitPrice: Edm.Decimal;
        Quantity: Edm.Int16;
        Discount: Edm.Single;
        ExtendedPrice?: Edm.Decimal;
    }
    export interface Order_Subtotal {
        OrderID: Edm.Int32;
        Subtotal?: Edm.Decimal;
    }
    export interface Orders_Qry {
        OrderID: Edm.Int32;
        CustomerID?: Edm.String;
        EmployeeID?: Edm.Int32;
        OrderDate?: Edm.DateTimeOffset;
        RequiredDate?: Edm.DateTimeOffset;
        ShippedDate?: Edm.DateTimeOffset;
        ShipVia?: Edm.Int32;
        Freight?: Edm.Decimal;
        ShipName?: Edm.String;
        ShipAddress?: Edm.String;
        ShipCity?: Edm.String;
        ShipRegion?: Edm.String;
        ShipPostalCode?: Edm.String;
        ShipCountry?: Edm.String;
        CompanyName: Edm.String;
        Address?: Edm.String;
        City?: Edm.String;
        Region?: Edm.String;
        PostalCode?: Edm.String;
        Country?: Edm.String;
    }
    export interface Product_Sales_for_1997 {
        CategoryName: Edm.String;
        ProductName: Edm.String;
        ProductSales?: Edm.Decimal;
    }
    export interface Products_Above_Average_Price {
        ProductName: Edm.String;
        UnitPrice?: Edm.Decimal;
    }
    export interface Products_by_Category {
        CategoryName: Edm.String;
        ProductName: Edm.String;
        QuantityPerUnit?: Edm.String;
        UnitsInStock?: Edm.Int16;
        Discontinued: Edm.Boolean;
    }
    export interface Sales_by_Category {
        CategoryID: Edm.Int32;
        CategoryName: Edm.String;
        ProductName: Edm.String;
        ProductSales?: Edm.Decimal;
    }
    export interface Sales_Totals_by_Amount {
        SaleAmount?: Edm.Decimal;
        OrderID: Edm.Int32;
        CompanyName: Edm.String;
        ShippedDate?: Edm.DateTimeOffset;
    }
    export interface Summary_of_Sales_by_Quarter {
        ShippedDate?: Edm.DateTimeOffset;
        OrderID: Edm.Int32;
        Subtotal?: Edm.Decimal;
    }
    export interface Summary_of_Sales_by_Year {
        ShippedDate?: Edm.DateTimeOffset;
        OrderID: Edm.Int32;
        Subtotal?: Edm.Decimal;
    }
}
namespace ODataWebExperimental.Northwind.Model {
}

namespace Edm {
    export type Duration = string;
    export type Binary = string;
    export type Boolean = boolean;
    export type Byte = number;
    export type Date = string;
    export type DateTimeOffset = string;
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
/// #odata.source = 'http://services.odata.org/V4/Northwind/Northwind.svc/$metadata'