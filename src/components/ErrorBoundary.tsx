import { Component, type ReactNode } from "react";

type Props = { fallback: ReactNode; onError?: (error: Error) => void; children: ReactNode };

// Without a boundary, one failed lazy chunk or model download unmounts the whole app (blank page).
// With one, only the subtree that failed is replaced by `fallback`.
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("[MotionShelf]", error);
    this.props.onError?.(error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
