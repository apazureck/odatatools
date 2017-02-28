using ODataTestService.Models;
using System.Web.Http;
using System.Web.Odata.Builder;
using System.Web.OData.Extensions;

namespace ODataTestService
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // Web API configuration and services

            // Web API routes
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );

            // enable query options for all properties
            config.Filter().Expand().Select().OrderBy().MaxTop(null).Count();

            ExtendedODataConventionModelBuilder builder = new ExtendedODataConventionModelBuilder();
            builder.Namespace = "MovieService";
            builder.ContainerName = "MovieContainer";
            Movie.Map(builder, builder.EntitySet<Movie>("Movies"));
            Customer.Map(builder, builder.EntitySet<Customer>("Customers"));
            Address.Map(builder, builder.EntitySet<Address>("Addresses"));

            builder.CreateODataRoute("ODataRoute", "moviedb", config);
        }
    }
}
