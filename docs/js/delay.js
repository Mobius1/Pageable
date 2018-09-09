const pageable = new Pageable("main", {
	interval: 400,
	delay: 300,
	onBeforeStart: function() {
		this.pages.forEach((page, i) => {
			page.classList.remove("pg-active");
		});	
	}	
});