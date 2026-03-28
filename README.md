# SlyServices Stripe Backend

Serverless backend for the SlyServices car rental booking flow. Built with [Vercel Serverless Functions](https://vercel.com/docs/functions) and powered by [Stripe](https://stripe.com) and [Nodemailer](https://nodemailer.com).

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/health` | Returns deployment status and lists which environment variables are configured / missing |
| `POST` | `/api/create-checkout-session` | Creates a Stripe Checkout session and sends booking confirmation emails |
| `POST` | `/api/send-reservation-email` | Sends a reservation confirmation email without a payment step |
| `POST` | `/api/webhook` | Receives Stripe webhook events; sends owner notification on payment completion |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values before deploying.

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_…` for production, `sk_test_…` for test mode) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from Stripe Dashboard → Webhooks → your endpoint → **Signing secret** |
| `FRONTEND_URL` | Full URL of your frontend (e.g. `https://your-site.com`). Used for CORS and Stripe redirect URLs |
| `SMTP_HOST` | SMTP hostname (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (default `587`) |
| `SMTP_USER` | SMTP username / sending email address |
| `SMTP_PASS` | SMTP password or app password |
| `OWNER_EMAIL` | Email address that receives booking notifications |
| `SLINGSHOT_OWNER_EMAIL` | Additional email that receives booking notifications for Slingshot bookings only (e.g. `Armani@armanichristmassolutions.llc`) |

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
# Complete step 4 first to obtain your webhook signing secret, then run:
vercel env add STRIPE_WEBHOOK_SECRET
```

### 4. Register the Stripe webhook

1. In the [Stripe Dashboard](https://dashboard.stripe.com/webhooks), click **"Add endpoint"**.
2. Set the **Endpoint URL** to:
   ```
   https://<your-vercel-domain>/api/webhook
   ```
3. Under **Events to send**, select `checkout.session.completed`.
4. Click **Add endpoint**, then copy the **Signing secret** (starts with `whsec_`).
5. Add it to Vercel as the `STRIPE_WEBHOOK_SECRET` environment variable (see step 3 above).

### 5. Redeploy to apply environment variables

After adding environment variables, trigger a new deployment:

- **Dashboard:** Project → **Deployments** → **Redeploy** on the latest deployment.
- **CLI:** `vercel --prod`

### 6. Verify

**Step 1 — Health check (open in your browser or run with curl):**

```bash
curl https://<your-vercel-domain>/api/health
```

A fully configured deployment returns:

```json
{ "status": "ok" }
```

If any variables are missing, the response will be `500` and list them:

```json
{ "status": "misconfigured", "missing": ["STRIPE_WEBHOOK_SECRET"] }
```

Add any missing variables in Vercel **Settings → Environment Variables** and redeploy.

**Step 2 — End-to-end checkout test:**

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

## Slingshot Page — Adding Images to the Card Gallery

The Slingshot booking card on `slytrans.com/slingshot.html` displays a photo slideshow. Images live in the **frontend repository** (the site that hosts `slingshot.html`), not in this backend.

### Where to upload new images

Place all Slingshot vehicle photos in this folder inside the **frontend repository**:

```
images/slingshot/
```

If that folder does not exist yet, create it.

### How to name the files

Keep names lowercase, hyphen-separated, and numbered sequentially so the frontend can reference them easily:

```
images/slingshot/slingshot-1.jpg   ← existing hero/main photo (do NOT rename or replace)
images/slingshot/slingshot-2.jpg   ← new photo
images/slingshot/slingshot-3.jpg   ← new photo
images/slingshot/slingshot-4.jpg   ← new photo
…
```

Use **JPG** format and keep each file under **1 MB** for fast page loads.

### How to add them to the card slideshow

After uploading, open `slingshot.html` in the frontend repository and add each new `<img>` tag (or slide entry) inside the existing image gallery/carousel component for the Slingshot card. Do **not** modify the hero banner image at the top of the page.

---

## Slingshot Booking — Owner Notification Email

In addition to the standard `OWNER_EMAIL` notification, every Slingshot booking (reservation, checkout, or confirmed payment) automatically sends a copy to the address set in the `SLINGSHOT_OWNER_EMAIL` environment variable (e.g. `Armani@armanichristmassolutions.llc`).

Set this variable in your Vercel project settings:

```bash
vercel env add SLINGSHOT_OWNER_EMAIL
```

This is handled in `api/send-reservation-email.js`, `api/create-checkout-session.js`, and `api/webhook.js`. No code changes are needed to update the address later — just update the environment variable and redeploy.

---

## Local Development

```bash
npm install
cp .env.example .env   # fill in your values
vercel dev             # starts a local dev server on http://localhost:3000
```

> **Note:** `vercel dev` requires the Vercel CLI and a linked project (`vercel link`).
