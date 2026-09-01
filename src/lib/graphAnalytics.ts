/**
 * Forensic Graph & Intelligence Analytics Library
 * Ported & adapted from Semantica for NEXUS UI and Next.js backend services.
 */

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  riskScore?: number;
  [key: string]: any;
}

export interface GraphEdge {
  id?: string;
  source: string;
  target: string;
  relation?: string;
  label?: string;
  weight?: number;
  [key: string]: any;
}

export interface CentralityMetrics {
  degree: number;
  betweenness: number;
  pagerank: number;
  kingpinIndex: number;
  inferredRole: string;
}

export interface CriminalCommunity {
  id: string;
  label: string;
  size: number;
  members: string[];
  density: number;
}

/**
 * Computes degree and approximate PageRank centrality for nodes in the graph.
 */
export function calculateCentralityScores(
  nodes: GraphNode[],
  edges: GraphEdge[],
  dampingFactor: number = 0.85,
  iterations: number = 20
): Record<string, CentralityMetrics> {
  const nodeMap = new Map<string, GraphNode>();
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();

  nodes.forEach(n => {
    nodeMap.set(n.id, n);
    inDegree.set(n.id, 0);
    outDegree.set(n.id, 0);
    incoming.set(n.id, []);
    outgoing.set(n.id, []);
  });

  edges.forEach(e => {
    const src = e.source;
    const tgt = e.target;
    if (nodeMap.has(src) && nodeMap.has(tgt)) {
      outDegree.set(src, (outDegree.get(src) || 0) + 1);
      inDegree.set(tgt, (inDegree.get(tgt) || 0) + 1);
      outgoing.get(src)!.push(tgt);
      incoming.get(tgt)!.push(src);
    }
  });

  const N = Math.max(1, nodes.length);
  let pr = new Map<string, number>();
  nodes.forEach(n => pr.set(n.id, 1.0 / N));

  // Iterative PageRank
  for (let iter = 0; iter < iterations; iter++) {
    const nextPr = new Map<string, number>();
    nodes.forEach(n => {
      let sum = 0;
      const inNodes = incoming.get(n.id) || [];
      inNodes.forEach(inN => {
        const outDeg = outDegree.get(inN) || 1;
        sum += (pr.get(inN) || 0) / outDeg;
      });
      const score = (1.0 - dampingFactor) / N + dampingFactor * sum;
      nextPr.set(n.id, score);
    });
    pr = nextPr;
  }

  // Simplified Betweenness estimate based on bridging in/out degrees
  const results: Record<string, CentralityMetrics> = {};

  nodes.forEach(n => {
    const deg = (inDegree.get(n.id) || 0) + (outDegree.get(n.id) || 0);
    const prScore = Number((pr.get(n.id) || 0).toFixed(4));
    const betScore = Number((Math.min(1.0, deg / Math.max(2, N - 1))).toFixed(4));

    // Kingpin composite index (0-100)
    const kingpinIndex = Number(Math.min(100, Math.max(0, (prScore * 400) + (betScore * 50) + (deg * 5))).toFixed(1));

    let inferredRole = "Peripheral Actor";
    if (kingpinIndex >= 70 || betScore > 0.4) {
      inferredRole = "Primary Kingpin / Network Coordinator";
    } else if (deg >= 4 || prScore > 0.05) {
      inferredRole = "Key Financial Hub / Exchange Gateway";
    } else if (deg >= 2) {
      inferredRole = "Active Distributor / Operative";
    }

    results[n.id] = {
      degree: deg,
      betweenness: betScore,
      pagerank: prScore,
      kingpinIndex,
      inferredRole,
    };
  });

  return results;
}

/**
 * Detects connected communities using Breadth-First Search / Label Clustering.
 */
export function detectGraphCommunities(
  nodes: GraphNode[],
  edges: GraphEdge[]
): CriminalCommunity[] {
  const adj = new Map<string, Set<string>>();
  nodes.forEach(n => adj.set(n.id, new Set()));

  edges.forEach(e => {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.add(e.target);
      adj.get(e.target)!.add(e.source);
    }
  });

  const visited = new Set<string>();
  const communities: CriminalCommunity[] = [];
  let clusterIdx = 1;

  nodes.forEach(n => {
    if (!visited.has(n.id)) {
      const members: string[] = [];
      const queue: string[] = [n.id];
      visited.add(n.id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        members.push(curr);
        const neighbors = adj.get(curr) || new Set();
        neighbors.forEach(nbr => {
          if (!visited.has(nbr)) {
            visited.add(nbr);
            queue.push(nbr);
          }
        });
      }

      if (members.length > 0) {
        const memberSet = new Set(members);
        let internalEdges = 0;
        edges.forEach(e => {
          if (memberSet.has(e.source) && memberSet.has(e.target)) {
            internalEdges++;
          }
        });
        const maxPossible = members.length > 1 ? (members.length * (members.length - 1)) / 2 : 1;
        const density = Number((internalEdges / Math.max(1, maxPossible)).toFixed(2));

        communities.push({
          id: `syndicate_${clusterIdx}`,
          label: `Cluster #${clusterIdx} (${members.length} members)`,
          size: members.length,
          members,
          density,
        });
        clusterIdx++;
      }
    }
  });

  return communities.sort((a, b) => b.size - a.size);
}

/**
 * Finds shortest forensic connection path between source and target nodes (BFS).
 */
export function findShortestPath(
  nodes: GraphNode[],
  edges: GraphEdge[],
  sourceId: string,
  targetId: string
): { path: string[]; hops: number; found: boolean } {
  if (sourceId === targetId) {
    return { path: [sourceId], hops: 0, found: true };
  }

  const adj = new Map<string, string[]>();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      adj.get(e.target)!.push(e.source);
    }
  });

  const queue: string[] = [sourceId];
  const visited = new Set<string>([sourceId]);
  const parent = new Map<string, string>();

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === targetId) {
      const path: string[] = [];
      let step: string | undefined = targetId;
      while (step) {
        path.unshift(step);
        step = parent.get(step);
      }
      return { path, hops: path.length - 1, found: true };
    }

    const nbrs = adj.get(curr) || [];
    for (const nbr of nbrs) {
      if (!visited.has(nbr)) {
        visited.add(nbr);
        parent.set(nbr, curr);
        queue.push(nbr);
      }
    }
  }

  return { path: [], hops: 0, found: false };
}

/**
 * Jaro-Winkler string similarity in TypeScript.
 */
export function jaroWinklerSimilarity(s1: string, s2: string): number {
  const str1 = s1.toLowerCase();
  const str2 = s2.toLowerCase();
  if (str1 === str2) return 1.0;
  if (!str1.length || !str2.length) return 0.0;

  const matchDist = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
  const s1Matches = new Array(str1.length).fill(false);
  const s2Matches = new Array(str2.length).fill(false);
  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - matchDist);
    const end = Math.min(i + matchDist + 1, str2.length);
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || str1[i] !== str2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < str1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / str1.length +
      matches / str2.length +
      (matches - transpositions / 2) / matches) /
    3.0;

  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(str1.length, str2.length)); i++) {
    if (str1[i] === str2[i]) prefix++;
    else break;
  }

  return Number((jaro + prefix * 0.1 * (1.0 - jaro)).toFixed(4));
}
