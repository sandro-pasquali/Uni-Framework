uni.observe("component:accordion:loaded", function(comp) {		

	var view	= comp.view;

	//	When the accordion is made sortable a side effect is that on a sort drop the accordion
	//	click event will fire, resulting in accordion contents opening. We check for this
	//	and stop that effect using a toggle managed by the accordion click event and the
	//	sortable stop event.
	//
	var stop = false,
		stopF =  function() {
			stop = true;
		};
		
	view.find("h3").click(function(event) {
		if(stop) {
			event.stopImmediatePropagation();
			event.preventDefault();
			stop = false;
		}
	});


	comp.model.instance = comp.view.accordion({ 
		header: "h3",
		clearStyle: true,
		collapsible: true,
		active:	false,
		autoHeight: false,
		fillSpace: !!view.attr("fillSpace")
	})
	.sortable({
		axis: "y",
		handle: "h3",
		stop: stopF

	});
	
	uni.notify(comp.model)

});