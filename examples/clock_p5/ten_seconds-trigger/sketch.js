//! draw a circle every 10 seconds

let timer = 10000 // (timer in frames). set a super high value so the timer does not trigger right away 
const duration = 3 // show shape for this amount of frames
const interval = 10;

function setup() {
    
    Clock.init({ date: new Date(), trueTime: false }); //date: start time, trueTime: if false, the time is only updated by Clock.tick();

    const inkOptions = {
        dither: 'bayer', //dithering: 'bayer', 'none', 'floyd-steinberg'
        invert: false, //invert frame: removes ghosting
        dimensions: [2560, 1440] //portrait orientation: [1440, 2560] 
    }

    savedHour = Clock.getHours()

    //  Ink.connect({ id: 'Clock p5.js example', options: inkOptions}); //connect to eInk via a server to display image

    createCanvas(...inkOptions.dimensions)
    pixelDensity(1);
    frameRate(1);
    background(0);
    fill(255)
}


function draw() {
    Clock.tick(); //updates clock when trueTime is set to false. placed on top to trigger Clock.onSecondChange before drawing the circle

    background(0);
    
    if (timer < duration) {
        drawSomeCircleStuff()
    } else {
        textSize(50)
        textAlign(CENTER)
        text('wait for it...', width / 2, height / 2)
    }

    // ------

    Clock.display({ scale: 5, black: true }); //display time on top left of canvas    

    Ink.capture(); //send screenshot of canvas to eInk
}

function drawSomeCircleStuff() {
    push() // keep next transformations isolated before the next pop();

    noStroke()
    fill(255)
    ellipse(width / 2, height / 2, 500)

    console.log("circle drawn now")

    pop()
}

Clock.onSecondChange = (event) => {
    // event.value is the number of seconds from the clock

    timer++; // increment the timer

    if (event.value % interval === 0) {  // % remainder operator
        timer = 0;
    }
}