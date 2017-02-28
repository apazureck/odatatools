using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Odata.Builder;

namespace System.Web.OData
{
    public abstract class ODataBaseController<T, Tkey> : ODataController where T : class where Tkey : IEquatable<Tkey>
    {
        private Dictionary<string, ExternalSource> externalsources;
        public ODataBaseController()
        {
            ExtendedODataConventionModelBuilder.CustomNavigationReferences.TryGetValue(typeof(T), out externalsources);
        }

        #region Abstract
        /// <summary>
        /// Gets the entity set (as iqueryable)
        /// </summary>
        protected abstract IEnumerable<T> EntitySet { get; }

        /// <summary>
        /// Get the key of the entity (second Type)
        /// </summary>
        /// <param name="entity">entity to get the key from</param>
        /// <returns>The key of the entity</returns>
        protected abstract Tkey getKey(T entity);

        /// <summary>
        /// Adds a new Entity to the entityset
        /// </summary>
        /// <param name="entity">The entity to add</param>
        /// <returns>The entry in the entity set (may be modified by database)</returns>
        protected abstract T add(T entity);

        /// <summary>
        /// Replaces the given Entity
        /// </summary>
        /// <param name="entity">Entity to replace</param>
        /// <returns>The replaced Entity</returns>
        /// <exception cref="KeyNotFoundException">Thrown, if the entity is not found in the entity set.</exception>
        protected abstract void replace(T entity);

        /// <summary>
        /// Removes an entry
        /// </summary>
        /// <param name="entity"></param>
        /// <returns></returns>
        protected abstract void remove(T entity);
        #endregion

        #region CRUD Operations

