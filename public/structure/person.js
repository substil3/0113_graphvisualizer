import { logMessage } from "../scripts/console.js";
import { loadConfig } from "./config.js";

const config = await loadConfig();

export class Person {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.adjs = new Set();
    this.neighbors = new Set();
    this.busy = {}

    this.routingTable = new Map();
    this.msgs_received = []
    this.msgs_to_send = []
    this.msgs_saved = new Set();

    this.default_req_message = "So you do have a mother!";
    this.default_ack_message = "Yes. I have literally two mothers.";

    this.clock = 0;
    //this.type = (Math.random() > 0.2 ? "NORMAL" : "MALICIOUS");
    this.type = "NORMAL";
    this.state = "ALIVE";

    this.sent_packets = 0;
    this.received_packets = 0;
    this.forwarded_packets = 0;

    this.dev_mode = false;
  }

  connect(otherId, weight) {
    this.adjs.add([otherId, weight]);
    this.busy[otherId] = false
    this.neighbors.add(otherId);
  }

  initRoutingTable() {
    this.routingTable = new Map();
  }

  setRoute(destinationId, nextHopId) {
    this.routingTable.set(destinationId, nextHopId);
  }

  getNextHop(destinationId) {
    return (this.routingTable.get(destinationId) != null ? this.routingTable.get(destinationId) : -1);
  }

  isEdgeNotBusy(hop) {
    return !this.busy[hop];
  }

  notifyEdgeBusy(hop) {
    this.busy[hop] = true;
  }

  notifyEdgeNotBusy(hop) {
    this.busy[hop] = false;
  }

  forwardPacketIfNotBusy(p, positionAttr) {
    if(this.state != "ALIVE") {
      p.initWaiting();
      return false;
    }

    const nextHop = p.nextHop;
    if(!this.neighbors.has(nextHop)) {
      logMessage(`Cannot Send Packet : not appropriate adjacent person id to route packet : ${nextHop}`);
      return false;
    }

    if(p.curHop != this.id) 
      throw Error("current hop id not fit with person id");

    if(this.isEdgeNotBusy(p.nextHop)) { 

      if(this.type == "INFECTED") {
        if(Math.random() > 0.5) {
          p.type = "VIRUS";
          p.message = this.default_virus_message;
      }}

      p.make_alive();  
      p.setEdgeMovement(positionAttr); 
      this.notifyEdgeBusy(p.nextHop);
    
      this.forwarded_packets += 1;
      return true;
    } else {
      p.initWaiting();
      return false;
    } 
  }

  notifyPacketReceived(senderId, senderName, message, type) {
    if(this.state != "ALIVE") return;

    if(this.dev_mode) logMessage(`${this.name} received a message from ${senderName} : ${message}`)
    this.msgs_received.push([senderId, message]);

    if(type == "REQ") {
      this.notifyPacketToSend(senderId, this.default_ack_message, "ACK");
    }
    if(type == "CURE") {
      this.revive();
    }
    if(type == "VIRUS") {
      this.infected(senderName)
    }
    if(type == "BROADCAST") {
      let broadcastMsg = message.split(":")[1]
      if(!this.msgs_saved.has(broadcastMsg)) { 
        this.msgs_saved.add(broadcastMsg); 
        for(let n of this.neighbors) {
          if(n === senderId) continue;
          this.notifyPacketToSend(n, this.default_broadcast_message, "BROADCAST");
        }
      }
    }

    this.received_packets += 1;
  }

  die(senderName) {
    if(this.dev_mode) logMessage(`${this.name} died due to a malicious virus from ${senderName}`);
    this.state = "DEAD";
    this.clock = 0;
  }

  infected(senderName) {
    if(this.type != "INFECTED") {
      if(this.dev_mode) logMessage(`${this.name} is infected due to a malicious virus from ${senderName}`);
      this.type = "INFECTED";
    }
    this.clock = 0;
  }

  revive() {
    if(this.dev_mode) logMessage(`${this.name} just revived`);
    this.state = "ALIVE";
    this.type = "NORMAL";
    this.clock = 0;
  }

  notifyPacketToSend(to, message, type = "REQ") {
    if(this.state != "ALIVE") return;

    if(this.type === "INFECTED") {
      message = this.default_virus_message;
      type = "VIRUS";
    }

    this.msgs_to_send.push([to, message, type])
    this.sent_packets += 1;
  }

  updateClock() {
    this.clock += 1;
    if(this.state === "DEAD" && this.clock >= config["PERSON_DEAD_STATE_TIME"]) 
      this.revive();
    if(this.type === "INFECTED" && this.clock >= config["PERSON_INFECTED_STATE_TIME"]) 
      this.revive();
  }

  update() {
    if(this.state != "ALIVE") {
      this.updateClock();
      return;
    }

    this.msgs_received = []
    let msgs_to_send = [...this.msgs_to_send]
    this.msgs_to_send = []
    this.updateClock();
    return {
      "msgs_to_send" : msgs_to_send
    }
  }

  forwardPacket(packet, positions, packetSystem) {
    const destinationId = packet.toNode;
    if (this.id === destinationId) {
      return;
    }

    const nextHop = this.getNextHop(destinationId);
    if (nextHop === undefined) {
      console.warn(
        `No route from ${this.id} to ${destinationId}, resolving route information`
      );
      this.resolveRoute(destinationId);
    }

    const startPos = positions[this.id];
    const endPos = positions[nextHop];

    packetSystem.spawn(
      this.id,
      nextHop,
      destination,
      startPos,
      endPos
    );
  }
  resolveRoute(destinationId, people) {
    if (this.routingTable.has(destinationId)) {
      return this.routingTable.get(destinationId);
    }

    const visited = new Set([this.id]);
    const queue = [this.id];
    const prev = new Map();

    while (queue.length) {
      const current = queue.shift();

      if (current === destinationId) break;

      for (const [neighbor, weight] of people[current].adjs) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          prev.set(neighbor, current);
          queue.push(neighbor);
        }
      }
    }

    if (!prev.has(destinationId)) {
      return undefined;
    }

    // reconstruct next hop
    let step = destinationId;
    while (prev.get(step) !== this.id) {
      step = prev.get(step);
      if (step === undefined) return undefined;
    }

    this.routingTable.set(destinationId, step);
    return step;
  }
}






