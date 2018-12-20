/*
 Pageable
 Copyright (c) 2017 Karl Saunders (http://mobius.ovh)
 Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.

 Version: 0.6.2

*/
(function(root, factory) {
    var plugin = "Pageable";

    if (typeof exports === "object") {
        module.exports = factory(plugin);
    } else if (typeof define === "function" && define.amd) {
        define([], factory);
    } else {
        root[plugin] = factory(plugin);
    }
})(typeof global !== 'undefined' ? global : this.window || this.global, function() {
    "use strict";

    var noop = function noop() {};

    /**
     * Check is item is object
     * @return {Boolean}
     */
    var isObject = function isObject(val) {
        return Object.prototype.toString.call(val) === "[object Object]";
    };

    /**
     * Merge objects (reccursive)
     * @param  {Object} r
     * @param  {Object} t
     * @return {Object}
     */
    var extend = function extend(src, props) {
        for (var prop in props) {
            if (props.hasOwnProperty(prop)) {
                var val = props[prop];
                if (val && isObject(val)) {
                    src[prop] = src[prop] || {};
                    extend(src[prop], val);
                } else {
                    src[prop] = val;
                }
            }
        }
        return src;
    };

    var throttle = function throttle(fn, limit, context) {
        var wait;
        return function() {
            context = context || this;
            if (!wait) {
                fn.apply(context, arguments);
                wait = true;
                return setTimeout(function() {
                    wait = false;
                }, limit);
            }
        };
    };

    var SlideShow = function SlideShow(instance) {
        this.instance = instance;
        this.running = false;
        this.config = this.instance.config.slideshow;
    };

    SlideShow.prototype.start = function() {
        var that = this;
        if (!that.running) {
            that.running = true;
            that.instance.slideIndex = that.instance.index;
            that.instance.interval = setInterval(function() {
                that.instance.config.onBeforeStart.call(that.instance, that.instance.slideIndex);
                setTimeout(function() {
                    if (that.instance.config.infinite) {
                        that.instance._overScroll(true);
                    }
                    if (that.instance.index < that.instance.pages.length - 1) {
                        that.instance.slideIndex++;
                    } else {
                        that.instance.slideIndex = 0;
                    }
                    that.instance.scrollToIndex(that.instance.slideIndex);
                }, that.config.delay || 0);
            }, that.config.interval);
        }
    };

    SlideShow.prototype.stop = function() {
        if (this.running) {
            clearInterval(this.instance.interval);
            this.instance.slideInterval = false;
            this.running = false;
        }
    };

    /**
     * Pageable 0.6.2
     * 
     * https://github.com/Mobius1/Pageable
     * Released under the MIT license
     */
    var Pageable = function Pageable(container, options) {

        // missing container parameter
        if (container === undefined) {
            return console.error("Pageable:", "No container defined.");
        }

        var that = this;
        var defaults = {
            pips: true,
            animation: 300,
            delay: 0,
            throttle: 50,
            orientation: "vertical",
            easing: function easing(t, b, c, d, s) {
                return -c * (t /= d) * (t - 2) + b;
            },
            onInit: noop,
            onUpdate: noop,
            onBeforeStart: noop,
            onStart: noop,
            onScroll: noop,
            onFinish: noop,
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

        this.container = typeof container === "string" ? document.querySelector(container) : container;

        // container not found
        if (!this.container) {
            return console.error("Pageable:", "The container could not be found.");
        }

        this.config = extend(defaults, options);
        this.events = this.config.events;

        if (this.config.anchors && Array.isArray(this.config.anchors)) {
            var frag = document.createDocumentFragment();

            this.config.anchors.forEach(function(anchor) {
                var page = document.createElement("div");
                page.dataset.anchor = anchor;
                frag.appendChild(page);
            });

            this.container.appendChild(frag);
        }

        // search for child nodes with the [data-anchor] attribute
        this.pages = this.container.querySelectorAll("[data-anchor]");

        // none found
        if (!this.pages.length) {
            return console.error("Pageable:", "No child nodes with the [data-anchor] attribute could be found.");
        }

        this.horizontal = this.config.orientation === "horizontal";

        this.anchors = [];

        this.pages.forEach(function(page, i) {
            var clean = page.dataset.anchor.replace(/\s+/, "-").toLowerCase();
            if (page.id !== clean) {
                page.id = clean;
            }

            that.anchors.push("#" + clean);

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
        this.oldIndex = 0;

        this.down = false;
        this.initialised = false;

        this.touch = "ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch;

        this.init();
    };

    /**
     * Initialze instance
     * @return {Void}
     */
    Pageable.prototype.init = function() {
        if (!this.initialised && !this.container.pageable) {
            var o = this.config;
            this.wrapper = document.createElement("div");
            this.container.parentNode.insertBefore(this.wrapper, this.container);
            this.wrapper.appendChild(this.container);

            this.wrapper.classList.add("pg-wrapper", "pg-" + o.orientation);
            this.wrapper.classList.add("pg-wrapper");
            this.container.classList.add("pg-container");

            // hide body overflow and remove margin
            document.body.style.margin = 0;
            document.body.style.overflow = "hidden";

            this.container.style.display = "inline-block";

            ["Prev", "Next"].forEach(function(dir) {
                var str = "nav" + dir + "El";
                if (o[str]) {
                    if (typeof o[str] === "string") {
                        this[str] = document.querySelector(o[str]);
                    } else if (o[str] instanceof Element) {
                        this[str] = o[str];
                    }

                    if (this[str]) {
                        this[str].classList.add("pg-nav");
                    }
                }
            }, this);

            if (o.pips) {
                var nav = document.createElement("nav");
                var ul = document.createElement("ul");
                nav.classList.add("pg-pips");

                this.pages.forEach(function(page, index) {
                    var li = document.createElement("li");
                    var a = document.createElement("a");
                    var span = document.createElement("span");

                    a.href = "#" + page.id;

                    if (index == 0) {
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

            this.pageCount = this.pages.length;
            this.lastIndex = this.pageCount - 1;

            if (o.infinite) {
                this._toggleInfinite(false, true);
            }

            this.bind();

            this.update();
            this._load();

            var data = this._getData();

            this.config.onInit.call(this, data);

            // emit "init" event
            this.emit("init", data);

            this.initialised = true;
            this.container.pageable = this;

            if (o.slideshow && typeof SlideShow === "function") {
                this.slider = new SlideShow(this);
                this.slider.start();
            }
        }
    };

    /**
     * Attach event listeners
     * @return {Void}
     */
    Pageable.prototype.bind = function() {
        this.callbacks = {
            wheel: this._wheel.bind(this),
            update: throttle(this.update.bind(this), this.config.throttle),
            load: this._load.bind(this),
            start: this._start.bind(this),
            drag: this._drag.bind(this),
            stop: this._stop.bind(this),
            click: this._click.bind(this),
            prev: this.prev.bind(this),
            next: this.next.bind(this),
            keydown: this._keydown.bind(this)
        };

        this.wrapper.addEventListener("wheel", this.callbacks.wheel, false);
        window.addEventListener("resize", this.callbacks.update, false);
        document.addEventListener("keydown", this.callbacks.keydown, false);

        this.wrapper.addEventListener(this.touch ? "touchstart" : "mousedown", this.callbacks.start, false);

        window.addEventListener(this.touch ? "touchmove" : "mousemove", this.callbacks.drag, false);

        window.addEventListener(this.touch ? "touchend" : "mouseup", this.callbacks.stop, false);

        if (this.navPrevEl) {
            this.navPrevEl.addEventListener("click", this.callbacks.prev, false);

            if (this.navNextEl) this.navNextEl.addEventListener("click", this.callbacks.next, false);
        }

        // anchor clicks
        document.addEventListener("click", this.callbacks.click, false);
    };

    /**
     * Remove event listeners
     * @return {Bool}
     */
    Pageable.prototype.unbind = function() {
        this.wrapper.removeEventListener("wheel", this.callbacks.wheel);
        window.removeEventListener("resize", this.callbacks.update);

        this.wrapper.removeEventListener(this.touch ? "touchstart" : "mousedown", this.callbacks.start);

        window.addEventListener(this.touch ? "touchmove" : "mousemove", this.callbacks.drag);

        window.removeEventListener(this.touch ? "touchend" : "mouseup", this.callbacks.stop);

        document.addEventListener("keydown", this.callbacks.keydown, false);

        if (this.navPrevEl) {
            this.navPrevEl.removeEventListener("click", this.callbacks.prev, false);
        }

        if (this.navNextEl) {
            this.navNextEl.removeEventListener("click", this.callbacks.next, false);
        }

        document.removeEventListener("click", this.callbacks.click);
    };

    /**
     * Scroll to defined paged
     * @param  {Number} page Page number
     * @return {Void}
     */
    Pageable.prototype.scrollToPage = function(page) {
        this.scrollToIndex(page - 1);
    };

    /**
     * Scroll to defined anchor
     * @param  {String} id Anchor text
     * @return {Void}
     */
    Pageable.prototype.scrollToAnchor = function(id) {
        this.scrollToIndex(this.anchors.indexOf(id));
    };

    /**
     * Scroll to defined index
     * @param  {Number} index
     * @return {Void}
     */
    Pageable.prototype.scrollToIndex = function(index) {
        if (!this.scrolling && index >= 0 && index <= this.pages.length - 1) {
            var oldIndex = this.index;
            this.index = index;
            this.oldIndex = oldIndex;
            this._scrollBy(this._getScrollAmount(oldIndex));
        }
    };

    /**
     * Scroll to next page
     * @return {Function}
     */
    Pageable.prototype.next = function() {
        if (this.config.infinite) {
            var index = this.index;
            if (index === this.lastIndex) {
                index++;
                return this._scrollBy(-this.data.window[this.size[this.axis]], index);
            }
        }

        this.scrollToIndex(this.index + 1);
    };

    /**
     * Scroll to previous page
     * @return {Function}
     */
    Pageable.prototype.prev = function() {
        if (this.config.infinite) {
            var index = this.index;
            if (index === 0) {
                index--;
                return this._scrollBy(this.data.window[this.size[this.axis]], index);
            }
        }
        this.scrollToIndex(this.index - 1);
    };

    /**
     * Update the instance
     * @return {Void}
     */
    Pageable.prototype.update = function() {
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
        var size = this.size[this.axis];
        var opp = this.horizontal ? this.size.y : this.size.x;

        // set wrapper size and scroll
        this.wrapper.style["overflow-" + this.axis] = "scroll";
        this.wrapper.style[size] = this.data.window[size] + "px";
        this.wrapper.style[opp] = this.data.window[opp] + this.bar + "px";

        // set container size
        var len = this.config.infinite ? this.pages.length + 2 : this.pages.length;
        var offset = this.config.infinite ? this.data.window[size] : 0;
        this.container.style[size] = len * this.data.window[size] + "px";

        // offset for scroll bars
        this.wrapper.style["padding-" + (this.horizontal ? "bottom" : "right")] = this.bar + "px";

        // reset scroll position (do this AFTER setting dimensions)
        this.wrapper[this.scrollAxis[this.axis]] = this.index * this.data.window[size] + offset;

        this.scrollSize = len * this.data.window[size] - this.data.window[size];
        this.scrollPosition = this.data.window[size] * this.index + offset;

        this.pages.forEach(function(page, i) {
            if (this.horizontal) {
                page.style.float = "left";
            }
            page.style[size] = this.data.window[size] + "px";
            page.style[opp] = this.data.window[opp] + "px";
        }, this);

        if (this.config.infinite) {
            this.clones.forEach(function(clone) {
                if (this.horizontal) {
                    clone.style.float = "left";
                }
                clone.style[size] = this.data.window[size] + "px";
                clone.style[opp] = this.data.window[opp] + "px";
            }, this);
        }

        this.config.onUpdate.call(this, this._getData());

        // emit "update" event
        this.emit("update", this._getData());
    };

    /**
     * Orientate the instance
     * @param  {String} type
     * @return {Void}
     */
    Pageable.prototype.orientate = function(type) {
        switch (type) {
            case "vertical":
                this.horizontal = false;
                this.axis = "y";
                this.container.style.width = "";
                break;
            case "horizontal":
                this.horizontal = true;
                this.axis = "x";
                this.container.style.height = "";
                break;
            default:
                return false;
        }

        this.wrapper.classList.toggle("pg-vertical", !this.horizontal);
        this.wrapper.classList.toggle("pg-horizontal", this.horizontal);

        this.config.orientation = type;

        this.update();
    };

    Pageable.prototype.slideshow = function() {
        return this.slider;
    };

    /**
     * Destroy instance
     * @return {Void}
     */
    Pageable.prototype.destroy = function() {
        if (this.initialised) {
            // emit "destroy" event
            this.emit("destroy");

            // remove event listeners
            this.unbind();

            // reset body styling
            document.body.style.margin = "";
            document.body.style.overflow = "";

            this.container.style.display = "";
            this.container.style.height = "";
            this.container.style.width = "";
            this.container.classList.remove("pg-container");

            this.wrapper.parentNode.replaceChild(this.container, this.wrapper);

            // reset the pages
            for (var i = 0; i < this.pages.length; i++) {
                var page = this.pages[i];
                page.style.height = "";
                page.style.width = "";
                page.style.float = "";
                page.classList.remove("pg-page");
                page.classList.remove("pg-active");
            }

            // remove event listeners from the nav buttons
            ["Prev", "Next"].forEach(function(dir) {
                var str = "nav" + dir + "El";
                if (this[str]) {
                    this[str].classList.remove("active");
                    this[str].classList.remove("pg-nav");
                }
            }, this);

            // remove cloned nodes
            if (this.config.infinite) {
                this._toggleInfinite(true);
            }

            // kill the slideshow
            if (this.config.slideshow) {
                this.slider.stop();
                this.slider = false;
            }

            this.initialised = false;
            delete this.container.pageable;
        }
    };

    /**
     * Add custom event listener
     * @param  {String} event
     * @param  {Function} callback
     * @return {Void}
     */
    Pageable.prototype.on = function(listener, callback) {
        this.listeners = this.listeners || {};
        this.listeners[listener] = this.listeners[listener] || [];
        this.listeners[listener].push(callback);
    };

    /**
     * Remove custom listener listener
     * @param  {String} listener
     * @param  {Function} callback
     * @return {Void}
     */
    Pageable.prototype.off = function(listener, callback) {
        this.listeners = this.listeners || {};
        if (listener in this.listeners === false) return;
        this.listeners[listener].splice(this.listeners[listener].indexOf(callback), 1);
    };

    /**
     * Fire custom listener
     * @param  {String} listener
     * @return {Void}
     */
    Pageable.prototype.emit = function(listener) {
        this.listeners = this.listeners || {};
        if (listener in this.listeners === false) return;
        for (var i = 0; i < this.listeners[listener].length; i++) {
            this.listeners[listener][i].apply(this, [].slice.call(arguments, 1));
        }
    };

    /** PRIVATE METHODS **/

    /**
     * Click callback for anchors
     * @param  {Event} e
     * @return {Bool}
     */
    Pageable.prototype._click = function(e) {
        if (e.target.closest) {
            var anchor = e.target.closest("a");

            if (anchor && this.anchors.includes(anchor.hash)) {
                e.preventDefault();
                this.scrollToAnchor(anchor.hash);
            }
        }
    };

    Pageable.prototype._preventDefault = function(e) {
        e.preventDefault();
        e.stopPropagation();
    };

    Pageable.prototype._keydown = function(e) {

        if (this.scrolling || this.dragging) {
            e.preventDefault();
            return false;
        }

        var code = false;
        if (e.key !== undefined) {
            code = e.key;
        } else if (e.keyCode !== undefined) {
            code = e.keyCode;
        }

        var dir1 = "Arrow" + (this.axis === "x" ? "Left" : "Up");
        var dir2 = "Arrow" + (this.axis === "x" ? "Right" : "Down");

        if (code) {
            switch (code) {
                case 33:
                case 37:
                case dir1:
                case "PageUp":
                    e.preventDefault();
                    this.prev();
                    break;
                case 34:
                case 39:
                case dir2:
                case "PageDown":
                    e.preventDefault();
                    this.next();
                    break;
            }
        }
    };

    /**
     * Mousedown / touchstart callback
     * @param  {Event} e
     * @return {Bool}
     */
    Pageable.prototype._start = function(e) {
        var evt = this._getEvent(e);

        if (this.scrolling || this.dragging) {
            return false;
        }

        // preventing action here allows us to still have the the event listeners
        // attached so touch and mouse can be toggled at any time
        if (e.type === "touchstart") {
            if (!this.events.touch) {
                if (!evt.target.closest("a")) {
                    this._preventDefault(e);
                }

                return false;
            }
        }

        if (e.type === "mousedown") {
            if (!this.events.mouse || e.button !== 0) {
                return false;
            }
        }

        // prevent firing if not on a page
        if (!evt.target.closest("[data-anchor]")) {
            return false;
        }

        this._preventDefault(e);

        this.dragging = this.config.freeScroll;

        // suspend slideshow
        if (this.config.slideshow) {
            this.slider.stop();
        }

        this.down = {
            x: evt.clientX,
            y: evt.clientY
        };

        this.startIndex = this.index;

        this.config.onBeforeStart.call(this, this.index);
    };

    /**
     * Mousemove / touchmove callback
     * @param  {Event} e
     * @return {Bool}
     */
    Pageable.prototype._drag = function(e) {
        if (this.config.freeScroll && this.dragging && !this.scrolling) {
            var evt = this._getEvent(e);
            var scrolled = this._limitDrag(evt);
            var data = this._getData();

            this.container.style.transform = this.horizontal ? "translate3d(" + scrolled + "px, 0, 0)" : "translate3d(0, " + scrolled + "px, 0)";

            data.scrolled -= scrolled;

            // update position so user-defined callbacks will recieve the new value
            this.config.onScroll.call(this, data, "drag");

            // emit the "scroll" event
            this.emit("scroll", data);
        }
    };

    /**
     * Mouseup / touchend callback
     * @param  {Event} e
     * @return {Bool}
     */
    Pageable.prototype._stop = function(e) {
        var that = this;
        var evt = this._getEvent(e);

        // increment index
        var inc = function inc() {
            that.index < that.pages.length - 1 && that.index++;
        };

        // decrement index
        var dec = function dec() {
            0 < that.index && that.index--;
        };

        this.oldIndex = this.index;
        var diff = Math.abs(evt[this.mouseAxis[this.axis]] - this.down[this.axis]) >= this.config.swipeThreshold;
        var canChange = this.down && diff;

        // restart slideshow
        if (this.config.slideshow) {
            this.slider.start();
        }

        // free scroll
        if (this.dragging && !this.scrolling) {
            var scrolled = this._limitDrag(evt);

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

            this._scrollBy(this._getScrollAmount(this.oldIndex) - scrolled);

            this.down = false;

            return;
        }

        if (this.down && !this.scrolling) {
            var pos = evt[this.mouseAxis[this.axis]] < this.down[this.axis];
            var neg = evt[this.mouseAxis[this.axis]] > this.down[this.axis];
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
            if (this.startIndex === this.index) {
                this.config.onFinish.call(this, this._getData());
            } else {
                this._scrollBy(this._getScrollAmount(this.oldIndex));
            }

            this.down = false;
        }
    };

    /**
     * Mousewheel callback
     * @param  {Event} e
     * @return {Bool}
     */
    Pageable.prototype._wheel = function(e) {
        e.preventDefault();

        if (this.events.wheel && !this.scrolling) {
            var index = this.index;
            var oldIndex = this.index;
            var inc = 0 < e.deltaY;

            if (this.config.infinite) {
                this._overScroll(inc);
            }

            inc ? this.index < this.pages.length - 1 && index++ : 0 < this.index && index--;

            if (index !== oldIndex) {
                this.oldIndex = oldIndex;
                this.scrollToIndex(index);
            }
        }
    };

    /**
     * DOMContentLoaded callback
     * @param  {Event} e
     * @return {Void}
     */
    Pageable.prototype._load = function(e) {
        var id = location.hash;

        if (id) {
            var index = this.anchors.indexOf(id);

            if (index > -1) {

                var offset = this.config.infinite ? 1 : 0;
                this.scrollPosition = this.data.window[this.size[this.axis]] * (index + offset);

                var data = this._getData();
                this.index = index;
                this.slideIndex = index;

                this.pages.forEach(function(page, i) {
                    page.classList.toggle("pg-active", i === this.index);
                }, this);

                // update nav buttons
                this._setNavs();
                this._setPips();

                this.config.onScroll.call(this, data);
                this.config.onFinish.call(this, data);

                this.emit("scroll", data);
            }
        }

        this.update();
    };

    /**
     * Get event
     * @return {Object}
     */
    Pageable.prototype._getEvent = function(e) {
        if (this.touch) {
            if (e.type === "touchend") {
                return e.changedTouches[0];
            }
            return e.touches[0];
        }
        return e;
    };

    /**
     * Get instance data
     * @return {Object}
     */
    Pageable.prototype._getData = function() {
        return {
            index: this.index,
            scrolled: this.config.infinite ? this.scrollPosition - this.data.window[this.size[this.axis]] : this.scrollPosition,
            max: this.config.infinite ? this.scrollSize - this.data.window[this.size[this.axis]] * 2 : this.scrollSize
        };
    };

    /**
     * Allow overscolling for infinite setting
     * @param  {Boolean} Increasing
     * @return {Void}
     */
    Pageable.prototype._overScroll = function(inc) {
        var scrolled = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        var index = this.index;
        if (index === this.lastIndex && inc) {
            index++;
            this._scrollBy(-this.data.window[this.size[this.axis]] - scrolled, index);
        } else if (index === 0 && !inc) {
            index--;
            this._scrollBy(this.data.window[this.size[this.axis]] - scrolled, index);
        }
    };

    /**
     * Perform the scroll
     * @param  {Number} amount Amount to scroll
     * @return {Void}
     */
    Pageable.prototype._scrollBy = function(amount, index) {
        if (this.scrolling) return false;

        this.scrolling = true;

        this.config.onBeforeStart.call(this, this.oldIndex);

        // emit "scroll.before" event
        this.emit("scroll.before", this._getData());

        if (this.config.slideshow) {
            this.slider.stop();
        }

        var that = this;
        that.timer = setTimeout(function() {
            var st = Date.now();
            var offset = that._getScrollOffset();

            // Scroll function
            var scroll = function scroll() {
                var now = Date.now();
                var ct = now - st;

                // Cancel after allotted interval
                if (ct > that.config.animation) {
                    cancelAnimationFrame(that.frame);

                    that.container.style.transform = "";

                    that.frame = false;
                    that.scrolling = false;
                    that.dragging = false;

                    if (that.config.slideshow) {
                        that.slider.start();
                    }

                    if (that.config.infinite) {
                        if (index === that.pageCount) {
                            that.index = 0;
                        } else if (index === -1) {
                            that.index = that.lastIndex;
                        }
                    }

                    var data = that._getData();

                    window.location.hash = that.pages[that.index].id;

                    that.pages.forEach(function(page, i) {
                        page.classList.toggle("pg-active", i === that.index);
                    }, that);

                    that.slideIndex = that.index;

                    that._setPips();
                    that._setNavs();

                    that.config.onFinish.call(that, data);

                    // emit "scroll.end" event
                    that.emit("scroll.end", data);

                    return false;
                }

                // Update scroll position
                var start = that.dragging ? that.dragging : 0;
                var scrolled = that.config.easing(ct, start, amount, that.config.animation);

                that.container.style.transform = that.horizontal ? "translate3d(" + scrolled + "px, 0, 0)" : "translate3d(0, " + scrolled + "px, 0)";
                that.scrollPosition = offset[that.axis] - scrolled;

                var data = that._getData();

                if (that.config.infinite) {
                    if (index === that.pageCount) {
                        data.scrolled = 0;
                    } else if (index === -1) {
                        data.scrolled = data.max;
                    }
                }

                that.config.onScroll.call(that, data);

                // emit "scroll" event
                that.emit("scroll", data);

                // requestAnimationFrame
                that.frame = requestAnimationFrame(scroll);
            };

            that.config.onStart.call(that, that.pages[that.index].id);

            // emit "scroll.start" event
            that.emit("scroll.start", that._getData());

            that.frame = requestAnimationFrame(scroll);
        }, that.dragging ? 0 : that.config.delay);
    };

    /**
     * Get scroll offsets
     * @return {Object}
     */
    Pageable.prototype._getScrollOffset = function() {
        return {
            x: this.wrapper.scrollLeft,
            y: this.wrapper.scrollTop
        };
    };

    /**
     * Get scroll amount between indexes
     * @param  {Number} oldIndex
     * @param  {Number} newIndex
     * @return {Number} Amount in px
     */
    Pageable.prototype._getScrollAmount = function(oldIndex, newIndex) {
        if (newIndex === undefined) {
            newIndex = this.index;
        }

        var h = this.data.window[this.size[this.axis]];
        var a = h * oldIndex;
        var b = h * newIndex;

        return a - b;
    };

    Pageable.prototype._getScrollBarWidth = function() {
        var db = document.body;
        var div = document.createElement("div");
        var t = 0;
        return div.style.cssText = "width: 100; height: 100; overflow: scroll; position: absolute; top: -9999;", db.appendChild(div), t = div.offsetWidth - div.clientWidth, db.removeChild(div), t;
    };

    Pageable.prototype._toggleInfinite = function(destroy, force) {
        if (destroy && this.config.infinite) {
            this.clones.forEach(function(clone) {
                this.container.removeChild(clone);
            }, this);
            this.config.infinite = false;
        } else if (!this.config.infinite || force) {
            this.config.infinite = true;

            var first = this.pages[0].cloneNode(true);
            var last = this.pages[this.lastIndex].cloneNode(true);

            first.id = first.id + "-clone";
            last.id = last.id + "-clone";

            first.classList.add("pg-clone");
            last.classList.add("pg-clone");

            first.classList.remove("pg-active");
            last.classList.remove("pg-active");

            this.clones = [first, last];

            this.container.insertBefore(last, this.pages[0]);
            this.container.appendChild(first);
        }

        this.update();
    };

    /**
     * Limit dragging / swiping
     * @return {Number}
     */
    Pageable.prototype._limitDrag = function(e) {
        var scrolled = e[this.mouseAxis[this.axis]] - this.down[this.axis];

        if (!this.config.infinite) {
            if (this.index === 0 && scrolled > 0 || this.index === this.pages.length - 1 && scrolled < 0) {
                scrolled /= 10;
            }
        }

        return scrolled;
    };

    Pageable.prototype._setNavs = function() {
        if (this.navPrevEl) {
            this.navPrevEl.classList.toggle("active", this.config.infinite || this.index > 0);
        }

        if (this.navNextEl) {
            this.navNextEl.classList.toggle("active", this.config.infinite || this.index < this.pages.length - 1);
        }
    };

    /**
     * Update pips classNames
     * @param {Number} index
     */
    Pageable.prototype._setPips = function(index) {
        if (this.config.pips) {
            if (index === undefined) {
                index = this.index;
            }

            this.pips.forEach(function(pip, i) {
                pip.firstElementChild.classList.toggle("active", i == index);
            });
        }
    };

    return Pageable;
});