declare namespace Ifmdatalink.Linerecorder.Backend.PlugIn.dto {
    export interface HostDto {
        Ident: Edm.Int32;
        LayoutObjectDto_Ident?: Edm.Int32;
        LayoutObject?: Ifmdatalink.Linerecorder.Backend.PlugIn.dto.LayoutObjectDto;
        HostName?: Edm.String;
        Address?: Edm.String;
        OS?: Edm.String;
        AMSVersion?: Edm.String;
        Description?: Edm.String;
        Created?: Edm.DateTimeOffset;
        Updated?: Edm.DateTimeOffset;
        IsActive?: Edm.Boolean;
        Closed?: Edm.DateTimeOffset;
    }
    export interface AgentDto {
        Ident: Edm.Int32;
        Name?: Edm.String;
        Description?: Edm.String;
        Status: Edm.Int32;
        OperatingMode: Edm.Int32;
        StartMode: Edm.Int32;
        RuntimeVersion?: Edm.String;
        ServiceType?: Edm.String;
        ServiceName?: Edm.String;
        ServiceStatus?: Edm.String;
        WatchdogFrequency?: Edm.String;
        Deleted: Edm.Boolean;
        Guarantor?: Edm.String;
        Deputy?: Edm.String;
        LayoutObjectIdent: Edm.Int32;
        HostIdent?: Edm.Int32;
        RecipeIdent?: Edm.Int32;
        ProgramInstanceIdent?: Edm.Int32;
        AgentMetaInfoIdent: Edm.Int32;
        GuarantorUser?: Ifmdatalink.Linerecorder.Backend.PlugIn.dto.UserUserDto;
        DeputyUser?: Ifmdatalink.Linerecorder.Backend.PlugIn.dto.UserUserDto;
        Host?: Ifmdatalink.Linerecorder.Backend.PlugIn.dto.HostDto;
        Recipe?: Ifmdatalink.Linerecorder.Backend.PlugIn.dto.RecipeVersionDto;
    }
    export interface RecipeTemplateDto {
        Ident: Edm.Int32;
        Description?: Edm.String;
        Name?: Edm.String;
        Versions?: Ifmdatalink.Linerecorder.Backend.PlugIn.dto.RecipeTemplateVersionDto[];
    }
    export interface RecipeTemplateVersionDto {
        Ident: Edm.Int32;
        Build?: Edm.Int32;
        Comment?: Edm.String;
        CreationDate?: Edm.DateTimeOffset;
        GuarantorIdent?: Edm.Int32;
        Major?: Edm.Int32;
        Minor?: Edm.Int32;
        SourceCodeUriString?: Edm.String;
        Tag?: Edm.String;
        TemplateId?: Edm.Int32;
        Guarantor?: Ifmdatalink.Linerecorder.Backend.PlugIn.dto.UserUserDto;
        Template?: Ifmdatalink.Linerecorder.Backend.PlugIn.dto.RecipeDto;
    }
    export interface RecipeDto {
        Ident: Edm.Int32;
        Description?: Edm.String;
        Name?: Edm.String;
        Versions?: Ifmdatalink.Linerecorder.Backend.PlugIn.dto.RecipeVersionDto[];
    }
    export interface RecipeVersionDto {
        Ident: Edm.Int32;
        Build?: Edm.Int32;
        Comment?: Edm.String;
        CreationDate?: Edm.DateTimeOffset;
        GuarantorIdent?: Edm.Int32;
        IsBlocked?: Edm.Boolean;
        Major?: Edm.Int32;
        Minor?: Edm.Int32;
        Tag?: Edm.String;
        TemplateIdent?: Edm.Int32;
        RecipeIdent?: Edm.Int32;
        Description?: Edm.String;
        Guarantor?: Ifmdatalink.Linerecorder.Backend.PlugIn.dto.UserUserDto;
        Template?: Ifmdatalink.Linerecorder.Backend.PlugIn.dto.RecipeTemplateVersionDto;
        Recipe?: Ifmdatalink.Linerecorder.Backend.PlugIn.dto.RecipeDto;
    }
    export interface UserUserDto {
        ident: Edm.Int32;
        username?: Edm.String;
        pwHash?: Edm.String;
        description?: Edm.String;
        mailAddress?: Edm.String;
        mobilePhoneNumber?: Edm.String;
        pnumber?: Edm.String;
        uSource?: Edm.Int32;
        userDN?: Edm.String;
        ldapServerIdent: Edm.Int32;
        UserUserRole: Edm.Int32[];
        Enabled: Edm.Boolean;
        ReadOnly: Edm.Boolean;
        entryTopology?: Edm.Int32;
        Language?: Edm.String;
    }
    export interface LayoutObjectDto {
        ident: Edm.Int32;
        layoutObjectTypeIdent: Edm.Int32;
        parentIdent?: Edm.Int32;
        name?: Edm.String;
        description?: Edm.String;
        createTs: Edm.DateTimeOffset;
        lastUpdatedTs: Edm.DateTimeOffset;
        createUser?: Edm.String;
        latitude?: Edm.Double;
        longitude?: Edm.Double;
        centerLatitude?: Edm.Double;
        centerLongitude?: Edm.Double;
        zoomFactor?: Edm.Int32;
        imageIdent?: Edm.Int32;
        showImage: Edm.Boolean;
        imageMode: Edm.Int32;
        ord: Edm.Int32;
        unit?: Edm.String;
        displayMode: Ifmdatalink.Linerecorder.Backend.PlugIn.Enum.LayoutObjectDisplayMode;
        state: Ifmdatalink.Linerecorder.Backend.PlugIn.Enum.LayoutObjectState;
    }
}
declare namespace Ifmdatalink.Linerecorder.Backend.PlugIn.Enum {
    export enum LayoutObjectDisplayMode {
        Show = 0, Hide = 1
    }
    export enum LayoutObjectState {
        Active = 0, Disabled = 1, TimedOut = 2
    }
}
declare namespace Default {
}
/// Do not modify this line to being able to update your interfaces again:
/// #odata.source = 'http://localhost:13917/ams.svc/$metadata'