import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { car, amount } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: car
            },
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }
      ],
      success_url: "https://kysboadi-afk.github.io/MY-Car-rental/success.html",
      cancel_url: "https://kysboadi-afk.github.io/MY-Car-rental/cancel.html"
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
