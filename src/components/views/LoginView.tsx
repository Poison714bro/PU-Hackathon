"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { authenticate } from "@/lib/auth";
import { Shield, Lock, User as UserIcon, Loader2 } from "lucide-react";

export default function LoginView() {
  const login = useAppStore((s) => s.login);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Please enter both username/email and password.");
      return;
    }

    setError(null);
    setLoading(true);

    const result = await authenticate(identifier, password);
    
    setLoading(false);

    if (result.success && result.user && result.token) {
      login(result.user, result.token);
    } else {
      setError(result.error || "Authentication failed.");
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0f172a] via-background to-background">
      <div className="relative w-full max-w-md p-8 rounded-2xl bg-card/80 border border-border/50 shadow-2xl backdrop-blur-xl">
        {/* Glow effect */}
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl opacity-50 mix-blend-screen pointer-events-none" />
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl opacity-50 mix-blend-screen pointer-events-none" />
        
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="p-3 bg-primary/10 rounded-xl mb-4 border border-primary/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">CyberIntel Platform</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">Authentication Gateway</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 text-center animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Username or Email</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-background/50 border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
                placeholder="agent_smith"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background/50 border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full relative overflow-hidden group bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg py-2.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Authenticating...
              </span>
            ) : (
              "Initialize Session"
            )}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-border/50 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Unauthorized access is strictly prohibited and logged.
          </p>
        </div>
      </div>
    </div>
  );
}
