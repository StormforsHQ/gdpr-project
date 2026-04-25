# GDPR Compliance Deployment Protocol

Compliance checks that must be completed before any site goes live or any update is deployed. This is a gate - no site ships without passing these checks.

**Applies to:** new site launches, site redesigns, and updates that add/change scripts, forms, integrations, or consent configuration.

---

## When to use this protocol

| Scenario | Required checks |
|----------|----------------|
| New site launch | All checks (full audit protocol first, then this gate) |
| Adding a new tracking script | Scripts, GTM, Consent banner, Live testing |
| Adding a new form | Forms |
| Adding a video/map/chat embed | Third-party services, Consent banner, Live testing |
| Changing Cookiebot or GTM config | GTM, Cookie categories, Consent banner, Live testing |
| Site redesign | All checks |
| Adding a new third-party integration | Third-party services, Data processing, Live testing |
| Content-only update (text, images) | Not required (unless new embeds added) |

---

## Pre-deployment checklist

### 1. Scripts and GTM

- [ ] Only the GTM container snippet is in the site header
- [ ] No tracking/marketing scripts hardcoded in footer or page-level custom code
- [ ] Any new scripts are added INSIDE GTM, not hardcoded
- [ ] New non-Google tags have "Require additional consent" set in Consent Overview
- [ ] New non-Google tags use the `cookie_consent_update` trigger (not "All Pages")
- [ ] New Google tags are set to "No additional consent required" in Consent Overview
- [ ] Cookiebot CMP tag is on "Consent Initialization - All Pages" trigger (unchanged)
- [ ] Google Consent Mode V2 is still enabled (unchanged)
- [ ] AutoBlock is still OFF (unchanged)

### 2. Third-party services

- [ ] New video embeds use youtube-nocookie.com (YouTube) or are consent-gated
- [ ] No Google Fonts loaded from CDN (check DevTools Network tab for fonts.googleapis.com)
- [ ] New map embeds are consent-gated or use static images
- [ ] New chat widgets are checked for non-essential cookies
- [ ] New social embeds are checked for data transmission
- [ ] DPA in place for any new third-party service that processes personal data
- [ ] US-based services verified as DPF-certified (dataprivacyframework.gov)

### 3. Forms

- [ ] New forms only collect data needed for stated purpose (data minimization)
- [ ] Privacy policy linked at or near new forms
- [ ] Separate consent checkboxes if form serves multiple purposes
- [ ] No pre-ticked consent boxes
- [ ] Form submissions go over HTTPS

### 4. Consent banner

- [ ] Banner still appears on first visit after changes
- [ ] Accept and Reject still equally prominent
- [ ] Granular category controls still available
- [ ] Banner language still matches site content

### 5. Live testing (mandatory)

These checks must be performed in GTM Preview Mode on the staging/preview URL before publishing.

- [ ] **Decline test:** Load site, decline all. No non-essential tags fire. DevTools shows no tracking cookies.
- [ ] **Accept test:** Fresh session, accept all. All tags fire. Consent tab shows Granted.
- [ ] **Selective test:** Fresh session, accept Statistics only. Marketing tags do NOT fire.
- [ ] **Cookie check:** Before consent, only CookieConsent cookie exists. After decline, no _ga/_fbp/_gcl_au.

### 6. Documentation

- [ ] Privacy policy updated if new data processing purposes were added
- [ ] Cookie policy page reflects any new cookies (Cookiebot scan will update the declaration, but verify)
- [ ] Script inventory updated with new scripts and their purposes
- [ ] Vendor inventory updated if new third-party services were added

---

## Deployment approval

**All checks must pass before publishing/deploying.** If any check fails:

1. Fix the issue
2. Re-run the live testing checks (section 5)
3. Update the audit spreadsheet

**Sign-off format** (add to the spreadsheet or project channel):

```
Site: [URL]
Change: [brief description of what was updated]
Checks: All passed
Tested by: [name]
Date: [date]
```

---

## Common deployment mistakes to avoid

1. **Adding a script to Webflow custom code "just for testing"** - it stays there and fires without consent
2. **Copy-pasting GTM config from another container** - triggers and consent settings don't transfer
3. **Updating Cookiebot settings without re-testing** - changes can break consent flow
4. **Adding a form without privacy policy link** - GDPR Art. 13 requires informing users at point of collection
5. **Embedding YouTube with default URL** - use youtube-nocookie.com instead
6. **Adding Google Fonts via @import or link tag** - self-host instead (EUR 100/violation risk)
7. **Not testing after deployment** - always verify in GTM Preview Mode on the live URL after publishing
