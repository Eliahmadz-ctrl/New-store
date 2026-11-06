import { clearCookie, configured, isOwner, json, newCookie, passwordMatches, rateLimit, sameOrigin } from "./_lib/security.js";

export default async function handler(req: any, res: any) {
  if (req.method === "GET") return json(res, 200, { authenticated: isOwner(req) });
  if (req.method !== "POST" && req.method !== "DELETE") return json(res, 405, { error: "Method not allowed" });
  if (!sameOrigin(req)) return json(res, 403, { error: "Invalid origin" });
  if (req.method === "DELETE") { res.setHeader("Set-Cookie", clearCookie()); return json(res, 200, { ok: true }); }
  if (!configured()) return json(res, 503, { error: "Owner access is not configured" });
  try {
    if (!(await rateLimit(req, "login", 10, 15 * 60))) return json(res, 429, { error: "Too many attempts. Try again later." });
    const password = req.body?.password;
    if (typeof password !== "string" || password.length > 1024 || !passwordMatches(password)) return json(res, 401, { error: "Invalid password" });
    res.setHeader("Set-Cookie", newCookie());
    return json(res, 200, { ok: true });
  } catch { return json(res, 503, { error: "Owner access is temporarily unavailable" }); }
}
