const utils = {
	getScrollBarWidth: function() {
		const db = document.body;
		const div = document.createElement("div");
		let t = 0;
		return div.style.cssText = "width: 100; height: 100; overflow: scroll; position: absolute; top: -9999;", document.body.appendChild(div), t = div.offsetWidth - div.clientWidth, document.body.removeChild(div), t
	},

	throttle: function(fn, limit, context) {
		let wait;
		return () => {
				context = context || this;
				if (!wait) {
						fn.apply(context, arguments);
						wait = true;
						return setTimeout(() => {
								wait = false;
						}, limit);
				}
		};
	}
};

export default utils;