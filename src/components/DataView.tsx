import { useEffect, useState, type ReactNode } from "react";
import type { Result } from "../lib/useData";

// One place that decides how loading, error, empty and success look, so every data-backed view behaves the same.

// Show the loading state only if the wait is noticeable. Quick reads never flash a skeleton.
function useAfter(active: boolean, ms: number): boolean {
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    if (!active) { setElapsed(false); return; }
    const timer = window.setTimeout(() => setElapsed(true), ms);
    return () => window.clearTimeout(timer);
  }, [active, ms]);
  return elapsed;
}

export function LoadingPanel() {
  return (
    <div className="empty" role="status" aria-label="Loading">
      <span className="skeleton-lines" style={{ width: "100%" }}><i /><i /><i /><i /></span>
    </div>
  );
}

export function ErrorPanel({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div className="empty" role="alert">
      <h2>Could not load {what}</h2>
      <p>Check your connection and try again.</p>
      <button className="btn" onClick={onRetry}>Try again</button>
    </div>
  );
}

type Props<T> = {
  result: Result<T>;
  /** What is being loaded, for the error message: "templates", "licenses". */
  what: string;
  /** Show this instead of the children when the data is empty. */
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  loading?: ReactNode;
  /** Put loading, error and empty states inside the page grid, for full-width sections. */
  inset?: boolean;
  children: (data: T) => ReactNode;
};

export function DataView<T>({ result, what, isEmpty, empty, loading, inset, children }: Props<T>) {
  const showLoading = useAfter(result.status === "loading", 150);
  const frame = (node: ReactNode) => (inset ? <div className="section-inner">{node}</div> : node);
  if (result.status === "loading") return showLoading ? <>{frame(loading ?? <LoadingPanel />)}</> : null;
  if (result.status === "error") return <>{frame(<ErrorPanel what={what} onRetry={result.retry} />)}</>;
  if (isEmpty?.(result.data)) return <>{frame(empty)}</>;
  return <>{children(result.data)}</>;
}
