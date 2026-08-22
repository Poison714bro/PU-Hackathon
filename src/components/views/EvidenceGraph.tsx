"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  User,
  Wallet,
  Mail,
  Key,
  ShoppingBag,
  GitBranch,
  Search,
  Zap,
  MessageSquare,
  Shield,
  ChevronDown,
  X,
  MapPin as MapPinIcon,
  FileText,
  Plus,
  ExternalLink,
  Link2,
  Target,
  Crosshair,
  Hash,
} from "lucide-react";
import { type GraphNodeData } from "@/lib/mockData";
import { api, type GraphNodeApi, type GraphEdgeApi, type MapPinApi } from "@/lib/apiClient";
import { getRiskColor, getDrugColor } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useRadialLayout, RING_RADIUS } from "@/hooks/useRadialLayout";

// Dynamic imports for React Flow (SSR incompatible)
const ReactFlow = dynamic(() => import("reactflow").then((mod) => mod.default), {
  ssr: false,
}) as React.ComponentType<any>;
const Background = dynamic(
  () => import("reactflow").then((mod) => mod.Background),
  { ssr: false }
) as React.ComponentType<any>;
const Controls = dynamic(
  () => import("reactflow").then((mod) => mod.Controls),
  { ssr: false }
) as React.ComponentType<any>;
const MiniMap = dynamic(
  () => import("reactflow").then((mod) => mod.MiniMap),
  { ssr: false }
) as React.ComponentType<any>;
const Handle = dynamic(
  () => import("reactflow").then((mod) => mod.Handle),
  { ssr: false }
) as React.ComponentType<any>;

// ── Forensic Palette Taxonomy ──
// Steel Blue: #4A90E2
// Muted Amber: #D69E2E
// Threat Red: #E53E3E
// Chalk White: #E2E8F0
// Tactical Slate: #0f111a

const nodeTypeConfig: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  username: { icon: User, color: "#4A90E2", label: "IDENTITY" },
  wallet: { icon: Wallet, color: "#D69E2E", label: "WALLET" },
  email: { icon: Mail, color: "#E2E8F0", label: "EMAIL" },
  pgp: { icon: Key, color: "#E2E8F0", label: "PGP KEY" },
  listing: { icon: ShoppingBag, color: "#E53E3E", label: "LISTING" },
};

const roleConfig: Record<string, { label: string; color: string }> = {
  supplier: { label: "SUPPLIER", color: "#E53E3E" },
  dealer: { label: "DEALER", color: "#D69E2E" },
  buyer: { label: "BUYER", color: "#4A90E2" },
  courier: { label: "COURIER", color: "#E2E8F0" },
  unknown: { label: "UNKNOWN", color: "#718096" },
};

// Edge criteria definitions
const edgeCriteria = [
  { key: "financial", label: "FINANCIAL", icon: Zap, color: "#D69E2E" },
  { key: "communication", label: "COMMUNICATION", icon: MessageSquare, color: "#E2E8F0" },
  { key: "infrastructure", label: "INFRASTRUCTURE", icon: Shield, color: "#4A90E2" },
];

const methodToCriteria: Record<string, string> = {
  darknet: "financial",
  encrypted: "communication",
  "in-person": "communication",
  phone: "communication",
};

// Radial Layout Constants moved to hook

// ── Custom Node Components ──

