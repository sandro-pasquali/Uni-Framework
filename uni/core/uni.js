//	Uni system.  Creates global `uni`.
//	
//	@fires		!onLine
//	@fires		!offLine
//

(function(window, Array, Object, Function, String, undefined) { 

// 	Creating closure on some values for which there should be no external references,
//	in addition to some shortcuts which are used variously.  
//
var obProtoTS 	= Object.prototype.toString,

	aProtoS		= Array.prototype.slice,
	
	//	We don't pass document this via the enclosure as we may be running in a non-Dom 
	//	context, such as a web worker.
	//
	doc		 	= window.document,

	//	Stores any calls which have had their execution queued.
	//
	//	@see 		#queue
	//	@see		#runQueue
    //	@see		#extend
	//
	Q = {},
	
	//	Storage of lazy-loaded script information.
	//
	//	@see		#require
	//
	scripts		= [],

	// 	Script requirement tracking.
	//
	//	@see		#require
	//	@see		#extend
	//
	required	= [],
	
	//	Observed events.
	//	
	//	@see	#observe
	//
    events		= [],
    
    //	Condition checks being executed periodically.
    //
    //	@see		#test
    //	@see		#audit
    //
   	auditors		= [],
   	
   	//	These are protected method names, which cannot be used by kits.
   	//
   	//	@see		#addKit
   	//
   	protectedMNames	= {
		extend:		1,
		sub:		1,
		require:	1,
		test:		1
   	},   	

	// 	See http://forum.jquery.com/topic/faster-jquery-trim.
	//	These are the regexes used for trim-ming operations.
	//
	//	@see		#trim
	//	@see		#trimLeft
	//	@see		#trimRight
	//
	tLeft 			= /^\s+/,	
	tRight	 		= /\s+$/,
	
	//	Whether #trim is a native String method.
	//
	nativeTrim		= !!("".trim),
	
	//	Whenever an observer method needs to be called.
	//
	//	@see	#observe
	//	@see	#fire
	//
	fireObserver	= function(fn, scope, data, ob) {
		return fn.call(scope, data, ob);
	},
   	
   	//	#firstlast
   	//	
   	//	Used by #first and #last, which are essentially the same except for the ordering
   	//	of the set they operate on.
   	//
   	//	@param		{Boolean}		first		Whether called by #first.
   	//
    //	[See methods for subsequent argument descriptions]
   	//	
   	//	@see		#first
   	//	@see		#last
   	//
   	firstlast	= function(first, fn, t) {

		t	= !t ? this.$ : t;
		t	= first ? t.reverse() : t;
		
		var	n = t.length;
		
		//	If we're not sent a function, either nothing was sent (where we just return the
		//	last item in the array), or the `t` arg was sent and it now sits in the `fn` slot.
		//	Check for a function, and if not, work using the above conditions.
		if(!uni.is(Function, fn)) {
			return fn ? fn[fn.length -1] : t[t.length -1];
		}
				
		while(n--) {
			if(fn.call(this, t[n], n)) {
				return t[n];
			};
		}
   	},
   	
   	//	#reducer
   	//
   	//	Used by several methods. Returns accumulator as modified by passed selective function.
   	//	Note that #reducer will be called in scope of Object.
   	//
   	//	@param		{Function}		fn		The selective function.
   	//	@param		{Mixed}			a		The accumulator.
   	//	@param		{Object}		[t]		The object to work against. If not sent
   	//										the default becomes Subject.
   	//
   	//	@see		#reduce
   	//	@see		#reduceRight
   	//	@see		#unique
   	//	@see		#filter
   	//	@see		#map
   	//	@see		#forEach
   	//
   	reducer		= function(fn, a, t) {
   	
   	   	t		= t || this.$;
   	   	
   	   	var c	= t.length,
			n	= 0;
	
		if(uni.is(Array, t)) {
			while(n < c) {
				a = fn.call(this, a, t[n], n);
				if(a === false) {
					break;
				}
				n++;
			}
		} else {
			for(n in t) {
				a = fn.call(this, a, t[n], n);
				if(a === false) {
					break;
				}
			}
		}

  		return a;
  	},
  	
    //	#audit
    //
    //	Periodically execute auditors set up by #test.  See bottom for initialization
    //	of the execution loop.  This is an internal method, and you should not call
    //	it directly.  Note that it is being called every few milliseconds...
    //
    //	@see		#test
    //  @fires		!terminated:*
    //
    audit 	= function() {
    
    	var a 	= auditors,
    		n 	= a.length,
    		t 	= new Date().getTime(),
			c;
			
        while(n--) {
        
            c = a[n];
            
            c.cycles++;
            c.lastTime 		= c.currentTime;
            c.currentTime  	= t;
            c.totalTime		= c.currentTime - c.startTime;

            //	This is the active bit.  We check if death conditions have arrived for
            //	this auditor. Most commonly such condition will be triggered if the
            //	auditor returns anything non truthy. As well, if the auditor had limits
            // 	place on it (max count, max time), those will flag if reached.  If a death
            //	condition, remove auditor and announce that the auditor is dead.
            //
            if(		(c.maxTime && c.maxTime <= c.totalTime)
            	|| 	(c.maxCycles && c.maxCycles <= c.cycles)
                || 	!!c.main(c) === false) {
            
                a.splice(n,1);
             
                uni.fire('testTerminated:' + c.id, c);
            }        
        }
        
        return [n, a.length];
    },
    	
	//	The constructor, used whenever a new Object is needed.
	//
	//	@constructor
	//
	Uni = function() {

		//	Subject tracking. 
		//
		//	@see		#sub
		//
		this.$		=	[];
		this.$$		= 	[];
		
		//	Each Object has a namespace, which is used by various methods,
		// 	in addition to being a safe space for developers to use.  Each
		//  Object keeps a "proprietary" namespace (`_`) for storage of 
		// 	operations info: this space should not be used.
		//
		//	@see	#namespace
		//
		this.ns = {
			_:	{						
				id:			'',
				
				parent:		this,
					
				children:	[],
				
				//	@see		#advise
				//
				advice:		{},
				
				//	Stores references to the names of extensions
				//
				//	@see		#extend
				//
				extensions: {}
			}
		};
	};

// 	Uni's prototype. 
//
Uni.prototype = new function() {

	//
	//
	//	THE FOLLOWING METHODS ARE INTERNAL AND *NOT* CHAINABLE
	//
	//	These methods return a value directly, not an Object.  They are also 
	//	non-destructive, so the current Subject will not be affected.
	//

	//	#noop	
	//
	//	Just some shorthand for cases where you need a default anonymous function.
	//
	this.noop	= function() {};
	
	//	Sometimes we'll need to know the path to the uni/ folder. Find the src value of the 
   	//	script element which sourced the uni.js file (which is always preceeded by core/),
   	//	and whatever precedes that will be the path we need (note: relative to the location
   	//	of the file which included uni.js, except where absolutely defined).
   	//
   	this.path	= function() {
   		var k = 'core/uni.js';
   		if(doc) {
			var c 	= doc.getElementsByTagName("script"),
				i	= c.length,
				s;
				
			while(i--) {
				s = c[i].getAttribute("src");

				if(s && s.indexOf(k) > -1) {
					return s.split(k)[0];
				}
			}
		}
   	};

    //	#camelize
    //	
    //	When sent a string containing dashes(-) or underscores(_) will return a string that
    //	has removed either character and uppercased the character immediately following.
    //
    //	@param		{String}		s		A string to camelize.
    //	@see		#uncamelize
    //
    //	@example							.camelize('font-size') 	// fontSize
    //
    this.camelize = function(s) {
    	return s.replace(/[-_]+(\S)/g, function(m,c){ return c.toUpperCase();} );
    };
    
    //	#uncamelize
    //	
    //	Returns a camelized string to a uncamelized state.  Reverses the process in #camelize.
    //
    //	@param		{String}		s		A string to decamelize.
    //	@param		{String}		[d]		The character to use as the separator.  Default is 
    //										a dash(-).
    //	@see		#camelize
    //
    //	@example							.uncamelize('fontSize',"-") // font-size
    //
    this.uncamelize = function(s, d) {

    	d	= d || '-';
    	
    	//	@see https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/String/replace
    	//
    	return s.replace(/[A-Z]/g, d + '$&').toLowerCase();
    };
    
    //	#leftTrim
    //
    //	Removes whitespace from beginning of a string.
    //
    //	@param		{String}		t		The string to trim.
    //
	this.leftTrim =	function(t) {
		return 	t.replace(tLeft, "");
	};
	
    //	#rightTrim
    //
    //	Removes whitespace from end of a string.
    //
    //	@param		{String}		t		The string to trim.
    //
	this.rightTrim =	function(t) {
		return 	t.replace(tRight, "");
	};
    
    //	#trim
    //
    //	Removes whitespace from beginning and end of a string.
    //
    //	@param		{String}		t		The string to trim.
    //
	this.trim =	function(t) {
		return 	nativeTrim 	? 	t.trim() 
							: 	t.replace(tLeft, "").replace(tRight, "");
	};
    
    //	#contains
	//
	//	Checks whether one thing is contained by another.  Options are checking whether one
	//	Dom element contains another, whether an array contains a certain value, or whether
	//	an object contains a certain value.
	//
	//	@param		{Mixed}			c		The contained.  
	//	@param		{Mixed}			t		The container, or defaults to Subject.
	//
	this.contains = function(c, t) {
		t	= t || this.$;
		
		var p,
			n;
		
		//	Dom elements.  Note that we only check if container is a Dom element.
		//
		//	@see	http://www.quirksmode.org/blog/archives/2006/01/contains_for_mo.html
		//
		if(uni.is(uni.Element, t)) {
			return 	t === c	
					? 	false
					: 	t.contains	
						? t.contains(c)
						: !!(t.compareDocumentPosition(c) & 16);
		}
		
		if(uni.is(Object, t)) {
			for(p in t) {
				if(c === t[p]) {
					return true;
				}
			}
		} else if(uni.is(Array, t)) {
			n = t.length;
			while(n--) {
				if(c === t[n]) {
					return true;
				}
			}
		}
		
		return false;
	};
	
	//	#forceArray
	//
	//	Simply "casts" passed argument into an Array by making it the first element of a new
	//	Array, echoing back argument if already an Array.
	//
	//	@param		{Mixed}		c		Anything, even undefined.
	//
	this.forceArray = function(c) {
		return uni.is(Array, c)  ? c : [c];
	};
	
	//	#toArray
	//
	//	Tries to convert anything that isn't an array into an array.  Only really useful
	//	wih Objects, NodeLists and Strings. Anything that can't be converted is simply made the
	//	first element of an Array -> [c], and of course Arrays are simply returned.
	//
	//	@param		{Mixed}			c		What to array.
	//	@type		{Array}
	//
	this.toArray = function(c) {

		var p,
			f 	= [];
	
		if(uni.is(uni.NodeList, c)) {
		
			for(p=0; p < c.length; p++) {
			  f[p] = c[p];
			}
			return f;
			
		} else if(uni.is(Object, c)) {
		
			for(p in c) {
				f[p] = c[p];
			}
			return f;
			
		} else if(uni.is(String, c)) {
			return c.split('');
		}

		return uni.is(Array, c) ? c : [c];
	};
    	            
	// 	#is
	//
	//	@param		{Mixed}		type		An object type.
	// 	@param		{Mixed}		val			The value to check.
	//	@type		{Boolean}
	//
	// Checks whether `val` is of requested `type`. As you are passing
	// object references, this is also useful for checking the pedigree of
	// your instance variables, such as:
	//
	// var Animal 			= function() { //... };
	// var dog				= new Animal(bark());
	// uni.is(Animal, dog) 	// true
	//
	this.is = function(type, val) {

		if(!type || !val) {
			return false;
		}
		
		switch(type) {
			case Array:
				return obProtoTS.call(val) === '[object Array]';
			break;
			
			case Object:
				return obProtoTS.call(val) === '[object Object]';  
			break;
			
			//	See base of file, end of uni initialization.
			//
			case uni.Element:
			case uni.Numeric:
			case uni.Instance:
			case uni.NodeList:
			case uni.EmptyObject:
				return type.call(this, val);
			break;
	
			default:
				return val.constructor === type;
			break;
		}
	};
    
    // 	#uuid
    //
    //	Math.uuid.js (v1.4)
	// 	http://www.broofa.com
	//	mailto:robert@broofa.com
	//	Copyright (c) 2010 Robert Kieffer
	//	Dual licensed under the MIT and GPL licenses.
	//
	// 	(Compact Version -- Object is going to use this in small
	//	doses, for creating random ids. This is the least performant
	//	version, chosen for compactness; simply replace with one of the
	// 	more performant versions if speed becomes an issue. -Ed)
	//
	// 	Only change was to declare vars at top of function scope. -Ed.
	//
    this.uuid 	= function() {
    	var r,
    		v;
    		
    	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      		r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      		return v.toString(16);
    	}).toUpperCase();
  	};
  	
  	//	#insertScriptNode
  	//
  	//	Adds a script node to the Dom, setting its src and onload function to
  	//	the arguments sent.
  	//
  	//	@param		{String}		src		The script src (http://foo.js)
  	//	@param		{Function}		[fn]	An optional callback function, which is always 
  	//										called after the script has loaded and run.
  	//	@see		#getScript
  	//	@see		#require
  	//
  	this.insertScriptNode 	= function(src, callback) {

		var s	= doc.createElement('script'),
			h	= doc.getElementsByTagName('script')[0];
		
		//	Note the setting of async to `true`, and assignment of a random id.
		//
		s.id		= this.uuid();
		s.type 		= 'text/javascript';
		s.charset	= 'utf-8';
		s.async		= true;
		s.src 		= src;
		s.loaded	= false;

		//	Note the closure on the #onload function defined above.
		//
		s.onload 	= s.onreadystatechange = function() {

			if(!this.loaded && (!this.readyState  || this.readyState == "loaded" || this.readyState == "complete")) {
			
				//	Clear the handlers (memory), and fire.
				//
				s.onload = s.onreadystatechange = null;

				callback && callback();
			}
		};
		
		//	Attach script element to document. This will initiate an http request.
		//
		h.parentNode.insertBefore(s, h);

		return s;
  	};

	// 	#copy
	//
	//	Returns a copy of the sent object.  The copy may be deep or shallow.  Note that we
	//	don't copy instances of uni Object, or dom Elements (or non-objects or non-arrays, as
	//	those are not passed by refrerence, making additional copying unnecessary).
	//
	// 	@param		{Object}		[obj]		The object to copy.
	//	@param		{Boolean}		[sha]		Whether to do shallow(flat) copy.
	//	@type		{Object}
	//
	this.copy 	= function(obj, sha) {    
	
        var p, 
        	c;
	
        //	Don't copy non-objects (object or array), or (uni)Object 
        //	instances (checking for ns._ property).
        //
        if(!uni.is(Object, obj) || (obj.ns && obj.ns._)) {
            return obj;
        }
                
        //	If we are unable to get a constructor on an object, then we assume it is a 
        //	some special native (dom element, css rule, etc)... just return the obj.
        //        
        try {
        	c = new obj.constructor;
        } catch(e) {
        	return obj;
        }

        for(p in obj) {
            c[p] = sha ? obj[p] : this.copy(obj[p], sha);
        }
        
        return c;
    };

	//	#spawn
	//
	//	Creates a nearly exact copy of this Object, with the main
	//	difference being that this Object namespace is not replicated,
	//	allowing new instance to maintain its own information.
	//
	//	@param		{Mixed}		[sub]		Object Subject. Defaults to parent Subject.
	//
	//
	this.spawn = function(sub, noCopy) {
	
		//	`Uni` is also #uni constructor; core constructor.
		//
		var n	= new Uni,
			
			//	Need to beget all the extensions to this Object.
			//
			x	= this.ns._.extensions,
			e;
						
		//	Set Object Subject. If one is not sent, use Object.$.
		//
		n.sub(noCopy ? sub : this.copy(sub || this.$));
			
		//	Extend the copy with Object extensions.
		//
		//	@see		#extend
		//
		for(e in x) {
			n.extend(e, x[e][0], x[e][1]);
		}
			
		//	Add any parent/child info.  Note that each Object gets a unique id.
		//
		n.ns._.id 		= this.uuid();
		n.ns._.parent	= this;
			
		//	Give the parent references to its children.
		//
		this.ns._.children.push(n);
			
		return n;
	};  
	
	this.advice = function(a) {
		var ns = this.ns._;
		return (ns.advice[a] ? ns.advice[a] : uni.noop).apply(this, aProtoS.call(arguments, 1));
	};
    
    //	#hasAuditor
    //
    //	Returns any auditors matched by the sent function.  By default will return an array
    //	containing all matched auditors.  Optionally, you may request the first or last
    //	auditor found.  The match function is executed in the scope of the auditor.
    //
    //	@param		{Function}		f		The match function.
    //	@param		{String}		[m]		Usually one of "first" or "last".  You can send any
    //										method name which exists in the uni Object. Defaults 
    //										to array containing all matches.
    //	@type		{Array}
    //
    //	@see		#filter
    //	@see		#test
    //
    this.hasAuditor = function(f, m) {
    	return uni[m || 'filter'](f, auditors).$;
	};

	//
	//
	//	THE FOLLOWING METHODS ARE INTERNAL *AND* CHAINABLE
	//
	//  
	
	// 	#sub
	//
	// 	Creates the Subject for an Object.
	//
	//	@param 		{Object}		sc		Any legal value.
	//	@param		{Boolean}		[safe]	Do not clone, use as is.
	//
    this.sub  = function(sc, safe) {
    
    	//	To permit #restore, clone Subject and store.
    	//
		this.$$ = this.copy(this.$);
		
        this.$ 	= safe ? sc : this.copy(sc);
        
        return this;
    };
    
    //	Adds four new accessor methods to the current Object, which operate on a closed data 
    //	object.  This means that following application whichever data object is used will 
    //	maintain through any future changes to Subject.
	//
	//	@param		{Object}		[obj]		An object, usually JSON.  If not sent, Subject
	//											is used.
	//	@param		{Boolean}		[doCopy]	If passed a value, force a copy.  Default is to
	//											pass by reference (relevant if an object).
	//
    this.createSubjectFacade = function(obj, doCopy) {
		var data 	= obj === undefined ? this.copy(this.$) : doCopy ? this.copy(obj) : obj,
			acc	 	= [],
			access 	= function(ob, prop, val) {
				var props = prop.split('.'),
					pL		= props.length,
					orig	= ob, 
					i 		= 0, 
					p, 
					ret;
							
				// 	Set
				//
				//	Note that requesting a path that does not exist will result in that
				//	path being created. This may or may not be what you want. IE:
				//	{ top: { middle: { bottom: { foo: "bar" }}}}
				//
				//	.set("top.middle.new.path", "value") will create:
				//
				//	{ top: { middle: {
				//						bottom: {...}
				//						new:	{ path: "value" }
				//					 }}}
				//
				if(arguments.length > 2) {
			  		while(i < (pL -1)) {
						p = props[i++];
						ob = ob[p] = (ob[p] instanceof Object) ? ob[p] : {};
			  		}
									
			  		ob[props[i]] = val;
								
			  		return orig;
									
				// Get
				//
				} else {
			  		while(((ob = ob[props[i]]) !== undefined) && ++i < pL) {}
			  		return ob;
				}
			},
			
			//	The search engine used by #find* methods. See below.
			//	Will find and return an array of paths reflecting the 
			//	relationship of the attr/value sent.  If `andAtt` is sent, 
			//	paths will be suffixed by attr.
			//
			//	@param		{String}		attr		The attribute you are searching for.
			//	@param		{Mixed}			val			Either some value or a Function. If a 
			//											Function, flag match by returning true.
			//	@param		{String}		path		The start path, dot notation, from which
			//											point the search begins.
			//	@param		{Object}		t			Sent by internal interface, representing
			//											the Object the facade operates in.
			//	@param		{Boolean}		andAtt		Default bahavior is to return the object
			//											containing the attribute which is matched.
			//											This flag forces return of the full path
			//											to, and including, the attribute.
			//
			find	= function(attr, val, path, t, andAtt) {
				var value 	= t.get(path),
					c,
					p;
						
				//	This would mean either a true Object, or an Array.
				//  
				if(value instanceof Object) {

					if(uni.is(Function, val) ? val(value[attr], value, attr, path) : value[attr] === val) {
						andAtt ? acc.push(path + "." + attr) : acc.push(path);
					}

					for(p in value) {
						find(attr, val, path + "." + p, t, andAtt);
					}	
				} 
			}
        
        //	Get a property value at some point in the bound data.   If no path is sent, 
        //	returns the data object.
        //
        //	@param		{String}		[path]		Path to the property. 
        //
        this.extend("get", function(path) {
           	return { $void: path ? access(data, path) : data };
        });

        //	Set a property value at some point in the bound data. 
        //
        //	@param		{String}		path		Path to the property.  
        //                  	
        this.extend("set", function(path, value) {
            return { $void: access(data, path, value) };
        });
        
        //	Removes a node completely (if object), or a value from a node object (if array).
        //	
        //	@param		{String}		path		Path to attribute to be unset.
        //
        this.extend("unset", function(path) {

        	var ob = data,
        		props = path.split("."),
        		i = 0,
        		pL = props.length;

			//	Simply traverses the data model finding the penultimate node.
        	for(; i < pL-1; i++) {
        		ob = ob[props[i]];
        	}
        	
			if(uni.is(Object, ob)) {
        		delete ob[props[i]];
        	} else {
        		ob.splice(props[i], 1);
        	}
        });
        
        //	Finds the (String) paths to all objects which contain #k w/ value of #v.  
        //	
        //
        //	@param		{String}		attr		The attribute to check.
        //	@param		{Mixed}			val			The value to match.
        //	@param		{String}		path		The initial path.
        //	@param		{Boolean}		[andAtt]	Setting this will get the full Attr pointer.
        //
        this.extend("findPaths", function(attr, val, path, andAtt) {
        	
        	acc = [];
        	find(attr, val, path, this, andAtt);

        	return { $void: this.spawn(acc, 1) };
        });      
        
        //	Will return the first (String) path found to given attr/val.
        //
        this.extend("findPath", function(attr, val, path, andAtt) {
        	return { $void: this.findPaths(attr, val, path, andAtt).first().$ }
        });
        
        //	Finds all objects containing #attr w/ value of #val
        //
        this.extend("find", function(attr, val, path, andAtt) {
        	return { $void: this.findPaths(attr, val, path, andAtt).map(function(e, i) {
        		return this.get(e);
        	}) };
        });  	
        
        return this;
    },
    
	//	#addKit
	//
	//	A kit is a collection of methods in a namespace. If I added a kit like so:
	//
	//	uni.addKit('Geometry', {
	//		circle: function() {...},
	//		square:	function() {...},
	//		triangle: function() {...}
	//	});
	//
	//	I would now have an interface identified by `Geometry` within an Object, such that 
	//	this is now possible:
	//
	//	uni
	//		.Geometry
	//			.area()
	//			.slope()
	//			...
	//
	//	It is important to understand that a kit is a namespace, and as such its Subject is 
	//	isolated.  Such that:
	//
	//	uni.sub(1);
	//	uni.Geometry.sub(2);
	//
	//	uni.notify(uni.$) 				// 1
	//	uni.notify(uni.Geometry.$) 	// 2
	//
	//	The format for creating a kit is:
	//
	//	uni.addKit('kitName', {
	//		method1: function() {},
	//		method2: function() {} ...
	//	}
	//
	//	This creates a kit namespace, accessed via uni.kitName.
	//
	//	Another use for kits is as a simple collection of methods to be mixed into another
	//	kit or Object. So if you have a kit with useful methods, like a reporting kit, you
	//	can add its methods to another kit by calling #addKit:
	//
	//	this.myKit.addKit(uni.reporter)
	//
	//	Note the function overloading: normal behavior is to pass a string (the kit name), with
	//	methods for the kit.  By passing another kit as the first argument, you achieve the 
	//	above behavior.
	//
	//	@param		{Mixed}		nm			Either a String name for a new kit, or a kit Object.
	//	@param		{Object}	[funcs]		An object containing named functions.
	//
	this.addKit = function(nm, funcs) {

		var pro	= 	Uni.prototype,
			f	= 	function() {},
			p,
			ex,
			x;
	
		//	Want to allow the 
		//
		if(uni.is(Object, nm)) {
			ex 	= nm.ns._.extensions;
			
			for(x in ex) {
				this.extend(x, ex[x][0], ex[x][1]);
			}
			
			return this;
		}
	
		//	Note how kits cannot override existing attributes/methods.
		//
		if(this[nm] === undefined) {
	
			//	Kits exist at the top of the Object chain.  All Objects will
			//	have access to the kit namespace.  Note how we override the
			//	prototype namespace (ns), giving each kit its own. Note as well that
			//	this kit namespace does not include either #children or #parent attribute.
			//	Note as well that the value of the #advice attribute is passed by
			//	reference from the Uni #advice attribute, and as such changes to the
			//	advice for Uni will be reflected in *all* kits.
			//
			f.prototype				= this;
			pro[nm]					= new f;
			pro[nm].ns = {
				_:	{
					extensions: [],
					id:			nm,
					isKit:		true,
					advice:		uni.ns._.advice
				}
			}
		} 
			
		//	Add requested kit methods. Note that multiple kits can have identically named
		//	methods and that kits can use (most) Object method names.  You are encouraged
		//	to not scatter the same names around, and not to use Object method names, as
		//	much as possible.  This is simply for reasons of readability.
		//
		//	@see		#protectedMNames
		//
		for(p in funcs) {
			if(!protectedMNames[p]) {
				pro[nm].extend(p, funcs[p]);
			}
		}
			
		return this;
	};
                            
    //	#hoist
    //	
    //	Creates a method in Uni prototype, which is immediately inherited by
    //	all current Objects, and will be available to all future objects.  
    //	It simply calls #extend on Uni prototype, and as such accepts the
    //	same arguments as #extend.  Note that there is no checking done on
    //	the method name: you will overwrite existing methods with same name.
   	//	This may or may not be what you want.
    //
    //	@param		{String}		name		The method name.
    //	@param		{Function}		fn			The method.
    //	@param		{Object}		a			Optional argument list.
    //
    //	@see		#extend
    //
    this.hoist = function(n, f, a) {
    	Uni.prototype.extend(n, f, a);
    	return this;
    }
    
    //	#extendProto
    //
    //	Will add methods to Uni.prototype. You probably want to use #hoist instead.  
    // 	Prototype methods are untraceable. If they return `this` they are chainable, though
    //	this is not obligatory -- a good place for helper methods.  An advantage this method
    //	shares with #hoist is that since the method is in Uni.prototype, upon #spawn it
    //	will not need to be added to the newly spawned instance (a la js prototype chain).
    //	Again, you are encouraged to create traceable methods with #extend or #hoist.
    //
    this.extendProto = function(nm, fn) {
    	Uni.prototype[nm] = Uni.prototype[nm] || fn;
    	return this;
    };
        
    //	#extend
    //
    //	Addition of chainable methods to Object. Only this Object (and its
    //	children) will have the extension. This allows assignment of specific
    //	methods to individual copies of Objects, which methods are also
    //	inherited by that individual's children.
    //
    //	If you would like to create a method in Uni prototype, which all future
    //	(and current) Objects will automatically inherit, use #hoist.
    //
    //	You may pass multiple extensions by sending an Array as a single argument, 
    //	in format:	[
    //					{ 	name:		'methodName',
    //						fn:			function() {},
    //						options:	{} 
    //					},
    //					...
    //				]
    //	
    //
    //	@param		{Mixed}			name		The method name, or an Array of methods.
    //	@param		{Function}		fn			The method.
    //	@param		{Object}		options		Optional argument list.
    //
    //	There are optional construction arguments that you may pass:
    //
    //	@see		#hoist
    //
    this.extend = function(name, fn, options) {
    
    	//	Handle a group of methods.
    	//
    	if(uni.is(Object, name)) {
    		var x;
    		for(x in name) {
    			this.extend(x, name[x][0], name[x][1])
    		}
    		return this;
    	}
    
       	options = options || {};

        // 	Extension of Object is done via a function wrapper. The method 
        // 	passed to #extend will be executed within the following function
        //	scope. This allows pre and post processing, etc. A sort of currying.
        //
        var wrappedF = function() {
        
        	//	Will contain the arguments sent to method wrapper.
        	//
        	var args 	= aProtoS.call(arguments),	
        	
				//	The argument sent to onBefore/onAfter methods.
				//
				sig		= 	{	
								"method"		:   name,
								"ctxt"			:	this,
                				"func"			:   fn,
                				"opts"			:	options,
                				"args"			:   args,
                				"origSub"		:	null,
                				"candidateSub"	:	null,
                				"error"			:	false,
                				"id"			:	this.ns._.id
                			},
	
				//	Stores the result of the target function that we are 
				//	wrapping here.  See below.
				R;

            //	If we are waiting for requirements, store subsequent method
            //	requests, until we have all requirements.  We also need to not
            //	queue `require` itself, and of course, `queue`...
            //
            if(required.length > 0 && (name !== 'require' && name !== 'queue')) {
            
            	//	Rather elaborate, but #queue allows flexible arguments length, allowing
            	//	developer to send any number of arguments to the method being queued. 
            	//	So we follow that protocol. Note that we are adding to queue '__require'.
            	//	
				this.queue.apply(this, ['__require', name].concat(args));
            	return this;
            } 

            // 	Has this method been called without a Subject being
            // 	defined? Default Subject is Array.  NOTE: The subject persists
            // 	in Object. If I execute operations against a Subject,
            // 	that Subject will hold its value in Object until a new 
            //	Subject is created.  
            //
            this.$ === undefined && this.sub([], 1);
            
            //	Keeping a record of the Subject as it existed prior to execution of method.
            //
            sig.origSub  = this.$;

            //	Run any pre-execution advice and make no changes if advised {Boolean}false.
            //
            //	@see		#advise
            //
            if(this.advice('_before', sig) === false) {
            	return this;
            };

            // 	Execute the method in Object scope, passing any arguments,
            // 	and catching any return value.  Note that we also update the signature.
            //
            try {
            
            	R = fn.apply(this, args); 
            	
            } catch(e) {

            	sig.error	= e;
            	
				//	Run any onError advice and exit if so advised.
				//
				//	@see		#advise
				//
				if(this.advice('_afterError', sig) === false) {
					return this;
				}
            }
            
            //	Update the signature data with the value that will become the Subject
            // 	value *if* after advice does not return false.
            //
            sig.candidateSub = R === undefined ? null : R;
            
            //	Run any post-execution advice and make no changes if advised {Boolean}false.
            //	Note that the #after advice can check the result of the method call and
            //	by returning false cancel the update of Subject.
            //
            //	@see		#advise
            //
            if(this.advice('_after', sig) === false) {
            	return this;
            }
                                    
            // 	Subject is only updated if there is a return value.
            //
            if(R !== undefined) {

                //	Usually you will want the Subject to contain the results of this
                //	operation.  Occasionally you may have a function that sometimes returns
                //	a chain-useful value, and other times a "final" value (like dom#attr).
                //	By returning an object with this signature:
                //
                //	{ $void: some value }
                //
                //	we will simply return the value of $void here, and the Subject
                //	will not be updated.  Of course this means that the chain is broken
                //	(must return `this` for chaining to continue), but that is probably
                //	exactly what you want.
                //
                if(uni.is(Object, R) && ('$void' in R)) {
                	return R.$void;
                }
            
            	// 	The Subject will receive a new value. In order to permit
            	// 	#restore, we want to store the current value in Object.$$.
            	// 	The value is cloned, dereferencing.
            	//
                this.$$ = this.$$ === this.$ ? this.$$ : this.copy(this.$);

                this.$  = R;
            }

            return this;
        };
        
        //	Store the extension information in the current Object namespace. This
        //	information is used by #spawn, to properly extend 
        //
        //	Note: the reason we are checking if Object has a #ns property is
        //	because of #hoist, which calls #extend, but from Uni prototype, 
        //	which doesn't have a namespace.
        //
        //	@see		#spawn
        //	@see		#hoist
        //	
        
        //	Note how in the following two operations any existing extensions
        //	with the sent name within Object will be be overwritten. This allows
        //	overriding parent Object methods (similar to js prototype chain), 
        //	which allows a kind of polymorphism.  OTOH, this may not be
        //	so neat if you don't want methods to be overwritten...
        //
        if(this.ns) {
        	this.ns._.extensions[name] = [fn, options];
        }
        
        //	Extend Object with wrapped extension.  
        //
        this[name] = wrappedF;  
        
        return this;
    };
}

