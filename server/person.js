export class Person {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.adjs = {}
  }

  connect(index) {
    this.adjs += {index}
  }
}
