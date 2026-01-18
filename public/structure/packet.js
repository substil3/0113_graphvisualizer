import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export class Packet {
  constructor(start, end, speed = 1) {
    this.start = start.clone();
    this.end = end.clone();
    this.progress = 0;
    this.speed = speed;

    const geometry = new THREE.BufferGeometry().setFromPoints([this.start]);
    const material = new THREE.PointsMaterial({
      color: 0xff4444,
      size: 6,
      sizeAttenuation: false
    });

    this.mesh = new THREE.Points(geometry, material);
  }

  update() {
    this.progress += this.speed;
    if (this.progress >= 1) return false;
    
    const pos = this.start.clone().lerp(this.end, this.progress);
    this.mesh.geometry.setFromPoints([pos]);
    return true;
  }
}
