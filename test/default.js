

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
			assert.equal(JSON.stringify(config), '{"domains":["127.0.0.1.xip.io","*.127.0.0.1.xip.io"],"wwwFiles":true,"nunjucks":{"tags":{"variableStart":"{{","variableEnd":"}}"},"watch":true,"dev":false,"autoescape":true,"throwOnUndefined":false,"trimBlocks":false,"lstripBlocks":false}}');
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

		it('should be able to laod a filter', function(){
			instance.registerFilter('soWhat', function(){}, true);
			instance.filtersLoaded();
		});

		it('should be able to return a nunjucks context', function(done){
			instance.getNunjucksEnvironment(function(err, env){
				if (err) done(err);
				else {
					assert.ok(env);
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
					assert.ok(middewares.length === 2);
					done();
				}
			});
		});
	});
