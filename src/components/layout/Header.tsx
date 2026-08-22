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
  Menu,
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
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const navigateToEntity = useAppStore((s) => s.navigateToEntity);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);

  const unreadAlerts = alertsData.filter((a) => !a.acknowledged).length;

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return searchIndex.filter((item) =>
      item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  useEffect(() => {
    try {
      const history = localStorage.getItem("searchHistory");
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (e) {
      console.error("Failed to parse search history", e);
    }
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const saveSearchHistory = (newHistory: string[]) => {
    setSearchHistory(newHistory);
    try {
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save search history", e);
    }
  };

  const handleSearchSubmit = (query: string) => {
    if (!query.trim()) return;
    
    // Add to history
    const uniqueHistory = [query, ...searchHistory.filter(q => q !== query)].slice(0, 5);
    saveSearchHistory(uniqueHistory);
    
    // Mock search function
    console.log("Executing search for:", query);
    setSearchFocused(false);
    searchInputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchSubmit(searchQuery);
    }
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveSearchHistory([]);
  };

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
    <header className="z-header flex h-16 shrink-0 items-center justify-between border-b border-border bg-[var(--header-bg)] px-4 md:px-6 backdrop-blur-md relative">
      <div className="flex flex-1 items-center gap-3">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden p-2 -ml-2 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {/* Advanced Search */}
        <div className="relative max-w-lg flex-1" ref={searchRef}>
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-all duration-200 ${
              searchFocused
                ? "border-primary/50 bg-slate-900/80 shadow-lg shadow-cyan-500/5"
                : "border-border bg-slate-900/20 opacity-70 hover:opacity-100 hover:bg-slate-900/40"
            }`}
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search wallets, aliases, locations, case IDs..."
              className="w-full bg-transparent text-sm text-foreground placeholder-slate-600 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <div className="flex items-center gap-1 border-l border-border pl-2">
              <kbd className="rounded bg-slate-800/60 px-1.5 py-0.5 text-[10px] text-slate-600">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Search Results / History Dropdown */}
          {searchFocused && (searchQuery.length >= 2 ? searchResults.length > 0 : searchHistory.length > 0) && (
            <div className="search-results-dropdown absolute left-0 right-0 top-12 z-dropdown overflow-hidden rounded-xl border border-border bg-[var(--card)] shadow-2xl shadow-black/50">
              {searchQuery.length >= 2 && searchResults.length > 0 && (
                <>
                  <div className="border-b border-border px-4 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {searchResults.length} results
                    </span>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {searchResults.map((result) => {
                      const Icon = result.icon;
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800/50">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-xs font-medium text-foreground">{result.label}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {result.type === "pin" ? "Map Location" : result.type === "node" ? "Evidence Entity" : "Investigation Case"}
                              {" • "}{result.id}
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] text-muted-foreground">
                            {result.view === "map" ? "Map" : result.view === "evidence" ? "Graph" : "Cases"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {searchQuery.length < 2 && searchHistory.length > 0 && (
                <>
                  <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-slate-900/50">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Recent Searches
                    </span>
                    <button 
                      onClick={clearHistory}
                      className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors focus:outline-none focus:ring-1 focus:ring-red-400 rounded px-1"
                    >
                      Clear History
                    </button>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {searchHistory.map((historyItem, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          onSearchChange(historyItem);
                          handleSearchSubmit(historyItem);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
                      >
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">{historyItem}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
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
            className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-slate-800/50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
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
            <div className="absolute right-0 top-12 z-dropdown w-96 rounded-xl border border-border bg-[var(--card)] shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-semibold text-foreground">Alerts</span>
                  <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400">
                    {unreadAlerts} new
                  </span>
                </div>
                <button className="text-[11px] text-primary hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alertsData.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-slate-800/30 ${
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
                      <p className="text-xs font-medium text-foreground">{alert.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
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
              <div className="border-t border-border px-4 py-2.5">
                <button className="w-full rounded-lg bg-slate-800/50 py-1.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-slate-800 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
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
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
              AT
            </div>
            <div className="hidden flex-col md:flex">
              <span className="text-xs font-medium text-foreground">Agent Torres</span>
              <span className="text-[10px] text-muted-foreground">Cyber Division</span>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 z-dropdown w-56 rounded-xl border border-border bg-[var(--card)] shadow-2xl shadow-black/50">
              <div className="border-b border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white">
                    AT
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Agent Torres</p>
                    <p className="text-[11px] text-muted-foreground">Cyber Division Lead</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-slate-800/50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
                  <User className="h-3.5 w-3.5" />
                  Profile Settings
                </button>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background">
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
