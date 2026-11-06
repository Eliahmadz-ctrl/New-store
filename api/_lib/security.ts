import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { kv } from "@vercel/kv";

const COOKIE = "eliah_owner";
const SESSION_SECONDS = 8 * 60 * 60;

export function configured() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN &&
    process.env.OWNER_PASSWORD && process.env.OWNER_PASSWORD.length >= 32 &&
    process.env.OWNER_SESSION_SECRET && process.env.OWNER_SESSION_SECRET.length >= 32);
}

function digest(value: string) { return createHash("sha256").update(value).digest(); }
export function passwordMatches(value: string) {
  return timingSafeEqual(digest(value), digest(process.env.OWNER_PASSWORD || ""));
}
function sign(value: string) {
  return createHmac("sha256", process.env.OWNER_SESSION_SECRET || "").update(value).digest("base64url");
}
export function newCookie() {
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return `${COOKIE}=${expires}.${sign(expires)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
}
export function clearCookie() { return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`; }
export function isOwner(req: any) {
  if (!configured()) return false;
  const raw = String(req.headers.cookie || "").split(";").map((s: string) => s.trim()).find((s: string) => s.startsWith(`${COOKIE}=`));
  const [expires, signature] = (raw?.slice(COOKIE.length + 1) || "").split(".");
  if (!/^\d{1,12}$/.test(expires || "") || !signature || Number(expires) <= Date.now() / 1000) return false;
  return timingSafeEqual(digest(signature), digest(sign(expires)));
}
export function sameOrigin(req: any) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || !host) return false;
  try {
    const url = new URL(origin);
    return url.host === host && (url.protocol === "https:" || (!process.env.VERCEL && url.protocol === "http:"));
  } catch { return false; }
}
// Vercel supplies this header; requests without it share one conservative bucket.
export async function rateLimit(req: any, scope: string, max: number, seconds: number) {
  const ip = String(req.headers["x-vercel-forwarded-for"] || "unknown").split(",")[0].trim();
  const key = `rate:${scope}:${createHash("sha256").update(ip).digest("hex")}`;
  const count = await kv.eval<[number], number>(
    "local n=redis.call('INCR',KEYS[1]); if n == 1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n",
    [key], [seconds]
  );
  return count <= max;
}
export function json(res: any, status: number, body: unknown) {
  return res.status(status).setHeader("Cache-Control", "no-store").json(body);
}
