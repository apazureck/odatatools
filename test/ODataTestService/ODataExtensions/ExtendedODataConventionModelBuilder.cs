using Microsoft.OData.Edm;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Reflection;
using System.Web.Http;
using System.Web.OData;
using System.Web.OData.Batch;
using System.Web.OData.Builder;
using System.Web.OData.Extensions;

namespace System.Web.Odata.Builder
{
    public class ExtendedODataConventionModelBuilder : ODataConventionModelBuilder
    {
        /// <summary>
        /// A dictionary hierarchy. First Dictionary is a Type - string dictionary. It will take the model type and go through all found bindings there.
        /// </summary>
        public static Dictionary<Type, Dictionary<string, ExternalSource>> CustomNavigationReferences { get; } = new Dictionary<Type, Dictionary<string, ExternalSource>>();
        public override IEdmModel GetEdmModel()
        {
            var basemodel = base.GetEdmModel();
            foreach (EntitySetConfiguration set in EntitySets)
            {
                Dictionary<string, ExternalSource> navdictionary;
                // If the referenced Model Type is not listed in the targetdictionary add it, otherwise set the targetdictionary
                //TODO [ap] Perhaps better to change it to entity set, as types may be used in multiple locations?
                if (!CustomNavigationReferences.TryGetValue(set.ClrType, out navdictionary))
                {
                    navdictionary = new Dictionary<string, ExternalSource>();
                    CustomNavigationReferences.Add(set.ClrType, navdictionary);
                }

                Dictionary<string, PropertyInfo> foreignKeys = new Dictionary<string, PropertyInfo>();
                foreach(PropertyInfo pi in set.ClrType.GetProperties(BindingFlags.Instance | BindingFlags.Public))
                {
                    ForeignKeyAttribute fk = pi.GetCustomAttribute(typeof(ForeignKeyAttribute), true) as ForeignKeyAttribute;
                    if (fk != null)
                        foreignKeys.Add(fk.Name, pi);
                }

                string key = null;
                try
                {
                    key = set.ClrType.GetProperties().FirstOrDefault(x => { return x.GetCustomAttribute(typeof(KeyAttribute), true) != null; }).Name;
                }
                catch (Exception)
                {
                }
                // Get all expand source attributes
                foreach (PropertyInfo pi in set.ClrType.GetProperties(BindingFlags.Instance | BindingFlags.Public))
                {
                    
                    foreach (ExpandSourceAttribute a in pi.GetCustomAttributes(typeof(ExpandSourceAttribute), true).Cast<ExpandSourceAttribute>())
                    {
                        var exs = new ExternalSource { EntitySet = a.SourceEntitySet, IsLocal = a.IsLocal, NavigationProperty = pi, Key = key, ForeignKey = a.ForeignKey };
                        PropertyInfo fk;
                        if (foreignKeys.TryGetValue(pi.Name, out fk))
                        {
                            exs.ForeignKeyProperty = fk;
                            try
                            {
                                exs.ForeignKey = pi.PropertyType.GetProperties().FirstOrDefault(x => x.GetCustomAttribute(typeof(KeyAttribute), true) != null).Name;
                            }
                            catch (Exception ex)
                            {
                                throw new ArgumentException(pi.PropertyType.Name + " has no KeyAttribute defined and, thus, cannot be used as ExpandSource.", pi.PropertyType.Name, ex);
                            }
                        }
                        navdictionary.Add(pi.Name, exs);
                    }
                }
            }
            return basemodel;
        }

        public static string RoutePrefix { get; private set; }

        public void CreateODataRoute(string routeName, string routePrefix, HttpConfiguration config, DefaultODataBatchHandler batchhandler = null)
        {
            RoutePrefix = routePrefix;
            config.MapODataServiceRoute(
                routeName: routeName,
                routePrefix: routePrefix,
                model: this.GetEdmModel(),
                batchHandler: batchhandler);
        }
    }
}