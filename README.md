# Pageable

[![Maintenance](https://img.shields.io/maintenance/yes/2020?style=for-the-badge)](https://github.com/Mobius1/Pageable/graphs/commit-activity)
[![Code Climate maintainability](https://img.shields.io/codeclimate/maintainability/Mobius1/Pageable.svg?style=for-the-badge)](https://codeclimate.com/github/Mobius1/Pageable/maintainability)
![](http://img.badgesize.io/Mobius1/Pageable/master/dist/pageable.min.js?style=for-the-badge) 
![](http://img.badgesize.io/Mobius1/Pageable/master/dist/pageable.min.js?compression=gzip&label=gzipped&style=for-the-badge)
[![npm](https://img.shields.io/npm/dt/pageable.svg?style=for-the-badge)](https://www.npmjs.com/package/pageable)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg?style=for-the-badge)](https://github.com/Mobius1/Pageable/blob/master/LICENSE)
[![GitHub release](https://img.shields.io/github/release/Mobius1/Pageable.svg?style=for-the-badge)](https://github.com/Mobius1/Pageable/releases)
[![npm](https://img.shields.io/npm/v/pageable.svg?style=for-the-badge)](https://www.npmjs.com/package/pageable)
[![GitHub issues](https://img.shields.io/github/issues-raw/Mobius1/Pageable.svg?style=for-the-badge)](https://github.com/Mobius1/Pageable)
[![GitHub issues](https://img.shields.io/github/issues-closed-raw/Mobius1/Pageable.svg?style=for-the-badge)](https://github.com/Mobius1/Pageable)

Pageable transforms a web page into a full page scrolling presentation.

  - Lightweight (less than 3kb gzipped)
  - Responsive
  - Performant
  - Touch support
  - Easy to set up
  - IE10+

---

## Demos
  - [Playground](https://mobius1.github.io/Pageable/)
  - [Adding progress bars](https://mobius1.github.io/Pageable/progress.html)
  - [Infinite Scrolling](https://mobius1.github.io/Pageable/infinite.html)
  - [Infinite Slideshow](https://mobius1.github.io/Pageable/slideshow.html)
  - [Fun with delays](https://mobius1.github.io/Pageable/delay.html)
  - [Full-page image gallery](https://mobius1.github.io/Pageable/gallery.html)

---

If this project helps you then you can grab me a coffee or beer to say thanks.

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=42AR2ZMBHWVTW&source=url)

---

## Contents

* [Getting Started](#getting-started)
  * [Install](#install)
  * [Browser](#browser)
  * [Set up](#set-up)
  * [Anchors](#anchors)
* [API](#api-reference)
  * [Options](#options)
    * [childSelector](#childselector)
    * [anchors](#anchors-1)
    * [pips](#pips)
    * [animation](#animation)
    * [delay](#delay)
    * [throttle](#throttle)
    * [orientation](#orientation)
    * [swipeThreshold](#swipethreshold)
    * [freeScroll](#freescroll)
    * [navPrevEl](#navprevel)
    * [navNextEl](#navnextel)
    * [infinite](#infinite)
    * [easing](#easing)
    * [events](#events)
    * [onInit](#oninit)
    * [onUpdate](#onupdate)
    * [onBeforeStart](#onbeforestart)
    * [onStart](#onstart)
    * [onScroll](#onscroll)
    * [onFinish](#onfinish)
  * [Methods](#methods)
    * [destroy()](#destroy)
    * [init()](#init)
    * [next()](#next)
    * [prev()](#prev)
    * [scrollToPage()](#scrolltopagepage)
    * [scrollToAnchor()](#scrolltoanchoranchor)
    * [orientate()](#orientateorientation)
    * [slideshow()](#slideshow-1)
    * [on()](#onevent-callback)
    * [off()](#offevent-callback)
  * [Custom Events](#custom-events)
---

## Install

### npm
```
npm install pageable --save
```

---

### Browser

Grab the file from one of the CDNs and include it in your page:

```
https://unpkg.com/pageable@latest/dist/pageable.min.js
```

You can replace `latest` with the required release number if needed.

You can also include the optional stylesheet that applies styling to the nav pips and buttons: 

```
https://unpkg.com/pageable@latest/dist/pageable.min.css
```

---

## Set up

Define a container element that has at least one descendant element with the `data-anchor` attribute.
### HTML
```html
<div id="container">
    <div data-anchor="Page 1"></div>
    <div data-anchor="Page 2"></div>
    <div data-anchor="Page 3"></div>
    <div data-anchor="Page 4"></div>
    ....
</div>
```

Instantiate Pageable and pass a reference to the container in the constructor:
### JS
```javascript
new Pageable("#container");
```

The HTML will be transformed in the following way:
```html
<div class="pg-wrapper">
    <div id="container" class="pg-container">
        <!-- pages -->
        <div data-anchor="page-1" id="page-1" class="pg-page pg-active"></div>
        <div data-anchor="page-2" id="page-2" class="pg-page"></div>
        <div data-anchor="page-3" id="page-3" class="pg-page"></div>
        <div data-anchor="page-4" id="page-4" class="pg-page"></div>
        ...
    </div>
    <!-- pips will go here -->
</div>
```

If you don't set the `[data-anchor]` attribute then you must set the anchors with the [`anchors`](#anchors-1) option.

If `pips` are enabled, their HTML will be appended to the `.pg-wrapper` element after the `.pg-container` element.

The defined anchors will be 'slugified' and used as the page's `id` - e.g. `My Page 1` will be converted to `my-page-1`

Take care not to have another element with a duplicate `id`


---

You can pass an object as the second paramater to customise the instance:

### JS
```javascript
new Pageable("#container", {
    childSelector: "[data-anchor]" // CSS3 selector string for the pages
    anchors: [], // define the page anchors
    pips: true, // display the pips
    animation: 300, // the duration in ms of the scroll animation
    delay: 0, // the delay in ms before the scroll animation starts
    throttle: 50, // the interval in ms that the resize callback is fired
    orientation: "vertical", // or horizontal
    swipeThreshold: 50, // swipe / mouse drag distance (px) before firing the page change event
    freeScroll: false, // allow manual scrolling when dragging instead of automatically moving to next page
    navPrevEl: false, // define an element to use to scroll to the previous page (CSS3 selector string or Element reference)
    navNextEl: false, // define an element to use to scroll to the next page (CSS3 selector string or Element reference)
    infinite: false, // enable infinite scrolling (from 0.4.0)
    slideshow: { // enable slideshow that cycles through your pages automatically (from 0.4.0)
        interval: 3000, // time in ms between page change,
        delay: 0 // delay in ms after the interval has ended and before changing page
    },
    events: {
        wheel: true, // enable / disable mousewheel scrolling
        mouse: true, // enable / disable mouse drag scrolling
        touch: true, // enable / disable touch / swipe scrolling
        keydown: true, // enable / disable keyboard navigation
    },
    easing: function(currentTime, startPos, endPos, interval) {
        // the easing function used for the scroll animation
        return -endPos * (currentTime /= interval) * (currentTime - 2) + startPos;
    },
    onInit: function() {
        // do something when the instance is ready
    },
    onUpdate: function() {
        // do something when the instance updates
    },    
    onBeforeStart: function() {
        // do something before scrolling begins
    },
    onStart: function() {
        // do something when scrolling begins
    },
    onScroll: function() {
        // do something during scroll
    },
    onFinish: function() {
        // do something when scrolling ends
    },
});
```

---

### Anchors

Any anchor on your page that has a hash that matches the ones in the current `Pageable` instance will trigger scrolling. This allows you to add navigation links without needing to define event listeners or callbacks to get them to trigger a scroll.

---

## API Reference

---
## Options
### `childSelector`
###### type: `Boolean`
###### default: `true`

A CSS3 selector string for selecting the nodes to be used as pages

---

### `anchors`
###### type: `Array`
###### default: `undefined`

An array of strings to use as the page anchors. Make sure the number of anchors used is equal to the number of pages.

---

### `pips`
###### type: `Boolean`
###### default: `true`

Displays the navigation pips.

---

### `animation`
###### type: `Number`
###### default: `300`

Sets the scroll animation duration. Set to `0` to disable animation.

**NOTE: This option was known as `interval` in versions prior to `v0.5.0`**

---

### `delay`
###### type: `Number`
###### default: `0`

Sets the delay in `ms` before the scroll animation starts.

---

### `swipeThreshold`
###### type: `Number`
###### default: `50`

Sets the swipe / mouse drag distance in `px` before firing the page change event. If drag / swipe distance is below this threshold then scrolling will not activate.

---

### `freeScroll`
###### type: `Boolean`
###### default: `false`

Sets the ability to drag / scroll freely instead of snapping to the next page.

---

### `infinite`
###### type: `Boolean`
###### default: `false`

Allow seamless continuous scrolling.

---

### `orientation`
###### type: `String`
###### default: `'vertical'`

Sets the orientation of the instance. Either `'vertical'` or `'horizontal'`.

---

### `throttle`
###### type: `Number`
###### default: `50`

Sets the interval in `ms` that the resize callback is fired.

---

### `navPrevEl`
###### type: `String|HTMLElement`
###### default: `false`

Define an element to use to scroll to the previous page. A valid CSS3 selector string or Element reference.

---

### `navNextEl`
###### type: `String|HTMLElement`
###### default: `false`

Define an element to use to scroll to the next page. A valid CSS3 selector string or Element reference.

---

### `slideshow`
###### type: `Object`
###### default: `false`

Enables the slideshow function that cycles through your pages automatically.

The object has two properties to further customise the slidewhow:

* `interval` - length of time in `ms` to display each page.
* `delay` -  delay in `ms` after the interval has ended and before changing page.

---

### `events`
###### type: `Object`

Define the allowed events.

* `wheel` -  enable / disable mousewheel scrolling
* `mouse` -  enable / disable mouse drag scrolling
* `touch` -  enable / disable touch / swipe scrolling
* `keydown` -  enable / disable keyboard navigation

All properties are set to `true` by default.

---

### `easing`
###### type: `Function`

Define the easing function used for the scroll animation.

The function takes four `arguments`:

```javascript
function(currentTime, startPos, endPos, interval) {
    // the default easing function
    return -endPos * (currentTime /= interval) * (currentTime - 2) + startPos;
}
```  

* `currentTime` - The current time in `ms`
* `startPos` - The start position in `px`
* `endPos` - The end position in `px`
* `interval` - The duration of the animation in `ms`

---

### `onInit`
###### type: `Function`
###### default: `noop`

Define a callback to be called when the instance is fully rendered and ready for use.

The function takes a single argument that returns the data object (See [Custom Events](#custom-events))

```javascript
new Pageable("#container", {
    onInit: function(data) {
        // data.index, data.scrolled, data.max
    }
});
```

---

### `onUpdate`
###### type: `Function`
###### default: `noop`

Define a callback to be called when the instance updates.

The function takes a single argument that returns the data object (See [Custom Events](#custom-events))

---

### `onBeforeStart`
###### type: `Function`
###### default: `noop`

Define a callback to be called before scrolling begins.

The function takes a single argument that returns the data object (See [Custom Events](#custom-events))

---

### `onStart`
###### type: `Function`
###### default: `noop`

Define a callback to be called when scrolling begins.

The function takes a single argument that returns the data object (See [Custom Events](#custom-events))

---

### `onScroll`
###### type: `Function`
###### default: `noop`

Define a callback to be called while scrolling.

The function takes a single argument that returns the data object (See [Custom Events](#custom-events))

---

### `onFinish`
###### type: `Function`
###### default: `noop`

Define a callback to be called when scrolling finishes.

The function takes a single argument that returns the data object (See [Custom Events](#custom-events))

---

## Methods

### `destroy()`
Destroy the instance.

This will remove all event listeners and return the DOM to it's initial state.
```javascript
pageable.destroy();
```

---

### `init()`
Initialise the instance after destroying.
```javascript
pageable.init();
```

---

### `next()`
Scroll to next page.
```javascript
pageable.next();
```

---

### `prev()`
Scroll to previous page.
```javascript
pageable.prev();
```

---

### `scrollToPage([page])`
Scroll to defined page number.
```javascript
// scroll to page 3
pageable.scrollToPage(3);
```

---

### `scrollToAnchor([anchor])`
Scroll to defined anchor.
```javascript
pageable.scrollToAnchor("#myanchor");
```

---

### `orientate([orientation])`
Orientate the instance to either vertical or horizontal.
```javascript
pageable.orientate("horizontal");
// or
pageable.orientate("vertical");
```

---

### `slideshow()`
Returns an instance of the slideshow. This requires the `slideshow` option to be set to `true` (`v0.4.0` and above).

The sideshow instance has two methods:
* `start()` - starts / resumes the slideshow
* `stop()` - stops / pauses the slideshow

```javascript
// stop / pause slideshow
pageable.slideshow().stop();

// start / resume slideshow
pageable.slideshow().start();
```

---

### `on([event, [callback]])`
Add custom event listener. See [Custom Events](#custom-events)

---

### `off([event, [callback]])`
remove custom event listener. See [Custom Events](#custom-events)

---

## Custom Events

You can listen to Pageable's custom events with the `on(type, callback)` method.

The callback has one argument which returns the data object:
```javascript
{
    index: // the current page index
    scrolled: // the current scroll offset
    max: // the maximum scroll amount possible
    percent: // the scroll position as a percentage of the maximum scroll (v0.6.7 and above)
}
```

The `percent` property can be helpful when adding progress indicators (see [Adding Progress Bars](https://mobius1.github.io/Pageable/progress.html)).

### Examples
```javascript
const pages = new Pageable("#container");

pages.on("init", data => {
    // do something when the instance is ready
});

pages.on("update", data => {
    // do something when the instance is updated
    
    // this event also fires when the screen size changes
});

pages.on("scroll.before", data => {
    // do something before scrolling starts
    
    // this event will fire when the defined delay begins
    
    // e.g. if the delay is set to 400, this event will
    // fire 400ms BEFORE the "scroll.start" event fires    
});

pages.on("scroll.start", data => {
    // do something when scrolling starts
    
    // this event will fire when the defined delay ends
    
    // e.g. if the delay is set to 400, this event will
    // fire 400ms AFTER the "scroll.before" event fires
});

pages.on("scroll", data => {
    // do something during scroll
});

pages.on("scroll.end", data => {
    // do something when scrolling ends
});
```

---

If this project helps you then you can grab me a coffee or beer to say thanks.

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=42AR2ZMBHWVTW&source=url)

---

Copyright © 2018 Karl Saunders | BSD & MIT license
