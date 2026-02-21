import nodemailer from "nodemailer";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async function handler(req, res) {
  // ✅ CORS headers
  res.setHeader("Access-Control-Allow-Origin", "https://kysboadi-afk.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight request
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { email, car, pickup, returnDate, amount } = req.body;

    if (!email || !car || !pickup || !returnDate || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("Missing SMTP configuration environment variables");
      return res.status(500).json({ error: "Server email configuration error" });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Your Car Rental Reservation Confirmation",
      html: `
        <h2>Reservation Confirmed</h2>
        <p>Thank you for your reservation!</p>
        <ul>
          <li><strong>Car:</strong> ${escapeHtml(car)}</li>
          <li><strong>Pickup Date:</strong> ${escapeHtml(pickup)}</li>
          <li><strong>Return Date:</strong> ${escapeHtml(returnDate)}</li>
          <li><strong>Total:</strong> $${escapeHtml(amount)}</li>
        </ul>
      `,
    });

    res.status(200).json({ message: "Reservation email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send email" });
  }
}
