const bar = document.querySelector(".bar");
const svg = document.querySelector("svg");
const circle = svg.querySelector("circle");
const r = circle.getAttribute("r");
const circ = 2 * Math.PI * r;

const pages = new Pageable("main");

pages.on("scroll", update);

function update(data) {
	const pos = round(1 - (data.max - data.scrolled) / data.max, 3);

	circle.style.strokeDashoffset = circ - circ * pos;
	bar.style.transform = `scale(${pos}, 1)`;
}
function round(value, decimals) {
	return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
}