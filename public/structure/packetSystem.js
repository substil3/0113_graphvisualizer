import { Packet } from "./packet.js";
import { INIT, ALIVE, NEED_FORWARD, WAIT_SEND, FINISH, REMOVED, ABORT }  from "./config.js";
import { loadConfig } from "./config.js";

const config = await loadConfig();

export class PacketSystem {
  constructor(scene, positionAttr) {
    this.scene = scene;
    this.positionAttr = positionAttr;
    this.packets = [];
    this.idCount = 0;
  }

  spawn(start, end, initPos = null, message = "So you do have a mother!", type = "REQ", header = null) {
    const packet = new Packet(this.idCount, start, end, initPos, message, type, header);
    this.idCount += 1;
    this.scene.add(packet.mesh);
    this.packets.push(packet);
  }

  update(people) {

    let finished_packets = [];
    let aborted_packets = [];

    /* =============================
      update each packet info : 
      init/change next hop if undefined, 
      move to next hop else
    ============================= */
    for (let p of this.packets) {

      if(p.state === INIT) {
        let curPerson = people[p.fromNode];
        p.nextHop = curPerson.getNextHop(p.toNode);
      
        if(p.nextHop === -1) {
          logMessage(`Cannot Send Packet : could not find routing destination: ${p.toNode}`);
          p.state = ABORT;
          continue;
        }
        let isForwarded = curPerson.forwardPacketIfNotBusy(p, this.positionAttr)
        if(isForwarded === -1) {
          p.state = ABORT;
          continue;
        }

        // notify the edge to be busy to next hop person
        // this corresponds to slight voltage change of each person's carrier in real environment
        if(isForwarded) {
          p.increase_passing_numbers();
          people[p.nextHop].notifyEdgeBusy(p.fromNode);
        }

      } else if(p.state === NEED_FORWARD) {
        
        let curPerson = people[p.nextHop];
        let prevPerson = people[p.curHop];
        curPerson.notifyEdgeNotBusy(p.curHop);
        prevPerson.notifyEdgeNotBusy(p.nextHop);

        p.curHop = p.nextHop;
        p.nextHop = curPerson.getNextHop(p.toNode);
        if(p.nextHop === null) {
          p.state = ABORT;
          continue;
        }
        let isForwarded = curPerson.forwardPacketIfNotBusy(p, this.positionAttr);

        if(isForwarded) {
          p.increase_passing_numbers();
          people[p.nextHop].notifyEdgeBusy(p.curHop);
        }
        
      } else if(p.state === WAIT_SEND) {

        // wait if the edge is still busy (unit waiting time)
        // next hop is already defined by the forwarding function before entering to WAIT_SEND state
        let curPerson = people[p.curHop]; 
        let nextPerson = people[p.nextHop];
        let isForwarded = curPerson.forwardPacketIfNotBusy(p, this.positionAttr);
        if(isForwarded) {
          p.increase_passing_numbers();
          nextPerson.notifyEdgeBusy(p.curHop);
          continue;
        }

        // wait if the edge is still busy (unit waiting time)
        if(p.totalWaitingTime >= config.PACKET_WAITING_TIMEOUT) {
          p.make_abort();
          continue;
        } if(p.waitingTimeInterval >= config.PACKET_CHECK_BUSY_INTERVAL) {
          p.initWaiting();
        }
      }

      else if(p.state === FINISH) {
        let curPerson = people[p.nextHop];
        let prevPerson = people[p.curHop];
        curPerson.notifyEdgeNotBusy(p.curHop);
        prevPerson.notifyEdgeNotBusy(p.nextHop); 

        this.scene.remove(p.mesh);
        console.log([p.fromNode, p.toNode, p.message]);
        finished_packets.push(p);
        p.state = REMOVED;
      } else if(p.state === ABORT) {
        aborted_packets.push(p);
        p.state = REMOVED;
      }

      p.update(this.positionAttr);
    }

    this.packets = this.packets.filter(p => {
      return p.state != REMOVED;
    });

    return {
      "finished_packets" : finished_packets,
      "aborted_packets" : aborted_packets
    }
  }
}
