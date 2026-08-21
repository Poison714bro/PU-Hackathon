"use client";

import { ReactNode, useCallback } from "react";
import { ArrowLeft, Download, Filter, Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";

export interface ViewLayoutProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconColor?: string;
  backView?: string;
  showExport?: boolean;
  onExport?: () => void;
  showFilter?: boolean;
  onFilter?: () => void;
  showNewCase?: boolean;
  onNewCase?: () => void;
  children: ReactNode;
  extraActions?: ReactNode;
  actionBar?: ReactNode;
  className?: string;
}

export default function ViewLayout({
  title,
  subtitle,
  icon,
  iconColor = "text-primary",
  backView = "dashboard",
  showExport = false,
  onExport,
  showFilter = false,
  onFilter,
  showNewCase = false,
  onNewCase,
  children,
  extraActions,
  actionBar,
  className = "",
}: ViewLayoutProps) {
  const setActiveView = useAppStore((s) => s.setActiveView);

  const handleBack = useCallback(() => {
    setActiveView(backView as any);
  }, [setActiveView, backView]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Breadcrumb & Header */}
      <div className="shrink-0 border-b border-border bg-card/80 px-6 py-4 backdrop-blur-xl">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mb-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
          aria-label={`Back to ${backView}`}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Operations Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <span className={`h-5 w-5 ${iconColor}`}>{icon}</span>
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {extraActions}
            {showExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-slate-900/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-slate-800 hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
            )}
            {showFilter && (
              <button
                onClick={onFilter}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-slate-900/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-slate-800 hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
              >
                <Filter className="h-3 w-3" />
                Filter
              </button>
            )}
            {showNewCase && onNewCase && (
              <button
                onClick={onNewCase}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-cyan-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
              >
                <Plus className="h-3 w-3" />
                New Case
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Optional Action Bar */}
      {actionBar && (
        <div className="shrink-0 border-b border-border bg-card/50 px-6 py-2">
          {actionBar}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}