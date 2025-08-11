import React from "react";

type State = { hasError: boolean; message?: string };
export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <div className="text-xl font-semibold mb-2">Something broke.</div>
          <div className="text-sm text-gray-700">{this.state.message ?? "Unknown error"}</div>
        </div>
      );
    }
    return this.props.children;
  }
}
