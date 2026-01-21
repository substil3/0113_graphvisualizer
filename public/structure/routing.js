export function bfs(startId, people) {
  const queue = [startId];
  const visited = new Set([startId]);
  const prev = new Map();

  while (queue.length) {
    const current = queue.shift();
    for (const neighbor of people[current].adjs) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        prev.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }

  return prev;
}

export function reconstructNextHop(start, dest, prev) {
  let current = dest;
  let previous = prev.get(current);

  if (previous === undefined) return null;

  while (previous !== start) {
    current = previous;
    previous = prev.get(current);
    if (previous === undefined) return null;
  }

  return current;
}
