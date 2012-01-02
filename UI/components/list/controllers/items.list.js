//	Controller for the list of items in the "ITEM HISTORY" view of the UI.
//
uni.observe("component:list:loaded", function(comp) {

	var view		= comp.view,
		controller	= comp.controller,
		viewC		= comp.viewController,
		model		= comp.model,
		panel		= comp.panel,
		
		//	Creates the list container, which means items can now be added.
		//
		list 		= viewC.create(),

		//	Set up data for the list representing the current selection information,
		//	such as the #select <LI> element and the current item #id.
		//
		current		= view.data("current", {
			id		: null,
			select	: null
		}).data("current"),

		mastEditTog	= "master";
		
		updateList	= function() {
			//	The item history.
			//
			var hItems 		= uni.data.get("history:items").$,
				idList		= [],
				tid			= uni.uuid();

			//	Create a comma-separated list of item ids which can be used to do a search.
			//
			uni.forEach(function(e, i) {
				idList.push(e.id);
			}, hItems);

			//	Clear the existing list.
			//
			viewC.clear();
		
			//	Using the comma-separated string of ids generated above, query for a list
			//	of type=ids item objects, and turn those into list items.
			//
			$.getJSON(uni.data.serviceUrl("item.getIdList") + "&query=" + idList.join(","), function(d) {
				var items		= {};
				
				//	We now have an array items. Their order is uncertain. We need to order their
				//	insertion indexed by #hItems. So store the references in #items, then cycle
				//	through #hItems, appending.
				//
				uni.forEach(function(e) {
					items[e["@id"]] = e;
				}, d.list.item);

				uni.forEach(function(e) {
					viewC.add('item-' + tid + '-' + e.id, uni.fire("item:makeTile", {
						item		: items[e.id],
						draggable	: true
					}).$);
				}, hItems);

				//	Creates a view for the first item in this new list (firing a click event
				//	on the first item, and going into the view  mode as contained in the
				//	#itemView attribute of #main-layout.
				//
				uni.fire("itemList:createDataView", {
					itemId		: list.find("li:first div[itemId]").attr("itemId"),
					itemView	: $("#main-layout").attr("itemView") || "edit"
				});
			});
		};

	//	Listen for item addition. Refresh if called.
	//
	uni.observe("data:set:history:items", function(a) {
		updateList(function() {
			uni.components.renderControls();
		});
	});

	//	Listen for an item deletion.  If the current form is showing that item, remove 
	//	the current form. 
	//
	uni.observe("item:deleted", function(id) {		
		if(current.id === id) {
			$("#items-current")
				.data("viewController")
				.empty();
		}
	});
		
	//	This is a request to show an item editor form. It will likely come from a 
	//	create masters interface, which is another view on an item, requesting the 
	//	edit interface to be changed.  
	//
	uni.observe("itemList:createDataView", function(atts) {
		if(atts.itemId) {
			//	Clear current #id, as it is likely this item will already be selected.
			//
			current.id = null;
			
			//	Update the main layout info, which is checked by #click.
			//
			$("#main-layout").attr("itemView", atts.itemView);
			
			//	And now click the right item id, if available.
			//
			list.find('div[itemId="' + atts.itemId + '"]').click();
		}
	});
	
	controller.click = function(ev, t, c) {

		var id 			= t.attr("itemId"), 
			data		= t.data("itemData"),
			type		= data.get("itemType.@key");
			
		if(id === current.id || !type) {
			return;
		}			

		//	Update the selection. Because the click delegate responds to clicks on 
		//	<div>s with an #itemId, we need to actually highlight the containing <li>.
		//
		current.select && current.select.removeClass("ui-state-highlight");
		current.select = t.closest("li");
		current.select.addClass("ui-state-highlight");
		
		var	date	= uni.date.parse(data.get("@userDate").split("T")[0]).$.toString("yyyy-MM-dd"),
			attrIv	= $("#main-layout").attr("itemView");

		current.id 	= id;
		
		switch(attrIv) {
			case "edit":
				$("#items-current")
					.data("viewController")
					.rebind({
						"controller"	: "UI/components/form/controllers/item.form.js",
						"panel"			: "UI/panels/item.browser.controls.html",
						"itemBinding"	: current.id,
						"listensFor"	: "change click"
					});
				
				uni.observe("component:form:loaded", function(comp) {

					var fController = comp.controller,
						fV	= $("#items-current");
					
					//	Insert the header/title information for this form.
					//
					fV.prepend('<div class="ui-titlebar"><span>' + type + ' &#183; ' + current.id + ' &#183; ' + date + '</span></div>');
					
					comp.panel.controller.click = function(ev, t, c) {		
					
						switch(t.attr("id").split("-").pop()) {
							case "save":
								fController.save();
							break;
							
							case "clone":
							break;
							
							case "publish":
								uni.fire("item:publish", {
									id: current.id
								});
							break;
							
							case "delete":
								uni.fire("item:delete", {
									id: current.id
								});
							break;
							
							case "masters":
								uni.fire("itemList:createDataView", {
									itemId		: current.id,
									itemView	: "masters"
								});
							break;
							
							default:
							break;
						}
					};
				});
			break;
			
			case "masters":
				//	Can only create masters on photo-asset types.
				//
				if(type !== "photo-asset" && attrIv === "masters") {
					
					//	Return to edit mode.
					//
					$("#main-layout").attr("itemView", "edit");
					
					//	Going to re-fire the same element; need to clear current.id, as
					//	it will be identical to #id, which will kill execution.
					//
					current.id = null;
					
					//	And re-fire the click.
					//
					list.find('div[itemId="' + id + '"]').click();
				} else {
			
					$("#items-current")
						.data("viewController")
						.empty()
						.html('\
							<div	id			= "item-list-create-masters" \
									itemBinding	= "' + current.id + '" \
									class		= "ui components imgAreaSelect" \
									controller	= "UI/components/imgAreaSelect/controllers/create.masters.js" \
									view		= "UI/components/imgAreaSelect/views/create.masters.html" \
									panel 	 	= "UI/panels/create.masters.html" \
							>');
							
					uni.components.bind();
				}
			break;
		
			default:
			break;
		}
	};
	
	//	Initialize.
	//
	updateList();
});