// 	Create original instance.
//
uni = new Uni;


//	CORE EXTENSIONS
//
//	Out of the box extensions which nevertheless can be eliminated.  Note
//	that they are hoisted, which means they have extended the Uni prototype,
//	which means these extensions will be inherited by all Object copies (via
//	the prototype chain).
//
 
//	#namespace
//
//	Creates a namespace under Object.ns
//
//	@param  	{String}    	nstr    The namespace, form of `chain.like.this`, which 
//                              		creates uni.ns.chain.like.this namespace.
//	@param		{Object}		[ass]	An array or object whose key/val pairs will be
//										assigned to the new namespace.
//	@type		{Object}
//	@return								The new namespace reference.
//
// 	@example	uni.namespace('my.space').foo = 'bar';
//				uni.notify(uni.ns); // #ns>my>space>foo = bar
//
uni.hoist('namespace', function(nstr, ass) {   
    
    var n,
      	p,
       	ns 	= this.ns,
        	
       	//	Note that if no `nstr` is sent (ie. no arguments sent), then
       	//	`nstr` is set to an empty array (ie. no loop), allowing method 
       	//	to exit with this.ns untouched.
       	//
       	x 	= nstr ? nstr.split(".")  : [],
        	
       	//	You need to send an object (or array).  Other types will be converted into
       	//	some form of object.  Note: in browsers other than IE, strings are converted
       	//	into an iterable object, which may be interesting:
       	//
       	//	new Object('hello') = { 0: 'h', 1: 'e' ... }
       	//
       	a	= new Object(ass);
        
	//	We actually create the namespace here. Note that existing nodes are preserved.
    //
    for(n=0; n < x.length; n++) {
        ns = ns[x[n]] = ns[x[n]] || {};
    }

	//	Assign any sent values.
	//
	for(p in a) {
		ns[p] = a[p];
	}
});
 
