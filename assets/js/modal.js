/**
 * ModalWindows v1.5.0-beta ( https://github.com/MattRh/modal_wins )
 * MalSerAl, 2015-2016
 * 
 * modal.show("modal_id") - openes modal with id=modal_id in new box
 * modal.show("modal_id", true) - switches to modal with id=modal_id in current box
 * modal.hide() or "ESC" - hides opened modal
 */

var modal = {
	config: {
		isInited: false,
		// CSS rules
		modalBox: '.modal-box', // Container for all modal stuff
		modalsClass: '.modal', // Class assigned to each modal window box
		modalsCont: '.modal-wrapper', // Place, where modals will be put after collecting
		// Animation classes
		show: { // Showing classes
			stat: 'opened', // static
			dyn: 'show', // dynamic
			swch: 'switch', // switch to
		},
		hide: { // Hiding classes
			stat: 'closed', // static
			dyn: 'hide' // dynamic
		},
		// Class added when modals has been collected
		loadCls: 'loaded',
		// Key code. Null to disable
		hideByKey: 27,
		// URL hash prefix for modal anchor. Null to disable
		// Example: site.com/url.html#someModal will open modal with id "someModal" after init of the script.
		urlPrefix: ''
	},
	tStamps: [],
	init: function() {
		if(modal.isInited)
			return false;
		modal.isInited = true;
		
		// TODO: делать кроссплатформенные анимации (key-frames) и определять разные ивенты окончания анимации
		modal.__setAnimatonEndEvent();
		
		modal.modalBoxes = [];
		modal.modalBoxes[1] = document.querySelector(modal.config.modalBox);
		modal.__addClass(modal.modalBoxes[1], modal.config.hide.stat);
		modal.__addClass(modal.modalBoxes[1], modal.config.loadCls);
		modal.boxTemplate = modal.modalBoxes[1].cloneNode(true);
		
		modal.modalRegExp = new RegExp('(\\s|^)' + modal.config.modalsClass.substr(1) + '(\\s|$)');
		modal.bodyStyle = document.body.style;
		modal.openedModal = [];
		modal.nestingLVL = 0;
		
		modal.__modalsCollect();
		modal.__scrollSet();
		modal.__anchorOpen();
	},
	show: function(id, s) { // element id, switch
		//console.time('show_time');
		var mainStyle, bodyStyle, el, lvl;
		modal.init();
		
		el = document.getElementById(id);
		
		if(el === null || !el.className.match(modal.modalRegExp) || !!~modal.openedModal.indexOf(el))
			return false;
		
		if(s) {
			modal.__switchTo(el);
			return false;
		}
		
		lvl = ++modal.nestingLVL;
		
		if(modal.nestingLVL > 1) {
			modal.modalBoxes[lvl] = modal.boxTemplate.cloneNode(true);
			modal.__insertAfter(modal.modalBoxes[lvl], modal.modalBoxes[lvl - 1]);
			
			modal.modalBoxes[lvl].querySelector(modal.config.modalsCont).appendChild(el);
		}
		
		bodyStyle = modal.bodyStyle;
		bodyStyle.overflowY = 'hidden';
		bodyStyle.paddingRight = modal.scrollBar;

		modal.__animate(modal.modalBoxes[lvl], 'show');
		modal.__modalShow(el);
		
		if(modal.config.hideByKey !== null)
			window.addEventListener('keyup', modal.__keyPress);
		
		if(typeof(modal.onopen) == 'function')
			modal.onopen(el);
		//console.timeEnd('show_time');
	},
	hide: function() {
		//console.time('########hide_time');
		
		var lvl = modal.nestingLVL;
		if(lvl == 0)
			return false;
		
		var el = modal.modalBoxes[lvl];
		modal.__animate(modal.modalBoxes[lvl], 'hide', function() {
			if(lvl > 1)
				el.parentNode.removeChild(el);
			else
				modal.bodyStyle.overflowY = modal.bodyStyle.paddingRight = null;
		});
		
		modal.__modalHide();
		
		modal.nestingLVL--;
		
		if(modal.config.hideByKey !== null && modal.nestingLVL == 0)
			window.removeEventListener('keyup', modal.__keyPress);
		
		if(typeof(modal.onclose) == 'function')
			modal.onclose(el);
		//console.timeEnd('########hide_time');
	},
	__modalShow: function(e, s) { // element, switch or not
		if(modal.nestingLVL > 1)
			modal.modalBoxes[modal.nestingLVL].querySelector(modal.config.modalsCont).appendChild(e);
		
		modal.openedModal[modal.nestingLVL] = e;
		modal.__animate(e, 'show' + (s ? '_switch' : ''));
	},
	__modalHide: function(cb) { // callback
		var lvl = modal.nestingLVL;
		var modalWin = modal.openedModal[lvl];
		
		modal.__animate(modalWin, 'hide', function() {
			if(lvl > 1)
				modal.modalBoxes[1].querySelector(modal.config.modalsCont).appendChild(modalWin);
			if(typeof(cb) == 'function') cb();
		});
		modal.openedModal[lvl] = null;
	},
	__switchTo: function(e) { // element
		modal.__modalHide(function(){modal.__modalShow(e, true)});
	},
	// TODO: if(!modal.animEndEvent) { count animation timeout to prevent bugs }
	__animate: function(el, t, cb) { // element, type of animation, callback
		var act, swch, add, rem;
		
		t = t.split('_');
		act = t[0];
		swch = t[1] ? true : false;
		
		if(act == 'show') {
			add = modal.config.show;
			rem = modal.config.hide;
		} else if(act == 'hide') {
			add = modal.config.hide;
			rem = modal.config.show;
		} else {
			return false;
		}
		
		modal.__addClass(el, swch ? add.swch : add.dyn);
		modal.__removeClass(el, rem.dyn);
		modal.__removeClass(el, rem.stat);
		
		
		el.addEventListener(modal.animEndEvent, function modalanimev() {
			el.removeEventListener(modal.animEndEvent, modalanimev);
			
			modal.__removeClass(el, swch ? add.swch : add.dyn);
			modal.__addClass(el, add.stat);
			
			if(typeof(cb) == 'function')
				cb();
		});
	},
	__modalsCollect: function() {
		var cont, modals, i, len;
		
		cont = modal.modalBoxes[1].querySelector(modal.config.modalsCont);
		modals = document.querySelectorAll(modal.config.modalsClass);

		for(i = 0, len = modals.length; i < len; i++) {
			if(modals[i].parentNode == cont)
				continue;

			cont.appendChild(modals[i]);
			modal.__addClass(modals[i], modal.config.hide.stat);
		}
	},
	__anchorOpen: function() {
		var anc;
		
		if(modal.config.urlPrefix !== null) {
			anc = window.location.hash.replace('#', '');
			if(anc != '' && anc.substr(0, modal.config.urlPrefix.length) == modal.config.urlPrefix) {
				el = document.getElementById(anc);
				if(el != null && el.className.match(modal.modalRegExp))
					modal.show(anc);
			}
		}
	},
	__scrollSet: function() {
		var div, heightData;
		
		div = document.createElement('div');
		div.style.cssText = 'visibility:hidden;width:100px;height:100px;overflow-y:scroll';
		document.body.appendChild(div);

		heightData = modal.__getHeight();
		modal.scrollBar = heightData[0] < heightData[1] ? div.offsetWidth - div.clientWidth + 'px' : 0;

		document.body.removeChild(div);
	},
	__keyPress: function(e) { // event
		e.preventDefault();
		
		if(e.keyCode == modal.config.hideByKey)
			modal.hide();
	},
	__getHeight: function() {
		var yScroll, windowHeight;

		if(window.innerHeight && window.scrollMaxY)
			yScroll = window.innerHeight + window.scrollMaxY;
		else if(document.body.scrollHeight > document.body.offsetHeight) // all but Explorer Mac
			yScroll = document.body.scrollHeight;
		else if(document.documentElement && document.documentElement.scrollHeight > document.documentElement.offsetHeight) // Explorer 6 strict mode
			yScroll = document.documentElement.scrollHeight;
		else
			yScroll = document.body.offsetHeight;

		if(self.innerHeight) // all except Explorer
			windowHeight = self.innerHeight;
		else if(document.documentElement && document.documentElement.clientHeight) // Explorer 6 Strict Mode
			windowHeight = document.documentElement.clientHeight;
		else if(document.body) // other Explorers
			windowHeight = document.body.clientHeight;

		return [windowHeight, yScroll]; // [height content window, all content height]
	},
	__setAnimatonEndEvent: function() {
		var i, l, styles, events, prefixes, hash, block, styleSheet;
		modal.animEndEvent = false;
		
		// Settings
		events = ['animationend', 'webkitAnimationEnd', 'oAnimationEnd', 'MSAnimationEnd'];
		prefixes = ['-webkit-', '-moz-', '-ms-', '-o-', ''];
		hash = modal.__genStr(12);
		
		// Generating testing styles
		styles = '#' + hash + '{';
		for(i = 0, l = prefixes.length; i < l; i++)
			styles += prefixes[i] + 'animation:' + hash + '-anim 1ms;';
		styles += '}';
		for(i = 0, l = prefixes.length; i < l; i++)
			styles += '@' + prefixes[i] + 'keyframes ' + hash + '-anim{from {left:0} to {left:1px}}';
		
		// Style sheet
		styleSheet = document.createElement('style');
		styleSheet.innerHTML = styles;
		document.head.appendChild(styleSheet);
		
		// Testing block
		block = document.createElement('div');
		block.id = hash;
		block.style.cssText = 'position:absolute;visibility:hidden;opacity:0;width:1px;height:1px';
		document.body.appendChild(block);
		
		// Capture event
		for(i = 0, l = events.length; i < l; i++)
			block.addEventListener(events[i], function(ev) {
				if(!modal.animEndEvent) {
					//console.log(ev.type);
					modal.animEndEvent = ev.type;
					document.head.removeChild(styleSheet);
					document.body.removeChild(block);
				}
			});
	},
	__genStr: function(len) {
		var i,
			text = '',
			possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

		for(i = 0; i < len; i++)
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	},
	__insertAfter: function(e, p) {
		p.parentNode.insertBefore(e, p.nextSibling);
	},
	__addClass: function(e, c) {
		var re = new RegExp('(^|\\s)' + c + '(\\s|$)', 'g');
		if(!re.test(e.className))
			e.className = (e.className + ' ' + c).replace(/\s+/g, ' ').replace(/(^ | $)/g, '');
	},
	__removeClass: function(e, c) {
		var re = new RegExp('(^|\\s)' + c + '(\\s|$)', 'g');
		e.className = e.className.replace(re, '$1').replace(/\s+/g, ' ').replace(/(^ | $)/g, '');
	},
	
};
window.addEventListener('DOMContentLoaded', function(){modal.init()});