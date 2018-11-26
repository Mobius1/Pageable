import SlideShow from "./classes/slideshow";
import Emitter from "./classes/emitter";

export default class Pageable extends Emitter {
    constructor(container, options = {}) {
        super();

        // missing container parameter
        if (container === undefined) {
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
            swipeThreshold: 50,
            freeScroll: false,
            slideshow: false,
            infinite: false,
            events: {
                wheel: true,
                mouse: true,
                touch: true
            }
        };

        this.container =
            typeof container === "string" ?
            document.querySelector(container) :
            container;

        // container not found
        if (!this.container) {
            return console.error("Pageable:", "The container could not be found.");
        }

        this.config = Object.assign({}, defaults, options);
        this.events = Object.assign({}, defaults.events, options.events);

        if (this.config.anchors && Array.isArray(this.config.anchors)) {
            const frag = document.createDocumentFragment();

            this.config.anchors.forEach(anchor => {
                const page = document.createElement("div");
                page.dataset.anchor = anchor;
                frag.appendChild(page);
            });

            this.container.appendChild(frag);
        }

        // search for child nodes with the [data-anchor] attribute
        this.pages = this.container.querySelectorAll("[data-anchor]");

        // none found
        if (!this.pages.length) {
            return console.error(
                "Pageable:",
                "No child nodes with the [data-anchor] attribute could be found."
            );
        }

        this.horizontal = this.config.orientation === "horizontal";

        this.anchors = [];

        this.pages.forEach((page, i) => {
            const clean = page.dataset.anchor.replace(/\s+/, "-");
            if (page.id !== clean) {
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
            y: "height"
        };

        this.bar = this._getScrollBarWidth();

        this.index = 0;
        this.slideIndex = 0;

        this.initialised = false;

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
        if (!this.initialised) {
            const o = this.config;
            this.wrapper = document.createElement("div");
            this.container.parentNode.insertBefore(this.wrapper, this.container);
            this.wrapper.appendChild(this.container);

            this.wrapper.classList.add("pg-wrapper", `pg-${o.orientation}`);
            this.wrapper.classList.add("pg-wrapper");
            this.container.classList.add("pg-container");

            // hide body overflow and remove margin
            document.body.style.margin = 0;
            document.body.style.overflow = `hidden`;

            this.container.style.display = "inline-block";

            // can't have a delay with freeScroll
            if (o.freeScroll && o.delay > 0) {
                o.delay = 0;
            }

            for (const dir of ["Prev", "Next"]) {
                const str = `nav${dir}El`;
                if (o[str]) {
                    if (typeof o[str] === "string") {
                        this[str] = document.querySelector(o[str]);
                    } else if (o[str] instanceof Element) {
                        this[str] = o[str];
                    }

                    if (this[str]) {
                        this[str].classList.add("pg-nav");
                        this[str].onclick = this[dir.toLowerCase()].bind(this);
                    }
                }
            }

            if (o.pips) {
                const nav = document.createElement("nav");
                const ul = document.createElement("ul");

                for (const [index, page] of this.pages.entries()) {
                    const li = document.createElement("li");
                    const a = document.createElement("a");
                    const span = document.createElement("span");

                    a.href = `#${page.id}`;

                    if (index == 0) {
                        a.classList.add("active");
                    }

                    a.appendChild(span);
                    li.appendChild(a);

                    ul.appendChild(li);
                }

                nav.appendChild(ul);

                this.wrapper.appendChild(nav);

                this.pips = Array.from(ul.children);
            }

            this.pageCount = this.pages.length;
            this.lastIndex = this.pageCount - 1;

            if (o.infinite) {
                const first = this.pages[0].cloneNode(true);
                const last = this.pages[this.lastIndex].cloneNode(true);

                first.id = `${first.id}-clone`;
                last.id = `${last.id}-clone`;

                first.classList.remove("pg-active");
                last.classList.remove("pg-active");

                this.clones = [first, last];

                this.container.insertBefore(last, this.pages[0]);
                this.container.appendChild(first);
            }

            this.bind();

            this.update();

            this.initialised = true;

            if (o.slideshow) {
                this.slider = new SlideShow(this);
                this.slider.start();
            }
        }
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
            wheel: this._wheel.bind(this),
            update: throttle(this.update.bind(this), this.config.throttle),
            load: this._load.bind(this),
            start: this._start.bind(this),
            drag: this._drag.bind(this),
            stop: this._stop.bind(this),
            click: this._click.bind(this),
        };

        this.wrapper.addEventListener("wheel", this.callbacks.wheel, false);
        window.addEventListener("resize", this.callbacks.update, false);

        this.wrapper.addEventListener(
            this.touch ? "touchstart" : "mousedown",
            this.callbacks.start,
            false
        );

        window.addEventListener(
            this.touch ? "touchmove" : "mousemove",
            this.callbacks.drag,
            false
        );

        window.addEventListener(
            this.touch ? "touchend" : "mouseup",
            this.callbacks.stop,
            false
        );

        document.addEventListener("readystatechange", e => {
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", this.events.load);
            } else {
                this._load();
            }
        });

        // anchor clicks
        document.addEventListener("click", this.callbacks.click, false);
    }

