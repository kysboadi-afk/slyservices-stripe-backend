import Stripe from "stripe";
import nodemailer from "nodemailer";

if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY environment variable is not set");
if (!/^sk_(live|test)_/.test(process.env.STRIPE_SECRET_KEY)) throw new Error("Invalid STRIPE_SECRET_KEY format: must start with sk_live_ or sk_test_");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const sig = req.headers["stripe-signature"];
  if (!sig) return res.status(400).json({ error: "Missing stripe-signature header" });

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    console.log("Payment confirmed for session:", session.id, "| customer:", session.customer_email);

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.OWNER_EMAIL) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const sanitize = (val) => String(val ?? "").replace(/[\r\n]/g, " ");
      const amountFormatted = session.amount_total != null
        ? `$${(session.amount_total / 100).toFixed(2)}`
        : "N/A";

      // Non-blocking: Stripe already received a 200, so send email without delaying the response
      transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.OWNER_EMAIL,
        subject: `Payment Confirmed – ${sanitize(session.metadata?.pickup ?? "booking")}`,
        text: [
          "A payment was successfully completed.",
          "",
          `Session ID:   ${sanitize(session.id)}`,
          `Customer:     ${sanitize(session.customer_email)}`,
          `Amount Paid:  ${amountFormatted}`,
          `Pickup:       ${sanitize(session.metadata?.pickup)}`,
          `Return:       ${sanitize(session.metadata?.returnDate)}`,
        ].join("\n"),
      }).catch((err) => console.error("Owner payment-confirmed email error:", err));
    }
  }

  res.status(200).json({ received: true });
}
