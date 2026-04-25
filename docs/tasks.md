# Tasks

## Done
- [x] Set up project structure (git, docs folder, CLAUDE.md)
- [x] Document TSS incident and findings
- [x] Document Fredric's protocol proposal
- [x] Summarize TSS compliance report (PDF)
- [x] Parse and organize meeting notes
- [x] Draft audit checklist (27 checks, 9 categories)
- [x] Create Google Drive folder (STORMFORS_PROJECTS/GDPR_PROJECT)
- [x] Create Google Sheet v1 (audit checklist) + Google Doc (project overview)
- [x] Research open source GDPR audit tools/projects
- [x] Deep research: GDPR/ePR legal requirements (cookies, privacy policy, forms, DPAs, data rights, breaches, fines)
- [x] Deep research: Cookiebot + GTM technical setup (correct config, Webflow specifics, testing, common mistakes)
- [x] Deep research: multi-country compliance (Sweden/IMY, Germany, France, Netherlands, UK post-Brexit, US state laws)
- [x] Update checklist to v2 (55 checks, 11 categories - research-validated)
- [x] Create Google Sheet v2 with expanded checklist
- [x] Create Check Overview doc (shareable, 55 checks with severity/regulatory basis/alerts)
- [x] Update Project Overview doc to v2 (55 checks, 11 categories, research findings, technical architecture)
- [x] Build audit protocol (step-by-step guide, 10 phases, maps to all 55 checks)
- [x] Build deployment protocol (pre-deployment gate checklist for site launches and updates)
- [x] Build audit cheat sheet (condensed version for experienced auditors, ~45-60 min)
- [x] Build technical configuration guide (Cookiebot + GTM, covers Webflow/HubSpot/Next.js)
- [x] Found Webflow site list in Google Drive (json-ld-sites/siteId_and_siteName, ~300+ sites)
- [x] Filter site list and create Google Sheet with 99 potential client sites (siteId + siteName + review notes)
- [x] Verify technical configuration guide against current docs (7 corrections applied)
- [x] Filter Webflow site list to 72 client sites (from 406)
- [x] Scaffold Next.js 16 app (shadcn/ui, Prisma 7, design system from json-ld-generator)
- [x] Set up GitHub repo (private, StormforsHQ/gdpr-project) and push feat/scaffold branch
- [x] Build audit checklist UI (expandable categories, check items with status/notes, progress tracking)
- [x] Add slide-over guide drawer with step-by-step instructions for all 55 checks
- [x] Add reference doc pages (Technical Guide, Audit Protocol, Cheat Sheet) with markdown rendering
- [x] Fix markdown rendering with @tailwindcss/typography plugin
- [x] Add automation type badges to all 55 checks (Auto, Browser, AI, GTM API, Cookiebot, Manual)
- [x] Research Webflow, GTM, Cookiebot, HubSpot APIs for automation feasibility

## To do now

### Automation: Page scanner (14 checks)
Server actions that fetch site HTML and analyze it. No browser needed.
- [ ] Build page scanner core: fetch HTML, parse with cheerio or regex
- [ ] A1: Detect scripts in <head> (only GTM allowed)
- [ ] A2: Detect scripts in footer
- [ ] B1: Detect tracking scripts outside GTM
- [ ] D1: Detect ghost scripts (known discontinued services)
- [ ] D3: Detect orphaned pixels in header
- [ ] E1: Audit video embeds (YouTube nocookie, Vimeo)
- [ ] E2: Check Google Fonts loading (CDN vs self-hosted)
- [ ] E3: Check maps embeds
- [ ] E4: Check chat widget scripts
- [ ] E5: Check social embeds
- [ ] F1: Find all forms on site
- [ ] F3: Check privacy policy links near forms
- [ ] F5: Verify SSL/TLS on form POST endpoints
- [ ] I3: Check cookie policy page exists
- [ ] I4: Check privacy policy link in footer
- [ ] J3: Check US services against DPF (dataprivacyframework.gov)

