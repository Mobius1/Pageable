class Pageable {
	constructor(container, options) {
		
		// missing container parameter
		if ( container === undefined ) {
			return console.error("Pageable:", "No container defined.");
		}
		
		const defaults = {
			pips: true,
			interval: 300,
			delay: 0,
			throttle: 50,
			orientation: "vertical",
			easing: (t, b, c, d, s) => -c * (t /= d) * (t - 2) + b,
			onInit: () => {},
			onUpdate: () => {},
			onBeforeStart: () => {},
			onStart: () => {},
			onScroll: () => {},
			onFinish: () => {},
			events: {
				wheel: true,
				mouse: true,
				touch: true
			}
		};
		
		this.container = typeof container === "string" ?
			document.querySelector(container) : container;
		
		// container not found
		if ( !this.container ) {
			return console.error("Pageable:", "The container could not be found.");
		}		
		
		this.config = Object.assign({}, defaults, options);
		this.events = Object.assign({}, defaults.events, options.events);
		
		if ( this.config.anchors && Array.isArray(this.config.anchors) ) {
			const frag = document.createDocumentFragment();
			
			this.config.anchors.forEach(anchor => {
				const page = document.createElement("div");
				page.dataset.anchor = anchor;
				frag.appendChild(page);
			});
			
			this.container.appendChild(frag);
		}
		
		// search for child nodes with the [data-anchor] attribute
		this.pages = Array.from(this.container.querySelectorAll("[data-anchor]"));

		// none found
		if ( !this.pages.length ) {
			return console.error("Pageable:", "No child nodes with the [data-anchor] attribute could be found.");
		}			
		
		this.horizontal = this.config.orientation === "horizontal";
		
		this.anchors = [];
		
		this.pages.forEach((page, i) => {
			const clean = page.dataset.anchor.replace(/\s+/, "-");
			if ( page.id !== clean ) {
				page.id = clean;
			}
			
			this.anchors.push(`#${clean}`);
			
			page.classList.add("pg-page");

			page.classList.toggle("pg-active", i == 0);
		});		
		
		this.axis = this.horizontal ? "x" : "y";
		
		this.mouseAxis = {
			x: "clientX",
			y: "clientY"
		};
		
		this.scrollAxis = {
			x: "scrollLeft",
			y: "scrollTop"
		};	
		
		this.size = {
			x: "width",
			y: "height",
		};
		
		this.bar = this.getScrollBarWidth();
		
		this.wrapper = document.createElement("div");
		
		this.index = 0;

		this.touch =
			"ontouchstart" in window ||
			(window.DocumentTouch && document instanceof DocumentTouch);	
		
		this.init();
	}
	
	/**
	 * Initialze instance
	 * @return {Void}
	 */
	init() {
		this.container.parentNode.insertBefore(this.wrapper, this.container);
		this.wrapper.appendChild(this.container);
		
		this.wrapper.classList.add("pg-wrapper", `pg-${this.config.orientation}`);
		this.wrapper.classList.add("pg-wrapper");
		this.container.classList.add("pg-container");
		
		// hide body overflow and remove margin
		document.body.style.margin = 0;
		document.body.style.overflow = `hidden`;
		
		if ( this.config.pips ) {
			const nav = document.createElement("nav");
			const ul = document.createElement("ul");
			
			this.pages.forEach((page, i) => {
				const li = document.createElement("li");
				const a = document.createElement("a");
				const span = document.createElement("span");
				
				a.href = `#${page.id}`;
				
				if ( i == 0 ) {
					a.classList.add("active");
				}
				
				a.appendChild(span);
				li.appendChild(a);
				
				ul.appendChild(li);
			});
			
			nav.appendChild(ul);
			
			this.wrapper.appendChild(nav);
			
			this.pips = Array.from(ul.children);
		}
		
		this.bind();
	}
	
	/**
	 * Attach event listeners
	 * @return {Void}
	 */
	bind() {
		
		const throttle = (fn, limit, context) => {
			let wait;
			return () => {
					context = context || this;
					if (!wait) {
							fn.apply(context, arguments);
							wait = true;
							return setTimeout(() => {
									wait = false;
							}, limit);
					}
			};
		};
		
		this.callbacks = {
			wheel: this.wheel.bind(this),
			update: throttle(this.update.bind(this), this.config.throttle),
			load: this.load.bind(this),
			start: this.start.bind(this),
			stop: this.stop.bind(this),
		};
		
		window.addEventListener("wheel", this.callbacks.wheel, false);
		window.addEventListener("resize", this.callbacks.update, false);
		
		this.wrapper.addEventListener(
			this.touch ? "touchstart" : "mousedown",
			this.callbacks.start,
			false
		);	
		
		this.wrapper.addEventListener(
			this.touch ? "touchend" : "mouseup",
			this.callbacks.stop,
			false
		);		
		
		document.addEventListener("DOMContentLoaded", this.callbacks.load, false);
		
		// anchor clicks
		document.addEventListener("click", e => {
			const target = e.target;
			
			const anchor = target.closest("a");
			
			if ( anchor ) {
				if ( this.anchors.indexOf(anchor.hash) > -1 ) {
					e.preventDefault();
					this.scrollToAnchor(anchor.hash);
				} 
			}
		}, false);
	}
	
	/**
	 * Mousedown / touchstart callback
	 * @param  {Event} e
	 * @return {Bool}
	 */
	start(e) {
		
		// preventing action here allows us to still have the the event listeners
		// attached so touch and mouse can be toggled at any time
		if ( (e.type === "touchstart" && !this.events.touch) ) {
			return false;
		}
		
		if ( e.type === "mousedown" && !this.events.mouse ) {
			if ( e.button === 1 ) {
				e.preventDefault();
			}

			return false;
		}		
		
		e.preventDefault();
		e.stopPropagation();
		
		const evt = this.touch ? e.touches[0] : e;
		
		// prevent firing if not on a page
		if ( !evt.target.closest("[data-anchor]") ) {
			return false;
		}

		this.down = {
			x: evt.clientX,
			y: evt.clientY
		};

		this.config.onBeforeStart.call(this, this.index);
	}

	/**
	 * Mouseup / touchend callback
	 * @param  {Event} e
	 * @return {Bool}
	 */
	stop(e) {
		const evt = this.touch ? e.touches[0] : e;
		
		// increment index
		const inc = () => this.index < this.pages.length - 1 && this.index++;
		
		// decrement index
		const dec = () => 0 < this.index && this.index--;
		
		if ( this.down && !this.scrolling ) {

			const oldIndex = this.index;

			if ( this.touch ) {
				if ( e.changedTouches[0][this.mouseAxis[this.axis]] < this.down[this.axis] ) {
					inc();
				} else if ( e.changedTouches[0][this.mouseAxis[this.axis]] > this.down[this.axis] ) {
					dec();
				}
			} else {
				if ( e[this.mouseAxis[this.axis]] < this.down[this.axis] ) {
					e.button === 1 ? dec() : inc();
				} else if ( e[this.mouseAxis[this.axis]] > this.down[this.axis] ) {
					e.button === 1 ? inc() : dec();
				}
			}

			// only scroll if index changed
			if ( oldIndex === this.index ) {
				this.config.onFinish.call(this, this.getData());
			} else {
				this.oldIndex = oldIndex;
				this.scrollBy(this.getScrollAmount(oldIndex));	
			}

			this.down = false;
		}		
	}

	/**
	 * Mousewheel callback
	 * @param  {Event} e
	 * @return {Bool}
	 */
	wheel(e) {
		e.preventDefault();
		
		if ( this.events.wheel && !this.scrolling ) {
			const oldIndex = this.index;

			if ( e.deltaY > 0 ) {
				if ( this.index < this.pages.length - 1 ) {
					this.index++;
				}
			} else {
				if ( this.index > 0 ) {
					this.index--;
				}
			}

			if ( this.index !== oldIndex ) {
				this.oldIndex = oldIndex;
				this.scrollBy(this.getScrollAmount(oldIndex));	
			}	
		}
	}	
	
	/**
	 * DOMContentLoaded callback
	 * @param  {Event} e
	 * @return {Void}
	 */	
	load(e) {
		const id = location.hash;
		
		if ( id ) {
			const index = this.anchors.indexOf(id);
			
			if ( index > -1 ) {
				this.index = index;
				this.setPips();
				
				this.pages.forEach((page, i) => {
					page.classList.toggle("pg-active", i === this.index);
				});
				
				this.config.onFinish.call(this, this.getData());
			}			
		}
		
		this.update();
		
		const data = this.getData();
		
		this.config.onInit.call(this, data);
		
		// emit "init" event
		this.emit("init", data);
	}
	
	/**
	 * Update pips classNames
	 * @param {Number} index
	 */
	setPips(index) {
		if ( this.config.pips ) {
			if ( index === undefined ) {
				index = this.index;
			}

			this.pips.forEach((pip, i) => {
				pip.firstElementChild.classList.toggle("active", i == index);
			});		
		}
	}
	
	/**
	 * Get scroll amount between indexes
	 * @param  {Number} oldIndex
	 * @param  {Number} newIndex
	 * @return {Number} Amount in px
	 */
	getScrollAmount(oldIndex, newIndex) {
		
		if ( newIndex === undefined ) {
			newIndex = this.index;
		}
		
		const h = this.data.window[this.size[this.axis]];
		const a = h * oldIndex;
		const b = h * newIndex;

		return a - b;
	}
	
	/**
	 * Perform the scroll
	 * @param  {Number} amount Amount to scroll
	 * @return {Void}
	 */
	scrollBy(amount) {
		
		if ( this.scrolling ) return false;
		
		this.scrolling = true;
		
		this.config.onBeforeStart.call(this, this.oldIndex);

		// emit "scroll.before" event
		this.emit("scroll.before", this.getData());
		
		this.timer = setTimeout(() => {

			const st = Date.now();
			const offset = this.getScrollOffset();

			this.setPips();		

			// Scroll function
			const scroll = () => {
				const now = Date.now();
				const ct = now - st;

				// Cancel after allotted interval
				if (ct > this.config.interval) {
					cancelAnimationFrame(this.frame);
					
					const position = this.data.window[this.size[this.axis]] * this.index;

					this.container.style.transform = ``;

					this.frame = false;
					this.scrolling = false;
					
					window.location.hash = this.pages[this.index].id;
					
					this.pages.forEach((page, i) => {
						page.classList.toggle("pg-active", i === this.index);
					});

					const data = this.getData();

					this.config.onFinish.call(this, data);
					
					// emit "scroll.end" event
					this.emit("scroll.end", data);	

					return false;
				}

				// Update scroll position
				const scrolled = this.config.easing(ct, 0, amount, this.config.interval);
				
				this.container.style.transform = this.horizontal ? `translate3d(${scrolled}px, 0, 0)` : `translate3d(0, ${scrolled}px, 0)`;
				
				this.scrollPosition = offset[this.axis] - scrolled;				

				const data = this.getData();

				this.config.onScroll.call(this, data);
				
				// emit "scroll" event
				this.emit("scroll", data);

				// requestAnimationFrame
				this.frame = requestAnimationFrame(scroll);	
			};

			this.config.onStart.call(this, this.pages[this.index].id);

			// emit "scroll.start" event
			this.emit("scroll.start", this.getData());
		
			this.frame = requestAnimationFrame(scroll);
		}, this.config.delay);
	}
	
	/**
	 * Scroll to defined paged
	 * @param  {Number} page Page number
	 * @return {Void}
	 */
	scrollToPage(page) {
		this.scrollToIndex(page - 1);
	}
	
	/**
	 * Scroll to defined anchor
	 * @param  {String} id Anchor text
	 * @return {Void}
	 */
	scrollToAnchor(id) {
		this.scrollToIndex(this.anchors.indexOf(id));
	}	
	
	/**
	 * Scroll to next page
	 * @return {Function}
	 */
	next() {
		this.scrollToIndex(this.index+1);
	}

	/**
	 * Scroll to previous page
	 * @return {Function}
	 */
	prev() {
		this.scrollToIndex(this.index-1);
	}

	/**
	 * Scroll to defined index
	 * @param  {Number} index
	 * @return {Void}
	 */
	scrollToIndex(index) {
		if ( index >= 0 && index <= this.pages.length - 1 ) {
			const oldIndex = this.index;
			this.index = index;
			this.oldIndex = oldIndex;
			this.scrollBy(this.getScrollAmount(oldIndex));
		}		
	}	
	
	/**
	 * Update the instance
	 * @return {Void}
	 */
	update() {
		clearTimeout(this.timer);
		this.data = {
			window: {
				width: window.innerWidth,
				height: window.innerHeight
			},
			container: {
				height: this.wrapper.scrollHeight,
				width: this.wrapper.scrollWidth,
			}
		};
		
		// set container dimensions
		const size = this.size[this.axis];
		const opp = this.horizontal ? this.size.y : this.size.x;
		
		// set wrapper size and scroll
		this.wrapper.style[`overflow-${this.axis}`] = `scroll`;
		this.wrapper.style[size] = `${this.data.window[size]}px`;
		this.wrapper.style[opp] = `${this.data.window[opp] + this.bar}px`;
		
		// set container size
		this.container.style[size] = `${this.pages.length * this.data.window[size]}px`;
		
		// offset for scroll bars
		this.wrapper.style[`padding-${this.horizontal ? "bottom" : "right"}`] = `${this.bar}px`;
		
		// reset scroll position (do this AFTER setting dimensions)
		this.wrapper[this.scrollAxis[this.axis]] = this.index * this.data.window[size];		
		
		this.scrollSize = (this.pages.length * this.data.window[size]) - this.data.window[size];
		this.scrollPosition = this.data.window[size] * this.index;
		
		this.pages.forEach((page, i) => {
			if ( this.horizontal ) {
				page.style.float = "left";
			}			
			page.style[size] = `${this.data.window[size]}px`;
			page.style[opp] = `${this.data.window[opp]}px`;
		});	
		
		this.config.onUpdate.call(this, this.getData());	

		// emit "update" event
		this.emit("update", this.getData());	
	}
	
	/**
	 * Get instance data
	 * @return {Object}
	 */
	getData() {
		return {
			index: this.index,
			scrolled: this.scrollPosition,
			max: this.scrollSize,
		};
	}
	
	/**
	 * Get scroll offsets
	 * @return {Object}
	 */
	getScrollOffset() {
		return {
			x: this.wrapper.scrollLeft,
			y: this.wrapper.scrollTop
		};
	}
	
	/**
	 * Orientate the instance
	 * @param  {String} type
	 * @return {Void}
	 */
	orientate(type) {
		switch(type) {
			case "vertical":
				this.horizontal = false;
				this.axis = "y" 
				this.container.style.width = ``;
				break;
			case "horizontal":
				this.horizontal = true;
				this.axis = "x" 
				this.container.style.height = ``;
				break;
			default:
				return false;
		}
		
		this.wrapper.classList.toggle("pg-vertical", !this.horizontal);
		this.wrapper.classList.toggle("pg-horizontal", this.horizontal);
		
		this.config.orientation = type;

		this.update();
	}

	/**
	 * Add custom event listener
	 * @param  {String} event
	 * @param  {Function} callback
	 * @return {Void}
	 */
	on(listener, callback) {
			this.listeners = this.listeners || {};
			this.listeners[listener] = this.listeners[listener] || [];
			this.listeners[listener].push(callback);
	}

	/**
	 * Remove custom listener listener
	 * @param  {String} listener
	 * @param  {Function} callback
	 * @return {Void}
	 */
	off(listener, callback) {
			this.listeners = this.listeners || {};
			if (listener in this.listeners === false) return;
			this.listeners[listener].splice(this.listeners[listener].indexOf(callback), 1);
	}

	/**
	 * Fire custom listener
	 * @param  {String} listener
	 * @return {Void}
	 */
	emit(listener) {
			this.listeners = this.listeners || {};
			if (listener in this.listeners === false) return;
			for (var i = 0; i < this.listeners[listener].length; i++) {
					this.listeners[listener][i].apply(this, Array.prototype.slice.call(arguments, 1));
			}
	}	
	
	getScrollBarWidth() {
		const db = document.body;
		const div = document.createElement("div");
		let t = 0;
		return div.style.cssText = "width: 100; height: 100; overflow: scroll; position: absolute; top: -9999;", document.body.appendChild(div), t = div.offsetWidth - div.clientWidth, document.body.removeChild(div), t;		
	}
}