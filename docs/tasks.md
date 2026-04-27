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
- [x] Build page scanner (15 checks) with cheerio HTML parsing and server actions
- [x] Build AI agent checks (7 checks) via OpenRouter + Gemini Flash
- [x] Add scan UI: URL input, "Scan site" button, "AI Analyze" button, scan results drawer
- [x] Add individual "Run check" button for AI-type checks
- [x] Build CRUD server actions: sites (create, edit, delete, bulk import) + audits (create, save results)
- [x] Add site dialog (name, URL, platform, Cookiebot ID, GTM ID)
- [x] Edit site dialog with inline delete confirmation
- [x] Site audit page with auto-save to DB (500ms debounce)
- [x] Graceful fallback to demo mode when DB unavailable
- [x] Extend Prisma schema with ScanRun model and site fields (cookiebotId, gtmId)
- [x] Update tasks.md with automation roadmap and API research findings
- [x] Wire sidebar to show sites from DB

## To do now

### Automation: Browser tests (8 checks)
Playwright-based tests that need a real browser.
- [ ] B5: Verify Google Consent Mode V2 (check dataLayer for all 4 consent params)
- [ ] G1: Consent banner appears on first visit
- [ ] G3: Granular category controls available
- [ ] G4: Declining actually blocks scripts (DevTools network check)
- [ ] G5: Consent remembered on return visit
- [ ] H6: Cookie tab check (before/after consent)
- [ ] K1/K2/K3: Geo-targeted banner behavior (EU/US/UK)

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
- [x] Deploy to personal Coolify/Hetzner (temporary, until company server is back)
- [x] Create PostgreSQL database on Coolify
- [x] Set up Docker + Coolify deployment (Dockerfile, entrypoint.sh with prisma db push)
- [ ] Get company Coolify/Hetzner back online (server unreachable as of 2026-04-25, Cloudflare 522)
- [ ] Move both apps (GDPR + JSON-LD) to company server once available
- [ ] Set repo back to private after company deploy key or GitHub App is configured
- [ ] Import 72 Webflow sites from filtered list into app (use bulkCreateSites action)
- [ ] Set up Webflow MCP server (official: webflow/mcp-server, supports custom code read/write)

### Manual/Google Drive
- [ ] Apply formatting to Google Sheet v2 (fonts, colors, column widths, data validation dropdowns)
- [ ] Apply formatting to Google Docs (fonts, heading sizes)
- [ ] Delete old files from Google Drive: v1 Google Sheet + old Project Overview
- [ ] Add links between Google Docs and Google Sheet

## To do soon: Fix automation (phase 2)
When an audit check finds an issue, offer automated fixes where possible.
UI: "Fix this" button appears on checks with status "issue" that have an auto-fix available.

### Webflow fixes (via Webflow API/MCP)
- [ ] Set up Webflow MCP server for the project (official: webflow/mcp-server)
- [ ] Remove hardcoded scripts from site header (A1 fix)
- [ ] Remove hardcoded scripts from site footer/body (A2 fix)
- [ ] Remove ghost scripts from discontinued services (D1 fix)
- [ ] Remove orphaned pixels from header (D3 fix)
- [ ] Inject GTM snippet into site header (B1 fix - adds GTM where missing)
- [ ] Replace YouTube embeds with youtube-nocookie.com (E1 fix)
- [ ] Add privacy policy link to footer (I4 fix - if missing)

### GTM fixes (via GTM API/MCP)
- [ ] Set up GTM MCP server for the project (paolobietolini/gtm-mcp-server)
- [ ] Update Cookiebot CMP tag trigger to Consent Initialization (A3 fix)
- [ ] Switch Custom HTML to official Cookiebot template (A4 fix)
- [ ] Disable AutoBlock in Cookiebot CMP tag (A5 fix)
- [ ] Set consent settings on non-Google tags (B3 fix)
- [ ] Fix non-Google tag triggers to use cookie_consent_update (B4 fix)

### Manual fix guides (not auto-fixable)
These need clear step-by-step instructions in the guide drawer (already have them).
- Cookiebot configuration (cookie categories, scan settings) - dashboard only
- HubSpot consent banner setup - dashboard only
- Google Fonts self-hosting - needs build/deploy process changes
- Privacy policy content - legal writing
- DPA agreements - legal docs
- Data breach response plans - process docs

