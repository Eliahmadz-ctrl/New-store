import { kv } from "@vercel/kv";
import { isOwner, json, sameOrigin } from "./_lib/security.js";
const ALLOWED = new Set(["products", "iphones", "settings", "sales", "deliveryLocations"]);
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!sameOrigin(req)) return json(res, 403, { error: "Invalid origin" });
  if (!isOwner(req)) return json(res, 401, { error: "Owner authentication required" });
  const { key, value } = req.body || {};
  if (typeof key !== "string" || !ALLOWED.has(key) || value === undefined) return json(res, 400, { error: "Invalid data" });
  try { await kv.set(key, value); return json(res, 200, { ok: true }); }
  catch { return json(res, 503, { error: "Shared storage unavailable" }); }
}
