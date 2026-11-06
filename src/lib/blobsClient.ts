// Thin client wrapper around the Vercel serverless functions that read/write
// shared state via Vercel KV (Upstash Redis).
//
// On a Vercel deployment the calls resolve to /api/load-data and /api/save-data.
// Under plain `vite dev` (no API available) every call rejects — callers should
// fall back to localStorage in that case (App.tsx already does this).

const BASE = "/api";

export async function loadAllBlobs(): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/load-data`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`load-data failed: ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

export async function saveBlob(key: string, value: unknown): Promise<void> {
  const res = await fetch(`${BASE}/save-data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) throw new Error(`save-data failed: ${res.status}`);
}

// Debounced save so rapid typing / state changes don't spam the function.
const timers = new Map<string, number>();
export function debouncedSave(key: string, value: unknown, delay = 600): void {
  const existing = timers.get(key);
  if (existing) window.clearTimeout(existing);
  const id = window.setTimeout(() => {
    timers.delete(key);
    saveBlob(key, value).catch((err) => {
      console.warn(`[kv] save ${key} failed`, err);
    });
  }, delay);
  timers.set(key, id);
}

export async function isBlobsAvailable(): Promise<boolean> {
  try {
    await loadAllBlobs();
    return true;
  } catch {
    return false;
  }
}
