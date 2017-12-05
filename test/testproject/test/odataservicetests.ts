import MovieProxy = MovieService.MovieContainer;

var serviceuri = "http://localhost:2200/moviedb";
console.log("Starting Tests");
QUnit.test("Default test", function (assert) {
  assert.ok(1 === 1, "Passed!");
});

QUnit.test("Test Get", async (assert) => {
  let comm = new MovieProxy(serviceuri, "Testproxy");
  let done = assert.async();

  try {
    await comm.Addresses.Get();
    assert.ok(true, "Passed get all");
    await comm.Addresses.Select("Id").Get("1");
    assert.ok(true, "Passed get one with select");
    done()
  } catch (error) {
    assert.ok(false, JSON.stringify(error));
    done();
  }
});

QUnit.test("Test Post", (assert) => {
  let comm = new MovieProxy(serviceuri, "Testproxy");

  let done = assert.async();

  comm.Addresses.Post({
    Id: 0, Street: "123 Fakestreet", Zip: "123456"
  }).then((value) => {
    assert.ok(true);
    done();
  }).catch((err) => {
    assert.ok(false, JSON.stringify(err));
    done();
  })
});

QUnit.test("Test Rate Action", (assert) => {
  let comm = new MovieProxy(serviceuri, "Testproxy");

  let done = assert.async();

  comm.Movies.Rate(0, 2.5, "This is not a good movie.").then((value) => {
    assert.ok(value === "Rated  successfully");
    done();
  }).catch((err) => {
    assert.ok(false, JSON.stringify(err));
    done();
  })
});

QUnit.test("Test Unbound Action", (assert) => {
  let comm = new MovieProxy(serviceuri, "Testproxy");

  let done = assert.async();
  comm.SetSomething(25).then((value) => {
    assert.ok(value === 25);
    done();
  }).catch((err) => {
    assert.ok(false, JSON.stringify(err));
    done();
  })
});

QUnit.test("Test Unbound Function", (assert) => {
  let comm = new MovieProxy(serviceuri, "Testproxy");

  let done = assert.async();

  comm.CurrentTime().then((value) => {
    let curtime = new Date(value);
    assert.ok(curtime != undefined);
    done();
  }).catch((err) => {
    assert.ok(false, JSON.stringify(err));
    done();
  })
});