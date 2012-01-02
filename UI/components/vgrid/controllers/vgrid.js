uni.observe("component:vgrid:loaded", function(comp) {
	
	var hsort_flg 	= false,
		view 		= comp.view,
		cont		= comp.controller,
		vg 			= view.vgrid({
			easeing: "easeOutQuint",
			time: 400,
			delay: 20,
			fadeIn: {
				time: 500,
				delay: 50
			},
			onStart: function() {
				//uni.notify("vgrid started");
			},
			onFinish: function() {
				//uni.notify("vgrid finished");
			}
		});
	
	cont.add = function(item) {
		var it = $(item);
		
		it
			.hide()
			.addClass(Math.random() > 0.3 ? 'wn' : 'wl')
			.addClass(Math.random() > 0.3 ? 'hn' : 'hl');
				
		vg.prepend(it);
			
		vg.vgrefresh(null, null, null, function(){
			it.fadeIn(300);
		});
			
		hsort_flg = true;
		
		        //	Now update any ui elements that may have been added.
        //
        uni.components.bind()
	};

	cont.remove = function(e) {
		$(this).parent().parent().fadeOut(200, function(){
			$(this).remove();
			vg.vgrefresh();
		});
		return false;
	};

	cont.sort = function(e) {
		hsort_flg = !hsort_flg;
		view.vgsort(function(a, b){
			var _a = $(a).find('.sr-image').attr("id");
			var _b = $(b).find('.sr-image').attr("id");
			var _c = hsort_flg ? 1 : -1 ;
			return (_a > _b) ? _c * -1 : _c ;
		}, "easeInOutExpo", 300, 0);
		return false;
	};
	
	cont.sortRandom = function(e) {
		view.vgsort(function(a, b){
			return Math.random() > 0.5 ? 1 : -1 ;
		}, "easeInOutExpo", 300, 20);
		hsort_flg = true;
		return false;
	};
	
	cont.refresh = function(e) {
		view.vgrefresh();
	};
});