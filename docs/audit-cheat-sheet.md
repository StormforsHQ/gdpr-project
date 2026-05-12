# GDPR Audit Cheat Sheet

Quick reference for the most common checks and what to look for.

## Before you start

1. Open the site in an incognito window
2. Check that Cookiebot banner appears
3. Log into GTM and find the site's container
4. Log into Cookiebot admin and select the domain

## Script setup (A1-A5)

| Check | What to look for | Where |
|-------|-----------------|-------|
| A1 - Header scripts | Only GTM script in `<head>`. No GA, Meta Pixel, LinkedIn, etc. | Page source or scanner |
| A2 - Footer scripts | No tracking scripts in `<body>` outside GTM | Page source or scanner |
| A3 - Cookiebot trigger | Cookiebot tag fires on "Consent Initialization - All Pages" | GTM > Tags > Cookiebot tag > Triggering |
| A4 - Official template | Cookiebot uses the Community Template, not Custom HTML | GTM > Tags > Cookiebot tag > Tag Type |
| A5 - AutoBlock OFF | AutoBlock mode is disabled in the Cookiebot tag | GTM > Tags > Cookiebot tag > AutoBlock setting |

## GTM configuration (B1-B8)

| Check | What to look for | Where |
|-------|-----------------|-------|
| B1 - Scripts inside GTM | All tracking scripts managed via GTM, none hardcoded | Page source or scanner |
| B2 - Google consent overview | Google tags set to "No additional consent required" | GTM > Tags > Google tag > Consent Overview |
| B3 - Non-Google consent | Third-party tags have "Require additional consent" enabled | GTM > Tags > Non-Google tag > Consent Overview |
| B4 - Tag triggers | Non-Google tags use consent-aware triggers, not "All Pages" | GTM > Tags > Triggering section |
| B5 - Consent Mode V2 | All 4 signals transmitting (ad_storage, analytics_storage, ad_user_data, ad_personalization) | Cookiebot admin GCM check |
| B6 - Google Tag present | A base Google Tag exists for every GA4 measurement ID | GTM > Tags > look for Google Tag type |
| B7 - No paused tags | No important tags accidentally paused | GTM > Tags > check for pause icon |
| B8 - Tags have triggers | Every tag has at least one firing trigger | GTM > Tags > check Triggering section |

## Cookie categories (C1-C4)

Check the Cookiebot cookie report for the site. Every cookie should be correctly categorized as Necessary, Preferences, Statistics, or Marketing.

## Consent banner (G1-G8)

| Check | What to look for | Where |
|-------|-----------------|-------|
| G1 - Banner present | Cookie consent banner shows on first visit | Incognito browser |
| G2 - Accept/Decline | Both accept and decline buttons visible and working | Incognito browser |
| G3 - Granular choices | Users can pick individual cookie categories | Incognito browser |
| G6 - Language matches | Banner language matches the site language | Incognito browser |
| G7 - Revisit option | Users can change consent after initial choice | Look for Cookiebot widget/link |
| G8 - No pre-ticked | No cookie categories pre-selected except Necessary | Incognito browser |

## Privacy policy (E1-E5)

- E1: Privacy policy exists and is linked from the site
- E2: Policy is written in the site's language
- E3: Policy names the data controller (company name, address, contact)
- E4: Policy lists what data is collected and why
- E5: Policy explains how to exercise data rights (access, deletion, etc.)

## Key tools

- **Cookiebot admin**: admin.cookiebot.com - GCM check, cookie reports, banner settings
- **GTM**: tagmanager.google.com - tag configuration, consent overview, triggers
- **GTM Preview Mode**: Test tags fire correctly with consent signals
- **Browser DevTools**: Check scripts, cookies, network requests
