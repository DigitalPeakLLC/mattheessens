import { Resend } from "resend";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const {
      paypalOrderId, transactionId, transactionStatus,
      customer, shipping, items, isGift, giftMessage,
      shippingMethod, subtotal, shippingCost, total
    } = req.body;

    const itemsList = (items || []).map(item => {
      let line = `• ${item.name}`;
      if (item.description) line += ` (${item.description})`;
      line += ` - $${Number(item.price).toFixed(2)}`;
      if (item.quantity > 1) line += ` x${item.quantity}`;
      return line;
    }).join("\n");

    let emailBody = `=== NEW ORDER RECEIVED ===

PayPal Order ID: ${paypalOrderId}
Transaction ID: ${transactionId}
Transaction Status: ${transactionStatus}
Order Date: ${new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}

--- CUSTOMER INFORMATION ---
Name: ${customer?.name || "N/A"}
Email: ${customer?.email || "N/A"}
Phone: ${customer?.phone || "N/A"}

--- SHIPPING INFORMATION ---
Name: ${shipping?.firstName || ""} ${shipping?.lastName || ""}
Address: ${shipping?.address || "N/A"}
${shipping?.apartment ? `Apt/Suite: ${shipping.apartment}\n` : ""}City: ${shipping?.city || "N/A"}
State: ${shipping?.state || "N/A"}
ZIP: ${shipping?.zip || "N/A"}
Shipping Method: ${shippingMethod || "N/A"}
`;

    if (isGift) {
      emailBody += `\n--- GIFT ORDER ---\nThis is a GIFT\n`;
      if (giftMessage) emailBody += `Gift Message: ${giftMessage}\n`;
    }

    emailBody += `
--- ORDER ITEMS ---
${itemsList}

--- ORDER TOTALS ---
Subtotal: $${Number(subtotal).toFixed(2)}
Shipping: $${Number(shippingCost).toFixed(2)}
TOTAL: $${Number(total).toFixed(2)}

=== END OF ORDER ===`;

    await resend.emails.send({
      from: "onboarding@resend.com",
      to: "ben@lavavein.com",
      subject: `New Order from Mattheessen's - PayPal Order #${paypalOrderId}`,
      text: emailBody,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
