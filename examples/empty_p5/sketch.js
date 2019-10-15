function setup() {
    
    Clock.init({ date: new Date(), trueTime: false }); //date: start time, trueTime: if false, the time is only updated by Clock.tick();

    const inkOptions = {
        dither: 'bayer', //dithering: 'bayer', 'none', 'floyd-steinberg'
        invert: false, //invert frame: removes ghosting
        dimensions: [2560, 1440] //portrait orientation: [1440, 2560] 
    }
    
    //Ink.connect({ id: 'jean', options: inkOptions}); //connect to eInk via a server to display image

    createCanvas(...inkOptions.dimensions);
    pixelDensity(1);
    frameRate(1);
    background(0);
}

function draw() {

    /*YOUR SKETCH*/

    Clock.tick(); //updates clock when trueTime is set to false
    Clock.display({ scale: 1, black: true }); //display time on top left of canvas    
    Ink.capture(); //send screenshot of canvas to eInk

    console.log(Clock.getSeconds());
}

Clock.onMinuteChange = function(event) { //other events examples: Clock.onSecondChange, Clock.onHourChange
    console.log('Minutes changed:',event.value);
}