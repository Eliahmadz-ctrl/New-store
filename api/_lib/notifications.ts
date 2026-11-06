export type NotificationStatus = "pending" | "accepted" | "failed" | "unknown" | "unconfigured";
export type NotificationStates = { email: NotificationStatus; sms: NotificationStatus };
type OrderSummary = { id: string; total: number };

export function initialNotificationStates(): NotificationStates {
  return {
    email: process.env.RESEND_API_KEY && process.env.ORDER_EMAIL_FROM && process.env.ORDER_EMAIL_TO ? "pending" : "unconfigured",
    sms: process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER && process.env.ORDER_SMS_TO ? "pending" : "unconfigured",
  };
}

async function accepted(url: string, init: RequestInit): Promise<NotificationStatus> {
  try {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(7000) });
    return response.ok ? "accepted" : "failed";
  } catch { return "unknown"; }
}

// The order itself is the source of truth. Provider acceptance is not delivery,
// and notifications intentionally omit customer contact details.
export async function sendOrderNotifications(order: OrderSummary, initial: NotificationStates): Promise<NotificationStates> {
  const message = `New Eliah & Co. order ${order.id}. Total K${order.total.toFixed(2)}. Sign in to the owner dashboard for details.`;
  const email = initial.email === "pending" ? accepted("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `order-${order.id}` },
    body: JSON.stringify({ from: process.env.ORDER_EMAIL_FROM, to: [process.env.ORDER_EMAIL_TO], subject: "New Eliah & Co. order", text: message }),
  }) : Promise.resolve(initial.email);
  const sms = initial.sms === "pending" ? accepted(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(process.env.TWILIO_ACCOUNT_SID!)}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: process.env.TWILIO_FROM_NUMBER!, To: process.env.ORDER_SMS_TO!, Body: message }).toString(),
  }) : Promise.resolve(initial.sms);
  const [emailStatus, smsStatus] = await Promise.all([email, sms]);
  return { email: emailStatus, sms: smsStatus };
}
