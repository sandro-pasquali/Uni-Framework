//	General contextmenu controller which is mainly going to operate on search results, which 
//	results should have an #itemId attribute set.
//
uni.observe('component:contextmenu:loaded', function(comp) {
	var view	= comp.view,
		bt		= view.attr('boundTo'),
		$bt		= $(bt),
		menuEl	= view.find('ul'),
		ctxtOn,
		closeC,
		itemId,
		itemType,
		viewPath;

	// 	Context menus must indicate what they are bound to.  Fail if not.
	//
	if(!!bt === false) {
		uni.notify("You must set the #boundTo attribute to a selector for the element which will receive the activation event (right-click). Check your component declaration.", "error", "Bad contextmenu definition");
		return;
	}

	//	Find the context menu. Note that we are going to create a random id for this context
	//	menu view.  This will overwrite any existing id!
	//
	menuEl.attr("id", uni.uuid());
	$bt.contextmenu(menuEl.attr('id'), {
		'fadeIn': 100,
		'operaEvent': 'dblclick',
		
		//	When a click anywhere within the context the menu is #boundTo is fired check if
		//	the click was on a <DIV> element with an #itemId attribute, and return false
		//	if it is not (which means the menu does not open).
		//
		'onShow': function(ev, el) {		

			var eT 	= $(ev.target);
			
			ctxtOn = eT.closest('div[itemId]', $bt.get(0));

			if(ctxtOn.length === 0) {
				return false;
			}
			
			closeC	= ctxtOn.closest(".ui.components");
			
			itemId		= ctxtOn.attr("itemId");
			itemType	= ctxtOn.attr("itemType");
			viewPath	= ctxtOn.attr("fullViewPath");

			//	Go through each menu option and turn on/off options based on #exclude
			//	parameter and #within parameter.
			//
			menuEl.find("li").each(function(e, i) {
				var $t	= $(this);

				//	For items which have an #exclusive attribute, and its value is a 
				//	space separated list which does *not* contain the current item type,
				//	#hide. All others, #show (as may have been hidden on a previous display).
				//
				if($t.is('li[exclusive]') && !$t.is('li[exclusive~="' + itemType + '"]')) {
					$t.hide();
				} else {
					$t.show();
				}
				
				//	For items which have an #within attribute, and its value is a 
				//	space separated list which does *not* contain the closest component type,
				//	#hide. All others, #show (as may have been hidden on a previous display).
				//
				if($t.is('li[within]') && !$t.is('li[within~="' + closeC.data("model").componentName + '"]')) {
					$t.hide();
				} else {
					$t.show();
				}
			});
		},
		
		//	When a context menu item is clicked.
		//
		'onSelect': function(ev) {
			var menuSelItem 	= $(ev.currentTarget),
				uuid			= uni.uuid(),
				sop				= uni.data.get("system:options").$;

			if(itemId && itemType) {
				switch(menuSelItem.attr("name")) {
				
					//	Menu on search result has selected "create masters". Need to fetch the 
					//	item id (note split), and create an item binding on the #main-layout, 
					//	which can be used by the interface we will load (in this case,
					//	the masters/imgAreaSelect interface).
					//
					case "ctxt-create-masters":
						$("#layout-section-toolbar")
							.data("controller")
							.select("items", {
								itemBinding	: itemId,
								itemView	: "masters"
							});
					break;
					
					//	Refire (#select) the "Items" tab of the main toolbar.  This will
					//	reload the item list.
					//
					case "ctxt-edit":
						$("#layout-section-toolbar")
							.data("controller")
							.select("items", {
								itemBinding	: itemId,
								itemView	: "edit"
							});
					break;
					
					case "ctxt-editwindow":
						uni.fire("dialog:item:open", {
							id: itemId
					});
					break;
					
					case "ctxt-boost":
						uni.fire("item:opened", itemId);
					break;
					
					case "ctxt-view":
						if(!!viewPath) {
							uni.fire("dialog:modal:showImage", {
								src: 	viewPath,
								title:	itemId
							});
						}
					break;
					
					case "ctxt-delete":
						uni.fire("item:delete", {
							id		: itemId
						});
					break;
					
					case "ctxt-list-remove":
						closeC.data("viewController").remove("#" + ctxtOn.attr("id"));
					break;
					
					case "ctxt-gallery-from-item":

						uni.notify("Creating new gallery. A dialog will appear shortly.", "loading");
					
						//	Get a new photo gallery item. Get the photo asset item we're working
						//	with. Add photo asset to gallery list. Save. Then show newly created item.
						//
						uni.fire("item:get:new", {
							type		: "photo-gallery",
							callback 	: function(d) {
								
								var itemBinding		= uni.spawn().createSubjectFacade(d);
									
								//	Now get the photo asset.
								//
								$.getJSON(uni.data.serviceUrl("item.read") + "/" + itemId + "?format=item&output=json", function(ass) {
									var listPath = itemBinding.findPath("@key", "photos", "item.field");
											
									itemBinding.set(listPath + ".listValue", ass);
											
									$.ajax({
										url: uni.data.serviceUrl("item.save"),
										dataType	: "json",
										type		: "POST",
										cache		: false,
										data		: uni.json.stringify({ item: itemBinding.get("item") }).$,
										success		: function(data) {
											uni.fire("dialog:item:open", data.item["@id"]);
										},
										error		: function(xhr, stat) {
											if(xhr.status != 200) {
												uni.notify("Received a status code of " + xhr.status + "/" + stat + ".", "alert", "Unable to Create Gallery");
											}
										}
									});
								});
							}
						});
											
					break;

					default:
						uni.notify("ctxt: " + menuSelItem.attr("name"));
					break;
				}
			}
		}
	});
});
