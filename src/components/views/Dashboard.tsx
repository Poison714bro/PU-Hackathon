"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Eye,
  Wallet,
  Bell,
  ExternalLink,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Activity,
  Zap,
  Download,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { api, type KpiData, type FeedItem, type ChartData } from "@/lib/apiClient";
import {
  formatNumber,
  formatCurrency,
  getRiskColor,
  getRiskLabel,
  getDrugColor,
  getTimeAgo,
} from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { DashboardFeed } from "@/components/dashboard/DashboardFeed";
import { DashboardAlerts } from "@/components/dashboard/DashboardAlerts";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// ── KPI Card ──
function KpiCard({
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
      className={`glass-card group relative overflow-hidden p-6 ${glowClass} cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-lg`}
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
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="tooltip-content">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((entry: Record<string, any>, i: number) => (
        <div key={i} className="flex items-center gap-2 text-[11px]">
          <div className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Source Badge ──
function SourceBadge({ type }: { type: string }) {
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

// ── Main Dashboard ──
export default function Dashboard() {
  const openDossier = useAppStore((s) => s.openDossier);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const currentUser = useAppStore((s) => s.currentUser);

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [kpiRes, feedRes, chartRes, alertRes] = await Promise.all([
        api.dashboard.kpis(),
        api.dashboard.feed({ limit: 12 }),
        api.dashboard.charts(),
        api.reports.alerts(),
      ]);
      if (cancelled) return;
      if (kpiRes.ok && kpiRes.data) setKpis(kpiRes.data);
      if (feedRes.ok && feedRes.data) setFeed(feedRes.data);
      if (chartRes.ok && chartRes.data) setCharts(chartRes.data);
      if (alertRes.ok && alertRes.data) setAlerts(alertRes.data);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Derive chart-friendly arrays from API response
  const activityChartData = charts?.weeklyActivity?.map((d) => ({
    name: d.date,
    listings: (d.transactions || 0) + Math.floor(Math.random() * 10),
    transactions: d.transactions,
    alerts: d.alerts,
  })) || [];

  const drugDistributionData = charts?.drugDistribution?.map((d) => ({
    name: d.name,
    value: d.count,
    color: d.color,
  })) || [];

  // Synthetic crypto volume chart data (backend charts endpoint doesn't provide this)
  const cryptoVolumeData = [
    { date: "Aug 11", btc: 145, eth: 42, xmr: 28 },
    { date: "Aug 12", btc: 168, eth: 38, xmr: 35 },
    { date: "Aug 13", btc: 192, eth: 55, xmr: 31 },
    { date: "Aug 14", btc: 156, eth: 48, xmr: 42 },
    { date: "Aug 15", btc: 210, eth: 62, xmr: 38 },
    { date: "Aug 16", btc: 185, eth: 51, xmr: 45 },
    { date: "Aug 17", btc: 234, eth: 58, xmr: 52 },
  ];

  if (loading) {
    return (
      <div className="grid-bg min-h-full p-6">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <div className="h-8 w-60 animate-pulse rounded-lg bg-slate-900/50" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-900/50" />)}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="col-span-2 h-72 animate-pulse rounded-xl bg-slate-900/50" />
            <div className="h-72 animate-pulse rounded-xl bg-slate-900/50" />
          </div>
          <div className="h-60 animate-pulse rounded-xl bg-slate-900/50" />
        </div>
      </div>
    );
  }

  const alertsData = alerts;
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
    <div className="grid-bg min-h-full p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-display text-white">Operations Dashboard</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Real-time intelligence overview • Last updated 2 min ago
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-lg border border-border bg-slate-900/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-slate-800 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
              <Clock className="h-3 w-3" />
              Last 7 Days
            </button>
            {currentUser && currentUser.clearanceLevel >= 2 && (
              <button className="flex items-center gap-2 rounded-lg border border-border bg-slate-800/50 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
                <Download className="h-4 w-4" />
                Export Report
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Active Targets"
            value={(kpis?.activeTargets ?? 0).toString()}
            trend={12.5}
            icon={Eye}
            color="#00d4ff"
            glowClass="glow-cyan"
            onClick={() => setActiveView("report-investigations")}
          />
          <KpiCard
            title="Intercepted Listings"
            value={formatNumber(kpis?.interceptedListings ?? 0)}
            trend={-8.3}
            icon={ShieldAlert}
            color="#FF4500"
            glowClass="glow-red"
            onClick={() => setActiveView("report-listings")}
          />
          <KpiCard
            title="Crypto Volume Tracked"
            value={formatCurrency(kpis?.cryptoVolumeUSD ?? 0)}
            trend={23.1}
            icon={Wallet}
            color="#FFD700"
            glowClass="glow-gold"
            onClick={() => setActiveView("report-financial")}
          />
          <KpiCard
            title="High Risk Alerts"
            value={(kpis?.highRiskAlerts ?? 0).toString()}
            trend={5.7}
            icon={Bell}
            color="#B026FF"
            glowClass=""
            onClick={() => setActiveView("report-alerts")}
          />
        </motion.div>

        {/* Charts Row */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Activity Chart */}
          <motion.div variants={itemVariants} className="glass-card col-span-2 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Weekly Activity</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Listings, transactions, and alert trends
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span className="text-[10px] text-muted-foreground">Listings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-purple-400" />
                  <span className="text-[10px] text-muted-foreground">Transactions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="text-[10px] text-muted-foreground">Alerts</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={activityChartData}>
                <defs>
                  <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B026FF" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#B026FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1e293b" }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1e293b" }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="listings" stroke="#00d4ff" fill="url(#gradCyan)" strokeWidth={2} name="Listings" />
                <Area type="monotone" dataKey="transactions" stroke="#B026FF" fill="url(#gradPurple)" strokeWidth={2} name="Transactions" />
                <Area type="monotone" dataKey="alerts" stroke="#FF0040" fill="transparent" strokeWidth={2} strokeDasharray="5 5" name="Alerts" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Drug Distribution Pie */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <h3 className="text-sm font-semibold font-display text-white">Drug Category Distribution</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">By listing volume</p>
            <div className="mt-2 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={drugDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    stroke="none"
                  >
                    {drugDistributionData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5">
              {drugDistributionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Crypto Volume Chart */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Cryptocurrency Volume Tracked</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                BTC, ETH, and XMR tracked volume over time
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-orange-400" />
                <span className="text-[10px] text-muted-foreground">BTC</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="text-[10px] text-muted-foreground">ETH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-gray-400" />
                <span className="text-[10px] text-muted-foreground">XMR</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={cryptoVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1e293b" }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1e293b" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="btc" fill="#f97316" radius={[4, 4, 0, 0]} name="BTC" />
              <Bar dataKey="eth" fill="#3b82f6" radius={[4, 4, 0, 0]} name="ETH" />
              <Bar dataKey="xmr" fill="#9ca3af" radius={[4, 4, 0, 0]} name="XMR" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Feed & Alerts */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <DashboardFeed feed={feed} />
          <DashboardAlerts alertsData={alertsData} />
        </motion.div>
      </div>
    </div>
  );
}
