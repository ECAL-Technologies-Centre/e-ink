let cv, ctx, frameRate = 1, interval;

window.addEventListener('load', setup);
function setup() {

    Clock.init({ date: new Date(), trueTime: false }); //date: start time, trueTime: if false, the time is only updated by Clock.tick();

    const inkOptions = {
        dither: 'bayer', //dithering: 'bayer', 'none', 'floyd-steinberg'
        invert: false, //invert frame: removes ghosting
        dimensions: [2560, 1440], //portrait orientation: [1440, 2560]
        loop: loop,
        noLoop: noLoop,
    }
    
    Ink.connect({ id: 'jean', options: inkOptions}); //connect to eInk via a server to display image

    cv = createCanvas(...inkOptions.dimensions);
    ctx = cv.getContext('2d');

    loop();
}

function createCanvas(width, height) {
    let canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.width = width;
    canvas.height = height;

    return canvas;
}

function loop() {
    draw();
    interval = setInterval(draw, 1000/frameRate);
}

function noLoop() {
    clearInterval(interval);
}

function draw() {

    /*YOUR SKETCH*/

    Clock.tick(); //updates clock when trueTime is set to false
    Clock.display({ scale: 1, black: true, context: ctx}); //display time on top left of canvas    
    Ink.capture({context: ctx}); //send screenshot of canvas to eInk

    console.log(Clock.getSeconds());
}

Clock.onMinuteChange = function(event) { //other events examples: Clock.onSecondChange, Clock.onHourChange
    console.log('Minutes changed:',event.value);
}