export class Person {
  constructor(id, name, marked = null) {
    this.id = id;
    this.name = name;
    this.adjs = new Set();

    this.marked = null
  }

  connect(otherIndex) {
    this.adjs.add(otherIndex);
  }
}