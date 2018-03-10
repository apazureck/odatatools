interface EdmxBase {

}

type ftype = "Action" | "Function"

interface Edmx extends EdmxBase {
    $: {
        Version: string;
        "xmlns:edmx": string;
    }
    "edmx:DataServices": DataService[];
}

interface DataService {
    Schema: Schema[],
    Address: string
}

interface Schema extends EdmxBase {
    $: { Namespace: string; }
    ComplexType?: ComplexType[];
    EntityType?: EntityType[];
    EnumType?: EnumType[];
    EntityContainer?: EntityContainer[];
    Action?: Method[];
    Function?: Method[];
}

interface EntityContainer {
    $: {
        Name: string;
    },
    EntitySet: EntitySet[],
    Singleton: Singleton[],
    FunctionImport: FunctionImport[],
    ActionImport: ActionImport[],
}

interface EntitySet {
    $: {
        Name: string,
        EntityType: string
    }
    NavigationPropertyBinding: NavigationPropertyBinding[];
    FunctionImport: FunctionImport[]
}

interface Singleton {
    $: {
        Name: string,
        Type: string
    }
    NavigationPropertyBinding: NavigationPropertyBinding[];
    FunctionImport: FunctionImport[]
}

interface FunctionImport {
    $: {
        Name: string;
        Function: string;
        EntitySet?: string;
        IncludeInServiceDocument?: boolean;
    }
}

interface ActionImport {
    $: {
        Name: string;
        Action: string;
        EntitySet?: string;
    }
}

interface NavigationPropertyBinding {
    $: {
        Path: string
        Target: string
    }
}

interface EnumType {
    $: { Name: string; }
    Member: {
        $: {
            Name: string;
            Value: number;
        }
    }[]
}

interface NavigationProperty {
    ReferentialConstraint?: {
        $: {
            Name: string;
            Type: string;
            Property: string;
            ReferencedProperty: string;
        }
    }
}

interface ComplexType extends EdmxBase {
    $: {
        Name: string;
        BaseType?: string;
        OpenType?: boolean;
    }
    Property: Property[];
}

interface Property extends EdmxBase {
    $: {
        Name: string;
        Type: string;
        Nullable?: boolean | string;
    }
}

interface EntityType extends ComplexType {
    Key?: { PropertyRef: { $: { Name: string } }[] }[];
    NavigationProperty: NavigationProperty[];
}

interface Method {
    $: {
        Name: string;
        IsBound: boolean;
    }
    Parameter?: Parameter[]
    ReturnType?: ReturnType[]

    // added by proxygenerator:
    IsBoundToCollection?: boolean;
    Namespace: string

    //Added by the proxygenerator
    Type: ftype
}

interface ReturnType {
    $: {
        Type: string;
    }
}

interface Parameter {
    $: {
        Name: string;
        Type: string;
        Unicode?: boolean;
        Nullable?: boolean;
        Precision?: number;
        MaxLength?: number;
        Scale?: number | "variable" | "floating";
        SRID?: string;
    }
}