import { useEffect, useRef, useState } from "react";

// One small hook for everything the UI loads: a cached, deduplicated async read with explicit
// loading, error and ready states. It is not a data-fetching library; it does only what this app needs.
export type DataState<T> = { status: "loading" } | { status: "error"; error: Error } | { status: "ready"; data: T };
export type Result<T> = DataState<T> & { retry: () => void };

const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

function request<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (cache.has(key)) return Promise.resolve(cache.get(key) as T);
  let pending = inflight.get(key) as Promise<T> | undefined;
  if (!pending) {
    pending = load().then(
      (value) => {
        cache.set(key, value);
        inflight.delete(key);
        return value;
      },
      (error) => {
        inflight.delete(key);
        throw error;
      },
    );
    inflight.set(key, pending);
  }
  return pending;
}

/** Store a value that is already known, so the first render of a view that needs it is not a loading state. */
export function seed<T>(key: string, value: T): void {
  cache.set(key, value);
}

/** Read a value that is already cached, if any. */
export function peek<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

/** Start a read ahead of time. Errors are ignored here; the hook that needs the data reports them. */
export function prefetch<T>(key: string, load: () => Promise<T>): Promise<void> {
  return request(key, load).then(() => undefined, () => undefined);
}

const initial = <T,>(key: string): DataState<T> => (cache.has(key) ? { status: "ready", data: cache.get(key) as T } : { status: "loading" });

export function useData<T>(key: string, load: () => Promise<T>): Result<T> {
  const [state, setState] = useState<DataState<T>>(() => initial<T>(key));
  const [attempt, setAttempt] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;
  const shown = useRef(key);

  // A new key starts from the cache if it has the answer, otherwise from loading.
  if (shown.current !== key) {
    shown.current = key;
    setState(initial<T>(key));
  }

  useEffect(() => {
    let cancelled = false;
    request(key, () => loadRef.current()).then(
      (data) => { if (!cancelled) setState({ status: "ready", data }); },
      (error: unknown) => { if (!cancelled) setState({ status: "error", error: error instanceof Error ? error : new Error(String(error)) }); },
    );
    return () => { cancelled = true; };
  }, [key, attempt]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };
  return { ...state, retry };
}

/** Wait for several reads together: loading until all are ready, error as soon as one fails. */
export function combine<A, B>(a: Result<A>, b: Result<B>): Result<[A, B]>;
export function combine<A, B, C>(a: Result<A>, b: Result<B>, c: Result<C>): Result<[A, B, C]>;
export function combine(...results: Result<unknown>[]): Result<unknown[]> {
  const retry = () => results.forEach((r) => { if (r.status === "error") r.retry(); });
  const failed = results.find((r) => r.status === "error");
  if (failed && failed.status === "error") return { status: "error", error: failed.error, retry };
  if (results.some((r) => r.status === "loading")) return { status: "loading", retry };
  return { status: "ready", data: results.map((r) => (r as { data: unknown }).data), retry };
}
