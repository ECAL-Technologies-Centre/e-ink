let VIDEO;
const FPS_VIDEO = 30; //original frameRate of video

function setup() {
  Clock.init({ date: new Date(), trueTime: false }); //date: start time, trueTime: if false, the time is only updated by Clock.tick();

  const inkOptions = {
    dither: "bayer", //dithering: 'bayer', 'none', 'floyd-steinberg'
    invert: false, //invert frame: removes ghosting
    dimensions: [2560, 1440], //portrait orientation: [1440, 2560]
  };

  // Ink.connect({ id: 'Empty Example p5', options: inkOptions}); //connect to eInk via a server to display image

  createCanvas(...inkOptions.dimensions);
  pixelDensity(1);
  frameRate(1);
  background(0);

  VIDEO = createVideo("./rsrc/video.mp4");
  VIDEO.hide(); // hide <video> html element
  VIDEO.volume(0); // mute audio to autoplay without a user action (click, etc)
  VIDEO.stop();
  VIDEO.time(10); // go to a specific time of video
}

function draw() {
  background(0);

  push();
  imageMode(CENTER);
  translate(width / 2, height / 2); // center canvas
  scale(height / VIDEO.height); // fit video to canvas height
  image(VIDEO, 0, 0);
  pop();

  VIDEO.time((VIDEO.time() + 1 / FPS_VIDEO) % VIDEO.duration()); // loop video with specific framerate

  Clock.tick(); // updates clock when trueTime is set to false
  Clock.display({ scale: 1, black: true }); // display time on top left of canvas

  Ink.capture(); // send screenshot of canvas to eInk
}

Clock.onMinuteChange = function (event) {
  // other events examples: Clock.onSecondChange, Clock.onHourChange
  console.log("Minutes changed:", event.value);
};
