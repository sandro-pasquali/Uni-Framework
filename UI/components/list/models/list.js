//	Sets up a List component, mainly by setting the viewController methods which can be
//	used to manipulate list items (add, delete, etc).
//
uni.observe("component:list:loaded", function(comp) {

	var viewC		= comp.viewController,
		view		= comp.view,
		controller	= comp.controller,
		formBind	= view.closest(".ui.components.form"),
		fieldPath	= view.attr("fieldPath"),
		arr			= view.attr("arrows"),
		srt			= view.attr("sortable"),
		pnt			= view.attr("pointer"),
		fxd			= view.attr("fixed"),
		dup	 		= view.attr("duplicates"),
		useArr		= arr === "true" ? true : arr === "false" ? false : false, 
		isSortable	= srt === "true" ? true : srt === "false" ? false : false, 
		usePoint	= pnt === "true" ? true : pnt === "false" ? false : false, 
		isFixed		= fxd === "true" ? true : fxd === "false" ? false : false,
		duplicates	= dup === "true" ? true : dup === "false" ? false : false,
		list		= view.find("ul").eq(0),
		
		//	This will set the #newValue attribute of the %list#data, then calling
		//	the #updateFieldValue method of any containing %form.  Note that it is
		//	perfectly legal not to have a containing form, where the method will simply
		//	fall through with no effects.
		//
		setFormValue	= function(dat) {
			var res = false;
			
			if(uni.is(Object, dat) && uni.is(String, dat.name) && dat.value) {
			
				view.data("newValue", dat);
				
				//	If there is a form, return the result of an attempt to update the
				//	current #listValue.
				//
				if(formBind.length) {
					res = formBind.data("model").updateFieldValue(view);
				} else {
					//	It is perfectly legal for an attempt to be made to write to a form and
					//	there being no actual form to write to. If we get here then we 
					//	affirm that the attempt to set a returned *no* value.
					//
					res = null;
				}
				
				//	Clean up, as we don't want a possible re-add by leaving latent data around.
				//
				view.removeData("newValue");
			}

			return res;
		};
		
	viewC.create = function() {
	
		var idList 	= [],
			tid		= uni.uuid(),
			curItems;
			
		if(list.length === 0) {
			list = view.append("<ul></ul>").find("ul");
		}
		
		if(isFixed) {
			list.addClass("isFixed");
		}

		list
			.sortable({
				axis:		"y",
				disabled: 	!isSortable // note !
			})
			//.disableSelection();
			
		//	Now check if there are any item "candidates" in the list <ul> which need to be
		//	properly inserted.  This allows the insertion of any list of siblings, whose html 
		//	will be properly transformed into a valid list item.
		//
		list.children().each(function(i, e) {
			idList.push($(this).attr("itemId"));
		});
			
		if(idList.length > 0) {
			$.getJSON(uni.data.serviceUrl("item.getIdList") + "&query=" + idList.join(","), function(d) {

				var its	= d.list.item;

				uni.forEach(function(e, i) {
					viewC.add("list-original-" + i + "-" + tid, uni.fire("item:makeTile", {
						item		: e,
						draggable	: false
					}).$, {
						data	: {
							name	: "listItem",
							value	: e
						}
					});
				}, uni.forceArray(its));
			});
		}
		
		//	Now check if there is a model value for this field, and reflect those list
		//	items in the list.
		//
		if(formBind.length) {
			curItems 	= formBind.data("model").itemBinding.get(fieldPath);
			if(curItems) {
				uni.forEach(function(e, i) {
					viewC.add("list-original-" + i + "-" + tid, uni.fire("item:makeTile", {
						item		: e,
						draggable	: false
					}).$);
				}, uni.forceArray(curItems.item));
			}
		}
				
		return list;
	};
	
	viewC.add		= function(id, content, ob) {

		var tid	= uni.uuid();

		ob	= ob || {};
		
		if(ob.data) {
			//	May receive `true`, `false`, or `null`.  `null` means there is no form
			//	to write to.  This is not an error -- a list may not have a model.  If there
			//	is a model, and the model write fails (for whatever reason), we get `false`,
			//	and exit.
			//
			if(setFormValue(ob.data) === false) {
				return;
			}
		}
		
		var arrows  	= useArr ? '<span class="ui-icon ui-icon-arrowthick-2-n-s"></span>' : '',
			out			= $('<li id="list-item-' + tid + '" class="ui-state-default' + (usePoint ? ' pointer' : '') + (arrows ? ' with-arrows' : '') + '">' + arrows + '</li>').append(content),
			insertPoint	= ob.insertPoint || "append";
			
		//	If passed an event object as the insertPoint will find the list item closest
		//	to the insertPoint (the x,y of the drop) and insert after that item. Otherwise,
		//	one of "append" or "prepend", default being "append".
		//
		if(uni.is(Object, insertPoint)) {
		
			var dropY	= insertPoint.pageY,
				lowest;
				
			list.find("li").each(function() {
				var $t = $(this);

				//	Looking for the last list item in the list which is above the drop
				//	point.  We insert after that item.
				//
				if($t.offset().top < dropY) {
					lowest = $t;
				}
			});
			
			//	It is possible that we don't find an item, as the drop may have been on 
			//	a margin which while within the list container is not below any particular item.
			//	In that case, we prepend.
			//
			if(lowest) {
				lowest.after(out);
			} else {
				list.prepend(out);
			}

		} else if(insertPoint == "prepend") {
			list.prepend(out);
		} else {
			list.append(out);
		}
	
		viewC.refresh();
	};
	
	//	Removes an element from the list.  Note that we also try to update any #itemBinding.
	//
	//	@param		{String}		sel		A selector, which is used to find the item to remove,
	//										or a list index.  There is no check of whether a 
	//										non-string argument is a number, or if its index 
	//										even exists.
	//
	viewC.remove	= function(sel) {

		var r 	= uni.is(String, sel) ? list.find(sel).closest("li") : list.children().eq(sel),
			i	= r.find("div").eq(0),
			id	= i.attr("itemId");

		//	If this is an item tile find it in the itemBinding and remove the reference.
		//
		if(i.hasClass("item-tile") && formBind.length && id) {
			formBind.data("model").updateFieldValue(view, function(ib) {
				ib.item = uni.filter(function(e, i) {
					if(e["@id"] !== id) {
						return true;
					}
				}, uni.forceArray(ib.item)).$;
				
				return ib;
			});
		}
	
		//	This destroys the DOM element representing the list item.
		//
		r.remove();
		
		viewC.refresh();
	};
	
	//	Simply a proxy for updating the jqueryUI sortable model.
	//
	viewC.refresh   = function() {
		list.sortable("refresh");
	};
	
	//	Clears all members of the list.
	//
	viewC.clear		= function() {
		list.find("li").each(function() {
			$(this).remove();
		});
		viewC.refresh();
	};
	
	//	If there is a containing form whose binding is to be updated depending on list actions,
	//	this is the method which will do that processing.  We are expecting it to be sent an
	//	element which has a #fieldPath attribute.  We get that node's value, and check if
	//	the candidate value is already present.  If not, we update the value.
	//
	if(formBind.length) {
		formBind.data("model").addCustomValueProcessor("listItem", function(candidate, formModel, field) {

			var curVal	= formModel.itemBinding.get(field.attr("fieldPath")),
				candVal	= candidate.value,
				newVal;
							
			//	If passed value is a function set 
			//
			if(uni.is(Function, candVal)) {
			
				return candVal(curVal);
			}
			
			//	If there is no current #listValue, it will be set to the item object assigned
			//	to candidate.value, and returned.
			//
			if(curVal === void 0) {
				return {
					item: candVal
				};
			} 

			//	We want to check for duplicats and give the controller a chance to accept or
			//	reject duplicates.  Whether or not duplicate checking is done is flagged via
			//	the #duplicates attribute of the component. If we do flag duplicates, we do
			//	so by firing any #onDuplicate handler provided by the controller, if any, which
			//	should do the work of notifying of the duplicate, etc, in the UI. 
			//
			if(uni.reduce(function(a, e, i) { 			
				if(e["@id"] === candVal["@id"]) {
                	a.push(e["@id"]);
                } 
                return a;
			}, [], uni.is(Object, curVal.item) ? [curVal.item] : curVal.item).$.length > 0 && (duplicates === false)) {
				controller.onDuplicate && controller.onDuplicate(candVal, uni.$);
				return;
			} 


			if(uni.is(Object, curVal.item)) {
				newVal = {
					item: [curVal.item, candVal]	
				};
			} else {
				curVal.item.push(candVal);
				newVal = {
					item: curVal.item
				};
			}
			
			return newVal;
			
		});
	}
});