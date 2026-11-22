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
      if (
        typeof window !== 'undefined' &&
        window.location &&
        typeof window.location.reload === 'function'
      ) {
        window.location.reload();
      }
    } catch (err) {
      console.warn('Window reload failed:', err);
    }
  };

  private isNetworkOrChunkError(): boolean {
    const msg = (this.state.error?.message || '').toLowerCase();
    return (
      msg.includes('dynamically imported module') ||
      msg.includes('chunk') ||
      msg.includes('network') ||
      msg.includes('failed to fetch')
    );
  }

  public render() {
    if (this.state.hasError) {
      const isNetworkError = this.isNetworkOrChunkError();
      const errorMessage = this.state.error?.message;

      return (
        <div
          role="alert"
          className="bg-[#121420] border border-rose-500/40 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl max-w-lg mx-auto my-8"
        >
          <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-400/35 flex items-center justify-center mx-auto text-rose-300">
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-zinc-100">
              {this.props.fallbackTitle || 'Unable to Load View'}
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {isNetworkError
                ? 'A network interruption or temporary resource fetch error occurred while loading this view. Check your connection and retry.'
                : 'An unexpected display error occurred in this view. Your saved account data in local storage is safe.'}
            </p>
          </div>

          {errorMessage && (
            <details className="text-left bg-[#0c0e17] border border-[#24293d] rounded-xl px-3.5 py-2.5 text-xs">
              <summary className="cursor-pointer font-semibold text-zinc-300 hover:text-white select-none">
                Technical details
              </summary>
              <p className="mt-2 font-mono text-[11px] text-rose-300 break-words leading-relaxed">
                {errorMessage}
              </p>
            </details>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl bg-[#1c2032] hover:bg-[#252b44] text-zinc-100 text-xs font-semibold border border-[#323a5a] transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Try Again</span>
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e5c14d] text-[#0a0b0e] text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              Reload Page
            </button>
            <button
              type="button"
              onClick={this.handleDownloadReport}
              className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 text-purple-200 text-xs font-semibold border border-purple-400/40 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              title="Download sanitized diagnostic error report"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Download Error Report</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
