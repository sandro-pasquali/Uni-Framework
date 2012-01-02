uni.observe('component:autocomplete:loaded', function(comp) {

	var view 		= comp.view,
		controller	= comp.controller,
		fieldPath	= view.attr("fieldPath") || "",
		vs			= view.find("select"),
		tid			= uni.uuid();
		
	if(vs.length === 0) {
		vs = view
				.append('<select id="tagauto' + tid + '" id="tagauto-' + tid + '" class="form-tagging-autocomplete"></select>')
				.find("select");
	}

	//	Check if this has a fieldPath, and if so, we need to add that to the
	//	input as well.
	//
	if(!!fieldPath) {
		vs.attr("fieldPath", fieldPath);
	}

	vs.eq(0).fcbkcomplete({
		json_url: 			view.attr('jsonUrl'),
		dataSource:			view.attr('dataSource'),
		cache: 				view.attr('cache') || true,
		filter_case: 		view.attr('filter_case'),
		filter_hide: 		view.attr('filter_hide'),
		firstselected: 		view.attr('firstselected') || true,
		filter_selected: 	view.attr('filter_selected'),
		maxitems: 			view.attr('maxitems') || 8,
		newel: 				view.attr('newel'),
		inputWidth:         view.attr("inputWidth")
	});
});
