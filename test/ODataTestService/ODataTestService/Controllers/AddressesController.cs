using ODataTestService.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.OData;

namespace ODataTestService.Controllers
{
    public class AddressesController : ODataBaseController<Address, int>
    {
        private List<Address> datasource = new List<Address>();

        public AddressesController()
        {
            datasource.Add(new Address()
            {
                Id = 1,
                Street = "Fakestreet",
                Zip = "0000"
            });
            datasource.Add(new Address()
            {
                Id = 2,
                Street = "Topstreet",
                Zip = "0001"
            });
        }

        protected override IEnumerable<Address> EntitySet
        {
            get
            {
                return datasource.AsQueryable();
            }
        }

        protected override Address add(Address entity)
        {
            datasource.Add(entity);
            entity.Id = datasource.Count;
            return entity;
        }

        protected override int getKey(Address entity)
        {
            return entity.Id;
        }

        protected override void remove(Address entity)
        {
            datasource.Remove(entity);
        }

        protected override void replace(Address entity)
        {
            datasource[entity.Id - 1] = entity;
        }
    }
}