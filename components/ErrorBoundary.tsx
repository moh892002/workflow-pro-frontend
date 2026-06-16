import React from "react";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
          <div className="max-w-md text-center">
            <div className="text-6xl mb-4 text-red-400">⚠</div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={this.handleReset}
              className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-light transition font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
