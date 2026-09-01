"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { authenticate } from "@/lib/auth";
import { Shield, Lock, User as UserIcon, Loader2, Cpu, Fingerprint, Activity } from "lucide-react";
import { motion } from "framer-motion";

type FocusedInputType = "identifier" | "password" | null;

export default function LoginView() {
  const login = useAppStore((s) => s.login);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<FocusedInputType>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Credentials required for access.");
      return;
    }

    setError(null);
    setLoading(true);

    const result = await authenticate(identifier, password);
    
    setLoading(false);

    if (result.success && result.user && result.token) {
      login(result.user, result.token);
    } else {
      setError(result.error || "Authentication protocol failed.");
    }
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#0a0e17]">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      <div className="grid-bg absolute inset-0 z-0 opacity-30" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md animate-slide-up px-4">
        <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-[#0d131f]/95 p-8 shadow-[0_0_40px_-10px_rgba(0,212,255,0.15)]">
          
          {/* Header Section */}
          <div className="mb-10 flex flex-col items-center">
            <div className="relative mb-5 flex h-14 w-14 animate-fade-in items-center justify-center rounded-2xl bg-[#131f33] border border-cyan-500/20 shadow-[inset_0_0_15px_rgba(0,212,255,0.1)]">
              <Shield className="h-7 w-7 text-cyan-400" />
              <Activity className="absolute -bottom-1 -right-4 h-8 w-8 text-[#1d2a44] opacity-50" />
            </div>
            
            <h1 className="bg-gradient-to-b from-slate-200 to-slate-500 bg-clip-text text-center text-3xl font-black tracking-[0.15em] text-transparent">
              NEXUS
            </h1>
            <p className="mt-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-cyan-500">
              <Cpu className="h-3.5 w-3.5" />
              Secure Terminal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div 
                className="overflow-hidden animate-fade-in rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-xs font-medium text-red-400 shadow-[0_0_10px_rgba(255,0,0,0.1)] backdrop-blur-sm"
              >
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Identifier Input */}
              <div className="relative flex items-center overflow-hidden rounded-lg border border-slate-700/60 bg-[#1e2638]">
                <div className="flex h-12 w-12 items-center justify-center border-r border-slate-700/60 bg-[#161d2b]">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-12 w-full bg-transparent px-4 text-sm font-medium text-slate-200 placeholder:text-slate-500 focus:outline-none"
                  placeholder="admin"
                  aria-label="Username or Operator ID"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              {/* Password Input */}
              <div className="relative flex items-center overflow-hidden rounded-lg border border-slate-700/60 bg-[#1e2638]">
                <div className="flex h-12 w-12 items-center justify-center border-r border-slate-700/60 bg-[#161d2b]">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full bg-transparent px-4 text-sm font-medium text-slate-200 placeholder:text-slate-500 focus:outline-none tracking-[0.2em]"
                  placeholder="••••••••"
                  aria-label="Security Token / Password"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <div className="flex h-12 w-12 items-center justify-center border-l border-slate-700/60">
                  <Fingerprint className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-label="Initialize Connection"
              className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#00c6ff] to-[#0072ff] font-bold tracking-wide text-white shadow-[0_4px_20px_rgba(0,198,255,0.4)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              {loading ? (
                <span className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> AUTHENTICATING
                </span>
              ) : (
                <span className="text-[13px]">INITIALIZE CONNECTION</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3d1a22]" />
              Encrypted Connection Required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
