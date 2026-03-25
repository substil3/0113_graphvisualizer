import { logMessage } from "../../scripts/console.js";
import { loadConfig } from "../config.js";
import { Person } from "./person.js";

const config = await loadConfig();

export class Player extends Person {
  constructor(id, name) {
    super(id, name)
    this.type = "PLAYER";

    this.default_cure_message = `You Are Not Idiot. Don't Kill Yourself. From ${this.name}`
    this.default_broadcast_message =`BROADCAST:${"YOUARENOTIDIOT"}`
    this.default_remote_message = `I'm Your New Mother. Pray For Me.`;

    this.cost = config.PLAYER_INITIAL_COST;
    this.health = config.PLAYER_INITIAL_HEALTH;

    this.remote_child = {};
  }

  forwardPacketIfNotBusy(p, positionAttr) {
    if(this.state != "ALIVE") {
      p.initWaiting();
      return false;}

    const nextHop = p.nextHop;
    if(!this.neighbors.has(nextHop)) {
      logMessage(`Cannot Send Packet : not appropriate adjacent person id to route packet : ${nextHop}`);
      return -1;
    }

    if(p.curHop != this.id) 
      throw Error("current hop id not fit with person id");

    if(this.isEdgeNotBusy(p.nextHop)) { 
      p.make_alive();  
      p.setEdgeMovement(positionAttr); 
      this.notifyEdgeBusy(p.nextHop);
      this.forwarded_packets += 1;
      this.cost += config.PLAYER_COST_GAIN_FORWARD_PACKET;
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
    if(this.type === "MALICIOUS") return;

    logMessage(`You received a message from ${senderName}, ${type} : ${message}`)
    this.msgs_received.push([senderId, message]);

    if(type == "REQ") {
      const key = header["key"];
      this.notifyPacketToSend(senderId, this.default_ack_message, "ACK", {"key" : key});
    }

    if(type == "ACK") {
      const key = header.key;

      console.log(packet.header["total_travelled_weight"]);
      this.cost += Math.floor(config.PLAYER_COST_GAIN_RECEIVED_ACK_PER_WEIGHT
        * packet.header["total_travelled_weight"]);

      if(header["remote"] === "ON") {
        const child_pointer = header["child-pointer"];
        this.establishRemoteControl(senderId, child_pointer);
        this.notifyPacketToSend(senderId, this.default_ack_message, 
          "ACK", {"key" : key, "remote" : "ON", "parent-pointer" : this});
      } else {
        this.receivedACK(senderId, key);
      }
    }

    if(type == "BROADCAST") {
      let [, broadcastMsg] = message.split(":");
      console.log(broadcastMsg)
      if(!this.msgs_saved.has(broadcastMsg)) {
        this.msgs_saved.add(broadcastMsg);
        for(let n of this.neighbors) {
          if(n === senderId) continue;
          this.notifyPacketToSend(n, message, "BROADCAST", header);
        }
      }
    }

    if(type == "VIRUS") {
      this.takeDamage(senderName)
    }

    this.received_packets += 1;
  }

  notifyPacketAborted(packet) {
    //super(packet);
    logMessage(`packet (id : ${packet.id}) to ${packet.toNode} is aborted by timeout`);
    this.cost += config.PLAYER_COST_SEND_PACKET[packet.type];
  }

  costRefill(refill = 1) {
    this.cost += refill;
  }

  takeDamage(senderName) {
    this.health -= 1;
    if(this.health <= 0) {
        this.die();
    } else {
        logMessage(`You took 1 damage due to a malicious virus from ${senderName}`);
    }
  }

  establishRemoteControl(child_id, child_pointer) {
    this.remote_child[child_id] = child_pointer;
  }

  notifyPacketToSend(to, message, type = "REQ", header = {}) {
    if(this.state != "ALIVE") return;
    if(type == "BROADCAST") {
      for(let n of this.neighbors) {
        this.msgs_to_send.push([n, message, type, header])
        this.sent_packets += 1;
      }
    } else {
      this.msgs_to_send.push([to, message, type, header])
      this.sent_packets += 1;
    }
  }

  sendPacket(to, type = "REQ", message = this.default_cure_message, remote = false, remote_id = null) {
    if(to === this.id) {
      logMessage('Cannot Send Packet : player itself')
      return;
    }
    if(this.cost < config.PLAYER_COST_SEND_PACKET[type]) {
      logMessage('Cannot Send Packet : insufficient cost to send');
      return;
    }
    this.cost -= config.PLAYER_COST_SEND_PACKET[type];
    const key = Math.floor(Math.random() * 10000);
    let header = {"key" : key};
    if(type === "CURE")  message = this.default_cure_message;
    if(type === "REQ")   message = this.default_req_message;
    if(type === "ACK")   message = this.default_ack_message;
    if(type === "BROADCAST") {
      to = -1;
      remote = false;
      message = this.default_broadcast_message + `${Math.floor(Math.random() * 10000)}`;
      console.log(message)
    } if(type === "REMOTE") {
      message = this.default_req_message;
      type = "REQ";
      header =  {...header, ...{"remote" : "ON"}};
      console.log(header);
    }
    
    if(remote) {
      const child = this.remote_child[remote_id];
      header = {...header, ...{"root" : this.id}};
      child.notifyPacketToSend(to, message, type, header);
    } else {
      this.notifyPacketToSend(to, message, type, header);
    }
  }
}