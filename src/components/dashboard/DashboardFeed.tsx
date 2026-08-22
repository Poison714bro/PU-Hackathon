"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, ChevronRight, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/lib/store";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// ── Exact Mock Data Matching the Image ──
const mockFeedData = [
  { id: "1", source: "Europol Press Release", sourceType: "osint", entity: "ent-op-raptor-01", category: "Law Enforcement Action", riskScore: 75, time: "17h ago" },
  { id: "2", source: "Chainalysis 2026 Report", sourceType: "osint", entity: "ent-torzon-01", category: "Market Migration", riskScore: 75, time: "17h ago" },
  { id: "3", source: "Europol Reports", sourceType: "osint", entity: "ent-op-fabryka-01", category: "Seizure", riskScore: 75, time: "17h ago" },
  { id: "4", source: "AlphaBay Reborn", sourceType: "darknet", entity: "ent-001", category: "Opioids/Fentanyl", riskScore: 75, time: "5d ago" },
  { id: "5", source: "Telegram Intel", sourceType: "encrypted", entity: "ent-003", category: "Stimulants", riskScore: 75, time: "5d ago" },
  { id: "6", source: "Versus Market", sourceType: "darknet", entity: "ent-004", category: "Opioids/Fentanyl", riskScore: 75, time: "5d ago" },
  { id: "7", source: "Dread Forum", sourceType: "osint", entity: "ent-005", category: "Stimulants", riskScore: 75, time: "5d ago" },
  { id: "8", source: "Telegram Intel", sourceType: "encrypted", entity: "ent-006", category: "Prescription/Other", riskScore: 75, time: "5d ago" },
  { id: "9", source: "AlphaBay Reborn", sourceType: "darknet", entity: "ent-007", category: "Psychedelics", riskScore: 75, time: "5d ago" },
  { id: "10", source: "Chainalysis Reactor", sourceType: "blockchain", entity: "ent-008", category: "Cannabis", riskScore: 75, time: "6d ago" },
  { id: "11", source: "Clear-Web Forum", sourceType: "osint", entity: "ent-009", category: "Prescription/Other", riskScore: 75, time: "6d ago" },
  { id: "12", source: "Blockchain Monitor", sourceType: "blockchain", entity: "ent-004", category: "Opioids/Fentanyl", riskScore: 75, time: "6d ago" },
];

function SourceBadge({ type }: { type: string }) {
  // Styles matching the dots in the image: Gray for OSINT/Darknet, Purple for Encrypted, Orange for Blockchain (approximate guesses based on context)
  const styles: Record<string, string> = {
    blockchain: "border-orange-500",
    encrypted: "border-purple-500",
    osint: "border-slate-500",
    darknet: "border-slate-600",
  };
  return (
    <span className={`inline-flex h-1.5 w-1.5 rounded-full border-2 ${styles[type] || "border-slate-500"}`} />
  );
}

function getExactCategoryColor(category: string) {
  if (category.includes("Law Enforcement") || category.includes("Migration") || category.includes("Seizure")) return "#71717a"; // Gray
  if (category.includes("Opioids")) return "#ef4444"; // Red
  if (category.includes("Stimulants")) return "#06b6d4"; // Cyan
  if (category.includes("Prescription")) return "#eab308"; // Yellow
  if (category.includes("Psychedelics")) return "#a855f7"; // Purple
  if (category.includes("Cannabis")) return "#22c55e"; // Green
  return "#94a3b8";
}

export function DashboardFeed({ feed }: { feed?: any }) {
  const openDossier = useAppStore((s) => s.openDossier);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [popoverActive, setPopoverActive] = useState<string | null>(null); // Stores ID of row with active popover

  return (
    <motion.div variants={itemVariants} className="glass-card col-span-2 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">Multi-Source Intelligence Feed</h3>
          <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] ml-2" />
        </div>
        <button className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 focus:outline-none flex items-center">
          View All <ChevronRight className="ml-0.5 inline h-3 w-3" />
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-transparent">
              <th className="px-5 py-3 text-left">Source</th>
              <th className="px-3 py-3 text-left">Entity</th>
              <th className="px-3 py-3 text-left">Category</th>
              <th className="px-3 py-3 text-center">Risk</th>
              <th className="px-3 py-3 text-right">Time</th>
              <th className="px-5 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {mockFeedData.map((item) => (
              <motion.tr 
                variants={itemVariants}
                key={item.id} 
                className="group cursor-pointer transition-colors hover:bg-slate-800/40 relative"
                onMouseEnter={() => setHoveredRowId(item.id)}
                onMouseLeave={() => {
                  setHoveredRowId(null);
                  setPopoverActive(null);
                }}
                onClick={() => openDossier(item.entity)}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <SourceBadge type={item.sourceType} />
                    <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-300">{item.source}</span>
                  </div>
                </td>
                <td className="px-3 py-3.5">
                  <span className="font-mono text-xs font-bold text-slate-200">
                    {item.entity}
                  </span>
                </td>
                <td 
                  className="px-3 py-3.5 relative"
                  onMouseEnter={() => setPopoverActive(item.id)}
                >
                  <span
                    className="text-[11px] font-medium transition-opacity hover:opacity-80"
                    style={{ color: getExactCategoryColor(item.category) }}
                  >
                    {item.category}
                  </span>
                  
                  {/* Category Popover rendering exactly when active */}
                  <AnimatePresence>
                    {popoverActive === item.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute left-0 top-10 z-[100] w-48 rounded-lg border border-slate-700 bg-[#0f172a] p-2 shadow-2xl shadow-black"
                        onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to row
                      >
                        <div className="flex flex-col gap-1.5">
                          <button className="text-left text-[11px] font-medium text-cyan-400 hover:bg-slate-800 px-2 py-1 rounded">Stimulants</button>
                          <button className="text-left text-[11px] font-medium text-yellow-500 hover:bg-slate-800 px-2 py-1 rounded">Prescription/Other</button>
                          <div className="h-px w-full bg-slate-700/50 my-0.5" />
                          <button className="text-left text-[11px] font-medium text-purple-400 hover:bg-slate-800 px-2 py-1 rounded">Psychedelics</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </td>
                <td className="px-3 py-3.5 text-center">
                  <span
                    className="inline-flex min-w-[36px] items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-[#1e0f0f] text-[#ef4444] border border-[#ef4444]/40"
                  >
                    {item.riskScore}
                  </span>
                </td>
                <td className="px-3 py-3.5 text-right">
                  <span className="text-[11px] font-medium text-slate-400">
                    {item.time}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right w-10">
                  <ExternalLink className={`h-3.5 w-3.5 text-slate-400 transition-opacity ${hoveredRowId === item.id ? 'opacity-100' : 'opacity-0'}`} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
