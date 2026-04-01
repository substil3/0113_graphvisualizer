import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { logMessage } from "../scripts/ui.js";
import {INIT, ALIVE, NEED_FORWARD, WAIT_SEND, FINISH, ABORT, REMOVED}  from "./config.js"
import { loadConfig } from "./config.js";

const config = await loadConfig();

function calculateWeight(x, passed_nodes) {
  return Math.pow(x, 1.25 + Math.exp(1-x)) * Math.log2(x/(passed_nodes+1) + 2);
}

export class Packet {
  constructor(id, fromNode, toNode, initPos = null, message, type, header = null, speed = 0.04) {
    this.id = id;
    this.type = type;
    this.state = INIT;
    this.fromNode = fromNode;
    this.toNode = toNode;
    this.curHop = fromNode;
    this.nextHop = null;
    this.message = message;
    this.header = {...{
      "passed_nodes" : 0,
      "total_travelled_weight" : 0
    }, ...header};

    /* =======================================================
      for unit edge movement (should be reset when forwarded)
    ======================================================= */
    this.travelled = 0;
    this.speed = speed;
    this.pos = initPos;
    this.curHopPos = null;
    this.nextHopPos = null;
    switch(this.type) {
      case "REQ":
        this.color = config.PACKET_REQ_COLOR; break;
      case "ACK":
        this.color = config.PACKET_ACK_COLOR; break;
      case "VIRUS":
        this.color = config.PACKET_VIRUS_COLOR; break;
      case "CURE":
        this.color = config.PACKET_CURE_COLOR; break;
      case "BROADCAST":
        this.color = config.PACKET_BROADCAST_COLOR; break;
      default:
        throw new Error("invalid packet type");
    }

    this.waitingTimeInterval = 0;
    this.totalWaitingTime = 0;

    const geometry = new THREE.BufferGeometry().setFromPoints([this.pos]);
    const material = new THREE.PointsMaterial({
      color: this.color,
      size: 6,
      sizeAttenuation: false
    });

    this.mesh = new THREE.Points(geometry, material);
  }

  make_alive() {
    this.waitingTimeInterval = 0;
    this.totalWaitingTime = 0;
    this.state = ALIVE;
    //console.log(`packet ${this.id} : made to be alive`)
  }

  make_abort() {
    this.state = ABORT;
    //console.log(`packet ${this.id} : aborted due to timeout`) 
  }

  initWaiting() {
    this.waitingTimeInterval = 0;
    this.state = WAIT_SEND;
  }

  wait_unit_time() {
    this.waitingTimeInterval += 1;
    this.totalWaitingTime += 1;
  }

  increase_passing_numbers() {
    this.header["passed_nodes"] += 1;
  }

  setEdgeMovement(positionAttr) {
    this.travelled = 0;
    this.curHopPos = new THREE.Vector3().fromBufferAttribute(positionAttr, this.curHop);
    this.nextHopPos = new THREE.Vector3().fromBufferAttribute(positionAttr, this.nextHop);
    
    this.direction = this.nextHopPos ? this.nextHopPos.clone().sub(this.curHopPos).normalize() : null;
    this.edgeWeight = this.nextHopPos ? this.curHopPos.distanceTo(this.nextHopPos) : null;
  }

  update() {
    if(this.state === WAIT_SEND) 
      this.wait_unit_time();
  
    if(!(this.state === ALIVE) || !this.pos) 
      return;

    this.pos.addScaledVector(this.direction, this.speed);
    this.travelled += this.speed;

    if (this.travelled >= this.edgeWeight) {
      this.mesh.geometry.setFromPoints([this.nextHopPos]);
      if (this.nextHop === this.toNode) {
        //logMessage(`packet ${this.id} reached destination : ${this.toNode}`)
        this.state = FINISH;
      } else {
        this.state = NEED_FORWARD;
      } 
      this.header["total_travelled_weight"] += calculateWeight(this.edgeWeight, this.header["passed_nodes"]);
    } else {
      this.mesh.geometry.setFromPoints([this.pos]);
    }

    return true;
  }
}

