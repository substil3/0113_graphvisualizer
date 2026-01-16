export function generateConnectedGraph(nodeCount, extraEdgeProbability = 0.3) {
  const edges = [];

  // random spanning tree
  const nodes = [...Array(nodeCount).keys()];
  shuffle(nodes);

  for (let i = 1; i < nodes.length; i++) {
    const from = nodes[i];
    const to = nodes[Math.floor(Math.random() * i)];
    edges.push([from, to]);
  }

  // add random edges
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      if (Math.random() < extraEdgeProbability) {
        edges.push([i, j]);
      }
    }
  }

  return edges;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
