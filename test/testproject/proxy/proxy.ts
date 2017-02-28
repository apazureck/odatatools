namespace amsgateway {
    import ProxyBase = odatatools.ProxyBase;
    import EntitySet = odatatools.EntitySet;
    import ThenableCaller = odatatools.ThenableCaller;
    import Thenable = odatatools.Thenable;

    class Gateway extends ProxyBase {
        constructor(address: string, name?: string) {
            super(address, name);
            this.Hosts = new EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.HostDto, Ifmdatalink.Linerecorder.Backend.PlugIn.dto.DeltaHostDto>("Hosts", address, "Ident");
            this.Agents = new AgentDtoEntitySet("Agents", address, "Ident");
            this.AgentTemplates = new EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.AgentTemplateDto, Ifmdatalink.Linerecorder.Backend.PlugIn.dto.DeltaAgentTemplateDto>("AgentTemplates", address, "Ident");
            this.AgentTemplateVersions = new EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.AgentTemplateVersionDto, Ifmdatalink.Linerecorder.Backend.PlugIn.dto.DeltaAgentTemplateVersionDto>("AgentTemplateVersions", address, "Ident");
            this.Users = new EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.UserUserDto, Ifmdatalink.Linerecorder.Backend.PlugIn.dto.DeltaUserUserDto>("Users", address, "ident");
            this.AgentVersions = new EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.AgentVersionDto, Ifmdatalink.Linerecorder.Backend.PlugIn.dto.DeltaAgentVersionDto>("AgentVersions", address, "Ident");
            this.RuntimeInfos = new EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.RuntimeInfoDto, Ifmdatalink.Linerecorder.Backend.PlugIn.dto.DeltaRuntimeInfoDto>("RuntimeInfos", address, "Ident");
        }
        Hosts: EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.HostDto, Ifmdatalink.Linerecorder.Backend.PlugIn.dto.DeltaHostDto>;
        Agents: AgentDtoEntitySet;
        AgentTemplates: EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.AgentTemplateDto, Ifmdatalink.Linerecorder.Backend.PlugIn.dto.DeltaAgentTemplateDto>;
        AgentTemplateVersions: EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.AgentTemplateVersionDto, Ifmdatalink.Linerecorder.Backend.PlugIn.dto.DeltaAgentTemplateVersionDto>;
        Users: EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.UserUserDto, Ifmdatalink.Linerecorder.Backend.PlugIn.dto.DeltaUserUserDto>;
        AgentVersions: EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.AgentVersionDto, Ifmdatalink.Linerecorder.Backend.PlugIn.dto.DeltaAgentVersionDto>;
        RuntimeInfos: EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.RuntimeInfoDto, Ifmdatalink.Linerecorder.Backend.PlugIn.dto.DeltaRuntimeInfoDto>;
    }
    export class AgentDtoEntitySet extends EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.AgentDto, Ifmdatalink.Linerecorder.Backend.PlugIn.dto.DeltaAgentDto> {
        constructor(name: string, address: string, key: string) {
            super(name, address, key);
        }
        Deploy(key: Edm.Int32): Thenable<void> {
            let callback = new ThenableCaller<void>();
            let headers = { "Content-Type": "application/json", Accept: "application/json" };
            let request: odatajs.Request = {
                headers: headers,
                method: "POST",
                requestUri: this.Address + "(" + key + ")/amsgateway.Deploy",
            }
            odatajs.oData.request(request, (data, response) => {
                callback.resolve();
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }

        Undeploy(key: Edm.Int32): Thenable<void> {
            let callback = new ThenableCaller<void>();
            let headers = { "Content-Type": "application/json", Accept: "application/json" };
            let request: odatajs.Request = {
                headers: headers,
                method: "POST",
                requestUri: this.Address + "(" + key + ")/amsgateway.Undeploy",
            }
            odatajs.oData.request(request, (data, response) => {
                callback.resolve();
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }

        StartAgent(key: Edm.Int32): Thenable<void> {
            let callback = new ThenableCaller<void>();
            let headers = { "Content-Type": "application/json", Accept: "application/json" };
            let request: odatajs.Request = {
                headers: headers,
                method: "POST",
                requestUri: this.Address + "(" + key + ")/amsgateway.StartAgent",
            }
            odatajs.oData.request(request, (data, response) => {
                callback.resolve();
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }

        StopAgent(key: Edm.Int32): Thenable<void> {
            let callback = new ThenableCaller<void>();
            let headers = { "Content-Type": "application/json", Accept: "application/json" };
            let request: odatajs.Request = {
                headers: headers,
                method: "POST",
                requestUri: this.Address + "(" + key + ")/amsgateway.StopAgent",
            }
            odatajs.oData.request(request, (data, response) => {
                callback.resolve();
            }, (error) => {
                console.error(error.name + " " + error.message + " | " + (error.response | error.response.statusText) + ":" + (error.response | error.response.body));
                callback.reject(error);
            });
            return callback;
        }

    }


}