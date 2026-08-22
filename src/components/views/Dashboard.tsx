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
  X,
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
import { motion, AnimatePresence } from "framer-motion";
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
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0a0f18]/95 p-3 shadow-xl backdrop-blur-md">
      <p className="mb-2 text-xs font-semibold text-white">{label}</p>
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

  // Drug Category Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [drugDetailsData, setDrugDetailsData] = useState<{name: string, count: number}[]>([]);
  const [isDrugDetailsLoading, setIsDrugDetailsLoading] = useState(false);

  // Weekly Activity Chart State
  const [visibleSeries, setVisibleSeries] = useState({ listings: true, transactions: true, alerts: true });
  const [timeRange, setTimeRange] = useState("7D");

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

  const handleCategoryClick = async (categoryName: string) => {
    setSelectedCategory(categoryName);
    setIsDetailsModalOpen(true);
    setIsDrugDetailsLoading(true);
    try {
      const res = await api.dashboard.drugDetails(categoryName);
      if (res.ok && res.data) {
        setDrugDetailsData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDrugDetailsLoading(false);
    }
  };
  
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
          <motion.div variants={itemVariants} className="glass-card col-span-2 flex flex-col p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Weekly Activity</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Listings, transactions, and alert trends
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Time Range Selector */}
                <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/50 p-1">
                  {["7D", "30D", "90D"].map(range => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                        timeRange === range ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
                
                {/* Legend Filter Pills */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setVisibleSeries(s => ({...s, listings: !s.listings}))}
                    className={`flex items-center gap-1.5 rounded-full border px-2 py-1 transition-all ${
                      visibleSeries.listings ? "border-cyan-500/30 bg-cyan-500/10" : "border-slate-800 bg-transparent opacity-50 grayscale hover:opacity-100"
                    }`}
                  >
                    <div className="h-2 w-2 rounded-full bg-cyan-400" />
                    <span className="text-[10px] text-slate-300">Listings</span>
                  </button>
                  <button 
                    onClick={() => setVisibleSeries(s => ({...s, transactions: !s.transactions}))}
                    className={`flex items-center gap-1.5 rounded-full border px-2 py-1 transition-all ${
                      visibleSeries.transactions ? "border-purple-500/30 bg-purple-500/10" : "border-slate-800 bg-transparent opacity-50 grayscale hover:opacity-100"
                    }`}
                  >
                    <div className="h-2 w-2 rounded-full bg-purple-400" />
                    <span className="text-[10px] text-slate-300">Transactions</span>
                  </button>
                  <button 
                    onClick={() => setVisibleSeries(s => ({...s, alerts: !s.alerts}))}
                    className={`flex items-center gap-1.5 rounded-full border px-2 py-1 transition-all ${
                      visibleSeries.alerts ? "border-red-500/30 bg-red-500/10" : "border-slate-800 bg-transparent opacity-50 grayscale hover:opacity-100"
                    }`}
                  >
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                    <span className="text-[10px] text-slate-300">Alerts</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={activityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  {/* Clean up gridlines: remove vertical, soften horizontal */}
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                  {/* Styled axes */}
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
                  
                  {/* Interactive Crosshair Tooltip */}
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  
                  {visibleSeries.listings && (
                    <Area type="monotone" dataKey="listings" stroke="#00d4ff" fill="url(#gradCyan)" strokeWidth={2} name="listings" activeDot={{ r: 4, strokeWidth: 0 }} />
                  )}
                  {visibleSeries.transactions && (
                    <Area type="monotone" dataKey="transactions" stroke="#B026FF" fill="url(#gradPurple)" strokeWidth={2} strokeDasharray="3 3" name="transactions" activeDot={{ r: 4, strokeWidth: 0 }} />
                  )}
                  {visibleSeries.alerts && (
                    <Area type="monotone" dataKey="alerts" stroke="#FF0040" fill="transparent" strokeWidth={2} strokeDasharray="5 5" name="alerts" activeDot={{ r: 4, strokeWidth: 0 }} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* KPI Summary Badges aligned along the bottom edge */}
            <div className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-800/50 pt-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Total Volume</span>
                <span className="text-sm font-medium text-white">1,420 Listings</span>
              </div>
              <div className="flex flex-col border-l border-slate-800/50 pl-4">
                <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Peak Day</span>
                <span className="text-sm font-medium text-white">Saturday &middot; 230 Tx</span>
              </div>
              <div className="flex flex-col border-l border-slate-800/50 pl-4">
                <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Alert Spike</span>
                <span className="text-sm font-medium text-emerald-400">+14% vs last week</span>
              </div>
            </div>
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
                      <Cell 
                        key={index} 
                        fill={entry.color} 
                        className="cursor-pointer transition-transform hover:scale-[1.05]" 
                        onClick={() => handleCategoryClick(entry.name)} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5">
              {drugDistributionData.map((item) => (
                <div 
                  key={item.name} 
                  className="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-[11px] transition-colors hover:bg-slate-800/50"
                  onClick={() => handleCategoryClick(item.name)}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full shadow-sm" style={{ background: item.color }} />
                    <span className="text-muted-foreground transition-colors hover:text-white">{item.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{item.value}</span>
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

      {/* Drug Category Details Modal */}
      <AnimatePresence>
        {isDetailsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute inset-0 bg-[#030711]/80 backdrop-blur-sm"
            />
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-[#0a0f18] p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {drugDistributionData.find(d => d.name === selectedCategory)?.color && (
                      <div className="h-3 w-3 rounded-full" style={{ background: drugDistributionData.find(d => d.name === selectedCategory)?.color }} />
                    )}
                    {selectedCategory}
                  </h2>
                  <p className="text-xs text-muted-foreground">Detailed database breakdown by specific drug type.</p>
                </div>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-slate-800/50 bg-[#070a10]">
                {isDrugDetailsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                    <p className="mt-2 text-xs text-slate-400">Querying database...</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-[#0a0f18] text-xs font-semibold uppercase text-slate-400">
                      <tr>
                        <th className="border-b border-slate-800 px-4 py-3">Specific Type</th>
                        <th className="border-b border-slate-800 px-4 py-3 text-right">Listing Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {drugDetailsData.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                            No granular details found.
                          </td>
                        </tr>
                      ) : (
                        drugDetailsData.map((d, i) => (
                          <tr key={i} className="transition-colors hover:bg-slate-800/30">
                            <td className="px-4 py-3 font-medium text-slate-200">{d.name}</td>
                            <td className="px-4 py-3 text-right text-slate-400">{d.count}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
