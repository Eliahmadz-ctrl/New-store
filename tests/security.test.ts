import { test } from "node:test";
import assert from "node:assert/strict";
import { newCookie, isOwner, sameOrigin } from "../api/_lib/security";
import save from "../api/save-data";
import load from "../api/load-data";
import session from "../api/owner-session";
import orders from "../api/orders";

process.env.KV_REST_API_URL = "https://example.invalid";
process.env.KV_REST_API_TOKEN = "test-token";
process.env.OWNER_PASSWORD = "a".repeat(40);
process.env.OWNER_SESSION_SECRET = "b".repeat(40);
process.env.UPSTASH_DISABLE_TELEMETRY = "1";

const values: Record<string, unknown> = {
  products: [{ id: "one", name: "Hat", unitCost: 5, shipping: 4, unitPrice: 25, inStock: 4, variants: [{ color: "Black", stock: 4, image: "" }] }],
  iphones: [], deliveryLocations: [{ id: "pickup", name: "Pickup", fee: 0, province: "Pickup" }],
  sales: [{ id: "private-sale" }], orders: [{ id: "private-order", phone: "private" }],
};
const hits: Record<string, number> = {};
globalThis.fetch = (async (_url: any, init?: RequestInit) => {
  const cmds = JSON.parse(String(init?.body));
  function run(cmd: any[]) {
    const [name, key, value] = cmd;
    switch (String(name).toLowerCase()) {
      case "get": return { result: values[key] === undefined ? null : JSON.stringify(values[key]) };
      case "incr": hits[key] = (hits[key] || 0) + 1; return { result: hits[key] };
      case "expire": return { result: 1 };
      case "set": values[key] = JSON.parse(value); return { result: "OK" };
      case "eval": {
        if (String(key).includes("INCR")) { const rateKey = cmd[3]; hits[rateKey] = (hits[rateKey] || 0) + 1; return { result: hits[rateKey] }; }
        return { result: 1 };
      }
      default: throw new Error(`Unexpected command: ${name}`);
    }
  }
  return new Response(JSON.stringify(Array.isArray(cmds[0]) ? cmds.map(run) : run(cmds)), { status: 200, headers: { "Content-Type": "application/json" } });
}) as typeof fetch;
function req(method: string, body?: unknown, cookie?: string, origin = "https://shop.example") {
  return { method, body, headers: { host: "shop.example", origin, cookie, "x-vercel-forwarded-for": "1.2.3.4" } };
}
function response() {
  const r: any = { code: 200, headers: {}, body: undefined };
  r.status = (code: number) => { r.code = code; return r; };
  r.setHeader = (key: string, value: string) => { r.headers[key] = value; return r; };
  r.json = (value: unknown) => { r.body = value; return r; };
  return r;
}

test("signed owner cookies reject tampering and expire", () => {
  const cookie = newCookie().split(";")[0];
  assert.equal(isOwner(req("GET", undefined, cookie)), true);
  assert.equal(isOwner(req("GET", undefined, cookie + "x")), false);
  assert.equal(isOwner(req("GET", undefined, "eliah_owner=1.invalid")), false);
  assert.equal(sameOrigin(req("POST", {}, cookie, "https://evil.example")), false);
});

test("owner login fails closed, limits guesses, and sets a secure cookie", async () => {
  let res = response(); await session(req("POST", { password: "wrong" }), res); assert.equal(res.code, 401);
  res = response(); await session(req("POST", { password: "a".repeat(40) }), res);
  assert.equal(res.code, 200); assert.match(res.headers["Set-Cookie"], /HttpOnly; Secure; SameSite=Strict/);
  res = response(); await session(req("POST", { password: "a".repeat(40) }, undefined, "https://evil.example"), res); assert.equal(res.code, 403);
  for (let i = 0; i < 8; i++) { res = response(); await session(req("POST", { password: "wrong" }), res); }
  res = response(); await session(req("POST", { password: "wrong" }), res); assert.equal(res.code, 429);
});

test("public data excludes private records and costs, writes require an owner", async () => {
  let res = response(); await load(req("GET"), res); assert.equal(res.code, 200);
  assert.equal(res.body.orders, undefined); assert.equal(res.body.sales, undefined); assert.equal(res.body.products[0].unitCost, 0);
  res = response(); await save(req("POST", { key: "products", value: [] }), res); assert.equal(res.code, 401);
  const cookie = newCookie().split(";")[0];
  res = response(); await load(req("GET", undefined, cookie), res); assert.equal(res.body.orders[0].phone, "private"); assert.equal(res.body.products[0].unitCost, 5);
  res = response(); await save(req("POST", { key: "orders", value: [] }, cookie), res); assert.equal(res.code, 400);
  res = response(); await save(req("POST", { key: "products", value: [] }, cookie, "https://evil.example"), res); assert.equal(res.code, 403);
});

test("orders check server-side price, stock, delivery and owner-only edits", async () => {
  const order = { customerName: "Test", phone: "123", deliveryLocationId: "pickup", deliveryFee: 0, items: [{ id: "one", color: "Black", qty: 1, price: 25 }] };
  let res = response(); await orders(req("POST", order), res); assert.equal(res.code, 201);
  res = response(); await orders(req("POST", { ...order, items: [{ ...order.items[0], price: 1 }] }), res); assert.equal(res.code, 409);
  res = response(); await orders(req("POST", { ...order, items: [{ ...order.items[0], qty: 5 }] }), res); assert.equal(res.code, 409);
  res = response(); await orders(req("PATCH", { id: "private-order", status: "delete" }), res); assert.equal(res.code, 401);
  res = response(); await orders(req("PATCH", { id: "private-order", status: "delete" }, newCookie().split(";")[0]), res); assert.equal(res.code, 200);
});
