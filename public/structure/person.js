export class Person {
  constructor(id, name) {
    this.id = id;
    this.name = name;

    this.adjs = new Set();

    // simulation state
    this.busy = false;
    this.busyUntil = 0;
    this.queue = [];
  }

  connect(other) {
    this.adjs.add(other);
  }
}
