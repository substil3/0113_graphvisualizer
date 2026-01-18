import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { loadConfig } from "./config.js";

const config = await loadConfig();

/* ============================================================
   Grid utilities
   ============================================================ */

function gridKey(x, y) {
  return `${x},${y}`;
}

function gridDistanceSq(a, b) {
  const dx = a.gx - b.gx;
  const dy = a.gy - b.gy;
  return dx * dx + dy * dy;
}

function gridToWorld(gx, gy, cellSize, width, height) {
  // center grid at origin
  const ox = (width * cellSize) / 2;
  const oy = (height * cellSize) / 2;

  return {
    x: gx * cellSize + cellSize * 0.5 - ox,
    y: gy * cellSize + cellSize * 0.5 - oy
  };
}

/* ============================================================
   Node generation
   ============================================================ */

export function createNodes(people) {
  const count = people.length;

  if (count > config.GRID_WIDTH * config.GRID_HEIGHT) {
    throw new Error("Grid too small for number of nodes");
  }

  const positions = new Float32Array(count * 3);
  const selected  = new Float32Array(count);

  const {
    GRID_CELL_SIZE,
    GRID_WIDTH,
    GRID_HEIGHT,
    SCENE_NODES_MIN_DISTANCE,
    SCENE_NODES_CONNECTED_MAX_DISTANCE
  } = config;

  const minDistSq   = SCENE_NODES_MIN_DISTANCE ** 2;

  const occupied = new Set();
  const nodes = []; // { gx, gy }

  /* ---------- place nodes on grid ---------- */

  for (let i = 0; i < count; i++) {
    let placed = false;

    for (let attempt = 0; attempt < 1000; attempt++) {
      const gx = Math.floor(Math.random() * GRID_WIDTH);
      const gy = Math.floor(Math.random() * GRID_HEIGHT);

      if (occupied.has(gridKey(gx, gy))) continue;

      let valid = true;
      for (const n of nodes) {
        if (gridDistanceSq({ gx, gy }, n) < minDistSq) {
          valid = false;
        }
      }
      if (!valid && attempt != 1000-1) continue;

      occupied.add(gridKey(gx, gy));
      nodes.push({ gx, gy });

      const { x, y } = gridToWorld(
        gx,
        gy,
        GRID_CELL_SIZE,
        GRID_WIDTH,
        GRID_HEIGHT
      );

      positions[i * 3]     = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = 0;
      selected[i] = 0.0;

      placed = true;
      if (!valid) {
        console.warn(`Failed to place node ${i} respecting grid constraints`);}
      break;
    }
  }

  /* ---------- build Three.js geometry ---------- */

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("selected", new THREE.BufferAttribute(selected, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      baseColor:     { value: new THREE.Color(config.BASE_COLOR) },
      selectedColor: { value: new THREE.Color(config.SELECTED_COLOR) },
      size:          { value: config.POINT_SIZE }
    },
    vertexShader: `
      attribute float selected;
      varying float vSelected;
      uniform float size;

      void main() {
        vSelected = selected;
        gl_PointSize = size;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 baseColor;
      uniform vec3 selectedColor;
      varying float vSelected;

      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        if (length(c) > 0.5) discard;

        vec3 color = mix(baseColor, selectedColor, vSelected);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });

  /* ---------- output ---------- */
  return {
    points: new THREE.Points(geometry, material),
    geometry,
    gridNodes: nodes      // grid coordinates (gx, gy)
  };
}
