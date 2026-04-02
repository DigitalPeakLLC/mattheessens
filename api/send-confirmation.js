import { Resend } from "resend";
import { buildOwnerEmail } from "./emails/owner-notification.js";
import { buildCustomerEmail } from "./emails/customer-confirmation.js";

async function verifyPayPalOrder(orderId) {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.warn("PayPal credentials not configured, skipping verification");
    return null;
  }

  const base = process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";

  const authRes = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!authRes.ok) return null;
  const { access_token } = await authRes.json();

  const orderRes = await fetch(`${base}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!orderRes.ok) return null;
  return orderRes.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const allowedOrigins = [
    "https://mattskeywest.com",
    "https://www.mattskeywest.com",
  ];
  const origin = req.headers.origin || req.headers.referer || "";
  if (
    process.env.NODE_ENV === "production" &&
    !allowedOrigins.some((o) => origin.startsWith(o))
  ) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  const sender = "noreply@mattskeywest.com";
  const recipient = "mattsmailorder@gmail.com";

  try {
    const data = req.body;

    if (!data.paypalOrderId || !data.customer?.email) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const paypalOrder = await verifyPayPalOrder(data.paypalOrderId);
    if (paypalOrder) {
      const capture = paypalOrder.purchase_units?.[0]?.payments?.captures?.[0];
      if (!capture || capture.status !== "COMPLETED") {
        return res.status(400).json({ success: false, error: "Order not completed" });
      }
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await Promise.all([
      resend.emails.send({
        from: sender,
        to: recipient,
        subject: `New Order from Mattheessen's - Order #${data.paypalOrderId}`,
        html: buildOwnerEmail(data),
      }),
      resend.emails.send({
        from: sender,
        to: data.customer.email,
        subject: `Your Mattheessen's Order Confirmation - #${data.paypalOrderId}`,
        html: buildCustomerEmail(data),
      }),
    ]);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ success: false, error: "Something went wrong. Please try again later." });
  }
}
