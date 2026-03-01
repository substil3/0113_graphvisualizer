import { logMessage } from "../scripts/console.js";
import { loadConfig } from "./config.js";
import { Person } from "./person.js";

const config = await loadConfig();

export class Hacker extends Person {
  constructor(id, name) {
    super(id, name);
    this.type = "MALICIOUS";
    this.exploit_cnt = 0;
    this.max_exploit_cnt = config.HACKER_MAX_EXPLOIT;

    this.default_req_message = "I'm a Hacker. Who Are You?";
    this.default_ack_message = "Confirmed. You Are Innocent.";
    this.default_virus_message = "You are an idiot! Hahaha.";

    this.health = config.HACKER_INITIAL_HEALTH;
  }

  notifyPacketReceived(packet) {
    const senderId = packet.fromNode;
    const senderName = packet.toNode;
    const message = packet.message;
    const type = packet.type;

    if(this.state != "ALIVE") return;

    if(this.dev_mode) logMessage(`${this.name} received a message from ${senderName} : ${message}`)
    this.msgs_received.push([senderId, message]);

    if(type == "REQ") {
      this.notifyPacketToSend(senderId, this.default_virus_message, "VIRUS");
    }
    if(type == "CURE") {
      this.takeDamage();
    }
    if(type == "VIRUS") {
      this.health += 0; //TODO
    }

    this.received_packets += 1;
  }

  takeDamage() {
    this.health -= 1;
    if(this.health <= 0) {
      logMessage(`Hacker ${this.name} died from your enourmous efforts.`);
      this.die();
    } else {
      logMessage(`Hacker ${this.name} took 1 damage from your attack`);
    }
  }

  forwardPacketIfNotBusy(p, positionAttr) {
    if (this.state != "ALIVE") {
      p.initWaiting();
      return false;
    }

    if (p.curHop != this.id)
      throw new Error("current hop id not fit with person id");

    if (this.isEdgeNotBusy(p.nextHop)) {
      p.type = "VIRUS";
      p.message = this.default_virus_message;
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
  notifyPacketToSend(to, message, type = "REQ") {
    if(this.state != "ALIVE") return;

    type = Math.random() > config.HACKER_CREATE_VIRUS_POSSIBILITY ? type : "VIRUS";
    message = this.default_virus_message;
    type = "VIRUS";
    let header = {
      "key" : -1, "BRAINWASH" : "ON"
    }
    this.msgs_to_send.push([to, message, type, header])
    this.sent_packets += 1;
  }

  exploit(to, message = this.default_virus_message, type = "VIRUS") {
    if(this.exploit_cnt >= this.max_exploit_cnt) return;
    this.exploit_cnt++;
    this.notifyPacketToSend(to, message, type)
  }
}
