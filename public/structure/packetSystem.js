import { Packet } from "./packet.js";

const INIT = 0;
const ALIVE = 1;
const NEED_FORWARD = 2;
const FINISH = 3;

export class PacketSystem {
  constructor(scene) {
    this.scene = scene;
    this.packets = [];
    this.idCount = 0;
  }

  spawn(start, end) {
    const packet = new Packet(this.idCount, start, end);
    this.idCount += 1;
    this.scene.add(packet.mesh);
    this.packets.push(packet);
  }

  update() {
    
    /* =============================
      update each packet info : 
      init/change next hop if undefined, 
      move to next hop else
    ============================= */
    for (let p of packets) {
      if(p.state === INIT) {
        curPerson = this.people[p.fromNode];
        p.nextHop = curPerson.getNextHop(p.toNode);
      } else if(p.state === NEED_FORWARD) {
        curPerson = this.people[p.nextHop];
        p.curHop = p.nextHop;
        p.nextHop = curPerson.getNextHop(p.toNode);        
      } else {
        this.scene.remove(packet.mesh);
      } 

      p.update();
    }


    this.packets = this.packets.filter(packet => {
      return packet.state != FINISH;
    });
  }
}
