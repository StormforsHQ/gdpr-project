# GDPR Compliance Audit Protocol

Step-by-step guide for running a compliance audit on any client site. Designed so anyone on the team can follow it without prior GDPR expertise.

**Time estimate:** 2-4 hours per site (depending on complexity)
**Checklist reference:** GDPR Compliance Audit App (all checks tracked in the app database)

### How this relates to the Technical Configuration Guide

The **Technical Configuration Guide** explains how to correctly set up Cookiebot, GTM, and consent management from scratch. It is the "how to build it right" document - aimed at the developer or implementer who is configuring a site's compliance infrastructure.

This **Audit Protocol** is the "how to verify it was done right" document - aimed at anyone reviewing an existing site to check whether the technical setup is correct and complete. If a site was set up following the Technical Guide, it should pass this audit. In practice, most existing client sites were not set up with the guide, which is why the audit exists.

In short: the Technical Guide is the prerequisite for compliance. The Audit Protocol is the verification that compliance was achieved.

---

## Before you start

### Access needed
- Webflow editor access (or equivalent CMS) for the site
- Google Tag Manager access for the site's GTM container
- Cookiebot admin access for the site's domain
- Google Analytics access (if site uses GA)
- Browser with DevTools (Chrome recommended)
- GTM Preview Mode / Tag Assistant (Chrome extension)

### Tools to have ready
- Cookiebot admin panel (admin.cookiebot.com)
- GTM Preview Mode (tagassistant.google.com)
- Chrome DevTools (F12)
- MeasureMinds Consent Mode Monitor (free Chrome extension - install beforehand)
- AesirX Privacy Scanner (privacyscanner.aesirx.io) or Crumble (if running batch scans)

### Setup
1. Add the site in the audit app (click "Add site", fill in name, URL, platform, Cookiebot ID, GTM ID)
2. Open the site's audit page in the app
3. Open the client site in an incognito/private window (no cached cookies)
4. Open DevTools (F12) and switch to the Network tab
5. Keep a second tab open for the Cookiebot admin panel

---

## Phase 1: Source code and script inventory

**Goal:** Identify every script on the site and confirm only GTM is hardcoded.

### Step 1.1 - Inspect site header
Open the site's CMS (Webflow Designer > Project Settings > Custom Code > Head Code).

- **A1:** Is the GTM container snippet the ONLY script in the header?
- **A4:** Is the Cookiebot CMP deployed via GTM (not hardcoded here)?

If Cookiebot is hardcoded in the header alongside GTM, flag as Issue. The correct setup is Cookiebot inside GTM only.

### Step 1.2 - Inspect site footer
Check CMS footer custom code section.

- **A2:** Are there any tracking or marketing scripts hardcoded here?

Everything should be managed through GTM. Any script here is an Issue unless it's non-tracking (e.g., accessibility widget that sets no cookies).

### Step 1.3 - Check for page-level scripts
In Webflow: check individual page settings for custom code (head and footer sections on specific pages).

- **B1:** Are there scripts on individual pages outside GTM?

Common finding: conversion tracking scripts added to thank-you pages directly instead of through GTM.

### Step 1.4 - Legacy script scan
Review all custom code sections for:

- **D1:** Ghost scripts from discontinued services (HotJar, Leadfeeder, Adline, old analytics)
- **D2:** Old campaign scripts (expired Salesforce campaigns, seasonal marketing)
- **D3:** Orphaned pixels (Meta/LinkedIn pixels placed directly instead of via GTM)

Ask the client before removing campaign scripts - they may want to reactivate them.

### Step 1.5 - Document script inventory
List every script found (in GTM and outside GTM). For each: name, purpose, where it's loaded from, consent category it belongs to.

- **I5:** Record this in the Notes column or a separate document.

---

## Phase 2: GTM configuration

**Goal:** Verify GTM is set up correctly for consent management.

### Step 2.1 - Open GTM container
Go to tagmanager.google.com, open the correct container for this site.

### Step 2.2 - Check Cookiebot CMP tag
Find the Cookiebot CMP tag in the Tags list.

