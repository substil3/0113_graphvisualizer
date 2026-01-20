

export class Person {
  constructor(id, name) {
    this.id = id;
    this.name = name;

    this.adjs = new Set();

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
    const destination = packet.finalDestination;
    if (this.id === destination) {
      return;
    }

    const nextHop = this.getNextHop(destination);
    if (nextHop === undefined) {
      console.warn(
        `No route from ${this.id} to ${destination}`
      );

      return;
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
}
