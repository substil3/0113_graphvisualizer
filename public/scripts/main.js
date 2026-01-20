import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

import { createScene } from "./scene.js";
import { createNodes } from "./nodes.js";
import { createEdge } from "./edges.js";
import { enableMovement } from "./movement.js";
import { createLabels, updateLabels } from "./labels.js";
import { logMessage } from "./console.js";
import { generateConnectedGraph } from "./graph.js";
import { setupSimulationButton } from "./ui.js";
import { createPeople } from "../structure/personSystem.js";
import { PacketSystem } from "../structure/packetSystem.js";


/* =============================
   Scene Setup
============================= */
const { scene, camera, renderer } = createScene();

/* =============================
   Load People (Local Data)
============================= */
const people = createPeople();

/* =============================
   Setup Simulation - Generate Nodes and Graph, Create Packet
============================= */
const {points, geometry, gridNodes} = createNodes(people);
const edges = generateConnectedGraph(gridNodes);
const packetSystem = new PacketSystem(scene); //TODO
scene.add(points);

const selectedAttr = geometry.attributes.selected;
const positionAttr = geometry.attributes.position;

for (const edge of edges) {

    const startIndex = edge[0];
    const endIndex = edge[1];
    
    people[startIndex].connect(endIndex)
    people[endIndex].connect(startIndex)
    
    const p1 = new THREE.Vector3().fromBufferAttribute(positionAttr, startIndex);
    const p2 = new THREE.Vector3().fromBufferAttribute(positionAttr, endIndex);

    scene.add(createEdge(p1, p2));

    logMessage(
      `${people[startIndex].name} and ${people[endIndex].name} is connected.`
    );
}

/* =============================
   Selection Helpers
============================= */
function selectNode(index) {
  selectedAttr.array[index] = 1.0;
  selectedAttr.needsUpdate = true;
}

function deselectNode(index) {
  selectedAttr.array[index] = 0.0;
  selectedAttr.needsUpdate = true;
}

/* =============================
   Raycasting / Picking
============================= */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let selectedIndex = null;

/* =============================
   Picking Tolerance (Radius-Based)
============================= */
const POINT_SIZE = 12;
const toleranceRatio = 1.0;

function pointPixelRadiusToWorld(camera, renderer, pixelRadius) {
  const viewHeight = camera.top - camera.bottom;
  const screenHeight = renderer.domElement.height;
  return (pixelRadius * viewHeight) / screenHeight;
}

function updatePickingTolerance() {
  raycaster.params.Points.threshold =
    pointPixelRadiusToWorld(camera, renderer, POINT_SIZE / 2) *
    toleranceRatio;
}

updatePickingTolerance();
window.addEventListener("resize", updatePickingTolerance);

/* =============================
   Pointer Interaction (Left Click)
============================= */
renderer.domElement.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return; // left mouse only

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(points);

  if (hits.length === 0) return;

  const clickedIndex = hits[0].index;

  if (selectedIndex === null) {
    selectedIndex = clickedIndex;
    selectNode(clickedIndex);
  } else if (selectedIndex !== clickedIndex) {
    deselectNode(selectedIndex);

    const p1 = new THREE.Vector3().fromBufferAttribute(positionAttr, selectedIndex);
    const p2 = new THREE.Vector3().fromBufferAttribute(positionAttr, clickedIndex);

    scene.add(createEdge(p1, p2));

    logMessage(
      `${people[selectedIndex].name} and ${people[clickedIndex].name} is connected.`
    );

    console.log(people[selectedIndex])

    selectedIndex = null;
  }
});

/* =============================
   Camera Movement (Pan / Zoom)
============================= */
enableMovement({
  camera,
  renderer,
  minZoom: 0.5,
  maxZoom: 5.0
});



let simulationRunning = false;

setupSimulationButton(() => {
  simulationRunning = true;
  logMessage("simulation running")
});

/* =============================
   Render Loop (TODO)
============================= */
function maybeSendPacket() {
  if (!simulationRunning) return;
  if (Math.random() > 0.05) return;

  const [a, b] = edges[Math.floor(Math.random() * edges.length)];
  console.log(a, b)
  const p1 = new THREE.Vector3().fromBufferAttribute(
    geometry.attributes.position, a
  );
  const p2 = new THREE.Vector3().fromBufferAttribute(
    geometry.attributes.position, b
  );
  console.log(p1, p2)
  packetSystem.spawn(p1, p2);
}

function animate() {
  requestAnimationFrame(animate);
  packetSystem.update()
  maybeSendPacket();

  renderer.render(scene, camera);
}

animate();

