using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Web.OData.Builder;

namespace ODataTestService.Models
{
    public class Customer
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; }
        public int Age { get; set; }
        public Gender Gender { get; set; }
        public double Balance { get; set; }
        [ExpandSource("Addresses")]
        public Address Address { get; set; }
        [ForeignKey(nameof(Address))]
        public int AddressId { get; set; }
        [ExpandSource("Movies", "LenderId")]
        public List<Movie> Borrowed { get; set; }

        internal static void Map(ODataModelBuilder builder, EntitySetConfiguration<Customer> entitySetConfiguration)
        {
            entitySetConfiguration.EntityType.HasRequired(x => x.Address);
        }
    }
}