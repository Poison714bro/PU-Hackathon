"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  User,
  Wallet,
  Mail,
  Key,
  ShoppingBag,
  Search,
  Zap,
  MessageSquare,
  Shield,
  ChevronDown,
  X,
  Plus,
  ExternalLink,
  Target,
  Crosshair,
  Hash,
  Activity,
  Share2,
  Lock,
  Pin,
  Link2
} from "lucide-react";
import { api } from "@/lib/apiClient";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, AreaChart, Area, ResponsiveContainer } from "recharts";

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

// ── Forensic Palette Taxonomy ──
const nodeTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  username: { icon: User, color: "#3b82f6", label: "IDENTITY" }, // Intense Blue
  wallet: { icon: Wallet, color: "#eab308", label: "WALLET" }, // Yellow
  email: { icon: Mail, color: "#f8fafc", label: "EMAIL" }, // White
  pgp: { icon: Key, color: "#94a3b8", label: "PGP KEY" }, // Grey
  listing: { icon: ShoppingBag, color: "#ef4444", label: "LISTING" }, // Red
};

const roleConfig: Record<string, { label: string; color: string }> = {
  supplier: { label: "SUPPLIER", color: "#ef4444" },
  dealer: { label: "DEALER", color: "#eab308" },
  buyer: { label: "BUYER", color: "#3b82f6" },
  courier: { label: "COURIER", color: "#94a3b8" },
  unknown: { label: "UNKNOWN", color: "#64748b" },
};

const edgeCriteria = [
  { key: "financial", label: "FINANCIAL", shortLabel: "FINANCIAL", icon: Zap, color: "#eab308" },
  { key: "communication", label: "COMMUNICATION", shortLabel: "COMMS", icon: MessageSquare, color: "#38bdf8" },
  { key: "infrastructure", label: "INFRASTRUCTURE", shortLabel: "INFRA", icon: Shield, color: "#818cf8" },
];

const EDGE_COLORS: Record<string, string> = {
  financial: "#eab308",
  communication: "#38bdf8",
  infrastructure: "#818cf8",
};

export function classifyEdgeCategory(edge: any): "financial" | "communication" | "infrastructure" {
  if (edge.category) {
    const cat = String(edge.category).toLowerCase();
    if (cat === "financial" || cat === "communication" || cat === "infrastructure") return cat as any;
  }
  const label = String(edge.label || "").toLowerCase();
  const contact = String(edge.contactMethod || "").toLowerCase();

  // Financial vectors (crypto, payments, wallets, swaps, sales, tx)
  if (
    label.includes("payment") ||
    label.includes("wallet") ||
    label.includes("swap") ||
    label.includes("eth") ||
    label.includes("btc") ||
    label.includes("monero") ||
    label.includes("xmr") ||
    label.includes("sends") ||
    label.includes("receives") ||
    label.includes("owns") ||
    label.includes("financial") ||
    label.includes("transact")
  ) {
    return "financial";
  }

  // Communication vectors (PGP, email, comms, chat, messages, telegram, referral)
  if (
    label.includes("key") ||
    label.includes("pgp") ||
    label.includes("email") ||
    label.includes("communicat") ||
    label.includes("chat") ||
    label.includes("message") ||
    label.includes("contact") ||
    label.includes("referral") ||
    label.includes("uses") ||
    label.includes("signs") ||
    contact === "encrypted" ||
    contact === "phone"
  ) {
    return "communication";
  }

  // Infrastructure vectors (listings, servers, hosting, shared infra, direct assoc, market)
  return "infrastructure";
}

const mockSparklineData = Array.from({ length: 30 }, (_, i) => ({ time: i, val: Math.random() * 100 }));

