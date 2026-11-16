import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
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
  }

  private handleRetry = () => {
    try {
      this.props.onRetry?.();
    } catch (err) {
      console.error('Error in ErrorBoundary onRetry callback:', err);
    }
    this.setState({ hasError: false, error: undefined });
  };

  private handleReload = () => {
    window.location.reload();
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

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 rounded-xl bg-[#1c2032] hover:bg-[#252b44] text-zinc-200 text-xs font-semibold border border-[#2b3350] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38f2a] text-[#0a0b0e] text-xs font-bold hover:brightness-110 transition-all cursor-pointer shadow-sm"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
