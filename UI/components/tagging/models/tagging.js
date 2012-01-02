uni.observe("component:tagging:loaded", function(comp) {

	var view		= comp.view,
		model		= comp.model,
		tid			= uni.uuid(),
		cF			= view.closest(".ui.components.form");

	//	If there is a parent form, set up a processor to handle the custom value which will
	//	be set via the contained autocomplete component.
	//
	if(cF) {

		cF.data("model").addCustomValueProcessor("autocomplete", function(candidate, formModel, field) {

			//	Whatever is currently at the #itemTag node. It is not unusual for this
			//	to return undefined, as not all items will have an #itemTag set.
			//
			var fieldPath 	= field.attr("fieldPath"),
				cur 		= formModel.itemBinding.get(fieldPath),
				cv			= candidate.value,
				valsp 		= cv.value.split("|"),
				exists		= false,
				obj,
				newVal;

			if(!fieldPath) {
				return;
			}

			if(!cv.type || (cv.text === cv.value)) {
				cv.type = prompt('Custom tags need a type. Enter one now. ', '');
	
				if(!!cv.type === false) {
					return;
				}
			} else {
				//	Within taggging #controller we set the tag type to "$" for keyword
				//	tags. This indicates that the #value for this <option> is a "|" separated 
				//	string where the actual keyword value is on the right, and the tag type
				//	is on the left. Additionally, the display name for this tag has been
				//	augmented, for readability, by the tag keyword group.  We need to lose
				//	that as well, so that the tag display is only of the keyword itself.
				//
				if(cv.type === "$") {
					cv.type 	= valsp[0];
					cv.value 	= valsp[1];
					cv.text		= cv.text.split(" ~ ")[1];
				}
				//	Legacy re: game data, we need the #displayName of the field in the #tagList
				//	of the model to be a special value that is different from what we show
				//	in the autocomplete.  This special value forms the right side of the
				//	#value string.  So we split #value out, and store [1] as #value, and
				//	[2] as #title (which is set as @displayName in the model).
				//
				else if(cv.type	=== "game_pk") {
					cv.value 	= valsp[0];
					cv.text		= valsp[1];
				}
			} 
					
			//	Final check to make sure that a real value exists in all key fields.
			//
			if(!!cv.type === false || !!cv.text === false || !!cv.value === false) {
				return;
			}
					
			obj		= {
				"@type"			: cv.type,
				"@value"		: cv.value,
				"@displayName"	: cv.text
			};

			if(cur === undefined) {
				newVal = {};
			} else if(uni.is(Object, cur)) {
				newVal = [cur];
			} else if(uni.is(Array, cur)) {
				newVal = cur;
			} else {
				formModel.poison();
				uni.notify('The item tag collection at path > ' + fieldPath + ' is not an Array or Object. No changes made, and model poisoned.', "error", "Tags Corrupted");
				return;
			}
								
			//	Now go through each of the options, check if it already exists in the
			//	collection, and if not, add.  Note that this will also stop 
			//	duplicates from being added.
			//
			uni.forEach(function(e, i) {
				if(e["@displayName"] === cv.text) {
					exists = true;
				}
			}, newVal);
							
			//	The internal (server) data handling creates inconsistent data 
			//	types on certain nodes, such as #itemTag. If there is only one
			//	member of a collection, the node will point to a single object.
			//	If more than one member, the node will point to an array of 
			//	these objects.
			//
			if(exists === false) {
				if(uni.is(Object, newVal)) {
					newVal = obj;
				} else {
					newVal.push(obj);
				}
				
				//	Destroy any existing value, as each value gets only one chance at being processed.
				//
				candidate.value = undefined;
				
				return newVal;
			}
		});
	}
});