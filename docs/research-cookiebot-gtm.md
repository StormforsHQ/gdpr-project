# Cookiebot + GTM Technical Setup

Source: deep research, April 2026.

## Architecture

Cookiebot is a Consent Management Platform (CMP). It scans sites for cookies, categorizes them, shows a consent banner, stores consent in a first-party cookie (`CookieConsent`, 12 months), and broadcasts consent state via the dataLayer.

## Recommended setup: Cookiebot INSIDE GTM

The recommended approach is to deploy Cookiebot through GTM, NOT as an inline script in the HTML.

**In Webflow's head code, place ONLY the GTM container snippet:**
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXX');</script>
```

**Inside GTM, the trigger hierarchy enforces correct order:**
1. Consent Initialization - Cookiebot CMP tag fires here
2. Initialization - GA4/Google Ads config tags
3. Container Loaded / Page View - standard tags
4. DOM Ready / Window Loaded - late tags

## GTM setup steps

1. **Enable Consent Overview:** Admin > Container Settings > Additional Settings > "Enable consent overview"
2. **Install Cookiebot template:** Templates > Tag Templates > Search Gallery > "Cookiebot CMP"
3. **Create Cookiebot CMP tag:** Paste Domain Group ID, enable Google Consent Mode, set defaults to `denied`, trigger: **Consent Initialization - All Pages** (NOT "All Pages")
4. **Create `cookie_consent_update` trigger:** Triggers > New > Custom Event > event name: `cookie_consent_update`
5. **Google tags (Advanced Mode):** Leave on existing triggers. In Consent Overview set "No additional consent required." They self-adapt based on consent state.
6. **Non-Google tags (Basic Mode):** In Consent Overview, set "Require additional consent" + add required consent type (`ad_storage` for marketing, `analytics_storage` for analytics). Change trigger to `cookie_consent_update`. Set tag firing to "Once per page."

## Consent type mapping

| GTM Consent Type | Cookiebot Category |
|---|---|
| `ad_personalization` | Marketing |
| `ad_storage` | Marketing |
| `ad_user_data` | Marketing |
| `analytics_storage` | Statistics |
| `functionality_storage` | Preferences |
| `personalization_storage` | Preferences |
| `security_storage` | Necessary (always granted) |

## Google Consent Mode V2

Mandatory since March 2024 (Digital Markets Act). Added two parameters: `ad_user_data` and `ad_personalization`.

**Basic vs Advanced mode:**
- Basic: tags completely blocked until consent. No data to Google from unconsented users.
- Advanced: Google tags always load but adapt. Unconsented users generate anonymized cookieless pings for conversion modeling. More data = better ad optimization. Recommended for most implementations.

## Webflow specifics

- **Only GTM goes in Webflow head code.** Nothing else.
- Remove ALL hardcoded tracking scripts from Webflow custom code sections ("Clean Slate Principle")
- Webflow native forms don't set cookies by default (OK), but form-triggered tracking (e.g. conversion tracking on submit) must go through GTM
- Video/iframe embeds outside GTM need `data-cookieconsent="marketing"` and `type="text/plain"` attributes
- Check if Webflow Analytics (paid plans) sets cookies that need categorization

## Cookie Declaration

Place this script on the cookie policy page where the declaration should appear:
```html
<script id="CookieDeclaration"
  src="https://consent.cookiebot.com/YOUR-DOMAIN-GROUP-ID/cd.js"
  type="text/javascript" async></script>
```

## Verification steps

### Test 1: Denied consent
1. Incognito window, DevTools Network tab open
2. Load site, do NOT interact with banner
3. Open GTM Preview Mode (Tag Assistant)
4. Click "Consent Initialization" event > Consent tab > verify all show `Denied`
5. Verify non-Google tags under "Tags Not Fired"
6. Click Deny on banner, verify denied state persists

### Test 2: Granted consent
1. Fresh incognito, Tag Assistant connected
2. Click Accept All
3. Verify Consent tab shows `Granted` for all parameters
4. Verify all tags fire

### Test 3: Network-level
- Filter for `collect` (GA4) > check Payload > `gcs` parameter:
  - `G100` = all denied (correct for declined)
  - `G111` = all granted (correct for accepted)
- Check `gcd` parameter: `r` = denied then granted (ideal GDPR flow), `l` = ERROR no signal

### Test 4: Cookies
- DevTools > Application > Cookies
- Before consent: only `CookieConsent` cookie
- After declining: no `_ga`, `_gcl_au`, `_fbp` etc.
- After accepting: tracking cookies appear

### Test 5: Cookiebot tools
- Cookiebot admin > domain > "Start GCM Check"
- Also: MeasureMinds Consent Mode Monitor (free Chrome extension)

## Common mistakes

1. Using Custom HTML instead of GTM Template Gallery (misses V2 fields)
2. AutoBlock ON with Advanced Consent Mode (breaks cookieless pings)
3. CMP tag on "All Pages" instead of "Consent Initialization - All Pages"
4. Not replacing triggers on non-Google tags (they fire before consent)
5. Scripts hardcoded in page AND loaded via GTM (double-firing)
6. Consent defaults set after GTM loads (tags fire without consent state)
7. Regional defaults in wrong order (most specific first, global last)
8. Non-Google tags not configured with "Require additional consent"
9. Mixing legacy blocking with Consent Mode categories
10. Wrong consent update event name (Cookiebot: `cookie_consent_update`)
11. Not verifying in GTM Preview Mode
