"use client";

import { useState } from "react";
import { ArrowLeft, Bell, Check, ArrowUpRight, XCircle, Clock, ChevronRight } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface AlertItem {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  payload: string;
  timestamp: string;
  source: string;
  acknowledged: boolean;
}

const alertsRaw: AlertItem[] = [
  { id: "ALT-001", severity: "critical", title: "Fentanyl Bulk Listing Detected", description: "DarkPhoenix_77 posted a new bulk fentanyl listing on Hydra Market with international shipping enabled.", payload: "ALERT: Vendor DarkPhoenix_77 created listing LST-8829 — 'Fentanyl HCL 99% Pure 500g Bulk' on Hydra Market.\nPrice: 0.5 BTC / 100g\nShipping: International\nEscrow: Multi-Sig\nPGP Fingerprint: F9B2...3B62\nFirst seen: 2026-08-17T14:22:00Z\n\nRecommendation: Immediate escalation — matches known supply chain pattern from Sinaloa precursor lab.", timestamp: "2h ago", source: "Hydra Market", acknowledged: false },
  { id: "ALT-002", severity: "critical", title: "DEA Flagged Wallet Active", description: "BTC wallet bc1qm7...2kx9 has received 8.7 BTC in the last 24 hours from multiple mixer outputs.", payload: "ALERT: Wallet bc1qm7...2kx9 flagged by DEA (FinCEN SAR #2026-SW-11294).\nReceived: 8.7 BTC ($522,000) in 14 transactions\nSource: Wasabi CoinJoin rounds + Samourai Whirlpool\nConnected entities: DarkPhoenix_77, BlueSkyDistro, ShadowPharm\n\nThis wallet has been active continuously for the past 72 hours.", timestamp: "3h ago", source: "Chainalysis", acknowledged: false },
  { id: "ALT-003", severity: "critical", title: "Cartel Dead-Drop Coordinates Sold", description: "CartelPlug_X is selling physical dead-drop GPS coordinates for multi-kilo cocaine pickups on Hydra Market.", payload: "ALERT: Vendor CartelPlug_X listed geo-coordinates for dead-drop locations in Mexico City metropolitan area.\nListing: 'Multi-kilo cocaine dead-drop coordinates'\nPrice: 5 BTC per set\nCoordinates count: 4 separate locations\n\nDEA HIDTA intelligence suggests these correlate with Sinaloa cartel distribution network.", timestamp: "5h ago", source: "Hydra Market", acknowledged: false },
  { id: "ALT-004", severity: "high", title: "Known Vendor Re-emergence", description: "S11kR0ad_Vendor, previously delisted, has re-appeared with a new PGP identity on AlphaBay Reborn.", payload: "ALERT: Vendor S11kR0ad_Vendor re-registered on AlphaBay Reborn.\nNew PGP Key: 3D7C...K20\nOld PGP Key: MATCH CONFIRMED (key reuse)\nPrevious markets: Dream, Wall Street, Versus\nSpecialty: Counterfeit OxyContin M30 (fentanyl)\n\nDEA/FBI joint task force notified.", timestamp: "6h ago", source: "OSINT", acknowledged: false },
  { id: "ALT-005", severity: "high", title: "Suspicious Mixer Activity", description: "3.2 BTC routed through CoinJoin mixer — pattern consistent with vendor cash-out.", payload: "ALERT: Transaction sweep detected.\n3.2 BTC → Wasabi CoinJoin Round #4412 → 12 UTXO outputs\nOrigin: bc1q9h52x4k2 (DarkPhoenix_77 cluster)\nDestination: Unknown — tracing in progress\n\nPattern matches known vendor cash-out behavior (peel chain + mixer + exchange deposit).", timestamp: "8h ago", source: "Blockchain Monitor", acknowledged: true },
  { id: "ALT-006", severity: "high", title: "30 BTC Cross-Chain Swap Detected", description: "White_Dragon_HK moved 30 BTC through a Monero cross-chain swap service.", payload: "ALERT: Large cross-chain swap detected.\n30 BTC → XMR atomic swap via ChangeNow\nOriginating wallet: bc1qvv...9g0h (White_Dragon_HK)\nDestination: Unknown XMR wallet\n\nThis amount significantly exceeds normal operational volume for this entity.", timestamp: "10h ago", source: "Blockchain Monitor", acknowledged: false },
  { id: "ALT-007", severity: "medium", title: "New Encrypted Channel Identified", description: "Telegram channel @Ghost_Supply promoting bulk cannabis — 847 subscribers.", payload: "ALERT: New Telegram channel detected.\nChannel: @Ghost_Supply (847 subscribers)\nContent: Bulk cannabis wholesale menu\nShipping: Dutch PostNL\nPayment: XMR only\n\nLinked to vendor @GhostBulk_Orders on AlphaBay Reborn.", timestamp: "12h ago", source: "Telegram Intel", acknowledged: false },
  { id: "ALT-008", severity: "medium", title: "Meth Synthesis Guide Posted", description: "ChemKing2026 posted synthesis instructions on Dread Forum — 120 views in 2 hours.", payload: "ALERT: Forum intelligence.\nAuthor: ChemKing2026\nForum: Dread\nThread: 'P2P Methamphetamine Synthesis — Complete Guide'\nViews: 120 in 2 hours\nReplies: 14\n\nNLP analysis indicates this matches writing style of 'SpeedFactory_NL' (defunct AlphaBay 2017 vendor).", timestamp: "14h ago", source: "Dread Forum", acknowledged: true },
  { id: "ALT-009", severity: "low", title: "New LSD Vendor Detected", description: "AcidWizard420 registered on Versus Market — no prior history.", payload: "ALERT: New vendor registration.\nAlias: AcidWizard420\nMarket: Versus Market\nSpecialty: LSD blotter art\nFirst listing: 'Gamma Goblin 250µg tabs'\n\nNo prior history on any tracked markets. Monitoring initiated.", timestamp: "1d ago", source: "Versus Market", acknowledged: true },
  { id: "ALT-010", severity: "low", title: "Prescription Drug Price Drop", description: "NightOwl_Pharm dropped Xanax prices 40% suggesting new bulk supply source.", payload: "ALERT: Price anomaly detected.\nVendor: NightOwl_Pharm\nProduct: Xanax 2mg Pfizer Bars\nPrevious price: $5.00/unit\nNew price: $3.00/unit (40% drop)\n\nSuggests new bulk supply chain — possibly Indian pharmaceutical diversion.", timestamp: "1d ago", source: "Versus Market", acknowledged: false },
];

