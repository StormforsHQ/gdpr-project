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

## To do now
- [ ] Build audit checklist UI (expandable categories, check items with status/notes)
- [ ] Import 72 Webflow sites from filtered list into app
- [ ] Get Coolify/Hetzner back online (server unreachable as of 2026-04-25, Cloudflare 522 timeout)
- [ ] Create PostgreSQL database on Coolify for audit data (plain Postgres + Prisma, same pattern as json-ld-generator)
- [ ] Set up Docker + Coolify deployment (Dockerfile, entrypoint.sh with prisma db push)
- [ ] Apply formatting to Google Sheet v2 (fonts, colors, column widths, data validation dropdowns) -- manual in Google Sheets
- [ ] Apply formatting to Google Docs (fonts, heading sizes) -- manual in Google Docs
- [ ] Delete old files from Google Drive: v1 Google Sheet + old Project Overview (both superseded by v2 versions)
- [ ] Add links between Google Docs and Google Sheet -- manual in Google Docs

## To do soon
- [ ] Test-run AesirX or Crumble scanner on one client site to validate checklist
- [ ] Research MCP server for Webflow header injection
- [ ] Research MCP server for Google Tag Manager

## To do later
- [ ] Research open source CMP alternatives to Cookiebot (cost comparison, GTM integration, feature parity)
- [ ] GDPR audit report template: HTML/CSS based on Stormfors branding/design system
- [ ] Extend checklist and protocols for HubSpot
- [ ] Extend checklist and protocols for Next.js apps
- [ ] Agency DPA template (standard DPA between Stormfors and each client)
- [ ] DSAR handling procedure template
- [ ] Data breach response plan template
