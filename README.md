# SlyServices Stripe Backend

Serverless backend for the SlyServices car rental booking flow. Built with [Vercel Serverless Functions](https://vercel.com/docs/functions) and powered by [Stripe](https://stripe.com) and [Nodemailer](https://nodemailer.com).

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/health` | Returns deployment status and lists which environment variables are configured / missing |
| `GET`  | `/api/pixel` | Serves the Meta Pixel base code as `text/javascript` (returns 204 if `META_PIXEL_ID` is not set) |
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
| `META_PIXEL_ID` | *(Optional)* Numeric Meta Pixel ID from Meta Business Manager → Events Manager. Leave blank to disable tracking. |

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

## Local Development

```bash
npm install
cp .env.example .env   # fill in your values
vercel dev             # starts a local dev server on http://localhost:3000
```

> **Note:** `vercel dev` requires the Vercel CLI and a linked project (`vercel link`).

---

## Meta Pixel Head Tracking

The `/api/pixel` endpoint serves the standard Meta (Facebook) Pixel base code as a JavaScript file. This lets you wire up head tracking on your website with a single `<script>` tag — no need to hard-code the Pixel ID into your frontend HTML.

### 1. Set the environment variable

In the Vercel dashboard (Project → **Settings** → **Environment Variables**) add:

| Variable | Value |
|----------|-------|
| `META_PIXEL_ID` | Your numeric Pixel ID from [Meta Business Manager → Events Manager](https://business.facebook.com/events_manager) |

Or with the CLI:

```bash
vercel env add META_PIXEL_ID
```

### 2. Add one `<script>` tag to the `<head>` of your main page

Paste the snippet below inside the `<head>` of `slytrans.com` (or any page you want to track). Replace `BACKEND_URL` with your Vercel deployment URL (e.g. `https://slyservices-stripe-backend.vercel.app`).

```html
<!-- Meta Pixel – head tracking -->
<script src="BACKEND_URL/api/pixel" async></script>
<noscript>
  <img height="1" width="1" style="display:none"
       src="https://www.facebook.com/tr?id=YOUR_META_PIXEL_ID&ev=PageView&noscript=1" />
</noscript>
<!-- End Meta Pixel -->
```

> **Tip:** Replace `YOUR_META_PIXEL_ID` in the `<noscript>` fallback with the same numeric ID you set in `META_PIXEL_ID`.

### 3. Verify

Open `/api/health` — the response now includes a `meta_pixel` field:

```json
{ "status": "ok", "meta_pixel": "configured" }
```

If the Pixel ID is not set it shows `"not configured"` and the endpoint returns `204 No Content` (page load is never blocked).