//	#save
//	
// 	As you operate on the Subject there may be times you'll want to save
// 	its current state, allowing you to take snapshots at various points
// 	in the chain. As the saved value is a clone of the Subject it is now
// 	dereferenced, and so modifying the Subject going forward is safe.
//	
// 	@param     	{String}    	[nm]  		A namespace.
// 	@param     	{String}    	[k]   		An specific key in the namespace.
// 
// 	@example   	
//				//	Subject = 	uni.ns.my.namespace.that
//				uni.save('my.namespace','that') 
//
//				// 	Subject = 	uni.ns.other.namespace.$
//            	uni.save('other.namespace') 
//
//				// 	Subject = 	uni.$$
//            	uni.save()                          
//
uni.hoist('save', function(nm, k) {

	var c	= this.copy(this.$),
		a	= {};
	
	if(!arguments.length) {
		this.$$ = c;
		return;
	} 

	//	Create the k/v pair to store in namespace.
	//
	a[k || '$'] 	= c;

	this.namespace(nm, a);
});


//	#restore
//
//	Whenever the Subject changes the previous Subject is stored
//	in Object.$$.  Here we simply restore that value.  Note that
// 	the current Subject will now be stored in Object.$$, allowing
//	some useful toggling.
//
//	@see		#sub
//	@see		#extend
//
uni.hoist('restore', function(a) {
	return a || this.$$;
});