    /**
     * Remove event listeners
     * @return {Bool}
     */
    unbind() {
        this.wrapper.removeEventListener("wheel", this.callbacks.wheel);
        window.removeEventListener("resize", this.callbacks.update);

        this.wrapper.removeEventListener(
            this.touch ? "touchstart" : "mousedown",
            this.callbacks.start
        );

        window.addEventListener(
            this.touch ? "touchmove" : "mousemove",
            this.callbacks.drag
        );

        window.removeEventListener(
            this.touch ? "touchend" : "mouseup",
            this.callbacks.stop
        );

        document.removeEventListener("click", this.callbacks.click);
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
     * Scroll to defined index
     * @param  {Number} index
     * @return {Void}
     */
    scrollToIndex(index) {
        if (!this.scrolling && index >= 0 && index <= this.pages.length - 1) {
            const oldIndex = this.index;
            this.index = index;
            this.oldIndex = oldIndex;
            this._scrollBy(this._getScrollAmount(oldIndex));
        }
    }

    /**
     * Scroll to next page
     * @return {Function}
     */
    next() {
        if (this.config.infinite) {
            let index = this.index;
            if (index === this.lastIndex) {
                index++;
                this._scrollBy(-this.data.window[this.size[this.axis]], index);
            }
        }

        this.scrollToIndex(this.index + 1);
    }

    /**
     * Scroll to previous page
     * @return {Function}
     */
    prev() {
        if (this.config.infinite) {
            let index = this.index;
            if (index === 0) {
                index--;
                this._scrollBy(this.data.window[this.size[this.axis]], index);
            }
        }
        this.scrollToIndex(this.index - 1);
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
                width: this.wrapper.scrollWidth
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
        const len = this.config.infinite ? this.pages.length + 2 : this.pages.length;
        const offset = this.config.infinite ? this.data.window[size] : 0;
        // const len = this.pages.length;
        this.container.style[size] = `${len * this.data.window[size]}px`;

        // offset for scroll bars
        this.wrapper.style[`padding-${this.horizontal ? "bottom" : "right"}`] = `${this.bar}px`;

        // reset scroll position (do this AFTER setting dimensions)
        this.wrapper[this.scrollAxis[this.axis]] = this.index * this.data.window[size] + offset;

        this.scrollSize = (len * this.data.window[size]) - this.data.window[size];
        this.scrollPosition = this.data.window[size] * this.index + offset;

        this.pages.forEach((page, i) => {
            if (this.horizontal) {
                page.style.float = "left";
            }
            page.style[size] = `${this.data.window[size]}px`;
            page.style[opp] = `${this.data.window[opp]}px`;
        });

        if (this.config.infinite) {
            for (const clone of this.clones) {
                if (this.horizontal) {
                    clone.style.float = "left";
                }
                clone.style[size] = `${this.data.window[size]}px`;
                clone.style[opp] = `${this.data.window[opp]}px`;
            }
        }

        this.config.onUpdate.call(this, this._getData());

        // emit "update" event
        this.emit("update", this._getData());
    }

    /**
     * Orientate the instance
     * @param  {String} type
     * @return {Void}
     */
    orientate(type) {
        switch (type) {
            case "vertical":
                this.horizontal = false;
                this.axis = "y";
                this.container.style.width = ``;
                break;
            case "horizontal":
                this.horizontal = true;
                this.axis = "x";
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

    slideshow() {
        return this.slider;
    }

    /**
     * Destroy instance
     * @return {Void}
     */
    destroy() {
        if (this.initialised) {
            // emit "destroy" event
            this.emit("destroy");

            this.unbind();

            // reset body styling
            document.body.style.margin = ``;
            document.body.style.overflow = ``;

            this.container.style.display = ``;
            this.container.style.height = ``;
            this.container.style.width = ``;
            this.container.classList.remove("pg-container");

            this.wrapper.parentNode.replaceChild(this.container, this.wrapper);

            for (const page of this.pages) {
                page.style.height = ``;
                page.style.width = ``;
                page.classList.remove("pg-page");
                page.classList.remove("pg-active");
            }

            for (const dir of ["Prev", "Next"]) {
                const str = `nav${dir}El`;
                if (this[str]) {
                    this[str].classList.remove("active");
                    this[str].classList.remove("pg-nav");
                    this[str].onclick = () => {};
                }
            }

            if (this.config.slideshow) {
                clearInterval(this.slideInterval);
                this.slideInterval = false;
            }

            this.initialised = false;
        }
    }

    /** PRIVATE METHODS **/

    /**
     * Click callback for anchors
     * @param  {Event} e
     * @return {Bool}
     */
    _click(e) {
        if (e.target.closest) {
            const anchor = e.target.closest("a");

            if (anchor && this.anchors.includes(anchor.hash)) {
                e.preventDefault();
                this.scrollToAnchor(anchor.hash);
            }
        }
    }

    /**
     * Mousedown / touchstart callback
     * @param  {Event} e
     * @return {Bool}
     */
    _start(e) {
        e.preventDefault();
        e.stopPropagation();

        if (this.scrolling || this.dragging) {
            return false;
        }

        // preventing action here allows us to still have the the event listeners
        // attached so touch and mouse can be toggled at any time
        if (e.type === "touchstart" && !this.events.touch) {
            return false;
        }

        if (e.type === "mousedown" && !this.events.mouse) {
            if (e.button === 1) {
                e.preventDefault();
            }

            return false;
        }

        const evt = this._getEvent(e);

        // prevent firing if not on a page
        if (!evt.target.closest("[data-anchor]")) {
            return false;
        }

        this.dragging = this.config.freeScroll;

        this.down = {
            x: evt.clientX,
            y: evt.clientY
        };

        this.config.onBeforeStart.call(this, this.index);
    }

    /**
     * Mousemove / touchmove callback
     * @param  {Event} e
     * @return {Bool}
     */
    _drag(e) {
        if (this.config.freeScroll && this.dragging && !this.scrolling) {
            const evt = this._getEvent(e);
            const scrolled = this._limitDrag(evt);
            const data = this._getData();

            this.container.style.transform = this.horizontal ?
                `translate3d(${scrolled}px, 0, 0)` :
                `translate3d(0, ${scrolled}px, 0)`;

            data.scrolled -= scrolled;

            // update position so user-defined callbacks will recieve the new value
            this.config.onScroll.call(this, data, "drag");

            // emit the "scroll" event
            this.emit("scroll", data);
        }
    }

    /**
     * Mouseup / touchend callback
     * @param  {Event} e
     * @return {Bool}
     */
    _stop(e) {
        const evt = this._getEvent(e);

        // increment index
        const inc = () => this.index < this.pages.length - 1 && this.index++;

        // decrement index
        const dec = () => 0 < this.index && this.index--;

        if (this.config.slideshow) {
            this.slider.start();
        }

        const oldIndex = this.index;
        const canChange = this.down && Math.abs(evt[this.mouseAxis[this.axis]] - this.down[this.axis]) >= this.config.swipeThreshold;

        // free scroll
        if (this.dragging && !this.scrolling) {
            const scrolled = this._limitDrag(evt);

            this.dragging = scrolled;

            if (canChange) {
                if (this.config.infinite) {
                    this._overScroll(scrolled < 0, scrolled);
                }
                if (scrolled > 0) {
                    dec();
                } else {
                    inc();
                }
            }

            this._scrollBy(this._getScrollAmount(oldIndex) - scrolled);

            this.down = false;

            return;
        }

        if (this.down && !this.scrolling) {
            const pos = e[this.mouseAxis[this.axis]] < this.down[this.axis];
            const neg = e[this.mouseAxis[this.axis]] > this.down[this.axis];
            if (canChange) {
                if (this.config.infinite) {
                    this._overScroll(pos);
                }

                if (pos) {
                    inc();
                } else if (neg) {
                    dec();
                }
            }

            // only scroll if index changed
            if (oldIndex === this.index) {
                this.config.onFinish.call(this, this._getData());
            } else {
                this.oldIndex = oldIndex;
                this._scrollBy(this._getScrollAmount(oldIndex));
            }

            this.down = false;
        }
    }

    /**
     * Mousewheel callback
     * @param  {Event} e
     * @return {Bool}
     */
    _wheel(e) {
        e.preventDefault();

        if (this.events.wheel && !this.scrolling) {
            let index = this.index;
            const oldIndex = this.index;
            const inc = 0 < e.deltaY;

            if (this.config.infinite) {
                this._overScroll(inc);
            }

            inc ? this.index < this.pages.length - 1 && index++ : 0 < this.index && index--;

            if (index !== oldIndex) {
                this.oldIndex = oldIndex;
                this.scrollToIndex(index);
            }
        }
    }

    /**
     * DOMContentLoaded callback
     * @param  {Event} e
     * @return {Void}
     */
    _load(e) {
        const id = location.hash;

        if (id) {
            const index = this.anchors.indexOf(id);

            if (index > -1) {

                this.scrollPosition = this.data.window[this.size[this.axis]] * index;

                const data = this._getData();
                this.index = index;
                this.slideIndex = index;
                this._setPips();

                this.pages.forEach((page, i) => {
                    page.classList.toggle("pg-active", i === this.index);
                });

                // update nav buttons
                this._setNavs();

                this.config.onScroll.call(this, data, "load");
                this.config.onFinish.call(this, data, "load");

                this.emit("scroll", data);
            }
        }

        this.update();

        const data = this._getData();

        this.config.onInit.call(this, data, "load");

        // emit "init" event
        this.emit("init", data);
    }

    /**
     * Get event
     * @return {Object}
     */
    _getEvent(e) {
        if (this.touch) {
            if (e.type === "touchend") {
                return e.changedTouches[0];
            }
            return e.touches[0];
        }
        return e;
    }

    /**
     * Get instance data
     * @return {Object}
     */
    _getData() {
        return {
            index: this.index,
            scrolled: this.config.infinite ? this.scrollPosition - this.data.window[this.size[this.axis]] : this.scrollPosition,
            max: this.config.infinite ? this.scrollSize - this.data.window[this.size[this.axis]] * 2 : this.scrollSize
        };
    }

    /**
     * Allow overscolling for infinite setting
     * @param  {Boolean} Increasing
     * @return {Void}
     */
    _overScroll(inc, scrolled = 0) {
        let index = this.index;
        if (index === this.lastIndex && inc) {
            index++;
            this._scrollBy(-this.data.window[this.size[this.axis]] - scrolled, index);
        } else if (index === 0 && !inc) {
            index--;
            this._scrollBy(this.data.window[this.size[this.axis]] - scrolled, index);
        }
    }

    /**
     * Perform the scroll
     * @param  {Number} amount Amount to scroll
     * @return {Void}
     */
    _scrollBy(amount, index) {
        if (this.scrolling) return false;

        this.scrolling = true;

        this.config.onBeforeStart.call(this, this.oldIndex);

        // emit "scroll.before" event
        this.emit("scroll.before", this._getData());

        if (this.config.slideshow) {
            this.slider.stop();
        }

        this.timer = setTimeout(() => {
            const st = Date.now();
            const offset = this._getScrollOffset();

            // Scroll function
            const scroll = () => {
                const now = Date.now();
                const ct = now - st;

                // Cancel after allotted interval
                if (ct > this.config.interval) {
                    cancelAnimationFrame(this.frame);

                    this.container.style.transform = ``;

                    this.frame = false;
                    this.scrolling = false;
                    this.dragging = false;

                    if (this.config.slideshow) {
                        this.slider.start();
                    }

                    if (this.config.infinite) {
                        if (index === this.pageCount) {
                            this.index = 0;
                        } else if (index === -1) {
                            this.index = this.lastIndex;
                        }
                    }

                    const data = this._getData();

                    window.location.hash = this.pages[this.index].id;

                    this.pages.forEach((page, i) => {
                        page.classList.toggle("pg-active", i === this.index);
                    });

                    this.slideIndex = this.index;

                    this._setPips();
                    this._setNavs();

                    this.config.onFinish.call(this, data);

                    // emit "scroll.end" event
                    this.emit("scroll.end", data);

                    return false;
                }

                // Update scroll position
                const start = this.dragging ? this.dragging : 0;
                const scrolled = this.config.easing(ct, start, amount, this.config.interval);

                this.container.style.transform = this.horizontal ?
                    `translate3d(${scrolled}px, 0, 0)` :
                    `translate3d(0, ${scrolled}px, 0)`;
                this.scrollPosition = offset[this.axis] - scrolled;

                const data = this._getData();

                if (this.config.infinite) {
                    if (index === this.pageCount) {
                        data.scrolled = 0;
                    } else if (index === -1) {
                        data.scrolled = data.max;
                    }
                }

                this.config.onScroll.call(this, data);

                // emit "scroll" event
                this.emit("scroll", data);

                // requestAnimationFrame
                this.frame = requestAnimationFrame(scroll);
            };

            this.config.onStart.call(this, this.pages[this.index].id);

            // emit "scroll.start" event
            this.emit("scroll.start", this._getData());

            this.frame = requestAnimationFrame(scroll);
        }, this.config.delay);
    }

    /**
     * Get scroll offsets
     * @return {Object}
     */
    _getScrollOffset() {
        return {
            x: this.wrapper.scrollLeft,
            y: this.wrapper.scrollTop
        };
    }

    /**
     * Get scroll amount between indexes
     * @param  {Number} oldIndex
     * @param  {Number} newIndex
     * @return {Number} Amount in px
     */
    _getScrollAmount(oldIndex, newIndex) {
        if (newIndex === undefined) {
            newIndex = this.index;
        }

        const h = this.data.window[this.size[this.axis]];
        const a = h * oldIndex;
        const b = h * newIndex;

        return a - b;
    }

    _getScrollBarWidth() {
        const db = document.body;
        const div = document.createElement("div");
        let t = 0;
        return (
            (div.style.cssText =
                "width: 100; height: 100; overflow: scroll; position: absolute; top: -9999;"),
            db.appendChild(div),
            (t = div.offsetWidth - div.clientWidth),
            db.removeChild(div),
            t
        );
    }

    /**
     * Limit dragging / swiping
     * @return {Number}
     */
    _limitDrag(e) {
        let scrolled = e[this.mouseAxis[this.axis]] - this.down[this.axis];

        if (!this.config.infinite) {
            if (this.index === 0 && scrolled > 0 || this.index === this.pages.length - 1 && scrolled < 0) {
                scrolled /= 10;
            }
        }

        return scrolled;
    }

    _setNavs() {
        if (this.navPrevEl) {
            this.navPrevEl.classList.toggle("active", this.config.infinite || this.index > 0);
        }

        if (this.navNextEl) {
            this.navNextEl.classList.toggle("active", this.config.infinite || this.index < this.pages.length - 1);
        }
    }

    /**
     * Update pips classNames
     * @param {Number} index
     */
    _setPips(index) {
        if (this.config.pips) {
            if (index === undefined) {
                index = this.index;
            }

            this.pips.forEach((pip, i) => {
                pip.firstElementChild.classList.toggle("active", i == index);
            });
        }
    }
}