const anchors = Array.from(document.querySelector(".anchors").firstElementChild.children);
const listeners = ['init', 'update', 'scroll.before', 'scroll.start', 'scroll', 'scroll.end'];
const list = document.getElementById("listeners");


const pageable = new Pageable("main", {
	interval: 400,
	easing: easings.easeOutCubic,
	onInit: data => {
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

listeners.forEach(listener => {
	const item = document.createElement("li");
	item.textContent = listener;
	list.appendChild(item);

	pageable.on(listener, data => {
		console.log(listener);

		item.classList.add("active");

			setTimeout(() => {
				item.classList.remove("active");
			}, 200);		

		if ( listener === "scroll.end" ) {
			setTimeout(() => {
				Array.from(list.children).forEach(child => child.classList.remove("active"));
			}, 400);
		}
	});
});

const toggle = document.getElementById("settings-open");
const settings = document.getElementById("settings");
const inputs = document.querySelectorAll("input");
const buttons = document.querySelectorAll("button");
const selects = document.querySelectorAll("select");

toggle.addEventListener("click", e => {
		settings.classList.toggle("active");
});

// document.body.addEventListener("click", e => {
// 		settings.classList.toggle("active", settings.contains(e.target));
// });

buttons.forEach(button => {
	button.onclick = toggleMethod;
});

inputs.forEach(input => {
	if ( input.type === "checkbox" ) {
		input.onchange = toggleEvent;
	} else {
		
		const output = input.previousElementSibling.lastElementChild;
		
		let config = {
			tooltips: false,
			min: 0,
			step: 100,
			onInit: val => {
				output.textContent = `${val}ms`;
			},			
			onChange: val => {
				output.textContent = `${val}ms`;
			},			
		};
		
		switch(input.id) {
			case "interval":
				config.max = 2000;
				config.value = pageable.config.interval;
				config.onEnd = val => {
					pageable.config.interval = val
				};
				break;
			case "delay":
				config.max = 1000;
				config.value = pageable.config.delay;
				config.onEnd = val => { pageable.config.delay = val };
				break;
			case "swipeThreshold":
				config.step = 10;
				config.max = 500;
				config.value = pageable.config.swipeThreshold;
				config.onEnd = val => { pageable.config.swipeThreshold = val };
				config.onChange: val => {
					output.textContent = `${val}px`;
				};				
				break;	
		}
		
		new Rangeable(input, config);		
	}
});

selects.forEach(select => {
	initSelect(select);
});
	
function toggleMethod(e) {
		if ( "method" in this.dataset ) {
			pageable[this.dataset.method]();
		}
}
	
function toggleEvent(e) {
		if ( "event" in this.dataset ) {
			pageable.events[this.dataset.event] = this.checked;
		}
}

function update(data) {
	selects[0].value = pageable.index + 1;
	selects[1].value = pageable.anchors[pageable.index];
	selects[2].value = pageable.horizontal ? "horizontal" : "vertical";
	
	inputs[2].checked = pageable.events.wheel;
	inputs[3].checked = pageable.events.mouse;
	inputs[4].checked = pageable.events.touch;
	
	anchors.forEach((anchor, i) => {
		anchor.firstElementChild.classList.toggle("active", i === data.index);
	});
}

function initSelect(select) {
	if ( select.id === "scrollToPage" ) {
		pageable.pages.forEach((page, i) => {
			const option = new Option(i+1, i+1);
			select.add(option);
		});
		
		select.onchange = e => {
			pageable.scrollToPage(e.target.value);
			
			selects[1].value = pageable.anchors[e.target.value - 1];
		};
	} else if ( select.id === "scrollToAnchor" ) {
		pageable.pages.forEach((page, i) => {
			const option = new Option(`#${page.id}`, `#${page.id}`);
			select.add(option);
		});
		
		select.onchange = e => {
			pageable.scrollToAnchor(e.target.value);
			
			selects[0].value = pageable.anchors.indexOf(e.target.value) + 1;
		};		
	} else if ( select.id === "orientate" ) {
		
		["vertical", "horizontal"].forEach(type => {
			const option = new Option(type, type);
			select.add(option);
		});
		
		select.onchange = e => {
			pageable.orientate(e.target.value);
		};
	}
}