import { IODataMetadata } from './outtypes';
export interface IInterfaces {
    ComplexTypes: ComplexType[];
    EntityTypes: EntityType[];
    EnumTypes: EnumType[];
}

export interface IMethod {
    Name: string;
    IsBoundToCollection: boolean;
    ReturnType: string
}

export interface IEntityType extends IComplexType {
    Key: string;
    NavigationProperties: INavigationProperty[];
    Actions: IMethod[];
    Functions: IMethod[];
}

export interface IComplexType {
    Name: string;
    Fullname: string;
    Properties: IProperty[];
    BaseType: string;
    OpenType: boolean;
}

export interface IEnumType {
    Name: string;
    Value: number;
}

export interface IProperty {
    Name: string;
    Type: string;
    Nullable: boolean;
}

export interface IEnum {
    Name: string;
    Members: {
        Key: string;
        Value: number;
    }[];
}

export interface INavigationProperty extends IProperty {
    
}

export interface IODataMetadata extends IODataEntities {
    EntityContainer: IEntityContainer;
    Functions: IFunction[];
    Actions: IAction[];
}

export interface IAction extends IMethod {}
export interface IFunction extends IMethod {}
export interface IMethod {
    Parameters: IParameter[];
    ReturnType: string | undefined;
}

export interface IParameter {
    Name: string;
    Type: string;
    Nullable?: boolean;
    Unicode?: boolean;
    Precision?: number;
    MaxLength?: number;
    Scale?: number | "variable" | "floating";
    SRID?: string;
}

export interface IODataEntities {
    Header: string;
    Namespace: string;
    EntityTypes: IEntityType[];
    ComplexTypes: IComplexType[];
    EnumTypes: IEnum[];
}


/// Proxy generator

export interface IEntityContainer {
    Name: string;
    EntitySets: IEntitySet[];
    Singletons: ISingleton[];
    FunctionImports: IFunctionImport[];
    ActionImports: IActionImport[];
}

export interface IEntitySet {
    Name: string;
    EntityType: IEntityType;
    NavigationPropertyBindings: INavigationPropertyBinding[];
    Actions: IMethod[];
    Functions: IMethod[];
}

export interface IFunctionImport extends IMethodImport {
    Function: IFunction;
    IncludeInServiceDocument?: boolean;
}

export interface IActionImport extends IMethodImport {
    Action: IAction;
}

export interface IMethodImport {
    Name: string;
    EntitySet?: IEntitySet;
}

export interface ISingleton {
    Name: string;
    Type: string;
    NavigationPropertyBindings: INavigationPropertyBinding[];
}

export interface INavigationPropertyBinding {
    Path: string;
    Target: string;
}