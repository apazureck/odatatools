import { IODataSchema } from './outtypes';
export interface IInterfaces {
    ComplexTypes: ComplexType[];
    EntityTypes: EntityType[];
    EnumTypes: EnumType[];
}

export interface IMethod {
    Name: string;
    IsBoundToCollection: boolean;
    IsBound: boolean;
    ReturnType: ISimpleType;
}

export interface IEntityType extends IComplexType {
    Key: IProperty;
    NavigationProperties: INavigationProperty[];
    Actions: IMethod[];
    Functions: IMethod[];
}

export interface IComplexType {
    Name: string;
    Fullname: string;
    Namespace: string;
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
    Type: ISimpleType;
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

export interface IODataSchema extends IODataEntities {
    Namespace: string;
    EntityContainer?: IEntityContainer;
    Functions: IFunction[];
    Actions: IAction[];
}

export interface IAction extends IMethod { }
export interface IFunction extends IMethod { }

export interface IMethod {
    Parameters: IParameter[];
    ReturnType: ISimpleType;
    FullName: string;
}

export interface IParameter {
    Name: string;
    Type: ISimpleType;
    Nullable?: boolean;
    Unicode?: boolean;
    Precision?: number;
    MaxLength?: number;
    Scale?: number | "variable" | "floating";
    SRID?: string;
}

export interface IODataEntities {
    Header: string;
    EntityTypes: IEntityType[];
    ComplexTypes: IComplexType[];
    EnumTypes: IEnum[];
}


/// Proxy generator

export interface IEntityContainer extends ISchemaChild {
    Name: string;
    EntitySets: IEntitySet[];
    Singletons: ISingleton[];
    FunctionImports: IFunctionImport[];
    ActionImports: IActionImport[];
}

export interface IEntitySet extends ISchemaChild {
    Name: string;
    EntityType: IEntityType;
    NavigationPropertyBindings: INavigationPropertyBinding[];
    Actions: IMethod[];
    Functions: IMethod[];
}

export interface ISchemaChild {
    Namespace: string;
    FullName: string;
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

export interface ISimpleType {
    Name: string;
    IsCollection: boolean;
    IsVoid: boolean;
}