export interface McpServerCapability {
  name: string;
  useful: boolean | "partial";
  detail: string;
}

export interface McpServer {
  name: string;
  platform: string;
  official: boolean;
  status: "active" | "none" | "limited";
  repo?: string;
  docs?: string;
  auth: string;
  description: string;
  capabilities: McpServerCapability[];
  notes?: string[];
  setupHint?: string;
}

export const MCP_SERVERS: McpServer[] = [
  {
    name: "Webflow MCP Server",
    platform: "Webflow",
    official: true,
    status: "active",
    repo: "https://github.com/webflow/mcp-server",
    auth: "OAuth (remote) or Webflow API token (local)",
    description:
      "Official Webflow MCP server wrapping Data and Designer APIs. Can read and write custom code in site headers/footers - exactly where Cookiebot and GTM scripts live.",
    capabilities: [
      { name: "Read/write custom code in headers/footers", useful: true, detail: "Inspect and inject Cookiebot and GTM scripts" },
      { name: "List pages and sites", useful: true, detail: "Know what pages exist for scanning" },
      { name: "Read CMS collections and items", useful: false, detail: "Not relevant to GDPR auditing" },
      { name: "Designer API (styles, elements, layouts)", useful: false, detail: "Not relevant to GDPR auditing" },
    ],
    notes: [
      "Designer API operations require the Webflow MCP Bridge App running in Designer (can be minimized)",
      "Data API calls (reading custom code, listing pages) don't need the Bridge App",
    ],
  },
  {
    name: "GTM MCP Server (paolobietolini)",
    platform: "GTM",
    official: false,
    status: "active",
    repo: "https://github.com/paolobietolini/gtm-mcp-server",
    auth: "Google OAuth 2.1 with PKCE, tokens stored locally",
    description:
      "Community GTM MCP server under BSD-3-Clause license. Highest-value MCP for our GDPR auditing - most manual checks (A3-A5, B2-B5, H3-H5) require inspecting GTM configuration that this server can read directly.",
    capabilities: [
      { name: "Read tags, triggers, variables", useful: true, detail: "Verify Cookiebot CMP tag, consent triggers, GCM setup" },
      { name: "Read container versions", useful: true, detail: "Audit what's deployed vs draft" },
      { name: "Create/update tags and triggers", useful: true, detail: "Fix consent configuration issues" },
      { name: "Manage accounts, workspaces, permissions", useful: false, detail: "Admin tasks, not auditing" },
    ],
  },
  {
    name: "GTM MCP Server (Stape)",
    platform: "GTM",
    official: false,
    status: "active",
    repo: "https://github.com/stape-io/google-tag-manager-mcp-server",
    docs: "https://stape.io/blog/mcp-server-for-google-tag-manager",
    auth: "Google OAuth built-in",
    description:
      "Alternative GTM MCP server by Stape. Similar capabilities to paolobietolini's server. Stape is a well-known GTM hosting/tools company.",
    capabilities: [
      { name: "Read tags, triggers, variables", useful: true, detail: "Same core capabilities as paolobietolini" },
      { name: "Read container versions", useful: true, detail: "Audit deployed configuration" },
      { name: "Create/update tags and triggers", useful: true, detail: "Fix consent issues" },
    ],
  },
  {
    name: "HubSpot MCP Server",
    platform: "HubSpot",
    official: true,
    status: "limited",
    docs: "https://developers.hubspot.com/mcp",
    auth: "OAuth 2.1 with PKCE, refresh tokens required",
    description:
      "Official HubSpot MCP server (GA). Only provides CRM access - contacts, companies, engagements. Cookie consent banners and privacy settings are dashboard-only with no API access.",
    capabilities: [
      { name: "Read/write CRM data (contacts, companies)", useful: false, detail: "Not relevant to GDPR auditing" },
      { name: "Manage engagements and activity history", useful: false, detail: "Not relevant to GDPR auditing" },
      { name: "Cookie consent banner configuration", useful: "partial", detail: "Not available - dashboard-only, no API" },
    ],
    notes: [
      "Community alternatives exist (baryhuang/mcp-hubspot, shinzo-labs/hubspot-mcp) but none have consent management",
      "Not useful for GDPR auditing until HubSpot exposes consent management via API",
    ],
  },
  {
    name: "Cookiebot / Usercentrics",
    platform: "Cookiebot",
    official: false,
    status: "none",
    auth: "API key for stats endpoint, none for cc.js",
    description:
      "No MCP server exists. Cookie categories are readable via the public cc.js endpoint (our scanner already uses this). Admin dashboard settings are browser-only.",
    capabilities: [
      { name: "Read cookie categories (cc.js)", useful: true, detail: "Public endpoint, no auth needed. Already integrated in our scanner." },
      { name: "Consent statistics API", useful: "partial", detail: "Opt-in/opt-out counts by geography. Useful for reporting, not auditing." },
      { name: "Admin dashboard settings", useful: "partial", detail: "Not available via API - browser-only" },
      { name: "Scan configuration", useful: "partial", detail: "Not available via API - browser-only" },
    ],
    notes: [
      "cc.js endpoint: https://consent.cookiebot.com/cc.js?id={COOKIEBOT_ID}",
      "Usercentrics acquired 'MCP Manager' (Jan 2026) for AI data governance - not for cookie consent auditing",
    ],
  },
];
