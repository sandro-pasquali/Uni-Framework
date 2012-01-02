//	Actions to perform once the document is available.  Mainly this involves seeking components
//	and initializing them. Upon document ready we are going to:
//	1. 	Find all components/controls (Dom pass) and determine any dependencies.  
//	2.	We're going to load those dependencies.  These are views, controllers, models.
//	3.	As loading progresses we notify of components coming "on line".
//	4. 	Once we've completed a pass, we *repeat* the process, as the loading of views
//		may have introduced further components, etc.
//	5.	Once a pass has nothing to do notify that the ui is initialized, and return.
//
$(function(){
		//	This will track the number of components being worked on -- ie, having
		//	their dependencies loaded. This value is mainly important to the the uni#test
		//	which is auditing the load state of the ui.
		//
		//	@see		#pass
		//	@see		#componentLoader
		//
	var workingCount 	= 0,
	    lastTimestamp   = null,
	    sop 			= uni.data.get("system:options").$,
	    
	    //	Tracks non-js file loading (css, json, html), 
	    cached			= {},
	    
	    //	Tracks any drop targets.  See #ui#controls#draggable.
	    //
	    dropTargets		= [],
	    
	    //	It is often the case that we'll want to reset a component, so that it
		// 	can be re-defined and re-bound.  These are the attributes which will
		//	be cleared on a component when #reset is fired. See below.
		//	Note that `panel` is *always* cleared when #expose is executed on a
		//	component.
		//
		cAtts	= {
			"css"					: "",
			"view"					: "",
			"controller"			: "",
			"model"					: "",
			"templateData"			: "",
			"templateDirective"		: "",
			"panel"					: "",
			"itemBinding"			: ""
		},
	
		compData		= uni.data.getProperty("componentData"),

		//	Helper, supposed to find the path to 'UI/components'.
		//	TODO: finish, actually check the domain and find path.
		//
		path	= function(t) {
			var p;
			switch(t) {
			
				case 'tmpl':
				break;
			
				default:
					p 	= "UI/components/";
				break;
			}
			return p;
		},

		delegateComponentEvents = function(component, cmpName) {
			cmpName = cmpName || component.data("model")['componentName'];
			
			//	You may set a list of events to listen for (#listensFor="event event ..."), request 
			//	that no events are listened for (remove #listensFor attribute), or that *all* 
			//	(#listensFor = "all").  You are encouraged, if listening for events, to 
			//	provide a list -- there is overhead in handling an event, so it is good practice
			//	to only take this cost if needed.
			//
			var evs	= "abort change click dblclick error mouseup mousedown mouseout mouseover mouseenter mouseleave keydown keyup keypress focus blur focusin focusout load unload submit reset resize select scroll",
				lf	= component.attr("listensFor");
				
			if(lf) {
				if(lf !== "all") {
					evs = lf;
				}
			} else {
				return;
			}

            //  All events occurring on nodes contained by component will be delegated to the 
            //  attached function if the node has an #id attribute, even if the id attribute
            //  is empty (*[id]).  Note that a node must have a non-empty #id for it to fire
            //	events within this system.
            //
			return component.delegate("#" + component.attr("id") + " *[id]", evs, function(ev) {				
				//	#liveFired contains a reference to the delegate, which is a component.
				//
				var cmp		= $(ev.liveFired),

					//	Get a reference to the #controller of the component we have delegated
					//	to (cmp), and determine if we have a controller method for this
					//	event type.  See below for the call of this method.
					//
					ctrl	= cmp.data("controller")[ev.type],

					targ	= $(ev.currentTarget),
					
					tid		= targ.attr("id"),
					cid		= cmp.attr("id"),

					et		= ":" + tid + ":" + ev.type;

				//	We only handle events on elements with an #id that is not empty.  Note that
				//	we need this as the delegate can be "tricked" with an empty #id (= "").
				//
                if(tid && ev.timeStamp !== lastTimestamp) {

                    //  Events of the same type occurring at exactly the same time are ignored.
                    lastTimestamp = ev.timeStamp;
                    
                    //	Observable events:
                    //	componentName:eventType 			(form:change)
                    //	componentId:eventType				(myComponentId:click)
                    //	componentName:targetId:eventType	(myComponentname:myButtonId:click)
                    //
                    uni.fire(cmpName 	+ ":" + ev.type	, ev);
                    uni.fire(cid 		+ ":" + ev.type	, ev);
                    uni.fire(cmpName 	+ et			, ev);
                    
                    uni.notify(ev.type + " on element <" + ev.target.tagName + "> with id: " + tid + " delegated for component: " + cmpName + " with id: " + cid)

                    //	If delegate has a controller method with this event, fire that.  Note that
                    //	we are firing the control method in the scope of the component controller.
                    //
				    ctrl && ctrl.call(cmp.data("controller"), ev, targ, cmp);
                }
			});
		},

		//	The viewController is responsible for managing the actual DOM element which
		//	represents a component.  Mainly this involves setting/removing attributes and
		//	otherwise managing the component definition and binding events.
		//
		//	@param		{Object}		comp		The component Dom element.
		//
		createViewController 	= function(comp) {

			var p,
				id 		= comp.attr("id");

			//  The viewController object...
			//
			return {

				//	Exposes a component to re-binding, via %components#bind.
				//	We simply have to flag the component as unprocessed.
				//
				"expose"	: function() {
					return comp.data("processed", 0);
				},
					
				//	Destroys the component completely, including the defining element.
				//	If you would like to simply empty the component of its view, use
				//	:empty.  Note that we want to have some way to cancel this in the future.
				//
				"destroy"	: function() {
					var m = comp.data("model");
					if(m.isTainted()) { 
						//alert('tainted');
					}
					
					uni.fire("component:beforeDestroy", comp);
					
					this.clearPanel();
							        
					//	Components which create elements outside of their 
					//	main container (ie. the container w/ class 
					//	"ui components x"), can push element references
					//	onto this stack, removed here when a component
					//	is destroyed.
					//
					uni.forEach(function(i) {
						$(i).remove();
					}, m.garbage);
					
					//	Unobserve any observers bound during this component's setup.
					//	@see #componentLoader.
					//
					uni.forEach(function(o) {
						uni.unobserve(o.name, function() {
							return this.fn === o.fn;
						});
					}, m.observers);
					
				    this.empty();
					comp.remove();
				},
					
				//	Empties all content (innerHTML) of a component.  If you would like to
				//	completely destroy the component, use :destroy.
				//
				"empty"		: function() {
				
					comp.find(".ui.components").reverse().each(function() {
						$(this).data("viewController").destroy();
					});
				
					comp.empty();
					
					return comp;
				},
					
				//	If this coponent has a "panel" attribute, clear any such panel.
				//	Note: Our layout system collapses any empty columns (correctly). When
				//	a panel is removed, it is emptied. We do not want the layout to collapse.
				//	Adding a &nbsp; solves this.
				//	
				//
				"clearPanel"	: function() {
					if(comp.attr("panel")) {
						return $("#ui-control-panel").html("&nbsp;");
					}
				},
				
				"showPanel"		: function() {
					if(comp.attr("panel")) {
						return $("#ui-control-panel").fadeIn();
					}
				},
				
				"hidePanel"		: function() {
					if(comp.attr("panel")) {
						return $("#ui-control-panel").fadeOut();
					}
				},
				
				//	Re-attach delegation system. Used when you want to change what events
				//	a component will react to by altering #listensTo.
				//
				"delegate"		: function() {
					comp.undelegate();
					return delegateComponentEvents(comp);
				},
				
				//	Clears all #listensTo event tracking.
				//
				"undelegate"	: function() {
					return comp.undelegate();
				},
					
				//  Allows a number of attributes to be set on this component. This would
				//  normally be used to set view/controller/model attributes on a 
				//  component before rebinding.
				//
				//  @param      {Object}        v       A map of attributes to set.
				//
				"set"		: function(v) {				
				    v   = v || {};
					var k;
					for(k in v) {
						comp.attr(k, v[k]);
					}
					
					return comp;
				},

				//  Allows a request for a complete rebinding of a component.  A developer
				//  can target a component, change its attributes (typically its model/
				//  view/controller attributes) and re-bind it.
				//
				//  @param      {Object}        [v]     A map of attributes to set.
				//	@param		{Boolean}		[clr]	Whether or not to clear all 
				//										component attributes prior to
				//										setting new ones.  Default
				//										is false.
				//
				"rebind"    : function(v, clr) {
						
					//	Notify that the component will be rebound
					//
					uni.fire("component:beforeRebind", comp);
						
					this.clearPanel();

					//	All descendants are destroyed.
					//
                    this.empty();
                        
                    //  Reset all component configuration attributes (if requested), then set 
                    //	configuration attributes to those sent.
                    //
                    clr && this.set(cAtts);
                    this.set(v);
                        
                    //	Indicate that on the next bind pass this component should be bound.
                    //
                    this.expose();
                    
                    //	...and start the bind pass.
                    //
                    uni.components.bind();
                    
                    return comp;
				},
				
				//	DO NOT USE. In development.
				//
				"scrollIntoView"	: function(e, c) {
				
					c = c || comp;
					
				  	var cTop = c.scrollTop(),
				  	 	cBottom = cTop + c.height(), 
				  		eTop = $(e).offset().top,
				  		eBottom = eTop + $(e).height(); 
				  		
				  	if (eTop < cTop) {
						c.scrollTop(eTop);
				  	} else if (eBottom > cBottom) {
						c.scrollTop(eBottom - c.height());
				  	}
				}
			};			
		},
			
		//	When a component is found in #pass, we pass it here for processing.  Get
		//	dependencies, check against defaults, load, track load progress, notify 
		//	observers of load states.
		//
		//	@param		{String}	componentNode	The DOM element represented by the <div> containing
		//											the definitive attributes.
		//
		componentLoader = function(componentNode) {

			var cid	= componentNode.attr("id"),
				
			//	Components are defined by their attributes.  Those attributes usually involve
			//	the loading of some dependency. There are also default attributes contained
			//	in the component definitions (@see %data). This method handles the 
			//	determination and loading of dependencies.  
			//
			//	@param		{String}	attr		The name of the attribute, such as "model".
			//	@param		{String}	[stype]		The type of loading that Sexy will do, such
			//										as "css" or "json" or "js"...
			//	@param		{Object}	[SexyI]		The instance of Sexy for this component.
			//	@param		{Function}	[func]		The callback fired when the dependency has
			//										loaded.
			//	@param		{Boolean}	[nocache]	Default is to cache results, esp. useful
			//										for js, html, css, etc.  If you don't want
			//										caching, set to true.
			//
				cF	= function(attr, stype, SexyI, func, nocache) {

					//	If component has attribute #attr, return that. If not, check if there
					//	is a default attr for this component in the registry. If not, return
					//	false.
					//
					var a 	= componentNode.attr(attr)	|| 	(	compData[cn] && compData[cn][attr] 
																? compData[cn][attr] 
																: false	);	
						
					//	If no stype is sent, the request is for the attribute only.
					//
					if(!stype) {
						return a;
					}
						
					//	Return any cached version of the dependency, and if none, add
					// 	to the Sexy chain, with a callback that will create a cache entry.
					//	Note that item bindings -- when they are fetched json -- will 
					//	*not* be cached.
					//
					if(a) {

						SexyI[stype](a, function(data) {
							func(data);
						});
					}
				},
				
				//	The component name, key in #compData, which we cycle through below.
				//
				cn,
	
				//	Will hold template data, directive for this component, if any.
				//
				tData,
				tDir,
				
				//	Will hold the bound data, if any (given an #itemBinding attr).
				//
				itemBinding,
				//	This will hold the original #itemBinding directive.
				//
				bindingDirective,
				//	If a "new item" directive, will hold new item type
				//
				newItemType,
					
				//	Will hold a Sexy reference.
				//
				S,
					
				//	The method to fire following the loading of model and
				//	controller.
				//
				afterMC,
					
				//	The method which loads the model and controller, together.
				//
				loadMC;
				
			//////////////////////////////////////////////////////////////////////////////
			//																		  	//
			//	Cycling through all registered components to see if we can match this	//
			//	this component.															//
			//																			//
			//////////////////////////////////////////////////////////////////////////////
			for(cn in compData) {

				//	See model construction, below, for usage.  Each component can request the
				// 	loading of various data sources. These are use for template rendering
				//	and data binding (each model has a "data", "templateData", and 
				//	"templateDirective" attribute).
				//
				tData = tDir = itemBinding = false;

				if(componentNode.hasClass(cn)) {
				
					//	Component will now be loaded. Increment working count.
					//
					workingCount += 1;

					uni.fireOnce('componentBeforeLoad:' + cn, componentNode);
					
					//	If there is a request for an item binding, and we have received a numeric
					//	value (hopefully an item id) fetch the item, and set #itemBinding to 
					//	the json returned, which will be used below when creating the component
					//	model.
					//
					//	NOTE: the value of #itemBinding will be wrapped by #createSubjectFacade,
					//	in the model, below.
					//
					bindingDirective = itemBinding	= componentNode.attr("itemBinding");
					
					//////////////////////////////////////////////////////////////////////////////
					//																		  	//
					//	After a component has lazily loaded all of it dependencies, this is		//
					//	the method which initializes the component model, etc, and notifies 	//
					//	of the component's availability.										//
					//																			//
					//////////////////////////////////////////////////////////////////////////////
					afterMC = function() {
                        //	Each component has an extensible namespace attached, as 
                        //  a jQuery #data object, for controller and model objects. 
                        //  Importantly, the controller object is checked when events occur
                        //  within a component node, becoming the delegate for events
                        //  for whom it has a handler. So, if on a component:
                        //
                        //  myComponent.data("controller").click = function(ev) {...}
                        //
                        //  Handling of any valid click event within myComponent will be
                        //  delegated to this method.
                        //
                        //	@see	#delegateComponentEvents
                        //
                        componentNode
                            .data("controller", {})

							//	Component viewController contains a set of common view manipulation
							//	methods, such as #rebind.
							//	
							//	@see	#createViewController
							//	
                            .data("viewController", createViewController(componentNode))
                            
                            //	Importantly the model contains template data and item bindings.
                            //	Note: #garbage is a hack, for use when a plugin or other external
                            //	code creates dom elements outside of the modelled component.  The
                            //	elements contained are cleaned up when the viewController destroys
                            //	such components and this children.
                            //
                            .data("model", {
                            	componentName		: cn,
                                garbage				: [],
                                observers			: [],
                                poisoned			: false,
                                tainted				: [],
                                templateDirective	: tDir,
                                templateData		: tData,
                                itemBinding			: uni.spawn(itemBinding || {}).createSubjectFacade(),
                                bindingDirective	: bindingDirective,
                                //	Use this should you want to indicate some sort of state
                                //	change for the model, in case you want to warn about
                                //	destroying a component, etc, such as with a changed form.
                                //
                                taint				: function(v) {
                               		//	The pivot is #node. If the new taint object has 
                               		//	an identical node we overwrite the old one. Note that
                               		//	we accomplish this by seeding our accumulator with the
                               		//	sent taint object, and not accumulating any which match.
                               		//
                               		this.tainted = uni.reduce(function(a,e,i) {
                               			if(e.node.get(0) !== v.node.get(0)) {
                               				a.push(e);
                               			} 
                               			return a;
                               		}, [v], this.tainted).$;
                                },
                                isTainted	: function() {
                                	return this.tainted.length > 0;
                                },
                                poison		: function() {
                                	this.poisoned = true;
                                }
                            });

                        //  If this component has a #panel attribute, also give it
                        //  a reference to that panel's controller.  For components which
                        //  do not have a #panel attribute, #panel will
                        //  simply be undefined.
                        //
                        if(componentNode.attr("panel")) {
                            componentNode.data("panel", {
                                controller:     $("#ui-control-panel").data("controller"),
                                view:           $("#ui-control-panel")
                            })
                        }

                        //  Each component is delegated events occurring within its node.
                        //
						delegateComponentEvents(componentNode, cn);

						//	We need to track and store any observers set in the M/V 
						//	initialization. These are cleaned up in #viewController#destroy.
						//
						uni.observe("uni:observerSet", function(ob) {
							componentNode.data("model").observers.push(ob);
						}, {
							id:	cid
						});

						//  Listeners on this event are passed an object containing
						//  the various object references defined above.
						//
						uni.fireOnce("component:" + cn + ":loaded", {
							id				: componentNode.attr("id"),
							view        	: componentNode,
							model       	: componentNode.data("model"),
							controller  	: componentNode.data("controller"),
							viewController	: componentNode.data("viewController"),
							panel       	: componentNode.data("panel")
						});
						
						//	Stop listening for observers being set.
						//
						uni.unobserve("uni:observerSet", function() {
							return this.id === cid;
						});
						
						//	This is the endpoint of component initialization. Indicate that
						//	we have completed 1(one) component.
						//
						workingCount -= 1;

						// debug
						uni.notify("Component loaded: " + cn);
					};
					  
					//	The special  needs of these two segments being loaded in order, 
					//	executed together, and with a common callback, requires this 
					//	divergence from the way other files are lazily loaded.
					//
					loadMC = function() {
						var m = cF("model") 		|| path() + "null.js",
							c = cF("controller") 	|| path() + "null.js";


						S.bundle(m, c, function(combined) {							
							afterMC();
						});
					};
					
					//////////////////////////////////////////////////////////////////////////////
					//																		  	//
					//	Loading the optional component files, which means those files that  	//
					//	are not the model or controller										  	//
					//																			//
					//	Note that the Sexy.js loader fetches files via xhr, inserting the 		//
					//	txtContent of a response into a local <script> or <link> element.  The	//
					//	key change this produces is that CSS paths are now relative to the		//		
					//	location of the including file, and *not* the location of the CSS file.	//
					//																			//
					//////////////////////////////////////////////////////////////////////////////
					S = Sexy({ 
						cache: sop.cacheComponentFiles
					});
					
					cF("css", "css", S, uni.noop);
					
					cF("view", "html", S, function(data) {							
						if($.trim(data) !== "") {
							componentNode.append(data);
						}
					});

					cF("panel", "html", S, function(data) {	
						if($.trim(data) !== "") {
							$("#ui-control-panel").html(data);
						}
					});
					
					cF("templateData", "json", S, function(d) {
						tData = uni.is(Object, d) ? d : false;
					});
					
					cF("templateDirective", "json", S, function(d) {
						tDir = uni.is(Object, d) ? d : false;
					});
					
					
					//////////////////////////////////////////////////////////////////////////////
					//																		  	//
					//	Handling item binding. There are various methods of defining where this //
					//	this component will fetch the data object to bind to					//
					//																			//
					//////////////////////////////////////////////////////////////////////////////
					
					//	Numeric values must refer to an itemId. We assume it is so, and attempt
					//	to fetch the json for an item.  
					//
					if(uni.is(uni.Numeric, itemBinding)) {
						componentNode
							.attr(	"itemBinding", 
									uni.data.serviceUrl("item.read") + "/" + itemBinding 
									+ "?format=type&output=json");
						
						// Note that we request that the item data not be cached.
						//
						cF("itemBinding", "json", S, function(d) {
							itemBinding = d;
							loadMC();
						}, true);
						
					//	If a string, we are looking for the results of a data service.  There
					//	are some special cases:
					//	
					//	First character is a ":" -> an ajax service.
					//	First character is a "$" -> creating a new item.
					//
					} else if(uni.is(String, itemBinding)) {
						if(itemBinding.charAt(0) == ":") {
							var dtpt = uni.ns.datapoints[itemBinding.substring(1, itemBinding.length)];
							if(dtpt) {
								componentNode.attr("itemBinding", dtpt.get);
								cF("itemBinding", "json", S, function(d) {
									itemBinding = dtpt.processor(d);
									loadMC();
								});
							} else {
								uni.notify("Malformed item binding [ " + itemBinding + " ] on component: " + cn + ". Datapoint not found.", "error", "Component Declaration Error");
							}
						
						//	Creating a new item.  Expect to receive a string prefixed by "$", 
						//	followed by an item type, like "photo-asset" or "article".
						//
						} else if(itemBinding.charAt(0) == "$") {
							newItemType = itemBinding.substring(1,itemBinding.length);
							componentNode
								.attr(	"itemBinding", 
										uni.data.serviceUrl("item.create") 
											+ "&type=" + newItemType);
							
							// 	Start the process. Fire the item.create service, when it comes
							//	back set it as #itemBinding for this component, then fetch
							//	a new id and update the @id field of the new #itemBinding.  
							//
							//	Note that what we have done is load up the structure for a new
							//	item. Until that item json is actually saved, the item will
							//	not exist in the CMS.  Note as well that we don't cache the
							//	item (final arg `true`).
							//
							cF("itemBinding", "json", S, function(d) {
								itemBinding = d;

								//	Now get an id to attach to this item.
								//
								$.getJSON(uni.data.serviceUrl("item.getNewItemId"), function(nid) {
								
									if(!uni.is(uni.Numeric, nid)) {
										uni.notify("Unable to start new item form: endpoint > " + uni.data.serviceUrl("item.getNewItemId") + " failed to return numeric id.", "error", "Cannot Generate Id");
										return;
									} 
									
									console.log("DONE WITH ID");
									
									//	Update #itemBinding, bindingDirective with new id.
									//
									itemBinding.item["@id"] = nid;
									bindingDirective		= nid;
									
									loadMC();
								});
							}, true);
						
						//	Assuming that the binding is to a local data object.
						//
						} else {
							itemBinding = uni.data.get(itemBinding).$;
							loadMC();
						}
						
					//	No item binding is fine...
					//
					} else {
						itemBinding = false;
						loadMC();
					}

					break;
				}
			}
		},
		
		//	Finds all relevant controls and processes them.  There are the internal controls
		//	which are marked with classes of `.ui.controls.*`, and there are those form
		//	controls which need to be uniformly styled.  Internal controls are mostly jqueryui
		//	controls, and the remaining are handled by Uniform.js, maintaining the Aristo theme.
		//
		renderControls	= function() {

			//	Elements in this list will be passed for processing to Uniform.
			//
			var uE 	= "select, input:checkbox, input:radio, input:password, input:text, input:file, textarea",
				dF = sop.dateOptions,
				droppables,
				pageX,
				pageY,
				lastDraggedEl,
				helperElStyle;

			$(".ui.controls, " + uE).each(function(e, i) {
				var t 		= $(this),
					ctid	= t.attr("id"),
					sdr		= sop.draggableOptions,
					uiH;

				if(t.data('processed') != "Y") {
				
					//	Taint ui element, preventing repeat initialization.
					//
					t.data('processed', "Y");
					
					//	All controls must have an #id
					//
					if(!ctid) {
						t.attr('id', uni.uuid());
					}
					//	Ready any jquery ui controls. Note that these cascade -- you can
					//	assign multiple control behaviors. If I wanted a $button with a
					//	$tooltip, simply use "ui controls button tooltip".
					//
					if(t.is(".button")) {
						t.button();
					}
					
					else if(t.is(".buttonset")) {
						t.buttonset();
					} 
					
					else if(t.is(".datePicker")) {
						t.datepicker(dF);
					} 
					
					else if(t.is(".timePicker")) {
						t.timepicker(dF);
					} 
					
					else if(t.is(".dateTimePicker")) {
						t.datetimepicker(dF);
					}
					
					else if(t.is(".slider")) {

							console.log("slider");
							console.log(t.attr("min"));
							console.log(t.attr("max"));
							
						t.slider({
							animate		: true,
							min			: t.attr("min") || 0,
							max			: t.attr("max") || 0,
							orientation	: t.attr("orientation") || "horizontal"
						});
					}
					
					//	Adds autogrow behavior to a textarea.
					//
					else if(t.is(".autoTextarea")) {
						var min  	= t.height(),
							dummy	= $('<div id="autoTextarea-' + t.attr("id") + '"></div>').css({
								position	: 'absolute',
								top			: -5000,
								left		: -5000,
								width		: t.width(),
								fontSize	: t.css('fontSize'),
								fontFamily	: t.css('fontFamily'),
								lineHeight	: t.css('lineHeight'),
								resize		: 'none'
							}).appendTo(t.closest(".ui.components"));

						var update = function() {
							dummy.html(t.val().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;').replace(/\n/g, '<br/>'));
							t.css('height', Math.max(dummy.height() + 30, min));
						}

						t.change(update).keyup(update).keydown(update);
						update();
					}
					
					//	Some controls may be compounded, so we check for those individually.
					//
					if(t.is(".tip")) {
						t.tooltip({
						 
						   // tweak the position
						   offset: [10, 2],
						 
						   // use the "slide" effect
						   effect: 'slide'
						 
						// add dynamic plugin with optional configuration for bottom edge
						})	
						.dynamic({ 
							bottom: { 
								direction: 'down'
							} 
						});
					} 
										
					//	We implement our own drag/drop functionality.
					//
					if(t.is(".draggable")) {
						var handle = t.find(t.attr("useHandle"));
						sdr.handle = handle.length ? handle.get(0) : false;

						//	On drag start we want 
						sdr.start 	= function(ev, ui) {
						
							lastDraggedEl	= $(this);
								
							ui.helper
								.width(lastDraggedEl.width())
								.height(lastDraggedEl.height())
								.addClass("dragHelper")
							
							helperElStyle = ui.helper.get(0).style;
						};

						sdr.drag	= function(ev, ui) {
							pageX = ev.pageX;
							pageY = ev.pageY;
							
							var helper = ui.helper;
							
							helperElStyle.visibility = "hidden";
							var elOver = document.elementFromPoint(pageX, pageY);
							helperElStyle.visibility = "visible";
								
							var dropEl	= $(elOver).closest("*[acceptsDrop]");
								
							if(dropEl && t.is(dropEl.attr("acceptsDrop"))) {
								helper.addClass("dragHelperCanDrop");
							} else {
								helper.removeClass("dragHelperCanDrop");
							}
						};
						
						//	Augment drag options with the method which catches the moment
						//	a drop happens and performs the validation and execution
						//	of the drop action.
						//
						sdr.stop	= function(ev, ui) {
							var dropEl 	= $(document.elementFromPoint(ev.pageX, ev.pageY)),
								ctrl	= dropEl.data("controller");
								
							if(!ctrl) {
								dropEl 	= dropEl.closest("*[acceptsDrop]");
								ctrl	= dropEl.data("controller");
							}
								
							if(ctrl && ctrl.onDrop) {
								if(t.is(dropEl.attr("acceptsDrop"))) {
									ctrl.onDrop.call(ev, t.clone());
								}
							}
						};
						
						//	Final instantiation of the jqueryUI draggable.
						//
						t.draggable(sdr);
					}

					// 	Aristo uniformity via Uniform.js.
					//
					if(t.is("select, " + uE)) {
						t.uniform({
							//filenameClass: "uniform-filename-class",
							//fileClass:		"uniform-file-class"
						});
					}
				}
			});
		},
				
		//	Find all components and start their initialization process. 
		//
		//	@param		{Mixed}		startSel		A selector, domNode, or other valid 
		//											jQuery $() argument, setting the start
		//											node for component searches.
		//
		bind	= function(startSel) {
		
		    //  Do not execute if a pass is in progress.
		    //
		    if(workingCount > 0) {
		        return;
		    }
		    
		    //  All <div> elements with a class attribute containing the string "ui components".
		    //
		    var compSel		= 'div.ui.components';
		   		cSelect 	= startSel ? $(startSel).find(compSel) : $(compSel);
		
			cSelect.each(function() {
				var T 				= $(this),
					Tid 			= T.attr("id");

				//  All ui components etc must have an #id set.  If not, we set 
				//	#id to a random value.
				//
				if(!Tid) {
					T.attr('id', uni.uuid());
				}

				//	Ignore if this component has been tainted (already parsed).  Note that
				//	we are in an #each block, so we are performing the equivalent of
				//	a "continue"...
				//
				if(T.data('processed') == "Y") {
					return;
				}

				//	Taint ui element, preventing repeat initialization.
				//
				T.data('processed', "Y");

				//	Start the component dependency loading.
				//
				componentLoader(T);
			});
			
			//	Components may load other components.  As such, an individual pass may introduce
			//	other components which, being part of a view, will not get parsed on the current
			//	pass.  So we create a test, which will check the workingCount, and when it hits
			//	zero, we re-call #bind.  When a pass introduces no further components, 
			//	workingCount will be zero, and the test will no longer be needed.  This count is
			//	maintained by #componentLoader, supra.
			//
			if(workingCount > 0) {

				uni
					.test(function() {	
						if(workingCount === 0) {
							//	There are no more components loading in this pass.
							//	As other components may have been introduced, re-pass.
							//
							uni.notify('*****PASS FINISHED*****');
							bind();
							return false;
						}
						return true;
					});
			
			//	At this point we have finished with all ui component loading.  Complete any
			//	remaining initialization work, which is mainly firing global styling commands,
			//	such as for jqueryUI and uniform.js, then announce that the ui is initialized.
			//
			} else {
			
				renderControls();
				handleResize();
				uni.fire("components:bind:complete", cSelect);
			}
		},
		
		//	Whatever is necessary to do when the interface is resized. Mainly this involves
		//	updating the size of #main-layout.  Note that this method is called immediately
		//	following #bind, and that is has been bound to the jQuery #resize event.
		//
		handleResize = function() {
			
			//	All resize event will make modifications to the #main-layout container,
			//	as it must have a properly sized box, with scrollbars, between the header
			//	and the footer.  If there is *not* both a header and footer, we do not
			//	do the resize.
			//
			var lh	= $("#layout-header"),
				lf	= $("#layout-footer");
			
			if(lh.length && lf.length) {
				$("#main-layout").height(lf.offset().top - lh.height());
			}
			
			//	Now fire a subscribable event.
			//
			uni.fire("ui:resize");
		};

	
	//	Add some jquery methods.  Need to find a better place for this.
	//
	//	#reverse will reverse an array (usually the $ collection).
	//  All Ajax calls will set the necessary security headers.  Note that the values
	//	are dynamic, in that should the environment change the functionality will maintain.
	//
	$.fn.reverse = [].reverse;
	
	//	Note that there is now a handler for all resize events.  This handler
	//	will notify observers when a resize occurs.  
	//
	//	@see	#handleResize
	//
	$(window).resize(handleResize);
	
	//	Set up some default handlers for xhr requests. Note that these can be overridden when
	//	building your own ajax requests.
	//
	$.ajaxSetup({ 
		"beforeSend"	: function(xhr) { 
			xhr.setRequestHeader("identityPointId", uni.data.getProperty("identityPointId")); 
			xhr.setRequestHeader("fingerprint", uni.data.getProperty("fingerprint"));
		},
		"error" 		: function(xhr, strError) {
			// 	http://stackoverflow.com/questions/1023867/jquery-xmlhttprequest-error
			//
			if(xhr.readyState === 0 || xhr.status === 0) {
				return;
			}
			
			uni.fire("ajax:error", arguments);
		}
	});
	
	//	The kit.
	//
	uni.addKit("components", {
	
		setStartConditions:	function(conditions) {
			uni.test(function() {
				if(conditions()) {
					bind();
					return false;
				}
				return true;
			});
		},
	
		bind:	function(tg) {
			bind();
		},
		
		renderControls: function() {
			renderControls();
		}
	});

    			uni
			    .components
			        .bind()
				.data
				.observeOnce("components:bind:complete", function() {
					//	The <body> (the ui) is hidden until ready. When ready, fade it in.
					//	@see	UI/style/css/global.css#body
					//
					$('body').fadeTo(1000, 1);
				})
	
});	
