import { motion } from "framer-motion";
import { ShieldAlert, Clock } from "lucide-react";
import { getTimeAgo } from "@/lib/utils";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function DashboardAlerts({ alertsData }: { alertsData: any[] }) {
  return (
    <motion.div variants={itemVariants} className="glass-card flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-400" />
          <h3 className="text-sm font-semibold text-white">Real-Time Alerts</h3>
        </div>
        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400">
          {alertsData.filter((a) => !a.acknowledged).length} Active
        </span>
      </div>
      <div className="flex-1 space-y-0 overflow-auto">
        {alertsData.map((alert) => {
          const severityColors: Record<string, string> = {
            critical: "border-l-red-500 bg-red-500/5",
            high: "border-l-orange-500 bg-orange-500/5",
            medium: "border-l-yellow-500 bg-yellow-500/5",
            low: "border-l-cyan-500 bg-cyan-500/5",
          };
          const severityDotColors: Record<string, string> = {
            critical: "bg-red-500",
            high: "bg-orange-500",
            medium: "bg-yellow-500",
            low: "bg-cyan-500",
          };
          return (
            <div
              key={alert.id}
              className={`cursor-pointer border-b border-l-2 border-b-[var(--border)] px-4 py-3 transition-colors hover:bg-slate-800/20 ${
                severityColors[alert.severity]
              } ${!alert.acknowledged ? "" : "opacity-60"}`}
            >
              <div className="flex items-start gap-2">
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${severityDotColors[alert.severity]}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {alert.title}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        alert.severity === "critical"
                          ? "bg-red-500/15 text-red-400"
                          : alert.severity === "high"
                          ? "bg-orange-500/15 text-orange-400"
                          : alert.severity === "medium"
                          ? "bg-yellow-500/15 text-yellow-400"
                          : "bg-cyan-500/15 text-primary"
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                    {alert.description}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-600">
                    <Clock className="h-3 w-3" />
                    <span>{getTimeAgo(alert.timestamp)}</span>
                    <span>•</span>
                    <span>{alert.source}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
