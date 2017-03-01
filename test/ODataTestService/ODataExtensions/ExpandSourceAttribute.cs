using System;

namespace System.ComponentModel.DataAnnotations.Schema
{
    public class ExpandSourceAttribute : Attribute
    {
        /// <summary>
        /// Expand source attribute calls an external source (OData) to get the data when expanding.
        /// </summary>
        /// <param name="sourceentityset">Entryset of the source. Start with http:// to address external source from another service.</param>
        /// <param name="foreignkey">If the entityset is a collection, this property tells which property is the key to the current model to determine the entries of this collection on the other entity set.</param>
        public ExpandSourceAttribute(string sourceentityset, string foreignkey = null)
        {
            if (!sourceentityset.StartsWith("http://"))
                IsLocal = true;
            else
                IsLocal = false;
            SourceEntitySet = sourceentityset;
            ForeignKey = foreignkey;
        }
        public string SourceEntitySet { get; set; }
        public bool IsLocal { get; private set; }

        public string ForeignKey { get; set; }
    }
}