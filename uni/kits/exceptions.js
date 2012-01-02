(function(window, document, undefined) {


var eCodes		= {},
	exceptions	= {};

uni.addKit('exceptions', {

	//	#registerCode
	//
	//	Allows you to tie a specific error message to an error code.  You can then send this
	//	error code #myException, with will translate that code to a report message.
	//
	//	@param		{String}		c		The code.
	//	@param		{String}		m		The message.
	//
	//	@example							.registerCode('404', 'Not found...')
	//										.exception('404') // message is: 'Not Found...'
	//
	registerCode: 		function(c, m) {
		eCodes[c] = m;
	},

	//	#create
	//
	//	Creates an exception, which can be fired via uni#myExceptionName.
	//
	//	@param		{String}		eName		The name of the exception.
	//	
	create: function(eName) {
			
		// 	Note how here we're actually extending the $exception kit.
		//
		uni.exceptions[eName] = function(eInfo) {

			//	We want to allow this method to be called directly (uni.exception.myException(msg)),
			//	or (more likely) as a thrown error object (throw uni.exception.myException(msg)).
			//	The key difference is that `this` would mean different things: in the first case
			//	it would be an Object, in the second it would reference the object returned by a 
			//	constructor.  We don't want to pollute an Object with `name` and `message` attributes.
			//	So we assign those properties to different objects, depending.
			//
		    var	s = this.$ ? {} : this;
		    
	        //	$eInfo may be an error code, or simply the error message.
	        //	Just check if we have a registered code for it, and if not
	        //	then assume it is the message.  
	        //        
	        s.name 		= eName,
	        s.message 	= eCodes[eInfo] || eInfo
	   
	        //	When errors occur we notify observers.
	        //                       
	        //	@see		#create
	        //
	        uni.fire('exception:' + eName, s);
		};  
	}
});




})(this, document)