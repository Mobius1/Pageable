const images = [
	"1523978591478-c753949ff840?ixlib=rb-0.3.5&q=85&fm=jpg&crop=entropy&cs=srgb&ixid=eyJhcHBfaWQiOjE0NTg5fQ&s=79943bd5886756fc2f8172b3c491aaad",
	"1506744038136-46273834b3fb?ixlib=rb-0.3.5&q=85&fm=jpg&crop=entropy&cs=srgb&ixid=eyJhcHBfaWQiOjE0NTg5fQ&s=4250c7ad21d5fc105432c2368356c084",
	"1528920304568-7aa06b3dda8b?ixlib=rb-0.3.5&q=85&fm=jpg&crop=entropy&cs=srgb&ixid=eyJhcHBfaWQiOjE0NTg5fQ&s=c69d90bfad16229014dfa8c719597c3d",
	"1523712999610-f77fbcfc3843?ixlib=rb-0.3.5&q=85&fm=jpg&crop=entropy&cs=srgb&ixid=eyJhcHBfaWQiOjE0NTg5fQ&s=b2e980356e68649599d7942ec0cb0207",
	"1506260408121-e353d10b87c7?ixlib=rb-0.3.5&q=85&fm=jpg&crop=entropy&cs=srgb&ixid=eyJhcHBfaWQiOjE0NTg5fQ&s=6f7e7a456594490e5791d4001acc8254",
	"1524260855046-f743b3cdad07?ixlib=rb-0.3.5&q=85&fm=jpg&crop=entropy&cs=srgb&ixid=eyJhcHBfaWQiOjE0NTg5fQ&s=b7e11411bbd92204a75f7007e8e65a18"
];

const svg = document.querySelector("svg");
const circle = svg.querySelector("circle");
const r = circle.getAttribute("r");
const circ = 2 * Math.PI * r;	

const sections = document.querySelectorAll("section");
const count = sections.length;
let n = 0;

sections.forEach((section, i) => {
	const image = new Image();
	const src = `https://images.unsplash.com/photo-${images[i]}`;
	
	image.onload = e => {
		section.firstElementChild.style.backgroundImage = `url(${src})`;
		
		n++;
		
		if ( n >= count ) {
			init();
		}
	};
	
	image.src = src;
});


let pageable;
function init() {

	pageable = new Pageable("main", {
		onInit: onInit,
		onScroll: scroll,
		interval: 600,
		freeScroll: true,
		swipeThreshold: 200,
		orientation: "horizontal",
		navPrevEl: ".nav-prev",
		navNextEl: ".nav-next",
	});
}

function scroll(data) {
	const pos = round(1 - ((data.max - data.scrolled) / data.max), 3);
	circle.style.strokeDashoffset = circ - (circ * pos);	
}

function onInit(data) {
	scroll.call(this, data);
}

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}