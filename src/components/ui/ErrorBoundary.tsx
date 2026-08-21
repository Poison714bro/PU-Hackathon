"use client";

import { Component, ErrorInfo, ReactNode, useState, useCallback } from "react";
import { AlertTriangle, RefreshCw, Bug } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: unknown[];
  resetOnKeysChange?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console (in production, send to error tracking service)
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.props.resetOnKeysChange && this.props.resetKeys) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      if (hasResetKeyChanged) {
        this.reset();
      }
    }
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full items-center justify-center p-8 bg-background">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-6 border border-red-500/20">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              An unexpected error occurred. Our team has been notified.
            </p>

            <details className="text-left mb-6 p-4 bg-slate-900/50 rounded-lg border border-border">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                Error Details
              </summary>
              <pre className="mt-2 text-[10px] text-red-400 overflow-auto max-h-40 font-mono">
                {this.state.error?.message}
                {this.state.error?.stack && `\n\n${this.state.error.stack}`}
              </pre>
            </details>

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.reset}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 rounded-lg border border-border bg-slate-800/50 px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              >
                <Bug className="h-4 w-4" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping pages
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for programmatic error reporting
export function useErrorHandler() {
  const [, setError] = useState(0);

  const reportError = useCallback((error: Error, context?: Record<string, unknown>) => {
    console.error("Reported error:", error, context);
    // In production, send to error tracking service (Sentry, LogRocket, etc.)
    setError((prev) => prev + 1);
  }, []);

  return { reportError };
}

// Simple error display component for inline errors
export function InlineError({ 
  message, 
  onDismiss, 
  onRetry 
}: { 
  message: string; 
  onDismiss?: () => void; 
  onRetry?: () => void; 
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 animate-in slide-in-from-top-2">
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 text-xs font-medium rounded border border-red-500/30 hover:bg-red-500/10 transition-colors"
        >
          Retry
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-red-500/10 rounded transition-colors"
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}