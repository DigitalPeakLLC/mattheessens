export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { email } = req.body;

  await resend.emails.send({
    from: "onboarding@yourdomain.com",
    to: email,
    subject: "Confirmation",
    html: "<p>You're confirmed ✅</p>",
  });

  res.status(200).json({ success: true });
}
