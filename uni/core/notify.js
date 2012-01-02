(function(window, document, undefined) {    
	
uni.hoist('notify', function(msg, typ, obj) {
	
	uni.notify("NOTE: ");
	uni.notify(msg);
});


    
})(this, document)