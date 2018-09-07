import utils from './components/utils';

class Pageable {
	constructor(container, options) {
		
		if ( container === undefined ) {
			return console.error("Pageable:", "No container defined.");
		}
		
		const defaults = {
			pips: true,
			interval: 300,
			delay: 0,
			orientation: "vertical",
			easing: (t, b, c, d, s) => -c * (t /= d) * (t - 2) + b,
			onInit: () => {},
			onBeforeStart: () => {},
			onStart: () => {},
			onScroll: () => {},
			onFinish: () => {},
		};
		
		this.container = typeof container === "string" ?
			document.querySelector(container) : container;
		
		// search for child nodes with the [data-anchor] attribute
		this.pages = Array.from(this.container.querySelectorAll("[data-anchor]"));
		
		// none found
		if ( !this.pages.length ) {
			return console.error("Pageable:", "No child nodes with the [data-anchor] attribute could be found.");
		}
		
		this.config = Object.assign({}, defaults, options);
		this.horizontal = this.config.orientation === "horizontal";
		
		this.anchors = [];
		
		this.pages.forEach(page => {
			const clean = page.dataset.anchor.replace(/\s+/, "-");
			if ( page.id !== clean ) {
				page.id = clean;
			}
			
			this.anchors.push(`#${clean}`);
			
			if ( this.horizontal ) {
				page.style.float = "left";
			}
			
			page.classList.add("pg-page");
		});		
		
		this.axis = this.horizontal ? "x" : "y";
		
		this.mouseAxis = {
			x: "pageX",
			y: "pageY"
		};
		
		this.scrollAxis = {
			x: "scrollLeft",
			y: "scrollTop"
		};	
		
		this.size = {
			x: "width",
			y: "height",
		};
		
		this.bar = utils.getScrollBarWidth();
		
		this.wrapper = document.createElement("div");
		
		this.index = 0;
		
		this.init();
	}
	
	init() {
		this.container.parentNode.insertBefore(this.wrapper, this.container);
		this.wrapper.appendChild(this.container);
		
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
	
	bind() {
		this.callbacks = {
			wheel: this.wheel.bind(this),
			update: utils.throttle(this.update.bind(this), 50),
			load: this.load.bind(this),
		};
		
		window.addEventListener("wheel", this.callbacks.wheel, false);
		window.addEventListener("resize", this.callbacks.update, false);
		
		this.down = false;
		window.addEventListener("mousedown", e => {
			
			// prevent firing if not on a page
			if ( !e.target.closest("[data-anchor]") ) {
				return false;
			}
			
			e.preventDefault();
			
			this.down = {
				x: e.pageX,
				y: e.pageY
			};
			
			this.config.onBeforeStart.call(this, this.pages[this.index].id);
			
		}, false);
		
		// increment index
		const inc = () => this.index < this.pages.length - 1 && this.index++;
		
		// decrement index
		const dec = () => 0 < this.index && this.index--;
		
		window.addEventListener("mouseup", e => {
			if ( this.down && !this.scrolling ) {
				
				const oldIndex = this.index;
				
				if ( e[this.mouseAxis[this.axis]] < this.down[this.axis] ) {
					e.button === 1 ? dec() : inc();
				} else if ( e[this.mouseAxis[this.axis]] > this.down[this.axis] ) {
					e.button === 1 ? inc() : dec();
				}

				// only scroll if index changed
				if ( oldIndex === this.index ) {
					this.config.onFinish.call(this, {
						hash: this.pages[this.index].id,
						page: this.index + 1,
						index: this.index
					});
				} else {
					this.scrollBy(this.getScrollAmount(oldIndex));	
				}

				this.down = false;
			}
		}, false);		
		
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
	
	load() {
		const id = location.hash;
		
		if ( id ) {
			const index = this.anchors.indexOf(id);
			
			if ( index > -1 ) {
				this.index = index;
				this.setPips();
				
				this.wrapper[this.scrollAxis[this.axis]] = (this.horizontal ? window.innerWidth : window.innerHeight) * this.index;

				this.config.onFinish.call(this, {
					id: this.pages[this.index].id,
					hash: this.anchors[this.index],
					page: this.index + 1,
					index: this.index
				});
			}			
		}
		
		this.update();
		
		this.config.onInit.call(this, this.pages);			
	}
	
	setPips(index) {
		if ( index === undefined ) {
			index = this.index;
		}
		
		this.pips.forEach((pip, i) => {
			pip.firstElementChild.classList.toggle("active", i == index);
		});		
	}
	
	wheel(e) {
		e.preventDefault();
		if ( !this.scrolling ) {
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
				this.scrollBy(this.getScrollAmount(oldIndex));	
			}	
		}
	}
	
	scrollToPage(page) {
		this.scrollToIndex(page - 1);
	}
	
	scrollToIndex(index) {
		if ( index >= 0 && index <= this.pages.length - 1 ) {
			const oldIndex = this.index;
			this.index = index;

			const amount = this.getScrollAmount(oldIndex);

			this.scrollBy(amount);
		}		
	}
	
	scrollToAnchor(id) {
		const index = this.anchors.indexOf(id);
		
		if ( index === this.index ) return false;
		
		this.scrollToIndex(index);
	}
	
	getScrollAmount(oldIndex, newIndex) {
		
		if ( newIndex === undefined ) {
			newIndex = this.index;
		}
		
		const h = this.data.window[this.size[this.axis]];
		const a = h * oldIndex;
		const b = h * newIndex;

		return a - b;
	}
	
	scrollBy(amount) {
		
		if ( this.scrolling ) return false;
		
		this.scrolling = true;
		
		this.config.onBeforeStart.call(this, this.pages[this.index].id);
		
		this.timer = setTimeout(() => {

			const st = Date.now();
			const offset = this.getScrollOffset();

			this.setURL(this.pages[this.index].id);

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
					
					this.wrapper[this.scrollAxis[this.axis]] = this.scrollPosition = position;

					this.frame = false;
					this.scrolling = false;

					this.config.onFinish.call(this, {
						hash: this.pages[this.index].id,
						page: this.index + 1,
						index: this.index
					});		

					return false;
				}

				// Update scroll position
				const scrolled = this.config.easing(ct, 0, amount, this.config.interval);
				
				this.container.style.transform = this.horizontal ? `translate3d(${scrolled}px, 0, 0)` : `translate3d(0, ${scrolled}px, 0)`;

				this.config.onScroll.call(this, offset[this.axis] - scrolled);	

				// requestAnimationFrame
				this.frame = requestAnimationFrame(scroll);
			};

			this.config.onStart.call(this, this.pages[this.index].id);
		
			this.frame = requestAnimationFrame(scroll);
		}, this.config.delay);
	}
	
	setURL(id) {
		if(history.pushState) {
				history.pushState(null, '', `#${id}`);
		} else {
				location.hash = `#${id}`;
		}		
	}
	
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
		
		// reset scroll position (do this AFTER setting data)
		this.wrapper[this.scrollAxis[this.axis]] = this.index * this.data.window[size];		
		
		this.scrollSize = (this.pages.length * this.data.window[size]) - this.data.window[size];
		this.scrollPosition = this.data.window[size] * this.index;
		
		this.pages.forEach((page, i) => {
			page.style[size] = `${this.data.window[size]}px`;
			page.style[opp] = `${this.data.window[opp]}px`;
		});	
	}
	
	getScrollOffset() {
		return {
			x: this.wrapper.scrollLeft,
			y: this.wrapper.scrollTop
		};
	}
}