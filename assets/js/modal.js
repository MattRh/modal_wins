/**
 * ModalWindows v1.4.1 ( https://github.com/MattRh/modal_wins )
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
		if(this.isInited)
			return false;
		this.isInited = true;
		
		this.modalBoxes = [];
		this.modalBoxes[1] = document.querySelector(this.config.modalBox);
		this.__addClass(this.modalBoxes[1], this.config.hide.stat);
		this.__addClass(this.modalBoxes[1], this.config.loadCls);
		this.boxTemplate = this.modalBoxes[1].cloneNode(true);
		
		this.modalRegExp = new RegExp('(\\s|^)' + this.config.modalsClass.substr(1) + '(\\s|$)');
		this.bodyStyle = document.body.style;
		this.openedModal = [];
		this.nestingLVL = 0;
		
		this.__modalsCollect();
		this.__scrollSet();
		this.__anchorOpen();
	},
	show: function(id, s) { // element id, switch
		//console.time('show_time');
		var mainStyle, bodyStyle, el, lvl;
		
		el = document.getElementById(id);
		if(el === null || !el.className.match(this.modalRegExp) || !!~this.openedModal.indexOf(el))
			return false;
		
		if(s) {
			this.__switchTo(el);
			return false;
		}
		
		lvl = ++this.nestingLVL;
		
		if(this.nestingLVL > 1) {
			this.modalBoxes[lvl] = this.boxTemplate.cloneNode(true);
			this.__insertAfter(this.modalBoxes[lvl], this.modalBoxes[lvl - 1]);
			
			this.modalBoxes[lvl].querySelector(this.config.modalsCont).appendChild(el);
		}
		
		bodyStyle = this.bodyStyle;
		bodyStyle.overflowY = 'hidden';
		bodyStyle.paddingRight = this.scrollBar;

		this.__animate(this.modalBoxes[lvl], 'show');
		this.__modalShow(el);
		
		if(this.config.hideByKey !== null)
			window.addEventListener('keyup', modal.__keyPress);
		
		if(typeof(this.onopen) == 'function')
			this.onopen(el);
		//console.timeEnd('show_time');
	},
	hide: function() {
		//console.time('########hide_time');
		
		var lvl = this.nestingLVL;
		if(lvl == 0)
			return false;
		
		var el = this.modalBoxes[lvl];
		this.__animate(this.modalBoxes[lvl], 'hide', function() {
			modal.bodyStyle.overflowY = modal.bodyStyle.paddingRight = null;
			
			if(lvl > 1)
				el.parentNode.removeChild(el);
		});
		
		this.__modalHide();
		
		this.nestingLVL--;
		
		if(this.config.hideByKey !== null && modal.nestingLVL == 0)
			window.removeEventListener('keyup', modal.__keyPress);
		
		if(typeof(this.onclose) == 'function')
			this.onclose(el);
		//console.timeEnd('########hide_time');
	},
	__modalShow: function(e, s) { // element, switch or not
		if(this.nestingLVL > 1)
			this.modalBoxes[this.nestingLVL].querySelector(this.config.modalsCont).appendChild(e);
		
		this.openedModal[this.nestingLVL] = e;
		this.__animate(e, 'show' + (s ? '_switch' : ''));
	},
	__modalHide: function(cb) { // callback
		var lvl = this.nestingLVL;
		var modalWin = this.openedModal[lvl];
		
		this.__animate(modalWin, 'hide', function() {
			if(lvl > 1)
				modal.modalBoxes[1].querySelector(modal.config.modalsCont).appendChild(modalWin);
			if(typeof(cb) == 'function') cb();
		});
		this.openedModal[lvl] = null;
	},
	__switchTo: function(e) { // element
		this.__modalHide(function(){modal.__modalShow(e, true)});
	},
	__animate: function(el, t, cb) { // element, type of animation, callback
		var animEndEvent, act, swch, add, rem;
		
		if(window.onanimationend === null)
			animEndEvent = 'animationend';
		else
			animEndEvent = 'webkitAnimationEnd';
		
		t = t.split('_');
		act = t[0];
		swch = t[1] ? true : false;
		
		if(act == 'show') {
			add = this.config.show;
			rem = this.config.hide;
		} else if(act == 'hide') {
			add = this.config.hide;
			rem = this.config.show;
		} else {
			return false;
		}
		
		this.__addClass(el, swch ? add.swch : add.dyn);
		this.__removeClass(el, rem.dyn);
		this.__removeClass(el, rem.stat);
		
		el.addEventListener(animEndEvent, function modalshowev() {
			modal.__removeClass(el, swch ? add.swch : add.dyn);
			modal.__addClass(el, add.stat);
			
			if(typeof(cb) == 'function')
				cb();
			el.removeEventListener(animEndEvent, modalshowev);
		});
	},
	__modalsCollect: function() {
		var cont, modals, i, len;
		
		cont = this.modalBoxes[1].querySelector(this.config.modalsCont);
		modals = document.querySelectorAll(this.config.modalsClass);

		for(i = 0, len = modals.length; i < len; i++) {
			if(modals[i].parentNode == cont)
				continue;

			cont.appendChild(modals[i]);
			this.__addClass(modals[i], this.config.hide.stat);
		}
	},
	__anchorOpen: function() {
		var anc;
		
		if(this.config.urlPrefix !== null) {
			anc = window.location.hash.replace('#', '');
			if(anc != '' && anc.substr(0, this.config.urlPrefix.length) == this.config.urlPrefix) {
				el = document.getElementById(anc);
				if(el != null && el.className.match(this.modalRegExp))
					modal.show(anc);
			}
		}
	},
	__scrollSet: function() {
		var div, heightData;
		
		div = document.createElement('div');
		div.style.cssText = 'visibility:hidden;width:100px;height:100px;overflow-y:scroll';
		document.body.appendChild(div);

		heightData = this.__getHeight();
		this.scrollBar = heightData[0] < heightData[1] ? div.offsetWidth - div.clientWidth + 'px' : 0;

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
	}
};
window.addEventListener('DOMContentLoaded', function(){modal.init()});