# GDPR Audit Cheat Sheet

For experienced auditors who know the setup. No explanations - just the checks.

**Open before starting:** Incognito browser, DevTools (F12), GTM Preview Mode, Cookiebot admin

---

## 1. Scripts (5 min)

- [ ] A1 - Only GTM snippet in site header
- [ ] A2 - No scripts in footer
- [ ] A3 - Cookiebot CMP trigger: "Consent Initialization - All Pages"
- [ ] A4 - Official Cookiebot GTM template (not Custom HTML)
- [ ] A5 - AutoBlock OFF
- [ ] B1 - No scripts outside GTM (check page-level custom code too)
- [ ] D1 - No ghost scripts (HotJar, Leadfeeder, old tools)
- [ ] D2 - No old campaign scripts
- [ ] D3 - No orphaned pixels in header/footer

## 2. GTM (5 min)

- [ ] B2 - Google tags: "No additional consent required"
- [ ] B3 - Non-Google tags: "Require additional consent" + correct type (ad_storage / analytics_storage)
- [ ] B4 - Non-Google triggers: `cookie_consent_update` event, not "All Pages"
- [ ] B5 - Consent Mode V2 enabled (all 4 params: ad_storage, analytics_storage, ad_user_data, ad_personalization)

## 3. Cookies (5 min)

- [ ] C1 - Necessary: CDN, session, security - no consent
- [ ] C2 - Statistics: GA, HotJar - under consent
- [ ] C3 - Marketing: Meta, LinkedIn, Ads - under consent
- [ ] C4 - Preferences: language, UI - under consent if applicable
- [ ] C5 - No unclassified cookies in Cookiebot admin

## 4. Third-party (10 min)

- [ ] E1 - YouTube: youtube-nocookie.com. Vimeo: consent-gated
- [ ] E2 - Google Fonts: no fonts.googleapis.com / fonts.gstatic.com in Network tab
- [ ] E3 - Maps: consent-gated or static image
- [ ] E4 - Chat widgets: checked for cookies
- [ ] E5 - Social embeds: checked for data transmission
- [ ] E6 - CRM: DPA in place, DPF-certified if US

## 5. Forms (5 min)

- [ ] F1 - All forms listed
- [ ] F2 - Data minimization (only needed fields)
- [ ] F3 - Privacy policy linked at/near form
- [ ] F4 - Separate consent per purpose, no pre-ticking
- [ ] F5 - HTTPS on form POST

## 6. Banner (5 min)

- [ ] G1 - Appears on first visit
- [ ] G2 - Accept/Reject equal prominence
- [ ] G3 - Granular category controls
- [ ] G4 - Decline actually blocks (verify in step 7)
- [ ] G5 - Consent remembered on return
- [ ] G6 - Correct language(s)
- [ ] G7 - No dark patterns (pre-ticked, cookie wall, guilt language, hidden reject)

## 7. Live test in GTM Preview Mode (10 min)

- [ ] H3 - Decline all: Consent tab = Denied, non-Google tags Not Fired
- [ ] H4 - Accept all: Consent tab = Granted, all tags fire
- [ ] H5 - Accept Statistics only: Marketing tags don't fire
- [ ] H6 - Cookies: before consent = only CookieConsent. After decline = no _ga/_fbp/_gcl_au
- [ ] Network: GA4 `collect` requests: gcs=G100 (denied) / G111 (granted). gcd contains `r` not `l`

## 8. Scans

- [ ] H1 - Cookiebot compliance scan (run if >30 days old)
- [ ] H2 - Cookiebot GCM Check

## 9. Docs (5 min)

- [ ] I1 - Privacy policy: controller ID, purposes, legal basis, rights, transfers, retention
- [ ] I2 - Privacy policy in all site languages
- [ ] I3 - Cookie policy: separate page, declaration script installed
- [ ] I4 - Privacy policy linked from every page (footer)
- [ ] I5 - Script inventory documented

## 10. Legal (ask client)

- [ ] J1 - DPAs for all processors
- [ ] J2 - Vendor inventory maintained
- [ ] J3 - US services DPF-certified (check dataprivacyframework.gov)
- [ ] J4 - DSAR process exists (30-day response)
- [ ] J5 - Breach response plan exists (72-hour notification)

## 11. Geo-targeting (if international)

- [ ] K1 - EU/EEA: full opt-in
- [ ] K2 - US: opt-out, "Do Not Sell/Share" if CCPA applies
- [ ] K3 - UK: marketing consent required, analytics OK without (post-DUAA Feb 2026)

---

**Est. total: 45-60 min** (vs 2-4 hours with full protocol)

**After:** Update spreadsheet. If issues found: fix, re-run steps 6-7, update sheet. If clean: mark Compliant.