## Layer 1: Trust the audit (CRITICAL - do first)

The audit guarantees compliance to clients. If checks are wrong, incomplete, or poorly implemented,
clients could get fined. This layer ensures every check is legally grounded and produces correct results.

### 1.1 Legal references for all 69 checks
- [x] Deep research: map each check to its exact legal basis
  - EU: GDPR articles, ePrivacy Directive articles, EDPB guidelines
  - US: CCPA/CPRA, 20+ state privacy laws, COPPA, CAN-SPAM, DPF
  - UK: UK GDPR + PECR + DUAA 2025 (in force Feb 2026)
- [x] Add `legalBasis` field to Check interface
- [x] Add `references` array with URLs to official regulation text (EUR-Lex, EDPB, ICO, GDPRhub)
- [x] Show legal references in guide drawer (per check)
- [x] Show legal references in expanded check item info
- [x] Updated K2 description (added GPC signal requirement)
- [x] Updated K3 description (corrected: analytics exempt only if 4 conditions met, not blanket exemption)
- [x] Updated C2/C4 descriptions (added UK DUAA exemption note)
- [x] Cross-check: 13 missing checks added (C6, G8, G9, H7, H8, I6, I7, I8, J6, J7, J8, J9, K4)
- [x] Cross-check: 4 existing checks corrected (K2, K3, C2, C4)
- [x] IMY (Swedish DPA) guidance and enforcement decisions:
  - Added `imyNote` and `imyReferences` fields to Check interface
  - 19 checks now have Sweden-specific IMY annotations with verified decision references
  - Key IMY decisions referenced: Apoteket/Apohem (SEK 45M, Meta Pixel), Tele2/CDON (SEK 12.3M, Google Analytics), Klarna (SEK 7.5M, transparency), Spotify (SEK 58M, right of access), Aller Media/ATG/Warner Music (cookie banners), Equality Ombudsman (web form security), Sportadmin (breach)
  - Added new check F6 (personnummer collection) - Sweden-specific dataskyddslagen requirement
  - Swedish children's consent age (13) noted on relevant checks
  - IMY notes visible in check-item expanded view (blue Landmark icon) and guide drawer
  - Total checks now 69 (was 68)

