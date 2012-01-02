//	%xhr
//
//	A kit providing an xmlhttprequest interface, with methods:
//
//	#get
//	#post
//	#getJson
//	#getXml
//



(function(window, document, undefined) {

	//	See below for how this processor is used. 
	//
var XmlProcessor = function() {},

	//	Each xhr request for xml will add this facade to the returned request object, in the
	//	namespace requestObject#Xml.  See %xhr implementation.
	//
	XmlFacade = function(respObj) {
	
		//	Instantiate the above processor.  We aren't going to use it "out of the box", but will 
		//	create a facade for manipulation of xml documents, for which it will satisfy the
		//	#xpath and #transform methods. 
		//
		var XP 	= new XmlProcessor,
			d	= XP.parse(respObj.handle.responseText);

		this.transform = function(xslt) { 
			XP.loadXslt(xslt);
			return XP.transform();
		};

		this.getElementsByTagName = function(nm)  {
			return d.getElementsByTagName(nm)
		};
		
		this.xpath = function(q) {
			return XP.xpath(q);
		};
		
		this.document = function() {
			return d;
		};
	},

	//	Default headers set on every request.
	//
	defaultH	= {
		'Accept':	'applications/json, application/xml, text/javascript, text/plain, text/html, text/xml, */*'
	},

	//	Stores response data from GETs.
	//	
	//	@see		#main
	//
	cache		= {},
	
	//	Will be used when we need to strip <script> tags.
	//
	stripScripts	= /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*(?:<\/script>|$)/gi,

	//	A Factory which creates an object which will be attached to the uni#auditors list.  Its
	//	#main routine continues to be checked until it finds that its xhr request has returned.
	//	At which point the #main routine will augment the call object where necessary (adding
	//	an xml facade, for instance), then execute all relevant handlers, and finally indicate
	//	that it is done, which will result in it being removed from the audit list.
	//
	xhr = function(a) {
		return {
			handle:	window.ActiveXObject	? new ActiveXObject("Microsoft.XMLHTTP") 
											: new XMLHttpRequest(),
			
			//	Will return you the status code for a request.  
			//
			status: function() {
			
				var s = this.handle.status;
	
				//	IE will set status for 204 to this strange code... adjust.
				//
				if(s == 1223) {
					return 204;  
				}
				  
				return s;
			},
			
			//	Use this method to set and get header values.  Sending a header key will retrieve
			//	the header with that name. Send a second value argument to set that value.
			//
			//	@param		{String}		k		The header key to work with.
			//	@param		{String}		[v]		If sent a value, will set.
			//
			header: function(k,v) {
			
				if(!v) {
					return this.handle.getResponseHeader(k); 
				}
				
				this.handle.setRequestHeader(k, v);
			},
	
			//	     
			setDefaultHeaders: function() {
				for(var h in defaultH) {
					this.header(h, defaultH[h]);
				}
			},
	
			//	This block is running within an #until request.  The value of $readyState
			//	is the cancellation flag.  On an async request, we wait for the `completed`
			//	value.  A sync request will of course block as soon as #handle#send is fired,
			//	and so we know the request is complete on the first exection of this block.
			//	
			main: function(inf) { 
				if(this.handle.readyState === 4 || this.async === false) {     
	  
					var t 		= this,
						st 		= t.status(),
						cac		= cache[t.url],
						data 	= t.responseText = (t.handle.responseText || ''); 
	
					switch(t.type) {
						
						case 'json':
							data = t.responseJson = uni.json.parse(t.responseText).$;
						break;
						
						case 'jsonp':
							// build in jsonp handling
						break;
						
						case 'xml':
							
							//	Xml handling is done by a specialized xml parser and transformer,
							//	defined above.
							//
							t.Xml = new XmlFacade(t);
							data = t.responseXml = t.Xml.document();
							
						break;
						
						case 'insert':
							// do the dom insert
						break;
						
						default:
						break;	
					}
					
					//	If a 304, map the cached data onto the *current* request object.
					//
					if(cac && st == 304) {
	
						t.responseText 	= cac.responseText;
						t.responseXML	= cac.responseXml;
						t.responseJson	= cac.responseJson;
	
					//	Create a cache entry for GET requests on successful fetch.
					//
					} else if(st === 200 && t.method === 'GET') {                        
						t.Etag 			= t.header("Etag") || '"0"';                      
						cache[t.url]  	= t;
					}
	
					//	Any success function (on success, of course...)
					//	
					if((st == 0 && location.protocol == 'file:') || (st >= 200 && st < 300)) {
						t.success.call(t.callObj, data, t);
					}
	
					//	If the developer has asked for a status-specific handler, run that now.
					//
					t['on' + st] && t['on' + st].call(t.callObj, data, t);
					
					//	Note that all other handlers/callbacks have run prior to #complete
					//	being called.
					//
					t.complete.call(t.callObj, data, t);
	
					return false;  
				} 
				
				return true;
			}
		};
	},


	send = function(op) {
	
		//	Note that the options object sent is extended by the #xhr func, which importantly
		//	adds our xhr transport and manipulation api.  
		//
		//	@see		#xhr
		//
		var a	= xhr(op),
			p,
			w;
		
		//	Want to pass on any additional properties which were sent.  Note that if
		// 	sent a property name which conflicts with a property set in #xhr, the
		//	#xhr property is maintained.
		//
		for(p in op) {
			a[p] = a[p] || op[p];  
		}
	
		//	Create the native transport object.
		//
		a.handle.open(a.method, a.url, a.async, a.username, a.password);
		a.setDefaultHeaders();
	
		//	If we have a cached copy (only relevant on GETs), only fetch new content if
		//	its Etag differs from ours (If-None-Match).
		//
		if(a.cache && cache[a.url] && a.method == 'GET') {
			a.header("If-None-Match", cache[a.url].Etag);
		}
	
		//	POST
		//
		if(a.method == 'POST') {
			a.header("Content-type", "application/x-www-form-urlencoded");
			a.header("Content-length", a.body.length);
			a.header("Connection", "close");
		}

		a.beforeSend.call(a.callObj, this);
		
		//	This is the native xmlHttpRequest sending mechanism.
		//
		a.handle.send(a.body);  

		//	Wait for ready state.
		//
		uni.test(a.main, a);
	
		return a;
	}, 

	//	Mainly a sanitizer, is called by all xhr methods in the kit prior to calling #send.
	//	Note that this system allows the addition of any number of attributes to the options
	//	object, which are passed thru the entire process and available to the callback.  This
	//	is mostly useful for setting status handlers (on401, on404, etc), but serves as
	//	well as a namespace for you to pass along data.  Of course the core attributes will
	//	override any identically named attributes options might contain, so you may want to
	//	simply pass through a single attribute assigned an object, where you can play safe.
	//
	//	@see		#send
	//
	procOb = function(url, cp, o, scp, typ) {
	
		var a 	= Array.prototype.slice.call(arguments),
			no	= uni.noop,
			o,
			b,
			p,
			pq	= {},
			nb	= '';
		
	
		//	We have been passed optimistic argument values by the kit.  All of the first 4
		//	arguments are guaranteed to have been passed by the kit.  However, they may be
		// 	undefined, as the developer may omit some arguments.  Consider that the developer 
		//	does not send a success function (supposed to be second argument), but wants to 
		//	send an option argument (usually third argument):
		//
		//	get('foo.html', {option: here})
		//
		//	instead of:
		//
		//	get('foo.html', function(){}, {...})
		//
		// 	Note that we've converted the arguments into an Array, above. This allows us to
		//	check if the passed success func slot is in fact filled with a Function, and if it
		//	is not then we simply snip [1] and [2] ([success slot], [object slot]) in the
		//	arguments array, replace [1] with a noop function, and replace [2] with what is in 
		//	the slot reserved for the success function, which is either undefined, or an 
		//	options object.
		//
		//	See the kit methods below.
		//
		if(!uni.is(Function, cp)) {
			a.splice(1, 2, no, cp);
		}
	
		//	Now correct for an undefined options object.
		//
		o	= a[2] || {};
	
		o.url		= a[0],
		
		//	This is the default, which will be overridden by specific http methods in
		//	the kit (such as #post).  See below.
		//
		o.method	= 'GET',
		
		o.async		= o.async === undefined ? true : !!o.async,
		
		//	The scope of the Object on which #xhr is called is *always* passed by kit methods,
		//	and is the scope in which all callback functions are executed in.
		//
		o.callObj	= a[3],
		
		//	Whether to disable caching.  Default is to cache.
		//
		o.cache			= o.cache === undefined ? true : false,
			
		o.maxTime		= o.maxTime		|| false,
		o.success		= a[1],
		o.complete		= o.complete	|| no,
		o.beforeSend	= o.beforeSend	|| no,
		o.contentType	= o.contentType	|| false,
		o.type			= a[4]			|| false;
		
		//	Handle #body data (usually used for POST). Can send post body either as a 
		//	string or data object (array, object).
		//
		b	= o.body;
		if(b) {
	
			//	Note that if a string is sent ampersands must be converted to %26 or this
			//	will not work correctly.
			//
			if(uni.is(String, b)) {
				b.replace(/([^=&?]+)(=([^&]*))?/g, function($0, $1, $2, $3) { 
					pq[$1] = $3; 
				});
				b = pq;
			}
	
			for(p in b) {
				nb += encodeURIComponent(p) + '=' + encodeURIComponent(b[p]) + '&'
			}
		}
	
		o.body 	= nb;
	
		return o;
	};





//
// 	XML Processor
//	Copyright (c) 2009 Ryan Morr (ryanmorr.com)
//	Licensed under the MIT license.
//
//	The #loadXML, #encode, #decode, #stringify, #getXML, #getXSL methods have been removed. Some 
//	method names have been changed, as has much of the functionality implemented when this
//	was intended as a full xml/xslt loader and transformer.  Now mainly a collection of
//	methods which are endpoints for the Xml facade returned by %xhr.
//
XmlProcessor.prototype = {
		
	// 	The various MS implementations for creating Document objects.
	//
	//	@see	#createDocument
	//
	MSXML: 	[
		"Msxml2.DOMDocument.6.0",
		"Msxml2.DOMDocument.5.0", 
		"Msxml2.DOMDocument.4.0", 
		"Msxml2.DOMDocument.3.0", 
		"MSXML2.DOMDocument", 
		"Microsoft.XMLDOM"   
	],
	
	//	#loadXslt
	//
	//	Loads an Xslt stylesheet.  This method is used when transforming an Xml document.
	//	It will load the stylesheet -synchronously- in all cases.
	//
	//	@param		{String}		url		The path to the stylesheet.
	//	@return		{Object}				The Xslt stylesheet.
	//
	loadXslt: function(url){
		var doc = this.createDocument();
		this.xslt = this.loadDocument(doc, url);
		return this.xslt;
	},
		
	/**
	 * convert an XML string into a document
	 * @param {String} str the XML string to parse
	 * @return {Object} the XML document
	 */
	parse: function(str){
		if(window.DOMParser){
			var parser = new DOMParser();
			this.xml = parser.parseFromString(str, "text/xml");
		}else if(window.ActiveXObject){
			this.xml = new ActiveXObject("Microsoft.XMLDOM");
			this.xml.async = false;
			this.xml.loadXML(str);
		}
		return this.xml;
	},
		
	/**
	 * create a document object
	 * @return {Object} the document
	 */
	createDocument: function(){
		var doc;
		if(document.implementation && document.implementation.createDocument){
			doc = document.implementation.createDocument("","",null);
		}else if(window.ActiveXObject){
			for(var i=0; i < this.MSXML.length; i++){
				try{
					doc = new ActiveXObject(this.MSXML[i]);
				}catch(e){}
			}
		}
		return doc;
	},
	
	/**
	 * load and populate the document
	 * @param {Object} doc the empty document to be populated
	 * @param {String} url URL of the document to load
	 * @return {Object} the populated document
	 */
	loadDocument: function(doc, url){
		if(doc && typeof doc.load != 'undefined'){
			doc.async=false;
			doc.load(url);
			return doc;
		}else{
			var request = new XMLHttpRequest();
			request.open("GET", url, false);
			request.send("");
			return request.responseXML;
		}
	},
	
	//	Transform xml document.
	//
	transform: function(){
		if(window.XSLTProcessor){
			var processor = new XSLTProcessor();
			processor.importStylesheet(this.xslt);
			return processor.transformToFragment(this.xml, document).textContent;
		}else{
			return this.xml.transformNode(this.xslt);
		}		
	},
	
	/**
	 * perform an xpath query on an XML document
	 * @param {String} query the xpath expression to be evaluated
	 * @return {Array} array of nodes
	 */
	xpath: function(query){
		if(typeof this.xml.selectNodes != 'undefined'){
			return this.xml.selectNodes(query);
		}else if(document.implementation.hasFeature('XPath', '3.0')){
			var nodes = [];
			var resolver = this.xml.createNSResolver(this.xml.documentElement);
			var items = this.xml.evaluate(query, this.xml, resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
			for(var i=0; i < items.snapshotLength; i++){
			  nodes[i] = items.snapshotItem(i);
			}
			return nodes;
		}else{
			return [];
		}
	}	
};





uni.addKit('xhr', {
	
	//	#get
	//
	//	Performs a get.
	//
	//	@param		{String}		url		The url to GET.
	//	@param		{Function}		cp		The callback function.
	//	@param		{Object}		[op]	Additional options.
	//
	get:		function(url, cp, op) {
		send(procOb(url, cp, op, this));
	},
	
	post:		function(url, cp, op) {
		var x 		= procOb(url, cp, op, this);
		x.method	= 'POST';
		send(x);
	},
	
	getJson: 	function(url, cp, op) {
		send(procOb(url, cp, op, this, 'json'));
	},
	
	getXml:		function(url, cp, op) {
		send(procOb(url, cp, op, this, 'xml'));
	}
});

/*
	Study this, work in a useful way to do script injection, prob. for #jsonp.
	
		script.type = "text/javascript";
	try {
		script.appendChild( document.createTextNode( "window." + id + "=1;" ) );
	} catch(e) {}

	root.insertBefore( script, root.firstChild );

	// Make sure that the execution of code works by injecting a script
	// tag with appendChild/createTextNode
	// (IE doesn't support this, fails, and uses .text instead)
	if ( window[ id ] ) {
		jQuery.support.scriptEval = true;
		delete window[ id ];
	}


	globalEval: function( data ) {
		if ( data && rnotwhite.test(data) ) {
			// Inspired by code by Andrea Giammarchi
			// http://webreflection.blogspot.com/2007/08/global-scope-evaluation-and-dom.html
			var head = document.getElementsByTagName("head")[0] || document.documentElement,
				script = document.createElement("script");

			script.type = "text/javascript";

			if ( jQuery.support.scriptEval ) {
				script.appendChild( document.createTextNode( data ) );
			} else {
				script.text = data;
			}

			// Use insertBefore instead of appendChild to circumvent an IE6 bug.
			// This arises when a base node is used (#2709).
			head.insertBefore( script, head.firstChild );
			head.removeChild( script );
		}
	},
*/



})(this, document);



    
      
 