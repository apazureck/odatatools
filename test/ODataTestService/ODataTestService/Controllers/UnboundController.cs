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
        public IHttpActionResult SetSomething(int value)
        {
            return Ok(value);
        }
    }
}