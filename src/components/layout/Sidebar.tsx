"use client";

import { useState } from "react";
import type { ViewType } from "@/app/page";
import {
  LayoutDashboard,
  Map,
  GitBranch,
  Search,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Activity,
  Fingerprint,
  Filter,
  RotateCcw,
  Users,
  Radar,
  Pill,
  Leaf,
  Syringe,
  Microscope,
  Globe,
  Lock,
  Monitor,
  Bitcoin,
  LogOut,
} from "lucide-react";
import { useAppStore } from "@/lib/store";

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const navItems: { id: ViewType; label: string; icon: React.ElementType; clearance: number }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, clearance: 1 },
  { id: "map", label: "Geo-Intel Map", icon: Map, clearance: 1 },
  { id: "evidence", label: "Evidence Graph", icon: GitBranch, clearance: 2 },
  { id: "investigations", label: "Investigations", icon: Search, clearance: 2 },
  { id: "entity-resolution", label: "Entity Resolution", icon: Users, clearance: 2 },
  { id: "timeline-reconstructor", label: "Timeline Engine", icon: Activity, clearance: 2 },
  { id: "movement-tracker", label: "Pattern of Life", icon: Radar, clearance: 2 },
];

const drugCategories = [
  { name: "Opioids/Fentanyl", color: "#FF4500", icon: Syringe },
  { name: "Stimulants", color: "#00FFFF", icon: Pill },
  { name: "Cannabis", color: "#39FF14", icon: Leaf },
  { name: "Psychedelics", color: "#B026FF", icon: Microscope },
  { name: "Prescription/Other", color: "#FFD700", icon: Pill },
];

const sourceStreams = [
  { name: "Darknet", icon: Globe, color: "#10b981" },
  { name: "Blockchain", icon: Bitcoin, color: "#f59e0b" },
  { name: "Encrypted", icon: Lock, color: "#6366f1" },
  { name: "OSINT", icon: Monitor, color: "#8b5cf6" },
];

