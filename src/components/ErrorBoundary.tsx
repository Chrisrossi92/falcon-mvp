import React from "react";

type State = { hasError: boolean; error?: unknown };

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // visible in devtools
    console.error("App error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      const err = this.state.error as any;
      return (
        <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
          <h1>Something broke.</h1>
          <p style={{ color: "#666" }}>Details (also in console):</p>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {(err?.message ?? String(err)) + (err?.stack ? "\n\n" + err.stack : "")}
          </pre>
        </div>
      );
    }
    return this.props.children as any;
  }
}

    return this.props.children as any;
  }
}

