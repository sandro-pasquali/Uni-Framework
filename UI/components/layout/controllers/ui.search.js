uni.observe("component:layout:loaded", function(comp) {

	//	This is a vgrid component, within a slidePanel.
	//
    var resultsPanel    = comp.view.find("#search-results-panel .content"),

        searchData      = {
            dates   	: [],
            text    	: "",
            //itemType 	: ""
            itemType 	: "photo-asset" // photo-asset only ... remove w/ options component for all.
        };
	
	//	Listen for requests to update the search results.
	//
	uni.observe("searchResults:update", function(d) {
		comp.controller.updateResults();
	});
	
	//	Listen for item deletions, and remove from results list if any.
	//
	uni.observe("item:deleted", function(id) {
		//	Update results, should this item exist.
		//
		if($("#sr-item-" + id).length > 0) {
			uni.fire("searchResults:update", id);
		}
	});
	
    comp.controller.updateResults = function() {

        var items   = [],
        	startDate	= searchData.dates[0] 	|| false,
        	endDate		= searchData.dates[1] 	|| false,
        	query	 	= searchData.text 		|| false,
        	listStart	= 0,
        	listSize	= uni.data.get("system:options").$.searchMaxResults,
        	call 		= uni.data.serviceUrl("item.search") + "?format=type&output=json&itemtype=" + searchData.itemType + "&listStart=" + listStart + "&listSize=" + listSize;
        	
        	call 	+= startDate ? "&startDate=" + startDate 	: "";
        	call	+= endDate ? "&endDate=" + endDate 			: "";
        	call	+= query ? "&query=" + query : "";

		if(!searchData.text && !searchData.dates.length) {
			return;
		}


		uni.notify("searching:");
		uni.notify(searchData);

        $.getJSON(call, function(data) {
            
           	var vgrid = resultsPanel.data("controller");
            
           	//	Clear the result panel, even if only to report no results.
           	//            	
           	resultsPanel.empty();
        	vgrid.refresh();
           		
           	//	Ensure that we have some results.
           	//
           	if(uni.is(Object, data) && data.list && data.list.item) {
				//	Store the last result, which may be useful for maintaining sessions.
				//
				comp.model.lastSearchResult = data;
					
				if(!uni.is(Array, data.list.item)) {
					data.list.item = [data.list.item];
				}
						
				//	Go through each item (ie. each result), determine the raw image
				//	(thumb) path and id, and create the results.
				//
				uni.sub(data.list.item).forEach(function(e, i) {
					var ds 			= uni.spawn(e).createSubjectFacade(),
						itemId		= ds.get("@id"),
						name		= ds.get("@name"),
						created		= ds.get("@createdOn"),
						type		= ds.get("itemType.@key"),
						mastImPath	= ds.get(ds.findPath("@key", "raw-image", "field")).$,
						cutImPath	= ds.get(ds.findPath("@key", "image-location", "field")).$,
						headLn		= ds.get(ds.findPath("@key", "headline", "field")).$,
						caption		= ds.get(ds.findPath("@key", "caption", "field")).$,
						desc		= ds.get(ds.findPath("@key", "description", "field")).$,
						callSrv		= uni.data.serviceUrl("photoAsset.view") + "?file-path=",
						imSrcCall	= false,
						fullImCall	= false,
						out			= [];
	
					//	We have the call to fetch the full image, but we actually want the
					//	path to the image thumb.  Just a simple replace.
					//
					if(uni.is(String, mastImPath)) {
						fullImCall = callSrv + mastImPath;
						imSrcCall = fullImCall.replace(itemId, itemId + "/thumbs");
					} else if(uni.is(String, cutImPath)) {
						fullImCall = imSrcCall = callSrv + cutImPath;
					}
							
		
					//	Each result element is drawn here.
					//
					out.push('<div id="sr-item-' + itemId + '" itemId="' + itemId + '" itemType="' + type + '" class="ui controls draggable sr-item rounded-corners-3" fullViewPath="' + fullImCall + '">');
							
					//	This would only apply to assets with an image, like a master, or 
					//	a cut, etc.
					//
					if(imSrcCall) {
						out.push('<div class="ui components thumbnail row" src="' + imSrcCall + '" fullView="' + fullImCall + '"><img id="sr-image-' + itemId + '" />' + type + '</div>');
					} else {
							
						//	If not an image, use an icon.
						//
						switch(type) {						
							default:
								out.push('<div class="sr-icon sr-icon-master-cut"></div>' + type);
							break;
						}
					}
							
					out.push('<div class="sr-info"><div class="sr-info-date">' + created + '</div>');
					
					//	Various additional fields, if available.
					//
					if(uni.is(String, caption)) {
						out.push('<div class="sr-info-caption">' + caption + '</div>');
					} else if(uni.is(String, headLn)) {
						out.push('<div class="sr-info-headline">' + headLn + '</div>');
					} else if(uni.is(String, desc)) {
						out.push('<div class="sr-info-description">' + desc + '</div>');
					}
							
					out.push('</div></div>');
							
					vgrid.add(out.join(""));
				});    
				
				uni.components.bind();
				
       		} else {
				//	No results.
				//
				vgrid.add('<div class="no-search-results">No results found using request:<br />\
					Text: ' + searchData.text + '<br />\
					Start Date: ' + (startDate || 'None') + '<br \>\
					End Date: ' + (endDate || 'None') + '</div>');
			}
    	});
    };
    
    comp.controller.change = function(ev, t, c) {

        var v,
            dates   = [],
            text    = "",
            tid 	= t.attr("id"),
            opVal;
        
        //	The autocomplete component uses a <select> element to store its values,
        //	giving each a class of "selected".  When there is a click on the search
        //	layout, check if this is the search component input, and if it is parse
        //	the values contained in this <select>
        if(tid === "search-component-input") {
            t
                .children(".selected")
                .each(function(e) {
                    v = $(this).get(0).value;
        
                    if(v.charAt(0) == ":") {
                        dates.push(v.split(":")[1]);
                    } else {
                        text += v + " ";
                    }
                })
        
                dates = uni.sub(dates).unique().$;
                
                //	Sort the dates ASC.
                //
                searchData.dates    = dates.sort(function(a, b) { 
                	return a > b; 
                });

                searchData.text     = text;
            
            //	If the results panel is open, insert results.
            //	If not, open it, and redo.
            //
            if(resultsPanel.is(":visible")) {
            	comp.controller.updateResults();
            } else {
            	uni
            		.fire("slidePanel:open", "#search-results-panel")
            		
            		//	Wait for the next open panel (which will be the one
            		//	we just opened), and re-request the result.
            		//
            		.observeOnce("slidePanel:opened",  function(d) {
            			comp.controller.change(ev, t, c);
            		});
            }
        
        //	This is the "options" select control for search types. Get the latest
        //	value and update item type data for the search, then refresh the search results.
        //
        } else if(tid === "search-types-control") {
        	opVal	= t.find("option:selected").eq(0).val();
        	
        	//	fix this... a bug sending this value, want it to be an empty string ("").
        	//	Something in the option definition, maybe in the template...
        	//
      		searchData.itemType = opVal == "All Types" ? "" : opVal;
      		
      		comp.controller.updateResults();
        } 
    }
    
});