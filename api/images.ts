import { createHash } from "node:crypto";
import { kv } from "@vercel/kv";
import { isOwner, json, sameOrigin } from "./_lib/security.js";

// Images are stored independently from the catalog, avoiding the request-size
// limit for whole-catalog saves. IDs are content hashes, so duplicates are reused.
const MAX_IMAGE_BYTES = 300 * 1024;
const idPattern = /^[a-f0-9]{64}$/;

function imageBytes(data: unknown): { bytes: Buffer; type: string } | undefined {
  if (typeof data !== "string" || data.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 64) return;
  const match = /^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/.exec(data);
  if (!match) return;
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES || bytes.toString("base64") !== match[2]) return;
  const type = match[1];
  const valid = type === "jpeg" ? bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : type === "png" ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : type === "webp" ? bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP"
    : bytes.subarray(0, 6).toString() === "GIF87a" || bytes.subarray(0, 6).toString() === "GIF89a";
  return valid ? { bytes, type } : undefined;
}

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    const id = req.query?.id;
    if (typeof id !== "string" || !idPattern.test(id)) return json(res, 400, { error: "Invalid image ID" });
    try {
      const image = imageBytes(await kv.get(`image:${id}`));
      if (!image) return json(res, 404, { error: "Image not found" });
      return res.status(200).setHeader("Content-Type", `image/${image.type}`).setHeader("X-Content-Type-Options", "nosniff").setHeader("Cache-Control", "public, max-age=31536000, immutable").send(image.bytes);
    } catch { return json(res, 503, { error: "Image storage unavailable" }); }
  }
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!sameOrigin(req)) return json(res, 403, { error: "Invalid origin" });
  if (!isOwner(req)) return json(res, 401, { error: "Owner authentication required" });
  const image = imageBytes(req.body?.image);
  if (!image) return json(res, 400, { error: "Invalid or oversized image" });
  const id = createHash("sha256").update(image.type).update(image.bytes).digest("hex");
  try {
    await kv.set(`image:${id}`, req.body.image);
    return json(res, 200, { url: `/api/images?id=${id}` });
  } catch { return json(res, 503, { error: "Image storage unavailable" }); }
}
