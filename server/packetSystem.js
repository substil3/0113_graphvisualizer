import { Packet } from "./packet.js";

export class PacketSystem {
  constructor(scene) {
    this.scene = scene;
    this.packets = [];
  }

  spawn(start, end) {
    const packet = new Packet(start, end);
    this.scene.add(packet.mesh);
    this.packets.push(packet);
  }

  update() {
    this.packets = this.packets.filter(packet => {
      const alive = packet.update();
      if (!alive) this.scene.remove(packet.mesh);
      return alive;
    });
  }
}
