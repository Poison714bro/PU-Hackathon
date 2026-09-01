"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  const handleReset = () => {
    try {
      reset();
    } catch {
      window.location.href = "/";
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070a10] text-slate-200 p-6">
      <div className="flex max-w-lg flex-col items-center space-y-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">System Malfunction Recovered</h2>
          <p className="text-sm text-slate-400">
            A module rendering exception occurred. You can reinitialize the view or return to the Executive Dashboard.
          </p>
        </div>

        <div className="w-full rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-left font-mono">
          <p className="text-xs text-red-400 break-all">
            {error?.message || error?.digest || "Component runtime error"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg bg-red-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-red-600 focus:outline-none"
          >
            <RefreshCcw className="h-4 w-4" />
            Reinitialize View
          </button>
          <button
            onClick={() => { window.location.href = "/"; }}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 transition-colors hover:bg-slate-700 focus:outline-none"
          >
            <Home className="h-4 w-4" />
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
