function setup() {
  Clock.init({ date: new Date(), trueTime: false }); //date: start time, trueTime: if false, the time is only updated by Clock.tick();

  const inkOptions = {
    dither: "bayer", //dithering: 'bayer', 'none', 'floyd-steinberg'
    invert: false, //invert frame: removes ghosting
    dimensions: [2560, 1440], //portrait orientation: [1440, 2560]
  };

  // Ink.connect({ id: 'Empty Example p5', options: inkOptions}); //connect to eInk via a server to display image

  createCanvas(...inkOptions.dimensions, WEBGL);
  pixelDensity(1);
  frameRate(1);
  background(0);
}

function draw() {

  push()

  background(250);

  scale(2)

  translate(-240, -100, 0);
  normalMaterial();
  push();
  rotateZ(frameCount * 0.01);
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);
  plane(70);
  pop();

  translate(240, 0, 0);
  push();
  rotateZ(frameCount * 0.01);
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);
  box(70, 70, 70);
  pop();

  translate(240, 0, 0);
  push();
  rotateZ(frameCount * 0.01);
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);
  cylinder(70, 70);
  pop();

  translate(-240 * 2, 200, 0);
  push();
  rotateZ(frameCount * 0.01);
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);
  cone(70, 70);
  pop();

  translate(240, 0, 0);
  push();
  rotateZ(frameCount * 0.01);
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);
  torus(70, 20);
  pop();

  translate(240, 0, 0);
  push();
  rotateZ(frameCount * 0.01);
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);
  sphere(70);
  pop();

  Clock.tick(); // updates clock when trueTime is set to false
  Clock.display({ scale: 1, black: true }); // display time on top left of canvas

  Ink.capture(); // send screenshot of canvas to eInk

  pop()
}

Clock.onMinuteChange = function (event) {
  // other events examples: Clock.onSecondChange, Clock.onHourChange
  console.log("Minutes changed:", event.value);
};
