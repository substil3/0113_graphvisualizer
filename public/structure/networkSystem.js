import { logMessage } from "../scripts/console.js";
import { reconstructNextHop, dijkstra } from "./routing.js"
import { Edge } from "./edges.js"
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { loadConfig } from "./config.js";

const config = await loadConfig();

export class NetworkSystem {
  constructor(people, positionAttr, edgePoints, packetSystem) {
    this.people = people;
    this.player = this.people[this.people.length-1];
    this.numOfPeople = this.people.length;
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
    this.cost_refill_interval = config.PLAYER_COST_REFILL_TIME_INTERVAL;

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

    const { dist, prev } = dijkstra(source.id, this.people);
    for (let dest = 0; dest < this.people.length; dest++) {
      if (dest === source.id) continue;

      const nextHop = reconstructNextHop(source.id, dest, prev);

      if (nextHop !== null) {
        source.setRoute(dest, nextHop);
      }
    }
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
    if(this.clock % this.cost_refill_interval === 0) 
      this.player.costRefill();

    for(let person of this.people) {
      let personInfo = person.update();
      if(personInfo) {
        for(let [to, msg, type] of personInfo["msgs_to_send"]) {
          this.msgs_to_send.push([person.id, to, msg, type]);
        }
    }}
  }

  sendAllReservedPackets() {
    for(let [from, to, msg, type] of this.msgs_to_send) {
      if(from < 0 || from > this.numOfPeople-1 || to < 0 || to > this.numOfPeople-1) {
        logMessage(`invalid id : ${from}, ${to}`);
      } let initPos = new THREE.Vector3().fromBufferAttribute(this.positionAttr, from);

      this.packetSystem.spawn(from, to, initPos, msg, type)
      this.sentPacketNumber += 1;
    } this.msgs_to_send = []
  }

  updateClock() {
    this.clock += (this.simulationRunning);
  }

  maybeReservePacket() {
    if (this.clock % 5 != 0) return;
    if (!this.simulationRunning) return;
    if (this.sentPacketNumber >= config.SIMULATION_TOTAL_NUMBER_OF_PACKETS) return;
    if (Math.random() > config.SIMULATION_PACKET_SPAWN_PROBABILITY) return;

    //const [a, b] = edges[Math.floor(Math.random() * edges.length)];
    let a, b;
    do {
      a = Math.floor(Math.random() * (this.people.length-1));
      b = Math.floor(Math.random() * (this.people.length));
    } while (a === b)

    let pa = this.people[a];
    pa.notifyPacketToSend(b, pa.default_req_message);
  }

  notifyPlayerSendPacket(to, type) {
    this.player.sendPacket(to, type);
  }

  update() {
    if(!this.simulationRunning) return;

    this.updateClock();
    this.maybeReservePacket();
    this.updatePacketMovement();
    this.updatePeople();
    this.sendAllReservedPackets();

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
