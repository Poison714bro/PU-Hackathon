import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export function getRiskColor(score: number): string {
  if (score >= 90) return "#FF0040";
  if (score >= 70) return "#FF4500";
  if (score >= 50) return "#FFD700";
  if (score >= 30) return "#00FFFF";
  return "#8B8B8B";
}

export function getRiskLabel(score: number): string {
  if (score >= 90) return "Critical";
  if (score >= 70) return "High";
  if (score >= 50) return "Medium";
  if (score >= 30) return "Low";
  return "Info";
}

export function getDrugColor(category: string): string {
  const colors: Record<string, string> = {
    "Opioids/Fentanyl": "#FF4500",
    "Stimulants": "#00FFFF",
    "Cannabis": "#39FF14",
    "Psychedelics": "#B026FF",
    "Prescription/Other": "#FFD700",
  };
  return colors[category] || "#8B8B8B";
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
