import { Packet } from "./packet.js";
import { INIT, ALIVE, NEED_FORWARD, FINISH, REMOVED }  from "./config.js";


export class PacketSystem {
  constructor(scene, positionAttr) {
    this.scene = scene;
    this.positionAttr = positionAttr;
    this.packets = [];
    this.idCount = 0;
  }

  spawn(start, end, initPos = null, message = "So you do have a mother!", type = "REQ") {
    const packet = new Packet(this.idCount, start, end, initPos, message, type);
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
        console.log([p.fromNode, p.toNode, p.message]);
        finished_packets.push([p.fromNode, p.toNode, p.message, p.type]);
        p.state = REMOVED;
      } 

      p.update(this.positionAttr);
    }

    this.packets = this.packets.filter(p => {
      return p.state != REMOVED;
    });

    return {
      "finished_packets" : finished_packets
    }
  }
}
