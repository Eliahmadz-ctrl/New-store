// Vercel serverless function: GET /api/load-data
// Returns all shared state from Vercel KV (Upstash Redis) as a single JSON blob.
//
// Required env vars (auto-injected when you add an Upstash Redis integration
// from the Vercel Marketplace):
//   KV_REST_API_URL, KV_REST_API_TOKEN
// (and optionally KV_REST_API_READ_ONLY_TOKEN)

import { kv } from "@vercel/kv";

export const config = { runtime: "nodejs" };

const KEYS = [
  "products",
  "iphones",
  "settings",
  "sales",
  "orders",
  "deliveryLocations",
] as const;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
};

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    return res
      .writeHead(204, {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      })
      .end();
  }
  if (req.method !== "GET") {
    return res.writeHead(405, { ...corsHeaders, "Content-Type": "application/json" }).end(
      JSON.stringify({ error: "Method not allowed" })
    );
  }

  try {
    const results = await Promise.all(
      KEYS.map(async (key) => {
        const value = await kv.get<unknown>(key);
        return [key, value] as const;
      })
    );

    const data: Record<string, unknown> = {};
    for (const [key, value] of results) {
      if (value !== null && value !== undefined) data[key] = value;
    }

    return res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" }).end(
      JSON.stringify(data)
    );
  } catch (err) {
    // KV not configured — signal to the frontend so it falls back to localStorage.
    return res.writeHead(503, { ...corsHeaders, "Content-Type": "application/json" }).end(
      JSON.stringify({
        error: "KV not configured",
        detail: String(err),
        hint: "Add an Upstash Redis integration from the Vercel Marketplace, then redeploy.",
      })
    );
  }
}
