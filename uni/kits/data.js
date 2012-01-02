(function(window, document, undefined) {

//	All components rendered by %renderer will need to be registered here.
//
var stage 			= "",
	pub				= "",

	systemInfo		= {
		name		: "App",
		version		: "0.1.5"
	},

	//	These are default system options.  They should *not* be directly reference. This map
	//	is the initializer for the "system:options" service (see below).  If the client
	//	does not have a local store with key "data:system:options" this is what will be
	//	used to seed that value.  If you would like to access the system options, you should
	//	go through the data#get accessor, such as uni.data.get("system:options").$.
	//
	//
	systemOptions	= {
		subItemControlType		: "tabs",
		notificationDelay		: 5,
		dialogMinimizeWidth 	: 500,
		dialogDefaultWidth		: 690,
		dialogDefaultHeight 	: 460,
		dialogInitZIndex		: 10000,
		searchMaxResults		: 10,
		itemMaxHistoryEntries	: 10,

		appId				: "14", 
		
		//	Whether to cache component files, to be reused the next time.
		//	@see	components.js
		//
		cacheComponentFiles		: false,
		
		//	@see	http://code.google.com/p/datejs/wiki/FormatSpecifiers
		//	@see	http://docs.jquery.com/UI/Datepicker/formatDate
		//
		dateOptions	:	{
			dateFormat		: "D M dd yy",
			timeFormat		: "hh:mm:ss TT",
			dateTimeFormat	: "ddd MMM dd yyyy hh:mm:ss tt",
			ampm			: true,
			timeText		: '',
			showTime		: false,
			hourText		: '&nbsp;',
			minuteText		: '&nbsp;',
			hourGrid		: 12,
			minuteGrid		: 15,
			showAnim		: "fadeIn"
		},
		
		//	Options that control the drag and drop behavior of #controls#draggable.
		//	@see %components.
		//
		draggableOptions : {
			helper			: "clone",
			distance		: 4,
			revert			: true,
			revertDuration	: 100,
			scroll			: false,
			containment		: "window",
			stack			: false,
			zIndex			: 100000
		}
		
	},
		
	componentData	= 	{
		"autocomplete":		{
			"css"			: "UI/components/autocomplete/css/autocomplete.css", 
			"model"			: "UI/components/autocomplete/models/autocomplete.js",
			"controller"	: "UI/components/autocomplete/controllers/autocomplete.js"
		},
				
		"breadcrumb":		{
			"css"			: "UI/components/breadcrumb/css/breadcrumb.css",
			"model"			: "UI/components/breadcrumb/models/breadcrumb.js",
			"controller"	: "UI/components/breadcrumb/controllers/breadcrumb.js"
		},
								
		"contextmenu":		{
			"view"			: "UI/components/contextmenu/views/demo_contextmenu_raw.html", 
			"css"			: "UI/components/contextmenu/css/skins/cm_default/style.css", 
			"model"			: "UI/components/contextmenu/models/contextmenu.js"
		},
		
		"calendar":			{
			"css"			: "UI/components/calendar/css/fullcalendar.css",
			"model"			: "UI/components/calendar/models/fullcalendar.js"
		},
				
		"window":			{
			"controller"	: "UI/components/window/controllers/window.js"
		},
						
		"footerBar":		{
			"css"			: "UI/components/footerBar/css/footerBar.default.css"
		},
	
		"accordion":		{
			"model"			: "UI/components/accordion/models/accordion.js"
		},
						
		"tabs":		{
			"model"			: "UI/components/tabs/models/tabs.js"
		},
						
		"slidePanel":		{
			"controller"	: "UI/components/slidePanel/controllers/slidePanel.js",
			"css"			: "UI/components/slidePanel/css/slidePanel.css"
		},
				
		"upload":           {
			"model"         : "UI/components/upload/models/plupload.js"
		},
				
		"list":				{
			"css"			: "UI/components/list/css/default.css", 
			"model"			: "UI/components/list/models/list.js"
		},
				
		"form":				{
			"model"			: "UI/components/form/models/form.js",
			"css"			: "UI/components/form/css/form.css"
		},
		
		"thumbnail":		{
			"controller"	: "UI/components/thumbnail/controllers/thumbnail.js",
			"css"			: "UI/components/thumbnail/css/thumbnail.css"
		},
				
		"imgAreaSelect":	{
			"model"			: "UI/components/imgAreaSelect/models/imgAreaSelect.dev.js",
			"css"			: "UI/components/imgAreaSelect/css/imgAreaSelect.default.css"
		},
				
		"tree":				{
			"model"			: "UI/components/tree/models/tree.js",
			"css"			: "UI/components/tree/css/tree.css"
		},
		
		"rolodex":			{
			"model"			: "UI/components/rolodex/models/rolodex.js",
			"controller"	: "UI/components/rolodex/controllers/rolodex.js",
			"css"			: "UI/components/rolodex/css/rolodex.css"
		},
		
		"tagging":			{
			"model"			: "UI/components/tagging/models/tagging.js",
			"controller"	: "UI/components/tagging/controllers/tagging.js"
		},
			
		"tooltip":			{
			"model"			: "UI/components/tooltip/models/tooltip.js",
			"css"			: "UI/components/tooltip/css/tooltip.css"
		},
				
		"vgrid":			{
			"model"			: "UI/components/vgrid/models/vgrid.js",
			"controller"	: "UI/components/vgrid/controllers/vgrid.js"
		},
				
		"template":			{},
				
		"layout":			{},
				
		"controlGroup":		{},
				
		"controlPanel":		{}
	},

	//	@see #uni#data#getProperty
	//
	props			= {
		stage 				: stage,
		pub					: pub,
		fingerprint			: "123",
		identityPointId		: "345",
		userId				: "678",
		validUploadTypes	: "jpg,png,gif",
		
		//	Each domain should have a default photo template.  Because we can't reference these
		//	by id, the default photo template should have this one, common, internal name.
		//	We will search for this name, and use the first record we find, as the
		//	default template information.
		//
		defaultPhotoTemplate	: "Default Photo Template",
		
		jobStates			: {},
		searchTypes			: {},

		componentData		: componentData
	},
	
	
//  url = "/actions/crossDomainAccess?serviceType=keywordService&output=json",	
	

	Ajax		= {

		item: {
			search      : "*/content/item/search",
			save		: "*/content/item/save?format=type&output=json",
			getIdList   : "*/content/item/search?format=ids&output=json",
			create      : "*/content/item/new",
			read        : "*/content/item/read",
			edit        : "*/content/item/edit",
			lock        : "*/content/item/lock",
			unlock      : "*/content/item/unlock",
			softDelete  : "*/content/item/delete",
			publish     : "*/content/item/publish?format=item&output=json",
			uploadImage : "*/content/item/uploadImage",
			viewImage   : "*/content/item/viewImage",
			getNewItemId: "*/content/item/getNewItemId",
			undelete    : "*/content/item/undelete?format=item&output=json"
		},

		readParams   : "?format=type&output=json",
 		searchParams : "?format=ids&trimFields=true&output=json"
	};

	uni.namespace("datapoints", {});

	uni.addKit("data", {
	
		//	Accessor for the internal properties we'd like to expose.
		//
		getProperty : function(prop) {
			return {
				$void : props[prop]
			};
		},
		
		//	Expects a service key, in form "category.service", which is fetched, and whose
		//	appId is switched.
		//
		serviceUrl : function(s) {
		
			s 	= s.split(".");
			s 	= Ajax[s[0]][s[1]];
			
			var aid = uni.data.get("system:options").$.appId;
			var stg = uni.data.getProperty("stage");
			
			//	If using stage (string starts with "*") we will need to get and insert the
			//	value for stage.  We also need to replace the appId in stage with whatever
			//	is the current appId.
			//
			if(s.charAt(0) == "*") {

				stg = stg.replace(/^(.*)(\/\d{2})$/, "$1/" + aid);
				s 	= s.replace("*", stg);
			}
			
			return {
				$void : s
			};
		},

		get	: function(key, ops) {
		
			ops				= ops || {};
		
			var	dp			= uni.ns.datapoints,
				pnt			= dp[key],
				opt			= ops.optimistic !== undefined ? !!ops.optimistic : true,
				addQuery	= ops.addQuery || "",
				dat			= uni.store.get("data:" + key),
				
				notifyReady	= function(key, data) {
					uni.fire("data:ready:" + key, data);
				},
				
				//	Modifies and returns any #processor registered for this service, closing
				//	that #processor method around the call context.  Note that it also
				//	returns the resulting #processor method.
				//
				proxyProcessor = function() {
					var p = pnt.processor;
					pnt.processor = function(data) {
						var pproc	= p(data);
						uni.store.set("data:" + key, pproc);
						notifyReady(key, pproc);
						return pproc;
					};
					
					return pnt.processor;
				};
			
			//	Notify if there is no registered service for this key (no #pnt).
			//
			if(pnt === undefined) {
				uni.notify("No service was found with key > " + key, "error", "Bad uni.data.get call");
				return;
			}

			//	If this is an optimistic get, we will *not* question the data service
			//	again if there is data already bound to this key, simply returning the
			//	currently stored value.
			//
			if(dat && opt === true) {
				notifyReady(key, dat);
				return dat;
	
			//	Json lookups (local).  This is not an Ajax call, but a local data service which
			//	immediately returns whatever #pnt#processor for this service returns.
			//
			} else if(pnt.type == "json") {
			
				var proc = pnt.processor();
				uni.store.set("data:" + key, proc);
				notifyReady(key, proc);
				return proc;
				
			//	"lookup" types are understood as being JSONP calls.
			//	Services to fetch Json via Ajax should be registered as "Ajax" types.
			//
			} else if(pnt.type == "lookup") {

				//	Create a proxy for the #processor, which will do things like
				//	store results, and notify of processing.  
				//
				//	@see	#proxyProcessor.
				//
				proxyProcessor();
				
				//	Note that we are assuming this is a JSONP call.
				//
				uni.insertScriptNode(	
					"/lookup/json/" 
					+ "uni.ns.datapoints." + key + ".processor/" 
					+ pnt.get + addQuery);
			
			//	Ajax.  
			//
			} else if(pnt.type == "ajax") {
				$.getJSON(pnt.get + addQuery, proxyProcessor());
			} 
		},
		
		//	Will write to a datapoint. What happens varies on the service type.  
		//
		//	ajax:	Is a post.  Will assume that the value of 'set' is a REST endpoint, to
		//			which is being sent `params`.
		//	lookup:	Ignored.  Lookups are one way.
		//	json:	Assumes #set is a method, and passes that method `params`.
		//	
		set : function(key, val) {
			var	dp			= uni.ns.datapoints,
				pnt			= dp[key],
				curD		= uni.data.get(key).$,
				sVal,
				
				//	Want to fire this whenever a value is set. See below.
				//
				onSet		= function(d) {
					uni.fire("data:set:" + key, d)
				};

			if(pnt === undefined) {
				uni.notify("No service was found with key > " + key, "error", "Bad uni.data.set call");
				return;
			}
			
			if(val === undefined) {
				uni.notify("No value to set, using key > " + key, "error", "Bad uni.data.set call");
				return;
			}

			//	A weak check attempting to block mistaken data type being set.  Note that this
			//	is not ideal, will return some false positives, and can be improved. We also don't
			//	check when there is a #set method being used, as in that case the #val may have
			//	a different type than the data set itself.
			//
			if(curD && pnt.set === undefined && (typeof val !== typeof curD)) {
				uni.notify("Wrong value type. Expected: " + (typeof curD) + ". Received: " + (typeof val) + ". Operating on service with key > " + key, "error", "Bad uni.data.set call");
				return;
			}

			switch(pnt.type) {
				case "ajax":
				
					//	Augment the functionality of the #success method such there there 
					//	is an observable event when a #set is successful.  Note that we
					//	pass back the arguments object.
					//
					dp.success = onSet;
				
					$.ajax({
						url			: pnt.set || pnt.get,
						type		: "POST",
						complete	: pnt.complete,
						success		: pnt.success,
						error		: pnt.error
					});
				break;
				
				case "json":

					//	If there is a #set method available we pass the current data to the #set
					//	method, and either re-store what is returned, or the current state of
					//	the current data -- which the #set method might have altered, if it 
					//	is an object type.  If no set method, we just set the data point to
					//	the sent value.
					//
					sVal = pnt.set ? pnt.set(curD, val) || curD : val;
					uni.store.set("data:" + key, sVal);
					onSet(sVal);
				break;
				
				default:
				break;
			}
		},
		
		addService	: function(ob, override) {
			if(uni.ns.datapoints[ob.key] && !!override) {
				return;
			}
			
			uni.ns.datapoints[ob.key] = {
				key			: ob.key,
				processor	: ob.processor 	|| function(data) { return data },
				get			: !!ob.get 	? ob.get	: false,
				set			: !!ob.set 	? ob.set	: false,
				type		: ob.type 		|| "ajax",
				success		: ob.success 	|| undefined,
				error		: ob.error		|| undefined,
				complete	: ob.complete	|| undefined
			};
		},
		
		//	We are storing data in local storage.  This data must automatically expire when a 
		//	new release (version) is made.  #validateServices 
		//
		validateServices : function() {
			var cur = uni.store.get("__S__"),
				systemOptions,
				itemHistory;
				
			if(cur) {
				//	If the version has changed, we need to refresh our stored data.  As much as
				//	possible we want to preserve the users system settings, and their item
				//	history. So we store those, clear, then rebuild, including adding the
				//	new system info.
				//
				if(cur.version !== systemInfo.version) {
					uni.store.clear();
				}
			}
			uni.store.set("__S__", systemInfo);
		}
	});

	//	Fetching all active players and their data.
	//
	
	uni
		.data
			
			//	This should be executed on every load.
			//
			.validateServices()
			
			//////////////////////////////////////////////////////////////////////////////////
			//																				//
			//									LOOKUPS										//
			//																				//
			//////////////////////////////////////////////////////////////////////////////////
			.addService({
				key			: "playerData", 
				type		: "lookup",
				get			: "serviceName?key=val&key2=val2",
				processor	: function(d) {
					var n = []
					
					return n;
				}
			})

			
			//////////////////////////////////////////////////////////////////////////////////
			//																				//
			//									JSON										//
			//																				//
			//////////////////////////////////////////////////////////////////////////////////
			.addService({
				key			: "search:types",
				type		: "json",
				processor	: function() {
					return uni.data.getProperty("searchTypes")
				}
			})
			
			.addService({
				key			: "system:options",
				type		: "json",
				processor	: function() {
					return systemOptions;
				}
			})
			
			.addService({
				key			: "history:items",
				type		: "json",
				set			: function(dataOb, v) {	

					//	Remove any instances of #v in the current history.
					//
					dataOb = uni.filter(function(e,i) {
						return e.id !== v;
					}, dataOb).$

					//	And add #v to the front of the current history stack.
					//
					dataOb.unshift({
						id		: v,
						time	: new Date().getTime()
					});
					
					dataOb.length = Math.min(dataOb.length, systemOptions.itemMaxHistoryEntries);

					return dataOb;
				},
				processor	: function() {
					return uni.store.get("data:history:items") || [];
				}
			})
		
			//////////////////////////////////////////////////////////////////////////////////
			//																				//
			//									AJAX										//
			//																				//
			//////////////////////////////////////////////////////////////////////////////////

			//	This fetches keyword groups for keyword tagging. 
			//
			.addService({
				key			: "tag:types",
				get			: "a_url",
				processor	: function(d) {
					var out = [];
					return out;
				}
			})
			


}(this, document))