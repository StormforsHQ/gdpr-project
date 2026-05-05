# Tasks

## Done
- [x] Set up project structure (git, docs folder, CLAUDE.md)
- [x] Document TSS incident and findings
- [x] Document Fredric's protocol proposal
- [x] Summarize TSS compliance report (PDF)
- [x] Parse and organize meeting notes
- [x] Draft audit checklist (27 checks, 9 categories)
- [x] Create Google Drive folder (STORMFORS_PROJECTS/GDPR_PROJECT)
- [x] Create Google Sheet v1 + v2, Google Docs (project overview, check overview)
- [x] Research open source GDPR audit tools/projects
- [x] Deep research: GDPR/ePR legal requirements, Cookiebot + GTM setup, multi-country compliance
- [x] Update checklist to v2 (55 checks), then v3 (69 checks with legal references, IMY annotations)
- [x] Build audit protocol, deployment protocol, audit cheat sheet, technical configuration guide
- [x] Found and filtered Webflow site list (406 -> 72 client sites)
- [x] Scaffold Next.js 16 app (shadcn/ui, Prisma 7, PostgreSQL)
- [x] Set up GitHub repo (private, StormforsHQ/gdpr-project)
- [x] Build full audit checklist UI with 69 checks, 11 categories
- [x] Guide drawer, reference docs, automation badges, glossary tooltips
- [x] Page scanner (18 checks: 15 original + G1, G8, B5) with cheerio
- [x] AI agent checks (9 checks) via OpenRouter + Gemini Flash
- [x] Cookiebot cc.js parser (7 checks: C1-C6, G3) with auto-detect CBID
- [x] Full CRUD: sites, audits, scan runs, check results with auto-save
- [x] Scan history, overwrite protection, individual re-run buttons
- [x] Legal references for all 69 checks (GDPR, ePrivacy, EDPB, CJEU, IMY, US state laws)
- [x] Remediation steps ("how to fix") for all automated checks
- [x] Required fields validation, error handling, OpenRouter credit checks
- [x] Help system, sidebar (grouped by platform, status dots, stack summary)
- [x] Report generation with auto-versioning, editable summary/conclusion, version selector
- [x] "Areas outside this audit" section (email, retention, deletion, pipelines, internal)
- [x] Database backup export/import (zip of CSVs, settings page)
- [x] Playwright E2E tests (21 tests)
- [x] Deploy to personal Coolify/Hetzner with PostgreSQL
- [x] Fix automation UI: 12 "Fix this" buttons with Webflow/GTM REST API clients (2026-04-29)
- [x] Warning triangles on checks missing Cookiebot ID or GTM Container ID (2026-04-29)
- [x] Simplified requirement warning text (user-friendly, says where to find IDs) (2026-04-29)
- [x] Removed redundant status badges from check rows (2026-04-29)
- [x] Scan summary shows skipped count when manual reviews are preserved (2026-04-29)
- [x] Added "fix" error source type to error log (2026-04-29)

## To do now

### Help chatbot - verify and iterate
- [x] Replace keyword-matching with OpenRouter tool calling (2026-05-04)
- [x] 11 tools: listCategories, getChecks, getCheckGuide, searchChecks, listSites, getSiteByName, getCurrentSiteStatus, getCheckResult, getScanHistory, getComplianceOverview, getReferencePage
- [x] Multi-turn loop (up to 8 rounds), SSE streaming, thinking indicator
- [x] All content dynamic (reads from DB, checklist/guide data, markdown docs, shared MCP data)
- [x] No hardcoded answers - system prompt is behavior rules only
- [ ] User deploying and testing (2026-05-05) - may need prompt tuning based on results
- [ ] Verify model reliably calls tools instead of answering from memory (Gemini Flash)

### Scanner accuracy testing
- [ ] Test scanner against known-compliant and known-non-compliant sites
- [ ] Verify Cookiebot cc.js parser against sites with known Cookiebot setups
- [ ] Check for false positives/negatives across all 26 automated checks

