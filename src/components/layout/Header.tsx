"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  Bell,
  User,
  ChevronDown,
  X,
  Filter,
  Clock,
  AlertTriangle,
  Wifi,
  MapPin,
  GitBranch,
  FolderOpen,
} from "lucide-react";
import { alertsData, mapPinsData, graphNodesData, kanbanData } from "@/lib/mockData";
import { getTimeAgo } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

// Build searchable items once
interface SearchResult {
  id: string;
  label: string;
  type: "pin" | "node" | "case";
  category: string;
  icon: React.ElementType;
  view: "map" | "evidence" | "investigations";
}

function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = [];
  for (const pin of mapPinsData) {
    results.push({ id: pin.id, label: pin.label, type: "pin", category: pin.drugCategory, icon: MapPin, view: "map" });
  }
  for (const node of graphNodesData) {
    results.push({ id: node.id, label: node.label, type: "node", category: node.type, icon: GitBranch, view: "evidence" });
  }
  for (const col of kanbanData) {
    for (const card of col.cards) {
      results.push({ id: card.id, label: card.title, type: "case", category: card.priority, icon: FolderOpen, view: "investigations" });
    }
  }
  return results;
}

const searchIndex = buildSearchIndex();

export default function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const navigateToEntity = useAppStore((s) => s.navigateToEntity);
  const setActiveView = useAppStore((s) => s.setActiveView);

  const unreadAlerts = alertsData.filter((a) => !a.acknowledged).length;

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return searchIndex.filter((item) =>
      item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "pin") {
      navigateToEntity(result.id, "pin", "map");
    } else if (result.type === "node") {
      navigateToEntity(result.id, "node", "evidence");
    } else {
      setActiveView("investigations");
    }
    onSearchChange("");
    setSearchFocused(false);
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--header-bg)] px-6 backdrop-blur-xl">
      {/* Advanced Search */}
      <div className="flex flex-1 items-center gap-3">
        <div className="relative max-w-2xl flex-1" ref={searchRef}>
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-all duration-200 ${
              searchFocused
                ? "border-cyan-500/50 bg-slate-900/80 shadow-lg shadow-cyan-500/5"
                : "border-[var(--border)] bg-slate-900/40"
            }`}
          >
            <Search className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search wallets, aliases, locations, case IDs..."
              className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <div className="flex items-center gap-1 border-l border-[var(--border)] pl-2">
              <kbd className="rounded bg-slate-800/60 px-1.5 py-0.5 text-[10px] text-slate-600">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Search Results Dropdown */}
          {searchFocused && searchResults.length > 0 && (
            <div className="search-results-dropdown absolute left-0 right-0 top-12 z-50 max-h-80 overflow-auto">
              <div className="border-b border-[var(--border)] px-4 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {searchResults.length} results
                </span>
              </div>
              {searchResults.map((result) => {
                const Icon = result.icon;
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-800/50"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800/50">
                      <Icon className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-xs font-medium text-slate-200">{result.label}</p>
                      <p className="text-[10px] text-slate-500">
                        {result.type === "pin" ? "Map Location" : result.type === "node" ? "Evidence Entity" : "Investigation Case"}
                        {" • "}{result.id}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] text-slate-500">
                      {result.view === "map" ? "Map" : result.view === "evidence" ? "Graph" : "Cases"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Live Indicator */}
        <div className="mr-2 flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">
          <Wifi className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] font-medium text-emerald-400">LIVE</span>
          <div className="live-dot" />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadAlerts > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-lg shadow-red-500/30">
                {unreadAlerts}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 z-50 w-96 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-semibold text-slate-200">Alerts</span>
                  <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400">
                    {unreadAlerts} new
                  </span>
                </div>
                <button className="text-[11px] text-cyan-400 hover:text-cyan-300">
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alertsData.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex gap-3 border-b border-[var(--border)] px-4 py-3 transition-colors hover:bg-slate-800/30 ${
                      !alert.acknowledged ? "bg-slate-800/10" : ""
                    }`}
                  >
                    <div
                      className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                        alert.severity === "critical"
                          ? "bg-red-500 shadow-lg shadow-red-500/30"
                          : alert.severity === "high"
                          ? "bg-orange-500"
                          : alert.severity === "medium"
                          ? "bg-yellow-500"
                          : "bg-cyan-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-200">{alert.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">
                        {alert.description}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-600">
                        <Clock className="h-3 w-3" />
                        <span>{getTimeAgo(alert.timestamp)}</span>
                        <span>•</span>
                        <span>{alert.source}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--border)] px-4 py-2.5">
                <button className="w-full rounded-lg bg-slate-800/50 py-1.5 text-center text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200">
                  View All Alerts →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-800/50"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
              AT
            </div>
            <div className="hidden flex-col md:flex">
              <span className="text-xs font-medium text-slate-200">Agent Torres</span>
              <span className="text-[10px] text-slate-500">Cyber Division</span>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-500" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/50">
              <div className="border-b border-[var(--border)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white">
                    AT
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Agent Torres</p>
                    <p className="text-[11px] text-slate-500">Cyber Division Lead</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200">
                  <User className="h-3.5 w-3.5" />
                  Profile Settings
                </button>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10">
                  <X className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
