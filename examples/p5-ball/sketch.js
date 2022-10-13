let x = 0,
    y = 0,
    wayX = 1,
    wayY = 1,
    speed = 10;

function setup() {

    Clock.init({ date: new Date(), trueTime: false }); //date: start time, trueTime: if false, the time is only updated by Clock.tick();

    const inkOptions = {
        dither: 'bayer', //dithering: 'bayer', 'none', 'floyd-steinberg'
        invert: false, //invert frame: removes ghosting
        dimensions: [2560, 1440] //portrait orientation: [1440, 2560]
    }

    // Ink.connect({ id: 'Ball Example', options: inkOptions}); //connect to eInk via a server to display image
    createCanvas(...inkOptions.dimensions);
    pixelDensity(1);
    frameRate(1);
    background(0);
}

function draw() {

    background(0);

    if (x < 0) {
        wayX = 1;
    } else if (x > width) {
        wayX = -1;
    }

    if (y < 0) {
        wayY = 1;
    } else if (y > height) {
        wayY = -1;
    }

    x += wayX * speed;
    y += wayY * speed;

    fill(255);
    ellipse(x, y, 220);

    Clock.tick(); //updates clock when trueTime is set to false
    Clock.display({ scale: 1, black: true }); //display time on top left of canvas
    Ink.capture(); //send screenshot of canvas to eInk

    console.log(Clock.getSeconds());
}

Clock.onMinuteChange = function(event) { //other events examples: Clock.onSecondChange, Clock.onHourChange
    console.log('Minutes changed:',event.value);
}
