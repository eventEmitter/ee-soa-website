# ee-soa-website

This module can be used to add Websites to the ee-soa-transport-rest module. It enables the rendering of complex templates on top of a restful API. You may add multiple websites to the transport, this makes it possible to run multiple websites on thesame set of services.

## installation

	npm install ee-soa-website

## build status

[![Build Status](https://travis-ci.org/eventEmitter/ee-soa-website.png?branch=master)](https://travis-ci.org/eventEmitter/ee-soa-website)


## API

A Website that should be added to the REST transport msut implement this module.

### API for Website implementers

#### Basic Example
	
	var SOAWebsite = require('ee-soa-website');

	module.exports = new Class({
		inherits: SOAWebsite

		, init: function init() {
			init.super.call(this, __dirname);

			// when all middleware was regitered this method must be called
			this.middlewareLoaded();

			// when all extensions for nunjucks were loaded this method must be called
			this.extensionsLoaded();
		}
	});

#### Contructor

The class constructor must call its super contructor with the path of the folder where the temapltes, the rewriterules and the configfiles can be found as parameter 0.

	init.super.call(this, __dirname);

#### registerMiddleware

This method should be used to register middleware that will be executed before all other middleware on this domai