const suspectRoles = [
  { name: "supplier", label: "Supplier", color: "#ef4444" },
  { name: "dealer", label: "Dealer", color: "#f97316" },
  { name: "buyer", label: "Buyer", color: "#3b82f6" },
  { name: "courier", label: "Courier", color: "#a855f7" },
];

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = useAppStore((s) => s.filters);
  const toggleDrugCategory = useAppStore((s) => s.toggleDrugCategory);
  const setOnlyDrugCategory = useAppStore((s) => s.setOnlyDrugCategory);
  const setOnlySourceStream = useAppStore((s) => s.setOnlySourceStream);
  const setRiskRange = useAppStore((s) => s.setRiskRange);
  const toggleSuspectRole = useAppStore((s) => s.toggleSuspectRole);
  const resetFilters = useAppStore((s) => s.resetFilters);

  const currentUser = useAppStore((s) => s.currentUser);
  const logout = useAppStore((s) => s.logout);
  const userClearance = currentUser?.clearanceLevel || 0;

  const filteredNavItems = navItems.filter((item) => userClearance >= item.clearance);

  return (
    <aside
      className={`relative flex flex-col border-r border-border bg-[var(--sidebar-bg)] transition-all duration-300 ease-in-out ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath stroke='%231e293b' stroke-width='1' stroke-opacity='0.4' d='M20 20 L60 60 M60 20 L20 60'/%3E%3Ccircle cx='20' cy='20' r='2.5' fill='%23334155' fill-opacity='0.6'/%3E%3Ccircle cx='60' cy='60' r='2.5' fill='%23334155' fill-opacity='0.6'/%3E%3Ccircle cx='60' cy='20' r='2.5' fill='%23334155' fill-opacity='0.6'/%3E%3Ccircle cx='20' cy='60' r='2.5' fill='%23334155' fill-opacity='0.6'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: "80px 80px",
      }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
          <Fingerprint className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold tracking-wider text-primary text-glow-cyan">
              NEXUS
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Cyber Intel
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="space-y-1 p-3">
        <div className={`mb-3 ${collapsed ? "px-0" : "px-2"}`}>
          {!collapsed && (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Operations
            </span>
          )}
        </div>
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-cyan-500/10 text-primary shadow-inner shadow-cyan-500/5"
                  : "text-muted-foreground hover:bg-slate-800/50 hover:text-foreground"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`h-[16px] w-[16px] shrink-0 transition-colors ${
                  isActive ? "text-cyan-400 fill-cyan-400/30 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {/* Intelligence Streams (Categories & Sources) */}
        <div className={`mt-4 mb-2 ${collapsed ? "px-0" : "px-2"}`}>
          {!collapsed && (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Drug Categories
            </span>
          )}
        </div>
        {drugCategories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeView === "dashboard" && filters.drugCategories.has(cat.name) && filters.drugCategories.size === 1;
          return (
            <button
              key={cat.name}
              onClick={() => setOnlyDrugCategory(cat.name)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                isActive ? "bg-slate-800/50" : "hover:bg-slate-800/30"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? cat.name : undefined}
            >
              <Icon
                className="h-4 w-4 shrink-0 transition-colors"
                style={{ color: isActive ? cat.color : `${cat.color}80` }}
              />
              {!collapsed && (
                <span style={{ color: isActive ? cat.color : "#94a3b8" }} className="transition-colors group-hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
                  {cat.name}
                </span>
              )}
            </button>
          );
        })}

        <div className={`mt-4 mb-2 ${collapsed ? "px-0" : "px-2"}`}>
          {!collapsed && (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Source Streams
            </span>
          )}
        </div>
        {sourceStreams.map((source) => {
          const Icon = source.icon;
          const isActive = activeView === "dashboard" && filters.sourceStreams.has(source.name) && filters.sourceStreams.size === 1;
          return (
            <button
              key={source.name}
              onClick={() => setOnlySourceStream(source.name)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                isActive ? "bg-slate-800/50" : "hover:bg-slate-800/30"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? source.name : undefined}
            >
              <Icon
                className="h-4 w-4 shrink-0 transition-colors"
                style={{ color: isActive ? source.color : `${source.color}80` }}
              />
              {!collapsed && (
                <span style={{ color: isActive ? source.color : "#94a3b8" }} className="transition-colors group-hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
                  {source.name}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Filters Section */}
      {!collapsed && (
        <div className="border-t border-border px-3 pt-2">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs text-muted-foreground transition-colors hover:bg-slate-800/50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "10px" }}>Filters</span>
            </div>
            {filtersOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {filtersOpen && (
            <div className="mt-1 space-y-3 pb-3">
              {/* Risk Range */}
              <div className="px-1">
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                  Risk Score: {filters.riskRange[0]}–{filters.riskRange[1]}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={filters.riskRange[0]}
                    onChange={(e) =>
                      setRiskRange([
                        Math.min(parseInt(e.target.value), filters.riskRange[1]),
                        filters.riskRange[1],
                      ])
                    }
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-slate-700 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                  />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={filters.riskRange[1]}
                    onChange={(e) =>
                      setRiskRange([
                        filters.riskRange[0],
                        Math.max(parseInt(e.target.value), filters.riskRange[0]),
                      ])
                    }
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-slate-700 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400"
                  />
                </div>
              </div>

              {/* Suspect Role */}
              <div className="px-1">
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-600">Suspect Role</p>
                <div className="flex flex-wrap gap-1">
                  {suspectRoles.map((role) => (
                    <button
                      key={role.name}
                      onClick={() => toggleSuspectRole(role.name)}
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-medium transition-all ${
                        filters.suspectRoles.has(role.name)
                          ? ""
                          : "opacity-40"
                      }`}
                      style={{
                        borderColor: `${role.color}40`,
                        background: filters.suspectRoles.has(role.name) ? `${role.color}15` : "transparent",
                        color: role.color,
                      }}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={resetFilters}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-[10px] text-muted-foreground transition-colors hover:bg-slate-800/50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* System Status — pushed to bottom */}
      <div className="mt-auto space-y-2 border-t border-border p-3">
        {!collapsed && (
          <div className="rounded-lg bg-slate-900/50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium text-emerald-400">System Online</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Data Feeds</span>
                <span className="text-emerald-400">12 Active</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Scrape Cycle</span>
                <span className="text-foreground">14m ago</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Threat Level</span>
                <span className="font-semibold text-orange-400">ELEVATED</span>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-1 px-1">
          {userClearance >= 3 && (
            <button className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-slate-800/50 hover:text-foreground ${collapsed ? "w-full justify-center" : ""}`}>
              <Settings className="h-4 w-4" />
              {!collapsed && <span className="text-xs">Settings</span>}
            </button>
          )}
          <button onClick={() => logout()} className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400 ${collapsed ? "w-full justify-center" : ""}`}>
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="text-xs">Secure Logout</span>}
          </button>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-[var(--sidebar-bg)] text-muted-foreground transition-colors hover:bg-slate-800 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Security Level Badge */}
      {!collapsed && currentUser && (
        <div className="border-t border-border p-3">
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
            userClearance === 3 ? "border-amber-500/20 bg-amber-500/5" :
            userClearance === 2 ? "border-cyan-500/20 bg-cyan-500/5" :
            "border-emerald-500/20 bg-emerald-500/5"
          }`}>
            <Shield className={`h-3.5 w-3.5 ${
              userClearance === 3 ? "text-amber-400" :
              userClearance === 2 ? "text-cyan-400" :
              "text-emerald-400"
            }`} />
            <div className="flex flex-col">
              <span className={`text-[10px] font-medium ${
                userClearance === 3 ? "text-amber-400" :
                userClearance === 2 ? "text-cyan-400" :
                "text-emerald-400"
              }`}>Level {userClearance} Clearance</span>
              <span className="text-[9px] text-muted-foreground">{currentUser.role} Access</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
