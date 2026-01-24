import { logMessage } from "../scripts/console.js";
import { bfs, reconstructNextHop } from "./routing.js"

export class NetworkSystem {
  constructor(people, positionAttr, edges, packetSystem) {
    this.people = people;
    this.positionAttr = positionAttr;
    this.edges = edges;
    this.packetSystem = packetSystem;
    this.getInitialRoutingTables = true;

    /* =============================
      init overall network system
    ============================= */
    if (this.getInitialRoutingTables) 
      this.initRoutingTables();

    this.simulationRunning = false;
  }

  initRoutingTables() {
    for (const source of this.people) {
      const prev = bfs(source.id, this.people);
      for (let dest = 0; dest < this.people.length; dest++) {
        if (dest === source.id) continue;
        const nextHop = reconstructNextHop(source.id, dest, prev);
        if (nextHop !== null) {
          source.setRoute(dest, nextHop);
        }
      } console.log(source.routingTable);
    }
  }

  runNetworkSimulation() {
    this.simulationRunning = true;
  }

  stopNetworkSimulation() {
    this.simulationRunning = false;
  }

  runOrStopNetworkSimulation() {
    if(!this.simulationRunning) this.runNetworkSimulation();
    else this.stopNetworkSimulation();
  }

  updatePacketMovement() {
    if(!this.simulationRunning) return;
    let packetSystemState = this.packetSystem.update(this.people, this.positionAttr);
   
    for(let [from, to, message] of packetSystemState["finished_packets"]) {
      let fromPerson = this.people[from];
      let toPerson = this.people[to];
      toPerson.recvPacket(fromPerson.name, message)
    }
  }
}
