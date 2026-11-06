// Vercel serverless function: POST /api/save-data
// Persists a single key/value pair into Vercel KV (Upstash Redis).
//
// Body (JSON): { "key": "<allowed-key>", "value": <any-json> }
//
// Required env vars (auto-injected with an Upstash Redis integration):
//   KV_REST_API_URL, KV_REST_API_TOKEN

import { kv } from "@vercel/kv";

export const config = { runtime: "nodejs" };

const ALLOWED_KEYS = new Set([
  "products",
  "iphones",
  "settings",
  "sales",
  "orders",
  "deliveryLocations",
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
};

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    return res
      .writeHead(204, {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      })
      .end();
  }
  if (req.method !== "POST") {
    return res.writeHead(405, { ...corsHeaders, "Content-Type": "application/json" }).end(
      JSON.stringify({ error: "Method not allowed" })
    );
  }

  let body: { key?: string; value?: unknown };
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" }).end(
      JSON.stringify({ error: "Invalid JSON body" })
    );
  }

  const { key, value } = body;
  if (typeof key !== "string" || !ALLOWED_KEYS.has(key)) {
    return res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" }).end(
      JSON.stringify({ error: `Invalid key: ${key}` })
    );
  }

  try {
    await kv.set(key, value);
    return res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" }).end(
      JSON.stringify({ ok: true, key })
    );
  } catch (err) {
    return res.writeHead(503, { ...corsHeaders, "Content-Type": "application/json" }).end(
      JSON.stringify({
        error: "KV not configured",
        detail: String(err),
        hint: "Add an Upstash Redis integration from the Vercel Marketplace, then redeploy.",
      })
    );
  }
}
