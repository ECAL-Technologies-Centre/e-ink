// draw a circle every hours

let hourTimer = 10000 // (timer in frames). set a super high value so the timer does not trigger right away 
let savedHour = 0

const duration = 3 // show shape for this amount of frames

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

    background(0);

    const hour = Clock.getHours()

    if (hour !== savedHour) {
        // will trigger if the hour is not the same
        console.log('hour changed!')
        hourTimer = 0
    }
    savedHour = hour


    if (hourTimer < duration) {
        drawSomeCircleStuff()
    } else {
        textSize(50)
        textAlign(CENTER)
        text('click here to show the clock,\nthen change the hour', width/2, height/2)
    }

    hourTimer++; // increment the timer

    // ------

    Clock.tick(); //updates clock when trueTime is set to false
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