### 1.2 Verify check implementations are correct
- [x] Review all 15 scanner checks - 2 issues fixed:
  - E3: added Google Maps JavaScript API detection (was only checking iframes)
  - I4: improved footer detection (added role="contentinfo", .footer, #footer selectors)
- [x] Review all 9 AI agent checks (was 7, added I8 + F6) - 3 issues fixed:
  - I8: implemented missing handler for privacy info accessibility check
  - G2/G7: added CSS limitation notes to prompts (HTML-only can't see styling)
  - F2: fixed overly aggressive phone+email data minimization prompt
- [x] Review AI agent system prompts against legal references - added CJEU Planet49, EDPB references to G7
- [x] Review guide drawer instructions for all 69 checks - verified correct and complete
- [x] Scanner accuracy review and fixes:
  - Added isFrameworkScript() to exclude Next.js, Webflow, Squarespace, Shopify framework scripts from A1/A2 (reduces false positives)
  - Expanded Swedish privacy term patterns in F3, I3, I4, AI agent (sekretesspolicy, privatlivspolicy, kakpolicy)
  - Fixed J3 automation type from page-scan to human (had no scanner implementation, misleading Auto badge)
  - Verified all 15 page-scan checks match scanner implementations
  - Verified all 9 ai-agent checks match AI handler implementations
- [ ] Test scanner against known-compliant and known-non-compliant sites to verify accuracy

### 1.3 Remediation steps ("how to fix")
- [x] Add RemediationInfo/RemediationStep types in src/lib/remediation.ts
- [x] Write fix instructions for all 22 automated checks that can produce "issue" status
- [x] Show "How to fix" section in scan results drawer (numbered steps, wrench icon)
- [x] Platform-specific badges (Webflow, HubSpot, Next.js) on relevant steps
- [x] Doc links to official platform documentation (Cookiebot, GTM, Fontsource, etc.)
- [x] "needs dev/legal" flag on steps requiring developer or legal review

## Layer 2: Make missing info visible

Checks that need account credentials (Cookiebot ID, GTM container ID, platform logins) must clearly
communicate what's needed. No silent failures or misleading "All clear" results.

### 2.1 Required fields and validation
- [x] Identify which checks need which site fields (Cookiebot ID, GTM ID, platform credentials)
  - CHECK_REQUIREMENTS mapping in src/lib/glossary.ts - 17 checks mapped to required fields
- [x] Add tooltips on checks that need specific account info (explain what's needed and where to find it)
  - Amber AlertTriangle warnings on each check item showing missing field requirements
- [x] Add educational tooltips for non-obvious terms so users unfamiliar with GDPR can do audits:
  - 13 terms: GCM, CMP, GTM, DPA, DSAR, ePrivacy, AutoBlock, ConsentInit, DPF, SCC, IMY, ROPA, DPIA
  - GlossaryText component auto-detects jargon in check descriptions and guide text
  - GlossaryTip tooltip shows term name and definition on hover (dotted underline)
- [x] Show validation errors when required fields are missing on a site (not just silently skip checks)
  - Site header shows missing fields with count of blocked checks
  - Check items show individual warnings per missing requirement
- [x] Prevent running checks that can't succeed without required data (disable with explanation)
  - Run button disabled when required fields are missing, with tooltip showing what's needed

### 2.2 Site detail page header
- [x] Show all site metadata prominently in the audit detail page:
  - Site name, URL, platform
  - Cookiebot ID (with link to Cookiebot admin if set)
  - GTM container ID (with link to GTM if set)
  - Webflow site ID, HubSpot portal ID, GitHub repo URL (fields exist in model)
- [x] Add edit button to quickly update site details from the audit page
  - "Edit site details" link in header
- [x] Show which checks are blocked by missing fields (e.g. "3 checks need Cookiebot ID")
  - Missing field warnings with exact count of blocked checks, click to edit

### 2.3 Platform deep links and setup tips
- [x] For each platform (Webflow, HubSpot, Next.js), add direct links to relevant dashboards
  - Deep links to Cookiebot admin and GTM container when IDs are set
  - Webflow ID shown in header when available
- [x] Add setup guidance for MCP servers per platform (docs/mcp-setup.md):
  - Webflow MCP (official: webflow/mcp-server) - read/write header custom code, list pages
  - GTM MCP (paolobietolini + stape-io) - read/write tags, triggers, consent settings
  - HubSpot MCP (official, GA) - CRM only, cookie consent is dashboard-only
  - Cookiebot - no MCP, cc.js public endpoint + stats API only
- [x] Document per-platform capabilities (included in docs/mcp-setup.md):
  - Webflow: can read/inject header custom code via API, can read page list
  - GTM: can read/write tags, triggers, consent settings via API
  - Cookiebot: can read cc.js (cookie categories) via public endpoint, dashboard-only for admin
  - HubSpot: CRM API only, cookie consent banner is dashboard-only
  - Next.js: code-based, needs repo access (GitHub)
- [ ] Consider adding platform-specific fields to Site model (hubspotPortalId, githubRepoUrl) - not blocking until HubSpot/Next.js audit checks are added

### 2.4 Error handling and logging
- [x] In-app error log panel (sidebar drawer with timestamped errors, clickable for details, dismissable)
  - ErrorLogProvider context with ErrorLogDrawer component
  - Error count button in progress bar opens the drawer
  - Clear all and dismiss individual errors
- [x] Capture scan failures, AI check errors, DB read/write issues into error log
  - Page scan failures and crashed logged as "scan" source
  - AI check failures and crashes logged as "ai" source
  - Save failures logged as "save" source
- [x] Graceful error messages in UI when scans/AI checks fail (instead of silent "All clear")
  - Failed AI checks now show as "na" with error detail instead of being silently dropped
  - URL validation with inline error message before scan
  - Separate "X failed" badge in scan summary bar
  - "All clear" only shows when zero issues AND zero failures
- [x] OpenRouter credit/balance check (API endpoint exists) - show warning banner when credits low
  - checkOpenRouterCredits server action calls /api/v1/auth/key
  - Checked before AI Analyze and individual AI check runs
  - Warning shown when credits below $1, blocked when unavailable

## Layer 3: UX and usability

### 3.1 Help system
- [ ] Add help icon (?) next to sun/moon toggle in top right
- [ ] Quick start guide: what the app does, how to add a site, how to run an audit, what the statuses mean
- [ ] Explain automation types (Auto, Browser, AI, GTM API, Cookiebot, Manual) and what each needs
- [ ] Link to reference docs (Technical Guide, Audit Protocol, Cheat Sheet) from help

### 3.2 Sidebar improvements
- [ ] Fix sidebar alignment (Sites parent item and sub-items background not aligned)
- [ ] Group sites by platform (Webflow, HubSpot, Next.js) with platform headers
- [ ] Sort sites alphabetically within each platform group
- [ ] Add status dots next to site names (green = audit complete, orange = partial, grey = not started)
- [ ] Add legend/explanation for the status dots
- [ ] Add tech stack summary section at bottom of sidebar (like json-ld app)

### 3.3 Filtering and navigation
- [ ] Make issue count badge clickable to filter checklist to issues only (across all categories)

### 3.4 Data quality and validation
- [ ] Centralize URL normalization (shared utility used by scanner, AI agent, scan action, site creation)
- [ ] Validate URL format on site creation and before scanning (reject obviously invalid URLs)
- [ ] Add deduplication check on site import (match by URL or name, warn before creating duplicates)
- [ ] Add auditorName field to Audit model (optional, tracks who performed the audit)
- [ ] Ensure bad/fake URLs don't produce misleading data in DB

### 3.5 Scan history and re-running checks
- [ ] Design approach: scan history, individual re-runs, and overwrite protection
- [ ] Keep scan run snapshots (ScanRun model already exists) for comparing progress over time
- [ ] Allow re-running individual scanner checks (not just AI checks)
- [ ] Consider lock/confirm flow so manual review isn't overwritten by re-scans

### 3.6 Report generation
- [ ] Generate audit report per site (PDF or HTML download)
- [ ] Include: site info, all check results with status/notes, scan findings, overall score/summary
- [ ] Follow Stormfors branding/design system (once available)

### 3.7 Testing
- [ ] Run Playwright E2E tests on all pages (console errors, navigation, responsive)
- [ ] Test scan + AI analyze edge cases (invalid URLs, timeouts, sites that block scrapers, empty pages)
- [ ] Test CRUD flows (add/edit/delete sites, audit state persistence across sessions)
- [ ] Test auto-save reliability (rapid toggling, network interruptions)

### 3.8 Notifications (later)
- [ ] Email alerts for critical failures (via Resend or similar)

## To do later
- [ ] Extend checklist and protocols for HubSpot (consent is dashboard-only, manual checks)
- [ ] Extend checklist and protocols for Next.js apps
- [ ] Research open source CMP alternatives to Cookiebot (cost comparison, GTM integration)
- [ ] GDPR audit report template: HTML/CSS based on Stormfors branding/design system
- [ ] Agency DPA template (standard DPA between Stormfors and each client)
- [ ] DSAR handling procedure template
- [ ] Data breach response plan template
- [ ] Add incident report template (based on anonymized client report from boss)

## API research findings (2026-04-25)

| Service | API quality | MCP server | Key limitation |
|---------|------------|------------|----------------|
| Webflow | Full REST API for custom code (site + page level) | Official (webflow/mcp-server) | Registered scripts only, not raw head code fields |
| GTM | Full API v2 for tags, triggers, consent settings | paolobietolini/gtm-mcp-server (74 stars) | No "consent overview" endpoint - must aggregate per-tag |
| Cookiebot | cc.js endpoint only (cookie categories) | None exists | No scan trigger, no admin API, dashboard-only for most |
| HubSpot | CRM API good, consent/tracking limited | baryhuang/mcp-hubspot (CRM only) | Cookie consent banner is dashboard-only |