//	#within
//
//	Generalized way to execute a function within the scope of Object.  As this method will be 
//	#queue(ed) during dependency loading (#require), whatever code is contained by the function
//	argument will only execute after all required scripts are loaded, so it can be used as a sort
//	of "onScriptsLoaded" method as well.
//
//	@param		{Function}		fn			The function to execute.
//	@param		{Mixed}			[t]			An Object.
//
uni.hoist('within', function(fn, t) {
	fn.call(t || this);		
});
  
//	#map
// 
// 	Replaces each element of Subject with result of passed function.  The mapping function will
//	be passed two arguments: ( item , index ).  It will operate on both arrays and objects.
// 
//	@param		{Function}		f		The mapping function.
//	@param		{Mixed}			[t]		A Subject.
//	@type		{Array}
//
//	@see		#forEach
//
uni.hoist('map', function(fn, t) {
	return 	reducer.call(this, function(a, e, i) {
				a[i] = fn.call(this, e, i, a);
				return a;
			}, [], t);
});

//	#forEach
//	
//	Passes value of each Subject item to an iterator function.  The current Subject will *not*
//	be updated.
//
//	@see		#map
//
uni.hoist('forEach', function(fn, t) {
	reducer.call(this, function(a, e, i) {
		fn.call(this, e, i);
	}, [], t);
});

