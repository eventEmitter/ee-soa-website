!function(){

	var   Class 		= require('ee-class')
		, log 			= require('ee-log')
		, argv 			= require('ee-argv')
		, EventEmitter 	= require('ee-event-emitter');


	var dev = argv.has('dev-website');




	module.exports = new Class({
		inherits: EventEmitter
		
		, init: function() {
			Class.define(this, '_events', Class({}));
			this.expected = 0;
			this.executed = 0;
		}


		, setValue: function(name, value) {
			var storage = this._createEventStorage(name);
			storage.value = value;
		}


		, waitFor: function(name, callback) {
			var storage = this._createEventStorage(name);

			process.nextTick(function(){
				if (storage.executed === storage.expected) {
					callback(storage.err, storage.value);
				}
				else storage.callbacks.push(callback);
			}.bind(this));			
		}


		, loadFor: function(name, err, value) {
			var storage = this._createEventStorage(name);

			this._checkExecute(storage, err, value);
		}


		, _checkExecute: function(storage, err, value) {
			if (err && !storage.err) storage.err = err;
			if (value) storage.value = value;

			if (++storage.executed === storage.expected) {
				// go
				storage.callbacks.forEach(function(cb){
					cb(storage.err, storage.value);
				}.bind(this));

				if (err && !this.err) this.err = err;

				if (++this.executed === this.expected) {
					this.emit('load', this.err);
				}
			}
		}


		, executeFor: function(name) {
			var storage = this._createEventStorage(name);
			storage.expected++;

			return function(err, value) {
				this._checkExecute(storage, err, value);
			}.bind(this);
		}


		, _createEventStorage: function(name) {
			if (!this._events[name]) {
				this._events[name] = {callbacks:[], executed: 0, expected: 0};
				this.expected++;
			}

			return this._events[name];
		}
	});
}();
