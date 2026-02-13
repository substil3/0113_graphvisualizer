import { logMessage } from "../scripts/console.js";
import { reconstructNextHop, dijkstra } from "./routing.js"
import { Edge } from "./edges.js"
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export class NetworkSystem {
  constructor(people, positionAttr, edgePoints, packetSystem) {
    this.people = people;
    this.positionAttr = positionAttr;
    this.edgePoints = edgePoints;
    this.edges = []
    this.initEdgeObjectsFromEdgePoints();
    this.packetSystem = packetSystem;
    this.getInitialRoutingTables = true;
    if (this.getInitialRoutingTables) 
      this.initRoutingTables();

    this.simulationRunning = false;
    this.clock = 0;

    this.msgs_to_send = [];
    this.sentPacketNumber = 0;
    this.receivedPacketNumber = 0;
    this.abortedPacketNumber = 0;

    this.rendered_person_state = {}

  }

  initEdgeObjectsFromEdgePoints() {
    for (const [from, to] of this.edgePoints) {
      this.edges.push(
        new Edge(
          from, to
        ))
    }
  }

initRoutingTables() {
  for (const source of this.people) {

    const { prev } = dijkstra(source.id, this.people);
    for (let dest = 0; dest < this.people.length; dest++) {
      if (dest === source.id) continue;

      const nextHop = reconstructNextHop(source.id, dest, prev);

      if (nextHop !== null) {
        source.setRoute(dest, nextHop);
      }
    }

    //console.log(source.routingTable);
  }
}

  runNetworkSimulation() {
    this.simulationRunning = true;
  }

  stopNetworkSimulation() {
    this.simulationRunning = false;
  }

  runOrStopNetworkSimulation() {
    if(!this.simulationRunning) this.runNetworkSimulation();
    else this.stopNetworkSimulation();
  }

  updatePacketMovement() {
    if(!this.simulationRunning) return;
    let packetSystemState = this.packetSystem.update(this.people, this.positionAttr);
   
    for(let [from, to, message, type] of packetSystemState["finished_packets"]) {
      let fromPerson = this.people[from];
      let toPerson = this.people[to];
      toPerson.notifyPacketReceived(from, fromPerson.name, message, type);
      this.receivedPacketNumber += 1;
    }

    for(let [from, to, message, type] of packetSystemState["aborted_packets"]) {
      // TODO (let fromPerson to be notifyed that packet is aborted)
      this.abortedPacketNumber += 1;
    }
  }

  updatePeople() {
    for(let person of this.people) {
      let personInfo = person.update();
      if(personInfo) {
        for(let [to, msg, type] of personInfo["msgs_to_send"]) {
          this.msgs_to_send.push([person.id, to, msg, type]);
        }
      }
    }
  }

  sendAllReservedPackets() {
    for(let [from, to, msg, type] of this.msgs_to_send) {
      let initPos = new THREE.Vector3().fromBufferAttribute(this.positionAttr, from);
      this.packetSystem.spawn(from, to, initPos, msg, type)
      this.sentPacketNumber += 1;
    } this.msgs_to_send = []
  }

  updateClock() {
    this.clock += (this.simulationRunning);
  }

  update() {
    this.updatePacketMovement();
    this.updatePeople();
    this.sendAllReservedPackets();
    this.updateClock();
    
    // information for updating scene
    let render_person_state = {};
    for(let person of this.people) {
      render_person_state[person.id] = person.state;
    }

    return {
      "render_person_state" : render_person_state
    }
  }
}