- **A3:** Is its trigger set to "Consent Initialization - All Pages"? (NOT "All Pages" - this is the most common misconfiguration)
- **A4:** Is it using the official Cookiebot CMP template from the Template Gallery? (NOT Custom HTML)
- **A5:** Is AutoBlock turned OFF in the tag settings? (Must be OFF for Advanced Consent Mode)
- **B5:** Is the "Enable Google Consent Mode" checkbox checked? All 4 parameters should be active: ad_storage, analytics_storage, ad_user_data, ad_personalization.

### Step 2.3 - Check Consent Overview
Go to Admin > Container Settings > Additional Settings. Confirm "Enable consent overview" is checked.

Then open Tags and click "Consent Overview" (shield icon).

- **B2:** Google tags (GA4, Google Ads): Should show "No additional consent required" - they self-adapt.
- **B3:** Non-Google tags (Meta Pixel, LinkedIn Insight, HotJar, TikTok, etc.): Should show "Require additional consent" with the correct consent type:
  - Marketing tags: ad_storage
  - Analytics tags: analytics_storage

### Step 2.4 - Check non-Google tag triggers
Click into each non-Google tag and check its trigger.

- **B4:** Trigger must be the `cookie_consent_update` custom event (NOT "All Pages"). If this trigger doesn't exist yet, it needs to be created: Triggers > New > Custom Event > event name: `cookie_consent_update`.

Also check: tag firing set to "Once per page."

---

## Phase 3: Cookie categories

**Goal:** Verify all cookies are correctly categorized in Cookiebot.

### Step 3.1 - Open Cookiebot admin
Go to admin.cookiebot.com, select the correct domain.

### Step 3.2 - Review cookie categories
Check the cookie list (after the most recent scan).

- **C1:** Necessary cookies (CDN, session, security) - correctly categorized, no consent needed
- **C2:** Statistics cookies (GA, HotJar, etc.) - categorized under Statistics, consent required
- **C3:** Marketing cookies (Meta Pixel, LinkedIn, Google Ads) - categorized under Marketing, consent required
- **C4:** Preferences cookies (language, UI) - categorized under Preferences, if applicable
- **C5:** Are there any "Unclassified" cookies? All must be categorized.

### Step 3.3 - Run a fresh Cookiebot scan
If the last scan is more than 30 days old, start a new one. This can take up to 24 hours.

- **H1:** Document the scan result.

### Step 3.4 - Run GCM Check
In Cookiebot admin, select domain, click "Start GCM Check."

- **H2:** Document the result. This checks for incorrect consent states and trackers firing before consent.

---

## Phase 4: Third-party services

**Goal:** Identify all third-party services and verify compliance.

### Step 4.1 - Browse the entire site
Go through every page. Look for:

- **E1:** Video embeds (YouTube, Vimeo). YouTube must use youtube-nocookie.com. Vimeo may set cookies on load. Both should be blocked until consent or use click-to-load.
- **E2:** Google Fonts. Open DevTools > Network tab > filter by "fonts.googleapis.com" or "fonts.gstatic.com". If any requests appear, fonts are loaded from Google CDN. This is an Issue (EUR 100/violation precedent). Must self-host.
- **E3:** Maps (Google Maps, Mapbox). Should be blocked until consent or replaced with static image + link.
- **E4:** Chat widgets (Intercom, HubSpot, Tidio). Check if they set non-essential cookies before interaction.
- **E5:** Social embeds (Instagram feeds, Twitter feeds, share buttons, like buttons).

### Step 4.2 - Check CRM integration
- **E6:** If the site connects to HubSpot, Salesforce, or other CRM: note which one, check if DPA is in place, check DPF certification if US-based.

---

## Phase 5: Forms and data collection

**Goal:** Verify all forms handle personal data correctly.

### Step 5.1 - List all forms
Browse every page and list every form: contact, newsletter signup, login, registration, quote request, etc.

- **F1:** Record all forms found.

### Step 5.2 - Check each form
For each form:

