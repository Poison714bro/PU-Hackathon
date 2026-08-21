"use client";

import { useState } from "react";
import { ArrowLeft, Search, Eye, Clock, ChevronRight, Filter, ShieldAlert } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { STATUS_COLORS, RISK_COLORS } from "@/lib/utils";

const investigationsData = [
  { caseId: "INV-2026-001", target: "DarkPhoenix_77", agent: "Agent Torres", risk: "Critical", status: "Open", updated: "2 hours ago" },
  { caseId: "INV-2026-002", target: "S11kR0ad_Vendor", agent: "Agent Rivera", risk: "Critical", status: "Arrest Warrant", updated: "4 hours ago" },
  { caseId: "INV-2026-003", target: "CartelPlug_X", agent: "Agent Torres", risk: "Critical", status: "Open", updated: "6 hours ago" },
  { caseId: "INV-2026-004", target: "Fent_Press_Ops", agent: "Agent Nakamura", risk: "Critical", status: "Preparing Brief", updated: "8 hours ago" },
  { caseId: "INV-2026-005", target: "Golden_Triangle_Ops", agent: "Agent Chen", risk: "Critical", status: "Open", updated: "12 hours ago" },
  { caseId: "INV-2026-006", target: "Cali_Cartel_2.0", agent: "Agent Rivera", risk: "Critical", status: "Arrest Warrant", updated: "1 day ago" },
  { caseId: "INV-2026-007", target: "White_Dragon_HK", agent: "Agent Patel", risk: "High", status: "Open", updated: "1 day ago" },
  { caseId: "INV-2026-008", target: "ChemKing2026", agent: "Agent Patel", risk: "High", status: "Preparing Brief", updated: "2 days ago" },
  { caseId: "INV-2026-009", target: "@Ghost_Supply", agent: "Agent Chen", risk: "High", status: "Open", updated: "2 days ago" },
  { caseId: "INV-2026-010", target: "MethLabMike", agent: "Agent Torres", risk: "Critical", status: "Closed", updated: "3 days ago" },
  { caseId: "INV-2026-011", target: "SnowFall_Direct", agent: "Agent Nakamura", risk: "High", status: "Open", updated: "3 days ago" },
  { caseId: "INV-2026-012", target: "Blow_Cartel_MIA", agent: "Agent Rivera", risk: "Critical", status: "Preparing Brief", updated: "4 days ago" },
  { caseId: "INV-2026-013", target: "Cocaine_Cowboy", agent: "Agent Torres", risk: "High", status: "Open", updated: "5 days ago" },
  { caseId: "INV-2026-014", target: "Meth_Chef_MEX", agent: "Agent Rivera", risk: "Critical", status: "Arrest Warrant", updated: "5 days ago" },
  { caseId: "INV-2026-015", target: "Heroin_Hub_TR", agent: "Agent Chen", risk: "High", status: "Open", updated: "6 days ago" },
  { caseId: "INV-2026-016", target: "El_Chapo_Junior", agent: "Agent Patel", risk: "Medium", status: "Preparing Brief", updated: "1 week ago" },
  { caseId: "INV-2026-017", target: "NightOwl_Pharm", agent: "Agent Nakamura", risk: "Medium", status: "Open", updated: "1 week ago" },
  { caseId: "INV-2026-018", target: "AcidWizard420", agent: "Agent Chen", risk: "Low", status: "Open", updated: "1 week ago" },
  { caseId: "INV-2026-019", target: "PharmaGrad_RU", agent: "Agent Patel", risk: "Medium", status: "Preparing Brief", updated: "2 weeks ago" },
];

export default function ReportInvestigations() {
  const setActiveView = useAppStore((s) => s.setActiveView);
  const openDossier = useAppStore((s) => s.openDossier);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const filtered = investigationsData.filter((inv) => {
    const matchesSearch = inv.target.toLowerCase().includes(searchQuery.toLowerCase()) || inv.caseId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      {/* Breadcrumb */}
      <div className="shrink-0 border-b border-border bg-card px-6 py-4">
        <button onClick={() => setActiveView("dashboard")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mb-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Operations Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> Active Investigations
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Case management data table • {investigationsData.length} total cases</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-background border border-border rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              {["All", "Open", "Preparing Brief", "Arrest Warrant", "Closed"].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border transition-all ${statusFilter === s ? "border-primary/50 bg-cyan-500/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-card border-b border-border">
            <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <th className="px-6 py-3 text-left">Case ID</th>
              <th className="px-4 py-3 text-left">Primary Target</th>
              <th className="px-4 py-3 text-left">Assigned Agent</th>
              <th className="px-4 py-3 text-center">Risk Level</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Last Updated</th>
              <th className="px-6 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.caseId} onClick={() => openDossier(inv.target)} className="border-b border-border/50 cursor-pointer transition-colors hover:bg-slate-800/30 group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
                <td className="px-6 py-4 font-mono text-xs text-primary">{inv.caseId}</td>
                <td className="px-4 py-4 text-sm font-bold text-white">{inv.target}</td>
                <td className="px-4 py-4 text-xs text-muted-foreground">{inv.agent}</td>
                <td className="px-4 py-4 text-center">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${RISK_COLORS[inv.risk]}`}>{inv.risk}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${STATUS_COLORS[inv.status]}`}>{inv.status}</span>
                </td>
                <td className="px-4 py-4 text-right text-[11px] text-muted-foreground flex items-center justify-end gap-1"><Clock className="h-3 w-3" />{inv.updated}</td>
                <td className="px-6 py-4 text-right focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"><ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-primary transition-colors" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
