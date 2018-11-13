const svg = document.querySelector("svg");
const circle = svg.querySelector("circle");
const r = circle.getAttribute("r");
const circ = 2 * Math.PI * r;	

const pageable = new Pageable("main", {
	onInit: init,
	onScroll: scroll,
	interval: 600,
	freeScroll: true,
	swipeThreshold: 200,
	orientation: "horizontal",
	navPrevEl: ".nav-prev",
	navNextEl: ".nav-next",
});

function scroll(data) {
	const pos = round(1 - ((data.max - data.scrolled) / data.max), 3);
	circle.style.strokeDashoffset = circ - (circ * pos);	
}

function init(data) {
	scroll.call(this, data);
}

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}