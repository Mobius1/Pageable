# Pageable
[![npm version](https://badge.fury.io/js/pageable.svg)](https://badge.fury.io/js/pageable) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/Mobius1/Pageable/blob/master/LICENSE) [![Average time to resolve an issue](http://isitmaintained.com/badge/resolution/Mobius1/Pageable.svg)](http://isitmaintained.com/project/Mobius1/Pageable "Average time to resolve an issue") [![Percentage of issues still open](http://isitmaintained.com/badge/open/Mobius1/Pageable.svg)](http://isitmaintained.com/project/Mobius1/Pageable "Percentage of issues still open") ![](http://img.badgesize.io/Mobius1/Pageable/master/dist/pageable.js) ![](http://img.badgesize.io/Mobius1/Pageable/master/dist/pageable.js?compression=gzip&label=gzipped)

Pageable transforms a web page into a full page scrolling presentation.

  - Lightweight (less than 3kb g-zipped)
  - Responsive
  - Performant
  - Easy to set up

# PLEASE NOTE: Touch / mobile support is coming in the next minor release.

---

## Demos
  - [Playground](https://codepen.io/Mobius1/debug/mGBXPw/)
  - [Fun with real-time orientation](https://mobius1.github.io/Pageable/orientate.html)
  - [Fun with delays](https://mobius1.github.io/Pageable/delay.html)

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
https://unpkg.com/pageable@latest/dist/pageable.js
```

You can replace `latest` with the required release number if needed.

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

---

You can pass an object as the second paramater to customise the instance:

### JS
```javascript
new Pageable("#container", {
    pips: true, // display the pips
    interval: 300, // the duration in ms of the scroll animation
    delay: 0, // the delay in ms before the scroll animation starts
    throttle: 50, // the interval in ms that the resize callback is fired
    orientation: "vertical", // or horizontal
    easing: function(currentTime, startPos, endPos, interval) {
    	// the easing function used for the scroll animation
    	return -endPos * (currentTime /= interval) * (currentTime - 2) + startPos;
    },
    onInit: function() {
    	// do something when the instance is ready
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
## Methods

### `next()`
Scroll to next page.
```javascript
pageable.next();
```

### `prev()`
Scroll to previous page.
```javascript
pageable.prev();
```

### `scrollToPage()`
Scroll to defined page number.
```javascript
pageable.scrollToPage(3);
```

### `scrollToAnchor()`
Scroll to defined anchor.
```javascript
pageable.scrollToAnchor("#myanchor");
```

### `orientate()`
Orientate the instance to either vertical or horizontal.
```javascript
pageable.orientate("horizontal");
```

---

Copyright © 2018 Karl Saunders | BSD & MIT license