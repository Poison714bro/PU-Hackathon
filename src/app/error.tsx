"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070a10] text-slate-200">
      <div className="flex max-w-md flex-col items-center space-y-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">System Malfunction Detected</h2>
          <p className="text-sm text-slate-400">
            A critical error occurred while rendering this module. Our telemetry has logged the anomaly.
          </p>
        </div>

        <div className="w-full rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-left">
          <p className="text-xs font-mono text-red-400 break-all">{error.message || "Unknown error"}</p>
        </div>

        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-lg bg-red-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#070a10]"
        >
          <RefreshCcw className="h-4 w-4" />
          Reinitialize Component
        </button>
      </div>
    </div>
  );
}
