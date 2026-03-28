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

The Slingshot booking card on `slytrans.com/slingshot.html` displays a photo gallery. Images live in the **frontend repository** (`kysboadi-afk/SLY-RIDES`), not in this backend.

> ⚠️ **Action required** — the second gallery card still shows a duplicate of the main photo. Follow the two steps below to fix it using only the GitHub website (no git required).

---

### Step 1 — Upload your fleet photo as `slingshot-2.jpg`

1. Open **[https://github.com/kysboadi-afk/SLY-RIDES](https://github.com/kysboadi-afk/SLY-RIDES)** in your browser.
2. Click the **`images/`** folder.
3. If `slingshot-2.jpg` already exists and you want to **replace** it:
   - Click `slingshot-2.jpg` → click the **pencil icon** (Edit) → scroll down → click **"Delete file"** → commit the deletion.
4. Go back to the `images/` folder. Click **"Add file" → "Upload files"**.
5. Drag your fleet photo (the one with the lime-green and orange Slingshots) into the upload box.
6. **Rename it `slingshot-2.jpg`** before uploading (rename on your device first, or GitHub will keep the original filename).
7. Scroll down, add a commit message like `"Add slingshot-2.jpg fleet photo"`, and click **"Commit changes"**.

The file must be:
- Named exactly **`slingshot-2.jpg`** (lowercase, no spaces)
- **JPG format**, under **2 MB** for fast page loads

---

### Step 2 — Wire the image into the gallery HTML

1. In the `kysboadi-afk/SLY-RIDES` repo, click **`slingshot.html`**.
2. Click the **pencil icon ✏️** (top-right of the file viewer) to edit.
3. Press **Ctrl+F** (or Cmd+F on Mac) and search for:
   ```
   Polaris Slingshot R side view
   ```
4. You will find this block (around line 837–839):
   ```html
   <div class="sl-gallery-item sl-fade-in sl-fade-in-delay-1">
     <img src="images/slingshot.jpg" alt="Polaris Slingshot R side view" loading="lazy">
   </div>
   ```
5. Change **only** `images/slingshot.jpg` on that line to `images/slingshot-2.jpg`:
   ```html
   <div class="sl-gallery-item sl-fade-in sl-fade-in-delay-1">
     <img src="images/slingshot-2.jpg" alt="Polaris Slingshot R side view" loading="lazy">
   </div>
   ```
6. Scroll down, add a commit message like `"Fix gallery: show slingshot-2.jpg in second card"`, and click **"Commit changes"**.

The page will now show your fleet photo in the gallery's second card. ✅

---

### How to add more photos (optional)

To add a **third card**, append this block inside `<div class="sl-gallery-grid">` right after the second `sl-gallery-item` div:

```html
<div class="sl-gallery-item sl-fade-in sl-fade-in-delay-2">
  <img src="images/slingshot-3.jpg" alt="Polaris Slingshot R fleet" loading="lazy">
</div>
```

Then upload `slingshot-3.jpg` to `SLY-RIDES/images/` using Step 1 above.

> **Do not** change the hero banner image (`images/slingshot.jpg`) at the top of the page or the wide first gallery card.

---

## Slingshot Booking — Owner Notification Email

In addition to the standard `OWNER_EMAIL` notification, every Slingshot booking (reservation, checkout, or confirmed payment) automatically sends a copy to the address set in the `SLINGSHOT_OWNER_EMAIL` environment variable.

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
