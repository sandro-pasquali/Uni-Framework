uni.observe("component:form:loaded", function(comp) {

	var model 		= comp.model,
		view		= comp.view,
		viewCon		= comp.viewController,
		specTypes	= [];
		
		//	Will be used mostly for validaton. However, you can call this whenever you need
		//	some element in a form highlighted. Note that if this is an item form, it will
		//	also find the UI control containing the form element (should it be "hidden in
		//	the stack" of a tab control set, etc) for *subItems*.
		//
		_flag = function(e, on) {
				//	Find the containing form segment.
				//
			var	sLi		= e.closest(".form-list-item"),
				//	Is this a subItem?
				//
				subId 	= sLi.attr("subItemId"),
				sic,
				ctrlRef;

			//	Flag the input.
			//
			if(on) {
				sLi.addClass("flagged");
			} else {	
				sLi.removeClass("flagged");
			}
			
			//	If this is a subItem, then we need to find the UI control for it. These sorts
			//	of subItems would only be set in item forms.
			//
			if(subId) {
				sic		= uni.data.get("system:options").$.subItemControlType;
				ctrlRef	= 	(sic == "accordion") 	
							? $('a[id^="acc-label-' + subId + '"]') 
							: $('a[href^="#tabs-' + subId + '"]');
				if(on) {
					ctrlRef.addClass("flagged");
				} else {
					ctrlRef.removeClass("flagged");
				}
			}
		};
	
	//	Public api 
	viewCon.flagInput = function(e) {
		_flag(e, true);
	};
	
	viewCon.unflagInput = function(e) {
		_flag(e, false);
	};
	
	//	If the form is an Item, this will insert the shell needed. Note that item forms
	//	must have an Item binding.
	//
	viewCon.insertItemShell = function() {
		var itemId	= model.itemBinding.get("item.@id");
		view.append('\
			<form>\
				<fieldset>\
					<legend>Tagging</legend>\
					<ol id="form-tagging-list-' + itemId + '"></ol>\
				</fieldset>\
				<fieldset>\
					<legend>Item Fields</legend>\
					<ol id="form-field-list-' + itemId + '"></ol>\
				</fieldset>\
				<fieldset>\
					<legend>Metadata</legend> \
						<ol id="form-metadata-list-' + itemId + '"></ol>\
				</fieldset>\
			</form>');
	};
	
	//	Send this method a function.
	//
	model.addCustomValueProcessor = function(valueName, func) {
		specTypes[valueName] = func;
	};

	//	Allows manipulation of data bound to itemBinding node an element (usually a form
	//	field).  The binding is determined by the #fieldPath attribute of the passed element,
	//	which must exist.  Additionally, #data("newValue") may be set on an element, to
	//	be used for controls which manipulate form data but are not form input fields.
	//
	//	@param		{DOMElement}		f		An element
	//	@param		{Function}			func	A change function. Use this to perform
	//											specialized manipulations of the form data,
	//											such as removing parts of a node's data.
	//
	model.updateFieldValue = function(f, func) {
	
	//console.log("FIELD");
	//console.log(f);
	
		var fid			= f.attr("id"),
		
			//	Path to the field in #itemBinding.
			//
			fieldPath 	= f.attr("fieldPath"),
		
			//	Optional. If a field has validation rules, this will be the path to those rules.
			//
			rules 		= f.attr("validation"),
			
			//	Only used for binary uploads
			//
			fState		= f.attr("fileState"),
			
			tagName		= f.get(0).tagName.toLowerCase(),
			
			//	Form data may be manipulated by custom controls (ie. controls that are not
			//	standard form controls like INPUT or TEXTAREA). While native controls have
			//	a #value attribute of some kind, customs do not necessarily have one. For
			//	those that do not, we allow them to expose their data via #data#newValue.  So
			//	here we find the containing component and store this value (which can
			//	safely be undefined).
			//
			closeC		= f.closest(".ui.components"),
			candidate	= f.data("newValue") || closeC.data("newValue"),
			
			//	Assume the value of the input is the value we will work with.  Special
			//	valuations made below.
			//
			newVal		= f.val(),
			taintOb,
			cur,
			candidate,
			cv,
			exists,
			obj;

		//	If we've received a function argument, our field value will be set to whatever
		//	that method returns.
		//
		if(func) {
			model.itemBinding.set(fieldPath, func(model.itemBinding.get(fieldPath)));
			return true;
		}

		//	Not all form controls/inputs will be canonical form elements (input, select, etc).
		//	In order to accomodate these we allow any element to be passed and initially
		//	check if it has a #data property of #newValue.  If so, it is a special form
		//	control, and is handled accordingly, based on the #name property of #candidate.
		//
		//	Note that this also allows you to override normal handling of form elements 
		//	(such as input, select) by setting the #newValue attribute. Elements so 
		//	defined take precedence, in other words.
		//
		if(candidate) {
			
			//	undefined values do bad things to the data model when saving. Could also be
			//	that a form event has happened on the element and it has no value set.
			//
			if(candidate.value === void 0) {
				return false;
			}
			
			//	The #fieldPath should exist as a property of the sent element or the 
			//	containing component. Not having this is a fatal error.
			//
			if(!(fieldPath = (fieldPath || closeC.attr("fieldPath")))) {
				uni.notify('The #fieldPath attribute on special component with #id: ' + closeC.attr("id") + ' is missing.  Your changes will not be saved.', "error", "Unbound Form Component");
				return false;
			}
			
			if(specTypes[candidate.name]) {
				newVal = specTypes[candidate.name](candidate, model, f); 
				
				if(newVal === void 0) {
					return false;
				}
			} else {
				newVal = candidate.value;
			}
		}

		//	If there is no fieldPath attribute for this form element we need to check if this
		//	is a special component.  If none of that is kosher, we warn, as no form control 
		//	which is not in our special control list should exist without a field path.
		//
		else if(!!fieldPath === false) {
			uni.notify('The field path attribute on input with #id: ' + fid + ' is missing.  Your changes will not be saved.', "error", "Orphaned form element");
		} else {

			//	Validate the new input. Do not change if the value is incorrect.
			//
			switch(tagName) {
			
				case "select":
					newVal = f.find("option:selected").val();
				break;
			
				case "input":

					//	Date and Time controls.
					//
					//	Convert the displayed date (pretty) to a system date. 
					//
					//	NOTE: because the datepicker is the the combination of two plugins, one for 
					// 	date and one for time, there are actually THREE onChange calls made -- by 
					//	date, by time, and then when the dialog is closed.  As it stands, we are doing 
					//	this twice, and the second time has date info. This is not ideal, and may
					//	end up buggy... for now, we seem to be safe.  TODO: normalize.
					//
					if(f.is(".datePicker, .timePicker, .dateTimePicker")) {
						newVal = uni.date.parse(newVal).$.toString("yyyy-MM-ddTHH:mm:ss-") + f.attr("origTZ");
					} 
					
					//	Checkboxes. 
					//
					//	Note that the value is a boolean, not "on" or similar.
					//
					else if(f.is('input[type="checkbox"]')) {
						newVal = f.attr("checked");
					} 
									
					//	Upload controls
					//
					//	Note that the file upload controller should set an attribute of "fileState"
					//	to its contained input.  We change those values here, and it is likely
					//	that the #save method of a form controller using this model will check 
					//	this value and do something with those states.
					//
					//	@see	component:upload
					//
					else if(f.is('input[type="file"]')) {
						if(f.attr("filename")) {
							newVal = f.attr("filename");
							
							//	If a new file has been selected for upload, update #fileState
							//	to `1`, indicating a queued state (Note that we do this whenever
							//	fileState is not `1`, which would be true on the first upload
							//	file selection, and any subsequent new file selections after
							//	an upload has already been done through this control.
							//
							//	When we observe that a file has been uploaded, check if the 
							//	upload control matches #id of this one, and if so update
							//	model and indicate fileState #2, which is `upload complete`.
							//
							if(fState !== undefined && fState != "1") {
								f.attr("fileState", "1");
								uni.observe("file:uploaded", function(d) {
									if(d.view.find('input[type="file"]').eq(0).attr("id") === fid) {
									
										//	Remove this observer
										//
										uni.unobserve("file:uploaded", function() {
											return this.id === fid;
										});
									
										//	Update the model with the new image path.
										//
										model.itemBinding.set(fieldPath, d.imLoc);
									
										//	Update the fileState of the upload controller to "complete" (2).
										//
										f.attr("fileState", "2");
										
										//	Clear any flagging, should this be the end result of a
										//	form save where a queued upload was flagged.
										//
										viewCon.unflagInput(f);
									}
								},
								{
									id	: fid 
								});
							} 
						}
					}
					
				break;
			
				//	Not a standard form tagName.  Check if one of our custom inputs.
				//
				default:
				break;
			}
		}
		
		//	If a value has been assigned, above, assume it is valid and set the relevant 
		//	attribute within our itemBinding.
		//
		if(newVal !== void 0) {
		
			//	Want to avoid leading/trailing whitespace for strings.
			//
			if(uni.is(String, newVal)) {
				newVal = uni.trim(newVal);
			}

			//	Indicate that the model has been tainted.  Want to build in some way of 
			//	confirming prior to the destruction of a tainted form.  Losing changes, etc.
			//	Also want to build in some sort of undo.
			//
			taintOb = {
				node		: f,
				itemId		: model.itemBinding.get("item.@id"),
				oldValue	: model.itemBinding.get(fieldPath),
				newValue	: newVal,
				fieldPath	: fieldPath
			};
			
			model.taint(taintOb);
			
			//	Notify that a form model has changed.
			//
			uni.fire("form:tainted", uni.copy(taintOb, 1));			

			//	And update the model value.
			//
			model.itemBinding.set(fieldPath, newVal);
			
			//console.log("NV");
			//console.log(newVal);
			//console.log(model.itemBinding.get());
			
			return true;
			
		} else {
			uni.notify('Was unable to find a value for DOM Element [' + tagName + '] with #id: ' + fid + '.  No change was made.', "error", "Malformed input field");
		}
		
		return false;
	};
});