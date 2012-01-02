uni.observe("component:layout:loaded", function(comp) {

	var view		= comp.view,
		pController	= comp.panel.controller,
		pView		= comp.panel.view;
		
	pController.click = function(ev, t, c) {
		switch(t.attr("id")) {

			case "photos-upload-save-data":
				
				uni.fire("save:default:data");
			
			break;
		
			default:
			break;
		}
	}

});