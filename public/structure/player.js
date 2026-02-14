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

    this.cost = config.PLAYER_INITIAL_COST;
    this.health = config.PLAYER_INITIAL_HEALTH;
  }

  forwardPacketIfNotBusy(p, positionAttr) {
    if(this.state != "ALIVE") {
      p.initWaiting();
      return false;
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

  notifyPacketReceived(senderId, senderName, message, type) {
    if(this.state != "ALIVE") return;
    if(this.type === "MALICIOUS") return;

    logMessage(`You received a message from ${senderName} : ${message}`)
    this.msgs_received.push([senderId, message]);

    if(type == "REQ") {
      this.notifyPacketToSend(senderId, this.default_ack_message, "ACK");
    }

    if(type == "VIRUS") {
      this.takeDamage(senderName)
    }

    this.received_packets += 1;
  }

  takeDamage(senderName) {
    this.health -= 1;
    if(this.health <= 0) {
        this.die();
    } else {
        logMessage(`You took 1 damage due to a malicious virus from ${senderName}`);
    }
  }

  notifyPacketToSend(to, message, type = "REQ") {
    if(this.state != "ALIVE") return;

    this.msgs_to_send.push([to, message, type])
    this.sent_packets += 1;
  }

  sendPacket(to, message = this.default_req_message, type = "REQ") {
    if(this.cost < config.PLAYER_COST_SEND_PACKET) {
      logMessage('insufficient cost to send packet');
      return;
    }
    this.cost -= config.PLAYER_COST_SEND_PACKET;
    this.notifyPacketToSend(to, message, type);
  }
}