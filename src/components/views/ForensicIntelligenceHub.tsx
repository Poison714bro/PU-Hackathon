"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Users,
  GitBranch,
  Search,
  Network,
  Scale,
  Zap,
  Lock,
  ArrowRight,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/apiClient";
import {
  calculateCentralityScores,
  findShortestPath,
  type CentralityMetrics,
  type GraphNode,
  type GraphEdge,
} from "@/lib/graphAnalytics";

export function ForensicIntelligenceHub() {
  const [activeTab, setActiveTab] = useState<string>("syndicates");
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState<any[]>([]);
  const [kingpins, setKingpins] = useState<any[]>([]);
  const [flowSource, setFlowSource] = useState("ent-001");
  const [flowTarget, setFlowTarget] = useState("wallet-xmr-1");
  const [flowPath, setFlowPath] = useState<{ path: string[]; hops: number; found: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api.graph.topology().then((res) => {
      if (cancelled) return;
      if (res.ok && res.data) {
        const nodes: GraphNode[] = (res.data.nodes || []).map((n: any) => ({
          id: n.id,
          label: n.label || n.name || n.id,
          type: n.nodeType || n.type || "target",
          ...n,
        }));
        const edges: GraphEdge[] = (res.data.edges || []).map((e: any) => ({
          source: typeof e.source === "object" ? e.source.id : e.source,
          target: typeof e.target === "object" ? e.target.id : e.target,
          label: e.label || e.relation || "",
          ...e,
        }));

        const centrality = calculateCentralityScores(nodes, edges);
        const rankedKingpins = Object.entries(centrality).map(([id, metrics]) => {
          const node = nodes.find((n) => n.id === id);
          return {
            id,
            label: node?.label || id,
            type: node?.type || "entity",
            ...metrics,
          };
        }).sort((a, b) => b.kingpinIndex - a.kingpinIndex);

        setKingpins(rankedKingpins);

        // Community grouping
        const clusterMap = new Map<string, string[]>();
        nodes.forEach((n) => {
          const cId = n.cluster || n.syndicate || "Syndicate-Alpha";
          if (!clusterMap.has(cId)) clusterMap.set(cId, []);
          clusterMap.get(cId)!.push(n.id);
        });

        const commList = Array.from(clusterMap.entries()).map(([cId, memberIds], idx: number) => {
          const memberNodes = memberIds.map((m: string) => nodes.find((n) => n.id === m) || { id: m, label: m, type: "entity" });
          const targetCount = memberNodes.filter((m: any) => m.type === "target" || m.type === "username").length;
          const infraCount = memberNodes.filter((m: any) => m.type !== "target" && m.type !== "username").length;

          return {
            id: cId || `Cluster-${idx + 1}`,
            name: cId.replace(/_/g, " "),
            density: 0.75,
            threatTier: targetCount > 1 ? "HIGH" : "MEDIUM",
            targetCount,
            infraCount,
            members: memberNodes,
          };
        });

        setCommunities(commList);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleTraceFlow = () => {
    // Local path finding simulation
    const dummyNodes: GraphNode[] = [
      { id: "ent-001", label: "DarkPhoenix_77", type: "username" },
      { id: "mixer-01", label: "ChipMixer_Relay", type: "wallet" },
      { id: "wallet-xmr-1", label: "Cold_Monero_Vault", type: "wallet" },
    ];
    const dummyEdges: GraphEdge[] = [
      { source: "ent-001", target: "mixer-01" },
      { source: "mixer-01", target: "wallet-xmr-1" },
    ];
    const result = findShortestPath(dummyNodes, dummyEdges, flowSource, flowTarget);
    setFlowPath(result);
  };

  return (
    <div className="flex h-full flex-col bg-[#050914] text-slate-200 overflow-y-auto custom-scrollbar p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-[#00d4ff]" />
            <h1 className="text-xl font-black uppercase tracking-wider text-white">
              Forensic Intelligence Hub
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic Semantica ContextGraph analysis, community detection, and laundering tracers.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 bg-[#0c1222] p-1.5 rounded-lg border border-slate-800">
          {[
            { id: "syndicates", label: "Cartels & Syndicates", icon: Users },
            { id: "kingpins", label: "Kingpins & Brokers", icon: Activity },
            { id: "flow", label: "Laundering Tracer", icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
                  isActive
                    ? "bg-[#00d4ff] text-slate-950 shadow-[0_0_12px_rgba(0,212,255,0.4)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "syndicates" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Detected Criminal Communities (Louvain Modularity)
            </h2>
            <span className="text-xs text-[#00d4ff] font-mono font-bold">
              {communities.length} Active Syndicates
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map((comm: any, idx: number) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-[#0a0f1d]/80 p-4 space-y-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white text-sm uppercase">{comm.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      comm.threatTier === "HIGH"
                        ? "bg-rose-950/40 border-rose-800 text-rose-400"
                        : "bg-amber-950/40 border-amber-800 text-amber-400"
                    }`}
                  >
                    {comm.threatTier} RISK
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-black/30 p-2 rounded border border-slate-800/60">
                    <span className="text-slate-500 block text-[10px]">TARGETS</span>
                    <span className="text-white font-bold">{comm.targetCount}</span>
                  </div>
                  <div className="bg-black/30 p-2 rounded border border-slate-800/60">
                    <span className="text-slate-500 block text-[10px]">INFRASTRUCTURE</span>
                    <span className="text-cyan-400 font-bold">{comm.infraCount}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Members:</span>
                  <div className="flex flex-wrap gap-1">
                    {comm.members.map((m: any, mIdx: number) => (
                      <span
                        key={mIdx}
                        className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700"
                      >
                        {m.label || m.id}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "kingpins" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Kingpin & Key Broker Index (PageRank + Centrality)
            </h2>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0a0f1d] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Entity Identifier</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Kingpin Index</th>
                    <th className="p-3">PageRank</th>
                    <th className="p-3">Betweenness</th>
                    <th className="p-3">Inferred Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {kingpins.map((k: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-bold text-[#00d4ff]">#{idx + 1}</td>
                      <td className="p-3 font-bold text-white">{k.label}</td>
                      <td className="p-3 text-slate-400">{k.type}</td>
                      <td className="p-3 font-bold text-amber-400">{k.kingpinIndex.toFixed(1)}</td>
                      <td className="p-3 text-slate-300">{k.pagerank.toFixed(3)}</td>
                      <td className="p-3 text-slate-300">{k.betweenness.toFixed(3)}</td>
                      <td className="p-3">
                        <span className="bg-slate-800 text-cyan-300 px-2 py-0.5 rounded text-[10px] border border-slate-700">
                          {k.inferredRole}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "flow" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#0a0f1d] p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Zap className="h-5 w-5 text-amber-400" />
              <h2 className="text-sm font-bold uppercase text-white tracking-wider">
                Money Laundering Route Tracer (Dijkstra Shortest Path)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Source POI or Deposit Address:
                </label>
                <input
                  type="text"
                  value={flowSource}
                  onChange={(e) => setFlowSource(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-black/50 px-3 py-2 text-xs font-mono text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Target Mixer or Destination Wallet:
                </label>
                <input
                  type="text"
                  value={flowTarget}
                  onChange={(e) => setFlowTarget(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-black/50 px-3 py-2 text-xs font-mono text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              onClick={handleTraceFlow}
              className="px-4 py-2 rounded-lg bg-[#00d4ff] text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-cyan-300 transition-colors shadow-[0_0_12px_rgba(0,212,255,0.3)]"
            >
              Trace Laundering Corridors
            </button>

            {flowPath && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">HOPS TRAVERSED:</span>
                  <span className="text-emerald-400 font-bold">{flowPath.hops} Hops</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  {flowPath.path.map((nodeId: string, idx: number) => (
                    <React.Fragment key={idx}>
                      <span className="bg-slate-800 text-[#00d4ff] px-2.5 py-1 rounded border border-slate-700">
                        {nodeId}
                      </span>
                      {idx < flowPath.path.length - 1 && <span className="text-slate-500">→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ForensicIntelligenceHub;
