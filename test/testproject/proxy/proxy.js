var ProxyBase = odatatools.ProxyBase;
var EntitySet = odatatools.EntitySet;
var odatatools;
(function (odatatools) {
    class MovieProxy extends odatatools.ProxyBase {
        constructor(address, name) {
            super(address, name);
            this.Movies = new odatatools.EntitySet("Movies", address, "Id");
            this.Customers = new odatatools.EntitySet("Customers", address, "Id");
            this.Addresses = new odatatools.EntitySet("Addresses", address, "Id");
        }
    }
    odatatools.MovieProxy = MovieProxy;
})(odatatools || (odatatools = {}));
//# sourceMappingURL=proxy.js.map