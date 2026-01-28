import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // ✅ CORS headers
  res.setHeader("Access-Control-Allow-Origin", "https://kysboadi-afk.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight request
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { car, amount, email, pickup, returnDate } = req.body;

    if (!car || !amount || !email || !pickup || !returnDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: car },
            unit_amount: amount * 100, // Stripe requires cents
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: "https://kysboadi-afk.github.io/MY-Car-rental/success.html",
      cancel_url: "https://kysboadi-afk.github.io/MY-Car-rental/cancel.html",
      metadata: {
        pickup,
        returnDate,
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stripe error" });
  }
}
