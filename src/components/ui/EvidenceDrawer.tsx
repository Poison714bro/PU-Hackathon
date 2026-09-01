"use client";

import type React from "react";
import {
  X,
  User,
  Wallet,
  Mail,
  Key,
  ShoppingBag,
  Plus,
  MapPin as MapPinIcon,
  ExternalLink,
  Clock,
  Shield,
  Package,
  Users,
  FileText,
} from "lucide-react";
import { graphNodesData, graphEdgesData, mapPinsData, type GraphNodeData, type MapPin } from "@/lib/mockData";
import { getRiskColor, getRiskLabel, getDrugColor } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

const nodeTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  username: { icon: User, color: "#00d4ff", label: "Username / Alias" },
  wallet: { icon: Wallet, color: "#f97316", label: "Crypto Wallet" },
  email: { icon: Mail, color: "#a78bfa", label: "Email Address" },
  pgp: { icon: Key, color: "#fbbf24", label: "PGP Key" },
  listing: { icon: ShoppingBag, color: "#f43f5e", label: "Marketplace Listing" },
};

const roleConfig: Record<string, { label: string; color: string }> = {
  supplier: { label: "Supplier", color: "#ef4444" },
  dealer: { label: "Dealer", color: "#f97316" },
  buyer: { label: "Buyer", color: "#3b82f6" },
  courier: { label: "Courier", color: "#a855f7" },
  unknown: { label: "Unknown", color: "#64748b" },
};

interface EvidenceDrawerProps {
  type: "node" | "pin";
  nodeData?: GraphNodeData | null;
  pinData?: MapPin | null;
  onClose: () => void;
}

export default function EvidenceDrawer({ type, nodeData, pinData, onClose }: EvidenceDrawerProps) {
  const navigateToEntity = useAppStore((s) => s.navigateToEntity);

  if (type === "pin" && pinData) {
    return <PinDrawer pin={pinData} onClose={onClose} navigateToEntity={navigateToEntity} />;
  }
  if (type === "node" && nodeData) {
    return <NodeDrawer node={nodeData} onClose={onClose} navigateToEntity={navigateToEntity} />;
  }
  return null;
}

