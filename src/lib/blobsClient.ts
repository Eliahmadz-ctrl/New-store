const BASE = "/api";
async function request(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${BASE}/${path}`, { ...init, headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}) } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}
export const loadAllBlobs = () => request("load-data");
export const login = (password: string) => request("owner-session", { method: "POST", body: JSON.stringify({ password }) });
export const logout = () => request("owner-session", { method: "DELETE" });
export const createOrder = (order: unknown) => request("orders", { method: "POST", body: JSON.stringify(order) });
export const editOrder = (id: string, status: string) => request("orders", { method: "PATCH", body: JSON.stringify({ id, status }) });
const timers = new Map<string, number>();
const pending = new Map<string, unknown>();
const inflight = new Map<string, Promise<void>>();
function send(key: string, value: unknown): Promise<void> {
  const previous = inflight.get(key) || Promise.resolve();
  const task = previous.catch(() => {}).then(async () => {
    await request("save-data", { method: "POST", body: JSON.stringify({ key, value }) });
    if (pending.get(key) === value) pending.delete(key);
  });
  inflight.set(key, task);
  task.then(() => { if (inflight.get(key) === task) inflight.delete(key); }, () => { if (inflight.get(key) === task) inflight.delete(key); });
  return task;
}
export function cancelSaves() { timers.forEach(clearTimeout); timers.clear(); pending.clear(); }
export async function flushSaves() {
  timers.forEach(clearTimeout); timers.clear();
  await Promise.all(Array.from(pending.entries(), ([key, value]) => send(key, value)));
  await Promise.all(inflight.values());
}
export function debouncedSave(key: string, value: unknown, onError: (message: string) => void) {
  pending.set(key, value);
  const existing = timers.get(key);
  if (existing) window.clearTimeout(existing);
  timers.set(key, window.setTimeout(() => {
    timers.delete(key);
    send(key, value).catch((err) => onError(`Could not save ${key}: ${err.message}. Sign in again and retry.`));
  }, 600));
}
