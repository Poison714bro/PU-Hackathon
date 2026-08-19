"use client";

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
import {
  kpiData,
  feedData,
  alertsData,
  activityChartData,
  drugDistributionData,
  cryptoVolumeData,
} from "@/lib/mockData";
import {
  formatNumber,
  formatCurrency,
  getRiskColor,
  getRiskLabel,
  getDrugColor,
  getTimeAgo,
} from "@/lib/utils";
import { useAppStore } from "@/lib/store";

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
    <div
      onClick={onClick}
      className={`glass-card group relative overflow-hidden p-5 ${glowClass} cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-lg`}
      style={{ ['--kpi-accent' as any]: color }}
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
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
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
    </div>
  );
}

// ── Custom Chart Tooltip ──
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="tooltip-content">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-[11px]">
          <div className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="font-medium text-slate-200">{entry.value}</span>
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
  
  return (
    <div className="grid-bg min-h-full p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Operations Dashboard</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Real-time intelligence overview • Last updated 2 min ago
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-slate-900/50 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200">
              <Clock className="h-3 w-3" />
              Last 7 Days
            </button>
            <button className="flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20">
              <Zap className="h-3 w-3" />
              Export Report
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Active Investigations"
            value={kpiData.activeInvestigations.toString()}
            trend={kpiData.investigationsTrend}
            icon={Eye}
            color="#00d4ff"
            glowClass="glow-cyan"
            onClick={() => setActiveView("report-investigations")}
          />
          <KpiCard
            title="Suspicious Listings"
            value={formatNumber(kpiData.suspiciousListings)}
            trend={kpiData.listingsTrend}
            icon={ShieldAlert}
            color="#FF4500"
            glowClass="glow-red"
            onClick={() => setActiveView("report-listings")}
          />
          <KpiCard
            title="Crypto Volume Tracked"
            value={formatCurrency(kpiData.cryptoVolumeTracked)}
            trend={kpiData.cryptoTrend}
            icon={Wallet}
            color="#FFD700"
            glowClass="glow-gold"
            onClick={() => setActiveView("report-financial")}
          />
          <KpiCard
            title="Active Alerts"
            value={kpiData.activeAlerts.toString()}
            trend={kpiData.alertsTrend}
            icon={Bell}
            color="#B026FF"
            glowClass=""
            onClick={() => setActiveView("report-alerts")}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Activity Chart */}
          <div className="glass-card col-span-2 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Weekly Activity</h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Listings, transactions, and alert trends
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span className="text-[10px] text-slate-500">Listings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-purple-400" />
                  <span className="text-[10px] text-slate-500">Transactions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="text-[10px] text-slate-500">Alerts</span>
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
          </div>

          {/* Drug Distribution Pie */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white">Drug Category Distribution</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">By listing volume</p>
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
                    <span className="text-slate-400">{item.name}</span>
                  </div>
                  <span className="font-medium text-slate-300">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Crypto Volume Chart */}
        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Cryptocurrency Volume Tracked</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                BTC, ETH, and XMR tracked volume over time
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-orange-400" />
                <span className="text-[10px] text-slate-500">BTC</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="text-[10px] text-slate-500">ETH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-gray-400" />
                <span className="text-[10px] text-slate-500">XMR</span>
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
        </div>

        {/* Feed & Alerts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Multi-Source Feed */}
          <div className="glass-card col-span-2 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Multi-Source Intelligence Feed</h3>
                <div className="live-dot ml-1" />
              </div>
              <button className="text-[11px] text-cyan-400 hover:text-cyan-300">
                View All <ChevronRight className="ml-0.5 inline h-3 w-3" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] font-semibold uppercase tracking-wider text-slate-600">
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
                    <tr 
                      key={item.id} 
                      className="data-row group cursor-pointer"
                      onClick={() => openDossier(item.entity)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <SourceBadge type={item.sourceType} />
                          <span className="text-xs text-slate-400">{item.source}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-xs font-medium text-slate-200">
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
                        <span className="text-[11px] text-slate-500">
                          {getTimeAgo(item.date)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <ExternalLink className="h-3.5 w-3.5 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alerts Panel */}
          <div className="glass-card flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
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
                          <span className="text-xs font-semibold text-slate-200">
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
                                : "bg-cyan-500/15 text-cyan-400"
                            }`}
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-500 line-clamp-2">
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
          </div>
        </div>
      </div>
    </div>
  );
}
