import { faker } from "https://cdn.jsdelivr.net/npm/@faker-js/faker/+esm";
import { Person } from "./people/person.js";
import { Player } from "./people/player.js";
import { Hacker } from "./people/hacker.js";

export function createPeople(count = 80) {
  faker.seed(Math.random()*40000);
  const hackerId = Math.floor(Math.random()*(count-1))

  const people = new Array(count);

  for (let i = 0; i < count; i++) {
    if(i === hackerId) {
      people[i] = new Hacker(
        i,
        faker.person.fullName(),
      )
    } else if(i === count-1) {
      people[i] = new Player(
        i,
        faker.person.fullName(),
      )
    } else {
      people[i] = new Person(
        i,
        faker.person.fullName(),
      );
    }
  }

  return people;
}
