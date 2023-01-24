/*Version 0.4*/
console.log('Running Ink.js v0.4');

const Ink = {

    //server
    id: 'anonymous', //default id/name
    host: '10.192.149.59',
    port: 3000,
    recordState: 'idle',
    record: false,

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

    //Recording canvas functions
    startRecorder(ctx, bits) {  //bits = bits per second for video quality, defaults to 2.5Mbps
        let canvas = ctx.canvas;
        this.recorder = new CanvasRecorder(canvas, bits);
        this.recordState = 'recording';
        console.log(`Beginning to record, stop by calling "Ink.save([name])" or "Ink.stop()"`);

    },

    save(name) {

        if(this.recordState !== 'recording')
            return;

        if(!this.recorder)
            return;

        name = name || this.id;

        let completeName = name + '.webm';

        this.recorder.save(completeName);

        console.log(`Saving video as ${completeName}!`)
    },

    stop() {

        if(!this.recorder)
            return;

        this.recorder.stop();

        this.recordState = 'stopped';
    },

    capture(options) {

        this.setOptions(options);
        let context = this.options.context || (window._renderer && window._renderer.drawingContext);


        if(this.record && !this.recorder) {

            this.startRecorder(context);
        }

        if (!this.socket || this.idle)
            return;

        //added anti spam security

        if(frameRate in window && Math.round(frameRate()) !== 1)
            frameRate(1);

        this._pause();
        
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

// CanvasRecorder.js - smusamashah
// To record canvas effitiently using MediaRecorder
// https://webrtc.github.io/samples/src/content/capture/canvas-record/

function CanvasRecorder(canvas, video_bits_per_sec) {
    this.start = startRecording;
    this.stop = stopRecording;
    this.save = download;

    var recordedBlobs = [];
    var supportedType = null;
    var mediaRecorder = null;

    var stream = canvas.captureStream();
    if (typeof stream == undefined || !stream) {
        return;
    }

    const video = document.createElement('video');
    video.style.display = 'none';

    function startRecording() {
        let types = [
        "video/webm",
        'video/webm,codecs=vp9',
        'video/vp8',
        "video/webm\;codecs=vp8",
        "video/webm\;codecs=daala",
        "video/webm\;codecs=h264",
        "video/mpeg"
        ];

        for (let i in types) {
            if (MediaRecorder.isTypeSupported(types[i])) {
                supportedType = types[i];
                break;
            }
        }
        if (supportedType == null) {
            console.log("No supported type found for MediaRecorder");
        }
        let options = { 
            mimeType: supportedType,
            videoBitsPerSecond: video_bits_per_sec || 2500000 // 2.5Mbps
        };

        recordedBlobs = [];
        try {
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            alert('MediaRecorder is not supported by this browser.');
            console.error('Exception while creating MediaRecorder:', e);
            return;
        }

        console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
        mediaRecorder.onstop = handleStop;
        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.start(100); // collect 100ms of data blobs
        console.log('MediaRecorder started', mediaRecorder);
    }

    function handleDataAvailable(event) {
        if (event.data && event.data.size > 0) {
            recordedBlobs.push(event.data);
        }
    }

    function handleStop(event) {
        console.log('Recorder stopped: ', event);
        const superBuffer = new Blob(recordedBlobs, { type: supportedType });
        video.src = window.URL.createObjectURL(superBuffer);
    }

    function stopRecording() {
        mediaRecorder.stop();
        console.log('Recorded Blobs: ', recordedBlobs);
        video.controls = true;
    }

    function download(file_name) {
        const name = file_name || 'recording.webm';
        const blob = new Blob(recordedBlobs, { type: supportedType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }
}