// Concentric Rings Background Node
function RadarRingsNode({ data }: { data: any }) {
  const hops = data.hops || 2;
  return (
    <div className="relative flex items-center justify-center pointer-events-none" style={{ width: 0, height: 0 }}>
      {/* Exact SVG Concentric Circles - explicit width/height to prevent culling */}
      <svg className="absolute overflow-visible" style={{ left: -1000, top: -1000, width: 2000, height: 2000 }}>
        <g transform="translate(1000, 1000)">
          {/* Crosshair at ground zero */}
          <line x1="-15" y1="0" x2="15" y2="0" stroke="#4A90E2" strokeWidth="1" opacity="0.5" />
          <line x1="0" y1="-15" x2="0" y2="15" stroke="#4A90E2" strokeWidth="1" opacity="0.5" />
          
          {[1, 2, 3].map((h) => {
            if (h > hops) return null;
            const r = RING_RADIUS[h as keyof typeof RING_RADIUS];
            return (
              <circle
                key={h}
                cx={0}
                cy={0}
                r={r}
                fill="none"
                stroke="#2d3748"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}

// Crisp Vector Node (Flat, No Glows)
function EvidenceNode({ data }: { data: any }) {
  const config = nodeTypeConfig[data.nodeType] || nodeTypeConfig.username;
  const Icon = config.icon;
  const isSelected = data.isSelected;
  const isTarget = data.isTarget;

  return (
    <div
      className="group relative cursor-pointer font-mono uppercase"
      onClick={() => data.onSelect(data.nodeData)}
    >
      {/* Center-aligned handles to ensure straight edges pass exactly center-to-center */}
      <Handle type="target" position="top" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0 }} />
      <Handle type="source" position="bottom" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0 }} />

      {/* Main Crisp Vector Circle - Flat, solid, 1px border */}
      <div
        className={`relative flex items-center justify-center rounded-full transition-transform ${
          isTarget ? "h-16 w-16" : "h-12 w-12"
        } ${isSelected && !isTarget ? "scale-110" : ""}`}
        style={{
          background: "#0f111a", // Matches canvas
          border: `1px solid ${config.color}`,
        }}
      >
        <Icon className={isTarget ? "h-6 w-6" : "h-4 w-4"} style={{ color: config.color }} />
      </div>

      {/* Sharp rectangular Role badge */}
      {data.suspectRole && data.suspectRole !== "unknown" && (
        <div
          className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center text-[7px] font-bold text-[#0f111a]"
          style={{
            background: roleConfig[data.suspectRole]?.color || "#718096",
            border: `1px solid #0f111a`,
          }}
        >
          {data.suspectRole.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Target Marker Indicator */}
      {isTarget && (
        <div className="absolute -left-2 -top-2 h-3 w-3 border-t border-l border-[#4A90E2]" />
      )}
      {isTarget && (
        <div className="absolute -right-2 -bottom-2 h-3 w-3 border-b border-r border-[#4A90E2]" />
      )}

      {/* Label below node */}
      <div className={`mt-2 text-center flex flex-col items-center justify-center ${isTarget ? "mt-3" : ""}`}>
        <p
          className={`truncate tracking-widest ${isTarget ? "max-w-[140px] text-[10px] font-bold" : "max-w-[100px] text-[8px]"}`}
          style={{ color: isSelected || isTarget ? "#E2E8F0" : config.color }}
        >
          {data.label}
        </p>
        <div className="mt-1 flex items-center justify-center gap-1 opacity-70">
          <span className="text-[7px] text-[#718096]">R:{data.riskScore}</span>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { evidenceNode: EvidenceNode, radarRings: RadarRingsNode };

// ── Main Component ──
export default function EvidenceGraph() {
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [targetId, setTargetId] = useState<string>("N001");
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCriteria, setActiveCriteria] = useState<Set<string>>(
    new Set(["financial", "communication", "infrastructure"])
  );
  const [hops, setHops] = useState(2);
  const [showHopsDropdown, setShowHopsDropdown] = useState(false);
  const reactFlowInstance = useRef<any>(null);

  // API-loaded data (replaces static mock imports)
  const [graphNodesData, setGraphNodesData] = useState<GraphNodeData[]>([]);
  const [graphEdgesData, setGraphEdgesData] = useState<any[]>([]);
  const [mapPinsData, setMapPinsData] = useState<any[]>([]);

  // Store integration
  const storeSelectedId = useAppStore((s) => s.selectedEntityId);
  const storeSelectedType = useAppStore((s) => s.selectedEntityType);
  const highlightedIds = useAppStore((s) => s.highlightedIds);
  const selectEntity = useAppStore((s) => s.selectEntity);
  const clearSelection = useAppStore((s) => s.clearSelection);

  useEffect(() => {
    if (storeSelectedType === "node" && storeSelectedId) {
      const node = graphNodesData.find((n) => n.id === storeSelectedId);
      if (node) setSelectedNode(node);
    }
  }, [storeSelectedId, storeSelectedType, graphNodesData]);

  useEffect(() => {
    setIsClient(true);
    // Fetch graph topology and map pins from backend
    api.graph.topology().then((res) => {
      if (res.ok && res.data) {
        setGraphNodesData(res.data.nodes.map((n: any) => ({
          ...n,
          linkedPinIds: [],
        })));
        setGraphEdgesData(res.data.edges);
      }
    });
    api.map.pins().then((res) => {
      if (res.ok && res.data) {
        setMapPinsData(res.data);
      }
    });
  }, []);

  const handleNodeSelect = useCallback(
    (nodeData: GraphNodeData) => {
      setSelectedNode(nodeData);
      const connectedIds = graphEdgesData
        .filter((e) => e.source === nodeData.id || e.target === nodeData.id)
        .map((e) => (e.source === nodeData.id ? e.target : e.source));
      selectEntity(nodeData.id, "node", [...connectedIds, ...nodeData.linkedPinIds]);
    },
    [selectEntity, graphEdgesData]
  );

  const handleCloseInspector = useCallback(() => {
    setSelectedNode(null);
    clearSelection();
  }, [clearSelection]);

  const toggleCriteria = (key: string) => {
    setActiveCriteria((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getEdgeCriteria = useCallback((edge: typeof graphEdgesData[0]) => {
    const label = edge.label.toLowerCase();
    const isInfra = label.includes("pgp") || label.includes("key") || label.includes("shared");
    if (isInfra) return "infrastructure";
    const isFinancial = label.includes("payment") || label.includes("wallet") || label.includes("swap") || label.includes("receives");
    if (isFinancial) return "financial";
    return methodToCriteria[edge.contactMethod] || "communication";
  }, []);

  // ── Strict Deterministic Radial Layout Engine ──
  const { rfNodes, rfEdges, positions } = useRadialLayout({
    targetId,
    activeCriteria,
    hops,
    highlightedIds,
    selectedNode,
    getEdgeCriteria,
    handleNodeSelect,
    graphNodesData,
    graphEdgesData,
  });

  useEffect(() => {
    if (reactFlowInstance.current && positions[targetId]) {
      setTimeout(() => {
        reactFlowInstance.current.setCenter(0, 0, { zoom: 0.8, duration: 800 });
      }, 100);
    }
  }, [targetId, positions, hops]);

  const connectedEdges = useMemo(() => {
    if (!selectedNode) return [];
    return graphEdgesData.filter(
      (e) => e.source === selectedNode.id || e.target === selectedNode.id
    );
  }, [selectedNode]);

  return (
    <div className="relative flex h-full overflow-hidden bg-card font-mono text-foreground">
      {/* Main Graph Area */}
      <div className="flex flex-1 flex-col min-w-0 relative">
        {/* ═══ 1. Dynamic Web Generator (Top Action Bar) ═══ */}
        <div className="z-20 border-b border-[#2d3748] bg-card flex-shrink-0">
          <div className="flex items-center gap-4 px-5 py-3">
            {/* Target Search */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#4A90E2]" />
              <input
                type="text"
                placeholder="TARGET POI SEED..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-[#2d3748] bg-card py-1.5 pl-9 pr-3 text-[10px] uppercase tracking-widest text-[#E2E8F0] placeholder-slate-600 outline-none transition-colors focus:border-[#4A90E2]"
              />
            </div>

            <div className="h-5 w-px bg-[#2d3748]" />

            {/* Connection Criteria */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#718096] mr-1">VECTORS:</span>
              {edgeCriteria.map((c) => {
                const isActive = activeCriteria.has(c.key);
                return (
                  <button
                    key={c.key}
                    onClick={() => toggleCriteria(c.key)}
                    className="flex items-center gap-1.5 border px-2 py-1 text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap"
                    style={{
                      borderColor: isActive ? c.color : "#2d3748",
                      background: isActive ? `${c.color}15` : "transparent",
                      color: isActive ? c.color : "#718096",
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            <div className="h-5 w-px bg-[#2d3748]" />

            {/* Web Depth */}
            <div className="relative">
              <button
                onClick={() => setShowHopsDropdown(!showHopsDropdown)}
                className="flex items-center gap-2 border border-[#2d3748] bg-card px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[#E2E8F0] hover:border-[#4A90E2]"
              >
                HOPS: {hops}
                <ChevronDown className="h-3 w-3 text-[#718096]" />
              </button>
              {showHopsDropdown && (
                <div className="absolute right-0 top-full z-50 mt-1 border border-[#2d3748] bg-card shadow-2xl">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        setHops(n);
                        setShowHopsDropdown(false);
                      }}
                      className={`block w-full px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest transition-colors hover:bg-card ${
                        hops === n ? "text-[#4A90E2] bg-[#4A90E2]/10" : "text-[#718096]"
                      }`}
                    >
                      {n} DEGREE
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Spin Web Button */}
            <button 
              onClick={() => reactFlowInstance.current?.setCenter(0, 0, { zoom: 0.8, duration: 800 })}
              className="flex items-center gap-2 bg-[#4A90E2] px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#0f111a] transition-all hover:bg-[#3182CE] whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
            >
              <Target className="h-3.5 w-3.5" />
              EXECUTE
            </button>
          </div>
        </div>

        {/* ═══ 2. The "Spider Web" Canvas ═══ */}
        <div className="flex-1 relative">
          {isClient && (
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              nodeTypes={nodeTypes}
              onInit={(instance: any) => {
                reactFlowInstance.current = instance;
              }}
              minZoom={0.1}
              maxZoom={2.5}
              defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
              proOptions={{ hideAttribution: true }}
              className="bg-card"
            >
              <Background color="transparent" />
              
              <Controls
                position="top-right"
                showInteractive={false}
                style={{
                  background: "#0f111a",
                  borderColor: "#2d3748",
                  borderRadius: "0",
                  marginTop: "16px",
                  marginRight: "16px",
                }}
              />
              <MiniMap
                position="bottom-right"
                nodeColor={(n: any) => {
                  if (n.data?.isTarget) return "#4A90E2";
                  return "#2d3748";
                }}
                maskColor="rgba(15, 17, 26, 0.85)"
                style={{
                  borderRadius: "0",
                  background: "#0f111a",
                  border: "1px solid #2d3748",
                }}
              />
            </ReactFlow>
          )}

          {/* Floating Collapsible Legend Panel */}
          <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
              <div className="border border-[#2d3748] bg-card p-3 max-w-[220px]">
                <h4 className="text-[8px] font-bold uppercase tracking-widest text-[#718096] mb-2 border-b border-[#2d3748] pb-1">TAXONOMY</h4>
                <div className="flex flex-col gap-1.5">
                  {Object.entries(nodeTypeConfig).map(([key, config]) => {
                    const LIcon = config.icon;
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <LIcon className="h-3 w-3" style={{ color: config.color }} />
                          <span className="text-[8px] font-bold tracking-widest text-[#E2E8F0]">{config.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* ═══ 3. Data-Dense Inspector Panel ═══ */}
      {selectedNode && (() => {
        const selConfig = nodeTypeConfig[selectedNode.type] || nodeTypeConfig.username;
        const SelIcon = selConfig.icon;
        const role = roleConfig[selectedNode.suspectRole] || roleConfig.unknown;
        const isCurrentTarget = selectedNode.id === targetId;

        // Mock hash generator
        const mockHash = Array.from(selectedNode.id).reduce((acc, char) => acc + char.charCodeAt(0).toString(16), "8f43") + "a9b2c3d4e5f6";

        return (
          <div
            className="z-20 flex w-[360px] flex-shrink-0 flex-col border-l border-[#2d3748] bg-card overflow-hidden"
            style={{
              animation: "slideInRight 0.2s ease-out",
            }}
          >
            {/* Dossier Header */}
            <div className="flex items-center justify-between border-b border-[#2d3748] bg-card px-4 py-4 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center border" style={{ borderColor: selConfig.color, background: `${selConfig.color}15` }}>
                  <SelIcon className="h-4 w-4" style={{ color: selConfig.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: selConfig.color }}>
                    {selConfig.label}
                  </p>
                  <h3 className="text-sm font-bold text-[#E2E8F0] truncate uppercase tracking-wider">{selectedNode.label}</h3>
                </div>
              </div>
              <button
                onClick={handleCloseInspector}
                className="p-1 text-[#718096] transition-colors hover:text-[#E2E8F0] flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              {/* TARGET ACTION */}
              <div className="p-4 border-b border-[#2d3748] shrink-0 bg-card">
                 {isCurrentTarget ? (
                   <div className="w-full flex items-center justify-center gap-2 bg-[#4A90E2]/10 py-2 text-[10px] font-bold uppercase tracking-widest text-[#4A90E2] border border-[#4A90E2]/30">
                     <Target className="h-3.5 w-3.5" />
                     PRIMARY TARGET LOCKED
                   </div>
                 ) : (
                   <button 
                    onClick={() => setTargetId(selectedNode.id)}
                    className="w-full flex items-center justify-center gap-2 bg-[#E53E3E] py-2 text-[10px] font-bold uppercase tracking-widest text-[#0f111a] transition-all hover:bg-[#C53030] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
                  >
                    <Crosshair className="h-3.5 w-3.5" />
                    DESIGNATE NEW TARGET
                  </button>
                 )}
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2d3748] shrink-0">
                <span className="border border-[#718096] px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[#E2E8F0]">
                  RISK: {selectedNode.riskScore}
                </span>
                <span
                  className="border px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest"
                  style={{
                    borderColor: role.color,
                    color: role.color,
                    background: `${role.color}10`,
                  }}
                >
                  [{role.label}]
                </span>
              </div>

              {/* Strict Grid Metadata */}
              <div className="px-4 py-3 border-b border-[#2d3748] shrink-0">
                <h4 className="mb-2 text-[8px] font-bold uppercase tracking-widest text-[#718096]">
                  ENTITY METADATA
                </h4>
                <div className="border border-[#2d3748] bg-card">
                  {Object.entries(selectedNode.metadata).map(([key, value], i, arr) => (
                    <div
                      key={key}
                      className={`grid grid-cols-3 px-3 py-1.5 text-[9px] ${
                        i < arr.length - 1 ? "border-b border-[#2d3748]" : ""
                      }`}
                    >
                      <span className="col-span-1 font-bold uppercase tracking-wider text-[#718096]">
                        {key}
                      </span>
                      <span className="col-span-2 font-medium text-[#E2E8F0] text-right truncate">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Intel Summary */}
              <div className="px-4 py-3 border-b border-[#2d3748] shrink-0">
                <h4 className="mb-1.5 text-[8px] font-bold uppercase tracking-widest text-[#718096]">
                  INTELLIGENCE BRIEF
                </h4>
                <p className="text-[10px] leading-relaxed text-[#A0AEC0] uppercase tracking-wide">{selectedNode.details}</p>
              </div>

              {/* Links */}
              <div className="px-4 py-3 shrink-0 mb-4">
                <h4 className="mb-2 text-[8px] font-bold uppercase tracking-widest text-[#718096] flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  CORRELATED ENTITIES ({connectedEdges.length})
                </h4>
                <div className="space-y-1">
                  {connectedEdges.map((edge) => {
                    const connectedId =
                      edge.source === selectedNode.id ? edge.target : edge.source;
                    const connectedNode = graphNodesData.find((n) => n.id === connectedId);
                    if (!connectedNode) return null;
                    const cfg = nodeTypeConfig[connectedNode.type];
                    const ConnIcon = cfg.icon;
                    return (
                      <button
                        key={edge.id}
                        onClick={() => {
                          const node = graphNodesData.find((n) => n.id === connectedNode.id);
                          if (node) {
                            handleNodeSelect(node);
                            // Pan to this node (re-center graph)
                            if (reactFlowInstance.current) {
                              const pos = reactFlowInstance.current.getNode(connectedNode.id)?.position;
                              if (pos) {
                                reactFlowInstance.current.setCenter(pos.x, pos.y, { zoom: 1.2, duration: 800 });
                              }
                            }
                          }
                        }}
                        className="flex w-full items-center gap-2 border border-[#2d3748] bg-card px-2 py-1.5 text-left transition-all hover:border-[#4A90E2] group"
                      >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center border border-[#2d3748]">
                          <ConnIcon className="h-3 w-3" style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 overflow-hidden min-w-0">
                          <p className="text-[9px] font-bold text-[#E2E8F0] uppercase tracking-widest truncate">
                            {connectedNode.label}
                          </p>
                          <p className="text-[7px] text-[#718096] uppercase tracking-widest truncate">
                            {edge.label}
                          </p>
                        </div>
                        <ExternalLink className="h-3 w-3 text-[#718096] group-hover:text-[#4A90E2] flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Forensic Footer */}
            <div className="border-t border-[#2d3748] p-3 bg-card flex-shrink-0 mt-auto">
              <div className="flex items-center justify-between mb-3 text-[7px] text-[#718096] font-bold tracking-widest uppercase">
                <span className="flex items-center gap-1"><Hash className="h-3 w-3"/> SHA-256</span>
                <span>{mockHash}</span>
              </div>
              <button className="flex w-full items-center justify-center gap-2 border border-[#2d3748] py-2 text-[9px] font-bold uppercase tracking-widest text-[#E2E8F0] transition-colors hover:bg-[#2d3748] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
                <Plus className="h-3 w-3" />
                APPEND TO DOSSIER
              </button>
            </div>
          </div>
        );
      })()}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}} />
    </div>
  );
}
