import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

import { createScene } from "./scene.js";
import { createNodes } from "./nodes.js";
import { createEdge } from "./edges.js";
import { enableMovement } from "./movement.js";
import { fetchPeople } from "./data.js";
import { createLabels, updateLabels } from "./labels.js";
import { logMessage } from "./console.js";

/* =============================
   Scene Setup
============================= */
const { scene, camera, renderer } = createScene();

/* =============================
   Load People (Server-Side Data)
============================= */
const people = await fetchPeople();

/* =============================
   Nodes (Points)
============================= */
const { points, geometry } = createNodes(people);
scene.add(points);

const selectedAttr = geometry.attributes.selected;
const positionAttr = geometry.attributes.position;

/* =============================
   Labels
============================= */
const labels = createLabels(people);

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

/* =============================
   Render Loop
============================= */
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  updateLabels(labels, geometry, camera, renderer);
}

animate();
