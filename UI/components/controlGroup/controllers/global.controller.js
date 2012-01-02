//	This will contain most of the important observers, essentially the custom code for this
//	implementation of the framework. Some things to note:
//
//	We are mostly manipulating item data.
//
//	"sr-item" is a naming convention used for elements which represent items.  Search results,
//	for example, are enclosed in <div>s with an id of "sr-item-2033223324"(item id), and are
//	given a class of "sr-item"
//

uni.observe("component:layout:loaded", function(comp) {

	var sysOpts = uni.data.get("system:options").$,
		controller = comp.controller;

	//	Listens for rebind requests on the main container.
	//
	uni.observe("rebind:main", function(d) {
		
		//	Request that all open *slidePanel panels be closed.
		//
		$(".ui.components.slidePanel").each(function(e) {
			uni.fire("slidePanel:close", "#" + $(this).attr("id"));
		});
		
		//	Hide the main layout, then rebind.  We fade the main back in when component
		//	binding is complete.
		//
		//	Note that this rebind automatically clears all previous attributes,
		//	via second parameter.
		//
		$("#main-layout").data("viewController").rebind(d, 1);
	});
	
	
	
	
	//	Listening for changes in connection.  This is offline mode functionality, and
	//	for now probably won't fire, or be relevant.
	//
	uni.observe("onLine", function(d) {
		uni.notify("You are now online.","announce");
	});
	uni.observe("offLine", function(d) {
		uni.notify("You have gone offline.", "alert");
	});
	
	
	
	
	//	Reporting of Ajax errors.
	//
	//	[0] => xhr object.
	//	[1] => string, error type.
	//
	uni.observe("ajax:error", function(d) {
		uni.notify(d[1] + " with status code: " + d[0].status,"error","Ajax Error");
	});
	
	//	You should fire this whenever the user opens an item. It is also a general item 
	//	promotion service, where firing this observer will cause the #id item to be
	//	promoted (boosted) to the top of the item history list.
	//
	uni.observe("item:opened", function(id) {
		if(uni.is(uni.Numeric, id)) {
			uni.data.set("history:items", id);
		}
	});
	
	//	Will open a general dialog window
	//
	uni.observe("dialog:open", function(opts) {
	
		var sys			= uni.data.get("system:options").$,
			title 		= opts.title,
			viewPath	= opts.src,
			content		= opts.content 			|| "",
			uuid		= opts.id 				|| uni.uuid(),
			closeButton	= opts.closeButton !== undefined ? !!opts.closeButton : true,
			dialog;

		dialog = $('<div title="' + title + '"><div id="' + uuid + '">' + content + '</div>').dialog({
			width		: opts.width 	|| sys.dialogDefaultWidth,
			height		: opts.height 	|| sys.dialogDefaultHeight,
			resizable	: opts.resizable !== undefined ? !!opts.resizable : true,
			modal		: !!opts.modal,
			position	: opts.position	|| [parseInt(Math.random() * 40),$("#layout-header").height() + parseInt(Math.random() * 10)],
			zIndex		: opts.zIndex	|| sys.dialogInitZIndex,
			buttons		: opts.buttons 	|| false,
			open		: function(event, ui) { 
			
				//	Fire any sent #open method first.
				//
				opts.open && opts.open(ev, ui);
			
				// 	Hides close button if requested.
				//
				if(!closeButton) {
					$(this).parent().children().children('.ui-dialog-titlebar-close').hide();
				}
			},
			close		: function(ev, ui) {
				
				//	Fire any sent #close method first.
				//
				opts.close && opts.close(ev, ui);
				
				$(this).dialog("destroy").remove();
			}
		});
		
		opts.onOpen && opts.onOpen(dialog);
				
		if(opts.onRender) {
			uni.observeOnce("components:bind:complete", function() {
				opts.onRender(dialog)
			});
		}
		
		uni.components.bind();
	});
	
	//	Will display an image in a modal dialog.
	//
	uni.observe("dialog:modal:showImage", function(opts) {
	
		var title 		= opts.title,
			viewPath	= opts.src,
			uuid		= uni.uuid()
	
		$(document.body).append('<div title="' + title + '"><img id="' + uuid + '" src="" style="display:none" /></div>');
							
		$("#" + uuid).load(function() {
			var $t 	= $(this),
				tw	= $t.width(),
				th 	= $t.height(),
				dw	= tw > sysOpts.dialogDefaultWidth ? sysOpts.dialogDefaultWidth : "auto",
				dh	= th > sysOpts.dialogDefaultHeight ? sysOpts.dialogDefaultHeight : "auto",
				//	This results in dialogs which cleanly encompass their
				//	image being centered, and those which have scrollbars
				//	being pushed to the top-left (conceding screen space
				//	for dialog expansion.
				//
				pos = [($(document).width() - tw - 10) / 2, ($(document).height() - th - 40) / 2];
									
			$t.parent().dialog({
				width		: dw,
				height		: dh,
				modal		: true,
				position	: pos,
				close		: function(ev, ui) {
					$(this).dialog("destroy").remove();
				}
			});
			
			$t.fadeIn();
			
		}).attr("src", viewPath);
	});
	
	
	//	Handles a request for the (soft) deletion of an item. Presents a confirmation dialog.
	//
	//	@param		{String}		ob			An object: {
	//														id		: the item id,
	//														[after]	: a function to be called
	//																  after the observer has fired.
	//											}
	//
	uni.observe("item:delete", function(ob) {
	
		if(ob.id === undefined) {
			return;
		}
		
		var id 	= ob.id;
		
		//	Create confirmation dialog, which if confirmed will fire the delete service.
		//
		$('<div id="dialog-confirm-delete" title="Do you want to delete this item?">\
			<p style="padding: 20px;">\
			<span class="notice-icon notice-icon-deleting" style="margin-right: 10px;"></span>\
			Item #' + id + ' will no longer appear in searches. You will be able to undelete the item.  What do you want to do?\
			</p></div>').dialog({
			
			width		: 330,
			height		: 210,
			resizable	: false,
			modal		: true,
			close		: function(ev, ui) {
				$(this).dialog("destroy").remove();
			},
			buttons			: {
				"Delete item": function() {
					$(this).dialog("destroy").remove();
					$.ajax({
						url			: uni.data.serviceUrl("item.softDelete") + "/" + id + "?format=item&output=json",
						dataType	: "json",
						type		: "POST",
						cache		: false,
						success		: function(data) {
							uni.notify("Item #" + id + " has been deleted.", "deleting");
														
							//	Delete the item should it exist in history.
							//
							uni.store.set("data:history:items", uni.filter(function(e, i) {
								if(e.id !== id) {
									return true; 
								}
							}, uni.store.get("data:history:items")).$);
							
							//	Delete any item tiles visible within the interface.  First we
							//	call the #destructor, if any.  If we get `true` from the 
							//	destructor we remove the item display in the UI. Any other return
							//	value from the destructor means that we do *not* remove the tile.
							//
							$('.item-tile-' + id).each(function() {
								var $t 	= $(this),
									cc	= $t.closest(".ui.components.list"),
									tp	= $t.parent();
								
								if($t.data("destructor").call($t) === true) {
									//	If we are in a list, we will call the native list
									//	#remove method, with the tile #id as argument.  If
									//	not in a list, we remove just the item tile.
									// 	Note that any other remove method can easily be
									//	made part of the destructor.
									//
									if(cc) {
										cc.data("viewController").remove("#" + $t.attr("id"));
									} else {
										$t.remove();
									}
								}
							});

							//	If there is an #after method, send back positive confirmation.
							//
							ob.after && ob.after(true);
							
							uni.fire("item:deleted", id);
						},
						error		: function(xhr, stat) {
							uni.notify("Received a status code of " + xhr.status + ".", "alert", "Delete has failed (" + stat + ")");
							ob.after && ob.after(false);
						}
					});
				},
				"Do not delete item": function() {
					$(this).dialog("destroy").remove();
				}
			}
		});
	});
	
	//	Handles a publishing request, confirming destination.
	//
	//	@param		{String}		ob			An object: {
	//														id		: the item id,
	//														[after]	: a function to be called
	//																  after the observer has fired.
	//											}
	//
	uni.observe("item:publish", function(ob) {
	
		if(ob.id === undefined) {
			return;
		}
		
		var id 	= ob.id,
			doPub = function(dest) {
				var disp = dest == "beta" ? "Beta" : "Production";
				$.ajax({
					url			: uni.data.serviceUrl("item.publish") + "&dest=" + dest + "&id=" + id,
					dataType	: "json",
					type		: "GET",
					cache		: false,
					success		: function(data) {
						uni.notify("Item #" + id + " has been published to " + disp + ".", "publishing");
						
						//	If there is an #after method, send back positive confirmation.
						//
						ob.after && ob.after(true);
					},
					error		: function(xhr, stat) {
						uni.notify("Received a status code of " + xhr.status + ".", "alert", "Publish has failed (" + stat + ")");
						ob.after && ob.after(false);
					}
				});
			};
		
		//	Create confirmation dialog, which if confirmed will fire the delete service.
		//
		$('<div id="dialog-confirm-publish" title="Publishing Item #' + id + '">\
			<p style="padding: 20px;">\
			<span class="notice-icon notice-icon-publishing" style="margin-right: 10px;"></span>\
			Published items are visible to the world. Where do you want to publish to?\
			</p></div>').dialog({
			
			width		: 300,
			height		: 200,
			resizable	: false,
			modal		: true,
			close		: function(ev, ui) {
				$(this).dialog("destroy").remove();
			},
			buttons			: {
				"Publish To Beta": function() {
					$(this).dialog("destroy").remove();
					doPub("beta");
				},
				"Publish to Production": function() {
					$(this).dialog("destroy").remove();
					doPub("betaprod");
				}
			}
		});
	});
	
	
	//	When you need to get a new item structure.  Note that this structure will return
	//	an item *without* an #id.  
	//
	uni.observe("item:get:new", function(ob) {
	
		var type	= ob.type,
			cb		= uni.is(Function, ob.callback) ? ob.callback : uni.noop,
			format	= ob.format || "type";
		
		$.getJSON(uni.data.serviceUrl("item.create") + "?format=" + format + "&output=json&type=" + type, cb);
	});
	
	//	Creates an item tile suitable for lists, etc.  They can also be made draggable.
	//
	uni.observe("item:makeTile", function(ob) {
	
		ob	= ob || {};
		
		var it			= ob.item;
	
		if(!uni.is(Object, it)) {
			uni.notify("You must provide an object, usually some item JSON or a facade.", "error", "Malformed item:makeTile call");
			return;
		}
	
		//	Ensure that we have a facade.  
		//
		if(!it.get) {
			it = uni.spawn().createSubjectFacade(it);
		}

		var tid			= uni.uuid(),
			id			= it.get("@id"), 
			outId		= "item-tile-" + id + "-" + tid,
			type		= it.get("itemType.@key"),
			imOb		= {},
			itemIcon	= $('<div></div>'),
			icAppend	= '<div class="item-icon item-types32 item-type32-' + type + '"></div>',
			draggable	= "",
			useHandle	= "",
			fullView	= "",
			out;

		if(!!ob.draggable) {
			draggable = " ui controls draggable";
			if(uni.is(String, ob.useHandle)) {
				useHandle = ob.useHandle;
			} else if(ob.useHandle === true) {
				useHandle = ".item-icon";
			}
		} 

		itemIcon.append(icAppend);

		out = $('<div id="' + outId + '" itemId="' + id + '" itemType="' + type + '" fullViewPath="' + fullView + '" useHandle="' + useHandle + '" class="item-tile ' + draggable + ' item-tile-' + id + '">' + itemIcon.html() + '<div>' + id + '<br />' + (it.get("@name") || "") + '</div></div>');
		
		//	Now add the destructor.  
		//
		out.data("destructor", ob.destructor || function() {
			console.log('destructing');
			console.log(this);
			return true;
		});
		
		//	And store the item data.
		//
		out.data("itemData", it);
		
		return out;
	});
	
	
	//	Listens for edit form requests
	//
	uni.observe("dialog:item:open", function(ob) {
	
		var opts,
			fExists = false,
			tid		= uni.uuid();
		
		if(uni.is(Object, ob)) {
			opts = ob;
		} else {
			opts = {
				id: ob
			}
		}
		
		var itemId 	= opts.id,
			sys		= uni.data.get("system:options").$;
		
		//	Set up the dialog defaults.
		//
		opts.width 	= opts.width 	|| sys.dialogDefaultWidth;
		opts.height = opts.height 	|| sys.dialogDefaultHeight;
		opts.zIndex	= opts.zIndex	|| sys.dialogInitZIndex;
	
		if(!uni.is(uni.Numeric, itemId)) {
			uni.notify("Unable to determine item id. Received: " + itemId + ".", "error", "Bad ContextMenu Request");
			return;
		}
		
		var dialogContainerId	= "form-dialog-container-" + tid + "-" + itemId,
			formId				= "form-for-" + tid + "-" + itemId,
			dialogContainer		= $("#" + dialogContainerId),
			fP,
			exists 	= dialogContainer.length > 0;

		//	If there is already a dialog with this form, we re-use that dialog reference, bring
		//	the dialog to the front, and exit.
		//
		if(exists) {
			dialogContainer.dialog("moveToTop");
			return;
		} 
		
		//	We need to create the dialog.  First we create a container that will be extended
		//	via jqueryui#dialog.  Within that dialog we're creating a form for items.  We will
		//	then bind that form component, and when it is bound and rendered, we show the 
		//	dialog.
		//
		$("<div></div>")
			.attr("id", dialogContainerId)
			.addClass("form-dialog-container")
			.css({
				"display": "none"
			})
			.appendTo(document.body);
			
		dialogContainer = $("#" + dialogContainerId);

		dialogContainer.html('\
		<div \
			id="' + formId + '" \
			class="ui components form" \
			controller="UI/components/form/controllers/item.form.js" \
			itemBinding="' + itemId + '" \
			listensFor="change click" \
		></div>');

		
		//	We will now bind the new form component. Create an observer that will continue
		//	the form generation process when that is complete.
		//
		uni.observeOnce("components:bind:complete", function(cs) {		
			//	Find the form that has an itemBinding with a matching id.
			//
			var $t 				= cs.filter("#" + formId),
				fModel			= $t.data("model"),
				fController 	= $t.data("controller"),
				fView			= $t.data("view"),
				ib  			= fModel.itemBinding,
				itemTitle,
				iRef,
				iType,
				pDate,
				destroy,
				diaIcon;
					
			//	Be really anal about making sure we have found the right form, which has
			//	a proper item binding, before presenting a potentially destructive UI.
			//
			if(!ib.get || ib.get("item.@id") !== itemId) {
				return;
			}
			
			//	Methods that will be called by the dialog control buttons.
			//
			destroy = function() {
				//	Destroys the form component.  Anticipate multiple forms, JIC.
				//	We don't use the normal jquery #remove, as our components
				//	have their own #destroy methods which do a proper cleanup.
				//
				dialogContainer
					.find(".ui.components.form")
					.reverse()
					.data("viewController")
					.destroy();			
						
				//	Destroys the jqueryUI component (dialog), and any remaining contents.
				//
				dialogContainer
					.dialog("destroy")
					.remove();
			};
				
			iRef 	= ib.get("item");
					
			//	Clean up the date.  Need to empower date.parse for java time...
			//
			pDate 	= uni.date.parse(iRef["@createdOn"].split("T")[0]).$.toString("yyyy-MM-dd");
			iType	= iRef.itemType["@key"];
			
			diaIcon	= '<div class="item-icon item-types16 item-type16-' + iType + '"></div>';

			itemTitle	= diaIcon + (!!iRef["@newItem"] ? "*New* " : "") + iRef.itemType["@name"] + ": " + iRef["@id"] + " &#183; Created: " + pDate;
					
			dialogContainer	
				.attr("title", itemTitle)
				.css({visibility: "visible"})
				.dialog({
					width		: opts.width,
					height		: opts.height,
					position	: opts.position	|| [parseInt(Math.random() * 40),$("#layout-header").height() + parseInt(Math.random() * 10)],
					zIndex		: opts.zIndex,
					hide		: "fadeOut",
					autoOpen	: true,
					//show		: "fadeIn",
					//modal		: true,
							
					//	After dialog is opened.
					//
					open		: function(ev, ui) {
						uni.fire("item:opened", itemId);
					},
						
					//	When dialog receives focus.
					//
					focus		: function(ev, ui) {
						uni.fire("ui:dialog:focused", $(this));
					},
							
					//	The dialog close button, top right.
					//
					close		: function(ev, ui) {
						destroy();
					},
							
					//	The dialog buttons arranged along the bottom of dialog.
					//
					buttons		: {
						"Save and Close" : function() {
							fController.save(function() {
								destroy();
							});
						},
						"Save" : function() { 
							fController.save();
						}, 
						"Publish" : function() { 
							uni.fire("item:publish", {
								id: 	ib.get("item.@id"),
								after:  function(r) {
									if(r === true) {
										destroy();
									}
								}
							});
						},
						"Clone" : function() { 
							destroy();
						}, 
						"Delete" : function() { 
							uni.fire("item:delete", {
								id: 	ib.get("item.@id"),
								after:  function(r) {
									if(r === true) {
										destroy();
									}
								}
							});
						},
						"Cancel" : function() {
							destroy();
						}
					}
				});
		});
		
		//	Now bind the new form component
		//
		uni.components.bind();
	});

});
