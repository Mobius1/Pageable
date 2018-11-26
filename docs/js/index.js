'use strict';

var anchors = [].slice.call(document.querySelector(".anchors").firstElementChild.children);
var listeners = ['init', 'update', 'scroll.before', 'scroll.start', 'scroll', 'scroll.end'];
var list = document.getElementById("listeners");

var pageable = new Pageable("main", {
	interval: 400,
	easing: easings.easeOutCubic,
	onInit: function onInit(data) {
		update(data);
		new MiniBar('#scroll', {
			alwaysShowBars: true
		});
	},
	onFinish: update,
	events: {
		mouse: false
	}
});

listeners.forEach(function (listener) {
	var item = document.createElement("li");
	item.textContent = listener;
	list.appendChild(item);

	pageable.on(listener, function (data) {
		console.log(listener);

		item.classList.add("active");

		setTimeout(function () {
			item.classList.remove("active");
		}, 200);

		if (listener === "scroll.end") {
			setTimeout(function () {
				Array.from(list.children).forEach(function (child) {
					return child.classList.remove("active");
				});
			}, 400);
		}
	});
});

var toggle = document.getElementById("settings-open");
var settings = document.getElementById("settings");
var inputs = document.querySelectorAll("input");
var buttons = document.querySelectorAll("button");
var selects = document.querySelectorAll("select");

toggle.addEventListener("click", function (e) {
	settings.classList.toggle("active");
});

buttons.forEach(function (button) {
	button.onclick = toggleMethod;
});

inputs.forEach(function (input) {
	if (input.type === "checkbox") {
		if (input.id === "freescroll") {
			input.onchange = function (e) {
				pageable.config.freeScroll = input.checked;
				pageable.events.mouse = input.checked;
				document.getElementById("mouse").checked = input.checked;
			};
		} else if (input.id === "infinite") {
			pageable.destroy();
			pageable.config.infinite = input.checked;
			pageable.init();
		} else {
			input.onchange = toggleEvent;
		}
	} else {

		var output = input.previousElementSibling.lastElementChild;

		var config = {
			tooltips: false,
			min: 0,
			step: 100,
			onInit: function onInit(val) {
				output.textContent = val + 'ms';
			},
			onChange: function onChange(val) {
				output.textContent = val + 'ms';
			}
		};

		switch (input.id) {
			case "interval":
				config.max = 2000;
				config.value = pageable.config.interval;
				config.onEnd = function (val) {
					pageable.config.interval = val;
				};
				break;
			case "delay":
				config.max = 1000;
				config.value = pageable.config.delay;
				config.onEnd = function (val) {
					pageable.config.delay = val;
				};
				break;
			case "swipeThreshold":
				config.step = 10;
				config.max = 500;
				config.value = pageable.config.swipeThreshold;
				config.onEnd = function (val) {
					pageable.config.swipeThreshold = val;
				};
				config.onChange = function (val) {
					output.textContent = val + 'px';
				};
				break;
		}

		new Rangeable(input, config);
	}
});

selects.forEach(function (select) {
	initSelect(select);
});

function toggleMethod(e) {
	if ("method" in this.dataset) {
		pageable[this.dataset.method]();
	}
}

function toggleEvent(e) {
	if ("event" in this.dataset) {
		pageable.events[this.dataset.event] = this.checked;
	}
}

function update(data) {
	selects[0].value = pageable.index + 1;
	selects[1].value = pageable.anchors[pageable.index];
	selects[2].value = pageable.horizontal ? "horizontal" : "vertical";

	document.getElementById("wheel").checked = pageable.events.wheel;
	document.getElementById("mouse").checked = pageable.events.mouse;
	document.getElementById("touch").checked = pageable.events.touch;
	document.getElementById("freescroll").checked = pageable.config.freeScroll;

	anchors.forEach(function (anchor, i) {
		anchor.firstElementChild.classList.toggle("active", i === data.index);
	});
}

function initSelect(select) {
	if (select.id === "scrollToPage") {
		pageable.pages.forEach(function (page, i) {
			var option = new Option(i + 1, i + 1);
			select.add(option);
		});

		select.onchange = function (e) {
			pageable.scrollToPage(e.target.value);

			selects[1].value = pageable.anchors[e.target.value - 1];
		};
	} else if (select.id === "scrollToAnchor") {
		pageable.pages.forEach(function (page, i) {
			var option = new Option('#' + page.id, '#' + page.id);
			select.add(option);
		});

		select.onchange = function (e) {
			pageable.scrollToAnchor(e.target.value);

			selects[0].value = pageable.anchors.indexOf(e.target.value) + 1;
		};
	} else if (select.id === "orientate") {

		["vertical", "horizontal"].forEach(function (type) {
			var option = new Option(type, type);
			select.add(option);
		});

		select.onchange = function (e) {
			pageable.orientate(e.target.value);
		};
	}
}