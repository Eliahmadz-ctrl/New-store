import { test } from "node:test";
import assert from "node:assert/strict";
import { initialNotificationStates, sendOrderNotifications } from "../api/_lib/notifications";

const names = ["RESEND_API_KEY", "ORDER_EMAIL_FROM", "ORDER_EMAIL_TO", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER", "ORDER_SMS_TO"] as const;
test("order alert providers report configuration and failure without leaking secrets", async () => {
  const originalFetch = globalThis.fetch;
  const original = Object.fromEntries(names.map(k => [k, process.env[k]]));
  try {
    for (const k of names) delete process.env[k];
    assert.deepEqual(initialNotificationStates(), { email: "unconfigured", sms: "unconfigured" });
    const sent: { url: string; body: string }[] = [];
    for (const k of names) process.env[k] = `test-${k}`;
    globalThis.fetch = (async (url: any, init?: RequestInit) => {
      sent.push({ url: String(url), body: String(init?.body) });
      return new Response(null, { status: String(url).includes("resend") ? 200 : 400 });
    }) as typeof fetch;
    const result = await sendOrderNotifications({ id: "order-123", total: 120 }, initialNotificationStates());
    assert.deepEqual(result, { email: "accepted", sms: "failed" });
    assert.equal(sent.length, 2);
    assert.ok(sent.every(s => s.body.includes("order-123")));
    assert.ok(sent.every(s => !s.body.includes("test-RESEND_API_KEY") && !s.body.includes("test-TWILIO_AUTH_TOKEN")));
    globalThis.fetch = (async () => { throw new Error("network"); }) as typeof fetch;
    assert.deepEqual(await sendOrderNotifications({ id: "order-123", total: 120 }, initialNotificationStates()), { email: "unknown", sms: "unknown" });
  } finally {
    globalThis.fetch = originalFetch;
    for (const k of names) { if (original[k] === undefined) delete process.env[k]; else process.env[k] = original[k]; }
  }
});
