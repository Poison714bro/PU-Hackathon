"use client";

import { useState } from "react";
import { ArrowLeft, Search, ShieldAlert, Download, PlusCircle, CheckSquare, ExternalLink } from "lucide-react";
import { useAppStore } from "@/lib/store";

const PLATFORMS = ["Hydra Market", "AlphaBay Reborn", "Versus Market", "Dread Forum"];
const FLAGS = [
  "Flagged: High-Volume Fentanyl Keyword",
  "Flagged: Bulk Quantity > 500g",
  "Flagged: Known Precursor Chemical",
  "Flagged: New Vendor, Rapid Sales",
  "Flagged: Cross-Platform Alias Match",
  "Flagged: Stealth Shipping Discussion",
];

const listingsData = Array.from({ length: 40 }, (_, i) => ({
  id: `LST-${String(i + 1).padStart(4, "0")}`,
  vendor: [
    "DarkPhoenix_77", "ChemKing2026", "NightOwl_Pharm", "AcidWizard420", "@Ghost_Supply",
    "S11kR0ad_Vendor", "SnowFall_Direct", "Crystal_Meth_99", "EuroMeds247", "CartelPlug_X",
    "Fent_Master_99", "Blow_Cartel_MIA", "Golden_Triangle_Ops", "Heroin_Hub_TR", "Xanax_Cartel",
  ][i % 15],
  title: [
    "Fentanyl HCL 99% Pure — 500g Bulk", "Crystal Meth 98% — 1oz", "Xanax 2mg Pfizer Bars 500x",
    "LSD 250µg Blotter 100-Sheet", "Colombian Cocaine 1kg Brick", "MDMA Crystal 84% 100g",
    "OxyContin M30 Pressed 10-Pack", "Heroin #3 Brown 100g", "Adderall 30mg Pressed 200x",
    "Amphetamine Paste 73% 500g", "DMT Freebase 5g", "Ketamine S-Isomer 10g Vials",
  ][i % 12],
  priceUSD: Math.floor(Math.random() * 9000 + 200),
  priceBTC: +(Math.random() * 0.25 + 0.005).toFixed(4),
  platform: PLATFORMS[i % 4],
  category: ["Opioids/Fentanyl", "Stimulants", "Prescription/Other", "Psychedelics", "Cannabis"][i % 5],
  flag: FLAGS[i % 6],
  scraped: `${Math.floor(Math.random() * 23 + 1)}h ago`,
}));

const CATEGORY_COLORS: Record<string, string> = {
  "Opioids/Fentanyl": "#FF4500",
  Stimulants: "#00FFFF",
  Cannabis: "#39FF14",
  Psychedelics: "#B026FF",
  "Prescription/Other": "#FFD700",
};

export default function ReportListings() {
  const setActiveView = useAppStore((s) => s.setActiveView);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = listingsData.filter(
    (l) => l.vendor.toLowerCase().includes(searchQuery.toLowerCase()) || l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#070a10] text-slate-200 overflow-hidden">
      {/* Breadcrumb & Actions */}
      <div className="shrink-0 border-b border-zinc-800 bg-[#0d131f] px-6 py-4">
        <button onClick={() => setActiveView("dashboard")} className="flex items-center gap-2 text-xs text-slate-500 hover:text-cyan-400 transition-colors mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Operations Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-400" /> Suspicious Listings Feed
            </h1>
            <p className="text-xs text-slate-500 mt-1">Darknet marketplace scraper • {listingsData.length} flagged listings</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input type="text" placeholder="Search vendors, listings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-[#070a10] border border-zinc-800 rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-red-500 transition-colors" />
            </div>
            <button className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-slate-400 hover:bg-zinc-800 hover:text-white transition-colors">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button disabled={selected.size === 0} className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40">
              <PlusCircle className="h-3.5 w-3.5" /> Add {selected.size > 0 ? `(${selected.size})` : ""} to Investigation
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-[#0d131f] border-b border-zinc-800">
            <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <th className="px-4 py-3 text-center w-10"></th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Listing Title</th>
              <th className="px-4 py-3 text-right">USD</th>
              <th className="px-4 py-3 text-right">BTC</th>
              <th className="px-4 py-3 text-center">Platform</th>
              <th className="px-4 py-3 text-left">AI Suspicion Flag</th>
              <th className="px-4 py-3 text-right">Scraped</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-b border-zinc-800/50 transition-colors hover:bg-slate-800/30 group">
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleSelect(l.id)} className={`h-4 w-4 rounded border transition-colors ${selected.has(l.id) ? "bg-red-500 border-red-500" : "border-zinc-700 hover:border-red-500/50"}`}>
                    {selected.has(l.id) && <CheckSquare className="h-4 w-4 text-white" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-bold text-white">{l.vendor}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[l.category] || "#666" }} />
                    <span className="text-xs text-slate-300 line-clamp-1">{l.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-emerald-400">${l.priceUSD.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-orange-400">₿{l.priceBTC}</td>
                <td className="px-4 py-3 text-center">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">{l.platform}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 line-clamp-1">{l.flag}</span>
                </td>
                <td className="px-4 py-3 text-right text-[11px] text-slate-500">{l.scraped}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
