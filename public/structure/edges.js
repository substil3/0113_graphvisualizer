export class Edge {
  constructor(from, to) {
    this.from = from;
    this.to = to;
    this.busy = false;
  }

  markAsBusy() {
    this.busy = true;
  }

  markAsNotBusy() {
    this.busy = false;
  }

  
}
