uni.observe("component:controlGroup:loaded", function(comp) {

	//	Tracking what we last clicked, avoiding duplicate clicks. This var
	//	is closed in the #click scope below.
	//
	var lastClicked	= false,
		itemAtts	= {};
	
	//	Watches for requests to visit a specific section.
	//
	uni.observe("toolbar:select", function(sel) {
		var s = $(sel);
		if(s.length && s[0].is('input[name="toolbar-options"]')) {
			s.trigger("click");
		}
	});

	//	Use this to select a toolbar option programatically.  Allows the passing of
	//	an attribute object, allowing the construction of special views dynamically.
	//
	comp.controller.select = function(option, atts) {
	
		//	Note the closure around this attribute object reference, which will be used
		//	in #comp#comtroller#click below.
		//
		itemAtts = atts || {};
		
		//	Clear last selected, as a manual override will want to reload.
		//
		lastClicked = false;

		//	If we have been sent an itemBinding, update the history list.
		//
		if(uni.is(uni.Numeric, atts.itemBinding)) {
			uni.data.set("history:items", atts.itemBinding);
		}
		
		//	Fire the button. TODO: why isn't it being highlighted? which even does jqui wait for?
		//
		$("#toolbar-options-" + option).click();
	},
	
	//	Handler for clicking on the menu.
	//
	comp.controller.click = function(ev, targ, comp) {
		var tid = targ.attr("id");

		//	Limit to only input clicks, and ignore redundant clicks.
		//
		if(targ.get(0).nodeName.toLowerCase() !== "input" || lastClicked === tid) {
			return;
		}
		
		lastClicked = tid;

		switch(tid) {
		
			case "toolbar-options-photos":
                uni.fire("rebind:main", {
                    "view"			: "UI/components/layout/views/photos.upload.html",
					"panel" 		: "UI/panels/photos.upload.html",
                    "controller"	: "UI/components/layout/controllers/photos.upload.js"
                });
			break;
		
			case "toolbar-options-items":
				itemAtts.view = "UI/components/layout/views/items.html";
                uni.fire("rebind:main", itemAtts)                	
			break;

			case "toolbar-options-galleries":
			break;
			
			case "toolbar-options-games":
                uni.fire("rebind:main", {
                    "view"	: "UI/components/calendar/views/games.calendar.html"
                });
			break;
			
			case "toolbar-options-5":
			break;
			
			case "toolbar-options-options":
                uni.fire("rebind:main", {
                    "view"	: "UI/components/form/views/system.options.html"
                });
			break;
			
			case "toolbar-options-style":
			    uni.fire("rebind:main", {
					"view"			: "UI/components/layout/views/layout.styling.demo.html",
					"css"			: "UI/components/layout/css/layout.styling.demo.css",
					"controller" 	: "UI/components/layout/controllers/layout.styling.demo.js" 
				});
			break;
		
			default:
			break;
		}
	}
});