        /// <summary>
        /// Gets all entries of the entity set
        /// </summary>
        /// <returns>the complete entity set</returns>
        [EnableQuery(MaxExpansionDepth = 5, AllowedQueryOptions = Query.AllowedQueryOptions.All)]
        public virtual IHttpActionResult Get()
        {
            try
            {
                var set = new List<T>(EntitySet);
                if (set == null)
                    return NotFound();

                var expands = getExpands(Request.RequestUri.ToString());
                if (expands.Count() < 1)
                    return Ok(EntitySet.AsQueryable());

                if (expands.FirstOrDefault() == "*")
                {
                    expands = externalsources.Select(x => x.Key).ToList();
                }

                foreach (string exstring in expands)
                {
                    if (externalsources != null)
                    {
                        ExternalSource src;
                        if(exstring == "*")
                        {

                        }
                        externalsources.TryGetValue(Regex.Split(exstring, @"[/(]")[0].Trim(), out src);


                        if (src == null)
                            continue;
                        if (src.IsCollection)
                        {
                            IEnumerable<object> expand;
                            try
                            {
                                expand = getData(src, src.NavigationProperty.PropertyType.GenericTypeArguments[0], exstring).ToArray();
                            }
                            catch (ArgumentNullException)
                            {
                                return null;
                            }
                            for (int i = 0; i < set.Count(); i++)
                            {
                                var propcol = expand.Where(x =>
                                {
                                    return x.GetType().GetProperty(src.ForeignKey).GetValue(x).Equals(src.NavigationProperty.DeclaringType.GetProperty(src.Key).GetValue(set[i]));
                                });
                                object o = Activator.CreateInstance(src.NavigationProperty.PropertyType);
                                foreach (object p in propcol)
                                    o.GetType().GetMethod("Add").Invoke(o, new[] { p });
                                src.NavigationProperty.SetValue(set[i], o);
                            }
                        }
                        else
                        {
                            IEnumerable<object> expand = getData(src, src.NavigationProperty.PropertyType, exstring).ToArray();
                            for (int i = 0; i < set.Count(); i++)
                            {
                                // If ForeignKeyProperty is set it is a single Entry, otherwise it is a collection
                                src.NavigationProperty.SetValue(set[i], expand.FirstOrDefault(x =>
                                {
                                    return x.GetType().GetProperty(src.ForeignKey).GetValue(x).Equals(src.ForeignKeyProperty.GetValue(set[i]));
                                }));
                            }
                        }
                    }
                }
                return Ok(set.AsQueryable());
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        /// <summary>
        /// Gets a single entry of the entity set
        /// </summary>
        /// <param name="key">key of entity to get</param>
        /// <returns></returns>
        [EnableQuery(MaxExpansionDepth = 5, AllowedQueryOptions = Query.AllowedQueryOptions.All)]
        public virtual IHttpActionResult Get([FromODataUri] Tkey key)
        {
            T result = EntitySet.FirstOrDefault(p => getKey(p).Equals(key));
            if (result == null)
                return Ok(SingleResult<T>.Create(new List<T>().AsQueryable()));

            var expands = getExpands(Request.RequestUri.ToString());

            foreach (string exstring in expands)
            {
                if (externalsources != null)
                {
                    ExternalSource src;
                    externalsources.TryGetValue(Regex.Split(exstring, @"[/(]")[0].Trim(), out src);
                    if (src == null)
                        continue;
                    if (src.IsCollection)
                    {
                        IEnumerable<object> expand = getData(src, src.NavigationProperty.PropertyType.GenericTypeArguments[0], exstring).ToArray();
                        var propcol = expand.Where(x =>
                        {
                            return x.GetType().GetProperty(src.ForeignKey).GetValue(x).Equals(src.NavigationProperty.DeclaringType.GetProperty(src.Key).GetValue(result));
                        });
                        object o = Activator.CreateInstance(src.NavigationProperty.PropertyType);
                        foreach (object p in propcol)
                            o.GetType().GetMethod("Add").Invoke(o, new[] { p });
                        src.NavigationProperty.SetValue(result, o);
                    }
                    else
                    {
                        IEnumerable<object> expand = getData(src, src.NavigationProperty.PropertyType, exstring).ToArray();
                        // If ForeignKeyProperty is set it is a single Entry, otherwise it is a collection
                        src.NavigationProperty.SetValue(result, expand.FirstOrDefault(x =>
                        {
                            return x.GetType().GetProperty(src.ForeignKey).GetValue(x).Equals(src.ForeignKeyProperty.GetValue(result));
                        }));
                    }
                }
            }

            return Ok(SingleResult.Create<T>(new T[] { result }.AsQueryable()));
        }

        public virtual async Task<IHttpActionResult> Post(T entity)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            entity = await Task.Run(() => add(entity));
            return Created(entity);
        }

        public virtual async Task<IHttpActionResult> Patch([FromODataUri] Tkey key, Delta<T> update)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var entity = EntitySet.FirstOrDefault(x => getKey(x).Equals(key));
            if (entity == null)
                return NotFound();

            update.Patch(entity);
            await Task.Run(() => replace(entity));

            return Updated(entity);
        }
        public virtual async Task<IHttpActionResult> Put([FromODataUri] Tkey key, T update)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (!key.Equals(getKey(update)))
                return BadRequest();

            try
            {
                await Task.Run(() => replace(update));
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            return Updated(update);
        }

        public virtual async Task<IHttpActionResult> Delete([FromODataUri] Tkey key)
        {
            T product = EntitySet.FirstOrDefault(x => getKey(x).Equals(key));
            if (product == null)
                return NotFound();

            await Task.Run(() => remove(product));
            return StatusCode(HttpStatusCode.NoContent);
        }
        #endregion

