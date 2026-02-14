import { loadConfig } from "./config.js";
const config = await loadConfig();

/* ============================================================
   Utilities
   ============================================================ */

function gridDistance(a, b) {
  const dx = a.gx - b.gx;
  const dy = a.gy - b.gy;
  return Math.sqrt(dx * dx + dy * dy);
}

/* ---------- Union-Find (Disjoint Set) ---------- */

class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = Array(n).fill(0);
    this.count = n;
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(a, b) {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return false;

    if (this.rank[ra] < this.rank[rb]) {
      this.parent[ra] = rb;
    } else if (this.rank[ra] > this.rank[rb]) {
      this.parent[rb] = ra;
    } else {
      this.parent[rb] = ra;
      this.rank[ra]++;
    }

    this.count--;
    return true;
  }
}

/* ============================================================
   Connected graph generation (grid-aware)
   ============================================================ */

export function generateConnectedGraph(
  nodes,
  extraEdgeProbability = config.GRAPH_EXTRA_EDGE_PROBABILITY
) {
  const n = nodes.length;
  const maxDist = config.GRAPH_NODES_CONNECTED_MAX_DISTANCE;

  const validEdges = [];
  const invalidEdges = [];

  /* ---------- enumerate all candidate edges ---------- */

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = gridDistance(nodes[i], nodes[j]);
      const edge = { a: i, b: j, d: dist};

      if (dist <= maxDist) {
        validEdges.push(edge);
      } else {
        invalidEdges.push(edge);
      }
    }
  }

  /* ---------- sort by distance ---------- */

  validEdges.sort((e1, e2) => e1.d - e2.d);
  invalidEdges.sort((e1, e2) => e1.d - e2.d);

  const uf = new UnionFind(n);
  const edges = [];
  let invalidEdgeCount = 0;

  /* ---------- build MST using valid edges ---------- */

  for (const e of validEdges) {
    if (uf.union(e.a, e.b)) {
      edges.push([e.a, e.b, e.d]);
      if (edges.length === n - 1) break;
    }
  }

  /* ---------- minimally repair connectivity ---------- */

  if (edges.length < n - 1) {
    for (const e of invalidEdges) {
      if (uf.union(e.a, e.b)) {
        edges.push([e.a, e.b, e.d]);
        invalidEdgeCount++;
        if (edges.length === n - 1) break;
      }
    }
  }

  /* ---------- optional extra edges (prefer valid) ---------- */

  for (const e of validEdges) {
    if (Math.random() < extraEdgeProbability) {
      edges.push([e.a, e.b, e.d]);
    }
  }

  return edges
}
