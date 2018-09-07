const anchors = document.querySelector(".anchors");

const pageable = new Pageable("main", {
	interval: 400,
	delay: 300,
	// orientation: "horizontal",
	// easing: easings.easeOutBounce,
	onInit: init,
	onBeforeStart: function(x,y) {
		console.log("Start:", x,y);
		this.pages.forEach((page, i) => {
			page.firstElementChild.classList.remove("active");
		});	
	},
	onScroll: function(y) {
		console.log("Scroll:", Math.round(y));
	},
	onFinish: function(data) {
		console.log("Finish:", data);
		this.pages.forEach((page, i) => {
			page.firstElementChild.classList.toggle("active", i === this.index);
			
			anchors.firstElementChild.children[i].firstElementChild.classList.toggle("active", i === this.index);
		});	
	},
});

function init(pages) {
	const frag = document.createDocumentFragment();
	
	pages[0].firstElementChild.classList.add("active");
	pages.forEach((page, i) => {
		const id = page.id;
		const text = `${id.charAt(0).toUpperCase()}${id.substr(1)}`;
		
		// generate top menu
		const li = document.createElement("li");
		const a = document.createElement("a");
		
		a.href = `#${page.id}`;
		
		a.textContent = text.replace("-", " ");
		
		if ( i === 0 ) {
			a.classList.add("active");
		}
		
		li.appendChild(a);
		frag.appendChild(li);
	});
	
	anchors.firstElementChild.appendChild(frag);
}