// ── Pin Detail Drawer ──
function PinDrawer({
  pin,
  onClose,
  navigateToEntity,
}: {
  pin: MapPin;
  onClose: () => void;
  navigateToEntity: (id: string, type: "pin" | "node", view: "dashboard" | "map" | "evidence" | "investigations") => void;
}) {
  const linkedNodes = graphNodesData.filter((n) => pin.linkedNodeIds.includes(n.id));
  const color = getDrugColor(pin.drugCategory);
  const riskColor = getRiskColor(pin.riskScore);

  return (
    <div className="drawer-enter z-drawer flex w-96 flex-col border-l border-border bg-[var(--card)]/95 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}
          >
            <MapPinIcon className="h-5 w-5" style={{ color }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{pin.label}</h3>
            <p className="text-[10px] text-muted-foreground">{pin.drugCategory}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-slate-800 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-auto p-5">
        {/* Risk & Category */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}>
            {pin.drugCategory}
          </span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: riskColor, background: `${riskColor}15` }}>
            Risk: {pin.riskScore} — {getRiskLabel(pin.riskScore)}
          </span>
        </div>

        {/* Description */}
        <div>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Intel Summary</h4>
          <p className="text-xs leading-relaxed text-foreground">{pin.details}</p>
        </div>

        {/* Arrest Report */}
        <div>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Arrest / Seizure Report</h4>
          <div className="rounded-lg border border-border bg-slate-900/50">
            <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Package className="h-3 w-3" /> Confiscated</span>
              <span className="font-mono font-medium text-foreground">{pin.confiscatedAmount || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Shield className="h-3 w-3" /> Arrests</span>
              <span className="font-mono font-medium text-foreground">{pin.arrestCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground"><MapPinIcon className="h-3 w-3" /> Coordinates</span>
              <span className="font-mono font-medium text-foreground">{pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3 w-3" /> Date</span>
              <span className="font-mono font-medium text-foreground">{pin.date}</span>
            </div>
          </div>
        </div>

        {/* Suspects */}
        {pin.suspectNames && pin.suspectNames.length > 0 && (
          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Known Suspects</h4>
            <div className="space-y-1.5">
              {pin.suspectNames.map((name: string, i: number) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-slate-900/30 px-3 py-2 text-xs">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-foreground">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Graph Nodes */}
        {linkedNodes.length > 0 && (
          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Linked Intelligence Entities
            </h4>
            <div className="space-y-2">
              {linkedNodes.map((node) => {
                const config = nodeTypeConfig[node.type];
                const Icon = config.icon;
                return (
                  <button
                    key={node.id}
                    onClick={() => navigateToEntity(node.id, "node", "evidence")}
                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-slate-900/30 px-3 py-2.5 text-left transition-colors hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${config.color}15` }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-xs font-medium text-foreground">{node.label}</p>
                      <p className="text-[10px] text-muted-foreground">View in Evidence Graph →</p>
                    </div>
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: getRiskColor(node.riskScore) }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500/10 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
          <Plus className="h-3.5 w-3.5" />
          Add to Investigation Log
        </button>
      </div>
    </div>
  );
}

// ── Node Detail Drawer ──
function NodeDrawer({
  node,
  onClose,
  navigateToEntity,
}: {
  node: GraphNodeData;
  onClose: () => void;
  navigateToEntity: (id: string, type: "pin" | "node", view: "dashboard" | "map" | "evidence" | "investigations") => void;
}) {
  const config = nodeTypeConfig[node.type];
  const Icon = config.icon;
  const riskColor = getRiskColor(node.riskScore);
  const role = roleConfig[node.suspectRole] || roleConfig.unknown;
  const linkedPins = mapPinsData.filter((p) => node.linkedPinIds.includes(p.id));
  const connectedEdges = graphEdgesData.filter((e) => e.source === node.id || e.target === node.id);

  return (
    <div className="drawer-enter z-drawer flex w-96 flex-col border-l border-border bg-[var(--card)]/95 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: `${config.color}15`, border: `1px solid ${config.color}30` }}
          >
            <Icon className="h-5 w-5" style={{ color: config.color }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{node.label}</h3>
            <p className="text-[10px] capitalize text-muted-foreground">{config.label}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-slate-800 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-auto p-5">
        {/* Risk Score & Role */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{ background: `${riskColor}15`, border: `1px solid ${riskColor}30` }}
          >
            <div className="h-2 w-2 rounded-full" style={{ background: riskColor }} />
            <span className="text-xs font-bold" style={{ color: riskColor }}>
              Risk: {node.riskScore} — {getRiskLabel(node.riskScore)}
            </span>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold role-${node.suspectRole}`}>
            {role.label}
          </span>
        </div>

        {/* Description */}
        <div>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Evidence Summary</h4>
          <p className="text-xs leading-relaxed text-foreground">{node.details}</p>
        </div>

        {/* Metadata */}
        <div>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Intelligence Data</h4>
          <div className="rounded-lg border border-border bg-slate-900/50">
            {Object.entries(node.metadata).map(([key, value], i, arr) => (
              <div key={key} className={`flex items-center justify-between px-3 py-2 text-xs ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
                <span className="text-muted-foreground">{key}</span>
                <span className="font-mono font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Connected Entities */}
        <div>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Connected Entities</h4>
          <div className="space-y-2">
            {connectedEdges.map((edge) => {
              const connectedId = edge.source === node.id ? edge.target : edge.source;
              const connectedNode = graphNodesData.find((n) => n.id === connectedId);
              if (!connectedNode) return null;
              const cfg = nodeTypeConfig[connectedNode.type];
              const ConnIcon = cfg.icon;
              const methodLabel = edge.contactMethod === "encrypted" ? "🔒 Encrypted" : edge.contactMethod === "in-person" ? "🤝 In-Person" : edge.contactMethod === "phone" ? "📞 Phone" : "🌐 Darknet";
              return (
                <button
                  key={edge.id}
                  onClick={() => navigateToEntity(connectedNode.id, "node", "evidence")}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-slate-900/30 px-3 py-2.5 text-left transition-colors hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${cfg.color}15` }}>
                    <ConnIcon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-xs font-medium text-foreground">{connectedNode.label}</p>
                    <p className="text-[10px] text-muted-foreground">{edge.label} • {methodLabel}</p>
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: getRiskColor(connectedNode.riskScore) }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Linked Map Locations */}
        {linkedPins.length > 0 && (
          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Linked Locations</h4>
            <div className="space-y-2">
              {linkedPins.map((pin) => (
                <button
                  key={pin.id}
                  onClick={() => navigateToEntity(pin.id, "pin", "map")}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-slate-900/30 px-3 py-2.5 text-left transition-colors hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${getDrugColor(pin.drugCategory)}15` }}>
                    <MapPinIcon className="h-3.5 w-3.5" style={{ color: getDrugColor(pin.drugCategory) }} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-xs font-medium text-foreground">{pin.label}</p>
                    <p className="text-[10px] text-muted-foreground">Locate on Map →</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        <div>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Activity Timeline</h4>
          <div className="space-y-0">
            {[
              { time: "2h ago", event: "Risk score updated to " + node.riskScore, type: "update" },
              { time: "6h ago", event: "New connection identified", type: "connection" },
              { time: "1d ago", event: "Entity flagged by automated scanner", type: "alert" },
              { time: "3d ago", event: "First observed in intelligence feed", type: "create" },
            ].map((log, i) => (
              <div key={i} className="flex gap-3 pb-3">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-slate-600" />
                  {i < 3 && <div className="mt-1 h-full w-px bg-slate-800" />}
                </div>
                <div>
                  <p className="text-[11px] text-foreground">{log.event}</p>
                  <p className="text-[10px] text-slate-600">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="space-y-2 border-t border-border p-4">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500/10 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
          <Plus className="h-3.5 w-3.5" />
          Add to Investigation Log
        </button>
        <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs text-muted-foreground transition-colors hover:bg-slate-800 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
          <FileText className="h-3.5 w-3.5" />
          Export Evidence Report
        </button>
      </div>
    </div>
  );
}
