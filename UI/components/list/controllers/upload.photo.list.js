uni.observe("component:list:loaded", function(comp) {

	var view		= comp.view,
		controller	= comp.controller,
		model		= comp.model,
		viewC		= comp.viewController,
		globalD		= null,
		uploaded	= [],
		list		= viewC.create(),

		//	Called every time an image upload is completed.  Will add to the Global Tagging list.
		//
		updateGlobalDialog = function(itemOb) {
			
			var tid 		= uni.uuid(),
			
				//	Will convert #itemOb into an item tile and append to the list.
				//
				addItem		= function() {
					var it = itemOb.get("item");
					globalD.find(".ui.components.list")
						.data("viewController")
						.add("list-original-" + tid, uni.fire("item:makeTile", {
							item		: it,
							draggable	: false
						}).$, {
							data	: {
								name	: "listItem",
								value	: it
							}
						});
				}

			if(!globalD) {

				uni.fire("dialog:open", {
					title	:	"Grouping",
					content	:	'\
						<div 	id 			= "gen-tagging-form-' + tid + '" \
								class		= "ui components form" \
								view		= "UI/components/tagging/views/group.tagging.html" \
						></div>',
					width		: 760,
					close		: function() {
						globalD = false;
					},
					buttons		: {
						"Apply Tags"	: function() {
							applyTags();
						}
					},
					onRender	: function(dia) {
						globalD = dia;
						addItem();
					}
				});
				
			} else {
				addItem();
			}
		},
		
		doSave	= function(d) {

			var itemOb = d.itemOb;

			//	This updates the changes, saving the modified image object.
			//
			$.ajax({
				url			: uni.data.serviceUrl("item.save"),
				dataType	: "json",
				type		: "POST",
				cache		: false,
				data		: uni.json.stringify({ item: itemOb.get("item") }).$,
				error		: function(xhr, stat) {
					if(xhr.status != 200) {
						uni.notify("Received a status code of " + xhr.status + ".", "alert", "Save has failed (" + stat + ")");
					}
				}
			});
		},
		
		applyTags	= function(dia) {

			var data 	= globalD.find(".ui.components.form").data("model").itemBinding.get(),
				items 	= data.items,
				tags	= data.tags,
				upItems	= [],
				itemList;

			//	No tags, nothing to do.
			//
			if(tags === undefined) {
				uni.notify("Go ahead and create some tags to apply.", "info", "No Tags Selected");
				return;
			}
			
			//	Have tags, but if no items in list, nothing to do.
			//
			if(!items || !items.item || items.item.length === 0) {
				uni.notify("Go ahead and add some items to the list.", "info", "No Items in Group");
				return;
			}

			itemList = uni.is(Object, items.item) ? [items.item] : items.item;

			//	Determine which of the list items we need to fetch full item objects for.
			//	Note that we understand "full item" as "having #field set".
			//
			uni.forEach(function(e) {
				if(!e.field) {
					upItems.push($.getJSON(uni.data.serviceUrl("item.read") + "/" + e["@id"] + "?format=item&output=json"));
				}
			}, itemList);

			//	When the full item json is available for all partials, run through the item
			//	list, check where the full @id matches the partial @id, and replace the partial
			//	json with full.  Then add the tagging info to each of the items, and save them.
			//
			$.when.apply($, upItems).then(function() {
				uni.forEach(function(a, i) {
				
					//	Single argument will be an object, multiples array. Check.
					//
					var it = uni.is(Array, a) ? a[0].item : a.item;
					
					itemList = uni.map(function(b) {
						return b["@id"] === it["@id"] ? it : b;
					}, itemList).$;
				}, arguments);
				
				//	Now we have all the item data.  Run through, add tag data, and save.
				//
				uni.forEach(function(e, i) {
					e	= uni.copy(e);
					var curTag = e.itemTag;
					if(curTag === void 0) {
						e.itemTag = tags;
					} else if(uni.is(Object, curTag)) {
						e.itemTag = [curTag, tags];
					} else {
						e.itemTag.push(tags);
					}

					//	And update the item.
					//	
					doSave({ itemOb: uni.spawn().createSubjectFacade({ item: e }) });
				}, itemList);
				
				uni.notify("Your changes are being applied to " + itemList.length + " items", "saving", "Default Data Saved");
			});
		};

	//	Listen for events from upload component.
	//
	uni.observe("file:uploaded", function(item) {

		//	Add to item history.
		//
		uni.fire("item:opened", item.itemId);

		//	Fetch the exif data from the image
		//
		uni.exif.getData({
			src: item.imOb.path
		}, function(exif) {
			var xf 	= {
					description:	exif.ImageDescription,
					time:			exif.DateTimeOriginal,
					credit:			exif.Artist,
					copyright:		exif.Copyright
				};

			//	Update the current item with this new exif data.
			//
			item.itemOb.set(item.itemOb.findPath("@key", "caption", "item.field") + ".$", xf.description);

			// 	Now save the changed item.
			//
			doSave(item, xf);
			
			//	Open a dialog for this group if there isn't one.
			//
			updateGlobalDialog(item.itemOb);
		});

	});
});

