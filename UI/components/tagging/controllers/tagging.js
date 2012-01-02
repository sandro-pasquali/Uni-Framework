uni.observe("component:tagging:loaded", function(comp) {

	var view		= comp.view,
		model		= comp.model,
		controller	= comp.controller,
		viewC		= comp.viewController,
		out			= [],
		tid			= uni.uuid(),
		fieldPath	= view.attr("fieldPath"),
		autocomp	= view.find(".autocomplete"),
		cForm		= view.closest(".ui.components.form"),
		formBinding = cForm ? cForm.data("model").itemBinding : false,
		tagHolder,
		sel,
		
		//	Whenever the tag group changes, we need to rebind the autocomplete.
		//
		//	@see	#controller#click
		//
		rebindAuto = function(type, source) {
			autocomp
				.attr("tagType", type)
				.attr("dataSource", source)
				.data("viewController").rebind();
		};

	//	If this tagging control is attached to a form we assume that we are operating
	// 	on that data.  If not, check if there is anything in #data#newValue.
	//
	if(!formBinding) {
		formBinding = uni.spawn().createSubjectFacade(view.data("newValue") || {});
	} 

	//	Whenever a form event bubbles to the tagging component we tell the containing
	//	form to check for model upadates.  What is happening is that the autocomplete
	//	component has been interacted with and it may have updated the #data#newValue
	//	of the autocomplete component, which will be tag information.
	//
	controller.change = function(ev, t, c) {
		view.closest(".ui.components.form").data("model").updateFieldValue(t);
		viewC.refreshTags();
	}

	controller.click = function(ev, t, c) {

		var $targ 	= $(ev.target),
			tid		= t.attr("dataType"),
			par		= $targ.parent();

		if($targ.is("a")) {
		
			//	Remove the tag from the model.
			//
			formBinding.unset(par.attr("fieldPath"));

			par.fadeOut(200, function() {
				viewC.refreshTags();
			});
		} else if(tid === "data-player") {
			rebindAuto("player_id", "playerData");
		} else if(tid === "data-team") {
			rebindAuto("team_id", "teamData");
		} else if(tid === "data-keywords") {
			rebindAuto("$", "tag:types");
		} else if(tid === "data-games") {
			rebindAuto("game_pk", "fullRegularSeasonSchedule");
		}
	};

	viewC.addTag = function(tag, path, i) {
		if(tag["@type"] && tag["@value"] && tag["@displayName"]) {
			tagHolder.append('<span id="' + tid + '-' + i + '" tagType="' + tag["@type"] + '" tagValue="' + tag["@value"] + '"><span class="pill" fieldPath="' + path + '">' + decodeURIComponent(tag["@displayName"]) + ' <a href="#">[x]</a></span></span');
		}
	};
	
	//	Note that this is a visual clearing of the tag container, not a clearing of
	//	the tag model.
	//
	viewC.clearTags = function() {
		tagHolder.empty();
	};
	
	viewC.refreshTags = function() {
	
		var curTags = 	formBinding.get(fieldPath);
  
		this.clearTags();

		if(curTags) {
		
			//	If only one tag the value of the #itemTag node will be an object. We need
			//	an array. Do any necessary conversion.
			//
			if(uni.is(Object, curTags)) {
				curTags = [curTags];
			}

			//	Run through tags and draw them.
			//
			uni.forEach(function(e, i) {	

				//	Each tag also gets its fieldPath set.  If this is an array of tags
				//  (tags.length > 1), then we add the subindex accessor to the path.
				//
				viewC.addTag(e, curTags.length > 1 ? fieldPath + "." + i : fieldPath, i);
		
			},	curTags);
		}
	};

	//	Create the tag holder.
	//
	out.push('<div id="tagholder-' + tid + '" class="row" fieldPath="' + fieldPath + '"></div>');
	view.append(out.join(""));

	tagHolder = view.find("#tagholder-" + tid);
	
	//	And add any existing tags.
	//
	viewC.refreshTags();
	
	//	Add unique ids, etc, to the autocomplete widget.  Note that when the autocomplete is
	//	rebound (when changing data source) this remains the same.
	//
	view
		.find(".autocomplete")
		.attr("fieldPath", fieldPath);	
	
});