export default function EvidenceGraph() {
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [targetId, setTargetId] = useState<string>("HUB_1");
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCriteria, setActiveCriteria] = useState<Set<string>>(
    new Set(["financial", "communication", "infrastructure"])
  );
  const [hops, setHops] = useState(2);
  const [showHopsDropdown, setShowHopsDropdown] = useState(false);
  
  const fgRef = useRef<any>(null);

  // API-loaded data
  const [graphNodesData, setGraphNodesData] = useState<any[]>([]);
  const [graphEdgesData, setGraphEdgesData] = useState<any[]>([]);
  
  const [isExecuted, setIsExecuted] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Interactive Physics States
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());

  // Radial Menu & Tooltip States
  const [radialMenu, setRadialMenu] = useState<{ x: number, y: number, node: any } | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number, y: number } | null>(null);

  // Store integration
  const selectEntity = useAppStore((s) => s.selectEntity);
  const clearSelection = useAppStore((s) => s.clearSelection);

  const handleExecute = useCallback(() => {
    setIsExecuting(true);
    api.graph.topology()
      .then((res) => {
        if (res.ok && res.data) {
          setGraphNodesData(res.data.nodes);
          setGraphEdgesData(res.data.edges);
          setIsExecuted(true);
        }
      })
      .catch((err) => {
        console.error("EvidenceGraph Topology Fetch Error:", err);
      })
      .finally(() => {
        setIsExecuting(false);
      });
  }, []);

  useEffect(() => {
    setIsClient(true);
    handleExecute();
  }, [handleExecute]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        if (!isExecuting) handleExecute();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        // Mock Append to Dossier
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExecuting, handleExecute]);

  // Physics Tuning
  useEffect(() => {
    if (isExecuted && fgRef.current) {
      fgRef.current.d3Force('charge').strength(-450).distanceMax(400);
      fgRef.current.d3Force('link').distance(70).strength(0.8);
    }
  }, [isExecuted, graphNodesData, graphEdgesData]);

  // Sync tooltip screen pos on animation frame if hovering
  useEffect(() => {
    let animationFrameId: number;
    const syncTooltipPos = () => {
      if (hoverNode && fgRef.current) {
        const coords = fgRef.current.graph2ScreenCoords(hoverNode.x, hoverNode.y);
        setTooltipPos(coords);
      } else {
        setTooltipPos(null);
      }
      animationFrameId = requestAnimationFrame(syncTooltipPos);
    };
    if (hoverNode) syncTooltipPos();
    else setTooltipPos(null);
    return () => cancelAnimationFrame(animationFrameId);
  }, [hoverNode]);

  const handleNodeSelect = useCallback(
    (nodeData: any) => {
      setSelectedNode(nodeData);
      setRadialMenu(null);
      const connectedIds = graphEdgesData
        .filter((e) => (e.source?.id || e.source) === nodeData.id || (e.target?.id || e.target) === nodeData.id)
        .map((e) => ((e.source?.id || e.source) === nodeData.id ? (e.target?.id || e.target) : (e.source?.id || e.source)));
      selectEntity(nodeData.id, "node", connectedIds);
      
      if (fgRef.current) {
        fgRef.current.centerAt(nodeData.x, nodeData.y, 1000);
        fgRef.current.zoom(2.5, 1000);
      }
    },
    [selectEntity, graphEdgesData]
  );

  const handleNodeRightClick = useCallback((node: any, event: MouseEvent) => {
    event.preventDefault();
    setRadialMenu({ x: event.clientX, y: event.clientY, node });
  }, []);

  const toggleCriteria = (key: string) => {
    setActiveCriteria((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Filter edges based on vector criteria
  const activeEdges = useMemo(() => {
    return graphEdgesData.filter((e) => {
      const category = classifyEdgeCategory(e);
      return activeCriteria.has(category);
    });
  }, [graphEdgesData, activeCriteria]);

  const connectedEdges = useMemo(() => {
    if (!selectedNode) return [];
    return graphEdgesData.filter(
      (e) => (e.source?.id || e.source) === selectedNode.id || (e.target?.id || e.target) === selectedNode.id
    );
  }, [selectedNode, graphEdgesData]);

  // Persistently highlighted cluster (selected node + all 1st-degree neighbors)
  const selectedCluster = useMemo(() => {
    if (!selectedNode) {
      return { nodeIds: new Set<string>(), linkSet: new Set<any>() };
    }
    const nodeIds = new Set<string>([selectedNode.id]);
    const linkSet = new Set<any>();

    activeEdges.forEach((link) => {
      const sourceId = link.source?.id || link.source;
      const targetId = link.target?.id || link.target;
      if (sourceId === selectedNode.id || targetId === selectedNode.id) {
        linkSet.add(link);
        nodeIds.add(sourceId === selectedNode.id ? targetId : sourceId);
      }
    });

    return { nodeIds, linkSet };
  }, [selectedNode, activeEdges]);

  const handleNodeHover = useCallback((node: any) => {
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    
    if (node) {
      const newHighlightNodes = new Set([node.id]);
      const newHighlightLinks = new Set();
      
      activeEdges.forEach(link => {
        const sourceId = link.source?.id || link.source;
        const targetId = link.target?.id || link.target;
        if (sourceId === node.id || targetId === node.id) {
          newHighlightLinks.add(link);
          newHighlightNodes.add(sourceId === node.id ? targetId : sourceId);
        }
      });
      setHighlightNodes(newHighlightNodes);
      setHighlightLinks(newHighlightLinks);
    }
    
    setHoverNode(node || null);
    
    const container = document.getElementById('force-graph-container');
    if (container) container.style.cursor = node ? 'pointer' : 'default';
  }, [activeEdges]);

  const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const config = nodeTypeConfig[node.nodeType] || nodeTypeConfig.username;
    
    const isDirectlySelected = selectedNode?.id === node.id;
    const isHovered = hoverNode?.id === node.id;
    const isInSelectedCluster = selectedCluster.nodeIds.has(node.id);
    const isInHoverCluster = highlightNodes.has(node.id);

    const isHighlighted = isHovered || isInHoverCluster || isDirectlySelected || isInSelectedCluster;
    // Dim other nodes if something is selected or hovered, but this node is NOT in the active set
    const isDimmed = (selectedNode || hoverNode) && !isHighlighted;
    
    const isHub = node.nodeType === 'username';
    const r = isHub ? 12 : 5; 
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
    
    if (isDimmed) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.shadowBlur = 0;
      ctx.fill();
    } else {
      ctx.fillStyle = config.color;
      ctx.shadowColor = config.color;
      ctx.shadowBlur = isDirectlySelected ? 35 : isHighlighted ? 22 : (isHub ? 15 : 6);
      ctx.fill();
      
      // Draw outer glowing target ring around directly clicked node
      if (isDirectlySelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI, false);
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      
      // Show labels for all highlighted cluster nodes, hovered nodes, and hubs
      if (isHighlighted || (isHub && globalScale > 1.0)) {
         ctx.font = `bold ${(isHub ? 12 : 10)/globalScale}px monospace`;
         ctx.textAlign = 'center';
         ctx.textBaseline = 'top';
         ctx.fillStyle = isDirectlySelected ? '#00d4ff' : '#f8fafc';
         ctx.fillText(node.label, node.x, node.y + r + 6);
      }
    }
  }, [highlightNodes, hoverNode, selectedNode, selectedCluster]);

  const handleCloseInspector = useCallback(() => {
    setSelectedNode(null);
    clearSelection();
  }, [clearSelection]);

  return (
    <div className="flex h-full w-full bg-[#030712] relative overflow-hidden text-foreground">
      
      {/* ═══ 1. Radial Context Menu (Overlay) ═══ */}
      <AnimatePresence>
        {radialMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-50 rounded-full h-40 w-40 flex items-center justify-center pointer-events-none"
            style={{ left: radialMenu.x - 80, top: radialMenu.y - 80 }}
          >
            {/* Context menu background ring */}
            <div className="absolute inset-0 rounded-full border border-slate-700/50 bg-[#0f111a]/80 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.8)]" />
            
            {/* Center target indicator */}
            <div className="h-10 w-10 rounded-full border-2 border-primary bg-transparent absolute" />
            
            {/* Menu Items */}
            <button className="absolute -top-3 flex flex-col items-center gap-1 text-slate-300 hover:text-white hover:-translate-y-1 transition-all pointer-events-auto group">
               <div className="bg-slate-800 p-2 rounded-full border border-slate-600 group-hover:bg-primary/20 group-hover:border-primary"><Share2 className="h-4 w-4" /></div>
               <span className="text-[9px] font-bold uppercase tracking-widest bg-black/50 px-1 rounded">Expand</span>
            </button>
            <button className="absolute bottom-2 -left-2 flex flex-col items-center gap-1 text-slate-300 hover:text-white hover:-translate-x-1 transition-all pointer-events-auto group">
               <div className="bg-slate-800 p-2 rounded-full border border-slate-600 group-hover:bg-primary/20 group-hover:border-primary"><Target className="h-4 w-4" /></div>
               <span className="text-[9px] font-bold uppercase tracking-widest bg-black/50 px-1 rounded">Isolate</span>
            </button>
            <button className="absolute bottom-2 -right-2 flex flex-col items-center gap-1 text-slate-300 hover:text-white hover:translate-x-1 transition-all pointer-events-auto group">
               <div className="bg-slate-800 p-2 rounded-full border border-slate-600 group-hover:bg-primary/20 group-hover:border-primary"><Pin className="h-4 w-4" /></div>
               <span className="text-[9px] font-bold uppercase tracking-widest bg-black/50 px-1 rounded">Pin Node</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 2. Tooltip Analytics (Overlay) ═══ */}
      <AnimatePresence>
        {tooltipPos && hoverNode && !radialMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed z-40 bg-[#0f111a]/90 backdrop-blur-xl border border-slate-700 p-3 rounded-lg shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-[120%]"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="flex items-center gap-2 mb-2">
               <div className="h-2 w-2 rounded-full" style={{ background: nodeTypeConfig[hoverNode.nodeType]?.color || '#fff' }} />
               <span className="text-[10px] font-bold uppercase tracking-widest text-white">{hoverNode.label}</span>
            </div>
            <div className="h-10 w-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockSparklineData}>
                  <Line type="monotone" dataKey="val" stroke={nodeTypeConfig[hoverNode.nodeType]?.color || '#3b82f6'} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1 text-right">30D Activity</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Graph Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden" onClick={() => setRadialMenu(null)}>
        {/* ═══ 1. Dynamic Web Generator (Top Action Bar) ═══ */}
        <div className={`z-30 border-b border-slate-800/80 bg-[#0a0f18]/80 backdrop-blur-lg flex-shrink-0 shadow-lg transition-all duration-300 ${selectedNode ? 'mr-[420px]' : ''}`}>
          <div className="flex items-center gap-2.5 px-4 py-2.5 min-w-0">
            {/* Target Search */}
            <div className="relative flex-1 min-w-[120px] max-w-[200px] flex-shrink">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary" />
              <input
                type="text"
                placeholder="TARGET POI SEED..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-slate-700/50 bg-[#0f111a]/50 py-1.5 pl-8 pr-2 text-[11px] uppercase tracking-widest text-slate-200 placeholder-slate-600 outline-none transition-all hover:border-slate-600 focus:border-primary focus:bg-[#0f111a] rounded-md shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
              />
            </div>

            <div className="h-5 w-px bg-slate-800 flex-shrink-0" />

            {/* Connection Criteria / Vectors */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mr-1 flex-shrink-0">VECTORS</span>
              {edgeCriteria.map((c) => {
                const isActive = activeCriteria.has(c.key);
                const Icon = c.icon;
                return (
                  <button
                    key={c.key}
                    onClick={() => toggleCriteria(c.key)}
                    title={c.label}
                    className="flex items-center gap-1 border px-2 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap rounded-md flex-shrink-0"
                    style={{
                      borderColor: isActive ? c.color : "#1e293b",
                      background: isActive ? `${c.color}15` : "transparent",
                      color: isActive ? c.color : "#64748b",
                      boxShadow: isActive ? `0 0 10px ${c.color}30` : "none"
                    }}
                  >
                    <Icon className="h-3 w-3 flex-shrink-0" />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="h-5 w-px bg-slate-800 flex-shrink-0" />

            {/* Web Depth */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowHopsDropdown(!showHopsDropdown)}
                className="flex items-center gap-1.5 border border-slate-700/50 bg-[#0f111a]/50 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-300 hover:border-primary hover:bg-[#0f111a] rounded-md transition-colors whitespace-nowrap"
              >
                HOPS: {hops}
                <ChevronDown className="h-3 w-3 text-slate-500" />
              </button>
              {showHopsDropdown && (
                <div className="absolute right-0 top-full z-dropdown mt-1 border border-slate-700 bg-[#0f111a] shadow-2xl rounded-md overflow-hidden">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => { setHops(n); setShowHopsDropdown(false); }}
                      className={`block w-full px-5 py-2 text-left text-[9px] font-black uppercase tracking-widest transition-colors hover:bg-slate-800 ${
                        hops === n ? "text-primary bg-primary/10" : "text-slate-400"
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
              onClick={handleExecute}
              disabled={isExecuting}
              className={`group relative flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap rounded-md overflow-hidden flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background ${isExecuting ? 'bg-primary/50 text-black cursor-wait' : 'bg-primary text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105'}`}
            >
              <Target className={`h-3.5 w-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
              {isExecuting ? 'EXECUTING...' : 'EXECUTE'}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded bg-black px-2 py-1 text-[9px] font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none text-white z-50">Cmd/Ctrl + E</span>
            </button>
          </div>
        </div>

        {/* ═══ 2. The "Spider Web" Canvas ═══ */}
        <div className="flex-1 relative bg-[#030712] radial-gradient-dark" id="force-graph-container">
          {!isExecuted ? (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
               <div className="flex flex-col items-center justify-center opacity-40">
                 <Target className="h-16 w-16 text-primary mb-6 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                 <p className="text-slate-300 text-sm uppercase tracking-widest font-black">
                   Enter a Target POI Seed and click Execute to generate the evidence graph.
                 </p>
               </div>
             </div>
          ) : null}
          
          {isClient && isExecuted && (
            <div className="absolute inset-0" onContextMenu={(e) => e.preventDefault()}>
                <ForceGraph2D
                  ref={fgRef}
                  graphData={{ nodes: graphNodesData, links: activeEdges }}
                  nodeCanvasObject={drawNode}
                  nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                    const isHub = node.nodeType === 'username';
                    const r = (isHub ? 12 : 5) + 4; // Add 4px padding to the hitbox
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                    ctx.fill();
                  }}
                  onNodeHover={handleNodeHover}
                  onNodeClick={handleNodeSelect}
                  onNodeRightClick={handleNodeRightClick}
                  onNodeDrag={(node, translate) => {
                    node.fx = node.x; node.fy = node.y;
                  }}
                  onNodeDragEnd={(node) => {
                    node.fx = node.x; node.fy = node.y;
                  }}
                  // DIRECTIONAL PARTICLE FLOW & NEURAL PATHWAYS
                  linkDirectionalParticles={(link: any) => {
                    const isLinkActive = highlightLinks.has(link) || selectedCluster.linkSet.has(link);
                    return isLinkActive ? 4 : 2;
                  }}
                  linkDirectionalParticleWidth={(link: any) => {
                    const isLinkActive = highlightLinks.has(link) || selectedCluster.linkSet.has(link);
                    return isLinkActive ? 3.5 : 2;
                  }}
                  linkDirectionalParticleSpeed={(link: any) => {
                    const isLinkActive = highlightLinks.has(link) || selectedCluster.linkSet.has(link);
                    return isLinkActive ? 0.008 : 0.004;
                  }}
                  linkDirectionalParticleColor={(link: any) => {
                    const cat = classifyEdgeCategory(link);
                    return EDGE_COLORS[cat] || "#38bdf8";
                  }}
                  linkWidth={(link: any) => {
                    const isLinkActive = highlightLinks.has(link) || selectedCluster.linkSet.has(link);
                    return isLinkActive ? 2.5 : 1.2;
                  }}
                  linkColor={(link: any) => {
                    const isLinkActive = highlightLinks.has(link) || selectedCluster.linkSet.has(link);
                    const isDimmedLink = (selectedNode || hoverNode) && !isLinkActive;
                    if (isDimmedLink) return 'rgba(255,255,255,0.02)';
                    const cat = classifyEdgeCategory(link);
                    const baseColor = EDGE_COLORS[cat] || "#38bdf8";
                    return isLinkActive ? baseColor : `${baseColor}60`;
                  }}
                  linkCurvature={0.1}
                  onBackgroundClick={() => {
                    handleCloseInspector();
                  }}
                  backgroundColor="#030712"
                  d3AlphaDecay={0.08}
                  d3VelocityDecay={0.7}
                  cooldownTicks={120}
                />
            </div>
          )}

          {/* Minimap Overlay (Translucent SVG bounds) */}
          {isExecuted && (
            <div className={`absolute bottom-20 z-20 w-32 h-32 bg-[#0f111a]/60 border border-slate-700 rounded-lg shadow-2xl backdrop-blur-md overflow-hidden pointer-events-none transition-all duration-300 ${selectedNode ? 'right-[440px]' : 'right-6'}`}>
              <svg width="100%" height="100%" viewBox="-300 -300 600 600" preserveAspectRatio="xMidYMid meet">
                 {/* Links */}
                 {activeEdges.map((e, i) => {
                   const s = typeof e.source === 'object' ? e.source : graphNodesData.find(n => n.id === e.source);
                   const t = typeof e.target === 'object' ? e.target : graphNodesData.find(n => n.id === e.target);
                   if (!s || !t || s.x === undefined || t.x === undefined) return null;
                   return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
                 })}
                 {/* Nodes */}
                 {graphNodesData.map((n, i) => {
                   if (n.x === undefined) return null;
                   return <circle key={i} cx={n.x} cy={n.y} r={n.nodeType === 'username' ? 20 : 8} fill={nodeTypeConfig[n.nodeType]?.color || '#fff'} />
                 })}
              </svg>
              <div className="absolute bottom-1 right-1 text-[7px] text-slate-500 font-bold uppercase">Minimap</div>
            </div>
          )}

          {/* Custom Zoom Controls */}
          {isExecuted && (
             <div className={`absolute top-6 z-10 flex flex-col border border-slate-700 bg-[#0f111a]/80 shadow-2xl rounded-md overflow-hidden backdrop-blur-md transition-all duration-300 ${selectedNode ? 'right-[440px]' : 'right-6'}`}>
               <button 
                 onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.5, 400)} 
                 aria-label="Zoom in graph"
                 className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 border-b border-slate-700 transition-colors focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
               >
                 <Plus className="h-4 w-4" />
               </button>
               <button 
                 onClick={() => fgRef.current?.zoom(fgRef.current.zoom() / 1.5, 400)} 
                 aria-label="Zoom out graph"
                 className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 border-b border-slate-700 transition-colors focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
               >
                 <div className="h-4 w-4 flex items-center justify-center"><div className="w-3 h-0.5 bg-current" /></div>
               </button>
               <button 
                 onClick={() => fgRef.current?.zoomToFit(400)} 
                 aria-label="Fit graph to view"
                 className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
               >
                 <Crosshair className="h-4 w-4" />
               </button>
             </div>
          )}

          {/* Floating Collapsible Legend Panel */}
          <div className="absolute bottom-20 left-6 z-10 flex flex-col gap-2 pointer-events-none">
              <div className="border border-slate-700/80 bg-[#0f111a]/80 p-4 max-w-[220px] rounded-lg shadow-2xl backdrop-blur-md">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-700 pb-2 flex items-center gap-2"><Lock className="h-3 w-3"/> TAXONOMY</h4>
                <div className="flex flex-col gap-2.5">
                  {Object.entries(nodeTypeConfig).map(([key, config]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: config.color, boxShadow: `0 0 10px ${config.color}80` }} />
                        <span className="text-[9px] font-bold tracking-widest text-slate-200">{config.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          </div>
          
          {/* Hacker Telemetry Footer */}
          <div className={`absolute bottom-0 inset-x-0 h-10 border-t border-slate-800 bg-black/80 backdrop-blur-md z-30 flex items-center justify-between px-6 font-mono text-[9px] uppercase tracking-widest text-slate-400 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] pointer-events-none transition-all duration-300 ${selectedNode ? 'pr-[430px]' : ''}`}>
             <div className="flex items-center gap-6">
                <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"/> SYSTEM LIVE</span>
                <span>DATA INGEST: 67 EPS</span>
                <span>CPU LOAD: 4%</span>
             </div>
             <div className="flex items-center gap-6 text-primary">
                <span>ACTIVE NODES: {graphNodesData.length}</span>
                <span>EDGES: {activeEdges.length}</span>
                <span>FPS: 60.0</span>
             </div>
          </div>

        </div>
      </div>

      {/* ═══ 3. Data-Dense Inspector Panel ═══ */}
      {selectedNode && (() => {
        const selConfig = nodeTypeConfig[selectedNode.nodeType] || nodeTypeConfig.username;
        const SelIcon = selConfig.icon;
        const role = roleConfig[selectedNode.suspectRole] || roleConfig.unknown;
        const isCurrentTarget = selectedNode.id === targetId;
        const mockHash = Array.from(selectedNode.id).reduce((acc: string, char: any) => acc + char.charCodeAt(0).toString(16), "8f43") + "a9b2c3d4e5f6";

        return (
          <div
            className="absolute right-0 top-0 bottom-0 z-40 flex w-[420px] max-w-full flex-col border-l border-slate-700 bg-[#0a0f18]/95 backdrop-blur-2xl overflow-hidden shadow-2xl"
            style={{ animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            {/* Dossier Header */}
            <div className="flex items-center justify-between border-b border-slate-700/50 bg-[#0f111a] px-5 py-5 flex-shrink-0">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border shadow-lg" style={{ borderColor: `${selConfig.color}50`, background: `${selConfig.color}15`, boxShadow: `0 0 20px ${selConfig.color}20` }}>
                  <SelIcon className="h-6 w-6" style={{ color: selConfig.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: selConfig.color }}>
                    {selConfig.label}
                  </p>
                  <h3 className="text-lg font-black text-white truncate uppercase tracking-wider">{selectedNode.label}</h3>
                </div>
              </div>
              <button
                onClick={handleCloseInspector}
                className="p-1.5 text-slate-500 rounded-full hover:bg-slate-800 transition-colors hover:text-white flex-shrink-0 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              {/* TARGET ACTION */}
              <div className="p-5 border-b border-slate-700/50 shrink-0 bg-[#0a0f18]">
                 {isCurrentTarget ? (
                   <div className="w-full flex items-center justify-center gap-2 bg-primary/10 py-2.5 text-xs font-black uppercase tracking-widest text-primary border border-primary/30 rounded shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                     <Target className="h-4 w-4" />
                     PRIMARY TARGET LOCKED
                   </div>
                 ) : (
                   <button 
                    onClick={() => setTargetId(selectedNode.id)}
                    className="w-full flex items-center justify-center gap-2 bg-[#ef4444] py-2.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-red-600 rounded shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] focus:outline-none"
                  >
                    <Crosshair className="h-4 w-4" />
                    DESIGNATE NEW TARGET
                  </button>
                 )}
              </div>

              {/* Status Badges */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 shrink-0 bg-black/20">
                <span className="border border-slate-600 px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest text-slate-300 shadow-inner">
                  RISK: <span className="text-white">{selectedNode.riskScore}</span>
                </span>
                <span
                  className="border px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-inner"
                  style={{ borderColor: role.color, color: role.color, background: `${role.color}10` }}
                >
                  [{role.label}]
                </span>
              </div>

              {/* INTERACTIVE PLATFORM BADGES */}
              {selectedNode.metadata && (
                <div className="px-5 py-4 border-b border-slate-700/50 shrink-0">
                  <h4 className="mb-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    ENTITY METADATA
                  </h4>
                  <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-black/40 shadow-inner">
                    {Object.entries(selectedNode.metadata).map(([key, value]: any, i, arr) => (
                      <div key={key} className={`flex items-center justify-between px-4 py-2.5 text-[10px] ${i < arr.length - 1 ? "border-b border-slate-700/50" : ""}`}>
                        <span className="font-bold uppercase tracking-wider text-slate-400">{key}</span>
                        {key.toLowerCase() === 'platform' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1.5 bg-slate-800 border border-slate-600 px-2 py-0.5 rounded-full text-slate-200 font-bold"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"/> AlphaBay</span>
                            <span className="flex items-center gap-1.5 bg-slate-800 border border-slate-600 px-2 py-0.5 rounded-full text-slate-200 font-bold"><div className="h-1.5 w-1.5 rounded-full bg-[#ef4444]"/> Hydra</span>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-200 text-right truncate">{value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Intel Summary */}
              <div className="px-5 py-4 border-b border-slate-700/50 shrink-0 bg-black/20">
                <h4 className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">INTELLIGENCE BRIEF</h4>
                <p className="text-[11px] leading-relaxed text-slate-300 font-serif border-l-2 border-primary/50 pl-3">{selectedNode.details}</p>
              </div>

              {/* Dense Data Table: Correlated Entities */}
              <div className="px-5 py-4 shrink-0 mb-4 flex-1">
                <h4 className="mb-3 text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Link2 className="h-3 w-3" /> CORRELATED ENTITIES ({connectedEdges.length})
                </h4>
                <div className="space-y-2">
                  {connectedEdges.map((edge) => {
                    const connectedId = (edge.source?.id || edge.source) === selectedNode.id ? (edge.target?.id || edge.target) : (edge.source?.id || edge.source);
                    const connectedNode = graphNodesData.find((n) => n.id === connectedId);
                    if (!connectedNode) return null;
                    const cfg = nodeTypeConfig[connectedNode.nodeType] || nodeTypeConfig.username;
                    const ConnIcon = cfg.icon;
                    const linkStrength = Math.floor(Math.random() * 60) + 40; // mock 40-100%
                    
                    return (
                      <div key={edge.id} className="flex flex-col border border-slate-700/50 bg-[#0f111a] rounded-lg overflow-hidden group hover:border-primary/50 transition-colors">
                        <button onClick={() => handleNodeSelect(connectedNode)} className="flex items-center gap-3 p-2.5 w-full text-left">
                           <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-800 border" style={{ borderColor: `${cfg.color}50` }}>
                             <ConnIcon className="h-4 w-4" style={{ color: cfg.color }} />
                           </div>
                           <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-center mb-0.5">
                               <p className="text-[10px] font-black text-white uppercase tracking-widest truncate">{connectedNode.label}</p>
                               <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-primary transition-colors" />
                             </div>
                             <p className="text-[8px] text-slate-500 uppercase tracking-widest truncate">{edge.label}</p>
                           </div>
                        </button>
                        {/* Dense Table Metadata (Link Strength + Sparkline) */}
                        <div className="flex items-center gap-4 bg-black/40 px-3 py-1.5 border-t border-slate-800">
                           <div className="flex-1">
                             <div className="flex justify-between text-[7px] font-black uppercase tracking-widest text-slate-500 mb-1">
                               <span>Link Strength</span>
                               <span className="text-primary">{linkStrength}%</span>
                             </div>
                             <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                               <div className="h-full bg-gradient-to-r from-primary to-cyan-300" style={{ width: `${linkStrength}%` }}/>
                             </div>
                           </div>
                           <div className="h-6 w-16">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockSparklineData}>
                                  <Area type="monotone" dataKey="val" stroke={cfg.color} strokeWidth={1} fill={cfg.color} fillOpacity={0.2} isAnimationActive={false}/>
                                </AreaChart>
                              </ResponsiveContainer>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Forensic Footer */}
            <div className="border-t border-slate-700 p-4 bg-[#0a0f18] flex-shrink-0 z-20">
              <div className="flex items-center justify-between mb-4 text-[8px] text-slate-500 font-bold tracking-widest uppercase bg-black/30 p-2 rounded border border-slate-800">
                <span className="flex items-center gap-1.5"><Hash className="h-3 w-3 text-slate-400"/> SHA-256 SUM</span>
                <span className="font-mono text-slate-400">{mockHash}</span>
              </div>
              <button className="group relative flex w-full items-center justify-center gap-2 rounded border border-slate-600 bg-slate-800 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-200 transition-all hover:bg-slate-700 hover:border-slate-500 focus:outline-none overflow-hidden shadow-inner">
                <Plus className="h-3.5 w-3.5" />
                APPEND TO DOSSIER
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-black px-2 py-1 text-[8px] font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none text-white z-50 transition-all">Cmd/Ctrl + D</span>
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
        .radial-gradient-dark {
          background: radial-gradient(circle at 50% 50%, #0a0f18 0%, #030712 100%);
        }
      `}} />
    </div>
  );
}
