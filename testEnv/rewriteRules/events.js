
	var rules = [
		  {domain: 'test1.com', name: 'ensure',   field: 'range', value: '1-10'}
        , {domain: 'test1.com', name: 'append',   field: 'filter', value: ', deleted=null' }
        , {domain: 'test1.com', name: 'override', field: 'select', value: '*' }
        , {domain: 'test2.com', name: 'alias',    field: '', value: 'rewritten.com' }
        , {domain: 'rewritten.com', name: 'ensure', field: 'range', value: '1-20'}
        , {domain: 'rewritten.com', name: 'append', field: 'filter', value: ', deleted!=null'}
        , {domain: 'test2.com', name: 'append', field: 'filter', value: ', nonsense' }
        , {domain: 'rewrite.test.local', name: 'template',   field: 'range', value: 'index.html'}
        , {domain: 'rewrite.test.local', name: 'ensure',   field: 'api-version', value: '1'}
    ];


	module.exports = {
		getRules: function() {
			return rules;
		}
	}