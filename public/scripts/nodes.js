import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
//import config from '../config.json' assert{ type: "json"}
import { loadConfig } from "./config.js";
const config = await loadConfig();

export function createNodes(people) {
  const count = people.length;

  const positions = new Float32Array(count * 3);
  const selected = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3]     = THREE.MathUtils.randFloatSpread(14);
    positions[i * 3 + 1] = THREE.MathUtils.randFloatSpread(14);
    positions[i * 3 + 2] = 0;
    selected[i] = 0.0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("selected", new THREE.BufferAttribute(selected, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      baseColor: { value: new THREE.Color(config.BASE_COLOR) },
      selectedColor: { value: new THREE.Color(config.SELECTED_COLOR) },
      size: { value: config.POINT_SIZE }
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

  return {
    points: new THREE.Points(geometry, material),
    geometry
  };
}
