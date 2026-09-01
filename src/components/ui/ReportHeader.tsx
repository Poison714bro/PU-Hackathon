import type React from "react";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { ViewType } from "@/app/page";

interface ReportHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  backView?: ViewType;
  backText?: string;
  children?: React.ReactNode;
}

export default function ReportHeader({
  title,
  subtitle,
  icon,
  backView = "dashboard",
  backText = "Back to Operations Dashboard",
  children,
}: ReportHeaderProps) {
  const setActiveView = useAppStore((s) => s.setActiveView);

  return (
    <div className="shrink-0 border-b border-border bg-card px-6 py-4">
      <button
        onClick={() => setActiveView(backView)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mb-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {backText}
      </button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            {icon} {title}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
        {children && <div className="flex items-center gap-3">{children}</div>}
      </div>
    </div>
  );
}
