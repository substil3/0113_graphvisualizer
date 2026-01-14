export async function fetchPeople() {
  const res = await fetch("/api/people");
  return res.json();
}