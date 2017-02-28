using System.Reflection;

namespace System.Web.OData
{
    public class ExternalSource
    {
        /// <summary>
        /// The name of the entity set
        /// </summary>
        public string EntitySet { get; set; }

        /// <summary>
        /// The source of the entity set. If null the current host will be used
        /// </summary>
        public bool IsLocal { get; set; }

        /// <summary>
        /// The property information of the foreign key to get the value
        /// </summary>
        public PropertyInfo ForeignKeyProperty { get; set; }

        /// <summary>
        /// The property information of the navigation property
        /// </summary>
        public PropertyInfo NavigationProperty { get; set; }

        public string ForeignKey { get; set; }

        public bool IsCollection { get { return ForeignKeyProperty == null; } }

        public string Key { get; set; }
    }
}
