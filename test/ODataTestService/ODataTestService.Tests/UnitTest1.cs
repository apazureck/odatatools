using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Linq;
using System.Text.RegularExpressions;
using System.Collections.Generic;

namespace ODataTestService.Tests
{
    [TestClass]
    public class UnitTest1
    {
        [TestMethod]
        public void TestExpandAlgorithm()
        {
            string[] teststrings =
            {
                "http://host/service/Categories?$skip=0&$take=5",
                "http://host/service/Categories?$expand = Products($filter = DiscontinuedDate eq null)&$skip=0&$xy=5",
                "http://host/service/Categories?$expand=Products/$ref,Versions($levels=3)",
                "http://host/service/Categories?$expand = Products / Sales.PremierProduct /$ref($filter = CurrentPromotion eq null&$skip=1&$take=5)",
                "http://host/service/Employees?$expand=Model.Manager/DirectReports($levels=3),Versions($levels=3)&$top=3",
                "http://host/service/Categories?$expand=*/$ref,Supplier",
                "http://host/service/Categories?$expand=*($levels=2)"
            };

            foreach(string s in teststrings)
            {
                //var res = getexpand(s);
                
            }
        }
    }
}
