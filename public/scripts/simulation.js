export class Simulation {
  constructor(people, edges, clock) {
    this.people = people;
    this.edges = edges;
    this.clock = clock;
  }

  step() {
    const t = this.clock.time;

    // free nodes
    for (const p of this.people) {
      if (p.busy && t >= p.busyUntil) {
        p.busy = false;
      }
    }

    // free edges
    for (const e of this.edges) {
      if (e.busy && t >= e.busyUntil) {
        e.busy = false;
      }
    }

    // random packet generation
    if (Math.random() < 0.05) {
      this.generatePacket();
    }
  }

  generatePacket() {
    const sender = randomItem(this.people);
    if (sender.busy) return;

    const targets = [...sender.adjs];
    const receiver = randomItem(targets);

    const edge = this.findEdge(sender.id, receiver);

    if (!edge || edge.busy) return;

    this.sendPacket(sender, receiver, edge);
  }

  sendPacket(sender, receiver, edge) {
    const t = this.clock.time;
    const transmissionTime = 20;

    sender.busy = true;
    sender.busyUntil = t + transmissionTime;

    receiver.busy = true;
    receiver.busyUntil = t + transmissionTime;

    edge.busy = true;
    edge.busyUntil = t + transmissionTime;

    console.log(`${sender.name} → ${receiver.name}`);
  }

  findEdge(from, to) {
    return this.edges.find(e => e.from === from && e.to === to);
  }
}
