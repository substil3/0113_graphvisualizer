import { faker } from "https://cdn.jsdelivr.net/npm/@faker-js/faker/+esm";
import { Person } from "./person.js";

export function createPeople(count = 80) {
  // Optional: deterministic output
  faker.seed(Math.random()*40000);

  const people = new Array(count);

  for (let i = 0; i < count; i++) {
    people[i] = new Person(
      i,
      faker.person.fullName(),
    );}

  return people;
}
