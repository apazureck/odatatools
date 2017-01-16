import ProxyBase = odatatools.ProxyBase; import EntitySet = odatatools.EntitySet;

class myProxy extends ProxyBase {
    constructor(name: string, address: string) {
        super(name, address);
        this.Movies = new EntitySet<ODataTestService.Models.Movie, ODataTestService.Models.DeltaMovie>("Movies", address, "undefined");
        this.Customers = new EntitySet<ODataTestService.Models.Customer, ODataTestService.Models.DeltaCustomer>("Customers", address, "undefined");
        this.Addresses = new EntitySet<ODataTestService.Models.Address, ODataTestService.Models.DeltaAddress>("Addresses", address, "undefined");
    }
    Movies: EntitySet<ODataTestService.Models.Movie, ODataTestService.Models.DeltaMovie>;
    Customers: EntitySet<ODataTestService.Models.Customer, ODataTestService.Models.DeltaCustomer>;
    Addresses: EntitySet<ODataTestService.Models.Address, ODataTestService.Models.DeltaAddress>;
}