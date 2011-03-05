/*!
 * jQuery.bgSwitcher
 *
 * @version    0.2.5-beta
 * @author     Hiroshi Hoaki <rewish.org@gmail.com>
 * @copyright  2010-2011 Hiroshi Hoaki
 * @license    http://rewish.org/license/mit The MIT License
 * @link       http://rewish.org/javascript/jquery_bg_switcher
 */
(function($) {

	$.fn.bgSwitcher = function(options) {
		return this.each(function() {
			$(this).data('bgSwitcher', new $.bgSwitcher(this, options));
		});
	};

	$.bgSwitcher = function(node, options) {
		this.node = $(node);
		this.setOptions(options);
		this.initialize();
		return {
			start : $.proxy(this.start,  this),
			stop  : $.proxy(this.stop,   this),
			toggle: $.proxy(this.toggle, this),
			reset : $.proxy(this.reset,  this)
		};
	};

	$.bgSwitcher.defaultOptions = {
		images   : null,
		interval : 5000,
		autoStart: true,
		fadeSpeed: 1000,
		loop     : true,
		random   : false,
		resize   : false
	};

	$.bgSwitcher.prototype = {

		setOptions: function(options) {
			this.options = $.extend(true, {}, $.bgSwitcher.defaultOptions, options);

			if (!(this.options.images instanceof Array)) {
				throw new Error('options.images is invalid.');
			}

			if (typeof this.options.images[0] === 'string'
					&& typeof this.options.images[1] === 'number'
					&& typeof this.options.images[2] === 'number') {
				this.sequence();
			}

			if (this.options.images.length <= 1) {
				throw new Error('Image must be at least more than two.');
			}
		},

		initialize: function() {
			this.preload();

			this.index = -1;
			this.next  = this.options.random ? this.random : this.order;
			this.next();
			this.normalSwitch(this.options.images[this.index]);

			if (this.options.fadeSpeed > 0) {
				this.initFadeNode();
				this.doSwitch = this.fadeSwitch;
			} else {
				this.doSwitch = this.normalSwitch;
			}

			if (this.options.autoStart) {
				this.start();
			}

			if (this.options.resize) {
				$(window).bind('resize.bgSwitcher', $.proxy(this.resizeHandler, this));
			}
		},

		start: function() {
			if (this.timeId) {
				return;
			}
			var self = this;
			this.timeId = setInterval(function() {
				self.next();
				self.doSwitch(self.options.images[self.index]);
			}, self.options.interval);
		},

		stop: function() {
			if (this.timeId) {
				clearInterval(this.timeId);
				this.timeId = null;
			}
		},

		toggle: function() {
			if (this.timeId) {
				this.stop();
			} else {
				this.start();
			}
		},

		reset: function() {
			this.index = 0;
			this.stop();
			this.doSwitch(this.options.images[this.index]);
			this.start();
		},

		order: function() {
			var length = this.options.images.length;
			++this.index;
			if (this.index === length) {
				this.index = 0;
			}
			if (!this.options.loop && this.index >= length - 1) {
				this.stop();
			}
		},

		random: function() {
			var length = this.options.images.length,
			    index  = this.index;
			while (this.index === index) {
				index = Math.floor(Math.random() * length);
			}
			this.index = index;
		},

		sequence: function() {
			var tmp  = [],
			    base = this.options.images[0],
			    min  = this.options.images[1],
			    max  = this.options.images[2];
			do {
				tmp.push(base.replace(/\.\w+$/, min + '$&'));
			} while (++min <= max);
			this.options.images = tmp;
		},

		preload: function() {
			this.loadedImages = [];
			for (var i = 0, len = this.options.images.length; i < len; ++i) {
				this.loadedImages[i] = new Image;
				this.loadedImages[i].src = this.options.images[i];
			}
		},

		initFadeNode: function() {
			var tagName = this.node[0].tagName.toLowerCase();

			if (tagName === 'html') {
				throw new Error('FadeOut the HTML not allowed.');
			}

			if (tagName === 'body') {
				this.initRootNode();
				tagName = 'div';
			}

			var zIndex = this.node.css('zIndex'),
			    offset = this.node.offset();

			if (isNaN(zIndex)) {
				zIndex = 1000;
				this.node.css({zIndex: zIndex});
			}

			this.fadeNode = $('<'+ tagName +'>');
			this.fadeNode.css({
				display: 'block',
				position: 'absolute',
				zIndex: zIndex - 1,
				top: offset.top,
				left: offset.left,
				width: this.node.innerWidth(),
				height: this.node.innerHeight(),
				backgroundImage: this.node.css('backgroundImage'),
				backgroundPosition: this.node.css('backgroundPosition') || [
					this.node.css('backgroundPositionX'),
					this.node.css('backgroundPositionY')
				].join(' '),
				backgroundRepeat: this.node.css('backgroundRepeat'),
				backgroundColor: this.node.css('backgroundColor'),
				backgroundAttachment: this.node.css('backgroundAttachment')
			});

			this.origNode = this.node;
			this.origNode.css({
				position: 'relative',
				background: 'none'
			});

			this.node = this.fadeNode.clone();
			this.node.css('zIndex', zIndex - 2);

			this.origNode.after(this.fadeNode, this.node);
		},

		initRootNode: function() {
			var id = 'bgSwitcher-' + (+new Date);

			$('> *', this.node).not('script').wrapAll('<div id="'+ id +'">');

			var rootNode = $('#' + id),
			    bodyNode = this.node;

			var styles = {
				backgroundImage: bodyNode.css('backgroundImage'),
				backgroundPosition: bodyNode.css('backgroundPosition') || [
					bodyNode.css('backgroundPositionX'),
					bodyNode.css('backgroundPositionY')
				].join(' '),
				backgroundRepeat: bodyNode.css('backgroundRepeat'),
				backgroundColor: bodyNode.css('backgroundColor'),
				backgroundAttachment: bodyNode.css('backgroundAttachment')
			};
			var edge = ['Top', 'Bottom', 'Right', 'Left'];
			for (var i = 0; i < 4; ++i) {
				var property = 'padding' + edge[i];
				styles[property]  = +bodyNode.css('margin' + edge[i]).replace(/\D/g, '');
				styles[property] += +bodyNode.css('padding' + edge[i]).replace(/\D/g, '');
				styles[property] += 'px';
			}
			rootNode.css(styles);

			bodyNode.css({
				margin: 0,
				padding: 0,
				background: 'none'
			});

			this.node = rootNode;

			// Observe resize event
			this.options.resize = true;
		},

		resizeHandler: function() {
			var width = this.origNode.innerWidth();
			this.node.width(width);
			this.fadeNode.width(width);
		},

		normalSwitch: function(imageUrl) {
			this.node.css('backgroundImage', 'url('+ imageUrl +')');
		},

		fadeSwitch: function(imageUrl) {
			var self = this;
			this.fadeNode.stop(true, true);
			this.fadeNode.css('backgroundImage', this.node.css('backgroundImage'));
			this.fadeNode.show(0, function() {
				self.node.css('backgroundImage', 'url('+ imageUrl +')');
				self.fadeNode.fadeOut(self.options.fadeSpeed);
			});
		}

	};

})(jQuery);
