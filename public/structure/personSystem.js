import { faker } from "https://cdn.jsdelivr.net/npm/@faker-js/faker/+esm";
import { Person } from "./people/person.js";
import { Player } from "./people/player.js";
import { Hacker } from "./people/hacker.js";

export function createPeople(numOfPeople = 150, hasPlayer = true) {
  faker.seed(Math.random()*40000);
  const hackerId = Math.floor(Math.random()*(numOfPeople-1))

  const people = new Array(numOfPeople);

  for (let i = 0; i < numOfPeople; i++) {
    if(i === hackerId) {
      people[i] = new Hacker(
        i,
        faker.person.fullName(),
      )
    } else if(i === numOfPeople-1 && hasPlayer) {
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
