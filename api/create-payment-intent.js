import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY environment variable is not set");
if (!/^sk_(live|test)_/.test(process.env.STRIPE_SECRET_KEY)) throw new Error("Invalid STRIPE_SECRET_KEY format: must start with sk_live_ or sk_test_");
if (!process.env.STRIPE_PUBLISHABLE_KEY) throw new Error("STRIPE_PUBLISHABLE_KEY environment variable is not set");
if (!/^pk_(live|test)_/.test(process.env.STRIPE_PUBLISHABLE_KEY)) throw new Error("Invalid STRIPE_PUBLISHABLE_KEY format: must start with pk_live_ or pk_test_");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) throw new Error("FRONTEND_URL environment variable is not set");

export default async function handler(req, res) {
  // ✅ CORS headers
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_URL);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight request
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { amount, currency = "usd" } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Missing required field: amount" });
    }

    const amountInCents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountInCents) || amountInCents < 50) {
      return res.status(400).json({ error: "Invalid amount: must be a positive number (minimum $0.50)" });
    }

    if (!/^[a-z]{3}$/.test(currency)) {
      return res.status(400).json({ error: "Invalid currency: must be a 3-letter ISO currency code (e.g. usd, eur, gbp)" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
}
