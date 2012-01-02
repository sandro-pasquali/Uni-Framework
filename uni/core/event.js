/*
altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode layerX layerY metaKey newValue offsetX offsetY pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target toElement view wheelDelta which
*/


(function(window, document, undefined) {

var	D			= document,

	//	Event data is added here, to be passed to handler.
	//
	//	@see		#monitor
	//
	eD        	= {},
    
    //	Where the handlers are stored.
    //
	H	= {},

	//	The list of observable events
	//
	eL  	=  [
		'abort',
		'change',
		'click',
		'dblclick',
		'error',
		'mousedown',
		'mousemove',
		'mouseout',
		'mouseover',
		'mouseup',
		'mouseenter',
		'mouseleave',
		'keydown',
		'keyup',
		'keypress',
		'focus',
		'blur',
		'focusin',
		'focusout',
		'load',
		'unload',
		'submit',
		'reset',
		'resize',
		'select',
		'scroll'
	],

	//	This is the general function which is called on every event.
	//
	monitor = function(e) {       
        var we 	= window.event,
        	ev 	= we || e,
            a,
            sel;

        eD.cTarg    = this;

        //	We are only watching for events at the document level.
        //
        if(eD.cTarg == D) {

			eD.target       = we  
							? ev.srcElement 
							: ev.target;
								  
			eD.pageX      	= we 
							? ev.clientX + D.documentElement.scrollLeft 
							: ev.pageX;
								  
			eD.pageY   		= we 
							? ev.clientY + D.documentElement.scrollTop 
							: ev.pageY;
	
			eD.type    		= ev.type;
			eD.timestamp	= new Date().getTime();
			
			if(eD.target.getAttribute) { 
				eD.elId             = eD.target.getAttribute('id');
				eD.elClass          = eD.target.getAttribute('class');
				eD.elTag            = eD.target.nodeName || false;
			}
  
            a   = H[eD.type];   
      		
      		//	If there are handlers for this event type, check if the observing 
      		//	selectors match the current element, and call handlers on those which do.
      		//
            if(a) {
                for(sel in a) {
                    if(uni.match(sel, eD.target)) {
                       	a[sel][0].call(a[sel][2], eD, a[sel][1], a[sel][3]);
                    }  
                }
            }
        } 
    },
    
    //	See documentation for kit.
    //
    add = function(e, s, fn, d) {      
        var o = e.split(' '),
        	w;

       	for(w=0; w < o.length; w++) {
       		//	This is the data model for each registered event.
       		//	Handlers[eventname][selector] = [handler, passthrudata, calling Object]
       		//	In #monitor events are matched against this list of information, and if
       		//	matched, handler function is called in the scope of Object and is passed
       		//	arguments (elementdata [see #eD], passthrudata, trigger data)
       		//
       		//	@see		#monitor
       		//	@see		#trigger
       		//
            H[o[w]][s] 	= [fn, d || null, this, null];
        }  
    },
      
    //	See documentation for kit.
    //
    remove = function(e, s) {
        var o = e.split(' '),
        	w;

        for(w=0; w < o.length; w++) {
            delete H[o[w]][s];
        }  
    },
    
    //	#trigger
    //
    //	Creates an event on the Document, which will fire handlers as it would
    //	if you had clicked the mouse, for example.
    //
    //	@param		{String}		ev		The event name, such as "click".
    //	@param		{String}		s		The selector for this event.
    //	@param		{Mixed}			[d]		Some data to pass through to the handler.
    //
    trigger = function(ev, s, d) {
    	
    	var el,
    		evt;
    	
   		el	= this.findFirst(s).$
    	
    	if(el) {
			//	If the trigger has asked to pass data along we are going to
			//	add this data to the event object array, as data may have
			//	already been asked to be passed through by #add
			//
			//	@see		#add
			//	@see		#monitor
			//
			if(d) {
				H[ev][s][3] = d;
			}
				
			if(D.createEvent) {
				evt = D.createEvent("HTMLEvents")
				evt.initEvent(ev, true, true);
				el.dispatchEvent(evt);
			} else {
				evt = D.createEventObject();
				el.fireEvent('on' + ev, evt);
			}
		}
    },
      
    //	#stopPropagation	
    //
    //	Stops event propagation.  To prevent default behaviour, use #preventDefault.
    //
    //	@param		{Object}		e		An Event object.
    //
    stopPropagation = function(e) {
        e.cancelBubble = true;
        if(e.stopPropagation) {
            e.stopPropagation();
        }
    },
      
    //	#preventDefault
    //
    //	Stops the default behavior on the element.  If you want to simply stop the
    //	event, use #stopPropagation.
    //
    //	@param		{Object}		e		An Event object.
    //
    preventDefault = function(e) {
        e.returnValue = false;
        if(e.preventDefault) {
            e.preventDefault();
        }
    },

	i;
	
	//	Attach all the observable handlers, initializing handler groups.
	//	Note that we are watching only at the document level.
	//
    for(i=0; i < eL.length; i++) {
    
        H[eL[i]] = {};

        if(D.addEventListener) {
            D.addEventListener(eL[i], monitor, false);
        } else {              
        	D.attachEvent('on' + eL[i], monitor);
        } 
    }


//	#event	
//
//	Add an event observer.
//
//	@param		{String}		e		The event name ('onclick', 'mousemove'...).
//	@param		{String}		s		A css selector.
//	@param		{Function}		fn		The handler to fire on this event.
//	@param		{Mixed}			[d]		Any data to pass through to the handler.
//	@return								Sends back the result of a #search w/ selector.
//										After adding an event, you have the elements
//										affected as the Subject.
//
uni.hoist('event', function(e, s, fn, d) {
	if(fn === undefined) {
		remove(e, s);
	}
	
	add(e, s, fn, d);
});


uni.hoist('trigger', trigger);
		



	


})(this, document)
