# RDF-JSONify

RDF-JSONify provides a RESTful interface to a RDF-Ext Store interface using JSON-LD objects.
HTTP methods are mapped to JavaScript methods.
JSON-LD is used to translate JSON objects to and from RDF-Interfaces objects.
The JSON-LD context can be passed as argument to the methods or by IRI based routing.

## JSON-LD Context Routing

Strings and RegExp are exepted to test matching IRIs.
A string routing is used, if the IRI starts with the given string.
The test method is used in the RegExp case.

## Classes

There are two classes for different use cases.

### JSONify

`JSONify` provides read and write access and uses Promises to handle the async Store API.

### CachedJSONify

`CachedJSONify` should be used for objects which are expected to be accessed multiple times during a single request.
Calls for uncached objects receive the objects by the callback function.
Cached objects are passed using the function return value.
Frameworks like React or AngularJS benefit from the combined sync/async API to reduce the state changes.
A reduced number of state changes also minimizes the DOM updates to speed up the application.