const SEV_COLORS: Record<string, { dot: string; bg: string; border: string; text: string }> = {
  critical: { dot: "bg-red-500", bg: "bg-red-500/5", border: "border-l-red-500", text: "text-red-400" },
  high: { dot: "bg-orange-500", bg: "bg-orange-500/5", border: "border-l-orange-500", text: "text-orange-400" },
  medium: { dot: "bg-yellow-500", bg: "bg-yellow-500/5", border: "border-l-yellow-500", text: "text-yellow-400" },
  low: { dot: "bg-cyan-500", bg: "bg-cyan-500/5", border: "border-l-cyan-500", text: "text-cyan-400" },
};

export default function ReportAlerts() {
  const setActiveView = useAppStore((s) => s.setActiveView);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(alertsRaw[0]);
  const [alerts, setAlerts] = useState(alertsRaw);

  const acknowledge = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
  };

  return (
    <div className="flex flex-col h-full bg-[#070a10] text-slate-200 overflow-hidden">
      {/* Breadcrumb */}
      <div className="shrink-0 border-b border-zinc-800 bg-[#0d131f] px-6 py-4">
        <button onClick={() => setActiveView("dashboard")} className="flex items-center gap-2 text-xs text-slate-500 hover:text-cyan-400 transition-colors mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Operations Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-400" /> Priority Alert Triage Inbox
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {alerts.filter((a) => !a.acknowledged).length} unacknowledged • {alerts.length} total alerts
            </p>
          </div>
        </div>
      </div>

      {/* Split Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Alert List */}
        <div className="w-[420px] border-r border-zinc-800 overflow-y-auto shrink-0">
          {alerts.map((alert) => {
            const sev = SEV_COLORS[alert.severity];
            const isSelected = selectedAlert?.id === alert.id;
            return (
              <div
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={`cursor-pointer border-b border-l-2 border-b-zinc-800/50 px-4 py-4 transition-all ${sev.border} ${sev.bg} ${isSelected ? "bg-slate-800/40" : "hover:bg-slate-800/20"} ${alert.acknowledged ? "opacity-50" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${sev.dot} ${!alert.acknowledged ? "animate-pulse" : ""}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white truncate">{alert.title}</span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${sev.text} ${sev.bg}`}>{alert.severity}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{alert.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-600">
                      <Clock className="h-3 w-3" />
                      <span>{alert.timestamp}</span>
                      <span>•</span>
                      <span>{alert.source}</span>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 shrink-0 mt-1 transition-colors ${isSelected ? "text-cyan-400" : "text-slate-700"}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Alert Detail */}
        {selectedAlert ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Detail Header */}
            <div className="shrink-0 border-b border-zinc-800 bg-[#0d131f] px-6 py-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`h-3 w-3 rounded-full ${SEV_COLORS[selectedAlert.severity].dot}`} />
                <h2 className="text-lg font-bold text-white">{selectedAlert.title}</h2>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${SEV_COLORS[selectedAlert.severity].text} ${SEV_COLORS[selectedAlert.severity].bg}`}>{selectedAlert.severity}</span>
              </div>
              <p className="text-sm text-slate-400">{selectedAlert.description}</p>
            </div>

            {/* Payload */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="rounded-xl border border-zinc-800 bg-[#0d131f] overflow-hidden shadow-inner">
                <div className="flex items-center gap-2 border-b border-zinc-800 bg-[#13161f] px-4 py-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-[10px] font-mono text-zinc-500">alert_payload.log</span>
                </div>
                <div className="p-5">
                  <pre className="whitespace-pre-wrap font-mono text-xs text-cyan-400 leading-relaxed">{selectedAlert.payload}</pre>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="shrink-0 border-t border-zinc-800 bg-[#0d131f] px-6 py-4 flex items-center gap-3">
              <button onClick={() => acknowledge(selectedAlert.id)} className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">
                <Check className="h-3.5 w-3.5" /> Acknowledge
              </button>
              <button className="flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-4 py-2.5 text-xs font-bold text-orange-400 hover:bg-orange-500/20 transition-colors border border-orange-500/20">
                <ArrowUpRight className="h-3.5 w-3.5" /> Escalate to Supervisor
              </button>
              <button className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition-colors border border-zinc-700">
                <XCircle className="h-3.5 w-3.5" /> Dismiss False Positive
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">Select an alert to view its payload.</div>
        )}
      </div>
    </div>
  );
}
