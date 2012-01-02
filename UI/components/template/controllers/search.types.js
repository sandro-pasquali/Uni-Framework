uni.observe("component:template:loaded", function(comp) {

	var model 		= comp.model,
		controller	= comp.controller,
		template	= comp.view.children(":first"),
		cTemplate	= template.compile(model.templateDirective);

	//uni.notify(model.itemBinding.get());

	template.render(model.itemBinding.get(), cTemplate);
	
	controller.change = function(ev, t, c) {
		uni.fire("slidePanel:close", "#search-options");
	}
});