import { esc } from "./sanitize.js";

export function buildOwnerEmail(data) {
  const {
    paypalOrderId, transactionId, transactionStatus,
    customer, shipping, items, isGift, giftMessage,
    shippingMethod, subtotal, shippingCost, total
  } = data;

  const orderDate = new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });

  const itemRows = (items || []).map(item => {
    const desc = item.description ? `<br><span style="color:#5C3D2E;font-size:13px;">${esc(item.description)}</span>` : "";
    const qty = item.quantity > 1 ? ` &times; ${item.quantity}` : "";
    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #F5EDE4;font-family:Georgia,serif;color:#2C1810;">
        ${esc(item.name)}${desc}${qty}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #F5EDE4;font-family:Georgia,serif;color:#2C1810;text-align:right;white-space:nowrap;">
        $${(Number(item.price) * (Number(item.quantity) || 1)).toFixed(2)}
      </td>
    </tr>`;
  }).join("");

  const giftSection = isGift ? `
    <tr>
      <td colspan="2" style="padding:16px 0 8px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E1;border-radius:8px;border:1px solid #D4A574;">
          <tr>
            <td style="padding:14px 16px;font-family:Georgia,serif;color:#2C1810;">
              <strong style="color:#D4A574;">&#127873; Gift Order</strong>
              ${giftMessage ? `<br><em style="color:#5C3D2E;">"${esc(giftMessage)}"</em>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>` : "";

  const apartmentLine = shipping?.apartment
    ? `${esc(shipping.apartment)}<br>` : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FAF6F1;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6F1;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:#E31B23;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#FFFFFF;font-family:Georgia,serif;font-size:24px;font-weight:600;">New Order Received</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Mattheessen's Mail Order</p>
          </td>
        </tr>

        <tr>
          <td style="background:#2C1810;padding:14px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#D4A574;font-family:Georgia,serif;font-size:13px;">
                  Order #${esc(paypalOrderId)}
                </td>
                <td style="color:#D4A574;font-family:Georgia,serif;font-size:13px;text-align:right;">
                  ${orderDate}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="padding:28px 32px;">

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td width="50%" valign="top" style="padding-right:12px;">
                <h3 style="margin:0 0 8px;font-family:Georgia,serif;color:#E31B23;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Customer</h3>
                <p style="margin:0;font-family:Georgia,serif;color:#2C1810;font-size:14px;line-height:1.6;">
                  ${esc(customer?.name)}<br>
                  ${esc(customer?.email)}<br>
                  ${esc(customer?.phone)}
                </p>
              </td>
              <td width="50%" valign="top" style="padding-left:12px;">
                <h3 style="margin:0 0 8px;font-family:Georgia,serif;color:#E31B23;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Ship To</h3>
                <p style="margin:0;font-family:Georgia,serif;color:#2C1810;font-size:14px;line-height:1.6;">
                  ${esc(shipping?.firstName)} ${esc(shipping?.lastName)}<br>
                  ${esc(shipping?.address)}<br>
                  ${apartmentLine}${esc(shipping?.city)}, ${esc(shipping?.state)} ${esc(shipping?.zip)}
                </p>
                <p style="margin:6px 0 0;font-family:Georgia,serif;color:#5C3D2E;font-size:13px;">
                  ${esc(shippingMethod)}
                </p>
              </td>
            </tr>
          </table>

          <hr style="border:none;border-top:2px solid #F5EDE4;margin:0 0 20px;">

          <h3 style="margin:0 0 12px;font-family:Georgia,serif;color:#E31B23;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Order Items</h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${itemRows}
          </table>

          ${giftSection}

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
            <tr>
              <td style="padding:6px 12px;font-family:Georgia,serif;color:#5C3D2E;font-size:14px;">Subtotal</td>
              <td style="padding:6px 12px;font-family:Georgia,serif;color:#5C3D2E;font-size:14px;text-align:right;">$${Number(subtotal).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px;font-family:Georgia,serif;color:#5C3D2E;font-size:14px;">Shipping</td>
              <td style="padding:6px 12px;font-family:Georgia,serif;color:#5C3D2E;font-size:14px;text-align:right;">$${Number(shippingCost).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border-top:2px solid #2C1810;font-family:Georgia,serif;color:#2C1810;font-size:18px;font-weight:bold;">Total</td>
              <td style="padding:10px 12px;border-top:2px solid #2C1810;font-family:Georgia,serif;color:#2C1810;font-size:18px;font-weight:bold;text-align:right;">$${Number(total).toFixed(2)}</td>
            </tr>
          </table>

        </td></tr>

        <tr>
          <td style="background:#FAF6F1;padding:16px 32px;text-align:center;border-top:1px solid #F5EDE4;">
            <p style="margin:0;font-family:Georgia,serif;color:#5C3D2E;font-size:12px;">
              Transaction ID: ${esc(transactionId)} &bull; Status: ${esc(transactionStatus)}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}
