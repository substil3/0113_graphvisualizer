import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

import { createScene, addEdgeOnScene } from "./scene.js";
import { createNodes, updateNodeStateFromNetwork } from "./nodes.js";
import { enableMovement } from "./movement.js";
import { createLabels, updateLabels } from "./labels.js";
import { logMessage } from "./console.js";
import { generateConnectedGraph } from "./graph.js";
import { setupSimulationButton, updateSimulationValues } from "./ui.js";
import { createPeople } from "../structure/personSystem.js";
import { PacketSystem } from "../structure/packetSystem.js";
import { NetworkSystem } from "../structure/networkSystem.js";
import { loadConfig } from "./config.js";

const config = await loadConfig();

/* =============================
   Scene Setup
============================= */
const { scene, camera, renderer } = createScene();

/* =============================
   Load People (Local Data)
============================= */
const people = createPeople(config["NUMBER_OF_PERSONS"]);

/* =============================
   Setup Backend Info - Init Network properties, Generate Nodes and Graph, Create Packet
============================= */

const {points, geometry, gridNodes} = createNodes(people);
const edges = generateConnectedGraph(gridNodes);
const selectedAttr = geometry.attributes.selected;
const positionAttr = geometry.attributes.position;
scene.add(points);
createLabels(people);

for (const edge of edges) {

    const startIndex = edge[0];
    const endIndex = edge[1];
    
    people[startIndex].connect(endIndex)
    people[endIndex].connect(startIndex)
    
    const p1 = new THREE.Vector3().fromBufferAttribute(positionAttr, startIndex);
    const p2 = new THREE.Vector3().fromBufferAttribute(positionAttr, endIndex);

    scene.add(addEdgeOnScene(p1, p2));

    logMessage(
      `${people[startIndex].name} and ${people[endIndex].name} is connected.`
    );
} 

const packetSystem = new PacketSystem(scene, positionAttr); //TODO
const networkSystem = new NetworkSystem(people, positionAttr, edges, packetSystem)

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
const POINT_SIZE = 15;
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
  console.log(clickedIndex)

  if (selectedIndex === null) {
    selectedIndex = clickedIndex;
    selectNode(clickedIndex);
  } else if (selectedIndex !== clickedIndex) {
    deselectNode(selectedIndex);

    const p1 = new THREE.Vector3().fromBufferAttribute(positionAttr, selectedIndex);
    const p2 = new THREE.Vector3().fromBufferAttribute(positionAttr, clickedIndex);

    scene.add(addEdgeOnScene(p1, p2));

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


setupSimulationButton(() => {
  networkSystem.runOrStopNetworkSimulation();
  if (networkSystem.simulationRunning) logMessage("simulation running")
  else logMessage("simulation stopped")
});

function maybeSendPacket() {
  if (!networkSystem.simulationRunning) return;
  if (Math.random() > config.SIMULATION_PACKET_SPAWN_PROBABILITY) return;

  //const [a, b] = edges[Math.floor(Math.random() * edges.length)];
  let a, b;
  do {
    a = Math.floor(Math.random() * people.length);
    b = Math.floor(Math.random() * people.length);
  } while (a === b)

  let pa = people[a];
  pa.notifyPacketToSend(b, pa.default_req_message);
}

/* =============================
   Render Loop
============================= */
function animate() {
  requestAnimationFrame(animate);

  networkSystem.update();
  updateNodeStateFromNetwork(geometry, people);

  maybeSendPacket();

  renderer.render(scene, camera);
  updateSimulationValues({
    clock: networkSystem.clock,
    sentPacketNumber: networkSystem.sentPacketNumber,
    receivedPacketNumber: networkSystem.receivedPacketNumber,
    abortedPacketNumber: networkSystem.abortedPacketNumber,
  });
}

animate();

