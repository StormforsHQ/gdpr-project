/**
 * One-time script to get a Google OAuth2 refresh token for the GTM API.
 *
 * Steps:
 *   1. Run: node scripts/get-google-token.js
 *   2. Open the URL it prints in your browser
 *   3. Sign in with the Google account that has GTM access
 *   4. After redirect, copy the refresh token from the terminal
 *   5. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN to Coolify
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const creds = JSON.parse(
  fs.readFileSync(path.join(__dirname, "credentials.json"), "utf-8")
);
const { client_id, client_secret } = creds.web;
const REDIRECT_URI = "http://localhost:3000";
const SCOPE = "https://www.googleapis.com/auth/tagmanager.readonly";

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${encodeURIComponent(client_id)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPE)}` +
  `&access_type=offline` +
  `&prompt=consent`;

console.log("\nOpen this URL in your browser:\n");
console.log(authUrl);
console.log("\nWaiting for redirect on http://localhost:3000 ...\n");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/html" });
    res.end("<h2>No authorization code received</h2>");
    return;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id,
        client_secret,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const data = await tokenRes.json();

    if (data.error) {
      console.error("Token exchange failed:", data);
      res.writeHead(500, { "Content-Type": "text/html" });
      res.end(`<h2>Error: ${data.error_description || data.error}</h2>`);
      server.close();
      return;
    }

    console.log("=".repeat(60));
    console.log("Add these to Coolify environment variables:");
    console.log("=".repeat(60));
    console.log(`GOOGLE_CLIENT_ID=${client_id}`);
    console.log(`GOOGLE_CLIENT_SECRET=${client_secret}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${data.refresh_token}`);
    console.log("=".repeat(60));

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      "<h2>Done! Check the terminal for your credentials.</h2>" +
      "<p>You can close this tab.</p>"
    );
  } catch (err) {
    console.error("Token exchange error:", err);
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end("<h2>Token exchange failed - check terminal</h2>");
  }

  server.close();
});

server.listen(3000);
