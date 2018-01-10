# Release Notes

All notable changes to the "odatatools" will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.2.0] 2017-12-15

### Added

* Version 2.0: Recently Used menu
* ISimpleType for simple types

### Fixed

* Nullable of Properties was not boolean, but string
* Template error: key did not set name in Child of Proxybase on entityset
* Expand in default typescript template does now allow any string
* Type collection of simple type could not be converted. Added ISimpleType interface to do so
* Typescript template handled if response did return undefined
* Fixed problems with void type (data was undefined)

## [1.1.0] 2017-12-05

### Added

* Version 2.0 in Insider mode supporting customizable templates

## [1.0.4] 2017-06-06

### Fixed

* Reject and resolve were mixed up in OData Actions and Functions
* Get does not return the entity array

## [1.0.3] 2017-06-06 - Hotfix 3

### Fixed

* Errors in package.json
* Error outputs to terminal

## [1.0.2] 2017-06-06 - Hotfix 2

### Added

* Missing module `'request'`

## [1.0.1] 2017-06-06 - Hotfix 1

### Changed

* Changelog is now closer to keepachangelog style

### Fixed

* Select method did return wrong class

## [1.0.0] 2017-06-05 - Typescript 2.1+ overhaul

### Added

* Setting: Extension Version selection to be able geting old behavior (0.x)
* Setting: Insider mode (Not used for anything so far)
* Async and await ES3/5/6+ Proxy
* Additional request options for interface generation (only version 1.0+) **Not tested**
* Additional request options for proxy generation (only version 1.0+) **Not tested**
* Options in proxy file header

### Changed

* Changelog file is now structured as suggested by keep a changelog
* Hook in interface file is now json format (only version 1.0+)
* Hooks are now pasted at the start with generation notes (only version 1.0+)
* Last address is now saved permanently (recently used list)
* Request syntax in proxy (only version 1.0+)

### Deprecated

* Version 0.4.0 and below custom classes (Thenable caller, etc.)
* Support for version 0.4.0 and below

### Removed

* Delta classes generation when generating interfaces (only Version 1.0+)

## [0.4.0] OData Actions and Functions

### Added

* OData V4 client generator can now handle bound and unbound actions and Functions
* OData V4 client allows custom headers in constructor (experimental - not tested)

### Changed

* OData V4 Client generator takes now namespace and container name for generated proxy

## [0.3.0] OData Client

### Added

* OData V4 client generator (experimental)

### Fixed

* Enums are now string Enums
* Errors when creating interfaces are now caught and printed out

### [0.3.1] Hotfix

### Fixed

* OData Client switched name and address in constructor

## [0.2.0] Ambient and modular declarations

### Fixed

* d.ts files will now cause `declare` statements before `namespace`

## [0.1.0] Interface Generator

* Added Interface Generator