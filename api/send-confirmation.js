import { Resend } from "resend";
import { buildOwnerEmail } from "./emails/owner-notification.js";
import { buildCustomerEmail } from "./emails/customer-confirmation.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const sender = "noreply@mattskeywest.com";
  const recipient = "ben@lavavein.com";

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const data = req.body;

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
    res.status(500).json({ success: false, error: err.message });
  }
}
