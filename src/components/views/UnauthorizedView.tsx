"use client";

import { useAppStore } from "@/lib/store";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function UnauthorizedView() {
  const setActiveView = useAppStore((s) => s.setActiveView);
  const currentUser = useAppStore((s) => s.currentUser);

  return (
    <div className="flex h-full w-full items-center justify-center bg-background text-foreground">
      <div className="max-w-md p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-6 border border-red-500/20">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          Your current clearance level (Level {currentUser?.clearanceLevel}) is insufficient to access this secure module. Please contact your administrator to request elevated privileges.
        </p>

        <button
          onClick={() => setActiveView("dashboard")}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Dashboard
        </button>
      </div>
    </div>
  );
}
