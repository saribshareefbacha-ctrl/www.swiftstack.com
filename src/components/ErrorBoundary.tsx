import React from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Unexpected UI error encountered.',
    };
  }

  handleRecover = () => {
    try {
      localStorage.removeItem('swiftstack_nav_state_v6');
    } catch {
      // ignore
    }
    this.setState({ hasError: false, message: '' });
    if (typeof window !== 'undefined') {
      window.location.hash = '#hero';
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white">
          <div className="ss-admin-card max-w-md w-full rounded-3xl p-7 text-center space-y-4">
            <ShieldAlert className="w-10 h-10 text-cyan-400 mx-auto" />
            <h2 className="font-display text-xl font-bold">SwiftStack Auto-Recovery</h2>
            <p className="text-xs text-slate-300 leading-relaxed">{this.state.message}</p>
            <button
              type="button"
              onClick={this.handleRecover}
              className="keep-white-text inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-2.5 text-xs font-bold text-white"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Workspace Cleanly</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
