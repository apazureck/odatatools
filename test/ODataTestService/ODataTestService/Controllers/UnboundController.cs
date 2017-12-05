using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.OData;
using System.Web.OData.Routing;

namespace ODataTestService.Controllers
{
    public class UnboundController : ODataController
    {
        [HttpGet]
        [ODataRoute("CurrentTime")]
        public IHttpActionResult CurrentTime()
        {
            return Ok(DateTime.Now);
        }

        [HttpPost]
        [ODataRoute("SetSomething")]
        public IHttpActionResult SetSomething(ODataActionParameters parameters)
        {
            var l = new List<int>();
            l.Add((int)parameters["value"]);
            return Ok(SingleResult.Create(l.AsQueryable()));
        }

        [HttpGet]
        [ODataRoute("GetSomething(value={value})")]
        public IHttpActionResult GetSomething([FromODataUri]int value)
        {
            var l = new List<int>();
            l.Add(value);
            return Ok(SingleResult.Create(l.AsQueryable()));
        }
    }
}