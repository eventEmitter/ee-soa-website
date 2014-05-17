
	
	var   Class 				= require('ee-class')
		, log 					= require('ee-log')
		, assert 				= require('assert')
		, travis 				= require('ee-travis')
		, APIEextension 		= require('ee-soa-extension-api');



	var SOAWebsite = require('../')
		, Website
		, instance;


	process.env.EE_ENV_TESTING = 1;


	describe('The SOAWebsite', function(){
		it('should be able to be inherited from', function(){
			Website = new Class({
				inherits: SOAWebsite

				, init: function init() {
					var basePath = __dirname.substr(0, __dirname.lastIndexOf('/'))+'/testEnv'
					init.super.call(this, basePath);
				}
			});

			instance = new Website();
		});


		it('should load the config file', function(){
			var config = instance.getConfig();
			assert.equal(JSON.stringify(config), '{"domains":["127.0.0.1.xip.io","*.127.0.0.1.xip.io"],"wwwFiles":true,"nunjucks":{"tags":{"variableStart":"{{","variableEnd":"}}"}}}');
		});

		it('should load the rewrite rules', function(done){
			instance.getRewriteRules(function(err, rules){
				if (err) done(Err);
				else {
					assert.equal(JSON.stringify(rules), '[{"domain":"test1.com","name":"ensure","field":"range","value":"1-10"},{"domain":"test1.com","name":"append","field":"filter","value":", deleted=null"},{"domain":"test1.com","name":"override","field":"select","value":"*"},{"domain":"test2.com","name":"alias","field":"","value":"rewritten.com"},{"domain":"rewritten.com","name":"ensure","field":"range","value":"1-20"},{"domain":"rewritten.com","name":"append","field":"filter","value":", deleted!=null"},{"domain":"test2.com","name":"append","field":"filter","value":", nonsense"},{"domain":"rewrite.test.local","name":"template","field":"range","value":"index.html"},{"domain":"rewrite.test.local","name":"ensure","field":"api-version","value":"1"}]');
					done();
				}
			});
		});

		it('should be able to laod an extension', function(){
			instance.registerExtension('api', new APIEextension({}));
			instance.extensionsLoaded();
		});

		it('should be able to return a nunjucks context', function(done){
			instance.getNunjucksEnvironment(function(err, env){
				if (err) done(err);
				else {
					assert.equal(JSON.stringify(env), '{"dev":false,"autoesc":false,"loaders":[{"pathsToNames":{},"searchPaths":["/home/em/dev/ee/ee-soa-website/testEnv/templates"],"listeners":{"update":[null]}}],"cache":{},"filters":{},"asyncFilters":[],"extensions":{"api":{"tags":["api"],"api":{},"_name":"api"}},"extensionsList":[{"tags":["api"],"api":{},"_name":"api"}]}');
					done();
				}
			});
		})

		it('should accept middlewares', function(){
			instance.registerMiddleware(function(request, response, next){
				next();
			});

			instance.middlewareLoaded();
		});

		it('should be able to return the list of middlewares', function(done){
			instance.getMiddleware(function(err, middewares){
				if (err) done(err);
				else {
					assert.equal(JSON.stringify(middewares), '[{"hostnames":["127.0.0.1.xip.io","*.127.0.0.1.xip.io"]},{"hostnames":["127.0.0.1.xip.io","*.127.0.0.1.xip.io"],"middleware":{"$events":{},"hashTree":{"/":{"isDirectory":true,"robots.txt":{"path":"/robots.txt","data":{"type":"Buffer","data":[105,39,109,32,97,110,32,105,110,118,97,108,105,100,32,100,111,99,117,109,101,110,116]},"filename":"robots.txt","abspath":"/home/em/dev/ee/ee-soa-website/testEnv/www/robots.txt","mimeType":"text/plain","charset":"UTF-8","etag":"88507f8789b818a9a888245e13fb766c","contentType":"text/plain; charset=UTF-8"}},"/robots.txt":{"path":"/robots.txt","data":{"type":"Buffer","data":[105,39,109,32,97,110,32,105,110,118,97,108,105,100,32,100,111,99,117,109,101,110,116]},"filename":"robots.txt","abspath":"/home/em/dev/ee/ee-soa-website/testEnv/www/robots.txt","mimeType":"text/plain","charset":"UTF-8","etag":"88507f8789b818a9a888245e13fb766c","contentType":"text/plain; charset=UTF-8"}},"tree":{"isDirectory":true,"robots.txt":{"path":"/robots.txt","data":{"type":"Buffer","data":[105,39,109,32,97,110,32,105,110,118,97,108,105,100,32,100,111,99,117,109,101,110,116]},"filename":"robots.txt","abspath":"/home/em/dev/ee/ee-soa-website/testEnv/www/robots.txt","mimeType":"text/plain","charset":"UTF-8","etag":"88507f8789b818a9a888245e13fb766c","contentType":"text/plain; charset=UTF-8"}},"filters":[],"directoryIndex":[],"modules":[{"$events":{"change":[{"once":false}],"addHash":[{"once":false}],"removeHash":[{"once":false}],"add":[{"once":false}],"remove":[{"once":false}]},"eventCache":{},"root":"/home/em/dev/ee/ee-soa-website/testEnv/www","persistent":false}],"path":"/home/em/dev/ee/ee-soa-website/testEnv/www"}}]');
					done();
				}
			});
		});
	});
	