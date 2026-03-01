import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

import { createScene, addEdgeOnScene} from "./scene.js";
import { createNodes, updateNodeStateFromNetwork } from "./nodes.js";
import { enableMovement } from "./movement.js";
import { logMessage } from "./console.js";
import { generateConnectedGraph } from "./graph.js";
import { setupSendPacketForm, setupSimulationButton, 
        updateSimulationValues, updatePlayerPanel,
        renderRoutingTableEditor, setupRoutingUpdateButton,
        putSenderId, putReceiverId,
        setupPacketTypeToggle} from "./ui.js";
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
const numOfPeople = config["NUMBER_OF_PERSONS"];
const people = createPeople(numOfPeople);
const playerId = numOfPeople-1;
let senderId = playerId;
let {points, geometry, gridNodes} = createNodes(people);
let selectedAttr = geometry.attributes.selected;
let positionAttr = geometry.attributes.position;
let edges = generateConnectedGraph(gridNodes);
scene.add(points);

console.log(edges)
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

const packetSystem = new PacketSystem(scene, positionAttr);
const networkSystem = new NetworkSystem(people, positionAttr, edges, packetSystem)

/* =============================
   Selection Helpers
============================= */
let selectedIndex = null;
function selectNode(index) {
  selectedAttr.array[index] = 1.0;
  //selectedAttr.needsUpdate = true;
}

function deselectNode(index) {
  selectedAttr.array[index] = 0.0;
  //selectedAttr.needsUpdate = true;
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
const toleranceRatio = 4.0;

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
      State: ${person.state}<br/>` +

      (config.SIMULATION_DEVELOPER_MODE ?
      `Type: ${person.type}<br/>
      Sent: ${person.sent_packets}<br/>
      Received: ${person.received_packets}<br/>
      Forwarded: ${person.forwarded_packets}<br/>` : "") +

      (person.type == "PLAYER" ?
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
});

renderer.domElement.addEventListener("click", (event) => {

  const rect = renderer.domElement.getBoundingClientRect();

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(points);
  if (hits.length === 0) return;

  const clickedIndex = hits[0].index;
  if(clickedIndex === selectedIndex) {
    deselectNode(selectedIndex)
  } else {
    if(clickedIndex != numOfPeople - 1) {
      deselectNode(selectedIndex);
      selectNode(clickedIndex);
      selectedIndex = clickedIndex;
      clearDisplayedPath(scene);  
      putReceiverId (clickedIndex);
    } else selectedIndex = clickedIndex;
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

renderer.domElement.addEventListener("contextmenu", (event) => {

  const rect = renderer.domElement.getBoundingClientRect();
  event.preventDefault();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(points);
  if (hits.length === 0) return;

  const clickedIndex = hits[0].index;
  
  if(networkSystem.returnPersonType(clickedIndex) != "PLAYER" &&
     networkSystem.returnPersonType(clickedIndex) != "REMOTE") return;
  senderId = clickedIndex;
  clearDisplayedPath(scene);
  putSenderId(clickedIndex);
});

let routeLines = [];

function clearDisplayedPath(scene) {
  routeLines.forEach((line) => scene.remove(line));
  routeLines.length = 0;
}

function displayRoutePath(scene, path) {

  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];

    const p1 = new THREE.Vector3().fromBufferAttribute(positionAttr, a);
    const p2 = new THREE.Vector3().fromBufferAttribute(positionAttr, b);

    const geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    const material = new THREE.LineBasicMaterial({ color: config.EDGE_PATH_COLOR });

    const line = new THREE.Line(geometry, material);
    routeLines.push(line);
    scene.add(line);
  }
}
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() !== "a") return;
  if (selectedIndex == null) return;

  const pathToSelectedNode = networkSystem.getRoutingPath(senderId, selectedIndex);

  if (!pathToSelectedNode) {
    logMessage("No valid route found.");
    return;
  }

  displayRoutePath(scene, pathToSelectedNode);
});
window.addEventListener("keyup", (event) => {
  clearDisplayedPath(scene);
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

[camera.position.x, camera.position.y, camera.position.z] = 
  new THREE.Vector3().fromBufferAttribute(positionAttr, playerId);
camera.position.z = 10;

/* =============================
   initialize simulation UIs
============================= */

setupSimulationButton(() => {
  networkSystem.runOrStopNetworkSimulation();
  if (networkSystem.simulationRunning) logMessage("simulation running")
  else logMessage("simulation stopped")
});

setupSendPacketForm((from, to, type) => {
  networkSystem.notifyPlayerSendPacket(from, to, type);
}, playerId)

renderRoutingTableEditor(networkSystem.player);
setupRoutingUpdateButton(networkSystem.player);
setupPacketTypeToggle();

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
    sentPacketNumber:   networkSystem.sentPacketNumber,
    receivedPacketNumber: networkSystem.receivedPacketNumber,
    abortedPacketNumber: networkSystem.abortedPacketNumber,
  });
  updatePlayerPanel({
    name: networkSystem.player.name,
    health: networkSystem.player.health,
    cost:  networkSystem.player.cost,
  })
}

animate();

