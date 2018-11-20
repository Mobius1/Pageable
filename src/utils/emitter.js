export default class Emitter {
    /**
     * Add custom event listener
     * @param  {String} event
     * @param  {Function} callback
     * @return {Void}
     */
    on(listener, callback) {
        this.listeners = this.listeners || {};
        this.listeners[listener] = this.listeners[listener] || [];
        this.listeners[listener].push(callback);
    }

    /**
     * Remove custom listener listener
     * @param  {String} listener
     * @param  {Function} callback
     * @return {Void}
     */
    off(listener, callback) {
        this.listeners = this.listeners || {};
        if (listener in this.listeners === false) return;
        this.listeners[listener].splice(
            this.listeners[listener].indexOf(callback),
            1
        );
    }

    /**
     * Fire custom listener
     * @param  {String} listener
     * @return {Void}
     */
    emit(listener) {
        this.listeners = this.listeners || {};
        if (listener in this.listeners === false) return;
        for (var i = 0; i < this.listeners[listener].length; i++) {
            this.listeners[listener][i].apply(
                this,
                Array.prototype.slice.call(arguments, 1)
            );
        }
    }    
}