/**
 * ModalWindows v1.3 ( https://github.com/MattRh/modal_wins )
 * MattRh, 2015-2016
 * 
 * modal.show("modal_id") - openes modal with id=modal_id in new box
 * modal.show("modal_id", true) - switches to modal with id=modal_id in current box
 * modal.hide() or "ESC" - hides opened modal
 */

var modal = {
	config: {
		// CSS rules
		modalBox: '.modal-box', 
		modalsClass: '.modal',
		modalsCont: '.modal-wrapper > tbody > tr > td',
		// Key code. Null to disable
		hideByKey: 27,
		// URL hash prefix for modal anchor. Null to disable
		urlPrefix: ''
	},
	tStamps: [],
	init: function() {
		this.modalRegExp = new RegExp('(\\s|^)' + this.config.modalsClass.substr(1) + '(\\s|$)');
		this.bodyStyle = document.body.style;
		this.modalBoxes = [];
		this.openedModal = [];
		this.nestingLVL = 0;
		
		this.modalBoxes[1] = document.querySelector(this.config.modalBox);
		this.modalBoxes[1].style.cssText = 'display:none; opacity:0';
		this.boxTemplate = this.modalBoxes[1].cloneNode(true);
		
		this.__modalsCollect();
		this.__scrollSet();
		this.__anchorOpen();
	},
	show: function(e, s) { // element, switch
		//console.time('show_time');
		var mainStyle, bodyStyle, el, lvl;
		
		el = document.getElementById(e);
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
		
		mainStyle = this.modalBoxes[lvl].style;
		bodyStyle = this.bodyStyle;

		bodyStyle.overflowY = 'hidden';
		bodyStyle.paddingRight = this.scrollBar;
		mainStyle.display = 'block';
		mainStyle.opacity = 0;

		this.__animate(mainStyle, {'opacity': 1}, 200, 'main');
		this.__modalShow(el);
		
		if(this.config.hideByKey !== null)
			window.addEventListener('keyup', modal.__keyPress);
		//console.timeEnd('show_time');
	},
	hide: function() {
		//console.time('########hide_time');
		var mainStyle, bodyStyle, lvl;
		
		lvl = this.nestingLVL;
		mainStyle = this.modalBoxes[lvl].style;
		bodyStyle = this.bodyStyle;

		this.__animate(mainStyle, {'opacity': 0}, 180, 'main');
		this.__modalHide();
		
		setTimeout(function() {
			mainStyle.display = 'none';
			bodyStyle.overflowY = bodyStyle.paddingRight = null;
			
			if(lvl > 1)
				modal.modalBoxes[lvl].parentNode.removeChild(modal.modalBoxes[lvl]);
		}, 170);
		
		this.nestingLVL--;
		//console.timeEnd('########hide_time');
	},
	__modalShow: function(e, s) { // element, switch or not
		var elStyle;
		
		if(this.nestingLVL > 1)
			this.modalBoxes[this.nestingLVL].querySelector(this.config.modalsCont).appendChild(e);
		
		this.openedModal[this.nestingLVL] = e;
		elStyle = e.style;
		
		if(!s) {
			elStyle.cssText = 'display:block;opacity:1;top:-50px';
			this.__animate(elStyle, {'top': 0}, 220, 'win');
		} else {
			elStyle.cssText = 'display:block;opacity:0;top:50px';
			this.__animate(elStyle, {'top': 0, 'opacity': 1}, 220, 'win');
		}
	},
	__modalHide: function() {
		var lvl, modalWin, modalWinSt;
		
		lvl = this.nestingLVL;
		modalWin = this.openedModal[lvl];
		modalWinSt = modalWin.style;

		this.__animate(modalWinSt, {'top': '-50px', 'opacity': 0}, 190, 'win');
		setTimeout(function(){
			modalWinSt.display = 'none';
			modal.modalBoxes[1].querySelector(modal.config.modalsCont).appendChild(modalWin);
		}, 190);
		this.openedModal[lvl] = null;
	},
	__switchTo: function(e) { // element
		this.__modalHide();
		setTimeout(function(){modal.__modalShow(e, true);}, 200);
	},
	__animate: function(s, o, t, id) { // element's style var, object with changing styles, time, operation id
		var list = '', stamp = new Date().getTime();
		
		for(var i in o) list += i + ' ' + t + 'ms ease,';
		list = list.slice(0, -1);

		s.transition = s.webkitTransition = list;
		id += '_' + this.nestingLVL;
		modal.tStamps[id] = stamp;
		setTimeout(function() {
			for(var i in o) s[i] = o[i];
		}, 15);
		setTimeout(function() {
			if(modal.tStamps[id] == stamp)
				s.transition = s.webkitTransition = null;
		}, t);
	},
	__keyPress: function(e) { // event
		e.preventDefault();
		
		if(e.keyCode == modal.config.hideByKey) {
			if(this.nestingLVL == 1)
				window.removeEventListener('keyup', modal.__keyPress);
			
			modal.hide();
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

		return [windowHeight, yScroll];
	},
	__insertAfter: function(e, p) {
		return p.parentNode.insertBefore(e, p.nextSibling);
	},
	__modalsCollect: function() {
		var cont, modals, i, len;
		
		cont = this.modalBoxes[1].querySelector(this.config.modalsCont);
		modals = document.querySelectorAll(this.config.modalsClass);

		for(i = 0, len = modals.length; i < len; i++) {
			if(modals[i].parentNode == cont)
				continue;

			cont.appendChild(modals[i]);
			modals[i].style.display = 'none';
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
	}
};
window.onload = function(){modal.init();};