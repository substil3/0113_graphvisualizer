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
    this.dev_mode = false;
    this.clock = 0;
    this.cost_refill_interval = config.PLAYER_COST_REFILL_TIME_INTERVAL;

    this.msgs_to_send = [];
    this.sentPacketNumber = 0;
    this.receivedPacketNumber = 0;
    this.abortedPacketNumber = 0;

    this.rendered_person_state = {};

    for(let person of this.people) {
      if(person.type === "MALICIOUS")
        this.hacker = person;
    }

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

  getRoutingPath(start, end) {
    let pos = start;
    let path = [start];
    while(pos != end) {
      let nxt = this.people[pos].getNextHop(end);
      if(nxt === null) return;
      else {
        path.push(nxt);
        pos = nxt;
      }
    } return path;
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

  returnPersonType(personId) {
    return this.people[personId].type;
  }

  returnPersonState(personId) {
    return this.people[personId].state;
  }

  updatePacketMovement() {
    if(!this.simulationRunning) return;
    let packetSystemState = this.packetSystem.update(this.people, this.positionAttr);
   
    for(let fp of packetSystemState["finished_packets"]) {
      let toPerson = this.people[fp.toNode];
      toPerson.notifyPacketReceived(fp);
      this.receivedPacketNumber += 1;
    }

    for(let ap of packetSystemState["aborted_packets"]) {
      // TODO (let fromPerson to be notifyed that packet is aborted)
      let toPerson = this.people[fp.toNode];
      toPerson.notifyPacketAborted(ap);
      this.abortedPacketNumber += 1;
    }
  }

  updatePeople() {
    if(this.clock % this.cost_refill_interval === 0) 
      this.player.costRefill();

    for(let person of this.people) {
      let personInfo = person.update();
      if(personInfo) {
        for(let [to, msg, type, header] of personInfo["msgs_to_send"]) {
          this.msgs_to_send.push([person.id, to, msg, type, header]);
        }
    }}
  }

  sendAllReservedPackets() {
    for(let [from, to, msg, type, header] of this.msgs_to_send) {
      if(from < 0 || from > this.numOfPeople-1 || to < 0 || to > this.numOfPeople-1) {
        logMessage(`invalid id : ${from}, ${to}`);
      } let initPos = new THREE.Vector3().fromBufferAttribute(this.positionAttr, from);
      
      const key = header["key"];
      if(type === "REQ")
        this.people[from].addWaitingACK(to, key);
      this.packetSystem.spawn(from, to, initPos, msg, type, header)
      this.sentPacketNumber += 1;
    } this.msgs_to_send = []
  }

  updateClock() {
    this.clock += (this.simulationRunning);
  }

  maybeReservePacket() {
    if (this.clock % 20 != 0) return;
    if (!this.simulationRunning) return;
    if (this.sentPacketNumber >= config.SIMULATION_TOTAL_NUMBER_OF_PACKETS) return;
    if (this.dev_mode) return;
    if (Math.random() > config.SIMULATION_PACKET_SPAWN_PROBABILITY) return;

    //const [a, b] = edges[Math.floor(Math.random() * edges.length)];
    let a, b;
    do {
      a = Math.floor(Math.random() * (this.people.length-1));
      b = Math.floor(Math.random() * (this.people.length));
    } while (a === b || (this.returnPersonType(a) === "PLAYER") || (this.returnPersonType(b) === "PLAYER")
                     || (this.returnPersonType(a) === "MALICIOUS") || (this.returnPersonType(b) === "MALICIOUS")
                     || (this.returnPersonState(a) === "INFECTED") || (this.returnPersonState(b) === "INFECTED"));

    let pa = this.people[a];
    const key = Math.floor(Math.random() * 10000);
    pa.notifyPacketToSend(b, pa.default_req_message, "REQ", {"key" : key});
  }

  maybeReserveHackerPacket() {
    if (this.clock % 60 != 0) return;
    if (!this.simulationRunning) return;
    if (this.dev_mode) return;
    if (Math.random() > config.SIMULATION_PACKET_SPAWN_PROBABILITY) return;

    let vic = Math.floor(Math.random() * (this.people.length-1));
    this.hacker.exploit(vic);
  }

  notifyPlayerSendPacket(from, to, type) {
    if(from === this.player.id)
      this.player.sendPacket(to, type);
    else if(this.player.remote_child[from]) {
      const msg = this.player.default_req_message;
      this.player.sendPacket(to, type, msg, true, from);
    } else {
      logMessage(`Cannot Send Packet : sender Id must be player or remote controlled person`);
    }
  }

  update() {
    if(!this.simulationRunning) return;

    this.updateClock();
    this.maybeReservePacket();
    this.maybeReserveHackerPacket();
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
