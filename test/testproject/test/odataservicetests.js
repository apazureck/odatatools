var MovieProxy = odatatools.MovieProxy;
var serviceuri = "http://localhost:2200/moviedb";
console.log("Starting Tests");
QUnit.test("Default test", function (assert) {
    assert.ok(1 === 1, "Passed!");
});
QUnit.test("Test Get", (assert) => {
    let comm = new MovieProxy(serviceuri, "Testproxy");
    let done = assert.async();
    comm.Addresses.Get().then((value) => {
        assert.ok(true);
        done();
    }).catch((err) => {
        assert.ok(false, JSON.stringify(err));
        done();
    });
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
    });
});
//# sourceMappingURL=odataservicetests.js.map