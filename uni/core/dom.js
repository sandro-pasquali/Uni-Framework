//	`dom` kit
//

(function(window, document, Array, Function, String, Object, undefined) {

//	Need a selector engine.  Check if one is defined, and if not, load the default library.
//
if(!uni.is(Function, uni.match)) {
	//uni.enable(['core/selector.js'], arguments);
	//return;
}

//	Create namespace for selector caching.
//
//	@see		#selC
//
uni.namespace('_.selc');

//	Create namespace for data caching.
//
//	@see		#dataC
//
uni.namespace('_.datac');

//	Used my various dom setters, which accept either a string or function as their
//	first argument.  Creates a single argument type, a function.
//
//	@param		{Mixed}			a		The candidate argument.
//	@type		{Function}
//
var toFunc =	function(a) {
		return uni.is(Function, a) ? a : function() { return a; };
	},
	
	//	#getPixelValue
	//
	//	IE computedStyle will return original measurement instead of computed (px) size. Such
	//	as with a font set as `font-size: 1em` -- we want to get the computed `16px` (for 
	//	example), and not what IE sends, which is `1em`.  This normalizes, returning an 
	//	integer.
	//
	// 	From: http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
	//
	//	@see		#getComputedStyle
	//
	getPixelValue = function(el, value) {
		
		var px 		= /^\d+(px)?$/i,
			e		= el,
			ers		= el.runtimeStyle,
			rs,
			st;
			
		if (px.test(value)) {
			return parseInt(value);
		}
			
		if(ers) {
			
			st = e.style.left;
			rs = ers.left;
				
			ers.left = e.currentStyle.left;
			e.style.left = value || 0;
			value = e.style.pixelLeft;
			e.style.left = st;
			ers.left = rs;
		}
			
		return value;
	},

	//	Determines what the Subject is.
	//
	//	Various argument signatures are in play with Dom methods.  As the developer can
	//	usually send a Subject to a method, and the number of arguments varies, that 
	//	sent Subject can appear in various places. Additionally, going through the 
	//	#element method means methods will always be called with two arguments plus a
	//	third, which will be the current Subject (the newly created element).  So we check
	//	if a[zero-index] a[2] argument is set -- this means an #element call, and
	//	that will represent the Subject.  If no `n` argument is sent, then we will
	//	use a[1] argument if set (most common place for a sent Subject), or Subject.
	//	If `n` is set to `2` the first two arguments are method arguments, so use Subject -- 
	// 	two-argument methods usually do not have the ability to accept a sent Subject, as these
	//	usually accept eiher one or two arguments, and therefore the developer would *always*
	//	have to send two arguments to send a Subject. Additionally, it is unclear what to send as
	//	the second, placeholder, argument, since many of these functions would accept any sort of
	//	value in that slot, and as such there would be no way to do type checking to see if it
	// 	is a Subject (usually an array) or just the second argument of the method.  Finally, 
	//	if `n` is set to `1` we check the first argument -- this is for methods that might  
	//	handle no arguments (like #empty) which are sent a Subject.
	//
	//	@param		{Object}		a		an Arguments object.
	//	@param		{Object}		s		The calling Object.
	//	@param		{Number}		[n]		Meta-info for arguments.
	//	@see		#element
	//
	gSub = function(a, s, n) {
		a  	= Array.prototype.slice.call(a);
		n	= n || 0;

		var m = [a[1], a[0], false],
			t = a[2] || (m[n] || s.$);

		//	The subject for Dom manipulation is always an array, even if only one element
		//	is being used.  Here is where that rule is enforced.
		//
		return uni.is(Array, t) ? t : [t];
	},
	
	//	Cache selector results.
	//
	//	This is mainly used by #newEl in order to keep cloned versions of element groups.
	//	Goal is to cache the results when a selector string ('div#foo') is passed as an argument
	//	to methods which might move the selected group, appending them somewhere else, etc.  
	//	Examples would be #before, #after...
	//	The expected behavior is to move the selected nodes in the dom tree from their
	//	original location on the first request, then use clones of these nodes whenever 
	//	further manipulation is requested (such as when a single selected group is appended
	//	to each of another group of elements).
	//
	//	Note that this is a temporary cache, which is expected to be cleared following
	//	each manipulation operation.  It is used to store state while iterating, not to
	//	cache selector results indefinitely.
	//
	//	@see		#dom
	//
	selC 	= function(sel, coll) {

		var ns		= uni.ns._.selc,
			i 		= 0,
			f 		= [];
			
		//	No arguments clears the cache.
		//
		if(!arguments.length) {

			uni.ns._.selc = {};
			return;
		}
			
		if(coll) {
			
			while(i < coll.length) {
				f[i] = coll[i].cloneNode(true);
				i++;
			}
			
			ns[sel] = f;
		} 
		
		return ns[sel] || null;
	},
	
	//	For methods which accept various element definitions (html, element, Instance, selector).
	//	Will translate what is sent into an array of elements.  Mainly used in
	//	conjunction with #dom.
	//
	//	@param		{Mixed}			domB	A domBuilder.
	//	@param		{Object}		clone	Whether or not to clone the element.
	//	@param		{Object}		p		For selectors, a parent to select within.
	//
	//	@see		#dom
	//
	newEl = function(domB, clone, p) {

		var f 	= [],
			d 	= document.createElement('div'),
			n 	= 0,
			c,
			s;
		
		//	Handle an HTML string
		//
		if(/<[\w\W]+>/.test(domB)) {
		
			d.innerHTML = domB;
			c 			= d.childNodes;
			n 			= 0;
			
			while(n < c.length) {
				f[n] = c[n].cloneNode(true);
				n++;
			}
			
			return f;
		}
		
		if(uni.is(uni.Instance, domB)) {
			while(n < domB.$.length) {
				f[n] = clone ? domB.$[n].cloneNode(true) : domB.$[n];
				n++;
			}
			
			return f;
		}
		
		if(uni.is(uni.Element, domB)) {
			return [clone ? domB.cloneNode(true) : domB];
		}
		
		//	Assuming this is a selector if a string.
		//
		if(uni.is(String, domB)) {
			//	Note that on first pass real elements are moved. Subsequent
			//	passes use the cached version, which is a collection of clones.
			//	Re-cache each pass, for the same reason.
			//
			f = selC(domB) || uni.spawn().select(domB, p).$;

			selC(domB, f);

			return f;
		}

		
		//	Assume that getting here means we are creating an array. 
		//
		return uni.is(Array, domB) ? domB : [domB];
	},	
	
//
//	DOM manipulation methods
//

	dmeth	= {
	
		//	#seek
		//
		//	A utility method which probably should not be used directly.  Runs a Dom 
		//	traversing method (.nextSibling, etc) on a Subject optionally limited by a selector.
		//
		//	@param		{Mixed}		t		Either an array of Dom elements, or a single element.
		//	@param		{String}	m		The traversal method.
		//	@param		{String}	[s]		An optional selector to limit the returned list.
		//	@param		{Boolean}	[dos]	Whether to stop seeking when selector is hit.
		//
		//	@see		#nextAll
		//	@see		#nextUntil
		//	@see		#prevAll
		//	@see		#prevUntil
		//
		seek: 	function(t, m, s, dos) {
	
			t	= uni.is(Array, t) ? t : [t];
			
			var r = [],
				n;
				
			uni.forEach(function(e, i) {

				//	Get the traversal function from element.
				//
				n = e[m];

				while(n && n.nodeType !== 9) {

					if(n.nodeType === 1) {
						if(s === undefined) {
							r.push(n);
						} else {
							if(this.match(s,n)) {
								if(dos) {
									break;
								} else {
									r.push(n);
								}
							} else if(dos) {
								r.push(n);
							}
						}
					}
					n = n[m];
				}
			}, t);
			
			//	The Subject will be set to the unique-ified list.
			//
			this.unique(r);
		},
		
		//	#dom
		//
		//	Generalized interface for doing Dom manipulations. This is intended for
		//	internal use.  It is passed what will be referred to in the rest of this 
		//	documentation as a 'domBuilder'.  This consists of a mixed bag of instructions
		//	which ultimately get translated into a collection of elements.  A domBuilder can
		//	be either of:
		//	
		//	-	A string of html ('fee<p>foo</p>bar');
		//	-	An element (via getElementById or similar);
		//	-	A CSS selector string;
		//	- 	An Object (whose Subject will be used);
		//	-	An array of elements;
		//
		//	@param		{Mixed}		app		The element(s) to append, as html string, selector, 
		//									Object, etc.
		//	@param		{Object}	args	An Arguments object, representing arguments sent to
		//									caller, which is using this interface.
		//	@param		{String}	meth	The method to use:
		//										before[insertBefore] 	- 'bef';
		//										after[insertAfter] 		- 'aft';
		//										append[appendTo] 		- 'app';
		//										prepend[prependTo] 		- 'pre';
		//
		//	@see		#after
		//	@see		#before
		//	@see		#insertAfter
		//	@see		#insertBefore
		//	@see		#append
		//	@see		#prepend
		//	@see		#appendTo
		//	@see		#prependTo
		//
		dom: 	function(app, args, meth) {
	
			var t 	= gSub(args, this),
				f	= toFunc(app),
				h;

			//	For each of the Subject elements we are going to insert before/after...
			//
			this.forEach(function(targ, i) {

				//	Note the second argument. The first time the item to be inserted is
				// 	called, if it is a Dom node, we are *not* cloning, moving the item
				//	from its original location to the new before/after location.  Subsequent
				//	requests for this element need to clone the element, otherwise we are
				//	simply passing the same element around.  Note that this will only matter
				//	for elements, not for html strings.
				//
				h 	= newEl(f.call(this, i, targ), i > 0);

				//	...insert each of the elements we have been sent across current Subject item.
				//
				this.forEach(function(ins) {
	
					//	
					ins = i > 0 ? ins.cloneNode(true) : ins;
					
					switch(meth) {
					
						case 'bef':
							targ.parentNode.insertBefore(ins, targ);
						break;
						
						case 'aft':
							if(targ.nextSibling) {
								targ.parentNode.insertBefore(ins, targ.nextSibling);
							} else {
								targ.parentNode.appendChild(ins);
							}
						break;
						
						case 'app':
							targ.appendChild(ins);
						break;
						
						case 'pre':
							targ.insertBefore(ins, targ.firstChild);
						break;
					
						default:
						break;
					}
				}, h);
				
			}, t);
			
			selC();
		},
					
		//	#getComputedStyle
		//
		//	Returns the computed style on an element. 
		//
		//	@param		{String}		p		The property, such as "border" or "font-size". 
		//	@param		{Object}		[t]		Normally this would be used in an Object chain on a dom 
		//										element (via #find or similar).  If you pass a dom 
		//										element here, that will be operated on instead.
		//	@type		{Mixed}
		//	@return								The computed value. Will return integers for 
		//										appropriate property values (1px -> 1). Also will fix
		//										IE behavior re: non-pixel values (em, %), which is
		//										to return `1em` and not `16px` (for example).				
		//
		getComputedStyle: function(p, t) {
		
			t	= t || this.$;
			var str = "",
				css;
				
			//	Only accepts dashed properties, not camelcase ('font-size' not 'fontSize').
			//
			p	= this.uncamelize(p);
	
			if(document.defaultView && document.defaultView.getComputedStyle) {
			
				css = document.defaultView.getComputedStyle(t, null);
				str = css ? css.getPropertyValue(p) : null;
				
			} else if(t.currentStyle) {
			
				p = p.replace(/\-(\w)/g, function(strMatch, p1) {
					return p1.toUpperCase();
				});
				
				str = t.currentStyle[p];
			}

			return getPixelValue(t, str);
		},
	
		add:	function(a, c) {
			return newEl(a, false, c);
		},
	
	
		//	#addClass
		//
		//	One or more space-separated class names to add to an element.
		//
		//	@param		{Mixed}		classN		A string of space-separated class names, or a 
		//										function which returns such a string.
		//
		addClass: 	function(classN) {

			var t 	= gSub(arguments, this),
				f	= toFunc(classN),
				x;

			uni.forEach(function(e, i) {

				//	Note we split with regex so, in cases where we are repeatedly calling this
				//	method, the extra spaces being added (see below, above) don't go tribble. 
				//
				
				e.className = e.className ? e.className + ' ' : '';

				uni.forEach(function(c, i) {
					x = c + ' ';
					if(e.className.indexOf(x) < 0) {
						e.className += x; 
					}
				}, f.call(this, i, e.className).split(/\s+/));
				
			}, t);
		},
		
		//	#after
		//	
		//	Adds element(s) after each member of Subject (nextSibling).
		//
		//	@param		{Mixed}			domB	A domBuilder.
		//	@param		{Object}		[s]		A Subject (Dom element).
		//
		after: 		function(domB, s) {		
			this.dom(domB, arguments, 'aft');
		},
				
		//	test...
		andSelf:	function(o, p) {
			return this.$$.concat(this.$);
		},
		
		//	#append
		//	
		//	Appends element(s) to each member of Subject.
		//
		//	@param		{Mixed}			domB	A domBuilder.
		//	@param		{Object}		[s]		A Subject (Dom element).
		//
		append:		function(domB, s) {
			//window.sandro()
			this.dom(domB, arguments, 'app');
		},
		
		//	#appendTo
		//
		//	Appends each member of Subject to element(s)
		//
		//	@param		{Mixed}			domB	A domBuilder.
		//	@param		{Object}		[s]		A Subject (Dom element)
		//
		appendTo:	function(domB, s) {
			this.sub(newEl(domB), true);
			this.dom(this.$$, arguments, 'app')
			this.restore();
		},

		
		//	#attr
		//
		//	Allows the getting and setting of attributes on Dom elements.  Sending only the first
		//	argument (a string value, an attribute name) will return you the value of the
		//	attribute. 
		//
		//	@param		{Mixed}		att		Can be either a string (single attribute name), or
		//									an object containing attribute/value pairs.  If a
		//									a string you are either getting or setting a single
		//									attribute.  If an object, the attribute/value pairs
		//									contained will be set on the Subject.
		//	@param		{Mixed}		[val]	The value to set attribute to.
		//	@param		{Object}	[t]		A Dom element. Use this if you want to get/set 
		//									attributes on elements other than the current Subject.
		//									Note that to *get an attribute value you would 
		//									normally pass nothing for the `val` argument; if you
		//									want to pass along a 3rd party subject, you'll have
		//									to set `val` to false (need that arg slot filled).
		//
		//	@example	.attr('id', 'foo');
		//				.attr({
		//					name	: 'foo',
		//					'class'	: 'bar' // note quotes around 'class'!
		//				});
		//				.att('id')	// gets value of 'id' attribute.
		//
		attr:		function(att, val, t) {

			var p,
				f,
				g,
				s = gSub(arguments, this, 2); 

			//	Getting the attribute. Just send it back. 
			//	This will not change the Subject.
			//
			if(!val) {	
				return { $void: 	s[0].attributes.getNamedItem(att) 
									? s[0].getAttribute(att) 
									: s[0][att] };
			}
	
			//	First argument can either be an attribute map or a single attribute name.
			//	Convert into a single type, an attribute map.
			//
			att	= uni.is(Object, att) ? att : new function(a,b) { this[a] = b; }(att, val);

			this.forEach(function(e, i) {
				for(p in att) {
					
					f	= toFunc(att[p]);
					g	= e.attributes.getNamedItem(p);

					if(g) {
						e.setAttribute(p, f(i, g));
					} else {
						e[p] = f(i, e[p]);
					}
				}
			}, s);
		},

		//	#before
		//	
		//	Adds element(s) before each member of Subject (nextSibling).
		//
		//	@param		{Mixed}			domB	A domBuilder.
		//	@param		{Object}		[s]		A Subject (Dom element).
		//
		before: 	function(domB, s) {
			this.dom(domB, arguments, 'bef');
		},
		
		//	#children
		//
		//	Sets the Subject to all children of all elements in current Subject.  Note that this
		//	is a depth-1 search.  If you would like all descendents, use #find.
		//
		//	@param		{String}		[sel]		A selector.  If sent only children matching
		//											the selector will be returned.
		children:	function(sel, t) {
		
			t = gSub(arguments, this);
			
			var f = [];

			this
				.forEach(function(e) {
					this
						.forEach(function(nde, i) {
							if(nde.nodeType === 1 && (!sel || this.match(sel, nde))) {
								f.push(nde);
							}
						}, uni.toArray(e.childNodes));
				}, t);
			
			return f;
		},
		
		// 	#clone
		//
		//	Will clone the Subject (which should be a collection of nodes).
		//
		//	@param		{Object}		t		A 3rd party Subject.
		//
		clone:		function(t) {
			this.map(function(e, i) {
				return e.cloneNode(true);
			}, gSub(arguments, this));
		},
		
		closest:	function(o, p) {
		
		},
		
		//	#contains implemented in uni#contains
		//
		
		
		//	Work in Styles
		css:		function(att, val) {
				
		},
		
		//	#data
		//
		//	Allows the association of an element with data.
		//
		data:		function(k, v) {

			var a	= arguments,
				ns	= this.ns._.datac,
				id,
				n,
				f	= [];

			this.forEach(function(e, i) {

				id 	= this.attr('id', false, e) || this.uuid();	
				n 	= ns[id] = ns[id] || {};			

				//	If no arguments then we're adding the entire data collection for the 
				//	current element (`e`).
				//
				if(a.length === 0) {
				
					f[i] = n;
				
				//	If there is a value, we are setting data.
				//
				} else if(v) {

					n[k] = v;
				
				//	We are just getting, so add value to return collection.
				//
				} else {

					f[i] = n[k];
				}
				
			}, gSub(a, this, 2));

			return f.length === 1 ? f[0] : f;
		},
		
		detach:		function(o, p) {
		
		},
		
		doClone:	function(d, a, t) {
		
			t	=	this.$;
			t	= 	uni.is(uni.Element, t) ? [t] : t;
	
			return this.map(function(i) {
				return i.cloneNode(!!d);
			}, t);
		},
		
		//	#each is an alias for Uni#forEach
		//
		each:	function(fn, t) {
			this.forEach(fn, t);
		},
		
		//	#empty
		//	
		//	Destroys all children of an element.
		//
		empty:		function(t) {
			
			t = gSub(arguments, this, 1);

			this.forEach(function(e, i) {

				while(e.firstChild ) {
					e.removeChild(e.firstChild);
				}
				
			}, t);
		},
		
		//	#eq
		//
		//	Returns the item at the given index in Subject. You can pass negative values
		//	in order to fetch from a position beginning at end of Subject array.
		//
		//	@param		{Number}		i		The index.
		//
		eq:			function(i) {
			return 	i === -1 
					? this.$.slice(i)
					: this.$.slice(i, i + 1);
		},
		
		//	#_event
		//
		//	Note that this is a preprocessor which is simply assembling a call to be made to 
		//	#uni#event, which will do the event adding.  Mainly, it is creating a selector for
		//	the event by combining the tag + the .id or .class.  If neither a .id or .class
		//	is provided, no event will be attached.
		//
		_event:		function(e, f) {
			//	Note that we only grab the first element of the Subject to attach
			//	an event to.
			//
			var t 	= gSub(arguments, this)[0],
				sel;
			
			//	Create a selector from id or class.  Note that we keep the selector simple,
			//	as the engine should optimize for these (gebyId, getByClassname...), vs
			// 	something like 'div#id' which should cause the engine to do a full seek.
			//	(todo: test).
			//
			if(t.id) {
				sel		= '#' + t.id;
			} else if(t.className) {
				sel		= '.' + t.className.replace(' ','.');
			} 

			//	Must have a selector.
			//
			if(sel) {
				this.event(e, sel, f)
			}
		},
		
		//	#find
		//
		//	Find the descendants of each element in Subject which match a selector.  
		//	Remove duplicates, return.  If you would like to fetch all descendants, use
		//	the universal selector '*'.  If you would like to simply fetch the immediate 
		//	children of an element, use #children.
		//
		//	@param		{String}		s		A selector.
		//		
		find:		function(s, t) {

			t = gSub(arguments, this);

			var a = [],
				r;

			this.forEach(function(e, i) {
			
				//	Create another context for the search, as #search 
				//	alters the Subject. Add any results.
				//
				r = this.spawn(1).select(s, e).$;
				
				if(r.length) {
					a = a.concat(r);
				}
			}, t);

			this.unique(a);
		},
		
		//	#filter	hoisted below, after selector engine.
		//
		
		//	#first handled by native #uni#first method.
		//
		
		//	#hasClass
		//
		//	Whether any members of the Subject have a class.
		//
		//	@param		{String}		c		The class to look for.
		//	@param		{Object}		[t]		A Subject (Dom element)
		//	@type		{Boolean}
		//
		hasClass:		function(c, t) {
			
			t	= gSub(arguments, this);
			c 	= c + ' ';

			var cn,
				n = t.length;
			
			while(n--) {
				cn = t[n].className + ' ';
				if(cn.indexOf(c) > -1) {
					return { $void: true };
				}
			}
			
			return { $void: false };
		},
		
		height:		function(o, p) {
		
		},
		
		//	#html
		//
		//	Either set, or get, the innerHTML of an element or elements.
		//	
		//	-	If called without any arguments, will return the innerHTML of either the passed
		//		element, or the first([0]) element of Subject.
		html: 		function(h) {

			var	f	= toFunc(h);

			if(h === undefined) {
				return { $void: t.innerHTML };
			}

			this.forEach(function(s, i) {
				s.innerHTML = f.call(this, i, s.innerHTML);
			}, gSub(arguments, this))
		},
		
		innerHeight:	function(o, p) {
		
		},
		
		innerWidth:		function(o, p) {
		
		},
		
		//	#insertAfter
		//
		//	We are going to re-use the same functionality as #after.  The only difference
		//	here is that instead of argument `n` being inserted after each element
		//	in the Subject, we are now going to insert each element in Subject after
		//	`n`.  As `n` can be a selector, we need to ensure that the Subject is an array.
		//
		insertAfter: function(n) {
			this.sub(newEl(n), true);
			this.dom(this.$$, arguments, 'aft')
			this.restore();
		},
		
		//	#insertBefore
		//
		//	We are going to re-use the same functionality as #before.  The only difference
		//	here is that instead of argument `n` being inserted before each element
		//	in the Subject, we are now going to insert each element in Subject before
		//	`n`.  As `n` can be a selector, we need to ensure that the Subject is an array.
		//
		insertBefore: function(n) {
			this.sub(newEl(n), true);
			this.dom(this.$$, arguments, 'bef');
			this.restore();
		},
		
		//	#nextAll
		//
		//	Will select all the siblings of each element in Subject.
		//
		nextAll:		function(s, t) {
			this.seek(t || this.$, 'nextSibling', s);
		},
		
		nextUntil:		function(s, t) {
			this.seek(t || this.$, 'nextSibling', s, 1);
		},
		
		//	#last handled by native #uni#last method.
		//
		
		offset:			function(o, p) {
		
		},
		
		outerHeight:	function(o, p) {
		
		},
		
		outerWidth:		function(o, p) {
		
		},
		
		parents:		function() {
		
		},
		
		parent:			function() {
		
			var t = this.$.parentNode;
			if(t && t.nodeType !== 11) {
				return t;
			}
		},
		
		position:		function(o, p) {
		
		},
		
		//	#prepend
		//	
		//	Prepends element(s) to each member of Subject.
		//
		//	@param		{Mixed}			n		The value to prepend.
		//	@param		{Object}		[t]		A Subject (Dom element)
		prepend:		function(n, t) {
			this.dom(n, arguments, 'pre');
		},
		
		//	#prependTo
		//
		//	Prepends each member of Subject to element(s)
		//
		//	@param		{Mixed}			n		The element to prepend to.
		//	@param		{Object}		[s]		A Subject (Dom element)
		//
		prependTo:	function(n, s) {
			this.sub(newEl(n), true);
			this.dom(this.$$, arguments, 'pre')
			this.restore();
		},
		
		prevAll:		function(s, t) {
			this.seek(t || this.$, 'previousSibling', s);
		},
		
		prevUntil:		function(s, t) {
			this.seek(t || this.$, 'previousSibling', s, 1);
		},
		
		remove:			function(o, p) {
		
		},
		
		removeAttr:		function(o, p) {
		
		},
		
		removeClass:	function(o, p) {
		
		},
		
		removeData:		function(nm, t) {

			var	a	= arguments,
				ns	= this.ns._.datac,
				all = !a.length,
				id,
				n;

			t	=	gSub(a, this);

			//	Also deleting all if all we were sent is a single Dom element.
			//
			if(uni.is(uni.Element, nm)) {
				t = [nm];
				all = true;
			} 

			this.forEach(function(e, i) {

				id 	= this.attr('id', false, e);	

				if(all && ns[id]) {
					delete ns[id];
				} else if(ns[id] && ns[id][nm]) {
					delete ns[id][nm];
				}

			}, t);
		},
		
		replaceAll:		function(o, p) {
		
		},
		
		replaceWith:	function(o, p) {
		
		},
		
		scrollLeft:		function(o, p) {
		
		},
		
		scrollTop:		function(o, p) {
		
		},
		
		text:			function(v, t) {

			t	= gSub(arguments, this, 1)
			
			var f 	= toFunc(v),
				d	= [],
				n,
				rec;

			if(uni.is(String, v)) {
				t = gSub(arguments, this);
				uni.notify(document.createTextNode(v))
				this.forEach(function(e, i) {
					this
						.sub(e)
						.empty()
						.append(document.createTextNode(v));
				}, t);
				
				return;
			}
			
			this.forEach(function me(e) {
				var tmp,
					x	= 0;
				while(x < e.childNodes.length) {
				
					n = e.childNodes[x];

					if(n.nodeType == 3) {
					
						//	Get text content, trim, see if we have anything left after trimming, 
						// 	and keep any non-empty strings.
						//
						tmp	= this.trim(n.textContent ? n.textContent : n.data);
						!!tmp && d.push(tmp);

					//	We need to fetch from child nodes as well.
					//
					} else if(tmp = n.firstChild) {
						do {
							me.call(this, tmp);
						} while(tmp = tmp.nextSibling);
					}
					
					x++;
				}
			}, t);			
			
        	return { $void: d.join(' ') }
		},
		
		toggleClass:	function(o, p) {
		
		},
		
		//	#trim in uni#trim
		//
		
		//	#unique is a general uni function (uni#unique).
		//
			
		unwrap:			function(o, p) {
		
		},
		
		val:			function(o, p) {
		
		},
		
		width:			function(o, p) {
		
		},
		
		wrap:			function(o, p) {
		
		},
		
		wrapAll:		function(o, p) {
		
		},
		
		wrapInner:		function(o, p) {
		
		}
	},
	
	//	Used in method hoisting, below.
	//
	p;


//	Hoist all the dom methods defined above
//
for(p in dmeth) {
	uni.hoist(p, dmeth[p]);
}

//	Add helpers
//


// 
//	#element
// 
//	todo: add in event passing
//
uni.hoist('element', function(tag, p) {
	
	p	=	p || {};
	
	var el	= document.createElement(tag),
		prop,
		pa
	
	//	Note that we're setting the Subject to this element, as an array.
	//
	this.sub([el]);

    for(prop in p) {
    	//  Normalize argument length.  Always 2 + internal additions.
    	//
    	pa	= p[prop];
    	pa	= [
    		pa[0],
    		pa[1] 
    	];
    	
    	//	Because we need a preprocessor for #event calls, and to avoid collisions, and
    	//	cluttering this area, and following protocol for all other methods,
    	//	we do a redirect here, which will ultimately pass the correct values
    	//	to uni#event.
    	prop = prop == 'event' ? '_event' : prop;

        dmeth[prop] && dmeth[prop].apply(this, pa.concat([el, tag]));
    }

    document.body.appendChild(el);
});




})(this, document, Array, Function, String, Object)