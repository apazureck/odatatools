# ODataTools for VSCode

This extension targets to speed up access to an oData service to use it within *typescript*.

> **Important Note**: Changes from Version 1.0.0 are incompatible with earlier releases (0.4.0 and below). Please migrate your applications! Please use legacy settings, if you cannot migrate. **Older versions will not be extended or supported anymore!**

- Supported oData standards: **V4.0**
- Supported Languages: **Typescript**
- Create/Update *typescript* Interface declarations from oData service
- Create/Update *typescript* OData V4 client
  - Entity sets GET, PUT, POST, DELETE
  - Bound and unbound OData Actions and Functions
  - Asynchronous calls using `async await` (ES6+ and ES5/ES3 Promise shim)
  - Linq-like syntax for creating requests

## Example how to generate Typescript interfaces for your OData Service

![Demo](https://cdn.rawgit.com/apazureck/odatatools/master/images/demo1.gif)

## Usage / Quickstart

> For legacy usage (Version 0.4.0 and below) refer to the [ODataTools Wiki - Usage Version 0.4.0 and below](https://github.com/apazureck/odatatools/wiki/Usage-Version-0.4.0-and-below).

For instructions how to use this extensions have a look at the [ODataTools Wiki](https://github.com/apazureck/odatatools/wiki).

## Known Issues

- None

## Contribution

I created this extensions to fill my need using this with our oData services (ASP.NET oData V4.0). I tested it against the [northwind service](http://services.odata.org/V4/Northwind/Northwind.svc/) (mostly). I will extend this in the future, if I have any need to get things done. So please file an issue on github, I will have a look at it, how much work it will be to extend this. Or fork it and extend it on your own. Contribution is always welcome.

- [**Report a bug**](https://github.com/apazureck/odatatools/issues)
- [**Repository**](https://github.com/apazureck/odatatools/)