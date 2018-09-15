const anchors = document.querySelector(".anchors");


const pageable = new Pageable("main", {
	onInit: update,
	onFinish: update,
});


const toggle = document.getElementById("settings-open");
const settings = document.getElementById("settings");
const inputs = document.querySelectorAll("input");
const buttons = document.querySelectorAll("button");
const selects = document.querySelectorAll("select");

document.body.addEventListener("click", e => {
		settings.classList.toggle("active", settings.contains(e.target));
});

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
				config.max = 5000;
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

function update() {
	selects[0].value = pageable.index + 1;
	selects[1].value = pageable.anchors[pageable.index];
	selects[2].value = pageable.horizontal ? "horizontal" : "vertical";
	
	
	inputs[0].checked = pageable.events.wheel;
	inputs[1].checked = pageable.events.mouse;
	inputs[2].checked = pageable.events.touch;
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