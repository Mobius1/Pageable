# Pageable

Pageable transforms a web page into a full page scrolling presentation.

  - Lightweight
  - Performant
  - Easy to set up
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

Instanciate Pageable and pass a reference to the container in the contructor:
### JS
```javascript
new Pageable("#container");
```

---

You can pass an object as the second paramater to customise the instance:

### JS
```javascript
new Pageable("#container", {
    pips: true,
    interval: 300,
    delay: 0,
    orientation: "vertical",
    easing: function(t, b, c, d, s) {
    	return -c * (t /= d) * (t - 2) + b;
    },
    onInit: function() {

    },
    onBeforeStart: function() {

    },
    onStart: function() {

    },
    onScroll: function() {

    },
    onFinish: function() {

    },
});
```

---

Copyright © 2018 Karl Saunders | BSD & MIT license