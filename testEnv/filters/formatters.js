!function(){

	var   Class 		= require('ee-class')
		, log 			= require('ee-log');



	module.exports = new Class({

		async: true

		, filter: function() {
			return true;
		}
	});
}();
