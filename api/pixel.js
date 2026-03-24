/**
 * GET /api/pixel
 *
 * Serves the Meta (Facebook) Pixel as a JavaScript file.
 * The frontend adds a single <script> tag to the <head> of every page:
 *
 *   <script src="BACKEND_URL/api/pixel" async></script>
 *
 * Configure the pixel by setting META_PIXEL_ID in Vercel environment variables.
 * If the variable is not set this endpoint returns 204 No Content so page load
 * is never blocked.
 */

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const pixelId = process.env.META_PIXEL_ID;

  if (!pixelId) {
    return res.status(204).end();
  }

  // Ensure the pixel ID contains only digits (standard Meta Pixel IDs are numeric)
  if (!/^\d+$/.test(pixelId)) {
    console.error("META_PIXEL_ID is not a valid numeric pixel ID");
    return res.status(204).end();
  }

  res.setHeader("Content-Type", "text/javascript; charset=utf-8");
  // Cache for 1 hour; CDN/browser can reuse without re-fetching on every page view
  res.setHeader("Cache-Control", "public, max-age=3600");

  // Standard Meta Pixel base code (from Meta Business Manager)
  const snippet = `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');
fbq('track','PageView');
`.trim();

  res.status(200).send(snippet);
}
