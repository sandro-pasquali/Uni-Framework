uni.observe("component:layout:loaded", function(comp) {

	var view				= comp.view,
		model				= comp.model,
		
		changeDomainText	= function(ops) {	
			uni.forEach(function(e, i) {
				if(ops.appId === e.id) {
					view.text(e.name);
				}
			}, model.itemBinding.get("domains"));
		}

	uni.observe("system:options:changed", changeDomainText);
	
	//	Init
	//
	changeDomainText(uni.data.get("system:options").$);
	
});