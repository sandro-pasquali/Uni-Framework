uni.observe("component:rolodex:loaded", function(comp) {

	var controller	= comp.controller,
		model		= comp.model,
		view		= comp.view,
		itemBinding	= model.itemBinding,
		tid			= uni.uuid();
		
	view.append('<ul id="rolodex-list-' + tid + '"></ul>');
	var container = view.find("ul");

	view.find("ul").append(uni.reduce(function(a, e, i) {
		a.push('<li><a href="#">' + e["@displayName"] + '</a></li>');
		return a;
	}, [], itemBinding.get("keywords.keyword")).$.join(""));

	comp.view.listmenu();
	
	console.log('rolodex');
	console.log(itemBinding.get());
	
	var addValue = function(valOb) {
	/*
	{
                	text	: title,
                	value	: value,
                	type	: tagId
                }
                */
                
        //	Update the data on the component, which will be checked by the Form
        //	#change handler (in component#form model).
        //
        var dataContainer = view.closest(".ui.components");
                
        if(dataContainer.data("newValue") === undefined) {
            dataContainer.data("newValue", {
                name	: "autocomplete",
                value	: []
            });
        }

        dataContainer.data("newValue").value.push(valOb);
    }
});