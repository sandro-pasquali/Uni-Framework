uni.observe("component:tabs:loaded", function(comp) {		

	var view	= comp.view,
		model	= comp.model,
		isVert	= !!view.attr("vertical") === true;
		
	model.instance = view.tabs();

	if(isVert) {
		model.instance.addClass('ui-tabs-vertical ui-helper-clearfix');
		model.instance.removeClass('ui-corner-top').addClass('ui-corner-left');
	}

});