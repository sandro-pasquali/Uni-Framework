uni.observe("component:template:loaded", function(comp) {

	var model 		= comp.model,
		template	= comp.view.children(":first"),
		cTemplate	= template.compile(model.templateDirective);

	uni.notify("set get");
	uni.notify(model.itemBinding.set("item.itemType.fieldType.0.@name", "foobar"));
	uni.notify(model.itemBinding.get("item.itemType.fieldType.0.@name"));
	
	uni.notify("findPath");
	var fp = model.itemBinding.find("@key", "caption", "item.field").first().$;
	uni.notify(fp);

	uni.notify("set on path");
	var aa = model.itemBinding.set(fp + ".$", "No thunder tddsdfsdfssdd he sun.");
	uni.notify(model.itemBinding.get(fp + ".$"));
	
	uni.notify("find");
	aa = model.itemBinding.find("appId", 14, "item");
	uni.notify(aa.$);
	uni.notify(aa.last().$.appId)
	
	uni.notify("findPaths w/ attribute");
	aa = model.itemBinding.findPaths("appId", 14, "item", true);
	uni.notify(uni.copy(aa.$));
	
	uni.notify("findPaths w/ func");
	aa = model.itemBinding.findPaths("appId", function(val, ob, attr, path) {
		return "item" in ob;
	}, "item");
	uni.notify(aa.$);
	uni.notify(aa.get(aa.last().$));
	

	
    $.ajax({
    	url: uni.data.serviceUrl("item.save"),
    	dataType: "json",
    	type: "POST",
    	cache: false,
    	data: uni.json.stringify({ item: model.itemBinding.get("item") }).$,
    	success: function(data) {
    		uni.notify('ok');
    		uni.notify(data)
    	}
    });

	template.render(model.templateData, cTemplate);

});