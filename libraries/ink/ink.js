/*Version 0.4*/
console.log('Running Ink.js v0.4');

const Ink = {

    //server
    id: 'anonymous', //default id/name
    host: '192.168.137.1',
    port: 3000,

    clear: true, //Remove ghosting of previous client.

    defDims: [2560, 1440],

    options: {
        dimensions: [2560, 1440], //[2560, 1440], [1440, 2560]
        dither: 'bayer', //'bayer', 'none', 'floyd-steinberg'
        bit: 1, //1 , 4
        invert: false, //true, false
        optimize: true, //true, false
        partial: true, //true, false
        loop: () => loop(),
        noLoop: () => noLoop(),
        orientation: 'left', //left or right
    },    

    connected: false,
    idle: true,

    connect(connectParams = {options: {}}) {

        connectParams.options = Object.assign(this.options, connectParams.options);

        Object.assign(this, connectParams);

        //rotation fix
        this.lockRotation();
        this.initOffscreenCanvas();

        let headers = btoa(JSON.stringify({ id: this.id }));

        this.socket = new WebSocket(`ws://${this.host}:${this.port}/?${headers}`);

        this.connected = new Promise(resolve => this.resolveConnection = resolve);

        this._pause();

        window.addEventListener('beforeunload', (e) => {
            this.socket.close();
            return;
        });

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

            alert('Now running offline. \nTry to refresh\nOR\nDon\'t connect by commenting the line "Ink.connect...".');
        }

        this.socket.onerror = e => {
            //this._pause();
            this.socket = undefined;
            
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

        //added anti spam security

        if(frameRate in window && Math.round(frameRate()) !== 1)
            frameRate(1);

        this.setOptions(options);

        this._pause();

        let context = this.options.context || (window._renderer && window._renderer.drawingContext);

        
        this.applyImage(context);
        this.applyFrameIndicator();

        // context.drawImage(img, 0,0);

        const currOptions = Object.assign({}, this.options);

        if(this.clear) {
            currOptions.invert = true;
            this.clear = false;
        }

        this.message('capture', { dataURI: this.offCtx.canvas.toDataURL('image/png'), options: currOptions });
    },

    applyFrameIndicator() {
        let c = this.offCtx;
        let cv = c.canvas;
        let millis = Date.now();
        let binary = millis.toString(2);

        c.save();
        c.translate(0, cv.height-1);
        //draw background
        c.fillStyle = 'black';
        c.fillRect(0,0,binary.length, 1);
        c.fillStyle = 'white';
        //draw squares
        for(let i = 0; i < binary.length; i++) {

            if(binary[i] === '1')
                c.fillRect(i,0,1,1);
        }

        c.restore();
    },

    applyImage(ctx) {

        let c = this.offCtx;
        let cv = c.canvas;

        c.save();

        c.translate(cv.width/2, cv.height/2);

        //force image rotation
        if(ctx.canvas.width < ctx.canvas.height) {    
            let angle = (this.options.orientation === 'left' ? 1 : -1) * Math.PI/2;
            c.rotate(angle);
        }

        c.translate(-ctx.canvas.width/2, -ctx.canvas.height/2);

        c.drawImage(ctx.canvas, 0, 0);

        c.restore();

        return c.canvas;
    },

    setOptions(options = {}) {
        Object.assign(this.options, options);
        this.lockRotation();
    },

    lockRotation() {
        this.options.dimensions = this.defDims;
    },

    initOffscreenCanvas() {
        let canvas = document.createElement('canvas');
        this.offCtx = canvas.getContext('2d');

        [canvas.width , canvas.height ] = this.defDims;
    },

    _start(e) {

        this.clear = true;
        //resume draw loop
        this._resume(e);
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