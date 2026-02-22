const REQUIRED_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "FRONTEND_URL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "OWNER_EMAIL",
];

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  const ok = missing.length === 0;

  res.status(ok ? 200 : 500).json({
    status: ok ? "ok" : "misconfigured",
    ...(missing.length > 0 && { missing }),
  });
}
