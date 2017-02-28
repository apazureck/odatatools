using ODataTestService.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.OData;

namespace ODataTestService.Controllers
{
    public class MoviesController : ODataBaseController<Movie, int>
    {
        public MoviesController()
        {
            datasource.Add(new Movie
            {
                Avaiable = true,
                Id = 1,
                LenderId = 1,
                Rating = 1
            });
            datasource.Add(new Movie
            {
                Avaiable = false,
                Id = 2,
                LenderId = 1,
                Rating = 2
            });
        }
        private List<Movie> datasource = new List<Movie>();
        protected override IEnumerable<Movie> EntitySet
        {
            get
            {
                return datasource;
            }
        }

        protected override Movie add(Movie entity)
        {
            datasource.Add(entity);
            entity.Id = datasource.Count;
            return entity;
        }

        protected override int getKey(Movie entity)
        {
            return entity.Id;
        }

        protected override void remove(Movie entity)
        {
            datasource.Remove(entity);
        }

        protected override void replace(Movie entity)
        {
            datasource[entity.Id - 1] = entity;
        }

        [HttpPost]
        public async Task<IHttpActionResult> ResetRating([FromODataUri] int key, ODataActionParameters parameters)
        {
            return await Task.Run(() =>
            {
                return Ok();
            });
        }
    }
}