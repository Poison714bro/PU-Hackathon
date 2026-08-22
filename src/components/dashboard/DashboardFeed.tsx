import { motion } from "framer-motion";
import { Activity, ChevronRight, ExternalLink } from "lucide-react";
import { getDrugColor, getRiskColor, getTimeAgo } from "@/lib/utils";
import { type FeedItem } from "@/lib/apiClient";
import { useAppStore } from "@/lib/store";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

function SourceBadge({ type }: { type: "blockchain" | "encrypted" | "osint" | "darknet" }) {
  const styles = {
    blockchain: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    encrypted: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    osint: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    darknet: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };
  return (
    <span className={`inline-flex h-2 w-2 rounded-full border ${styles[type]}`} />
  );
}

export function DashboardFeed({ feed }: { feed: FeedItem[] }) {
  const openDossier = useAppStore((s) => s.openDossier);

  const feedData = feed.map((f, i) => ({
    id: f.id || `F${i}`,
    source: f.source,
    sourceType: f.source.toLowerCase().includes("blockchain") ? "blockchain" as const
      : f.source.toLowerCase().includes("telegram") || f.source.toLowerCase().includes("signal") || f.source.toLowerCase().includes("wickr") ? "encrypted" as const
      : f.source.toLowerCase().includes("osint") ? "osint" as const
      : "darknet" as const,
    entity: f.entityId || f.summary?.split(" ")[0] || "Unknown",
    riskScore: 75,
    date: f.timestamp,
    category: f.category,
    details: f.summary,
  }));

  return (
    <motion.div variants={itemVariants} className="glass-card col-span-2 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-white">Multi-Source Intelligence Feed</h3>
          <div className="live-dot ml-1" />
        </div>
        <button className="text-[11px] text-primary hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
          View All <ChevronRight className="ml-0.5 inline h-3 w-3" />
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              <th className="px-5 py-2.5 text-left">Source</th>
              <th className="px-3 py-2.5 text-left">Entity</th>
              <th className="px-3 py-2.5 text-left">Category</th>
              <th className="px-3 py-2.5 text-center">Risk</th>
              <th className="px-3 py-2.5 text-right">Time</th>
              <th className="px-5 py-2.5 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {feedData.map((item) => (
              <motion.tr 
                variants={itemVariants}
                key={item.id} 
                className="data-row group cursor-pointer"
                onClick={() => openDossier(item.entity)}
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <SourceBadge type={item.sourceType} />
                    <span className="text-xs text-muted-foreground">{item.source}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="font-mono text-xs font-medium text-foreground">
                    {item.entity}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: getDrugColor(item.category) }}
                  >
                    {item.category}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span
                    className="inline-flex min-w-[42px] items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={{
                      background: `${getRiskColor(item.riskScore)}15`,
                      color: getRiskColor(item.riskScore),
                      border: `1px solid ${getRiskColor(item.riskScore)}30`,
                    }}
                  >
                    {item.riskScore}
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="text-[11px] text-muted-foreground">
                    {getTimeAgo(item.date)}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <ExternalLink className="h-3.5 w-3.5 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100" />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
