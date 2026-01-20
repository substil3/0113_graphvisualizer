import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export class Packet {
  constructor(
    id,
    fromNode,
    toNode,
    finalDestination,
    startPos,
    endPos,
    speed = 0.05
  ) {
    this.id = id;

    this.fromNode = fromNode;
    this.toNode = toNode;
    this.finalDestination = finalDestination;

    this.start = startPos.clone();
    this.end = endPos.clone();

    this.direction = endPos.clone().sub(startPos).normalize();
    this.totalDistance = startPos.distanceTo(endPos);

    this.pos = startPos.clone();
    this.travelled = 0;
    this.speed = speed;

    const geometry = new THREE.BufferGeometry().setFromPoints([this.pos]);
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
