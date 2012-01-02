(function(window, document, undefined) {

//	onDOMReady
//	Copyright (c) 2009 Ryan Morr (ryanmorr.com)
//	Licensed under the MIT license.
//
//	@fires		!domReady
//

var ready, 
	timer,
	onStateChange = function(e) {
		//Mozilla & Opera
		if(e && e.type == "DOMContentLoaded") {
			fireDOMReady();
		//Legacy	
		} else if(e && e.type == "load") {
			fireDOMReady();
		//Safari & IE
		} else if(document.readyState) {
			if((/loaded|complete/).test(document.readyState)) {
				fireDOMReady();
			//IE, courtesy of Diego Perini (http://javascript.nwbox.com/IEContentLoaded/)
			} else if (!!document.documentElement.doScroll) {
				try {
					ready || document.documentElement.doScroll('left');
				} catch(e) {
					return;
				}
				fireDOMReady();
			}
		}
	},
		
	fireDOMReady = function() { 
		if(!ready) {
			ready = true;

			// Fire `domReady` event
			//
			uni.fire('domReady');

			//Clean up after the DOM is ready
			if(document.removeEventListener) {
				document.removeEventListener("DOMContentLoaded", onStateChange, false);
			}
			document.onreadystatechange = null;
			window.onload = null;
			clearInterval(timer);
			timer = null;
		}
	};

//	Initialize the domReady code
//

//	Mozilla & Opera
//
if(document.addEventListener)
	document.addEventListener("DOMContentLoaded", onStateChange, false);
//	IE
//
document.onreadystatechange = onStateChange;
//	Safari & IE
//
timer = setInterval(onStateChange, 5);
//	Legacy
//
window.onload = onStateChange;

})(this, document); // end general enclosure