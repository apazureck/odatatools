using ODataTestService.Controllers;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Web.OData.Builder;

namespace ODataTestService.Models
{
    public class Movie
    {
        [Key]
        public int Id { get; set; }
        [ForeignKey(nameof(Lender))]
        public int LenderId { get; set; }
        [ExpandSource("Customers")]
        public Customer Lender { get; set; }
        public bool Avaiable { get; set; }
        public float Rating { get; set; }

        public string Genre { get; set; }
        public string Reason { get; set; }

        internal static void Map(ODataModelBuilder builder, EntitySetConfiguration<Movie> entitySetConfiguration)
        {
            entitySetConfiguration.EntityType.HasOptional(x => x.Lender);
            //entitySetConfiguration.EntityType.Action("Rate").Parameter<float>("rating");
            //entitySetConfiguration.EntityType.Action("ResetRating");
            var a = builder.EntityType<Movie>().Action("Rate");
            a.Parameter<float>("rating");
            a.Parameter<string>("reason");
            a.Returns<string>();
            builder.EntityType<Movie>().Action("ResetRating");
            var f = builder.EntityType<Movie>().Collection.Function("GetBestMovie");
            f.Parameter<string>("Genre");
            f.Returns<Movie>();
        }
    }
}