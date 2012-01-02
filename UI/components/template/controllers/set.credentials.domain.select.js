uni.observe("component:template:loaded", function(comp) {

	var model 		= comp.model,
		template	= comp.view.children(":first"),
		cTemplate	= template.compile(model.templateDirective);
		
	template.render(model.itemBinding.get(), cTemplate);
});