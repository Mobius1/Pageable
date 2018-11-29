class SlideShow {
    constructor(instance) {
        this.instance = instance;
        this.running = false;
        this.config = this.instance.config.slideshow;
    }

    start() {
        if (!this.running) {
            this.running = true;
            this.instance.slideIndex = this.instance.index;
            this.instance.interval = setInterval(() => {
                this.instance.config.onBeforeStart.call(this.instance, this.instance.slideIndex);
                setTimeout(() => {
                    if (this.instance.config.infinite) {
                        this.instance._overScroll(true);
                    }
                    if (this.instance.index < this.instance.pages.length - 1) {
                        this.instance.slideIndex++;
                    } else {
                        this.instance.slideIndex = 0;
                    }
                    this.instance.scrollToIndex(this.instance.slideIndex);
                }, this.config.delay || 0);
            }, this.config.interval);
        }
    }

    stop() {
        if (this.running) {
            clearInterval(this.instance.interval);
            this.instance.slideInterval = false;
            this.running = false;
        }
    }
}