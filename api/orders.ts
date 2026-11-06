import { kv } from "@vercel/kv";
import { randomUUID } from "node:crypto";
import { products as defaultProducts, iPhones as defaultPhones, defaultDeliveryLocations, expandDeliveryLocations, getVariants, type Product, type IPhoneModel, type DeliveryLocation } from "../src/data.js";
import { isOwner, json, rateLimit, sameOrigin } from "./_lib/security.js";
import { initialNotificationStates, sendOrderNotifications } from "./_lib/notifications.js";

// One atomic operation, so a dashboard status edit cannot erase a concurrent order.
const INSERT = `local raw=redis.call('GET', KEYS[1]); local orders={}; if raw then orders=cjson.decode(raw) end; table.insert(orders, 1, cjson.decode(ARGV[1])); redis.call('SET', KEYS[1], cjson.encode(orders)); return 1`;
const EDIT = `local raw=redis.call('GET', KEYS[1]); if not raw then return 0 end; local orders=cjson.decode(raw); local out={}; local found=0; for _,order in ipairs(orders) do if order.id == ARGV[1] then found=1; if ARGV[2] ~= 'delete' then order.status=ARGV[2]; table.insert(out,order) end else table.insert(out,order) end end; if #out == 0 then redis.call('SET',KEYS[1],'[]') else redis.call('SET',KEYS[1],cjson.encode(out)) end; return found`;
const UPDATE_NOTIFICATIONS = `local raw=redis.call('GET', KEYS[1]); if not raw then return 0 end; local orders=cjson.decode(raw); for _,order in ipairs(orders) do if order.id == ARGV[1] then order.notifications=cjson.decode(ARGV[2]); redis.call('SET',KEYS[1],cjson.encode(orders)); return 1 end end; return 0`;
const text = (v: unknown, n: number) => typeof v === "string" ? v.trim().slice(0, n) : "";
export default async function handler(req: any, res: any) {
  if (req.method !== "POST" && req.method !== "PATCH") return json(res, 405, { error: "Method not allowed" });
  if (!sameOrigin(req)) return json(res, 403, { error: "Invalid origin" });
  try {
    if (req.method === "PATCH") {
      if (!isOwner(req)) return json(res, 401, { error: "Owner authentication required" });
      const { id, status } = req.body || {};
      if (typeof id !== "string" || id.length > 100 || !["New", "Contacted", "Paid", "Delivered", "Cancelled", "delete"].includes(status)) return json(res, 400, { error: "Invalid update" });
      const found = await kv.eval(EDIT, ["orders"], [id, status]);
      return json(res, found ? 200 : 404, found ? { ok: true } : { error: "Order not found" });
    }
    if (!(await rateLimit(req, "order", 20, 3600))) return json(res, 429, { error: "Too many orders. Try again later." });
    const o = req.body;
    if (!o || !text(o.customerName, 100) || !text(o.phone, 40) || !Array.isArray(o.items) || !o.items.length || o.items.length > 50) return json(res, 400, { error: "Name, phone and order items are required" });
    const [storedProducts, storedPhones, storedLocations] = await Promise.all([
      kv.get<Product[]>("products"), kv.get<IPhoneModel[]>("iphones"), kv.get<DeliveryLocation[]>("deliveryLocations")
    ]);
    const products = storedProducts ?? defaultProducts;
    const phones = storedPhones ?? defaultPhones;
    const locations = storedLocations ? expandDeliveryLocations(storedLocations) : defaultDeliveryLocations;
    const location = locations.find(l => l.id === o.deliveryLocationId);
    if (!location || location.fee !== o.deliveryFee) return json(res, 409, { error: "Delivery options changed. Refresh and try again." });
    const items: { id: string; name: string; color: string; qty: number; price: number }[] = [];
    const seen = new Set<string>();
    for (const item of o.items) {
      if (!item || typeof item.id !== "string" || typeof item.color !== "string" || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 100) return json(res, 400, { error: "Invalid order items" });
      const unique = `${item.id}:${item.color}`;
      if (seen.has(unique)) return json(res, 400, { error: "Duplicate order items" });
      seen.add(unique);
      const phone = phones.find(p => `iphone-product-${p.id}` === item.id);
      const product = products.find(p => p.id === item.id && p.id !== "iphone-7-99-product");
      let name: string, price: number, stock: number;
      if (phone) {
        name = `${phone.name} ${phone.condition}`; price = phone.total;
        stock = ({ Black: 3, White: 3, Silver: 2, Gold: 2 } as Record<string, number>)[item.color] || 0;
      } else if (product) {
        name = product.name; price = product.unitPrice;
        stock = getVariants(product).find(v => v.color === item.color)?.stock ?? 0;
      } else return json(res, 409, { error: "An item is no longer available. Refresh and try again." });
      if (!Number.isFinite(price) || price < 0 || item.price !== price || item.qty > stock) return json(res, 409, { error: "Price or stock changed. Refresh and try again." });
      items.push({ id: item.id, name, color: item.color, qty: item.qty, price });
    }
    const notifications = initialNotificationStates();
    const order = { id: randomUUID(), notifications, customerName: text(o.customerName, 100), phone: text(o.phone, 40), email: text(o.email, 200), deliveryArea: location.name, note: text(o.note, 1000), createdAt: new Date().toISOString(), status: "New", items, deliveryLocationName: location.name, deliveryLocationId: location.id, deliveryFee: location.fee, total: items.reduce((sum, i) => sum + i.qty * i.price, location.fee) };
    await kv.eval(INSERT, ["orders"], [JSON.stringify(order)]);
    // Once saved, a provider failure must not cause the customer to retry and
    // accidentally create another order. Record the outcome for the owner.
    try {
      const result = await sendOrderNotifications(order, notifications);
      await kv.eval(UPDATE_NOTIFICATIONS, ["orders"], [order.id, JSON.stringify(result)]);
      if (["failed", "unknown"].includes(result.email) || ["failed", "unknown"].includes(result.sms)) console.error("Order notification provider failed");
    } catch { console.error("Could not record order notification status"); }
    return json(res, 201, { ok: true });
  } catch { return json(res, 503, { error: "Orders are temporarily unavailable" }); }
}
