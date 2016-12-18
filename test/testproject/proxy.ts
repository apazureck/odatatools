import { ProxyBase, EntitySet } from './odataproxybase';
class Proxy extends ProxyBase {
    constructor(name: string, address: string) {
        super(name, address);
        this.Hosts = new EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.HostDto>("Hosts", address);
        this.Agents = new EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.AgentDto>("Agents", address);
        this.AgentConfigTemplates = new EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.RecipeTemplateDto>("AgentConfigTemplates", address);
        this.AgentConfigs = new EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.RecipeDto>("AgentConfigs", address);
        this.Users = new EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.UserUserDto>("Users", address);
        this.AgentConfigVersions = new EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.RecipeVersionDto>("AgentConfigVersions", address);
        this.AgentConfigTemplateVersions = new EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.RecipeTemplateVersionDto>("AgentConfigTemplateVersions", address);
    }
    Hosts: EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.HostDto>;
    Agents: EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.AgentDto>;
    AgentConfigTemplates: EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.RecipeTemplateDto>;
    AgentConfigs: EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.RecipeDto>;
    Users: EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.UserUserDto>;
    AgentConfigVersions: EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.RecipeVersionDto>;
    AgentConfigTemplateVersions: EntitySet<Ifmdatalink.Linerecorder.Backend.PlugIn.dto.RecipeTemplateVersionDto>;
}