//--------------------------------------------//
//    ModalWindows script by MattRh           //
//    Last modified: 04.01.2016 (160 lines)   //
//---------------Without JQuery---------------//

var modal = {
	config: {
		modalsID: 'modal-box',
		modalClass: 'modal'
	},
	init: function() {
		this.main = document.getElementById(this.config.modalsID);
		this.mainStyle = this.main.style;
		this.bodyStyle = document.body.style;
		this.openedModal = new Object();
		//console.info('modals inited');
		this.__modalsCollect();
		this.__scrollSet();
	},
	show: function(e) {
		//console.time('show_time');
		
		if(document.getElementById(e) == null || !document.getElementById(e).className.match(new RegExp('(\\s|^)' + this.config.modalClass + '(\\s|$)')))
			return false;

		var mainStyle = this.mainStyle;
		var bodyStyle = this.bodyStyle;
		var contentStyle = this.contentStyle;

		bodyStyle.overflowY = 'hidden';
		bodyStyle.paddingRight = this.scrollBar;
		mainStyle.display = 'block';
		mainStyle.opacity = 0;

		this.__animate(mainStyle, {'opacity': 1}, 200, 'main');

		this.modalShow(e);

		delete mainStyle;
		delete bodyStyle;
		delete contentStyle;

		//console.timeEnd('show_time');
	},
	hide: function() {
		//console.time('########hide_time');

		var mainStyle = this.mainStyle;
		var bodyStyle = this.bodyStyle;
		var contentStyle = this.contentStyle;

		this.__animate(mainStyle, {'opacity': 0}, 180, 'main');
		this.modalHide();
		setTimeout(function() {
			mainStyle.display = 'none';
			bodyStyle.overflowY = bodyStyle.paddingRight = null;
		}, 170);

		delete mainStyle;
		delete bodyStyle;
		delete contentStyle;

		//console.timeEnd('########hide_time');
	},
	modalShow: function(e, s) {
		this.openedModal = document.getElementById(e);
		var elStyle = this.openedModal.style;

		if(!s) {
			elStyle.cssText = 'display:block;opacity:1;top:-50px';
			this.__animate(elStyle, {'top': 0}, 220, 'win');
		} else {
			elStyle.cssText = 'display:block;opacity:0;top:50px';
			this.__animate(elStyle, {'top': 0, 'opacity': 1}, 220, 'win');
		}

		delete elStyle;
	},
	modalHide: function() {
		var modalWinSt = this.openedModal.style;

		this.__animate(modalWinSt, {'top': '-50px', 'opacity': 0}, 190, 'win');
		setTimeout(function(){modalWinSt.display = 'none'}, 190);
		this.openedModal = '';

		delete modalWinSt;
	},
	switchTo: function(e) {
		if(e == this.openedModal)
			return false;

		this.modalHide();
		setTimeout(function(){modal.modalShow(e, true)}, 200);
	},
	__animate: function(s, o, t, id) {
		var i, list = '', stamp = new Date().getTime();
		for(i in o) list += i + ' ' + t + 'ms ease,';
		list = list.slice(0, -1);

		s.transition = s.webkitTransition = list;
		id += '_tStamp';
		modal.id = stamp;
		setTimeout(function() {
			for(i in o) s[i] = o[i];
		}, 15);
		setTimeout(function() {
			if(modal.id == stamp)
				s.transition = s.webkitTransition = null;
		}, t);
	},
	__scrollSet: function() {
		var div = document.createElement('div');
		div.style.cssText = 'visibility:hidden;width:100px;height:100px;overflow-y:scroll';
		document.body.appendChild(div);

		var heightData = this.__getHeight();
		this.scrollBar = heightData[0] < heightData[1] ? div.offsetWidth - div.clientWidth + 'px' : 0;

		document.body.removeChild(div);
		delete div;
		delete heightData;
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
	__modalsCollect: function() {
		var cont = this.main.getElementsByTagName('td')[0];
		var modals = document.querySelectorAll('.' + this.config.modalClass);

		for(var i = 0, len = modals.length; i < len; i++) {
			if(modals[i].parentNode == cont)
				continue;

			cont.appendChild(modals[i]);
			modals[i].style.display = 'none';
		}

		delete cont;
	}
}

window.onload = function(){ modal.init() };