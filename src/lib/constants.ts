import {
  LayoutDashboard,
  Map,
  GitBranch,
  Search,
  Users,
  Activity,
  Radar,
  Pill,
  Leaf,
  Syringe,
  Microscope,
  Globe,
  Bitcoin,
  Lock,
  Monitor,
} from "lucide-react";
import type { ViewType } from "@/app/page";

export const navItems: { id: ViewType; label: string; icon: React.ElementType; clearance: number }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, clearance: 1 },
  { id: "map", label: "Geo-Intel Map", icon: Map, clearance: 1 },
  { id: "evidence", label: "Evidence Graph", icon: GitBranch, clearance: 2 },
  { id: "investigations", label: "Investigations", icon: Search, clearance: 2 },
  { id: "entity-resolution", label: "Entity Resolution", icon: Users, clearance: 2 },
  { id: "timeline-reconstructor", label: "Timeline Engine", icon: Activity, clearance: 2 },
  { id: "movement-tracker", label: "Pattern of Life", icon: Radar, clearance: 2 },
];

export const drugCategories = [
  { name: "Opioids/Fentanyl", color: "#FF4500", icon: Syringe },
  { name: "Stimulants", color: "#00FFFF", icon: Pill },
  { name: "Cannabis", color: "#39FF14", icon: Leaf },
  { name: "Psychedelics", color: "#B026FF", icon: Microscope },
  { name: "Prescription/Other", color: "#FFD700", icon: Pill },
];

export const sourceStreams = [
  { name: "Darknet", icon: Globe, color: "#10b981" },
  { name: "Blockchain", icon: Bitcoin, color: "#f59e0b" },
  { name: "Encrypted", icon: Lock, color: "#6366f1" },
  { name: "OSINT", icon: Monitor, color: "#8b5cf6" },
];

export const suspectRoles = [
  { name: "supplier", label: "Supplier", color: "#ef4444" },
  { name: "dealer", label: "Dealer", color: "#f97316" },
  { name: "buyer", label: "Buyer", color: "#3b82f6" },
  { name: "courier", label: "Courier", color: "#a855f7" },
];
