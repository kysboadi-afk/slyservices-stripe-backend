import Stripe from "stripe";
import nodemailer from "nodemailer";

if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY environment variable is not set");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) throw new Error("FRONTEND_URL environment variable is not set");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default async function handler(req, res) {
  // ✅ CORS headers
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_URL);
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
      success_url: `${FRONTEND_URL}/MY-Car-rental/success.html`,
      cancel_url: `${FRONTEND_URL}/MY-Car-rental/cancel.html`,
      metadata: {
        pickup,
        returnDate,
        business_email: "slyservices@supports-info.com",
      },
    });

    res.status(200).json({ url: session.url });

    // Send confirmation emails (non-blocking)
    const sanitize = (val) => String(val).replace(/[\r\n]/g, " ");
    const emailBody = `
Car: ${sanitize(car)}
Amount: $${sanitize(amount)}
Pickup Date: ${sanitize(pickup)}
Return Date: ${sanitize(returnDate)}
    `.trim();

    transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.OWNER_EMAIL,
      subject: `New Booking: ${car}`,
      text: `A new booking was submitted.\n\nCustomer: ${sanitize(email)}\n\n${emailBody}`,
    }).catch((err) => console.error("Owner email error:", err));

    transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: `Your Booking Confirmation – ${car}`,
      text: `Thank you for your booking!\n\n${emailBody}\n\nComplete your payment here: ${session.url}`,
    }).catch((err) => console.error("Customer email error:", err));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stripe error" });
  }
}
