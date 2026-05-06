/**
 * Exchange a Webflow OAuth authorization code for an access token.
 *
 * Usage:
 *   node scripts/exchange-webflow-token.js <client_id> <client_secret> <code>
 *
 * Get client_id and client_secret from:
 *   developers.webflow.com > GDPR Audit app > Edit App
 *
 * The code comes from the redirect URL after authorizing the app.
 *
 * The resulting access token goes into Coolify as WEBFLOW_API_TOKEN.
 */

const [clientId, clientSecret, code] = process.argv.slice(2);

if (!clientId || !clientSecret || !code) {
  console.error("Usage: node scripts/exchange-webflow-token.js <client_id> <client_secret> <code>");
  process.exit(1);
}

async function exchangeToken() {
  const res = await fetch("https://api.webflow.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: "authorization_code",
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Error:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log("\nAccess token (add this as WEBFLOW_API_TOKEN in Coolify):\n");
  console.log(data.access_token);
  console.log("\nFull response:", JSON.stringify(data, null, 2));
}

exchangeToken();
