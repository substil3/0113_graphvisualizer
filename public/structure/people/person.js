import { logMessage } from "../../scripts/console.js";
import { loadConfig } from "../config.js";
import { convertNumberToString } from "../number.js";

const config = await loadConfig();

export class Person {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.adjs = new Set();
    this.neighbors = new Set();
    this.busy = {};

    this.routingTable = new Map();
    this.msgs_received = [];
    this.msgs_to_send = [];
    this.msgs_saved = new Set();
    this.waiting_resp = {};

    this.default_req_message = "So you do have a mother!";
    this.default_ack_message = "Yes. I have literally two mothers.";
    this.ack_message_unique_num = 2

    this.clock = 0;
    this.type = "NORMAL";
    this.state = "ALIVE";

    this.isRemote = false;
    this.remoteParent = null;

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
      logMessage(`Cannot forward packet : not appropriate adjacent person id to route : ${nextHop}`);
      return false;
    }

    if(p.curHop != this.id) 
      throw Error("current hop id not fit with person id");

    if(p.type == "CURE")
      this.revive();
    
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

  notifyPacketReceived(packet) {
    const senderId = packet.fromNode;
    const senderName = packet.toNode;
    const message = packet.message;
    const type = packet.type;
    const header = packet.header;

    if(this.state != "ALIVE") return;

    if(this.dev_mode) logMessage(`${this.name} received a message from ${senderName} : ${message}`)
    this.msgs_received.push([senderId, message]);

    if(type == "REQ") {
      const key = header["key"];
      if(header["remote"] === "ON" && !this.isRemote) {
        this.notifyPacketToSend(senderId, this.default_ack_message, "ACK", 
          {"key" : key, "remote" : "ON", "child-pointer" : this});
      } else {
        this.notifyPacketToSend(senderId, this.default_ack_message, "ACK", 
          {"key" : key});
      }
    }
    if(type == "ACK") {
      const key = header["key"];
      if(this.isRemote) {
        console.log(packet.header["total_travelled_weight"]);
        const parent = this.remoteParent;
        parent.cost += Math.floor(config.PLAYER_COST_GAIN_RECEIVED_ACK_PER_WEIGHT
          * packet.header["total_travelled_weight"]);

        if(header["remote"] === "ON") {
          const child_pointer = header["child-pointer"];
          parent.establishRemoteControl(senderId, child_pointer);
          this.ack_message_unique_num += 1;
          this.default_ack_message = `Yes. I have literally 
                                      ${convertNumberToString[this.ack_message_unique_num]} mothers.`
          this.notifyPacketToSend(senderId, this.default_ack_message, 
            "ACK", {"key" : key, "remote" : "ON", "parent-pointer" : parent});
          this.receivedACK(senderId, key);
        }
      } 
      else if(header["remote"] === "ON") {
        const parent_pointer = header["parent-pointer"];
        this.revive();
        this.enterRemoteState(parent_pointer);
      } else {
        this.receivedACK(senderId, key);
      }
    }
    if(type == "CURE") {
      this.revive();
    }
    if(type == "VIRUS") {
      this.infected(senderName)
    }
    if(type == "BROADCAST") {
      let [, broadcastMsg] = message.split(":")
      if(!this.msgs_saved.has(broadcastMsg)) { 
        this.msgs_saved.add(broadcastMsg); 
        for(let n of this.neighbors) {
          if(n === senderId) continue;
          this.notifyPacketToSend(n, message, "BROADCAST", header);
        }
      }
    }

    this.received_packets += 1;
  }

  notifyPacketToSend(to, message, type = "REQ", header = {}) {
    console.log(to, message, type)
    if(this.state != "ALIVE") return;
    if(type == "BROADCAST") {
      for(let n of this.neighbors) {
        this.msgs_to_send.push([n, message, type, header])
        this.sent_packets += 1;
      }} 
    else {
      this.msgs_to_send.push([to, message, type, header])
      this.sent_packets += 1;
    }
    if(this.type === "INFECTED") {
      message = this.default_virus_message;
      type = "VIRUS";
    }
  }

  notifyPacketAborted(packet) {
    const senderId = packet.fromNode;
    const key = packet.header["key"];
    if(!this.waiting_resp[senderId]) return;
    if(!this.waiting_resp[senderId].has(key)) return;
    this.waiting_resp[senderId].delete(key);
  }

  addWaitingACK(receiverId, key) {
    if(this.waiting_resp[receiverId] == null)
      this.waiting_resp[receiverId] = new Set([key]);
    else
      this.waiting_resp[receiverId].add(key);
  }

  receivedACK(senderId, key) {
    if(!this.waiting_resp[senderId]) 
      throw new Error(`error : sender ID not found from ACK waiting queue : ${senderId}`);
    if(!this.waiting_resp[senderId].has(key)) 
      throw new Error(`error : sender key not found from ACK waiting queue : ${senderId} -> ${key}`);
    this.waiting_resp[senderId].delete(key);
  }

  updateClock() {
    this.clock += 1;
    if(this.state === "DEAD" && this.clock >= config["PERSON_DEAD_STATE_TIME"]) 
      this.revive();
    if(this.type === "INFECTED" && this.clock >= config["PERSON_INFECTED_STATE_TIME"]) 
      this.revive();
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
    this.type = this.isRemote ? "REMOTE" : "NORMAL";
    this.clock = 0;
  }

  enterRemoteState(parent_pointer) {
    this.state = "ALIVE";
    this.type = "REMOTE";
    this.isRemote = true;
    this.remoteParent = parent_pointer;
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
    };
  }
}
