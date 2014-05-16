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
			this.rewriteRules = [];
			this._rulesLoaded = false;

			if (argv.has('live')) 			environment = 'live';
			if (argv.has('staging')) 		environment = 'staging';
			if (argv.has('dev')) 			environment = 'dev';
			if (argv.has('testing')) 		environment = 'testing';
			if (process.env.EE_ENV_TESTING) environment = 'testing';

			if (!environment) throw new Error('Please start the application using one of the following flags: live, staging, dev, testing. Never execute the live environment if you are not running on the live environment!');
			if (dev) log.warn('loading «'+environment+'» environment');

			this.path 				= path;
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

			// wait for the different load events, then fire the global load event
			this._loadWaiter();

			// laod config files (sync)
			this._loadConfig();

			// laod rewrite rule (async)
			this._loadRewriteRules();
		}



		, getMiddleware: function(){
			return this._middleware;
		}




		, getConfig: function() {
			return this.config;
		}



		, getRewriteRules: function(callback) {
			if (this._rulesLoaded) callback(null, this.rewriteRules);
			else {
				this.on('rulesLoaded', function(){
					this._rulesLoaded = true;
					this.getRewriteRules(callback);
				}.bind(this));
			}
		}



		, getTemplateRootPath: function() {
			return this.templateRootPath;
		}



		, getNunjucksContext: function() {
			return this.nunjucksContext;
		}




		, _loadWaiter: function(){
			var   executed = 0
				, expected = 1;

			var cb = function(){
				if (++executed === expected) this.emit('load');
			}.bind(this);

			this.on('rulesLoaded', cb);
		}




		, _loadConfig: function() {
			if (dev) log('loading config file «'+this.configPath+'» ...');
			try {
				this.config = require(this.configPath);
			} 
			catch (err) {
				log.error('Failed to load config file «'+this.configPath+'»!');
				throw err;
			}

			this.nunjucksContext.config = this.config.nunjucks;
		}




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
				
				this.emit('rulesLoaded');
			}.bind(this));
		}
	});
}();
