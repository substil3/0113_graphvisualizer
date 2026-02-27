import { logMessage } from "../scripts/console.js";
import { loadConfig } from "./config.js";
import { Person } from "./person.js";

const config = await loadConfig();

export class Player extends Person {
  constructor(id, name) {
    super(id, name)
    this.type = "PLAYER";

    this.default_req_message = "I'm a Hacker. Who Are You?";
    this.default_ack_message = "Confirmed. You Are Innocent.";
    this.default_cure_message = `You Are Not Idiot. Don't Kill Yourself. From ${this.name}`
    this.default_broadcast_message =`BROADCAST:${"YOUARENOTIDIOT"}`
    this.default_remote_message = `REMOTE:${"YOUARENOTIDIOT"}`;

    this.cost = config.PLAYER_INITIAL_COST;
    this.health = config.PLAYER_INITIAL_HEALTH;
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
      this.receivedACK(senderId, key);

      console.log(packet.header["total_travelled_weight"]);
      this.cost += Math.floor(config.PLAYER_COST_GAIN_RECEIVED_ACK_PER_WEIGHT
        * packet.header["total_travelled_weight"]);
    }

    if(type == "BROADCAST") {
      let [, broadcastMsg] = message.split(":");
      console.log(broadcastMsg)
      if(!this.msgs_saved.has(broadcastMsg)) {
        this.msgs_saved.add(broadcastMsg);
        for(let n of this.neighbors) {
          if(n === senderId) continue;
          this.notifyPacketToSend(n, broadcastMsg, "BROADCAST");
        }
      }
    }

    if(type == "VIRUS") {
      this.takeDamage(senderName)
    }

    this.received_packets += 1;
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

  notifyPacketToSend(to, message, type = "REQ", header = {}) {
    if(this.state != "ALIVE") return;
    if(type == "BROADCAST") {
      if(to != this.id) throw new Error(`player id not match : ${to}`);
      for(let n of this.neighbors) {
        this.msgs_to_send.push([n, message, type, header])
        this.sent_packets += 1;
      }
    } else {
      this.msgs_to_send.push([to, message, type, header])
      this.sent_packets += 1;
    }
  }

  sendPacket(to, type = "REQ", message = this.default_cure_message) {
    if(to === this.id) {
      logMessage('Cannot Send Packet : player itself')
      return;
    }
    if(this.cost < config.PLAYER_COST_SEND_PACKET[type]) {
      logMessage('Cannot Send Packet : insufficient cost to send');
      return;
    }

    const key = Math.floor(Math.random() * 10000);
    let header = {"key" : key};
    if(type === "CURE")  message = this.default_cure_message;
    if(type === "REQ")   message = this.default_req_message;
    if(type === "ACK")   message = this.default_ack_message;
    if(type === "BROADCAST") {
      to = this.id;
      message = this.default_broadcast_message + `${Math.floor(Math.random() * 10000)}`;
      console.log(message)
    } if(type === "REMOTE") {
      message = this.default_remote_message;
      type = "ACK";
      header += {"REMOTE" : "ON"};
    }
    this.cost -= config.PLAYER_COST_SEND_PACKET[type];
    this.notifyPacketToSend(to, message, type, header);
  }
}