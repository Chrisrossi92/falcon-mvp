import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; error?: unknown };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Visible in browser devtools
    console.error("App error:", error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const err: any = this.state.error;
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
    return this.props.children;
  }
}


