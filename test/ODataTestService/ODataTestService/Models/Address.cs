using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;
using System.Web.OData.Builder;

namespace ODataTestService.Models
{
    public class Address
    {
        [Key]
        public int Id { get; set; }
        public string Street { get; set; }
        public string Zip { get; set; }
        [ExpandSource("Customers", "AddressId")]
        public List<Customer> Inhabitants { get; set; }

        internal static void Map(ODataModelBuilder builder, EntitySetConfiguration<Address> entitySetConfiguration)
        {
            entitySetConfiguration.EntityType.HasMany(x => x.Inhabitants);
        }

        public void GetObjectData(SerializationInfo info, StreamingContext context)
        {
            throw new NotImplementedException();
        }
    }
}