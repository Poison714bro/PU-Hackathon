import { useMemo } from "react";
import { type GraphNodeData } from "@/lib/mockData";

// Radial Layout Constants
export const RING_RADIUS = {
  0: 0,
  1: 250,
  2: 500,
  3: 750,
};

interface UseRadialLayoutProps {
  targetId: string;
  activeCriteria: Set<string>;
  hops: number;
  highlightedIds: string[];
  selectedNode: GraphNodeData | null;
  getEdgeCriteria: (edge: any) => string;
  handleNodeSelect: (nodeData: GraphNodeData) => void;
  graphNodesData: GraphNodeData[];
  graphEdgesData: any[];
}

export function useRadialLayout({
  targetId,
  activeCriteria,
  hops,
  highlightedIds,
  selectedNode,
  getEdgeCriteria,
  handleNodeSelect,
  graphNodesData,
  graphEdgesData,
}: UseRadialLayoutProps) {
  const { rfNodes, rfEdges, positions } = useMemo(() => {
    const validEdges = graphEdgesData.filter((edge) => activeCriteria.has(getEdgeCriteria(edge)));

    const adj: Record<string, string[]> = {};
    validEdges.forEach((e) => {
      if (!adj[e.source]) adj[e.source] = [];
      if (!adj[e.target]) adj[e.target] = [];
      adj[e.source].push(e.target);
      adj[e.target].push(e.source);
    });

    const distances: Record<string, number> = { [targetId]: 0 };
    const queue = [targetId];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const dist = distances[curr];
      if (dist >= hops) continue;

      (adj[curr] || []).forEach((neighbor) => {
        if (distances[neighbor] === undefined) {
          distances[neighbor] = dist + 1;
          queue.push(neighbor);
        }
      });
    }

    const rings: Record<number, GraphNodeData[]> = {};
    const includedNodes = graphNodesData.filter((n) => distances[n.id] !== undefined);
    
    includedNodes.forEach((n) => {
      const d = distances[n.id];
      if (!rings[d]) rings[d] = [];
      rings[d].push(n);
    });

    const computedPositions: Record<string, { x: number; y: number }> = {};
    Object.keys(rings).forEach((ringKey) => {
      const d = parseInt(ringKey);
      const ringNodes = rings[d];
      if (d === 0) {
        computedPositions[ringNodes[0].id] = { x: 0, y: 0 };
      } else {
        const radius = RING_RADIUS[d as keyof typeof RING_RADIUS];
        const n = ringNodes.length;
        
        // Pure trigonometry. Added a deterministic angleOffset per ring to prevent overlapping nodes on small datasets forming straight lines
        const angleOffset = d * (Math.PI / 4);
        
        ringNodes.forEach((node, i) => {
          const angle = angleOffset + (i / n) * 2 * Math.PI;
          computedPositions[node.id] = {
            x: Math.round(radius * Math.cos(angle)),
            y: Math.round(radius * Math.sin(angle)),
          };
        });
      }
    });

    const nodes: any[] = includedNodes.map((node) => {
      const isTarget = node.id === targetId;
      // Exact center offset for 12w (48px) and 16w (64px) nodes
      const widthOffset = isTarget ? 32 : 24; 
      const x = computedPositions[node.id].x - widthOffset;
      const y = computedPositions[node.id].y - widthOffset;
      
      return {
        id: node.id,
        type: "evidenceNode",
        position: { x, y },
        data: {
          label: node.label,
          nodeType: node.type,
          riskScore: node.riskScore,
          suspectRole: node.suspectRole,
          nodeData: node,
          onSelect: handleNodeSelect,
          isSelected: selectedNode?.id === node.id,
          isHighlighted: highlightedIds.includes(node.id),
          isTarget: isTarget,
        },
      };
    });

    nodes.unshift({
      id: "radar-bg",
      type: "radarRings",
      position: { x: 0, y: 0 },
      data: { hops },
      selectable: false,
      draggable: false,
      zIndex: -1,
    });

    const edges = validEdges
      .filter((e) => distances[e.source] !== undefined && distances[e.target] !== undefined)
      .map((edge) => {
        const isConnectedToSelected =
          selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);

        const criteria = getEdgeCriteria(edge);
        let edgeColor = "#E2E8F0"; // default communication
        if (criteria === "financial") edgeColor = "#D69E2E";
        if (criteria === "infrastructure") edgeColor = "#4A90E2";

        const isHighlighted = isConnectedToSelected;

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: "straight",
          // Removed label clutter completely from canvas
          animated: false,
          markerEnd: criteria === "financial"
            ? { type: "arrowclosed" as const, color: edgeColor, width: 12, height: 12 }
            : undefined,
          style: {
            stroke: edgeColor,
            strokeWidth: 1,
            strokeOpacity: isHighlighted ? 1 : 0.4,
            strokeDasharray: criteria === "communication" ? "3 3" : undefined,
          },
          zIndex: isHighlighted ? 10 : 1,
        };
      });

    return { rfNodes: nodes, rfEdges: edges, positions: computedPositions };
  }, [
    targetId,
    activeCriteria,
    hops,
    highlightedIds,
    selectedNode,
    getEdgeCriteria,
    handleNodeSelect,
    graphNodesData,
    graphEdgesData,
  ]);

  return { rfNodes, rfEdges, positions };
}
