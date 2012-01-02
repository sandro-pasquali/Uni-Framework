(function() {

var out = function(m, sig) {

	var ns 	= sig.ctxt.ns._,
	k = 'uni#' + ns.isKit ? ns.id : '';
	k += '#' + sig.method;
	
	uni.notify('> ' + m + ' ' + k); 
	uni.notify(sig);

}

uni
	.advise({
		_before: function(sig) { 
			//out('before', sig);
		},
				
		_after: function(sig) { 
			//out('after', sig);
		},
				
		_afterError: function(sig) {
			out('afterError', sig);
		}
	});
})()