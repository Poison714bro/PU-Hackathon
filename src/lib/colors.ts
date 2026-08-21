// Centralized color system for NEXUS Cyber Intelligence Platform
// All drug categories, risk levels, severities, and UI colors in one place

// Drug category colors - used across MapView, EvidenceGraph, Dashboard, Reports, etc.
export const DRUG_CATEGORY_COLORS: Record<string, string> = {
  "Opioids/Fentanyl": "#FF4500",
  "Stimulants": "#00FFFF",
  "Cannabis": "#39FF14",
  "Psychedelics": "#B026FF",
  "Prescription/Other": "#FFD700",
} as const;

export type DrugCategory = keyof typeof DRUG_CATEGORY_COLORS;

// Risk score colors - used for risk badges, nodes, pins, etc.
export const RISK_COLORS: Record<string, string> = {
  critical: "#FF0040",
  high: "#FF4500",
  medium: "#FFD700",
  low: "#00FFFF",
  info: "#8B8B8B",
} as const;

export type RiskLevel = keyof typeof RISK_COLORS;

// Severity colors - used for alerts, notifications, badges
export const SEVERITY_COLORS: Record<string, { dot: string; bg: string; border: string; text: string; badge: string }> = {
  critical: {
    dot: "bg-red-500",
    bg: "bg-red-500/5",
    border: "border-l-red-500",
    text: "text-red-400",
    badge: "text-red-400 bg-red-500/15 border-red-500/30",
  },
  high: {
    dot: "bg-orange-500",
    bg: "bg-orange-500/5",
    border: "border-l-orange-500",
    text: "text-orange-400",
    badge: "text-orange-400 bg-orange-500/15 border-orange-500/30",
  },
  medium: {
    dot: "bg-yellow-500",
    bg: "bg-yellow-500/5",
    border: "border-l-yellow-500",
    text: "text-yellow-400",
    badge: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30",
  },
  low: {
    dot: "bg-cyan-500",
    bg: "bg-cyan-500/5",
    border: "border-l-cyan-500",
    text: "text-primary",
    badge: "text-primary bg-cyan-500/15 border-primary/30",
  },
} as const;

export type Severity = keyof typeof SEVERITY_COLORS;

// Status colors - used for investigation status, case status
export const STATUS_COLORS: Record<string, string> = {
  Open: "text-primary bg-cyan-400/10 border-cyan-400/30",
  "Preparing Brief": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "Arrest Warrant": "text-red-400 bg-red-400/10 border-red-400/30",
  Closed: "text-muted-foreground bg-slate-500/10 border-slate-500/30",
  Active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  "Under Investigation": "text-amber-400 bg-amber-500/10 border-amber-500/30",
  Migrated: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  Seized: "text-red-400 bg-red-500/10 border-red-500/30",
} as const;

// Source stream colors - used in Sidebar, Dashboard feed
export const SOURCE_STREAM_COLORS: Record<string, string> = {
  Darknet: "#a855f7",
  Blockchain: "#f59e0b",
  Encrypted: "#6366f1",
  OSINT: "#8b5cf6",
} as const;

// Suspect role colors - used in EvidenceGraph, EvidenceDrawer, Sidebar
export const SUSPECT_ROLE_COLORS: Record<string, { label: string; color: string; badge: string }> = {
  supplier: { label: "SUPPLIER", color: "#E53E3E", badge: "text-red-400 bg-red-500/15 border-red-500/30" },
  dealer: { label: "DEALER", color: "#D69E2E", badge: "text-orange-400 bg-orange-500/15 border-orange-500/30" },
  buyer: { label: "BUYER", color: "#4A90E2", badge: "text-blue-400 bg-blue-500/15 border-blue-500/30" },
  courier: { label: "COURIER", color: "#E2E8F0", badge: "text-slate-400 bg-slate-500/15 border-slate-500/30" },
  unknown: { label: "UNKNOWN", color: "#718096", badge: "text-muted-foreground bg-slate-500/10 border-slate-500/30" },
} as const;

