!function(){

	var   Class 		= require('ee-class')
		, log 			= require('ee-log')
		, argv 			= require('ee-argv')
		, EventEmitter 	= require('ee-event-emitter')
		, fs 			= require('fs');

	var dev = argv.has('dev-website');




	module.exports = new Class({
		inherits: EventEmitter

		, isWebsite: function() {
			return true;
		}


		, init: function(options, path) {
			var environment;

			// the nunjucks context to load
			this.nunjucksContext = {};
			this.middlewares = [];
			this.rewriteRules = [];


			this._initilizeLoadingStatus();


			if (argv.has('live')) 			environment = 'live';
			if (argv.has('staging')) 		environment = 'staging';
			if (argv.has('dev')) 			environment = 'dev';
			if (argv.has('testing')) 		environment = 'testing';
			if (process.env.EE_ENV_TESTING) environment = 'testing';

			if (!environment) throw new Error('Please start the application using one of the following flags: live, staging, dev, testing. Never execute the live environment if you are not running on the live environment!');
			if (dev) log.warn('loading «'+environment+'» environment');

			this.path 				= path;
			this.userConfigPath 	= path+'/config.js';
			this.configPath 		= path+'/config.'+environment+'.js';
			this.templateRootPath 	= path+'/templates';
			this.rewriteRulePath 	= path+'/rewriteRules';

			if (dev) {
				log('Built paths for ee-website module:');
				log.debug('Rootfolder'+this.path);
				log.debug('Config Path'+this.configPath);
				log.debug('Templates Path'+this.templateRootPath);
				log.debug('Rewrite Path'+this.rewriteRulePath);
			}

			// laod config files (sync)
			this._loadConfig();

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
			this._loaded('middleware', this.middlewares);
		}

		/**
		 * this method registers a new middleware. the middleware added
		 * here will be added to the webservice before the the rest transport
		 * middleware
		 */
		, registerMiddleware: function(middleware) {
			this.middlewares.push(middleware);
		}


		/**
		 * this method gets used by the rest-transport, it returns an
		 * array containing all the middleware which was added on this 
		 * website
		 */
		, getMiddleware: function(callback){
			this._isLoaded('middleware', callback);
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
			this._isLoaded('rules', callback);
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
		, getNunjuckContext: function(callback) {
			this._isLoaded('extensions', callback);
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
			this._loaded(extensions, this.nunjucksContext);
		}


		/**
		 * internal status for the different load status
		 */
		, _initilizeLoadingStatus: function() {
			this._status: {
				  middleware: 	{ loaded: false, callbacks: []}
				, extensions: 	{ loaded: false, callbacks: []}
				, rules: 		{ loaded: false, callbacks: []}
				, loaded: 0
				, count: 3
			}
		}

		/**
		 * this method gets called when a component was loaded successfull
		 */
		, _loaded: function(what, value) {
			this._status[what].loaded = true;
			this._status[what].value = value;
			this._status[what].callbacks.forEach(function(cb){cb(null, value);});
			this.emit(what+'Load');

			if (++this._status.loaded === this._status.count) this.emit('load');
		}


		/**
		 * this method calls the callback when a specific component was laoded
		 * completely
		 */ 
		, _isLoaded: function(what, callback) {
			if (this._status[what].loaded) callback(null, this._status[what].value);
			else this._status[what].callbacks.push(callback);
		}




		/**
		 * this method loads the config file of the current environment. if it 
		 * finds a user config (config.js) it replaces the environment
		 * config with the users config
		 */ 
		, _loadConfig: function() {
			if (dev) log('loading config file «'+this.configPath+'» ...');
			try {
				this.config = require(this.configPath);
			} 
			catch (err) {
				log.error('Failed to load config file «'+this.configPath+'»!');
				throw err;
			}

			// try to load the user config
			if (dev) log('loading config file «'+this.userConfigPath+'» ...');
			try {
				this.config = require(this.userConfigPath);
			} 
			catch (err) {}
		}



		/**
		 * this method loads the rewriterules from the «rewriteRules» directory
		 * located in the folder of the clas simplementing this class.
		 */ 
		, _loadRewriteRules: function(){
			if (dev) log('loading rewrite rules «'+this.rewriteRulePath+'» ....');

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

				this._loaded('rules', this.rewriteRules);
			}.bind(this));
		}
	});
}();