//	#filter
//
//	Applies a function to each element of Subject array. If function returns 
//	true, then the current element is added to a collector array, which is
//	returned after the Subject array has been walked.
//
//	@param		{Function}		fn		The selective function.
//	@param		{Array}			[t]		Default is to use Object Subject.  You can send another
//										array to use instead. Note that Subject will be set
//										to the resulting set regardless.
//	@type		{Array}		
//
//	@example	This will return an array of all the odd numbers in Subject array.
//				
//				uni
//					.sub([1,2,3,4])
//					.filter(function(i) {
//						return i % 2;
//					})
//
//	@see		#hasAuditor
//
uni.hoist('filter', function(fn, t) {

	//	This is an internal "hack", which allows #filter name to be used in the sense of
	//	filtering Dom elements, via the Dom core extension. This practice is unfortunate, but
	//	we want to maintain the name for both new js Array.filter, and for the expected naming
	//	re: filtering Dom elements.  There is no check other than assuming that not getting a
	//	function means we got a string, and it's a selector, and the Dom extension is loaded.
	//	Do not use this elsewhere, and maintain its functional signature.
	//
	var f = uni.is(Function, fn) ? fn : function(i) { return this.match(fn, i); };

	return reducer.call(this, function(a, e, i) {
		f.call(this, e, i) && a.push(e);
		return a;
	}, [], t);
});

//	#unique
//
//	Removes duplicate items in an array.
//
//	@param		{Mixed}		[t]		An array to work on. Defaults to Subject.
//
uni.hoist('unique', function(t) {
	return reducer.call(this, function(a, e, i) {
		!this.contains(e, a) && a.push(e);
		return a;
	}, [], t);
});

//	#reduceRight
//
//	Combines all the values of Subject array based on combinator function, starting from the
//	last item.
//
//	@param		{Function}		fn		The combinator.
//	@param		{Mixed}			a		The accumulator.
//	@param		{Array}			[t]		Default is to use Object Subject.  You can send another
//										array to use instead. Note that Subject will receive
//										value of the resulting set regardless.
//	@param		{init}			init	The initial value.
//
uni.hoist('reduceRight', function(fn, a, t) {
	return reducer.call(this, fn, a, (t || this.$).reverse());
});

