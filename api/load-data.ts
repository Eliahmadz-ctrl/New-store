import { kv } from "@vercel/kv";
import { isOwner, json } from "./_lib/security.js";

const PUBLIC_KEYS = ["products", "iphones", "settings", "deliveryLocations"];
const PRIVATE_KEYS = ["sales", "orders"];

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });
  const owner = isOwner(req);
  try {
    const keys = owner ? [...PUBLIC_KEYS, ...PRIVATE_KEYS] : PUBLIC_KEYS;
    const entries = await Promise.all(keys.map(async (key) => [key, await kv.get<unknown>(key)] as const));
    const data: Record<string, unknown> = {};
    for (const [key, value] of entries) if (value != null) data[key] = value;
    // Keep purchase costs out of the public API response.
    if (!owner && Array.isArray(data.products)) data.products = data.products.map((p: any) => ({ ...p, unitCost: 0, shipping: 0 }));
    if (!owner && Array.isArray(data.iphones)) data.iphones = data.iphones.map((p: any) => ({ ...p, yuanPrice: 0, zmwPrice: 0, shipping: 0 }));
    return json(res, 200, data);
  } catch { return json(res, 503, { error: "Shared storage unavailable" }); }
}
