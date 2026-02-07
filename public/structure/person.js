import { logMessage } from "../scripts/console.js";


export class Person {
  constructor(id, name, people) {
    this.id = id;
    this.name = name;
    this.adjs = new Set();
    this.busy = {}
    this.people = people;
    
    // destinationId -> nextHopId
    this.routingTable = new Map();
    this.msgs_received = []
    this.msgs_to_send = []

    this.default_req_message = "So you do have a mother!";
    this.default_ack_message = "Yes. I have literally two mothers.";
    this.default_virus_message = "Oops! You Are Infected." //TODO

    this.clock = 0;
    this.type = (Math.random() > 0.0 ? "NORMAL" : "NORMAL");
    this.state = "ALIVE"

  }

  connect(otherId) {
    this.adjs.add(otherId);
    this.busy[otherId] = false
  }

  setRoute(destinationId, nextHopId) {
    this.routingTable.set(destinationId, nextHopId);
  }

  getNextHop(destinationId) {
    return this.routingTable.get(destinationId);
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
    if(this.state != "ALIVE") return;
    
    if(p.curHop != this.id) 
      throw Error("current hop id not fit with person id");

    if(this.isEdgeNotBusy(p.nextHop)) { 

      if(this.type == "MALICIOUS") {
        if(Math.random() > 0.5) {
          p.type = "VIRUS";
          p.message = this.default_virus_message;
          p.speed *= 2;
        }
      }

      p.make_alive();  
      p.setEdgeMovement(positionAttr); 
      this.notifyEdgeBusy(p.nextHop);
      return true;
    } else {
      p.initWaiting();
      return false;
    } 
  }

  notifyPacketReceived(senderId, senderName, message, type) {
    if(this.state != "ALIVE") return;

    logMessage(`${this.name} received a message from ${senderName} : ${message}`)
    this.msgs_received.push([senderId, message]);

    if(type == "REQ") {
      this.notifyPacketToSend(senderId, this.default_ack_message, "ACK");
    }

    if(type == "VIRUS") {
      this.die(senderName)
    }
  }

  die(senderName) {
    logMessage(`${this.name} died because a malicious virus from ${senderName}`)
    this.state = "DEAD";
  }

  notifyPacketToSend(to, message, type = "REQ") {
    if(this.state != "ALIVE") return;

    this.msgs_to_send.push([to, message, type])
    console.log(to, message, type)
  }

  updateClock() {
    this.clock += 1;
  }

  update() {
    if(this.state != "ALIVE") return;

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

      for (const neighbor of people[current].adjs) {
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