## Blocked

### GTM API checks (7 checks) - needs colleague access
- [ ] Confirm colleague GTM account access and get API credentials
- [ ] Set up GTM MCP server (paolobietolini/gtm-mcp-server)
- [ ] A3, A4, A5, B2, B3, B4

### MCP server setup
- [ ] Webflow MCP (official: webflow/mcp-server) - enables site import with URLs + fix automation
- [ ] GTM MCP (paolobietolini/gtm-mcp-server) - enables 7 GTM checks + fixes

### Site import (after Webflow MCP)
- [ ] Import 72 Webflow sites (name + webflowId + URL from Webflow API)
- [ ] Add delete button to Sites list page with confirmation dialog

### Infrastructure
- [ ] Get company Coolify/Hetzner back online (unreachable since 2026-04-25)
- [ ] Move both apps (GDPR + JSON-LD) to company server
- [ ] Set repo back to private after company deploy key configured

## Manual checks (8 - need real browser)
These stay as manual with step-by-step instructions in the guide drawer:
- G4: Declining actually blocks scripts (DevTools network check)
- G5: Consent remembered on return visit
- H6: Cookie tab check (before/after consent)
- H8: Non-cookie tracking checked (localStorage, sessionStorage, fingerprinting)
- K1/K2/K3: Geo-targeted banner behavior (need VPN/proxy)
- K4: GPC browser signal honored (need GPC extension)

## To do later: Fix automation (phase 2)
UI and code are done (12 fixes, "Fix this" button with tooltips). Blocked on API tokens:
- [ ] Get Webflow API token and add to Coolify (WEBFLOW_API_TOKEN)
- [ ] Get GTM API token and add to Coolify (GTM_API_TOKEN)

### Webflow fixes (via REST API, needs WEBFLOW_API_TOKEN)
- Remove hardcoded scripts (A1, A2), ghost scripts (D1), orphaned pixels (D3)
- Inject GTM snippet (B1), replace YouTube embeds (E1), add privacy link (I4)

### GTM fixes (via REST API, needs GTM_API_TOKEN)
- Cookiebot trigger fix (A3), template fix (A4), AutoBlock fix (A5)
- Non-Google tag consent (B3) and trigger fix (B4)

## To do later: Scheduled monitoring & auto-remediation

### Scheduled scans (cron)
- [ ] API route that runs all automated checks for every site in the DB
- [ ] Cron trigger (Coolify cron or external pinger) on a configurable schedule
- [ ] Compare results against previous scan run, flag new failures
- [ ] Store scan history over time for trend tracking

### Auto-fix on new issues
- [ ] When a scheduled scan detects a new failure, auto-run the matching "Fix this" action (for checks that have one)
- [ ] Log auto-fix attempts and results
- [ ] Requires Webflow/GTM API tokens to be configured first

### Manual check reminders
- [ ] Track "last reviewed" timestamp per manual check per site
- [ ] Email reminder when a manual check hasn't been reviewed in X months (configurable threshold)
- [ ] Email via Resend or similar service

### Regulation monitoring
- [ ] Scheduled AI agent that fetches updates from known sources (IMY, EDPB, EU DPA feeds, CJEU rulings)
- [ ] Compare new guidance against current 69 checks
- [ ] Flag "new guidance found that may affect checks X, Y, Z" for human review
- [ ] Does not auto-update checks - surfaces findings for manual decision

### Browser-based check automation (future)
- [ ] Investigate browser-use or Playwright for automating some manual checks (e.g. G4: declining blocks scripts)
- [ ] K1-K4 (geo-targeting, GPC) are hard to automate reliably - park for later

## To do later: Client reporting & data visualization
- [ ] Visual compliance dashboard per site (pass/fail/warning breakdown, category scores)
- [ ] Compliance trend charts over time (using scheduled scan history)
- [ ] Client-facing report with visual summaries (charts, risk heatmaps, progress indicators)
- [ ] Exportable PDF or shareable link for client presentations
- [ ] Portfolio-level overview (all client sites at a glance, worst offenders, overall compliance %)

