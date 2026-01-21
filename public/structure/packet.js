import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const INIT = 0;
const ALIVE = 1;
const NEED_FORWARD = 2;
const FINISH = 3;

export class Packet {
  constructor(id, fromNode, toNode, speed = 0.05) {
    this.id = id;
    this.state = INIT;
    this.fromNode = fromNode;
    this.toNode = toNode;
    this.curHop = null;
    this.nextHop = null;

    //this.start = startPos.clone();
    //this.end = endPos.clone();

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

  finish_init() {
    this.state = ALIVE;
  }

  update() {
    if(!this.nextHop) return;
    this.pos.addScaledVector(this.direction, this.speed);
    this.travelled += this.speed;

    if (this.travelled >= this.totalDistance) {
      this.mesh.geometry.setFromPoints([this.end]);
      if (this.nextHop === this.toNode) {
        this.state = FINISH;
      } else {
        this.state = NEED_FORWARD;
      }
    }

    this.mesh.geometry.setFromPoints([this.pos]);
    return true;
  }
}

