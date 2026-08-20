interface StatusBadgeProps {
  type: "status" | "risk";
  value: string;
}

const STATUS_COLORS: Record<string, string> = {
  Open: "text-primary bg-cyan-400/10 border-cyan-400/30",
  "Preparing Brief": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "Arrest Warrant": "text-red-400 bg-red-400/10 border-red-400/30",
  Closed: "text-muted-foreground bg-slate-500/10 border-slate-500/30",
};

const RISK_COLORS: Record<string, string> = {
  Critical: "text-red-400 bg-red-500/15 border-red-500/30",
  High: "text-orange-400 bg-orange-500/15 border-orange-500/30",
  Medium: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30",
  Low: "text-primary bg-cyan-500/15 border-primary/30",
};

export default function StatusBadge({ type, value }: StatusBadgeProps) {
  const colorMap = type === "status" ? STATUS_COLORS : RISK_COLORS;
  // Default to a neutral badge if the value is missing from the map
  const colorClasses = colorMap[value] || "text-muted-foreground bg-slate-500/10 border-slate-500/30";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colorClasses}`}
    >
      {value}
    </span>
  );
}