// Node type colors - used in EvidenceGraph
export const NODE_TYPE_COLORS: Record<string, { icon: string; color: string; label: string }> = {
  username: { icon: "User", color: "#4A90E2", label: "IDENTITY" },
  wallet: { icon: "Wallet", color: "#D69E2E", label: "WALLET" },
  email: { icon: "Mail", color: "#E2E8F0", label: "EMAIL" },
  pgp: { icon: "Key", color: "#E2E8F0", label: "PGP KEY" },
  listing: { icon: "ShoppingBag", color: "#E53E3E", label: "LISTING" },
} as const;

// Edge criteria colors - used in EvidenceGraph
export const EDGE_CRITERIA_COLORS: Record<string, { icon: string; color: string; label: string }> = {
  financial: { icon: "Zap", color: "#D69E2E", label: "FINANCIAL" },
  communication: { icon: "MessageSquare", color: "#E2E8F0", label: "COMMUNICATION" },
  infrastructure: { icon: "Shield", color: "#4A90E2", label: "INFRASTRUCTURE" },
} as const;

// Column colors for Kanban
export const KANBAN_COLUMN_COLORS: Record<string, string> = {
  intake: "#00d4ff",
  active: "#f97316",
  review: "#fbbf24",
  closed: "#22c55e",
} as const;

// Platform colors for listings
export const PLATFORM_COLORS: Record<string, string> = {
  "Hydra Market": "#a855f7",
  "AlphaBay Reborn": "#00d4ff",
  "Versus Market": "#f97316",
  "Dread Forum": "#B026FF",
} as const;

// Utility functions
export function getDrugColor(category: string): string {
  return DRUG_CATEGORY_COLORS[category] || "#8B8B8B";
}

export function getRiskColor(score: number): string {
  if (score >= 90) return RISK_COLORS.critical;
  if (score >= 70) return RISK_COLORS.high;
  if (score >= 50) return RISK_COLORS.medium;
  if (score >= 30) return RISK_COLORS.low;
  return RISK_COLORS.info;
}

export function getRiskLabel(score: number): string {
  if (score >= 90) return "Critical";
  if (score >= 70) return "High";
  if (score >= 50) return "Medium";
  if (score >= 30) return "Low";
  return "Info";
}

export function getSeverityColors(severity: Severity) {
  return SEVERITY_COLORS[severity] || SEVERITY_COLORS.low;
}

export function getStatusColors(status: string) {
  return STATUS_COLORS[status] || STATUS_COLORS.Open;
}

export function getSuspectRoleColors(role: string) {
  return SUSPECT_ROLE_COLORS[role] || SUSPECT_ROLE_COLORS.unknown;
}

export function getNodeTypeColors(type: string) {
  return NODE_TYPE_COLORS[type] || NODE_TYPE_COLORS.username;
}

export function getEdgeCriteriaColors(criteria: string) {
  return EDGE_CRITERIA_COLORS[criteria] || EDGE_CRITERIA_COLORS.communication;
}

export function getSourceStreamColor(source: string): string {
  return SOURCE_STREAM_COLORS[source] || "#64748b";
}

// Formatting functions
export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// CSS variable names for Tailwind config reference
export const CSS_VARIABLES = {
  // Drug categories
  "drug-opioid": DRUG_CATEGORY_COLORS["Opioids/Fentanyl"],
  "drug-stimulant": DRUG_CATEGORY_COLORS.Stimulants,
  "drug-cannabis": DRUG_CATEGORY_COLORS.Cannabis,
  "drug-psychedelic": DRUG_CATEGORY_COLORS.Psychedelics,
  "drug-prescription": DRUG_CATEGORY_COLORS["Prescription/Other"],
  // Severity
  "severity-critical": RISK_COLORS.critical,
  "severity-high": RISK_COLORS.high,
  "severity-medium": RISK_COLORS.medium,
  "severity-low": RISK_COLORS.low,
  "severity-info": RISK_COLORS.info,
} as const;