        /// <summary>
        /// Gets data from another OData Service (relative, if not starting with http:// local service is used)
        /// </summary>
        /// <param name="src">External source (start with http:// to address other webservice)</param>
        /// <param name="retType">Type of the returned collection entries</param>
        /// <param name="expandstring">Expandstring received (for nested expands). For example: "User($expand=Friendlist)" will append the nested "$expand=Friendlist" to the http query</param>
        /// <returns></returns>
        private IEnumerable<object> getData(ExternalSource src, Type retType, string expandstring)
        {

            if (src == null)
                return null;

            Match minnerexpand = Regex.Match(expandstring, @"\((?<innerexpand>.*)\)");
            string innerexpand = null;
            if (minnerexpand.Success)
            {
                innerexpand = minnerexpand.Groups["innerexpand"].Value;
                foreach (string part in innerexpand.Split('&'))
                {
                    // Select statements without any tailing ) (this is the part in the () of the expand string.
                    Match select = Regex.Match(part, @"(?<start>\A\$select=)(?<statements>.*?)(?<end>\)|\Z)");
                    // If the key is not in the select statement
                    if (select.Success && !select.Groups["statements"].Value.Split(',').Contains(src.ForeignKey))
                    {
                        innerexpand = innerexpand.Replace(select.Value, select.Groups["start"].Value + select.Groups["statements"].Value + "," + src.ForeignKey + select.Groups["end"].Value);
                    }
                }
            }

            string requeststring;
            if (src.IsLocal)
                requeststring = Request.RequestUri.Scheme + Uri.SchemeDelimiter + Request.RequestUri.Host + (Request.RequestUri.IsDefaultPort ? "" : ":" + Request.RequestUri.Port) + "/" + (ExtendedODataConventionModelBuilder.RoutePrefix == null ? "" : ExtendedODataConventionModelBuilder.RoutePrefix + "/") + src.EntitySet + (minnerexpand.Success ? "?" + innerexpand : "");
            else
                requeststring = src.EntitySet + (src.IsCollection ? "" : "(" + src.ForeignKey + ")");

            //// It is a single entity append "(key)"
            //if(src.ForeignKeyProperty != null)
            //    requeststring += "(" + src.ForeignKeyProperty.GetValue()

            //do get request
            HttpWebRequest request = (HttpWebRequest)
                WebRequest.Create(requeststring);

            //TODO [ap] Ggf. die Header übertragen. Wird erstmal ignoriert (von Ui5 Requests übernommen)
            //foreach(var header in Request.Headers)
            //    try
            //    {
            //        switch(header.Key)
            //        {
            //            case "Connection":
            //                break;
            //            case "Accept":
            //                request.Accept = header.Value.Aggregate((a, b) => a + ";" + b);
            //                break;
            //            case "Host":
            //                request.Host = header.Value.Aggregate((a, b) => a + ";" + b);
            //            default:
            //                request.Headers.Add(header.Key, header.Value.Aggregate((a, b) => a + ";" + b));
            //                break;
            //        }
            //    }
            //    catch(Exception ex)
            //    {
            //        Debug.WriteLine($"Header '{header.Key}': '{header.Value}' not accepted: '{ex.Message}'");
            //    }

            request.Accept = "application/json;odata.metadata=minimal;IEEE754Compatible=true";
            request.Headers.Add("Accept-Encoding", "gzip, deflate");
            IEnumerable<string> hvals;
            if (Request.Headers.TryGetValues("Accept-Language", out hvals))
                request.Headers.Add(HttpRequestHeader.AcceptLanguage, hvals.Aggregate((a, b) => a + ";" + b));

            try
            {
                Debug.WriteLine("Cascaded Requesting: " + requeststring);

                HttpWebResponse response = null;
                try
                {
                    response = (HttpWebResponse)request.GetResponse();
                }
                catch (WebException ex)
                {
                    using (Stream errorstream = ex.Response.GetResponseStream())
                    {
                        throw new WebException(ReadResponse(errorstream), ex, ex.Status, ex.Response);
                    }
                }

                string responsecontent;

                using (Stream resStream = response.GetResponseStream())
                {
                    responsecontent = ReadResponse(resStream);
                }

                return DeserializeResponseObject(retType, responsecontent);
            }
            catch (WebException)
            {
                throw;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        private static IEnumerable<object> DeserializeResponseObject(Type retType, string responsecontent)
        {
            try
            {
                // deserialize data
                var jobj = JObject.Parse(responsecontent);
                var objects = jobj["value"].Children().ToList();
                List<object> res = new List<object>();
                foreach (var obj in objects)
                {
                    object o = System.Activator.CreateInstance(retType);
                    foreach (JProperty jprop in obj)
                    {
                        try
                        {
                            PropertyInfo pi = retType.GetProperty(jprop.Name);
                            if (pi.PropertyType == typeof(DateTime))
                                pi.SetValue(o, DateTime.Parse(jprop.Value.ToString()));
                            else if (pi.PropertyType == typeof(string))
                                pi.SetValue(o, jprop.Value.ToString());
                            else if (pi.PropertyType == typeof(bool))
                                pi.SetValue(o, JsonConvert.DeserializeObject(jprop.Value.ToString().ToLower(), pi.PropertyType));
                            else
                                pi.SetValue(o, JsonConvert.DeserializeObject(jprop.Value.ToString(), pi.PropertyType));
                        }
                        catch (Exception ex)
                        {
                            PropertyInfo pi = retType.GetProperty(jprop.Name);
                        }
                    }
                    res.Add(o);
                }
                return res;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        private static string ReadResponse(Stream resStream)
        {
            StringBuilder sb = new StringBuilder();
            byte[] buf = new byte[8192];
            string tempString = null;
            int count = 0;
            //read the data
            do
            {
                count = resStream.Read(buf, 0, buf.Length);
                if (count != 0)
                {
                    tempString = Encoding.ASCII.GetString(buf, 0, count);
                    sb.Append(tempString);
                }
            }
            while (count > 0);

            Debug.WriteLine("Received: " + sb.ToString());
            return sb.ToString();
        }

        /// <summary>
        /// Static regex for performance increase
        /// </summary>
        static readonly Regex expandstart = new Regex(@"\$expand\s*=", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        /// <summary>
        /// Gets the $expand Area of the uri. Will return an enumeration with all 
        /// </summary>
        /// <param name="uri">the whole uri of a request to extract the expands from</param>
        /// <returns>A list of the expand entries. For example: "$expand=Versions($expand=Responsible),Users,Host&$top=0" will result in { "Versions($expand=Responsible)", "Users", "Hosts" }</returns>
        private static List<string> getExpands(string uri)
        {
            StringBuilder sb = new StringBuilder(uri);
            var startex = expandstart.Match(uri);
            if (!startex.Success)
                return new List<string>();

            int start = startex.Index + startex.Length;
            List<string> expands = new List<string>();
            // i = current char counter / level = level of brackets
            // this algorithm searches for & or end of string. Round brackets will prevent &, if subexpands are done.
            // each , on level == 0 will add a new item to expands to get all expands.
            for (int i = start, level = 0; i < sb.Length; i++)
            {
                switch (sb[i])
                {
                    case '(':
                        level++;
                        continue;
                    case ')':
                        level--;
                        continue;
                    case ',':
                        if (level == 0)
                        {
                            expands.Add(sb.ToString().Substring(start, i - start).TrimStart());
                            start = ++i;
                        }
                        continue;
                    case '&':
                        if (level == 0)
                        {
                            expands.Add(sb.ToString().Substring(start, i - start).TrimStart());
                            return expands;
                        }
                        else
                            continue;
                    case ';':
                        // Replace ; with &, if it is on the first level, so the next expand can have additional arguments
                        if (level == 1)
                        {
                            sb[i] = '&';
                        }
                        continue;
                    default:
                        continue;
                }
            }
            expands.Add(sb.ToString().Substring(start).TrimStart());
            return expands;
        }

        /// <summary>
        /// Checks if the entity with the given key is in the entity set.
        /// </summary>
        /// <param name="key">key to check</param>
        /// <returns></returns>
        protected virtual bool IsEntityExisting(Tkey key)
        {
            try
            {
                return EntitySet.First(x => getKey(x).Equals(key)) != null;
            }
            catch (Exception)
            {
                return false;
            }
        }
    }
}