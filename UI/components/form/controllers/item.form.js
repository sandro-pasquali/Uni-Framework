//	Reads and renders an item into a form bound to the item Json, such that this form will
//	provide a UI though which the json model can be manipulated by a user.
//
//	Pay attention to the closures, as there are several.  The main methods are #renderItem and
//	#getUIRow. Simply, you begin the process by passing an item node to #renderItem, which will
//	then recursively parse the item tree, creating an edit interface for each item#field member 
//	by passing that field to #getUIRow. If that field contains a #subItemList, some sort of 
//	grouping UI control (accordion; tabs; etc) will be created, and each sub-item will be passed  
//	to #renderItem, inserting what is returned as a member of the containing group, etc.  
//
//	Additionally each item will be augmented with specialty UI controls created via 
//	#addMetadataFields and #addTaggingFields, which reflect the "root" values of an item (such
//	as date, tags, internal name, and so forth), allowing editing of those values.
//
//	Each editable field will be assigned a #fieldPath attribute, which contains the path to
//	its value node.  Expects that a "change" event is part of the #listensFor attribute for
//	this component, for which the controller has a #change method defined (see below).  This
//	change event will then pass any new values to the model, which handles things from there.
//
uni.observe("component:form:loaded", function(comp) {
	var view				= comp.view,
		model				= comp.model,
		controller			= comp.controller,
		viewCont			= comp.viewController,
		rootSubItemTypes	= false,
		sop					= uni.data.get("system:options").$,
		siControlType		= sop.subItemControlType,
		itemId				= model.itemBinding.get().item["@id"],
		
		//	Options on filtering which parts of an item are shown. 
		//	
		//	Hiding subItems hides the containers for subItems as well as the subItems themselves.
		//	Binaries are things like images and videos.
		//	Metadata includes the item date and the internal item name.
		//	Tagging is the full control for all tagging options for an item.
		//
		hideSubItems		= !!(view.attr("hideSubItems") === "true"),
		hideBinaries		= !!(view.attr("hideBinaries") === "true"),
		
		//	Will go through an item and render its fields such that they can be inserted
		//	into the DOM.  It works recursively, where a root item contains sub items. You
		//	would likely start the process by passing the root item node of a CMS asset.
		//
		//	@param		{Object}	iRef		An item node.
		//	@param		{Mixed}		fTarget		A Jquery object w/ at least one element into
		//										which the result is inserted, or a String. If 
		//										If a String, the HTML will be returned as a string.
		//	@param		{Boolean}	isSubItem	Whether a subItem. This is used mostly to find
		//										#fieldType information, as the root item and 
		//										subItems both have this info stored at the root 
		//										level, in different objects (instead of 
		//										within the subitem itself).
		//
		renderItem	= function(iRef, fTarget, isSubItem) {
			//	See #hideSubItem notes, above
			//
			if(isSubItem && hideSubItems) { 
				return; 
			}
		
			var	itemObj				= uni.spawn().createSubjectFacade(iRef),
				itemField			= itemObj.get("field"),
				itemFieldType		= itemObj.get("itemType.fieldType"),
				itemState			= itemObj.get("@state"),
				siTypeKeys			= {},
				fKeys				= {},
				itemKey				= itemObj.get("itemType.@key"),
				lockInfo			= itemObj.get("lockInfo"),
				subItemRank			= isSubItem ? itemObj.get("@rank") : false;
			//	Unfortunately various field collections are not consistently arrays.  Single
			//	member collections come back as objects. We need arrays. Fix those here.
			//
			itemField 		= uni.forceArray(itemField);
			itemFieldType 	= uni.forceArray(itemFieldType);

			//	SubItemType information is stored within the top-level item.
			//	So, when we find that we have #subItemTypes set, we store
			//	it "globally", so that when we are running a subItem render we
			//	can still refer to these values.
			//
			if(iRef.itemType.subItemTypes) {
				rootSubItemTypes = itemObj.get("itemType.subItemTypes.itemType");
				rootSubItemTypes = uni.forceArray(rootSubItemTypes);
			} 
		
			//	Subitems find their #fieldType information via a different path
			//	than an item, as mentioned above...
			//
			if(isSubItem) {
				for(var q=0; q < rootSubItemTypes.length; q++) {
					if(rootSubItemTypes[q]["@key"] === itemKey) {
						itemFieldType = rootSubItemTypes[q].fieldType;
						break;
					}
				}
			}
		
			//	Processes a field object, creating the html for the form.  Note that this is
			//	written to facilitate recursive rendering of the main form fields.  To add
			//	other rows to the form "by hand" you will need to emulate the passed values,
			//	which primarily means sending a fieldData.@name (this becomes the <label>), 
			//	and a [field.$] (this is the current value of the input, which is optional).  
			//	The `idx` argument is used to track iteration when this is being called by the
			//	main item processing routine, and is not needed for individual requests.
			//
			//
			var getUIRow 	= function(fieldData, field, idx) {					
				var tid				= uni.uuid(),
					fldName			= fieldData['@name'],
					fldPrimitive	= fieldData["@primitive"],
					xmlCascade		= fieldData["@xmlCascade"],
					fldValidation	= fieldData["fieldValidation"],
					fldDispType 	= fieldData["@fieldDisplayType"],
					key				= fieldData["@key"],
					termAttr		= fieldData["termAttr"] || "$",
					subItemTypeKey 	= fieldData.subItemType ? fieldData.subItemType["@key"] : null,
					subItemName		= "",
					subItemId		= "",
					subItems		= [],
					listValues		= [],
					fieldValue 		= field["$"] || fieldData["$"] || "",
					ret				= [],
					accDrops,
					imOb,
					q,
					tLab;

					//	Each form input should have a #fieldPath, which is used to address
					//	the node in the form model to reflect value and changes in value.  
					//
					//	NOTE: This should be reworked, as it works for most simple cases, but
					//	below you'll notice how the #fieldPath often has to be reworked in order
					//	to properly reflect special fields, and how it has a strange 
					//	relationship with the #termAttr "hack".  Works mostly for .$ fields.
					//
					//	@see	#efBuild
					//
					fieldPath = model.itemBinding.findPath("@key", function(a, ob) {
						return (ob === field);
					}, "item") + "." + termAttr,

					//	A label for this field.  Note that some fields will not use it.
					//
					lab 	= '<label for="' + tid + '">' + fldName + '</label>',
					
					addFV	= function(attOb) {
						attOb = attOb || {};
						//	If this #fieldData has a #fieldValidation attribute find the path.
						//
						if(fldValidation) {
							attOb.validation = model.itemBinding.findPath("fieldValidation", function(a, ob) {
								//	If this node has a #fieldValidation attribute, `a` will be set.
								//	`ob` is the object containing this attribute.
								//
								if(a) {
									//	Match on id?
									//
									if(fieldData["@id"] == ob["@id"]) {
										return true;
									}
								}
							}, "item");
						}
						
						return attOb;
					},

					//	Generates a string representing the requested form input type.  
					//
					//	@param		{String}		tag		The form tag, such as "input".
					//	@param		{Object}		atts	Hash of attributes to add.
					//	@param		{Boolean}		lb		Whether to create a label. Default is
					//										to create a label.
					//
					efBuild		= function(tag, atts, lb) {
						var r = "<" + tag + " ",
							a;
						
						//	Note that we include a fieldpath with all editable fields.
						//
						atts.fieldPath = fieldPath;
						
						//	Sanity check -- turn on to check our accessor is finding
						//	the right object.
						//
						//atts.fVV = model.itemBinding.get(fieldPath);

						addFV(atts);
						
						for(a in atts) {
							r += a + '="' + atts[a] + '" ';
						}
						
						r += '></' + tag + '>';
						
						//	Add label by default.
						//
						return !lb ? lab + r : r;
					};
	
				//////////////////////////////////////////////////////////////////////////////////
				//																				//
				//								BINARYPATH										//
				//																				//
				//////////////////////////////////////////////////////////////////////////////////
				if(fldPrimitive == "BinaryPath") {

					if(fldDispType == "FILE") {	
						
						//	For file uploads we want to:
						//	a) Display the image thumbnail.
						//	b) Provide a file upload component that allows automatic upload, and
						//	dynamic refresh of UI once complete.
						//	c) Note that we are passing two attributes to the component, the 
						//	#fieldpath and its #validation.  These will be read by the uploader 
						//	controller, and will become attributes of the input:file element
						//	which the upload controller creates.  This is turn is read by
						//	the form.model which contains this upload component when the
						//	model is saved.
						//

						imOb	= uni.fire("image:augment", { image: fieldValue }).$;
						
						ret.push('\
						<div class="row">\
							<div class="column grid_3 ui components thumbnail" src="' + imOb.thumbPath + '" fullView="' + imOb.path + '">\
								<img id="thumb-' + tid + '"  />\
							</div>\
							<div class="column grid_9">');
						
						//	If this is a subitem, provide an uploader.
						//	Raw (root photo asset values) cannot be changed, so we check for
						//	that condtion. Others get an upload
						//
						if(itemId == iRef["@id"]) {
							
							ret.push("<div>" + fieldValue + "</div>");
							
						} else {
							
							ret.push('\
							<div id="uploader-' + tid + '" \
								class="ui components upload" \
								controller="UI/components/upload/controllers/form-image-inline-uploader.js" \
								fieldpath="' + fieldPath + '" \
								validation="' + addFV().validation + '"\
								origfilename="' + fieldValue + '"\
								itemid="' + itemId + '"\
								subitemid="' + iRef["@id"] + '"\
							>\
								<div id="upload-container-' + tid + '" class="upload-container">\
									<div id="filelist-' + tid + '" class="upload-filelist">' + fieldValue + '</div>\
									<div id="pickfiles-' + tid + '" class="upload-file-select ui controls button" href="#">Choose a File to Upload</div>\
									<div id="uploader-upload-files' + tid + '" class="uploader-upload-files ui controls button" href="#">Upload This File</div>\
								</div>\
							</div>');
						}
								
						ret.push('</div></div>');
					}
					
				//////////////////////////////////////////////////////////////////////////////////
				//																				//
				//								STRING											//
				//																				//
				//////////////////////////////////////////////////////////////////////////////////
				} else if(fldPrimitive == "String") {
				
					if(fldDispType == "TEXT_AREA") {
						ret.push(lab + '<textarea id="' + tid + '" name="' + tid + '" fieldPath="' + fieldPath + '" class="ui controls autoTextarea">' + fieldValue + '</textarea>');
						
					} else if(fldDispType == "CHECK_BOX") {
					
					} else if(fldDispType == "TEXT_FIELD") {
						ret.push(efBuild("input", {
							id:			tid,
							name:		tid,
							type:		"text",
							value:		fieldValue
						}));
					}
				
				//////////////////////////////////////////////////////////////////////////////////
				//																				//
				//								LIST											//
				//																				//
				//////////////////////////////////////////////////////////////////////////////////
				} else if(fldPrimitive == "List") {

					//	Item lists are handled here.
					//
					if(fldDispType == "LIST") {

						//	Fetch all the items in the list.
						//
						if(field.listValue) {
							listValues = uni.forceArray(field.listValue.item);
						}
						
						//	Lists have an #acceptsDrop attribute, which should be a selector
						//	which matches item tile elements which are dropped on or otherwise
						//	attempt to join a list.  Here we build that selector by finding all
						//	the #subItemType's of #fieldData.
						//
						accDrops	= [];
						uni.forEach(function(e) {
							accDrops.push('div[itemType=\'' + e["@key"] + '\']');
						}, uni.forceArray(fieldData.subItemType));
						
						
						ret.push('<div>' + fldName + '</div>');
						
						if(listValues.length === 0) {
						
							ret.push('<div>add items here</div>');
							
						//	If this LIST has items, we create a sortable list.
						//
						} else {
							ret.push('<div id="list-' + idx + '-' + tid + '" \
							 	fieldPath		= "' + fieldPath.replace(".$", ".listValue") + '" \
								class			= "ui components list" \
								controller		= "UI/components/list/controllers/form.list.js" \
								sortable		= "true" \
								pointer			= "true" \
								acceptsDrop		= "' + accDrops.join(",") + '"><ul>');
	
							ret.push('</ul></div>');
						}		
						
					//////////////////////////////////////////////////////////////////////////////
					//																			//
					//								SUBLIST										//
					//																			//
					//////////////////////////////////////////////////////////////////////////////
					} else if(fldDispType == "SUBLIST") {
					
						//	Normalize the items in this list.
						//
						if(field.subItemList) {
							subItems = uni.forceArray(field.subItemList.item);
						}

						//	If this list has no subItems, simply add its fields.
						//
						if(subItems.length === 0) {									
							ret.push('<div>add fields here</div>');
									
						//	If this list has multiple subitems, we create accordion
						//
						} else {
						
							//	Determines the subItem name, such as "Photos".
							//
							for(q=0; q < rootSubItemTypes.length; q++) {
								if(rootSubItemTypes[q]["@key"] === subItemTypeKey) {
									subItemName = rootSubItemTypes[q]["@name"];
									break;
								}
							}

							if(siControlType == "accordion"){
								ret.push('<div id="acc-' + idx + '-' + subItemId + '-' + tid + '" class="ui components accordion">');
			
								uni.forEach(function(subItem, j) {
								
									subItemId = subItem["@id"];
								
									ret.push('<h3 id="acc-title-' + subItemId + '-' + j + '-' + tid + '"><a id="acc-label-' + subItemId + '-' + j + '" href="#">' + subItemId + '</a></h3><div><ol>');
									ret.push(renderItem(subItem, "", true) + '</ol>');

									ret.push('<ol id="form-metadata-list-' + subItemId + '-' + j  + '-' + tid + '">');
									ret.push(addMetadataFields(subItem) + '</ol>');
									
									ret.push('<ol id="form-tagging-list-' + subItemId + '-' + j + '-' + tid + '">');
									ret.push(addTaggingFields(subItem) + '</ol></div>');

								}, subItems);
									
								ret.push('</div>');
							}
							
							if(siControlType == "tabs" || siControlType == "vtabs") {

								ret.push('<div id="tabs-' + idx + '-' + subItemId + '-' + tid + '" class="ui components tabs"');
								
								if(siControlType == "vtabs") {
									ret.push(' vertical="1"');
								}
								
								ret.push('><ul>');

								uni.forEach(function(subItem, j) {
								
									tLab = '<div class="gui-icon-inline subitem-type-' + subItemTypeKey + '" >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>';
									
									/*
										imForTab = itemObj.find("@key","image-location",itemObj.findPath("@listItemId", subItem["@listItemId"], "field"));
										getImageSrc(imForTab[0].$, true)
									*/
									
									subItemId = subItem["@id"];

									tLab += subItemId;

									ret.push('<li><a href="#tabs-' + subItemId + '-' + j + '-' + tid + '">' + tLab + '</a></li>');
								}, subItems);
								
								ret.push('</ul>');
			
								uni.forEach(function(subItem, j) {
	
									subItemId = subItem["@id"];
	
									ret.push('<div id="tabs-' + subItemId + '-' + j + '-' + tid + '"><p><ol>');
									ret.push(renderItem(subItem, "", true) + '</ol>');
	
									ret.push('<ol id="form-metadata-list-' + subItemId + '-' + j + '-' + tid + '">');
									ret.push(addMetadataFields(subItem) + '</ol>');
									
									ret.push('<ol id="form-tagging-list-' + subItemId + '-' + j + '-' + tid + '">');
									ret.push(addTaggingFields(subItem) + '</ol></p></div>');
								}, subItems);
								
								ret.push('</div>');
							}
						}
					}
				
				//////////////////////////////////////////////////////////////////////////////////
				//																				//
				//								LONG											//
				//																				//
				//////////////////////////////////////////////////////////////////////////////////
				} else if(fldPrimitive == "Long") {
					ret.push(efBuild("input", {
						id:			tid,
						name:		tid,
						type:		"text",
						value:		fieldValue
					}));
					
				//////////////////////////////////////////////////////////////////////////////////
				//																				//
				//								DATE											//
				//																				//
				//////////////////////////////////////////////////////////////////////////////////
				} else if(fldPrimitive == "Date") {

					//	Converting Java time format so that it can be displayed. Capturing date
					//	info, then using %date#parse to prettify it (Unfortunately %date#parse
					//	cannot handle this format -- TODO: add support).
					//
					//	Capturing (everything before 'T') (24:00:0) (0000)
					//			   ^ date		 		   ^ time    ^ zone
					//
					var dg		= /^([^\s]{1,})T(\d{2}:\d{2}:\d{2})-(\d{4})$/.exec(fieldValue),
						dateOps = {
							id			: tid,
							name		: tid,
							type		: "text",
							origVal		: fieldValue,
							origTZ		: dg 	? dg[3] : "0400",
							value		: dg	? uni.date.parse(dg[1] + " " + dg[2]).$.toString(sop.dateOptions.dateTimeFormat) 
												: ""
						};
				
					if(fldDispType == "DateTime") {
						dateOps.class = "ui controls dateTimePicker"
					} else {
						dateOps.class = "ui controls dateTimePicker"
					}
					
					ret.push(efBuild("input", dateOps));
					
					
				//////////////////////////////////////////////////////////////////////////////////
				//																				//
				//								CLOB											//
				//																				//
				//////////////////////////////////////////////////////////////////////////////////
				} else if(fldPrimitive == "Clob") {
				
					ret.push(lab + '<input id="' + tid + '" />');
				}

				return ret.join("");
			},
			
			//////////////////////////////////////////////////////////////////////////////////////
			//																					//
			//									ADD METADATA FIELDS								//
			//																					//
			//////////////////////////////////////////////////////////////////////////////////////
			
			//	This will create the metadata fields -- internal name, date, time -- for
			//	any item (and subitem).
			//
			addMetadataFields = function(item) {

				//	We are being passed a subitem if #item is set; if it is not
				//	set, we are operating on the main(root) item.
				//
				var si = !!item;

				item	= item || iRef;

				//	We are reducing the collection of metadata fields into a string
				//	of <li>'s generated by #getUIRow, which we return.
				//
				//	Note that we are sending #getUIRow a "faked" version of field data,
				//	as it usually receives item.itemType.fieldType[index] for a field.
				//
				return 	uni
					.spawn(uni.data.getProperty("itemFormMetadataFields"))
					.reduce(function(acc, fOb) {
						return acc += '<li class="form-list-item" itemId="' + iRef["@id"] + '" ' + (si ? 'subItemId="' + item["@id"] + '"' : '') + '>' + getUIRow({ 
							"@name"				: fOb.name, 
							"@primitive"		: fOb.primitive,
							"@fieldDisplayType"	: fOb.displayType,
							"$"					: item[fOb.attribute],
							"termAttr"			: fOb.attribute
						}, item) + '</li>';
					}, "").$;
			},
			
			//////////////////////////////////////////////////////////////////////////////////////
			//																					//
			//									ADD TAGGING FIELDS								//
			//																					//
			//////////////////////////////////////////////////////////////////////////////////////
			
			//	Create the tagging UI for this item.  
			//
			//	@param		{Object}		[subItem]		SubItem have their ref passed; the
			//												root item reference is closed on.
			//
			addTaggingFields = function(subItem) {

				//	We are being passed a subitem if #item is set; if it is not
				//	set, we are operating on the main(root) item.
				//
				var item		= uni.spawn().createSubjectFacade(subItem || iRef),
					tid			= uni.uuid(),
					suId		= item.get("@id"),
					itemId		= itemObj.get("@id"),
					tags		= false,
					fieldPath	= "",
					pTemp,
					pFind,
					out			= [];
													
				//	Check if this item has #itemTag (tags). To check a subitem we need to find
				//	its object in the item and then check if it has #itemTag, while for 
				//	the canonical item we can simply check the known path.
				//
				if(subItem) {	
					pTemp 		= itemObj.findPath("@id", suId, "field");
					fieldPath 	= "item." + pTemp + ".itemTag";
					tags		= itemObj.get(pTemp).itemTag || [];
				} else { 
					tags 		= itemObj.get("itemTag") || [];
					fieldPath 	= "item.itemTag";
				}

				out.push('<li class="form-list-item" itemId="' + itemId + '" ' + (subItem ? 'subItemId="' + suId + '"' : '') + '>');
				
				out.push('<div id="tagging-component-' + tid + '" \
							class="ui components tagging" fieldPath="' + fieldPath + '" \
							view="UI/components/tagging/views/form.tagging.html" \
							listensFor="change click"></div>');

				out.push('</li>');
					
				return out.join("");
			};
				
			//////////////////////////////////////////////////////////////////////////////////////
			//																					//
			//							PROCESS EACH FIELD IN THIS ITEM							//
			//																					//
			//////////////////////////////////////////////////////////////////////////////////////

			//	Each item has a list of fields (item.field), and information on the field type
			//	(item.itemType.fieldType). Corresponding records are linked via a common @key
			//	field. Field types contain information about the ordering of the field (@rank),
			//	the display type (@fieldDisplayType) and other key info.  
			//
			//	We are going to go through each field and draw it.  We will need to be able to 
			//	fetch each field's type information.  Here we create a lookup.
			//
			uni.forEach(function(e, i) {
				fKeys[e["@key"]] = e;
			}, itemFieldType);

			//	Now sort the fields based on their @rank.
			//
			itemField = itemField.sort(function(a,b) {
				return fKeys[a["@key"]]["@rank"] - fKeys[b["@key"]]["@rank"];
			});
					
			//	Now go through each field, request a rendered field element, and
			//	append to the target display element within our form.  Note that
			//	we are creating the containing <LI> element here.  
			//
			//	Note that we set the Subject to #fKeys, and are iterating over #itemField,
			//	such that fieldData can be retrieved via fKeys[itemField[iteration]];
			//

			uni.spawn(fKeys, 1).forEach(function(e, i) {

				if((e["@xmlCascade"] === "Y") && hideSubItems) {
					return;
				}

				if((e["@primitive"] === "BinaryPath") && hideBinaries) {
					return;
				}

				var app = '<li class="form-list-item" itemId="' + iRef["@id"] + '" ' + (isSubItem ? 'subItemId="' + iRef["@id"] + '"' : '') + '>' + getUIRow(this.$[e["@key"]], e, i) + '</li>';
				if(uni.is(Object, fTarget)) {
					fTarget.append(app);
				} else {
					fTarget += app;
				}
			}, itemField);
			
			//	Now add the metadata fields for the main item. 
			//
			$('#form-metadata-list-' + iRef["@id"]).append(addMetadataFields());
			$('#form-tagging-list-' + iRef["@id"]).append(addTaggingFields());
			
			return fTarget;
		};

	//////////////////////////////////////////////////////////////////////////////////////////
	//																						//
	//							BEGIN THE RENDERING OF AN ITEM								//
	//																						//
	//////////////////////////////////////////////////////////////////////////////////////////
	
	//	Create the Item form shell
	//
	viewCont.insertItemShell();

	//	#model#bindingDirective contains what was originally passed to the component via its 
	// 	attribute directives -- for a form this would  normally be an itemId.  "form-field-list" 
	// 	and other similar selectors found in this controller are custom for an item form. 
	//
	//	@see	global.controller.js -> observer for "dialog:item:open"
	//
	renderItem(model.itemBinding.get("item"), $("#form-field-list-" + model.bindingDirective));

	// 	Bind any new components created within the form
	//
	uni.components.bind();
	
	//	Wait for the point at which all form components are rendered.  Now load the
	//	tip structures.
	//
	uni.observeOnce("components:bind:complete", function() {

		//uni.components.bind();
	
	});

	//////////////////////////////////////////////////////////////////////////////////////////
	//																						//
	//							FORM CONTROLLER METHODS										//
	//																						//
	//////////////////////////////////////////////////////////////////////////////////////////

	//	Will save the item.
	//
	//	@param		{Function}		[onSaveSuccess]		May be passed a callback to be 
	//													executed on a successful save.
	//	@param		{Function}		[onSaveError]		May be passed a callback to be 
	//													executed if save fails.
	//	
	controller.save = function(onSaveSuccess, onSaveError) {
		
		var mT		= model.tainted,
			incUp	= [],
			doSave	= function() {
				$.ajax({
					url: uni.data.serviceUrl("item.save"),
					dataType	: "json",
					type		: "POST",
					cache		: false,
					data		: uni.json.stringify({ item: model.itemBinding.get("item") }).$,
					success		: function(data) {
						uni.notify("Item #" + data.item["@id"] + " saved.", "saving");
						onSaveSuccess && onSaveSuccess();
					},
					error		: function(xhr, stat) {
						if(xhr.status != 200) {
							uni.notify("Received a status code of " + xhr.status + ".", "alert", "Save has failed (" + stat + ")");
							
							onSaveError && onSaveError();
						}
					}
				});
			};
			
		uni.forEach(function(e, i) {
		
			//	Run through the tainted fields and check if they are file upload controls (if
			//	#fileState is set).  
			//
			//	1 == Queued File.
			//	2 == Uploaded Complete.
			//
			//	If a file control input and file is queued, store the reference and flag
			//	the input.  If complete, clear any previous flagging.
			//
			var fs 		= e.node.attr("fileState");
			
			if(fs == "1") {
				incUp.push(e);
				viewCont.flagInput(e.node);
			} else if(fs == "2") {
				viewCont.unflagInput(e.node);
			}
			
		}, mT);
		
		//	If there are incomplete uploads, notify.
		//
		if(incUp.length > 0) {
			//	Create confirmation dialog, which if confirmed will fire the delete service.
			//
			$('<div id="dialog-form-unsaved-binaries" title="Uploads Not Complete">\
				<p style="padding: 20px;">\
				<span class="notice-icon notice-icon-uploading" style="margin-right: 10px; height: 100px;"></span>\
				You have queued ' + incUp.length + ' file(s) for uploading, but have not \
				started the upload. Queued items have been highlighted. <br /><br />To save now without uploading those \
				files, hit "Save". <br /><br />To upload then save, hit "Upload and Save".\
				</p></div>').dialog({
					
				width		: 360,
				height		: 240,
				resizable	: false,
				modal		: true,
				close		: function(ev, ui) {
					$(this).dialog("destroy").remove();
				},
				buttons			: {
					"Save": function() {
					
						//	If the user wants to ignore the selected files, we need to return
						//	them to their pre-tainted state.
						uni.forEach(function(e, i) {
							model.itemBinding.set(e.fieldPath, e.oldValue);
						}, incUp);
						
						doSave();
						
						$(this).dialog("destroy").remove();
					},
					"Upload and Save": function() {

						$d	= $(this);

						//	Trigger clicking on the save button for each of the unsaved
						//	photos.  Then we create an auditor to wait for the 
						//	fileState of both to be == 2. At which point we save.
						//
						uni.forEach(function(e, i) {
							e.node	
								.closest(".upload-container")
								.find('div[id^="uploader-upload-files"]')
								.trigger("click")
						}, incUp);
						
						uni.test(function() {
							var c = incUp.length;
							while(c--) {
								if(incUp[c].node.attr("fileState") == "2") {
									incUp.splice(c, 1);
								}
							}
							if(incUp.length === 0) {
								doSave();
								
								//	Remove the save notification dialog.
								//
								$d.dialog("destroy").remove();

								return false;
							}
							return true;
						});
					},
					"Cancel": function() {
						$(this).dialog("destroy").remove();
					}
				}
			});
			
			return;
		} 
		
		//	All normal.  Save.
		//
		doSave();
	};
	
	//	Whenever a form input changes give the model a chance to validate, etc, and update
	//	#itemBinding.
	//
	controller.change = function(ev, t, c) {

		if(model.updateFieldValue(t)) {
		
		} else {
		
		}
	};
});