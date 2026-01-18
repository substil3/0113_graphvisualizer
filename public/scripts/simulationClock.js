export class SimulationClock {
  constructor() {
    this.time = 0;
    this.delta = 1;
  }

  tick() {
    this.time += this.delta;
  }
}