//	#reduce
//
//	Combines all the values of Subject array based on combinator function, starting from the
//	first item.
//
//	@param		{Function}		fn		The combinator.
//	@param		{Mixed}			a		The accumulator.
//	@param		{Array}			[t]		Default is to use Object Subject.  You can send another
//										array to use instead. Note that Subject will receive
//										value of the resulting set regardless.
//
uni.hoist('reduce', function(fn, a, t) {
	return reducer.call(this, fn, a, t);
});

//	#first
//
//	Sets Subject to first item in Subject which matches. You can select the first item by
//	not sending the matcher (no arguments).
//
//	@param		{Function}		[fn]	The matcher.
//	@param		{Array}			[d]		Default is to use Object Subject.  You can send another
//										array to use instead.
//
//	@see		#firstlast
//
uni.hoist('first', function(fn, t) {
  	return firstlast.call(this, true, fn, t);
});

//	#last
//
//	Returns the last item in Subject array which matches function.
//
//	@param		{Function}		[fn]	The matcher. If nothing is sent, simply return the 
//										last item.
//	@param		{Array}			[t]		Default is to use Object Subject.  You can send another
//										array to use instead. Note that Subject will receive
//										value of the resulting set regardless.	
//
//	@see		#firstlast
//
uni.hoist('last', function(fn, t) {
  	return firstlast.call(this, false, fn, t);
});


//	#queue
//
//	Queue Object method calls.  Note that this system only works with Object methods which
//	have been extended (via #extend).  
//
//	Internally, queueing happens while #require is executing -- any Object methods called
//	while #require is active are #queue'd.  These methods are often being passed arguments.
//	Any number of arguments can be passed along to this method, following the required
//	arguments of queue name and method name. These will be passed again when the 
//	queued item is called.  
//
//	@param		{Mixed}			qn		The queue to add to.
//	@param		{String}		n		The name of the method to queue.
//
//	@see		#require
//	@see 		#queue
//	@see		#runQueue
//	@see		#extend
//
//	@example:	uni.queue('myQueue', someFunc(a,b){}, valueForA, valueForB)
//
uni.hoist('queue', function(qn, n) {
    
    //	Again, note how we are collecting the tail of the arguments object.
    //
   	var args	= aProtoS.call(arguments, 2);
    
    //	Automatically creates a new queue if none exists, preserving existing.
    //
   	Q[qn] = Q[qn] || [];
    	
   	//	Note that if we are not sent an array, we have either undefined or a
   	//	Function.arguments object.  Both of these other cases are converted to
   	//	arrays.  
   	//
   	Q[qn].push([n, args, this]);
});

//	#dequeue
//
//	Removes items from a queue, or clears queue.  
//
//	@param		{String}		qn		The name of the queue to work on.
//	@param		{Function}		[fn]	A filter function, which will be passed two arguments
//										representing each queue item (method name, arguments), 
//										and causes item removal if it returns true.  If no
//										filter is sent, all queue items are cleared.
//	@see		#queue
//										
//
uni.hoist('dequeue', function(qn, fn) {
    	
   	var q	= Q[qn] || [],
   		n	= q.length;
    	
   	//	Not sent a filter, simply clear queue.
   	//
   	if(qn && !uni.is(Function, fn)) {
    	
   		Q[qn] = [];
    		
   	} else {
    	
   		while(n--) {
    			
   			//	Filtering. If filter function returns true, remove the queue item.
   			//
   			//	q[n][0] === queue[queueName][methodName]
   			//	q[n][1] === queue[queueName][argumentsArray]
   			//
   			if(fn.call(this,q[n][0],q[n][1])) {
   				q.splice(n,1);
   			}
   		}
   	}
});

//	#runQueue
//
//	Executes all queued Object methods in a given queue.
//
//	@param		{String}		[q]			The name of the queue. 
//	@param		{Boolean}		[keep]		Whether to keep the queue contents, allowing a
//											queue to be run multiple times. Default is to
//											destroy the queue contents after it has run.
//	@see		#require
//	@see 		#queue
//	@see		#runQueue
//	@see		#extend
//
uni.hoist('runQueue', function(qn, keep) {
    
   	var rq	= Q[qn] = Q[qn] || [],
		c = 0,
		cl = rq.length;

	while(c < cl) {
		
		//	Simply go through the queue and execute the methods, in the proper scope,
		//	applying the stored argument array.
		//
		//	rq[c][0]	=== queue[index][methodName]
		//	rq[c][1]	=== queue[index][argumentsArray]
		//	rq[c][2]	=== queue[index][scope]
		//
		rq[c][2][rq[c][0]].apply(rq[c][2], rq[c][1]);
		
		++c;
	}
		
	if(!keep) {
		Q[qn] = [];
	}
});

//	#test
//
//	Executes a function until said function returns false.  This means your function
//	needs to return true if it wants to remain on the audit list.
//
//	@param		{Function}		fn		The function to execute.
//	@param		{Object}		[op]	Options:
//											id:	
//												An id for the function. Useful if you want
//												to remove it "by hand".  Default is
//												the result of #uuid.
//											maxTime:
//												The maximum number of (milliseconds) to live.
//												Expiration consequence identical to 
//												returning false.
//											maxCycles:
//												The maximum number of executions of function.
//												Expiration consequence identical to 
//												returning false.
//	@see		#audit
//	@see		#hasAuditor
//
uni.hoist('test', function(fn, op) {
    
   	op	=	op || {};

   	var t	= new Date().getTime();
   	
   	op.id 				= op.id			|| uni.uuid();
   	op.startTime 		= t;
   	op.currentTime 		= t;
   	op.lastTime 		= t;
   	op.totalTime 		= 0;
   	op.maxTime			= op.maxTime || false;
   	op.cycles 			= 0;
   	op.maxCycles 		= op.maxCycles || false;
   	op.main 			= fn;

   	//	Create the execution context.
   	//
   	auditors.push(op);
});

//	#observe
//
//	Watch for the firing of a named event.
//
//	@param		{String}		[nm]	The name of event to listen for. If no name is sent,
//										the callback will be fired on event `domReady`.
//	@param		{Function}		fn		The callback to call when event is fired.
//	@param		{Object}		[op]	Options:
//											.scope	> 	Scope to fire the callback in.
//														Default is scope #observe called in.
//											.greedy	>	Whether to fire immediately if the
//														event has occurred in the past. 
//														Default behavior is to fire immediately.
//										NOTE: You can add as many properties to this object as
//										you'd like. A unique identifier .id can be used when
//										matching on #unobserve, for instance.
//
//	It is important to note that the observer system does not expect event
//	qualification, via something like makeObservableEvent().  You may observe on any
//	string or selector or even a data type.  There is no way to know if another
//	part of the system is aware of the event you're observing, or if it will
//	ever be fired.
//
//	@see		#unobserve
//	@see		#fire
//
//	@example	this
//					.observe('foo', function() { uni.notify('bar'); })
//					.fire('foo') // console > 'bar'
//
uni.hoist('observe', function (nm, fn, op) {

   	//	Note default event handling.  Set the `domReady` event and shift arguments.
   	//
   	if(uni.is(Function, nm)) {
   		op 	= fn;
   		fn	= nm;
   		nm	= 'domReady';
   	}
    
   	op	= op || {};
    	
   	var p,
   		scp		= op.scope 	|| this,
   		grd		= op.greedy === undefined ? true : op.greedy,
   	
   		//	This is ultimately the data signature representing an observer.  It will
   		//	be augmented with any additional attributes the caller has passed via `op`. 
   		//	Note that `dt` properties will *not* be overridden by duplicates in `op`.
   		//
   		dt	= {
			name	: nm,
			fn		: fn,
			scope	: scp
   		};
   		
   	//	Augment data.
   	//
   	for(p in op) {
   		dt[p] = dt[p] || op[p];
   	}
   	
   	//	Automatically create non-existent event handles.  Any `nm` sent will be given
   	//	a namespace within which to keep track of its observers, without discrimination.
   	//
	if(!events[nm]) {
		events[nm] = { 
			observers: 	[],
			fired:		false
		};
	}
	
	//	Add index of observer within list of observers to its data object.
	//
	//dt.index 	= events[nm].observers.length;
	
	//	We have now added an observer to be notified when `nm` is is #fire(d).
	//
   	events[nm].observers.push(dt);
   	
   	//	Notify that an observer has been created. This allows the tracking of observer
   	//	creation, should some garbage collection be needed where those observers
   	//	need to be removed.
   	//
   	uni.fire("uni:observerSet", dt);

	//	Some events will fire only once. As such, some observers will want to fire 
	// 	immediately if the event has already fired. An example would be domReady. If 
	//	the observer request is made after a domReady has already fired, its callback 
	// 	will never fire, which is probably not the desired behavior.  So upon observation 
	// 	request caller can ask to fire immediately if event has already fired.
	//
	if(grd && events[nm].fired) {
		return fireObserver(fn, scp, events[nm].fired, dt);
	}
});

