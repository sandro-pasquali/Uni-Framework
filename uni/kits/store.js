//	%store
//
//	A cross-browser persistent store.
//
//	Local storage functionality based on the work of Marcus Westin.
//	@href 		http://github.com/marcuswestin/store.js
//

(function(window, document, undefined){
	var localStorageName 	= 'localStorage',
		globalStorageName 	= 'globalStorage',
		storage,
		api					= {
			set:		uni.noop,
			get:		uni.noop,
			remove:		uni.noop,
			clear:		uni.noop,
			transact:	function(key, transactionFn) {
				var val = api.get(key)
				if (typeof val == 'undefined') { val = {} }
				transactionFn(val)
				this.store.set(key, val)
			}
		};

	function serialize(value) {
		return uni.json.stringify(value).$;
	}
	function deserialize(value) { 
		if(!uni.is(String, value)) { 
			return undefined; 
		}
		return uni.json.parse(value).$;
	}

	if (localStorageName in window && window[localStorageName]) {
		storage = window[localStorageName];
		api.set = function(key, val) { 
			storage.setItem(key, serialize(val)) 
		};
		api.get = function(key) { 
			return deserialize(storage.getItem(key)) 
		};
		api.remove = function(key) { 
			storage.removeItem(key) 
		};
		api.clear = function() { 
			storage.clear() 
		};

	} else if (globalStorageName in window && window[globalStorageName]) {
		storage = window[globalStorageName][window.location.hostname];
		api.set = function(key, val) { 
			storage[key] = serialize(val) 
		};
		api.get = function(key) { 
			return deserialize(storage[key] && storage[key].value) 
		};
		api.remove = function(key) { 
			delete storage[key] 
		};
		api.clear = function() { 
			for (var key in storage ) { 
				delete storage[key] 
			} 
		};

	} else if (document.documentElement.addBehavior) {
		var storage = document.createElement('div');
		function withIEStorage(storeFunction) {
			return function() {
				var args = Array.prototype.slice.call(arguments, 0),
					result;
				args.unshift(storage);
				// See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
				// and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
				document.body.appendChild(storage);
				storage.addBehavior('#default#userData');
				storage.load(localStorageName);
				result = storeFunction.apply(api, args);
				document.body.removeChild(storage);
				return result;
			}
		}
		api.set = withIEStorage(function(storage, key, val) {
			storage.setAttribute(key, api.serialize(val));
			storage.save(localStorageName);
		})
		api.get = withIEStorage(function(storage, key) {
			return deserialize(storage.getAttribute(key));
		})
		api.remove = withIEStorage(function(storage, key) {
			storage.removeAttribute(key);
			storage.save(localStorageName);
		})
		api.clear = withIEStorage(function(storage) {
			var attributes = storage.XMLDocument.documentElement.attributes,
				i;
			storage.load(localStorageName);
			for(i=0, attr; attr = attributes[i]; i++) {
				storage.removeAttribute(attr.name);
			}
			storage.save(localStorageName);
		})
	}
	
	// 	Now create the kit.
	//
	uni.addKit('store', {

		set:		api.set,
		get: 		function(key) {
			return { $void: api.get(key) }
		},
		remove: 	api.remove,
		clear: 		api.clear,
		transact:	api.transact
	});
	
})(this, document)
