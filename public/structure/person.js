import { logMessage } from "../scripts/console.js";

export class Person {
  constructor(id, name, people) {
    this.id = id;
    this.name = name;
    this.adjs = new Set();
    this.people = people;
    
    // destinationId -> nextHopId
    this.routingTable = new Map();
  }

  connect(otherId) {
    this.adjs.add(otherId);
  }

  setRoute(destinationId, nextHopId) {
    this.routingTable.set(destinationId, nextHopId);
  }

  getNextHop(destinationId) {
    return this.routingTable.get(destinationId);
  }

  /**
   * Decide and forward packet to next hop
   * @param {Packet} packet
   * @param {Array<THREE.Vector3>} positions
   * @param {PacketSystem} packetSystem
   */
  forwardPacket(packet, positions, packetSystem) {
    const destinationId = packet.toNode;
    if (this.id === destinationId) {
      return;
    }

    const nextHop = this.getNextHop(destinationId);
    if (nextHop === undefined) {
      console.warn(
        `No route from ${this.id} to ${destinationId}, resolving route information`
      );
      this.resolveRoute(destinationId);
    }

    const startPos = positions[this.id];
    const endPos = positions[nextHop];

    packetSystem.spawn(
      this.id,
      nextHop,
      destination,
      startPos,
      endPos
    );
  }

  resolveRoute(destinationId, people) {
    if (this.routingTable.has(destinationId)) {
      return this.routingTable.get(destinationId);
    }

    const visited = new Set([this.id]);
    const queue = [this.id];
    const prev = new Map();

    while (queue.length) {
      const current = queue.shift();

      if (current === destinationId) break;

      for (const neighbor of people[current].adjs) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          prev.set(neighbor, current);
          queue.push(neighbor);
        }
      }
    }

    if (!prev.has(destinationId)) {
      return undefined;
    }

    // reconstruct next hop
    let step = destinationId;
    while (prev.get(step) !== this.id) {
      step = prev.get(step);
      if (step === undefined) return undefined;
    }

    this.routingTable.set(destinationId, step);
    return step;
  }

  recvPacket(from, message) {
    logMessage(`${this.name} received a message from ${from} : ${message}`)
  }

}
