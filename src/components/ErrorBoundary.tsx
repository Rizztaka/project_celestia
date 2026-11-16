import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw, Download } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export interface ErrorReportData {
  timestamp: string;
  error: string;
  stack?: string;
  componentStack?: string;
  userAgent: string;
  url: string;
  schemaVersion: number;
  rosterCount: number;
  weaponCount: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Celestia View Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public generateErrorReport(): ErrorReportData {
    let rosterCount = 0;
    let weaponCount = 0;
    let schemaVersion = 2;
    try {
      if (typeof localStorage !== 'undefined') {
        const rosterRaw = localStorage.getItem('celestia_v2_owned_roster');
        rosterCount = rosterRaw ? JSON.parse(rosterRaw).length : 0;
        const weaponsRaw = localStorage.getItem('celestia_v2_raw_weapons');
        weaponCount = weaponsRaw ? JSON.parse(weaponsRaw).length : 0;
        const vRaw = localStorage.getItem('celestia_schema_version');
        schemaVersion = vRaw ? parseInt(vRaw, 10) : 2;
      }
    } catch {
      // ignore
    }

    // Sanitize URL to strip sensitive query parameters like UID
    let sanitizedUrl = '';
    try {
      if (typeof window !== 'undefined' && window.location?.href) {
        const parsedUrl = new URL(window.location.href);
        if (parsedUrl.searchParams.has('uid')) {
          parsedUrl.searchParams.set('uid', '[REDACTED]');
        }
        sanitizedUrl = parsedUrl.toString();
      }
    } catch {
      sanitizedUrl = typeof window !== 'undefined' ? window.location?.href || '' : '';
    }

    return {
      timestamp: new Date().toISOString(),
      error: this.state.error?.message || 'Unknown Error',
      stack: this.state.error?.stack || '',
      componentStack: this.state.errorInfo?.componentStack || '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node/Test',
      url: sanitizedUrl,
      schemaVersion,
      rosterCount,
      weaponCount,
    };
  }

  public handleDownloadReport = () => {
    try {
      const report = this.generateErrorReport();
      const jsonString = JSON.stringify(report, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `celestia-error-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download error report:', err);
    }
  };

  private handleRetry = () => {
    try {
      this.props.onRetry?.();
    } catch (err) {
      console.error('Error in ErrorBoundary onRetry callback:', err);
    }
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    try {
      if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
        window.location.reload();
      }
    } catch (err) {
      console.warn('Window reload failed:', err);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="bg-[#121420] border border-rose-500/40 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl max-w-lg mx-auto my-8"
        >
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-zinc-100">
              {this.props.fallbackTitle || 'Unable to Load View'}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              A network interruption or temporary resource fetch error occurred while loading this view.
              Please check your connection and retry.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              onClick={this.handleRetry}
              className="px-3.5 py-2 rounded-xl bg-[#1c2032] hover:bg-[#252b44] text-zinc-200 text-xs font-semibold border border-[#2b3350] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
            <button
              onClick={this.handleReload}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38f2a] text-[#0a0b0e] text-xs font-bold hover:brightness-110 transition-all cursor-pointer shadow-sm"
            >
              Reload Page
            </button>
            <button
              onClick={this.handleDownloadReport}
              className="px-3.5 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 text-xs font-semibold border border-purple-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Download sanitized diagnostic error report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Error Report</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
