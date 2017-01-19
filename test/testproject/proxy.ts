import ProxyBase = odatatools.ProxyBase;
import EntitySet = odatatools.EntitySet;

class MyProxy extends ProxyBase {
    constructor(name: string, address: string) {
        super(name, address);
        this.Movies = new EntitySet<ODataTestService.Models.Movie, ODataTestService.Models.DeltaMovie>("Movies", address, "Id");
        this.Customers = new EntitySet<ODataTestService.Models.Customer, ODataTestService.Models.DeltaCustomer>("Customers", address, "Id");
        this.Addresses = new EntitySet<ODataTestService.Models.Address, ODataTestService.Models.DeltaAddress>("Addresses", address, "Id");
    }
    Movies: EntitySet<ODataTestService.Models.Movie, ODataTestService.Models.DeltaMovie>;
    Customers: EntitySet<ODataTestService.Models.Customer, ODataTestService.Models.DeltaCustomer>;
    Addresses: EntitySet<ODataTestService.Models.Address, ODataTestService.Models.DeltaAddress>;
}