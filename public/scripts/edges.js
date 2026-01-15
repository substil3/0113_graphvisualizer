import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function createEdge(p1, p2) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    p1.clone(),
    p2.clone()
  ]);

  const material = new THREE.LineBasicMaterial({ color: 0xffffff });
  return new THREE.Line(geometry, material);
}

export class Edge {
  constructor(from, to, mesh) {
    this.from = from;
    this.to = to;
    this.mesh = mesh;

    this.busy = false;
    this.busyUntil = 0;
  }
}
