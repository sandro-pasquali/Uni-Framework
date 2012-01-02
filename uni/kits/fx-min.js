(function(c,a,f){var e=function(i,h,j,k,l,g){this.el=b.get(i);this.attributes=h;this.duration=j||0.7;this.transition=(!!k&&k in e.transitions)?k:"easeInOut";this.callback=l||function(){};this.ctx=g||c;this.units={};this.frame={};this.endAttr={};this.startAttr={}};e.transitions={linear:function(h,g,j,i){return j*h/i+g},easeIn:function(h,g,j,i){return -j*Math.cos(h/i*(Math.PI/2))+j+g},easeOut:function(h,g,j,i){return j*Math.sin(h/i*(Math.PI/2))+g},easeInOut:function(h,g,j,i){return -j/2*(Math.cos(Math.PI*h/i)-1)+g}};e.prototype={start:function(){var g=this;this.getAttributes();this.duration=this.duration*1000;this.time=new Date().getTime();this.animating=true;uni.until(function(){var h=new Date().getTime();if(h<(g.time+g.duration)){g.elapsed=h-g.time;g.setCurrentFrame()}else{g.frame=g.endAttr;g.complete();return false}g.setAttributes();return true})},ease:function(h,g){return e.transitions[this.transition](this.elapsed,h,g-h,this.duration)},complete:function(){this.animating=false;this.callback.call(this.ctx)},setCurrentFrame:function(){for(attr in this.startAttr){if(uni.is(Array,this.startAttr[attr])){this.frame[attr]=[];for(var g=0;g<this.startAttr[attr].length;g++){this.frame[attr][g]=this.ease(this.startAttr[attr][g],this.endAttr[attr][g])}}else{this.frame[attr]=this.ease(this.startAttr[attr],this.endAttr[attr])}}},getAttributes:function(){for(var g in this.attributes){switch(g){case"color":case"borderColor":case"border-color":case"backgroundColor":case"background-color":this.startAttr[g]=d(this.attributes[g].from||b.getStyle(this.el,g));this.endAttr[g]=d(this.attributes[g].to);break;case"scrollTop":case"scrollLeft":var j=(this.el==a.body)?(a.documentElement||a.body):this.el;this.startAttr[g]=this.attributes[g].from||j[g];this.endAttr[g]=this.attributes[g].to;break;default:var k;var h=this.attributes[g].to;var i=this.attributes[g].units||"px";if(!!this.attributes[g].from){k=this.attributes[g].from}else{k=parseFloat(b.getStyle(this.el,g))||0;if(i!="px"&&a.defaultView){b.setStyle(this.el,g,(h||1)+i);k=((h||1)/parseFloat(b.getStyle(this.el,g)))*k;b.setStyle(this.el,g,k+i)}}this.units[g]=i;this.endAttr[g]=h;this.startAttr[g]=k;break}}},setAttributes:function(){for(var g in this.frame){switch(g){case"opacity":b.setStyle(this.el,g,this.frame[g]);break;case"scrollLeft":case"scrollTop":var i=(this.el==a.body)?(a.documentElement||a.body):this.el;i[g]=this.frame[g];break;case"color":case"borderColor":case"border-color":case"backgroundColor":case"background-color":var h="rgb("+Math.floor(this.frame[g][0])+","+Math.floor(this.frame[g][1])+","+Math.floor(this.frame[g][2])+")";b.setStyle(this.el,g,h);break;default:b.setStyle(this.el,g,this.frame[g]+this.units[g]);break}}}};var b={get:function(g){return(typeof g=="string")?a.getElementById(g):g},getStyle:function(i,j){j=uni.camelize(j);var g=a.defaultView;if(g&&g.getComputedStyle){return g.getComputedStyle(i,"")[j]||null}else{if(j=="opacity"){var h=i.filters("alpha").opacity;return isNaN(h)?1:(h?h/100:0)}return i.currentStyle[j]||null}},setStyle:function(g,i,h){if(i=="opacity"){g.style.filter="alpha(opacity="+h*100+")";g.style.opacity=h}else{i=uni.camelize(i);g.style[i]=h}}};var d=(function(){var i=(/^#?(\w{2})(\w{2})(\w{2})$/);var g=(/^#?(\w{1})(\w{1})(\w{1})$/);var h=(/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/);return function(k){var j=k.match(i);if(j&&j.length==4){return[parseInt(j[1],16),parseInt(j[2],16),parseInt(j[3],16)]}j=k.match(h);if(j&&j.length==4){return[parseInt(j[1],10),parseInt(j[2],10),parseInt(j[3],10)]}j=k.match(g);if(j&&j.length==4){return[parseInt(j[1]+j[1],16),parseInt(j[2]+j[2],16),parseInt(j[3]+j[3],16)]}}})();e.transitions.quadIn=function(h,g,j,i){return j*(h/=i)*h+g};e.transitions.quadOut=function(h,g,j,i){return -j*(h/=i)*(h-2)+g};e.transitions.quadInOut=function(h,g,j,i){if((h/=i/2)<1){return j/2*h*h+g}return -j/2*((--h)*(h-2)-1)+g};e.transitions.cubicIn=function(h,g,j,i){return j*(h/=i)*h*h+g};e.transitions.cubicOut=function(h,g,j,i){return j*((h=h/i-1)*h*h+1)+g};e.transitions.cubicInOut=function(h,g,j,i){if((h/=i/2)<1){return j/2*h*h*h+g}return j/2*((h-=2)*h*h+2)+g};e.transitions.quartIn=function(h,g,j,i){return j*(h/=i)*h*h*h+g};e.transitions.quartOut=function(h,g,j,i){return -j*((h=h/i-1)*h*h*h-1)+g};e.transitions.quartInOut=function(h,g,j,i){if((h/=i/2)<1){return j/2*h*h*h*h+g}return -j/2*((h-=2)*h*h*h-2)+g};e.transitions.quintIn=function(h,g,j,i){return j*(h/=i)*h*h*h*h+g};e.transitions.quintOut=function(h,g,j,i){return j*((h=h/i-1)*h*h*h*h+1)+g};e.transitions.quintInOut=function(h,g,j,i){if((h/=i/2)<1){return j/2*h*h*h*h*h+g}return j/2*((h-=2)*h*h*h*h+2)+g};e.transitions.expoIn=function(h,g,j,i){return(h==0)?g:j*Math.pow(2,10*(h/i-1))+g-j*0.001};e.transitions.expoOut=function(h,g,j,i){return(h==i)?g+j:j*1.001*(-Math.pow(2,-10*h/i)+1)+g};e.transitions.expoInOut=function(h,g,j,i){if(h==0){return g}if(h==i){return g+j}if((h/=i/2)<1){return j/2*Math.pow(2,10*(h-1))+g-j*0.0005}return j/2*1.0005*(-Math.pow(2,-10*--h)+2)+g};e.transitions.circIn=function(h,g,j,i){return -j*(Math.sqrt(1-(h/=i)*h)-1)+g};e.transitions.circOut=function(h,g,j,i){return j*Math.sqrt(1-(h=h/i-1)*h)+g};e.transitions.circInOut=function(h,g,j,i){if((h/=i/2)<1){return -j/2*(Math.sqrt(1-h*h)-1)+g}return j/2*(Math.sqrt(1-(h-=2)*h)+1)+g};e.transitions.backIn=function(h,g,k,j,i){i=i||1.70158;return k*(h/=j)*h*((i+1)*h-i)+g};e.transitions.backOut=function(h,g,k,j,i){i=i||1.70158;return k*((h=h/j-1)*h*((i+1)*h+i)+1)+g};e.transitions.backBoth=function(h,g,k,j,i){i=i||1.70158;if((h/=j/2)<1){return k/2*(h*h*(((i*=(1.525))+1)*h-i))+g}return k/2*((h-=2)*h*(((i*=(1.525))+1)*h+i)+2)+g};e.transitions.elasticIn=function(i,g,m,l,h,k){if(i==0){return g}if((i/=l)==1){return g+m}if(!k){k=l*0.3}if(!h||h<Math.abs(m)){h=m;var j=k/4}else{var j=k/(2*Math.PI)*Math.asin(m/h)}return -(h*Math.pow(2,10*(i-=1))*Math.sin((i*l-j)*(2*Math.PI)/k))+g};e.transitions.elasticOut=function(i,g,m,l,h,k){if(i==0){return g}if((i/=l)==1){return g+m}if(!k){k=l*0.3}if(!h||h<Math.abs(m)){h=m;var j=k/4}else{var j=k/(2*Math.PI)*Math.asin(m/h)}return h*Math.pow(2,-10*i)*Math.sin((i*l-j)*(2*Math.PI)/k)+m+g};e.transitions.elasticBoth=function(i,g,m,l,h,k){if(i==0){return g}if((i/=l/2)==2){return g+m}if(!k){k=l*(0.3*1.5)}if(!h||h<Math.abs(m)){h=m;var j=k/4}else{var j=k/(2*Math.PI)*Math.asin(m/h)}if(i<1){return -0.5*(h*Math.pow(2,10*(i-=1))*Math.sin((i*l-j)*(2*Math.PI)/k))+g}return h*Math.pow(2,-10*(i-=1))*Math.sin((i*l-j)*(2*Math.PI)/k)*0.5+m+g};e.transitions.backIn=function(h,g,k,j,i){if(typeof i=="undefined"){i=1.70158}return k*(h/=j)*h*((i+1)*h-i)+g};e.transitions.backOut=function(h,g,k,j,i){if(typeof i=="undefined"){i=1.70158}return k*((h=h/j-1)*h*((i+1)*h+i)+1)+g};e.transitions.backBoth=function(h,g,k,j,i){if(typeof i=="undefined"){i=1.70158}if((h/=j/2)<1){return k/2*(h*h*(((i*=(1.525))+1)*h-i))+g}return k/2*((h-=2)*h*(((i*=(1.525))+1)*h+i)+2)+g};e.transitions.bounceIn=function(h,g,j,i){return j-e.transitions.bounceOut(i-h,0,j,i)+g};e.transitions.bounceOut=function(h,g,j,i){if((h/=i)<(1/2.75)){return j*(7.5625*h*h)+g}else{if(h<(2/2.75)){return j*(7.5625*(h-=(1.5/2.75))*h+0.75)+g}else{if(h<(2.5/2.75)){return j*(7.5625*(h-=(2.25/2.75))*h+0.9375)+g}}}return j*(7.5625*(h-=(2.625/2.75))*h+0.984375)+g};e.transitions.bounceBoth=function(h,g,j,i){if(h<i/2){return e.transitions.bounceIn(h*2,0,j,i)*0.5+g}return e.transitions.bounceOut(h*2-i,0,j,i)*0.5+j*0.5+g};uni.addKit("fx",{animate:function(j,h,i,k,g,l){new e(j,h,i,k,g,l).start()},fadeIn:function(){},fadeOut:function(){},fadeTo:function(){},hide:function(){},show:function(){}})})(this,document);