- **F2:** Data minimization - is the form only collecting what's needed? A contact form asking for phone + address + company size when only email is needed is an Issue.
- **F3:** Is the privacy policy linked at or near the form?
- **F4:** If the form serves multiple purposes (e.g., "contact us" + "subscribe to newsletter"), are there separate consent checkboxes? No pre-ticking allowed.
- **F5:** Submit a test form and check DevTools Network tab - is the POST request going over HTTPS?

---

## Phase 6: Consent banner

**Goal:** Verify the cookie consent banner works correctly.

### Step 6.1 - First visit test
Open the site in a fresh incognito window.

- **G1:** Does the consent banner appear immediately on the first page?
- **G6:** Is the banner in the correct language(s) matching the site content?

### Step 6.2 - Visual inspection
Look at the banner carefully.

- **G2:** Are "Accept" and "Reject" (or equivalent) equally prominent? Same size, same visual weight, same number of clicks to reach.
- **G3:** Are granular category controls available? (User can accept/reject per category: Statistics, Marketing, Preferences)
- **G7:** Check for dark patterns:
  - Pre-ticked boxes?
  - Cookie wall blocking all site content?
  - Guilt/fear language ("You'll miss out...")?
  - Hidden reject button?
  - Accept more prominent than reject?

---

## Phase 7: Live testing with GTM Preview Mode

**Goal:** Verify consent actually controls script firing.

### Step 7.1 - Connect Tag Assistant
Open tagassistant.google.com, enter the site URL, click Connect. This opens the site with GTM Preview Mode overlay.

### Step 7.2 - Test: Decline all
Fresh incognito window with Tag Assistant connected.

- Load the site, do NOT interact with the banner yet
- In Tag Assistant: click the "Consent Initialization" event, check the Consent tab
- All consent types should show `Denied`
- Click Decline/Reject on the banner
- **H3:** Verify: Consent tab still shows Denied for all. Non-Google tags appear under "Tags Not Fired."

### Step 7.3 - Test: Accept all
Close the incognito window, open a new one with Tag Assistant.

- Load the site, click Accept All
- **H4:** Verify: Consent tab shows Granted for all. All tags fire.

### Step 7.4 - Test: Selective consent
Close and open a new incognito window with Tag Assistant.

- Load the site, open granular controls, accept only Statistics
- **H5:** Verify: Statistics tags fire. Marketing tags (Meta, LinkedIn) do NOT fire.

### Step 7.5 - Network-level verification
In DevTools Network tab, filter for `collect` (GA4 requests).

- Click on a GA4 request, check the Payload tab
- Look for `gcs` parameter:
  - `G100` = all denied (correct after decline)
  - `G111` = all granted (correct after accept all)
- Look for `gcd` parameter:
  - `r` = denied then granted (correct GDPR flow)
  - `l` = no consent signal detected (ERROR - something is misconfigured)

### Step 7.6 - Cookie verification
- **H6:** In DevTools > Application > Cookies:
  - Before any consent action: only `CookieConsent` cookie should exist
  - After declining: no `_ga`, `_gcl_au`, `_fbp`, or other tracking cookies
  - After accepting: tracking cookies appear

### Step 7.7 - Return visit test
Close incognito, open a new one, navigate to the site.

- **G5:** Does the consent banner NOT re-appear? (CookieConsent cookie should persist, consent remembered)

Wait - incognito windows clear cookies on close. For this test, use a regular window instead: accept cookies, close the tab, reopen the site. The banner should not re-appear.

---

## Phase 8: Privacy documentation

**Goal:** Verify all required legal documents exist and are complete.

### Step 8.1 - Privacy policy
Find the privacy policy page (usually linked in footer).

- **I1:** Check it contains ALL required elements (GDPR Art. 13/14):
  - Controller identity and contact details
  - DPO contact (if applicable)
  - Purposes and legal basis for each processing activity
  - Categories of personal data collected
  - Recipients/third parties
  - International transfer details and safeguards
  - Specific retention periods (not vague "as long as necessary")
  - All data subject rights listed (access, rectification, erasure, restriction, portability, objection)
  - Right to withdraw consent
  - Right to complain to supervisory authority (IMY for Swedish companies)
  - Automated decision-making info (if used)