### Automation: Browser tests (8 checks)
Playwright-based tests that need a real browser.
- [ ] B5: Verify Google Consent Mode V2 (check dataLayer for all 4 consent params)
- [ ] G1: Consent banner appears on first visit
- [ ] G3: Granular category controls available
- [ ] G4: Declining actually blocks scripts (DevTools network check)
- [ ] G5: Consent remembered on return visit
- [ ] H6: Cookie tab check (before/after consent)
- [ ] K1/K2/K3: Geo-targeted banner behavior (EU/US/UK)

### Automation: AI agent checks (7 checks)
LLM-powered analysis via OpenRouter (Anthropic SDK). Judgment-based checks.
- [ ] F2: Data minimization review (analyze form fields vs stated purpose)
- [ ] F4: Separate consent per purpose (analyze checkbox structure)
- [ ] G2: Accept/Reject equally prominent (visual analysis)
- [ ] G6: Banner language matches site content
- [ ] G7: Dark pattern detection (pre-ticked boxes, guilt language, hidden reject)
- [ ] I1: Privacy policy completeness (Art. 13/14 requirements)
- [ ] I2: Privacy policy available in all site languages

### Automation: GTM API checks (7 checks)
Via GTM MCP server (paolobietolini/gtm-mcp-server or stape-io).
- [ ] Set up GTM MCP server for the project
- [ ] A3: Cookiebot CMP tag trigger check (Consent Initialization vs All Pages)
- [ ] A4: Official Cookiebot template check (not Custom HTML)
- [ ] A5: AutoBlock is OFF
- [ ] B2: Google tags consent overview (no additional consent required)
- [ ] B3: Non-Google tags consent gated
- [ ] B4: Non-Google tag triggers correct (cookie_consent_update event)

### Automation: Cookiebot checks (7 checks)
Limited API - parse cc.js endpoint for cookie categories, rest is dashboard-only.
- [ ] Build Cookiebot cc.js parser (fetch consent.cookiebot.com/{CBID}/cc.js)
- [ ] C1-C5: Cookie category classification checks (from parsed cc.js data)
- [ ] H1: Trigger compliance scan (dashboard only - flag as manual with link)
- [ ] H2: GCM check (dashboard only - flag as manual with link)

### Infrastructure
- [ ] Get Coolify/Hetzner back online (server unreachable as of 2026-04-25, Cloudflare 522 timeout)
- [ ] Create PostgreSQL database on Coolify
- [ ] Set up Docker + Coolify deployment (Dockerfile, entrypoint.sh with prisma db push)
- [ ] Import 72 Webflow sites from filtered list into app
- [ ] Set up Webflow MCP server (official: webflow/mcp-server, supports custom code read/write)

### Manual/Google Drive
- [ ] Apply formatting to Google Sheet v2 (fonts, colors, column widths, data validation dropdowns)
- [ ] Apply formatting to Google Docs (fonts, heading sizes)
- [ ] Delete old files from Google Drive: v1 Google Sheet + old Project Overview
- [ ] Add links between Google Docs and Google Sheet

## To do later
- [ ] Extend checklist and protocols for HubSpot (consent is dashboard-only, manual checks)
- [ ] Extend checklist and protocols for Next.js apps
- [ ] Research open source CMP alternatives to Cookiebot (cost comparison, GTM integration)
- [ ] GDPR audit report template: HTML/CSS based on Stormfors branding/design system
- [ ] Agency DPA template (standard DPA between Stormfors and each client)
- [ ] DSAR handling procedure template
- [ ] Data breach response plan template

## API research findings (2026-04-25)

| Service | API quality | MCP server | Key limitation |
|---------|------------|------------|----------------|
| Webflow | Full REST API for custom code (site + page level) | Official (webflow/mcp-server) | Registered scripts only, not raw head code fields |
| GTM | Full API v2 for tags, triggers, consent settings | paolobietolini/gtm-mcp-server (74 stars) | No "consent overview" endpoint - must aggregate per-tag |
| Cookiebot | cc.js endpoint only (cookie categories) | None exists | No scan trigger, no admin API, dashboard-only for most |
| HubSpot | CRM API good, consent/tracking limited | baryhuang/mcp-hubspot (CRM only) | Cookie consent banner is dashboard-only |
