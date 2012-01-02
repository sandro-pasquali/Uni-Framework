uni.observe("component:thumbnail:loaded", function(comp) {
	var view 		= comp.view,
		img			= view.find("img"),
		uuid		= uni.uuid(),
		src			= view.attr("src"),
		height		= view.attr("height"),
		width		= view.attr("width"),
		fullView 	= view.attr("fullView"),
		viewTitle	= view.attr("viewTitle");
		
	if(img.length === 0) {
		view.append('<img id="' + uuid + '" />');
		img = view.find("#" + uuid);
	}
	
	img.attr("src", src);
	
	height 	&& img.height(height);
	width 	&& img.width(width);
	
	if(fullView !== undefined) {
		img.dblclick(function() {
			uni.fire("dialog:modal:showImage", {
				src: 	fullView,
				title:	viewTitle || "Photo"
			});
		});
	}
});