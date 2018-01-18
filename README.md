# Odata V4 Client Generator for VSCode

This extension targets to speed up access to an oData service to use it within *typescript*.

> **Important Note**: Version 1.0 will not be supported anymore. Please use Version 2.0. The generated typescript client is fully compatible to the old version + additional bound functions and actions. You can now modify the template and customize it to fit your needs. Just have a look at `${workspaceFolder}/.vscode/odatatools/templates/proxy.ot` and at the [ODataTools Wiki](https://github.com/apazureck/odatatools/wiki).

Changes from Version 1.0.0 are incompatible with earlier releases (0.4.0 and below). Please migrate your applications! Please use legacy settings, if you cannot migrate. **Older versions will not be extended or supported anymore!**

- Supported oData standards: **V4.0**
- Supported Languages: **Typescript**
- Create/Update *typescript* Interface declarations from oData service
- Create/Update *typescript* OData V4 client
  - Entity sets GET, PUT, POST, DELETE
  - Bound and unbound OData Actions and Functions
  - Asynchronous calls using `async await` (ES6+ and ES5/ES3 Promise shim)
  - Linq-like syntax for creating requests
- **[Version 2.0: Create your own proxy using handlebars templates](https://github.com/apazureck/odatatools/wiki/Custom-Templates)**

## Usage / Quickstart

### Simple Service

1. Create a file (for example `proxy.ts`)
1. Run command `Create proxy client from OData V4.0 Service`
1. Select `New Entry...`
1. Type in the address for your service $metadata (don't forget 'http://'!). For example: `http://services.odata.org/Experimental/OData/(S(oekaxtj3dth11xxesirucjwq))/OData.svc/$meatadata`
1. The data should now get pasted in your currently opened document.

After that a folder `${workspaceFolder}/.vscode/odatatools/`, which contains a file in the folder `templates` called proxy.ot. You can modify this file to your liking using handlebars. See the [Wiki](https://github.com/apazureck/odatatools/wiki/Custom-Templates) for more detail.

### Update

Just run the command `Update proxy client from OData V4.0 Service`.

### Custom headers / protected access

1. Run the create command to your Odata Url as described above. Your request will fail, but the header should be created in the file.
1. Edit the `requestOptions` in the generated header. See [Wiki](https://github.com/apazureck/odatatools/wiki#update-and-header-manipulation) for more information.

### Older versions

Do not use Version 1.0 anymore. Version 2.0 will provide the same client + you can customize your client.

For legacy usage (Version 0.4.0 and below) refer to the [ODataTools Wiki - Usage Version 0.4.0 and below](https://github.com/apazureck/odatatools/wiki/Usage-Version-0.4.0-and-below).

For instructions how to use this extensions have a look at the [ODataTools Wiki](https://github.com/apazureck/odatatools/wiki).

## Known Issues

- None

The service is tested against the service in the repo. In future release I hope to create some kind of test framework to check custom templates again, [please report issues on the github page](https://github.com/apazureck/odatatools/issues)

## Contribution

I created this extensions to fill my need using this with our oData services (ASP.NET oData V4.0). I tested it against the [northwind service](http://services.odata.org/V4/Northwind/Northwind.svc/) (mostly). I will extend this in the future, if I have any need to get things done. So please file an issue on github, I will have a look at it, how much work it will be to extend this. Or fork it and extend it on your own. Contribution is always welcome.

- [**Report a bug**](https://github.com/apazureck/odatatools/issues)
- [**Repository**](https://github.com/apazureck/odatatools/)