uni.observe("component:slidePanel:loaded", function(comp) {
	var view		= comp.view,
		model		= comp.model,
		controller	= comp.controller,
		container 	= view.find(".container"),
		content 	= view.find(".content"),
		
		open		= function() {
			container.slideDown(300, function() {
				uni.fire("slidePanel:opened", view);
			});
		},
		
		close		= function() {
			container.slideUp(300, function() {
				uni.fire("slidePanel:closed", view);
			});
		},
		
		toggle		= function() {
		
			resize();
		
			//	Toggle based on visibility.
			//
			if(container.is(":visible")) {
				close();
			} else {
				open();
			}
		},
		
		resize		= function() {
			var offset      = view.attr("offset")       || 0,
				orientation	= view.attr("orientation") 	|| "top",
				width       = view.attr("panelWidth")   || view.width(),
				height      = view.attr("panelHeight")  || content.height();
	
	
			orientation == "bottom" ? container.css({"bottom": offset + "px"}) 
									: container.css({"top": offset + "px"});
									
			//	TODO: other coordinates. Probably need to abstract this out into a 
			//	something like a mixin, for other components which can react to layouts.
			//
			switch(width) {        
				case "right":
					width   = $(document).width() - view.offset().left;
				break;
					
				default:
				break;
			}
				
			switch(height) {
				case "bottom":
					height  = $(document).height() - offset;
				break;
					
				default:
					//  Assume that if the sent value is not numeric (in which case the height value
					//  will be set to that number) it is a selector, and the desire is to have the
					//  bottom edge of this panel reach the top edge of the matched element.
					//
					if(!uni.is(uni.Numeric, height)) {
						height = orientation == "top"   ? $(height).offset().top - offset
														: $(document).height() - $(height).height() - offset;
					}
				break;
			}
				
			container.css({
				left        : view.attr("panelLeft")  || view.offset().left,
				width       : width,
				"z-index"   : view.attr("zIndex") || 0
			});
		
			content.css({
				height      : height
			});
		};
	
	
	//	Set up handlers for internal controls.
	//
	
	comp.controller.click = function(ev, t, c) {
		if(t.hasClass("panel-close") || t.hasClass("panel-open")) {
			toggle();
		} else if(t.attr("id") === "search-results-panel-icon-windows") {
			alert('window');
		}
	};
	
	comp.controller.mouseover = function(ev, t, c) {
		if(t.hasClass("panel-open")) {
			open();
		}
	};
	
	comp.controller.mouseout = function(ev, t, c) {
		if(t.hasClass("panel-close")) {
			close();
		}
	};
	
	
	
	//	Set up listeners for activation instructions from global sources.
	// 	All expect selectors, and will check if (this) is targeted.
	//
	uni.observe("slidePanel:open", function(s) {
		if(view.is(s)) {
			open();
		}
	});

	uni.observe("slidePanel:close", function(s) {
		if(view.is(s)) {
			close();
		}
	});
	
	uni.observe("slidePanel:toggle", function(s) {
		if(view.is(s)) {
			toggle();
		}
	});
	
	//	Listen for resize events, and resize to respond.
	//
	uni.observe("ui:resize", resize);
	
});