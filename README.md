# ee-soa-website

This module can be used to add Websites to the ee-soa-transport-rest module. It enables the rendering of powerful templates on top of a restful API. You may add multiple websites to the transport which can be served on multiple domains on top of the service oriented architecture.

If your appllication makes use of this module you have to start it using one of the following flags:

- --dev -> your development environment
- --testing -> testing environment
- --staging -> staging environment
- --live -> live environment

For every flag tthere must be a separeate config file (config.dev.js, ..) which contains configurations like domain names used for the website.

## installation

	npm install ee-soa-website

## build status

[![Build Status](https://travis-ci.org/eventEmitter/ee-soa-website.png?branch=master)](https://travis-ci.org/eventEmitter/ee-soa-website)


## API

A Website that should be added to the REST transport must implement this module.

### Required Directory Structure

	/www/ -> static files that should be served for this website
	/rewriteRules/ -> rewriterules parsed by the ee-soa-rewrite modules
	/templates/ -> nunjucks templates
	/config.dev.js -> config parsed when using the --dev flag
	/config.testing.js -> config parsed when using the --testing flag
	/config.staging.js -> config parsed when using the --staging flag
	/config.live.js -> config parsed when using the --live flag
	/config.js -> optional config which overwrites all other configs if present


### API for Website implementers

#### Basic Example
	
	var SOAWebsite = require('ee-soa-website');

	module.exports = new Class({
		inherits: SOAWebsite

		, init: function init() {
			// we must call the super contructor
			init.super.call(this, __dirname);

			// when all middleware was regitered this method must 
			// be called so the the module knows what the status is
			this.middlewareLoaded();

			// when all extensions for nunjucks were loaded 
			// this method must be called
			this.extensionsLoaded();
		}
	});

#### Contructor

The class constructor must call its super contructor with the path of the folder where the templates, the rewriterules and the configfiles can be found as parameter 0.

	init.super.call(this, __dirname);

#### registerMiddleware

This method should be used to register middleware (for the ee-webservice which is running inside the rest-transport module). The middleware added using this method will be executed before all other middleware on the webservice, but only for the domains configured in the domains key of the config file. See the ee-webservice documentation for how th emidldeware must act in order to work with this module.
	
	// add a simple middleare that does nothing
	this.registerMiddleware(function(request, response, next){
		next();
	});

	// alternative syntax
	this.registerMiddleware({
		request: function(request, response, next){
			next();
		}
	});


#### registerExtension

This method should be used to register extensions for the nunjucks environment.

	this.registerExtension('extensionName', extension);


#### extensionsLoaded

This method must be called when all extensions were added.

	this.extensionsLoaded();

#### middlewareLoaded

This method must be called when all middleware was loaded and added.


#### config file

You have to create a config file for every environment you wish to use. The available environments are «dev», «testing», «staging» and «live». If you have a config file named «config.js» in your project dir that config file will be used instead of the environment specific config file.

config file namens:

- config.js
- config.dev.js
- config.testing.js
- config.staging.js
- config.live.js

You have to store at leas the follwing data in your config file:


    module.exports = {
          domains: ['myDomain.tld', '*.myDomain.tld']
        , wwwFiles: true
        , nunjucks: {
            tags: {
                  variableStart : '{{'
                , variableEnd   : '}}'
            }
        }
    };


- the domains array specifies on which hostnames this website should be used
- the flags if files from the www directory should be served as static files
- the nunjucks object is the second argument specified in the nunjucks filesystem loader, see http://mozilla.github.io/nunjucks/api.html#filesystemloader


### API for the REST-TRansport

The Module emits 4Different events and supports at the same time asynchronous methods for getting all required data.

Events: 

- load: everything was loaded
- middlewareLoaded: middleware were all loaded
- extensionsLoaded: all extensions were loaded
- rules: all rules were loaded

#### getConfig method

returns the contents of the config file

	var config = website.getConfig();

#### getMiddleware method

returns a list of completely loaded middlewares, with theis specific domains they should be executed on

	website.getMiddleware(function(err, middlewares){

	});


#### getRewriteRules method

returns a list of all rewrite rules

	website.getRewriteRules(function(err, rules){

	});

#### getNunjucksContext method

returns the nunjucks environement which shiould be used for the domains obtained via the getDomains method

	website.getNunjucksEnvironment(function(err, env){

	});

#### getDomains method

returns all domains this website should be executed on

	var domains = website.getDomains();