//	#observeOnce
//
//	Once notified, the observer is removed.
//
uni.hoist("observeOnce", function(nm, fn) {
	uni.observe(nm, fn, {once: true});
});
	
//	#unobserve
//
//	Ask to be removed from observers list for an event.  
//
//	@param		{Mixed}		nm		The name of the event to unobserve.  If you pass a Function, 
//									it will be assumed that you are passing a filter for 
//									*all* observed events.
//						
//	@param		{Function}	[fn]	If this is undefined, all observers for this event
//									are removed. Otherwise, the call data for each
//									observer is passed to this filter, being removed if
//									filter returns true.  Note that the filter function (the
//									method you have passed as `fn`) will execute in the scope
//									of the observer object (this == observer object).
//
//	@see		#observe
//	@see		#fire
//
uni.hoist('unobserve', function(nm, fn) {
	var i,
		ob;

	if(uni.is(Function, nm)) {
		for(i in events) {
			uni.unobserve(i, nm);
		}
	} else if(events[nm]) {
		ob 	= events[nm].observers;
		i	= ob.length;
		while(i--) {
			//	Note that we execute any Function in the scope of the event object, such that
			//	the Function should be checking against #this.
			//
			if(fn === undefined || fn.call(ob[i]) === true) {
				ob.splice(i,1);
			}
		}
	}
});

//	#fire
//
//	Fires an observable event.
//
//	@param		{String}		nm		The name of the event.
//	@param		{Mixed}			[data]	You may pass event data of any type using this parameter.
//										This data will be passed to all observers as the second
//										argument to their callbacks.
//	@param		{Function}		[after]	You may pass a method to fire after observers have fired.
//
//	@see		#observe
//	@see		#unobserve
//
uni.hoist('fire', function(nm, data, after) {

	var i,
		ob,
		obi,
		fResult;

	data	= data || {};

	if(!events[nm]) {
		//	TODO: regexp check NOTE: need to reflect regexp behavior in #unobserve as well.
		//
		return;
	} 
	
	//	Observers should be fired in order. It is possible that an observer will be removed
	//	at some time during this loop (#once). So we reverse the list, and work backwards, 
	//	avoiding pointer mismatches when splices occur.
	//
	ob 	= events[nm].observers.reverse();
	i	= ob.length;
	while(i--) {
		
		obi = ob[i];
			
		//	If this observer was attached via #observeOnce, the #once property will
		//	be set.  Note that, below, we set #fired once an event has occurred.  As
		//	such, we watch for both #once and #fired being set, in which case we 
		//	remove the observer.
		//
		if(obi.once && obi.fired) {
			uni.unobserve(nm, function() {
				return this.fn === obi.fn;
			});
		} else {
			
			fResult = fireObserver(obi.fn, obi.scope, data, obi);
				
			//	Indicate that this event has fired at least once.  We also store any passed
			//	data here, which is useful should a handler wish to examine previous data
			// 	sent to observer. 
			//
			//	@see	#observe
			//
			obi.fired	= data;
		}
	}
	
	if(after) {
		after(data, ob, fResult);
	}

	return fResult;
});

//	#fireOnce
//
//	Will remove all observers of an event after the event has fired.
//
//	@param		{String}		nm		The name of the event.
//	@param		{Mixed}			[data]	You may pass event data of any type using this parameter.
//										This data will be passed to all observers as the second
//										argument to their callbacks.
//	@param		{Function}		[after]	You may pass a method to fire after observers have fired.
//
uni.hoist('fireOnce', function(nm, data, after) {
	var fr = this.fire(nm, data, after);
	this.unobserve(nm);
	
	return fr;
});

//	#branch
//
//	Conditional execution based on a function result.  
//
//	@param		{Function}		fn		The decisive function.
//	@param		{Object}		cho		The choice list.  An object which presents functions bound
//										to identifiers representing expected function results.
//
//	If you would like to pass arguments to the function, simply add them in the #branch call.
//
//	@example
//
//			uni.branch(	function(a,b) { 
//							return a !== b; 
//						}, 
//						{ 
//							'true': 	f(){...},
//							'false':	f(){...}
//						},
//						'foo', // <- passing arguments to function.
//						'bar');
//
//	Here the conditional will return true, and the truth branch will execute.  Note that you must
//	place quotes around boolean identifiers. Somewhat surprisingly Firefox allows use of unquoted
//	booleans as identifiers, but this excellent behavior is not supported elsewhere.  Note as well
//	that your function can return any value -- it need not be a boolean.  If in the above example
//	you return "ok", any function attached to an "ok" identifier would be executed.
//
uni.hoist('branch', function(fn, cho) {

	var r	= fn.apply(this, aProtoS.call(arguments, 2));

	//	Note that the executing branch is passed the function result.
	//
	cho[r] && cho[r].call(this, r);
});

//	Set advice
//
//	@param		{Mixed}		[a]		An object containing advisor methods
//										{
//											before: 	function() {...}
//											after:		function() {...}
//											onError:	function() {...}
//										}
//									By sending no arguments, *all* existing advice is cleared.
//									By passing attributes with `null` values, you can clear
//									individual directives.  Given the above advice, you could
//									eliminate just `after` by passing:
//										{
//											after: null
//										}
//
uni.hoist('advise', function(a) {
	var ns 	= this.ns._,
		p;
		
	if(uni.is(Object, a)) {
		for(p in a) {
			ns.advice[p] = a[p]
			if(a[p] === null) {
				delete ns.advice[p];
			}
		}
	} else if(a === undefined) {
		ns.advice = {}
	}
});

//	#enable
//
//	Allows the loading of dependencies with the added benefit of returning control to the
//	scope of the calling function, allowing dependencies to be requested within a function
//	body and the execution of said function to be halted until dependencies are ready.
//	For example:
//	
//	startGame = function(arg1, arg2) {
//		if(!uni.is(Function, uni.move)) { // dep. not loaded; method not available.
//			uni.enable(['game.js', 'controls.js'], arguments); // note `arguments`
//			
//			return; // note that we return here, to come back when dep. loaded.
//		}
//
//		... // start code continues here.
//	}
//
//	Here we pass #enable some dependencies to load, and the `arguments` object of the function.
//	We return, avoiding execution until dependencies are loaded. When the dependencies are
//	loaded, the calling function will be re-called, passing original arguments, and as the
//	dependencies will now exist, the method will execute as expected.
//
//	Note as well that the #require method in uni queues uni# methods while #require's are
//	out, such that until the dependencies are loaded uni methods will not execute.
//
//	@param		{Mixed}		deps		Either an array or a string, to be passed to #require.
//	@param		{Mixed}		arg			Either an `arguments` object, or a Function.  If a
//										Function, will be called upon depency load, being passed
//										any arguments in addition to the two sent to this method.
//
uni.hoist('enable', function(deps, arg) {
	var a = arguments;
	uni.require(deps, function() {
		if(arg.callee) {
			arg.callee.apply(window, arg);
		} else {
			arg.apply(this, aProtoS.call(a, 2));
		}
	});
});

