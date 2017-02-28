using ODataTestService.Models;
using System.Collections.Generic;
using System.Linq;
using System.Web.OData;

namespace ODataTestService.Controllers
{
    public class CustomersController : ODataBaseController<Customer, int>
    {
        public CustomersController()
        {
            datasource.Add(new Customer
            {
                AddressId = 1,
                Age = 10,
                Balance = 0.0,
                Gender = Gender.Other,
                Id = 1,
                Name = "Lance Uppercut"
            });
        }
        private List<Customer> datasource = new List<Customer>();
        protected override IEnumerable<Customer> EntitySet
        {
            get
            {
                return datasource.AsQueryable();
            }
        }

        protected override Customer add(Customer entity)
        {
            datasource.Add(entity);
            entity.Id = datasource.Count;
            return entity;
        }

        protected override int getKey(Customer entity)
        {
            return entity.Id;
        }

        protected override void remove(Customer entity)
        {
            datasource.Remove(entity);
        }

        protected override void replace(Customer entity)
        {
            datasource[entity.Id - 1] = entity;
        }
    }
}