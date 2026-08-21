"use client";

import { useState } from "react";
import { ArrowLeft, Wallet, ExternalLink, ArrowRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { SOURCE_STREAM_COLORS } from "@/lib/utils";

const sankeyStages = [
  { label: "DARKNET ESCROW", color: SOURCE_STREAM_COLORS.Darknet, items: ["Hydra Escrow", "AlphaBay Multi-Sig", "Versus FE Wallet"], totalBTC: 42.8 },
  { label: "MIXING SERVICES", color: SOURCE_STREAM_COLORS.Blockchain, items: ["Wasabi CoinJoin", "Samourai Whirlpool", "Tornado Cash (ETH)"], totalBTC: 38.2 },
  { label: "CENTRALIZED EXCHANGES", color: SOURCE_STREAM_COLORS.OSINT, items: ["Binance Hot Wallet", "Kraken Deposit", "KuCoin OTC Desk"], totalBTC: 31.6 },
];

const ledgerData = [
  { date: "2026-08-18 14:32", txHash: "0x8a92b7c...e4f12a", amountBTC: 2.45, usd: 147000, owner: "DarkPhoenix_77", direction: "outbound" },
  { date: "2026-08-18 12:11", txHash: "bc1q9h52...x4k2", amountBTC: 1.24, usd: 74400, owner: "Binance Hot Wallet #4", direction: "inbound" },
  { date: "2026-08-17 22:05", txHash: "0x3fC91A...7FAD", amountBTC: 0.89, usd: 53400, owner: "Unknown Mixer Output", direction: "outbound" },
  { date: "2026-08-17 18:44", txHash: "bc1qar0s...5mdq", amountBTC: 3.10, usd: 186000, owner: "ChemKing2026", direction: "outbound" },
  { date: "2026-08-17 15:20", txHash: "44AFFq5...EP3A", amountBTC: 0.55, usd: 33000, owner: "S11kR0ad_Vendor (XMR Swap)", direction: "outbound" },
  { date: "2026-08-17 09:33", txHash: "bc1q5v8n...r1e0", amountBTC: 6.80, usd: 408000, owner: "Peel Chain Hop #3", direction: "outbound" },
  { date: "2026-08-16 21:18", txHash: "0xdAC17F...1ec7", amountBTC: 0.42, usd: 25200, owner: "Kraken Deposit Address", direction: "inbound" },
  { date: "2026-08-16 16:02", txHash: "bc1qxy2k...0wlh", amountBTC: 1.78, usd: 106800, owner: "@Ghost_Supply", direction: "outbound" },
  { date: "2026-08-16 11:45", txHash: "47tJ4e6...9lM0", amountBTC: 4.20, usd: 252000, owner: "Whirlpool Round #2291", direction: "outbound" },
  { date: "2026-08-16 08:10", txHash: "bc1qzlf9...z6a8", amountBTC: 2.15, usd: 129000, owner: "El_Chapo_Junior", direction: "outbound" },
  { date: "2026-08-15 23:55", txHash: "bc1qm34l...s3h0", amountBTC: 0.95, usd: 57000, owner: "AcidWizard420", direction: "outbound" },
  { date: "2026-08-15 19:30", txHash: "0x7a3B9f...6b9C", amountBTC: 1.60, usd: 96000, owner: "KuCoin OTC Withdrawal", direction: "inbound" },
  { date: "2026-08-15 14:22", txHash: "bc1q7kw2...yr20", amountBTC: 0.38, usd: 22800, owner: "NightOwl_Pharm", direction: "outbound" },
  { date: "2026-08-15 10:05", txHash: "bc1qp3w7...7l00", amountBTC: 12.40, usd: 744000, owner: "MethLabMike (SEIZED)", direction: "outbound" },
  { date: "2026-08-14 22:40", txHash: "bc1qnkf5...9k20", amountBTC: 0.72, usd: 43200, owner: "PharmaGrad_RU", direction: "outbound" },
];

export default function ReportFinancial() {
  const setActiveView = useAppStore((s) => s.setActiveView);

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      {/* Breadcrumb */}
      <div className="shrink-0 border-b border-border bg-card px-6 py-4">
        <button onClick={() => setActiveView("dashboard")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mb-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Operations Dashboard
        </button>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Wallet className="h-5 w-5 text-yellow-400" /> Financial Intelligence Ledger
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Crypto flow analysis & transaction forensics • $12.5M tracked volume</p>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Sankey-Style Flow Visualization */}
        <div className="px-6 py-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Fund Flow Pipeline</h2>
          <div className="grid grid-cols-3 gap-0 relative">
            {sankeyStages.map((stage, i) => (
              <div key={stage.label} className="relative">
                <div className="bg-card border border-border rounded-lg p-4 relative z-10">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: stage.color }}>{stage.label}</div>
                  <div className="text-2xl font-bold text-white mb-3">₿{stage.totalBTC}</div>
                  <div className="space-y-2">
                    {stage.items.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Arrow connector */}
                {i < sankeyStages.length - 1 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20">
                    <div className="bg-background border border-border rounded-full p-1.5">
                      <ArrowRight className="h-4 w-4 text-slate-600" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Ledger */}
        <div className="px-6 pb-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Transaction Ledger</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="sticky top-0 bg-card border-b border-border">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">TxHash</th>
                  <th className="px-4 py-3 text-right">Amount (BTC)</th>
                  <th className="px-4 py-3 text-right">USD Value</th>
                  <th className="px-4 py-3 text-left">Suspected Wallet Owner</th>
                  <th className="px-4 py-3 text-center">Direction</th>
                </tr>
              </thead>
              <tbody>
                {ledgerData.map((tx, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-slate-800/20 transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{tx.date}</td>
                    <td className="px-4 py-3 font-mono text-xs text-primary flex items-center gap-1">
                      {tx.txHash}
                      <ExternalLink className="h-3 w-3 text-slate-700 group-hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background" />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-bold text-orange-400">₿{tx.amountBTC.toFixed(4)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-emerald-400">${tx.usd.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-white font-bold">{tx.owner}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${tx.direction === "outbound" ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"}`}>
                        {tx.direction}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
