export function bfs(startId, people) {
  const queue = [startId];
  const visited = new Set([startId]);
  const prev = new Map();

  while (queue.length) {
    const current = queue.shift();
    for (const [neighbor, weight] of people[current].adjs) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        prev.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }

  return prev;
}

export function dijkstra(startId, people) {
  const dist = new Map();
  const prev = new Map();
  const visited = new Set();

  for (let i = 0; i < people.length; i++) {
    dist.set(i, Infinity);
  }
  dist.set(startId, 0);

  while (visited.size < people.length) {

    let current = null;
    let minDist = Infinity;

    for (let [node, d] of dist) {
      if (!visited.has(node) && d < minDist) {
        minDist = d;
        current = node;
      }
    }

    if (current === null) break;

    visited.add(current);

    // Relax edges
    const neighbors = people[current].adjs;

    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i][0];
      const weight = neighbors[i][1];

      const alt = dist.get(current) + weight;

      if (alt < dist.get(neighbor)) {
        dist.set(neighbor, alt);
        prev.set(neighbor, current);
      }
    }
  }

  return { dist, prev };
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