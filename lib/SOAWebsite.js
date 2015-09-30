!function(){

	var   Class 		= require('ee-class')
		, log 			= require('ee-log')
		, argv 			= require('ee-argv')
		, type 			= require('ee-types')
		, EventEmitter 	= require('ee-event-emitter')
		, fs 			= require('fs')
		, nunjucks 		= require('nunjucks')
		, Arguments 	= require('ee-arguments')
		, Webfiles 		= require('em-webfiles')
		, FSLoader 		= require('em-webfiles-loader-filesystem')
		, EventWaiter 	= require('./AsyncEventWaiter')
		, ConfigFile 	= require('ee-configfile');



	var dev = argv.has('dev-website');


	module.exports = new Class({
		inherits: EventEmitter

		, isWebsite: function() {
			return true;
		}


		, init: function(path, options) {
			if (options && options.maxAge) this._maxAge = options.maxAge;
			if (options && options.token) this.accessToken = options.token;

			// the nunjucks context to load
			this.middlewares = [];
			this.rewriteRules = [];

			this.waiter = new EventWaiter();
			this.waiter.on('load', function(err){
				if (dev) log.warn('soa-website was laoded ...');
				this.emit('load', err);
			}.bind(this));

			this.waiter.executeFor('nunjucks'); // increase counter for extensions that are beeing loaded
			this.waiter.executeFor('nunjucks'); // increase counter for filters that are beeing loaded

			this.waiter.executeFor('middleware'); // increase counter for middlewares that are beeing loaded
			this.waiter.setValue('middleware', this.middlewares);

			this.waiter.executeFor('rewrite'); // increase counter for middlewares that are beeing loaded
			this.waiter.setValue('rewrite', this.rewriteRules);

			this.configfile = new ConfigFile(path);
			this.config = this.configfile.getAll();

			if (!this.configfile.environment) {
				log.error('Please start the application using one of the following flags: live, staging, dev, testing. Never execute the live environment if you are not running on the live environment!');
				process.exit();
			}
			if (dev) log.warn('loading «'+this.configfile.environment+'» environment');

			this.path 				= path;
			this.templateRootPath 	= path+'/templates';
			this.rewriteRulePath 	= path+'/rewriteRules';
			this.wwwFilesPath 		= path+'/www'

			// add a middleware that writes the token on to the
			// request so that it can be written to the internal
			// request
			if (this.accessToken || this.config.accessToken) {
				this.middlewares.push({
					  hostnames 	: this.getDomains()
					, middleware 	: function(request, response, next) {

						if (this.accessToken) request.accessToken = type.object(this.accessToken) ? this.accessToken.toString() : this.accessToken;
						else if (this.config.accessToken) request.accessToken = this.config.accessToken;

						next();
					}.bind(this)
				});
			}

			if (dev) {
				log('Paths for ee-website module:');
				log.debug('Rootfolder'+this.path);
				log.debug('Templates Path'+this.templateRootPath);
				log.debug('WWW Files Path'+this.wwwFilesPath);
				log.debug('Rewrite Path'+this.rewriteRulePath);
			}


			this._loadWebFiles();

			// create a nunjucks context (sync)
			this.nunjucksEnvironment = new nunjucks.Environment(new nunjucks.FileSystemLoader(this.templateRootPath, this.config.nunjucks), this.config.nunjucks);
			this.waiter.setValue('nunjucks', this.nunjucksEnvironment);

			// laod rewrite rule (async)
			this._loadRewriteRules();
		}

		/**
		 * this method gets called from the class implementing this
		 * class. it indicates theat that class has added all its
		 * middleware. it doesnt indicate that that middleware was
		 * loaded completely, only that the are not any more middlewares
		 * to add to the webservice.
		 */
		, middlewareLoaded: function() {
			if (dev) log.warn('soa-website middlewares loaded ...');
			this.waiter.loadFor('middleware');
		}

		/**
		 * this method registers a new middleware. the middleware added
		 * here will be added to the webservice before the the rest transport
		 * middleware
		 */
		, registerMiddleware: function(middleware) {
			if (dev) log.warn('soa-website registering middleware for domains «'+this.getDomains()+'» ...');
			this.middlewares.push({
				  hostnames 	: this.getDomains()
				, middleware 	: middleware
			});
		}


		/**
		 * this method gets used by the rest-transport, it returns an
		 * array containing all the middleware which was added on this
		 * website
		 */
		, getMiddleware: function(callback) {
			if (dev) log.warn('soa-website returning middleware ...');
			this.waiter.waitFor('middleware', callback);
		}


		/**
		 * this method returns the confi laoded for the current environment
		 * or the user config which overrides all the other configs
		 */
		, getConfig: function() {
			return this.config;
		}


		/**
		 * returns all rewriterules laoded from the rewriteRules directory
		 */
		, getRewriteRules: function(callback) {
			this.waiter.waitFor('rules', callback);
		}


		/**
		 * returns the template root path
		 */
		, getTemplateRootPath: function() {
			return this.templateRootPath;
		}


		/**
		 * returns the nunjucks context used by the rest transport
		 */
		, getNunjucksEnvironment: function(callback) {
			this.waiter.waitFor('nunjucks', callback);
		}


		/**
		 * returns the lsit of domains stored in the config file
		 */
		, getDomains: function() {
			return this.config.domains || [];
		}


		/**
		 * this method gets called from the class implementing this
		 * class. it indicates that that class has added all its
		 * extensions used by nunjucks. the nunjucks context is
		 * completely loadedand can now be used by the rest transport
		 */
		, extensionsLoaded: function() {
			// create the nujucks context
			this.waiter.loadFor('nunjucks');
		}


		/**
		 * this method can be used to register extensiosn on the nunjucks
		 * environment. see http://mozilla.github.io/nunjucks/api.html#filesystemloader
		 * second argument.
		 */
		, registerExtension: function(name, extension) {
			this.nunjucksEnvironment.addExtension(name, extension);
		}




		, registerFilter: function() {
			var   args  		= new Arguments(arguments)
				, asyncFilter 	= args.getBoolean()
				, name 			= args.getString()
				, filter 		= args.getFunction();

			this.nunjucksEnvironment.addFilter(name, filter, asyncFilter);
		}


		, filtersLoaded: function() {
			this.waiter.loadFor('nunjucks');
		}


		/**
		 * this method loads the static ww files and adds it as
		 * middleware after any middleware added by the user
		 */
		, _loadWebFiles: function() {
			if (this.config.wwwFiles) {
				this.wwwFiles = new Webfiles({
					maxAge: this._maxAge
				});
				this.fsLoader = new FSLoader({path: this.wwwFilesPath});

				this.wwwFiles.use(this.fsLoader);
				this.registerMiddleware(this.wwwFiles);

				this.fsLoader.on('load', this.waiter.executeFor('middleware'));
			}
		}






		/**
		 * this method loads the rewriterules from the «rewriteRules» directory
		 * located in the folder of the clas simplementing this class.
		 */
		, _loadRewriteRules: function(){
			if (dev) log('loading rewrite rules «'+this.rewriteRulePath+'» ....');
			var complete = this.waiter.executeFor('rules');

			fs.readdir(this.rewriteRulePath, function(err, files){
				if (err) {
					log.error('Failed to laod rewrite rules from «'+this.rewriteRulePath+'» directory!');
					throw err;
				}
				else {
					files.sort();

					files.forEach(function(fileName){
						var   rulePath = this.rewriteRulePath+'/'+fileName
							, rules
							, rulesInstance;


						if (fileName && fileName.substr(-3) === '.js') {
							if (dev) log('loading rewrite rules from «'+rulePath+'» ....');

							try {
								rulesInstance = require(rulePath);
								rules = rulesInstance.getRules();
							}
							catch (err) {
								log.error('Failed to load rewrite rules file «'+rulePath+'»!');
								throw err;
							}

							// store
							this.rewriteRules = this.rewriteRules.concat(rules);
						}
						else if (dev) log('ignoring file «'+rulePath+'» ....');
					}.bind(this));
				}

				complete(null, this.rewriteRules);
			}.bind(this));
		}
	});
}();