- **I2:** Is the privacy policy available in every language the site content uses?
- **I4:** Is the privacy policy linked from every page? (Check footer)

### Step 8.2 - Cookie policy
- **I3:** Does a separate cookie policy page exist? It should list all cookies, their purpose, duration, and vendor. Check if the Cookiebot Cookie Declaration script is installed on this page.

---

## Phase 9: Data processing and legal (ask client)

**Goal:** Verify legal agreements and processes are in place. This phase requires information from the client.

### Step 9.1 - Data Processing Agreements
- **J1:** Ask the client: do you have DPAs in place with all processors? This includes: analytics (Google), CRM (HubSpot/Salesforce), email marketing, hosting provider, CDN (Cloudflare), payment processors, any SaaS tool that handles personal data.
- **J2:** Does the client maintain a vendor inventory? (List of all third parties, what data they process, DPA status)

### Step 9.2 - US vendor verification
- **J3:** For each US-based service: check dataprivacyframework.gov to confirm DPF certification. Major services (Google, Meta, Microsoft, HubSpot) are certified, but verify each one.

### Step 9.3 - Data rights and breach processes
- **J4:** Does the client have a DSAR handling procedure? Can they respond to access/deletion requests within 30 days?
- **J5:** Does the client have a data breach response plan? Can they notify the supervisory authority (IMY) within 72 hours?

If these don't exist, flag as Issue and note that templates should be provided (future deliverable).

---

## Phase 10: Geo-targeting (if applicable)

**Goal:** Verify correct consent behavior for visitors from different regions. Only applicable if the site has significant international traffic.

### Step 10.1 - Check Cookiebot geo-targeting settings
In Cookiebot admin, check if geo-targeting is configured.

- **K1:** EU/EEA visitors: full opt-in banner, all non-essential cookies blocked until consent
- **K2:** US visitors (especially California): opt-out model, "Do Not Sell/Share" link if CCPA applies
- **K3:** UK visitors: marketing consent required, but analytics can load without consent (since DUAA, Feb 2026)

If the site doesn't have geo-targeting configured and serves international visitors, note this as an improvement opportunity. For most sites, the EU opt-in standard applied globally is the safest default.

---

## After the audit

### If issues found
1. All issues are already tracked in the app (checks with "Issue" status + notes)
2. Fix what you can fix directly (script cleanup, GTM configuration, Cookiebot settings)
3. Create a list of client-dependent fixes (DPAs, privacy policy updates, form changes)
4. Send the client-dependent list to the client with clear instructions
5. After all fixes: re-run Phase 6 and Phase 7 (consent banner + live testing) to verify
6. Update check statuses to OK in the app for fixed items
7. When all checks pass: download the audit report from the app

### If compliant
1. Download the audit report from the app (Report button in site header)
2. Share the report with the client as proof of compliance
3. Note the date - schedule the next audit in 3 months or after any site changes

### Re-audit triggers
Run the audit again (at minimum the verification phases 6-7) whenever:
- New scripts, plugins, or integrations are added to the site
- The site is redesigned or significantly updated
- A new third-party service is connected
- Cookiebot or GTM configuration changes
- 3 months have passed since the last audit
- A regulatory change affects the site's compliance requirements

---

## Quick reference: phase-to-check mapping

| Phase | Checks covered | Est. time |
|-------|---------------|-----------|
| 1. Source code & scripts | A1, A2, A4, B1, D1-D3, I5 | 30 min |
| 2. GTM configuration | A3, A4, A5, B2-B5 | 30 min |
| 3. Cookie categories | C1-C5, H1, H2 | 20 min |
| 4. Third-party services | E1-E6 | 30 min |
| 5. Forms & data collection | F1-F5 | 20 min |
| 6. Consent banner | G1-G7 | 15 min |
| 7. Live testing (GTM Preview) | H3-H6, G4, G5 | 30 min |
| 8. Privacy documentation | I1-I4 | 20 min |
| 9. Data processing & legal | J1-J5 | 15 min (+ client) |
| 10. Geo-targeting | K1-K3 | 10 min |