//	#require
//
//	The key side effect of #require is that while the required
//	scripts are loading, any Object calls are queued, to be executed
//	only after required files have loaded. This allows the delaying
//	of execution of chains until dependencies have loaded, without
//	blocking overall execution and efficiently loading requirements
//	in parallel. 
//
//	@example		uni
//						.require('methods1and2.js', function() { 
//							uni
//								.method1()
//								.method2()
//						})
//
//						.require('getSize.js', function() {
//							uni
//								.getSize(method1(document.element))
//								.require('anotherfile.js', function() {
//									uni
//										.something()
//								})
//								.reduceRight(function(){})
//						})
//
//						.map(function(){
//							// Note that we can rely on this being available,
//							// as required ensures loading, above.
//							method1();
//						})
//						.reduce(function(a,b) {
//							return ...;
//						}, 0)
//
//	Here the execution of all of the methods (1,2,3,map,reduce) would wait until
//	both .js files have loaded, and then order of execution would be, REGARDLESS
//	of which script loaded first:
//		>	require()
//		>	require()
//		> 	map()
//		> 	method1()
//		> 	reduce()
//		>	method1()
//		>	method2()
//		>	getSize()
//		> 	require()
//		>	reduceRight()
//		>	something()
//
//	Asychronous parallel loading of dependencies w/ onload handlers fired in 
// 	order of request, post-require #uni methods queued, executing only after
//	dependencies initialized.
//
uni.hoist('require', function(src, origLoad) {

	origLoad	= uni.is(Function, origLoad) ? origLoad : uni.noop;

	//	Handle arrays.  Note that the onLoad method will be applied after all are ready.
	//
	if(uni.is(Array, src)) {
		uni.forEach(function(e, i) {
			uni.require(e);
		}, src)
		
		.within(function() {
			origLoad.call(this);
		})
		
		return;
	}

	//	If we have received a request for a framework file (one that is not preceeded by
	//	http) we prefix the framework path.  A typical framework file request would be 
	//	something like "core/notify.js".
	//
	if(src.indexOf("http://") === -1) {
		src 	= uni.path() + src;
	}

	//	First check if this src has already been requested.  If so, ignore the new request.
	//	Note that we concat both *scripts(completed) and *required(queued) collections, as
	//	the duplicate could be in either.
	//
	var ts	= scripts.concat(required),
		i 	= ts.length;
	while(i--) {
		if(ts[i].src === src) {
			return;
		}
	}

	var	t		= this,
		onload	= function() {	
			var w,
				s,
				sn;

			//	Push this now-loaded requirement onto the stack
			// 	of loaded scripts.
			//
			scripts.push(required.shift());
			
			//	If there are no more requirements being loaded,
			//	then it is time to run queued instructions, and
			//	any onload handlers.
			//
			if(required.length < 1) {
			
				// 	Run any queued instructions.
				//
				t.runQueue('__require');
			
				//	Now run any onload handlers set on the required
				//	scripts. Note that the onload handlers will be run
				// 	in the order they were required, and will execute
				//	in Object scope.
				//
				for(w=0; w < scripts.length; w++) {
					s	= scripts[w];
					sn 	= s.snode;
					if(sn.loaded === false) {
					
						sn.loaded = true;

						//	Here is where we are ultimately calling the passed onload
						//	handler (origLoad), whose reference had been being passed
						//	around in the $required/$scripts process.  See below.
						//
						s.onload.call(t);
						
						delete s.onload;

						sn.parentNode.removeChild(sn);
					}
				}
			}
		},
		
		s	= this.insertScriptNode(src, onload);

	// 	We are now going to push this newly required script object onto a queue.
	//	As each required script is loaded, we will check if *all* required scripts have 
	// 	loaded. At which point all the onload handlers will be fired, in order.  See the
	//	#onload handler defined above.
	//
	required.push({
		src:	src,
		snode:	s,
		onload:	origLoad || this.noop
	});
});

//	#getScript
//
//	Simply inserts a script and fires a callback when ready.  If you want to queue methods
//	in the chain, use #require.
//
//	@param		{String}		src		The script source (http://file.com)
//	@param		{Function}		[fn]	A callback function.
//
uni.hoist('getScript', function(src, fn) {
	this.insertScriptNode(src, fn);
});

//	#augment
//
//	Adds the properties of any number of objects to the target object.
//
//	@param		{Object}		t		The target object, which will receive new properties.
//
uni.hoist('augment', function(t) {

	var a	= AProtoS.call(arguments, 1),
		c	= a.length,
		n	= uni.copy(t),
		//	Internal augment if there is only one argument.
		//
		i	= c === 0,
		x	= 0,
		y,
		ax;

	if(i) {
		n 	= this.$;
	} 

	for(; x < c; x++) {
		ax 	= a[x];
		for(y in ax) {
			n[y] = ax[y];
		}
	}
	
	if(i) {
		this.sub(n, 1);
	} 
	
	return {
		$void:	n
	}
});

///////////////////////////////////
//                               //
//      SOME INITIALIZATION      //
//                               //
///////////////////////////////////

//	Whether or not something is an instance of Uni (created by #spawn).  
//	Note that the global `uni` is understood as being an instance of Uni.
//
//	@example	uni.is(uni.Instance, e);
//
//	@see		#is
//	@see		#spawn
//
uni.extendProto("Instance", function(v) { 
	return v === uni || this.contains(v, uni.ns._.children);
});

uni.extendProto("NodeList", function(v) {
	return (v.length !== undefined) && uni.is(Function, v.item);
});

//	There is no (safe) global Element object safe for our purposes.  We want to be able
//	to provide checks for whether something is an Element.  So this (unfortunately) is
// 	necessary.
//
//	@example	uni.is(uni.Element, e);
//
//	@see		#is
//
uni.extendProto("Element", function(e) { 
	return 	typeof HTMLElement === "object" 
            	? e instanceof HTMLElement 
                	: 	typeof e === "object" 
                		&& e.nodeType === 1 
                		&& typeof e.nodeName === "string";
});

//	Whether an object has no enumerable properties.
//
uni.extendProto("EmptyObject", function(v) {
	var p;
	for(p in v) {
		return false;
	}
	return true;
});

//  Whether a value can be cast as a number. Usually used when you might have strings that
//  need to become Number objects.
//
//  @see CMS' answer: 
//  http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
//
uni.extendProto("Numeric", function(v) {
    return !isNaN(parseFloat(v)) && isFinite(v);
});

//	See http://forum.jquery.com/topic/faster-jquery-trim.
//	See: http://code.google.com/p/chromium/issues/detail?id=5206
//	This is a fix for browsers which do not recognize &nbsp; as a whitespace character.
//
//	@see		#trim
//	@see		#trimLeft
//	@see		#trimRight
//
if (!/\s/.test("\xA0")) {
	tLeft = /^[\s\xA0]+/;
	tRight = /[\s\xA0]+$/;
}

//	Online/offline checking.  We track future states of window.navigator.onLine.  Whenever 
//	the online status of this session changes, a subscribable event fires, "onLine" or "offLine".
//	Note that there is always an initial firing indicating the onLine state at the moment
//	which Uni was loaded.  "On Line" as in "you have an interweb connection".
//
uni.test(function(n) {
	return function(auditorInst) {
		if(auditorInst.onLine !== n.onLine) {
			auditorInst.onLine = n.onLine;
			uni.fire(auditorInst.onLine ? "onLine" : "offLine", auditorInst);
		}
		return true;
	}
}(window.navigator || window));

//	We will use JSON functionality.  Check if we have it natively, and build the kit. 
//	If not, load the json kit file.
//
window.JSON		?	uni.addKit("json", {
						parse: 		JSON.parse,
						stringify: 	JSON.stringify
					})
				: 	uni.require("kits/json.js");
							
//	Start the #test auditors
//
//	@see		#test
//	@see		#audit
//
setInterval(audit, 1);

})(this, Array, Object, Function, String); // Terminating init scope