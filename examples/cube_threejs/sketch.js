import * as THREE from "https://unpkg.com/three/build/three.module.js";

var camera, scene, renderer;
var mesh;

var width = 2560;
var height = 1440;
var framesPerSecond = 1;

init();

var interval;
function startInterval() {
  interval = setInterval(animate, 1000 / framesPerSecond);
}

function init() {
  Clock.init({ date: new Date(), trueTime: false });

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height);

  const inkOptions = {
    dither: "bayer", //dithering: 'bayer', 'none', 'floyd-steinberg'
    invert: false, //invert frame: removes ghosting
    dimensions: [width, height], //portrait orientation: [1440, 2560]
    context: renderer.getContext(),
    loop: () => {
      startInterval();
    },
    noLoop: () => {
      clearInterval(interval);
    },
  };

  Ink.connect({ id: "Cube ThreeJS", options: inkOptions }); //connect to eInk via a server to display image

  camera = new THREE.PerspectiveCamera(70, width / height, 200, 600);
  camera.position.z = 400;

  scene = new THREE.Scene();

  var geometry = new THREE.BoxBufferGeometry(200, 200, 200);
  var material = new THREE.MeshDepthMaterial();

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  document.body.appendChild(renderer.domElement);

  startInterval();
}

function animate() {
  mesh.rotation.x += 0.05;
  mesh.rotation.y += 0.05;

  renderer.render(scene, camera);

  Clock.tick();
  Ink.capture();
}
