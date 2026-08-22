"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import React from "react";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// ── KPI Card ──
export function KpiCard({
  title,
  value,
  trend,
  icon: Icon,
  color,
  glowClass,
  onClick,
}: {
  title: string;
  value: string;
  trend: number;
  icon: React.ElementType;
  color: string;
  glowClass: string;
  onClick?: () => void;
}) {
  const isPositive = trend >= 0;
  return (
    <motion.div
      variants={itemVariants}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      role="button"
      tabIndex={0}
      className={`glass-card group relative overflow-hidden p-6 ${glowClass} cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background`}
      style={{ '--kpi-accent': color } as React.CSSProperties}
    >
      {/* Background gradient accent */}
      <div
        className="absolute right-0 top-0 h-24 w-24 rounded-full opacity-5 blur-2xl transition-opacity group-hover:opacity-15"
        style={{ background: color }}
      />
      {/* Hover border glow */}
      <div
        className="absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px ${color}40, 0 0 20px ${color}10` }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          <div className="mt-2 flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-400" />
            )}
            <span
              className={`text-xs font-medium ${
                isPositive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {Math.abs(trend)}%
            </span>
            <span className="text-[10px] text-slate-600">vs last week</span>
          </div>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
      {/* View Report micro-interaction */}
      <div className="mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1" style={{ color }}>
        View Report <ArrowUpRight className="h-3 w-3" />
      </div>
    </motion.div>
  );
}

// ── Custom Chart Tooltip ──
export function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md">
      <p className="mb-2 text-xs font-semibold text-foreground">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: Record<string, any>, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full shadow-sm" style={{ background: entry.color }} />
              <span className="text-slate-400 capitalize">{entry.name}</span>
            </div>
            <span className="font-semibold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Source Badge ──
export function SourceBadge({ type }: { type: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    darknet: { bg: "bg-purple-500/10", text: "text-purple-400", label: "Darknet" },
    blockchain: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Blockchain" },
    encrypted: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Encrypted" },
    osint: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "OSINT" },
  };
  const c = config[type] || config.osint;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