## Done (2026-05-04)
- [x] AI/LLM settings: model selectors with live OpenRouter pricing, API key management, credit display
- [x] OpenRouter credit balance in top navbar (color-coded: green/amber/red)
- [x] Settings page redesign with accordion sections (Database, Error log, AI/LLM, Language)
- [x] Sites page: status dots, search, platform/status filters, sortable columns
- [x] Checklist filter bar (Not checked, OK, Issues, N/A, Has comments)
- [x] Checklist legend ("How this page works") explaining all UI elements
- [x] Scan history with delete buttons (individual + clear all)
- [x] Report: renamed button to "New report", version toggle, delete saved versions
- [x] Report: editable sections (summary/conclusion) always visible with dashed border + Edit button
- [x] Report: findings section shows check description instead of notes (notes only in appendix)
- [x] Report versioning: detects any check-level change, not just aggregate counts
- [x] Notes placeholder clarifies content goes in report appendix
- [x] Demo mode: prominent red banner explaining what works and what doesn't save
- [x] Favicon: scales of justice in dark navy circle
- [x] Fix: React state updater side effect causing spurious save errors
- [x] Fix: status changes back to "Not checked" now persist to DB

## To do later: Settings - Language (i18n)
- [ ] Add next-intl for Swedish/English switching
- [ ] Translate UI labels, button text, navigation
- [ ] Translate check descriptions and remediation steps (69 checks)
- [ ] Translate report output
- [ ] Language selector in Settings, persisted per user/session

## To do later: Chatbot enhancements
- [ ] Settings page: model selector dropdown (update token/cost counter to match selected model's pricing)
- [ ] Email alerts on errors (Resend) - send to configured admin email

## To do later: Platform extensions
- [ ] Extend checklist for HubSpot (consent is dashboard-only)
- [ ] Extend checklist for Next.js apps
- [ ] Research CMP alternatives to Cookiebot

## To do later: Templates
- [ ] Agency DPA template
- [ ] DSAR handling procedure template
- [ ] Data breach response plan template
- [ ] Refine incident report template (based on boss's anonymized client report)

## Out of scope (not website audit)
These GDPR areas belong to separate audits:
- Email marketing compliance (unsubscribe links, opt-in flows) - email platform audit
- Backend data retention/cleanup automation - infrastructure audit
- Deletion request processing (DSAR automation) - backend/DSAR tooling
- Data pipeline opt-out propagation (scraper suppression) - data pipeline audit
- Internal data processing (HR, CCTV, access logs) - organizational GDPR program

## Automation coverage summary

| Type | Checks | Count |
|------|--------|-------|
| Page scan (cheerio) | A1, A2, B1, B5, D1, D3, E1-E5, F1, F3, F5, G1, G8, I3, I4 | 18 |
| AI agent (OpenRouter) | D2, E6, F2, F4, F6, G2, G6, G7, I1, I8 | 9 |
| Cookiebot (cc.js) | C1-C6, G3 | 7 |
| GTM API (blocked) | A3, A4, A5, B2, B3, B4 | 6 |
| Manual (browser) | G4, G5, H6, H8, K1-K4 | 8 |
| Manual (other) | G9, H1-H5, H7, I2, I4-I7, J1-J9 | 21 |
| **Total** | | **69** |

## API research findings (2026-04-25)

| Service | API quality | MCP server | Key limitation |
|---------|------------|------------|----------------|
| Webflow | Full REST API | Official (webflow/mcp-server) | Registered scripts only |
| GTM | Full API v2 | paolobietolini/gtm-mcp-server | No consent overview endpoint |
| Cookiebot | cc.js public endpoint | None needed | Dashboard-only for admin/scans |
| HubSpot | CRM only | Not useful for GDPR | Cookie consent is dashboard-only |
