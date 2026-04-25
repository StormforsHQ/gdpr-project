# GDPR Audit Checklist - v2 (research-validated)

## Spreadsheet structure

**Rows:** One per client site
**Columns:** Site info + each check below
**Per check:** Status (OK / Issue / N/A), Action taken, Comment

---

## Site info columns

| Column | Description |
|--------|-------------|
| Client name | |
| Site URL | |
| Platform | Webflow / HubSpot / Next.js |
| Target regions | EU, UK, US, etc. |
| Auditor | Who performed the audit |
| Date audited | |
| Overall status | Compliant / Issues found / Pending |

---

## Checks

### A. Script setup (5 checks)
| # | Check | What to verify |
|---|-------|---------------|
| A1 | Only GTM script in site header | No other scripts hardcoded (Cookiebot deploys via GTM) |
| A2 | No scripts hardcoded in footer | Everything managed through GTM |
| A3 | Cookiebot CMP tag on correct trigger | Must be "Consent Initialization - All Pages" (NOT "All Pages") |
| A4 | Official Cookiebot GTM template used | Not Custom HTML (Custom HTML misses V2 consent fields) |
| A5 | AutoBlock is OFF | Breaks Advanced Consent Mode cookieless pings |

### B. GTM configuration (5 checks)
| # | Check | What to verify |
|---|-------|---------------|
| B1 | All tracking scripts inside GTM | Nothing running outside GTM except the GTM snippet itself |
| B2 | Google tags: consent overview set | "No additional consent required" (they self-adapt) |
| B3 | Non-Google tags: consent gated | "Require additional consent" + correct type (ad_storage/analytics_storage) |
| B4 | Non-Google tag triggers correct | Using `cookie_consent_update` event, not "All Pages" |
| B5 | Google Consent Mode V2 enabled | Checkbox in Cookiebot CMP template. All 4 parameters transmitting. |

### C. Cookie categories (5 checks)
| # | Check | What to verify |
|---|-------|---------------|
| C1 | Necessary cookies identified | CDN (Webflow, Cloudflare), session, security - no consent needed |
| C2 | Statistics cookies under consent | Google Analytics, HotJar, etc. - require opt-in |
| C3 | Marketing cookies under consent | LinkedIn Pixel, Meta Pixel, ad trackers - require opt-in |
| C4 | Preference cookies under consent | Language, UI customization - if applicable |
| C5 | No unclassified cookies | All cookies categorized in Cookiebot admin |

### D. Legacy/cleanup (3 checks)
| # | Check | What to verify |
|---|-------|---------------|
| D1 | No ghost scripts | Leftover scripts from discontinued services (HotJar, Leadfeeder, etc.) |
| D2 | No old campaign scripts | Old Salesforce/marketing campaigns. Ask client before removing. |
| D3 | No orphaned pixels | Pixels placed directly in header instead of GTM |

### E. Third-party services (6 checks)
| # | Check | What to verify |
|---|-------|---------------|
| E1 | Video embeds audited | YouTube (use youtube-nocookie.com), Vimeo - block until consent or click-to-load |
| E2 | Google Fonts self-hosted | NOT loaded from Google CDN (EUR 100/violation precedent). Use local files or Fontsource. |
| E3 | Maps blocked until consent | Google Maps, Mapbox, etc. Or use static image with link. |
| E4 | Chat widgets checked | If non-essential cookies: consent before loading |
| E5 | Social embeds checked | Social feeds, share buttons, etc. |
| E6 | CRM integrations reviewed | HubSpot, Salesforce - DPA in place, data transfer mechanism verified |

### F. Forms & data collection (5 checks)
| # | Check | What to verify |
|---|-------|---------------|
| F1 | All forms identified | List every form on the site |
| F2 | Data minimization | Only collecting what's needed for stated purpose |
| F3 | Privacy policy linked at/near form | User informed at point of collection |
| F4 | Separate consent per purpose | Inquiry vs marketing = separate checkboxes, no pre-ticking |
| F5 | Form submissions encrypted | SSL/TLS on form POST |

### G. Consent banner (7 checks)
| # | Check | What to verify |
|---|-------|---------------|
| G1 | Banner appears on first visit | Consent dialog visible and functional |
| G2 | Accept and Reject equally prominent | Same size, same visual weight, same number of clicks |
| G3 | Granular category controls available | User can accept/reject per category |
| G4 | Declining actually blocks scripts | Non-necessary scripts don't fire after decline (verify in DevTools) |
| G5 | Consent remembered on return | CookieConsent cookie persists, no re-prompt |
| G6 | Banner in correct language(s) | Matches site content language(s). Cookiebot multi-language configured. |
| G7 | No dark patterns | No pre-ticked boxes, no cookie walls, no guilt language, no hidden reject |

### H. Verification (6 checks)
| # | Check | What to verify |
|---|-------|---------------|
| H1 | Cookiebot compliance scan run | Run scanner, document result, no unclassified cookies |
| H2 | Cookiebot GCM Check run | Google Consent Mode Checker in Cookiebot admin |
| H3 | GTM Preview Mode test: decline all | Consent tab shows Denied, non-Google tags under "Not Fired" |
| H4 | GTM Preview Mode test: accept all | All tags fire, Consent tab shows Granted |
| H5 | GTM Preview Mode test: selective | Accept Statistics only, verify Marketing tags don't fire |
| H6 | Cookie tab check in DevTools | Before consent: only CookieConsent. After decline: no tracking cookies. |

### I. Privacy documentation (5 checks)
| # | Check | What to verify |
|---|-------|---------------|
| I1 | Privacy Policy complete (Art. 13/14) | Controller ID, purposes, legal basis, rights, transfers, retention periods |
| I2 | Privacy Policy in site language(s) | Available in every language the site content uses |
| I3 | Cookie Policy exists (separate page) | Lists all cookies, purpose, duration, vendor. Cookie Declaration script installed. |
| I4 | Privacy Policy linked from every page | Typically in footer |
| I5 | Script inventory documented | All scripts and their purposes documented internally |

### J. Data processing & legal (5 checks)
| # | Check | What to verify |
|---|-------|---------------|
| J1 | DPAs in place for all processors | Analytics, CRM, email, hosting, CDN, payment, any SaaS with personal data |
| J2 | Vendor inventory maintained | List of all third parties, what data they process, DPA status |
| J3 | US services DPF-certified | Check dataprivacyframework.gov for each US-based vendor |
| J4 | Data subject rights process exists | DSAR handling procedure documented, 30-day response capability |
| J5 | Data breach response plan exists | 72-hour notification procedure, breach register maintained |

### K. Geo-targeting (3 checks - if site has international traffic)
| # | Check | What to verify |
|---|-------|---------------|
| K1 | EU/EEA visitors get opt-in banner | Full blocking consent banner |
| K2 | US visitors get appropriate notice | Opt-out model, "Do Not Sell/Share" link if California |
| K3 | UK visitors handled correctly | Marketing consent required, analytics can load (post-DUAA Feb 2026) |

---

## Post-audit

- If issues found: fix, re-run checks, update spreadsheet
- When compliant: produce client-facing compliance report (template TBD)
- Add to deployment protocol: these checks run for every new site and every site update
- Re-scan quarterly or after any site changes (new scripts, plugins, integrations)
