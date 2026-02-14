import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

import { createScene, addEdgeOnScene } from "./scene.js";
import { createNodes, updateNodeStateFromNetwork } from "./nodes.js";
import { enableMovement } from "./movement.js";
import { createLabels, updateLabels } from "./labels.js";
import { logMessage } from "./console.js";
import { generateConnectedGraph } from "./graph.js";
import { setupSendPacketForm, setupSimulationButton, updateSimulationValues } from "./ui.js";
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
   Setup Backend Info - Init Network properties, Generate Nodes and Graph, Create Packet
============================= */
const people = createPeople(config["NUMBER_OF_PERSONS"]);
const {points, geometry, gridNodes} = createNodes(people);
const selectedAttr = geometry.attributes.selected;
const positionAttr = geometry.attributes.position;
const edges = generateConnectedGraph(gridNodes);
scene.add(points);
createLabels(people);

for (const edge of edges) {

    const startIndex = edge[0];
    const endIndex = edge[1];
    const weight = edge[2];
    
    people[startIndex].connect(endIndex, weight)
    people[endIndex].connect(startIndex, weight)
    
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
let selectedIndex = null;
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

/* =============================
   Picking Tolerance (Radius-Based)
============================= */
const POINT_SIZE = 15;
const toleranceRatio = 2.0;

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
   Pointer Interaction
============================= */

const tooltip = document.createElement("div");
tooltip.style.position = "absolute";
tooltip.style.pointerEvents = "none";
tooltip.style.padding = "6px 10px";
tooltip.style.background = "rgba(0,0,0,0.8)";
tooltip.style.color = "#fff";
tooltip.style.fontSize = "12px";
tooltip.style.borderRadius = "4px";
tooltip.style.display = "none";
tooltip.style.whiteSpace = "nowrap";
document.body.appendChild(tooltip);


renderer.domElement.addEventListener("mousemove", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(points);

  if (intersects.length > 0) {
    const index = intersects[0].index;
    const person = people[index]; 

    // ---- Tooltip content ----
    tooltip.innerHTML = `
      <b>${person.name}</b><br/>
      ID: ${person.id}<br/>
      Type: ${person.type}<br/>
      State: ${person.state}<br/>
      Sent: ${person.sent_packets}<br/>
      Received: ${person.received_packets}<br/>
      Forwarded: ${person.forwarded_packets}<br/>
    ` + (person.type == "PLAYER" ?
      `Health: ${person.health}<br/>
       Cost: ${person.cost}<br/>`
      : "");
    tooltip.style.display = "block";

    // ---- Convert 3D to screen position ----
    const pos = new THREE.Vector3();
    pos.fromBufferAttribute(
      points.geometry.getAttribute("position"),
      index
    );

    pos.project(camera);

    const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;

    tooltip.style.left = `${x + 3}px`;
    tooltip.style.top = `${y + 3}px`;

  } else {
    tooltip.style.display = "none";
  }

  /* 
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
    */
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

/* =============================
   initialize simulation factors
============================= */

setupSimulationButton(() => {
  networkSystem.runOrStopNetworkSimulation();
  if (networkSystem.simulationRunning) logMessage("simulation running")
  else logMessage("simulation stopped")
});

setupSendPacketForm((to) => {
  networkSystem.notifyPlayerSendPacket(to);

})

/* =============================
   Render Loop
============================= */
function animate() {
  requestAnimationFrame(animate);

  networkSystem.update();
  updateNodeStateFromNetwork(geometry, people);

  renderer.render(scene, camera);
  updateSimulationValues({
    clock: networkSystem.clock,
    sentPacketNumber: networkSystem.sentPacketNumber,
    receivedPacketNumber: networkSystem.receivedPacketNumber,
    abortedPacketNumber: networkSystem.abortedPacketNumber,
  });
}

animate();

