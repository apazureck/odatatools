## ODataTools for VSCode

This extension targets to speed up access to an oData service to use it within *typescript*.

> Supported oData standards: **V4.0**

> Supported Languages: **Typescript** (and, thus Javascript)

- Create/Update *typescript* Interface declarations from oData service
- Create *typescript* OData V4 client (**Beta**)
  - Entity sets GET, PUT, POST, DELETE
  - Bound and unbound OData Actions and Functions

### Table of Content

<!-- TOC -->

1. [ODataTools for VSCode](#odatatools-for-vscode)
    1. [Table of Content](#table-of-content)
    2. [Requirements](#requirements)
    3. [Extension Settings](#extension-settings)
    4. [Usage](#usage)
        1. [Get and update Interfaces from oData service](#get-and-update-interfaces-from-odata-service)
        2. [Create OData V4 client (EXPERIMENTAL)](#create-odata-v4-client-experimental)
    5. [Usage of OData V4 client (EXPERIMENTAL)](#usage-of-odata-v4-client-experimental)
        1. [Get](#get)
        2. [Post](#post)
        3. [Put](#put)
        4. [Patch](#patch)
        5. [Error Handling](#error-handling)
        6. [Delete](#delete)
        7. [Actions and Functions](#actions-and-functions)
        8. [Custom headers](#custom-headers)
2. [Known Issues](#known-issues)
3. [Contribution](#contribution)

<!-- /TOC -->

### Requirements

- None (except you are using typescript)

### Extension Settings

- None

### Usage

#### Get and update Interfaces from oData service

Open up a new file and name it with ending '.ts'. Just press `CTRL+SHIFT+P` (Linux and Windows) `CMD+SHIFT+P` on Mac OS and type "*odata*". The commands will show up. The example animation below shows the generation of interfaces for the [northwind service](http://services.odata.org/V4/Northwind/Northwind.svc/) (V4.0). When generating the interfaces for the first time you have to specify the service URL with or without `$metadata` at the end.

![Demo](https://cdn.rawgit.com/apazureck/odatatools/master/images/demo1.gif)

#### Create OData V4 client (EXPERIMENTAL)

To create an Odata V4  just press `CTRL+SHIFT+P` (Linux and Windows) `CMD+SHIFT+P` on Mac OS and type "*odata*". Select "*OData: Create Proxy*".
1. Give the url of the odata service. Make sure to start with "**http://**"
2. Give the name for your OData class.
3. Put in "a" for creating an ambient variation or anything else for a modular version. When using ambient version make sure to load "odatajs-4.0.0.js" and "odataproxbyse.js" before using the service

### Usage of OData V4 client (EXPERIMENTAL)

The client will create a proxy class with the entity sets of the selected OData service, as shown in this example:

```typescript
import ProxyBase = odatatools.ProxyBase; import EntitySet = odatatools.EntitySet;

class MyProxy extends ProxyBase {
    constructor(name: string, address: string) {
        super(name, address);
        this.Movies = new EntitySet<ODataTestService.Models.Movie, ODataTestService.Models.DeltaMovie>("Movies", address, "Id");
        this.Customers = new EntitySet<ODataTestService.Models.Customer, ODataTestService.Models.DeltaCustomer>("Customers", address, "Id");
        this.Addresses = new EntitySet<ODataTestService.Models.Address, ODataTestService.Models.DeltaAddress>("Addresses", address, "Id");
    }
    Movies: EntitySet<ODataTestService.Models.Movie, ODataTestService.Models.DeltaMovie>;
    Customers: EntitySet<ODataTestService.Models.Customer, ODataTestService.Models.DeltaCustomer>;
    Addresses: EntitySet<ODataTestService.Models.Address, ODataTestService.Models.DeltaAddress>;
}
```

#### Get

Gets the entity set, or one entry by giving the ID:
```typescript
import Movie = ODataTestService.Models.Movie;

let client = new MyProxy("MyProxy", "localhost:8800/odata");
// Get whole set
client.Movies.Get().then((value) => {
    ...
}).catch((error) => {
    ... Error Handling ...
});
// Get single entry
client.Movies.Get(1).then((value) => {
    ...
});
// Get whole set with additional expand syntax (any odata query option allowed)
client.Movies.Get("$expand=Owner"). then((value) => {
    ...
});
```

#### Post

Adds a new entry to the entity set:
```typescript
...
let tmp = { Name: "Alien", Director: "Ridley Scott", Cast: "Tom Skerritt, Sigourney Weaver", ... }
client.Movies.Post(tmp).then((newValue) => {
    ...
});
```

#### Put

Replaces an entry in the entity set.
```typescript
...
client.Movies.Get(1).then((movie) => {
    movie.Cast += ", Veronica Cartwright";
    client.Movies.Put(movie); // No return value: Thenable<void>
});
```

#### Patch
Patches an element in the entity set. You can give a delta (interface is automatically generated when querying the interfaces) or get the delta by giving an old value and new value. Here is an example for using delta:
```typescipt
import MovieDelta = ODataTestService.Models.MovieDelta;
...
let delta: MovieDelta = {
    Id: 1,
    Screenplay: "Dan O'Bannon"
}
client.Movies.Patch(MovieDelta); // No return value: Thenable<void>
```

#### Error Handling
Each function can also return an error callback, which can be caught with the function
```typescript
(error) => {
    ... Error Handling ...
}
```

#### Delete
Deletes an entry from the entity set.
```typescript
...
let movie = client.Movies.Get(1);
movie.Cast += ", Veronica Cartwright";
client.Movies.Put(movie);
```

#### Actions and Functions

Actions and functions *(short: methods)* will be created, if specified. All bound methods will be added to the collection. For each entity set that contains bound functions a class will be generated.

Bound methods to entities will have the key as first parameter. Bound functions to the entire collection will not require such a key. Actions will have the input parameters set in the method body, functions will have the parameters set in the request uri. Unbound methods will be directly on the controller.

For an example see the [test section](https://github.com/apazureck/odatatools/tree/master/test/testproject) in the repository.

#### Custom headers

Since 0.4.0 you can add custom headers. You can also overwrite the default headers. By default two headers are added: `"Content-Type": "application/json"` and `Accept: "application/json"`.

## Known Issues

- None

## Contribution

I created this extensions to fill my need using this with our oData services (ASP.NET oData V4.0). I tested it against the [northwind service](http://services.odata.org/V4/Northwind/Northwind.svc/). I will extend this in the future, if I have any need to get things done. So please file an issue on github, I will have a look at it, how much work it will be to extend this. Or fork it and extend it on your own. Contribution is always welcome.

- [**Report a bug**](https://github.com/apazureck/odatatools/issues)
- [**Repository**](https://github.com/apazureck/odatatools/)