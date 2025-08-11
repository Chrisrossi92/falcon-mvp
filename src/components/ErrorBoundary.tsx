// src/components/ErrorBoundary.tsx
import React from "react";

type State = { hasError: boolean; error?: unknown };

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // This shows full details in browser devtools
    console.error("App error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16 }}>
          <h1>Something broke.</h1>
          <p style={{ color: "#666" }}>Details (also in console):</p>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {String((this.state.error as any)?.message ?? this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children as any;
  }
}

