// 	Part of the LINQ to JavaScript (JSLINQ) v2.1? Project - http://jslinq.codeplex.com
// 	Copyright (C) 2009 Chris Pietschmann (http://pietschsoft.com). All rights reserved.
// 	This project is licensed under the Microsoft Reciprocal License (Ms-RL)
// 	This license can be found here: http://jslinq.codeplex.com/license
//
(function() {



var utils = {
	processLambda: function(clause) {
		// 	This piece of "handling" C#-style Lambda expression was borrowed from:
		// 	linq.js - LINQ for JavaScript Library - http://lingjs.codeplex.com
		// 	THANK!!
		//
		if (utils.isLambda(clause)) {
			var expr = clause.match(/^[(\s]*([^()]*?)[)\s]*=>(.*)/);
			return new Function(expr[1], "return (" + expr[2] + ")");
		}
		return clause;
	},
	isLambda: function(clause) {
		return (clause.indexOf("=>") != -1);
	}
},
    	
funcs	= {

	ToArray: function() { 
		return this.$; 
	},
        
	Where: function(clause) {
		var sub			= this.$,
			newArray 	= [],
			i;
	
		// The clause was passed in as a Method that return a Boolean
		for(i=0; i < sub.length; i++) {
			if(clause.apply(this, [sub[i], i])) {
				newArray[newArray.length] = sub[i];
			}
		}
		return newArray;
	},
        
	Select: function(clause) {
		var sub			= this.$,
			newArray 	= [],
			field 		= clause,
			i,
			item;
					
		if((typeof clause) !== "function") {
			clause = function() { 
				return this[field]; 
			};
		}
	
		// The clause was passed in as a Method that returns a Value
		for(i=0; i < sub.length; i++) {
			item = clause.call(this, sub[i]);
			if(item) {
				newArray[newArray.length] = item;
			}
		}
		return newArray;
	},
        
	OrderBy: function(clause) {
		var sub			= this.$,
			tempArray 	= [],
			i,
			field;
					
		for(i = 0; i < sub.length; i++) {
			tempArray[tempArray.length] = sub[i];
		}
	
		if((typeof clause) != "function") {
			field = clause;
			if(utils.isLambda(field)) {
				clause = utils.processLambda(field);
			} else {
				clause = function() { 
					return this[field]; 
				};
			}
		}
	
		return tempArray.sort(function(a, b) {
		
			var x = clause.apply(a, [a]),
				y = clause.apply(b, [b]);
				
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		});
	},
        
	OrderByDescending: function(clause) {
		var sub			= this.$,
			tempArray 	= [],
			field,
			i;
					
		for(i = 0; i < sub.length; i++) {
			tempArray[tempArray.length] = sub[i];
		}
	
		if ((typeof clause) !== "function") {
			field = clause;
			if(utils.isLambda(field)) {
				clause = utils.processLambda(field);
			} else {
				clause = function() { 
					return this[field]; 
				};
			}
		}

		return tempArray.sort(function(a, b) {
			var x = clause.call(b, b);
			var y = clause.call(a, a);
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		});
	},
        
	SelectMany: function(clause) {
		var	sub		= this.$,
			r 		= [],
			i;
				
		for(i = 0; i < sub.length; i++) {
			r = r.concat(clause.apply(sub[i], [sub[i]]));
		}
		return r;
	},
        
	Count: function(clause) {
		var sub	= this.$;
			
		if(clause == null) {
			return sub.length;
		} else {
			return this.Where(clause).$.length;
		}
	},
        
	Distinct: function(clause) {
		var sub		= this.$,
			item,
			dict 	= {},
			retVal 	= [],
			i,
			c = sub.length;
		for(i = 0; i < c; i++) {
			item = clause.call(sub[i], sub[i]);
			if(item.indexOf('Jeter') !== -1) {
			}
			// TODO - This doesn't correctly compare Objects. Need to fix this
			if(dict[item] !== true) {
				dict[item] = true;
			} else {
				sub.splice(i,1);
			}
		}
		dict = null;
	},
			
	Any: function(clause) {
		var sub		= this.$,
			i;
					
		for(i = 0; i < sub.length; i++) {
			if(clause.apply(sub[i], [sub[i], i])) { 
				return {
					$void: true
				};
			}
		}
		return {
			$void:	false
		};
	},
			
	All: function(clause) {
		var sub		= this.$,
		i;
				
		for(i = 0; i < sub.length; i++) {
			if (!clause(sub[i], i)) { 
				return {
					$void: false
				}
			}
		}
		return {
			$void:	true
		}
	},
			
	Reverse: function() {
		var sub		= this.$,
			retVal 	= [],
			i;
					
		for (i = sub.length - 1; i > -1; i--) {
			retVal[retVal.length] = sub[i];
		}
		return retVal;
	},
			
	First: function(clause) {
		var sub		= this.$;
				
		if(clause != null) {
			return this.Where(clause).First();
		} else {
			// If no clause was specified, then return the First element in the Array
			return {
				$void: sub.length > 0 ? sub[0] : null
			}
		}
	},
			
	Last: function(clause) {
		var sub		= this.$;
		if(clause != null) {
			return this.Where(clause).Last();
		} else {
			// If no clause was specified, then return the First element in the Array
			return {
				$void: sub.length > 0 ? sub[sub.length -1] : null
			}
		}
	},
			
	ElementAt: function(i) {
		return {
			$void: this.$[i]
		}
	},
			
	Concat: function(array) {
		var arr = array.items || array;
		return this.$.concat(arr);
	},
			
	Intersect: function(secondArray, clause) {
		var clauseMethod,
			a,
			b,
			sub		= this.$,
			result	= [],
			sa 		= secondArray.items || secondArray;
					
		if(clause != undefined) {
			clauseMethod = clause;
		} else {
			clauseMethod = function(item, index, item2, index2) { 
				return item == item2; 
			};
		}
	
		for(a = 0; a < sub.length; a++) {
			for (b = 0; b < sa.length; b++) {
				if(clauseMethod(sub[a], a, sa[b], b)) {
					result[result.length] = sub[a];
				}
			}
		}
		return result;
	},
			
	DefaultIfEmpty: function(defaultValue) {
		if(this.$.length === 0) {
			return defaultValue;
		}
		return this;
	},
			
	ElementAtOrDefault: function(i, defaultValue) {
		var sub = this.$;
				
		if (i >= 0 && i < sub.length) {
			return sub[i];
		}
		return defaultValue;
	},
			
	FirstOrDefault: function(defaultValue) {
		return { 
			$void: this.First() || defaultValue 
		};
	},
			
	LastOrDefault: function(defaultValue) {
		return { 
			$void: this.Last() || defaultValue
		};
	}
};


//	Creates the kit
//
uni.addKit('linq', funcs)


})();