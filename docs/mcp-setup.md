# MCP Server Setup for GDPR Auditing

Which MCP servers are useful for auditing client sites, what they can do, and what they can't.

**General advice:** Before auditing a new platform, search for `<platform> mcp server` on GitHub. The MCP ecosystem moves fast - official servers are appearing regularly. Prefer official servers over community ones when available.

## Webflow

**Server:** [webflow/mcp-server](https://github.com/webflow/mcp-server) (official)
**Status:** Active (last commit Apr 2026)
**Auth:** OAuth (remote, no local credentials) or Webflow API token (local)

| Capability | Useful for GDPR audit? |
|-----------|----------------------|
| Read/write custom code in headers/footers | Yes - inspect/inject Cookiebot and GTM scripts |
| List pages and sites | Yes - know what pages exist for scanning |
| Read CMS collections and items | No |
| Designer API (styles, elements, layouts) | No |

**Setup:** `npx @anthropic-ai/claude-code mcp add webflow -- npx @anthropic-ai/create-mcp --profile webflow`

Note: Designer API operations require the Webflow MCP Bridge App running in Designer (can be minimized). Data API calls (reading custom code, listing pages) don't need it.

## Google Tag Manager (GTM)

**Servers:**
- [paolobietolini/gtm-mcp-server](https://github.com/paolobietolini/gtm-mcp-server) - BSD-3-Clause, active
- [stape-io/google-tag-manager-mcp-server](https://github.com/stape-io/google-tag-manager-mcp-server) - by Stape, active

**Auth:** Google OAuth 2.1 with PKCE (both servers). Tokens stored locally.

| Capability | Useful for GDPR audit? |
|-----------|----------------------|
| Read tags, triggers, variables | Yes - verify Cookiebot CMP tag, consent triggers, GCM setup |
| Read container versions | Yes - audit what's deployed vs draft |
| Create/update tags and triggers | Yes - fix consent configuration issues |
| Manage accounts, workspaces, permissions | No |

**Our use case:** This is the most valuable MCP for GDPR auditing. Most of our manual checks (A3-A5, B2-B5, H3-H5) require inspecting GTM configuration. With this MCP, Claude Code could read the tag/trigger setup directly instead of requiring manual browser inspection.

## HubSpot

**Server:** [Official HubSpot MCP](https://developers.hubspot.com/mcp) (GA, at mcp.hubspot.com)
**Status:** Active, graduated from public beta
**Auth:** OAuth 2.1 with PKCE

Community alternatives: baryhuang/mcp-hubspot, shinzo-labs/hubspot-mcp

| Capability | Useful for GDPR audit? |
|-----------|----------------------|
| Read/write CRM data (contacts, companies) | No |
| Manage engagements and activity history | No |
| Cookie consent banner configuration | No - dashboard-only, no API |

**Bottom line:** HubSpot MCP is CRM-only. Cookie consent banners, privacy settings, and tracking configuration are all dashboard-only. Not useful for GDPR auditing until HubSpot exposes consent management via API.

## Cookiebot (Usercentrics)

**Server:** None. No MCP server exists for Cookiebot.

| Capability | Available? |
|-----------|-----------|
| Read cookie categories (cc.js) | Yes - public endpoint, no auth needed |
| Consent statistics API | Yes - GET endpoint with API key |
| Admin dashboard settings | No - browser-only, no API |
| Scan configuration | No - browser-only |

**Public endpoint:** `https://consent.cookiebot.com/cc.js?id={COOKIEBOT_ID}` returns cookie categories. Our scanner already uses this.

**Stats API:** `https://consent.cookiebot.com/api/v1/{apikey}/json/domaingroup/{serial}/domain/{domain}/consent/stats` - opt-in/opt-out counts by geography. Could be useful for compliance reporting but not for auditing configuration.

Note: Usercentrics (parent company) acquired "MCP Manager" in Jan 2026, but that's for governing AI data flows, not cookie consent auditing.

## Priority for setup

1. **GTM MCP** - highest value. Automates the most manual checks in our audit checklist
2. **Webflow MCP** - useful for reading/fixing header scripts across client sites
3. **HubSpot MCP** - skip for now, not relevant to GDPR auditing
4. **Cookiebot** - no MCP needed, public endpoints are sufficient
