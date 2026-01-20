import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export class Packet {
  constructor(id, fromNode, toNode, startPos, endPos, speed = 0.05) {
    this.id = id;

    this.fromNode = fromNode;
    this.toNode = toNode;

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
    this.pos.addScaledVector(this.direction, this.speed);
    this.travelled += this.speed;

    if (this.travelled >= this.totalDistance) {
      this.mesh.geometry.setFromPoints([this.end]);
      return false; // reached next node
    }

    this.mesh.geometry.setFromPoints([this.pos]);
    return true;
  }
}

