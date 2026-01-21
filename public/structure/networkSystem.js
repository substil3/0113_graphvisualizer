import { logMessage } from "../scripts/console.js";
import { bfs, reconstructNextHop } from "./routing.js"

export class NetworkSystem {
  constructor(people, edges, packetSystem) {
    this.people = people;
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

  updatePacketMovement() {
    this.packetSystem.update(people);
  }
}
