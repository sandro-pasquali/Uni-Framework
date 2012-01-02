uni.observe("component:list:loaded", function(comp) {
	var controller 	= comp.controller,
		model		= comp.model,
		viewC		= comp.viewController,
		view		= comp.view,
		cF			= view.closest(".ui.components.form"),
		list 		= viewC.create();
	
	//	Called in the context of the event.
	//
	controller.onDrop = function(dropper) {
		var ev = this;
		$.getJSON(uni.data.serviceUrl("item.read") + "/" + dropper.attr("itemId") + "?format=ids&output=json", function(it) {
			viewC.add("dropped-item-" + dropper.attr("id"), uni.fire("item:makeTile", {
				item		: it.item,
				draggable	: false
			}).$, {
				insertPoint	: ev,
				data	: {
					name	: "listItem",
					value	: it.item
				}
			});
		});
	};
	
	//	Called on a drop of a duplicate.
	//
	controller.onDuplicate = function(dup) { 
		var its = $(".item-tile-" + dup["@id"]);
		its
      		.animate({ backgroundColor: '#E0D2FF'}, 500)
      		.animate({ backgroundColor: '#f6f6f6'}, 500, function() {
      			$(this).css("background", its.eq(0).css("background"));
            });
	}
});
