interface EdmxBase {
    
}

interface Edmx extends EdmxBase {
    $: {
        Version: string;
        "xmlns:edmx": string;
    }
    "edmx:DataServices": DataService[];
}

interface DataService {
    Schema: Schema[]
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
    EntitySet: EntitySet[]
}

interface EntitySet {
    $: {
        Name: string,
        EntityType: string
    }
    NavigationPropertyBinding: NavigationPropertyBinding[]
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
    $: { Name: string; }
    Property: Property[];
}

interface Property extends EdmxBase {
    $: {
        Name: string;
        Type: string;
        Nullable?: boolean;
    }
}

interface EntityType extends ComplexType {
    Key?: { PropertyRef: { $: { Name: string } }[] }[];
    NavigationProperty: NavigationProperty[];
}

interface Method {
    $: {
        Name: string;
        IsBound: string;
    }
    Parameter?: Parameter[]
    ReturnType?: ReturnType[]
    
    // added by proxygenerator:
    IsBoundToCollection?: boolean;
    Namespace: string
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
        Nullable?: boolean
    }
}