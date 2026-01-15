export class Packet {
  constructor(from, to, createdAt) {
    this.from = from;
    this.to = to;
    this.createdAt = createdAt;

    this.startedAt = null;
    this.finishedAt = null;
  }
}
