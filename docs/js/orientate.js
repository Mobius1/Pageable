const pageable = new Pageable("main", {
	pips: false,
	onFinish: function(data) {
		// orientate horizontally when index is odd number
		this.orientate(data.index % 2 == 0 ? "vertical" : "horizontal");
	},
});