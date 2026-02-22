# SlyServices Stripe Backend

Serverless backend for the SlyServices car rental booking flow. Built with [Vercel Serverless Functions](https://vercel.com/docs/functions) and powered by [Stripe](https://stripe.com) and [Nodemailer](https://nodemailer.com).

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/create-checkout-session` | Creates a Stripe Checkout session and sends booking confirmation emails |
| `POST` | `/api/send-reservation-email` | Sends a reservation confirmation email without a payment step |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values before deploying.

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_…` for production, `sk_test_…` for test mode) |
| `FRONTEND_URL` | Full URL of your frontend (e.g. `https://your-site.com`). Used for CORS and Stripe redirect URLs |
| `SMTP_HOST` | SMTP hostname (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (default `587`) |
| `SMTP_USER` | SMTP username / sending email address |
| `SMTP_PASS` | SMTP password or app password |
| `OWNER_EMAIL` | Email address that receives booking notifications |

---

## How to Deploy to Vercel

### 1. Install the Vercel CLI (optional)

```bash
npm install -g vercel
```

### 2. Import the project

**Via the Vercel dashboard (recommended):**

1. Go to [vercel.com/new](https://vercel.com/new).
2. Click **"Import Git Repository"** and select `slyservices-stripe-backend`.
3. Leave the **Framework Preset** as **Other** (no build step needed).
4. Click **Deploy** — Vercel will detect `vercel.json` automatically.

**Via the CLI:**

```bash
cd slyservices-stripe-backend
vercel
```

Follow the prompts. When asked about build settings, accept the defaults.

### 3. Add environment variables

In the Vercel dashboard:

1. Open your project → **Settings** → **Environment Variables**.
2. Add each variable from the table above.
3. Set the **Environment** scope to **Production** (and **Preview** if needed).

Or with the CLI:

```bash
vercel env add STRIPE_SECRET_KEY
vercel env add FRONTEND_URL
vercel env add SMTP_HOST
vercel env add SMTP_PORT
vercel env add SMTP_USER
vercel env add SMTP_PASS
vercel env add OWNER_EMAIL
```

### 4. Redeploy to apply environment variables

After adding environment variables, trigger a new deployment:

- **Dashboard:** Project → **Deployments** → **Redeploy** on the latest deployment.
- **CLI:** `vercel --prod`

### 5. Verify

Test the live endpoints with `curl` or Postman:

```bash
curl -X POST https://<your-vercel-domain>/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"car":"Toyota Camry","amount":"150","email":"test@example.com","pickup":"2026-03-01","returnDate":"2026-03-05"}'
```

A successful response returns a Stripe Checkout URL:

```json
{ "url": "https://checkout.stripe.com/..." }
```

---

## Local Development

```bash
npm install
cp .env.example .env   # fill in your values
vercel dev             # starts a local dev server on http://localhost:3000
```

> **Note:** `vercel dev` requires the Vercel CLI and a linked project (`vercel link`).
