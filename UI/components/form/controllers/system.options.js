//	Here we are creating a controller for system options. Mainly this involves tracking change
//	events for the form and updating the system:options data.  Additionally, we may make
//	immediate interface/data changes depending.
//
uni.observe("component:form:loaded", function(comp) {
	
	var controller			= comp.controller,
		model				= comp.model,
		view				= comp.view,
		$info				= view.find(".sys-opt-help"),
		sop					= uni.data.get("system:options").$,
		loutF				= function() {
			window.location = "/actions/logout.do";
		};
	
	controller.click = function(ev, t, c) {
		var id = t.attr("id");
		if(t.hasClass("help-but")) {
			
			$info.each(function() {
				$(this).css("display", "none");
			});
			
			$("." + t.attr("id")).css("display", "block");
			
			ev.preventDefault();
			ev.stopPropagation();
			
		} else if(id == "sys-opt-test-notify-delay") {
			uni.notify("The earliest known reference to baseball is in a 1744 British publication, A Little Pretty Pocket-Book, by John Newbery. It contains a rhymed description of 'base-ball' and a woodcut that shows a field set-up somewhat similar to the modern game—though in a triangular rather than diamond configuration, and with posts instead of ground-level bases.", "note", "", parseInt($("#opt-ui-2").val()) * 1000);
		} else if(id == "logout-partial") {
			loutF();
		} else if(id == "logout-full") {
			//	TODO: something smarter here, where only sensitive info is destroyed. Need
			//	to integrate this with the smarter versioning refresh of localstore data.
			//
			uni.store.clear();
			loutF();
		}
	};
	
	controller.change = function(ev, t, c) {
	
		if(model.updateFieldValue(t)) {
			
			//	If the model has updated the field value in #itemBinding, update system:options.
			//
			uni.data.set("system:options", model.itemBinding.get());
			
			//	Notify that system:options have changed.
			//
			uni.fire("system:options:changed", uni.data.get("system:options").$);
			
		} else {
			uni.notify("Please contact administrator with message > system options interface malformed", "error");
		}
	};

	
	//	Now we have to properly initialize the controls.
	//	TODO: Finish templating, where these are directives.
	//
	
	
	
	//	Set the SubitemUIType select control.
	//
	$("#opt-ui-1")
		.removeAttr("selected")
		.find("option")
		.each(function(e, i) {
			if($(this).val() == model.itemBinding.$.subItemControlType) {
				$(this).attr("selected", "selected");
			}
		});
		
	//	Set the cacheComponentFiles checkbox.
	//
	$("#opt-sys-1")
		.attr("checked", model.itemBinding.$.cacheComponentFiles);
	
	//	Set the defaults for buttonsets by triggering a click on the relevant radiobutton.
	//
	$("#n-del-" + sop.notificationDelay)
		.trigger("click");
	$("#srpp-" + sop.searchMaxResults)
		.trigger("click");

});