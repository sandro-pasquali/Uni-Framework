//	%styles
//
//	An interface to css stylesheet collection, allowing dynamic manipulation of css rules.
//

(function(window, document, undefined) {

//	
//		CSS sheet reader/writer
//
//	See kit definition below for documentation on the methods.
//

var styles = new function() {

	//	#sheets
	//
	//	Return all style sheets present in this document.
	//
	this.sheets = function() {
	  return document.styleSheets; 
	};
		
	this.getRule = function(r) {
		
		r   = r ? r.toLowerCase() : ''; 
			
		var ss  = this.sheets(),
			i	= ss.length,
			ii,
			cssRule,
			styleSheet;
			
		while(i--)  { 
		
			styleSheet  = ss[i];
			ii          = 0;                              
			cssRule     = false;     
			
			do {  
			
				if(styleSheet.cssRules) {          
					cssRule = styleSheet.cssRules[ii];
				} else {                             
					cssRule = styleSheet.rules[ii];    
				}  
					
				if(cssRule && (cssRule.selectorText.toLowerCase() == r)) {                      
					return({
						sheet:	styleSheet,
						rule:	cssRule,
						style:	cssRule.style,
						index:	ii
					});                                 
				}                                     
				
				ii++;   
					
			} while(cssRule)                        
		} 
		return false;
	};  
													  	
	this.removeRule = function(s) { 
	
		var rr 		= this.getRule(s),
			ss,
			rule,
			ind;
		
		if(rr) { 
		
			ss    	= rr.sheet;
			rule  	= rr.rule;
			ind   	= rr.index;
				
			if(ss.cssRules) {  
				ss.deleteRule(ind);
			} else {                     
				ss.removeRule(ind);
			}                                          
		} 
	};
	
	this.addRule = function(r) {     
	
		var ss = this.sheets();

		if(!this.getRule(r))  {   
			if(ss[0].addRule) {       
				ss[0].addRule(r, null,0);
			} else {                   
				ss[0].insertRule(r+' { }', 0);
			}        
		}                        
		
		return this.getRule(r);   
	}; 
};












//	Add kit to uni implementing CSS controls.
//
uni.addKit('styles', {

	//	#getRule
	//
	//	Retrieves css rule object matching a selector.
	//
	//	@param		{String}		s		A valid selector.
	//	@type		{Object}
	//
	//
	getRule		: function(s) {
		return styles.getRule(s);
	},
	
	//	#addRule
	//
	//	Creates a css rule object on a selector.  Note that if the rule already
	//	exists, no changes are made.
	//
	//	@param		{String}		s		A valid selector.
	//	@type		{Object}
	//	@return								An object with the new rule -- the same object you
	//										would receive after #findRule.
	//
	addRule		: function(s) {
		return styles.addRule(s);
	},
	
	//	#removeRule
	//	
	//	Remove a css rule matching a selector.  This destroys the rule; if you want to
	//	restore the rule you will have to recreate it with #addRule.
	//
	//	@param		{String}		s		A valid CSS selector.
	//
	removeRule		: function(s) {
		styles.removeRule(s);
	},
	
	//	#getProperty
	//
	//	Gets a given property on a css rule object.
	//
	//	@param		{Mixed}			p		The property, such as "border" or "font-size".  Can
	//										be either a single string, or an array of such 
	//										strings.  
	//	@param		{Object}		[r]		Normally this would be used in an Object chain
	//										on a css rule Subject.  If you pass a css rule 
	//										object here, that will be operated on instead.
	//	@type		{Mixed}
	//	@return								If a string as passed, the property.  If an array 
	//										was passed, the original array hashed with 
	//										property/value pairs.
	//
	//	@example	.getProperty('border')				// 	'1px solid red'
	//				.getProperty([						// 	Array [
	//					'border',						//	0: 			'border'
	//					'color'							//	1: 			'color'
	//				])									//	border:		'1px red solid'
	//													//	color:		'rgb(255,255,255)' ]
	//
	getProperty		: function(p, r) {
		r	=	r || this.$;
		var i;

		//	We are operating on objects returned by #getRule.  A successful rule request to 
		//	that method will return an object with the .rule attribute.  
		//
		if(r.rule) {
			
			if(uni.is(Array, p)) {
				i = p.length;
				while(i--) {
					p[p[i]] = r.style[p[i]]
				}
				
				return p;
			} 
			
			return r.style[p];
		}
	},
	
	//	#setProperty
	//
	//	Sets a given property on a css rule object.
	//
	//	@param		{Mixed}			p		The property, such as "border" or "font-size".  Can
	//										be either a single string, or an array of such 
	//										strings.  Accepts camelized or dashed properties.
	//	@param		{Mixed}			v		Either a value to assign the property, such as
	//										'10 px', or a function (which is passed the
	//										css rule object).
	//	@param		{Object}		[r]		Normally this would be used in an Object chain
	//										to modify a css rule Subject.  If you pass a
	//										css rule object here, that will be operated on instead.
	//
	setProperty		: function(p, v, r) {
		
		var i;
		
		//	We can be sent an object or a p/v pair.  If a pair, then if the caller sends a
		//	non-Subject rule it would be the third argument, `r`.  If the caller sends an 
		//	object, then sending a non-Subject rule would be the second argument, `v`.  As well,
		//	we are 'normalizing' the p/v instructions by making non-objects into objects.
		//	
		if(uni.is(Object, p)) {
			r	= v || this.$
		} else {
			r 	= r || this.$;
			p 	= new function(a,b) { this[a] = b; }(p, v);
		}

		if(r.rule) {
			for(i in p) {
				i	= uni.camelize(i);
				r.style[i] = uni.is(Function, p[i]) ? p[i].call(this, r, i) : p[i];
			}
		}
	},
	
		
	createSheet 	: function(css) {

		var styleElement = document.createElement("style");
		
		styleElement.type = "text/css";
		
		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			styleElement.appendChild(document.createTextNode(css));
		}

		document.getElementsByTagName("head")[0].appendChild(styleElement);
	}

});



})(this, document)