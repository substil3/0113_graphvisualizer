import { Packet } from "./packet.js";

const INIT = 0;
const ALIVE = 1;
const NEED_FORWARD = 2;
const FINISH = 3;

export class PacketSystem {
  constructor(scene, positionAttr) {
    this.scene = scene;
    this.positionAttr = positionAttr;
    this.packets = [];
    this.idCount = 0;
  }

  spawn(start, end, initPos = null) {
    const packet = new Packet(this.idCount, start, end, initPos);
    this.idCount += 1;
    this.scene.add(packet.mesh);
    this.packets.push(packet);
  }

  update(people) {

    let finished_packets = []

    /* =============================
      update each packet info : 
      init/change next hop if undefined, 
      move to next hop else
    ============================= */
    for (let p of this.packets) {
      if(p.state === INIT) {
        let curPerson = people[p.fromNode];
        p.nextHop = curPerson.getNextHop(p.toNode);
        p.make_alive();   p.set_edge_movement(this.positionAttr);

      } else if(p.state === NEED_FORWARD) {
        let curPerson = people[p.nextHop];
        p.curHop = p.nextHop;
        p.nextHop = curPerson.getNextHop(p.toNode);      
        p.make_alive();   p.set_edge_movement(this.positionAttr); 

      } else if(p.state === FINISH) {
        this.scene.remove(p.mesh);
        finished_packets.push([p.fromNode, p.toNode, p.message]);
      } 

      p.update(this.positionAttr);
    }


    this.packets = this.packets.filter(packet => {
      return packet.state != FINISH;
    });

    return {
      "finished_packets" : finished_packets
    }
  }
}
