/*Version 0.1*/

const Ink = {

    //server
    id: 'anonymous', //default id/name
    host: '192.168.137.1',
    port: 3000,

    options: {
        dimensions: [2560, 1440], //[2560, 1440], [1440, 2560]
        dither: 'bayer', //'bayer', 'none', 'floyd-steinberg'
        bit: 1, //1 , 4
        invert: false, //true, false
        optimize: true, //true, false
        partial: true, //true, false
        loop: () => loop(),
        noLoop: () => noLoop(),
    },

    connected: false,
    idle: true,

    connect(connectParams = {options: {}}) {

        connectParams.options = Object.assign(this.options, connectParams.options);

        Object.assign(this, connectParams);

        let headers = btoa(JSON.stringify({ id: this.id }));

        this.socket = new WebSocket(`ws://${this.host}:${this.port}/?${headers}`);

        this.connected = new Promise(resolve => this.resolveConnection = resolve);

        this._pause();

        this.socket.onopen = e => {
            this.resolveConnection();
            console.log('You are now connected to the server');
        }

        this.socket.onmessage = e => {

            let msg = JSON.parse(e.data);

            this['_' + msg.type](msg.data);
        }

        this.socket.onclose = e => {
            //this._pause();
            this._resume();
            this.socket = undefined;

            console.log('Now running offline');
        }

        this.socket.onerror = e => {
            //this._pause();
            console.error('Cannot connect to server!');
        }
    },

    async message(action, options) {
        if (!this.socket)
            return;

        await this.connected;

        this.socket.send(JSON.stringify({
            type: action,
            data: options
        }));
    },

    capture(options) {

        if (!this.socket || this.idle)
            return;

        this.setOptions(options);

        this._pause();

        let context = this.options.context || window.drawingContext;

        this.message('capture', { dataURI: context.canvas.toDataURL('image/png'), options: this.options });
    },

    setOptions(options = {}) {
        Object.assign(this.options, options);
    },

    _resume(e) {

        this.idle = false;
        //resume draw loop
        this.options.loop();
    },

    _pause() {
        this.idle = true;
        //stop draw loop
        this.options.noLoop();
    },

}