/**
 * API client — all app data flows through this module.
 *
 * Same shape as before:
 *   - `useApi(...)` returns `undefined` while loading (like `useQuery`),
 *     then the data, and re-fetches on window focus / poll.
 *   - mutations return the parsed response or throw `Error(message)`.
 *
 * The backend is an Express + MongoDB server (see server/index.js).
 * Set `VITE_API_URL` (e.g. "http://localhost:3001") when the API runs
 * on another origin; defaults to same-origin (the server also serves
 * the built SPA in production).
 */

import { useCallback, useEffect, useRef, useState } from "react";

export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    if (data?.error) return data.error;
  } catch {
    // ignore body parse errors
  }
  return `Request failed (${response.status})`;
}

/** GET a JSON endpoint. Throws ApiError on failure. */
export async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(apiUrl(path), { headers });
  if (!response.ok) throw new ApiError(response.status, await parseError(response));
  return (await response.json()) as T;
}

/** POST/PUT/PATCH/DELETE JSON or FormData. Throws ApiError on failure. */
export async function apiSend<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const response = await fetch(apiUrl(path), {
    method: options.method ?? "POST",
    headers,
    body,
  });
  if (!response.ok) throw new ApiError(response.status, await parseError(response));
  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}

// ---------------------------------------------------------------------------
// useApi — a tiny useQuery replacement with revalidation
// ---------------------------------------------------------------------------

interface UseApiOptions {
  /** Re-fetch interval in ms (0 / undefined disables polling). */
  pollMs?: number;
  /** Skip fetching when falsy. */
  enabled?: boolean;
  /** Bearer token for authenticated endpoints (admin API). */
  token?: string | null;
  /** Called on fetch failure (e.g. to detect an expired admin session). */
  onError?: (error: Error) => void;
}

/**
 * Signals every `useApi(path)` hook watching the same path to re-fetch.
 * Pass "*" to revalidate all queries. Call after a successful mutation.
 */
export function mutate(path: string): void {
  window.dispatchEvent(new CustomEvent("api:mutate", { detail: path }));
}

/**
 * Fetches `path` and revalidates on focus, on interval, and when a matching
 * `mutate(path)` fires. Returns `undefined` while loading, just like
 * `useQuery` did.
 */
export function useApi<T>(path: string | null, options: UseApiOptions = {}): T | undefined {
  const enabled = options.enabled !== false && path !== null;
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const pathRef = useRef(path);
  pathRef.current = path;

  const tokenRef = useRef(options.token);
  tokenRef.current = options.token;
  const onErrorRef = useRef(options.onError);
  onErrorRef.current = options.onError;

  const refresh = useCallback(async () => {
    const currentPath = pathRef.current;
    if (currentPath === null) return;
    try {
      const result = await apiGet<T>(currentPath, tokenRef.current);
      setData(result);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Request failed");
      setError(error);
      onErrorRef.current?.(error);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setData(undefined);
      return;
    }
    // Keep any previous data visible while the new fetch is in flight
    // (stale-while-revalidate), so refreshes don't flash skeletons.
    let cancelled = false;
    const run = async () => {
      await refresh();
      if (cancelled) return;
    };
    run();

    let interval: ReturnType<typeof setInterval> | undefined;
    if (options.pollMs && options.pollMs > 0) {
      interval = setInterval(refresh, options.pollMs);
    }
    const onFocus = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const onMutate = (event: Event) => {
      const target = (event as CustomEvent<string>).detail;
      if (target === "*" || target === pathRef.current) refresh();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("api:mutate", onMutate);
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("api:mutate", onMutate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enabled, options.pollMs, refresh]);

  if (error && data === undefined) {
    // Surface the error on the console but keep returning undefined so the
    // UI keeps its existing loading/empty states.
    console.warn(`[api] ${path}:`, error.message);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Shared types (mirror the MongoDB documents returned by the API)
// ---------------------------------------------------------------------------

export interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  priceNote?: string;
  order: number;
}

export interface GalleryItem {
  _id: string;
  title: string;
  url: string;
}

export interface Review {
  _id: string;
  name: string;
  rating: number;
  text: string;
  status: "pending" | "approved";
  createdAt: number;
}

export interface Enquiry {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  requirement?: string;
  message: string;
  status: "new" | "handled";
  createdAt: number;
}

export interface AdminStats {
  images: number;
  products: number;
  pendingReviews: number;
  approvedReviews: number;
  newEnquiries: number;
}
