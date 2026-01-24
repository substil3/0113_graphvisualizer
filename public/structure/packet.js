import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { logMessage } from "../scripts/console.js";
import {INIT, ALIVE, NEED_FORWARD, FINISH, REMOVED}  from "./config.js"

export class Packet {
  constructor(id, fromNode, toNode, initPos = null, message = "So you do have a mother!", speed = 0.15) {
    this.id = id;
    this.state = INIT;
    this.fromNode = fromNode;
    this.toNode = toNode;
    this.curHop = fromNode;
    this.nextHop = null;
    this.message = message;

    /* =======================================================
      for unit edge movement (should be reset when forwarded)
    ======================================================= */
    this.travelled = 0;
    this.speed = speed;
    this.pos = initPos;
    this.curHopPos = null;
    this.nextHopPos = null;

    const geometry = new THREE.BufferGeometry().setFromPoints([this.pos]);
    const material = new THREE.PointsMaterial({
      color: 0xff4444,
      size: 6,
      sizeAttenuation: false
    });

    this.mesh = new THREE.Points(geometry, material);
  }

  make_alive() {
    this.state = ALIVE;
    //console.log(`packet ${this.id} : made to be alive`)
  }

  set_edge_movement(positionAttr) {
    this.travelled = 0;
    this.curHopPos = new THREE.Vector3().fromBufferAttribute(positionAttr, this.curHop);
    this.nextHopPos = new THREE.Vector3().fromBufferAttribute(positionAttr, this.nextHop);
    
    this.direction = this.nextHopPos ? this.nextHopPos.clone().sub(this.curHopPos).normalize() : null;
    this.totalDistance = this.nextHopPos ? this.curHopPos.distanceTo(this.nextHopPos) : null;
    //logMessage(`packet ${this.id} forwarded to ${this.nextHop}`);
  }

  update() {
    if(!(this.state === ALIVE) || !this.pos) return;
    this.pos.addScaledVector(this.direction, this.speed);
    this.travelled += this.speed;

    if (this.travelled >= this.totalDistance) {
      this.mesh.geometry.setFromPoints([this.nextHopPos]);
      if (this.nextHop === this.toNode) {
        //logMessage(`packet ${this.id} reached destination : ${this.toNode}`)
        this.state = FINISH;
      } else {
        this.state = NEED_FORWARD;
      }
    } else {
      this.mesh.geometry.setFromPoints([this.pos]);
    }

    return true;
  }
}

