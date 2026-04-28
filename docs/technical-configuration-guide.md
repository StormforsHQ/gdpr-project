# Technical Configuration Guide: Cookiebot + GTM Consent Management

Setup guide for GDPR-compliant consent management using Cookiebot (CMP) and Google Tag Manager (GTM). Covers Webflow, HubSpot, and Next.js platforms.

**Architecture principle:** Only GTM goes in the site header. Everything else - Cookiebot, analytics, marketing pixels - deploys inside GTM. This gives a single control plane for all scripts and consent.

### How this relates to the Audit Protocol

This guide explains how to correctly set up a site's compliance infrastructure from scratch - it is aimed at the developer or implementer. The **Audit Protocol** is the companion document that explains how to verify an existing site was set up correctly. If you follow this guide when building a site, the site should pass the audit. Use the Audit Protocol to check sites that were not set up with this guide.

---

## Core Setup (all platforms)

### 1. GTM container setup

1. Open tagmanager.google.com, select or create the container
2. Go to **Admin > Container Settings > Additional Settings**
3. Check **"Enable consent overview"** - this adds the consent shield icon to the Tags list
4. Verify the trigger hierarchy exists (built-in, top to bottom):
   - Consent Initialization (fires first - CMP goes here)
   - Initialization (GA4/Google Ads config tags)
   - Container Loaded / Page View (standard tags)
   - DOM Ready
   - Window Loaded

### 2. Install and configure Cookiebot CMP tag

#### 2.1 - Add the Cookiebot template

1. Go to **Templates > Tag Templates > Search Gallery**
2. Search for **"Cookiebot CMP"** (official template by Usercentrics)
3. Click **Add to workspace**

#### 2.2 - Create the Cookiebot CMP tag

1. Go to **Tags > New**
2. Tag type: **Cookiebot CMP** (from Template Gallery - never use Custom HTML)
3. Configure:

| Setting | Value |
|---------|-------|
| Domain Group ID | Paste your Cookiebot Domain Group ID (from admin.cookiebot.com > Settings) |
| Default consent | **All denied** (ad_storage, analytics_storage, ad_user_data, ad_personalization all set to `denied`) |
| AutoBlock | **OFF recommended** (see note below) |

Google Consent Mode is enabled automatically when using the official GTM Template Gallery template - no separate checkbox needed.

4. Trigger: **Consent Initialization - All Pages**

**Why "Consent Initialization" and not "All Pages"?** The Consent Initialization trigger fires before any other trigger in the GTM container. This ensures the consent state is established before any tags attempt to fire. Using "All Pages" causes tags to fire before the CMP has set the consent defaults, resulting in unconsented data collection.

**AutoBlock note:** AutoBlock is Cookiebot's script-blocking mechanism. When using Advanced Consent Mode inside GTM, we recommend turning AutoBlock OFF because consent-aware tags handle their own blocking/unblocking based on consent state. However, AutoBlock CAN work alongside GTM if you add `data-cookieconsent="ignore"` to the GTM and CMP scripts to prevent them from being accidentally blocked. The simpler approach is to leave AutoBlock OFF and manage all consent through GTM triggers.

#### 2.3 - Set regional consent defaults (optional)

If the site serves visitors outside the EU, add regional defaults in the Cookiebot CMP tag:

```
Region: US
Default: granted (for ad_storage, analytics_storage, ad_user_data, ad_personalization)

Region: (empty = global fallback)
Default: denied (for all)
```

Order matters: most specific region first, global fallback last.

### 3. Create the cookie_consent_update trigger

1. Go to **Triggers > New**
2. Trigger type: **Custom Event**
3. Event name: `cookie_consent_update`
4. This trigger fires when a user makes a consent choice in the Cookiebot banner

### 4. Configure Google tags (Advanced Consent Mode)

Google tags (GA4, Google Ads, Floodlight) support Advanced Consent Mode natively. They self-adapt based on the consent state.

**For each Google tag:**
1. Leave the existing trigger as-is (typically "All Pages" or "Initialization")
2. In the **Consent Overview** (shield icon on Tags list), set to **"No additional consent required"**

**What Advanced Consent Mode does:**
- Tags load on every page regardless of consent state
- When consent is denied: tags send measurements without cookies to Google (no cookies set, no user identifiers)
- When consent is granted: tags function normally with full measurement
- Google uses these cookieless measurements for conversion modeling (better data than zero data)

### 5. Configure non-Google tags

Non-Google tags (Meta Pixel, LinkedIn Insight, HotJar, TikTok Pixel, etc.) do NOT support Advanced Consent Mode. They must be completely blocked until consent is granted.

**For each non-Google tag:**

1. In the **Consent Overview** (shield icon), set to **"Require additional consent"**
2. Add the required consent type(s):

| Tag | Required consent type |
|-----|----------------------|
| Meta Pixel | `ad_storage` |
| LinkedIn Insight Tag | `ad_storage` |
| TikTok Pixel | `ad_storage` |
| HotJar | `analytics_storage` |
| Microsoft Clarity | `analytics_storage` |
| Any marketing/retargeting pixel | `ad_storage` |
| Any analytics tool | `analytics_storage` |

3. Change the trigger from "All Pages" to the **`cookie_consent_update`** custom event trigger
4. Set tag firing to **"Once per page"** (prevents duplicate firing if user changes consent)

### 6. Consent type mapping

| GTM Consent Type | Cookiebot Category | Purpose |
|------------------|--------------------|---------|
| `ad_personalization` | Marketing | Ad personalization signals |
| `ad_storage` | Marketing | Cookies for advertising (Google Ads, remarketing) |
| `ad_user_data` | Marketing | User data sent to Google for advertising |
| `analytics_storage` | Statistics | Cookies for analytics (GA4, HotJar) |
| `functionality_storage` | Preferences | Cookies for site functionality (language, chat) |
| `personalization_storage` | Preferences | Cookies for content personalization |
| `security_storage` | Necessary | Security-related cookies (always granted, no consent needed) |

### 7. Cookie Declaration

Place this script on the cookie policy page where the declaration table should appear:

```html
<script id="CookieDeclaration"
  src="https://consent.cookiebot.com/YOUR-DOMAIN-GROUP-ID/cd.js"
  type="text/javascript" async></script>
```

Replace `YOUR-DOMAIN-GROUP-ID` with the actual ID from admin.cookiebot.com.

This renders an auto-updating table of all cookies found during Cookiebot's last scan, categorized by type (Necessary, Preferences, Statistics, Marketing).

### 8. Geo-targeting configuration (Cookiebot admin)

Configure in admin.cookiebot.com > Settings > Geo-targeting.

| Visitor region | Consent model | Banner behavior |
|----------------|---------------|-----------------|
| EU/EEA | Opt-in | Full consent banner, all non-essential blocked until consent |
| UK | Opt-in (marketing only) | Marketing cookies require consent. Analytics can load without consent (post-DUAA, Feb 2026) |
| California (CCPA) | Opt-out | Notice + "Do Not Sell/Share" link. Honor GPC browser signal |
| Other US states with laws | Opt-out | Opt-out notice per state requirements |
| Rest of world | Notice | Best practice notice, no blocking |

**Safe default:** If geo-targeting is not configured, apply EU opt-in rules globally. This is the strictest standard and covers all regions.

### 9. Google Consent Mode V2

Mandatory since March 2024 under the Digital Markets Act (DMA). Google requires Consent Mode V2 for any EEA user data sent to Google services.

**V2 parameters (all 7):**

| Parameter | Purpose | Default (EU) |
|-----------|---------|--------------|
| `ad_storage` | Advertising cookies | `denied` |
| `ad_user_data` | User data to Google for ads (V2 addition) | `denied` |
| `ad_personalization` | Ad personalization signals (V2 addition) | `denied` |
| `analytics_storage` | Analytics cookies | `denied` |
| `functionality_storage` | Functionality cookies | `denied` |
| `personalization_storage` | Personalization cookies | `denied` |
| `security_storage` | Security cookies | `granted` |

**Advanced vs Basic Consent Mode:**

| Aspect | Advanced Mode (recommended) | Basic Mode |
|--------|---------------------------|------------|
| Google tags behavior | Always load, adapt to consent state | Completely blocked until consent |
| Unconsented users | Send anonymized cookieless pings | Send nothing |
| Conversion modeling | Yes (Google uses pings for modeling) | No |
| Data for optimization | More data available | Less data |
| Non-Google tags | Must be manually blocked via trigger | Must be manually blocked via trigger |
| AutoBlock setting | OFF | Can be ON |
| Setup complexity | Same (Cookiebot template handles it) | Same |

**Verification:** In GTM Preview Mode, click "Consent Initialization" event > Consent tab. All parameters should show `Denied` before user interaction. After Accept All, all should show `Granted`.

---

## Webflow

### GTM snippet placement

1. Go to **Site settings > Custom Code > Head Code**
2. Paste the GTM container snippet:

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXX');</script>
<!-- End Google Tag Manager -->
```

3. Replace `GTM-XXXXXX` with the actual container ID

**This is the ONLY script that goes in Webflow's head code.** Nothing else.

### Clean Slate Principle

Remove ALL other scripts from Webflow custom code sections:

- **Site settings > Custom Code > Head Code** - only GTM snippet
- **Site settings > Custom Code > Footer Code** - empty (or only the Cookie Declaration script on the cookie policy page)
- **Individual page settings > Custom Code (Head)** - empty
- **Individual page settings > Custom Code (Footer)** - empty (except Cookie Declaration on the cookie policy page)

Common scripts to remove (move to GTM instead):
- Google Analytics / GA4 snippet
- Meta Pixel / Facebook Pixel
- LinkedIn Insight Tag
- HotJar snippet
- Google Ads conversion tracking
- TikTok Pixel
- Any other tracking/marketing scripts

**Why:** Any script hardcoded in Webflow fires immediately on page load, bypassing consent entirely. Moving everything into GTM ensures consent controls apply.

### Page-level custom code

Check every page in Webflow Designer for page-level custom code:

1. Click the page name in the Pages panel
2. Open page settings (gear icon)
3. Check both **Head Code** and **Footer Code** sections
4. Remove any tracking scripts found here - move them to GTM

Common finding: conversion tracking scripts on thank-you pages added directly instead of through GTM.

**Exception:** The Cookie Declaration script goes in the footer code of the cookie policy page only. This is not a tracking script - it renders the cookie list.

### Video and iframe embeds

Videos and iframes embedded directly in Webflow (outside GTM) set cookies on page load. To block them until consent:

**YouTube:**
- Always use `youtube-nocookie.com` instead of `youtube.com` or `youtu.be`
- Add consent-gating attributes:

```html
<iframe data-cookieconsent="marketing"
  data-src="https://www.youtube-nocookie.com/embed/VIDEO_ID"
  width="560" height="315"
  frameborder="0" allowfullscreen></iframe>
```

**Key attributes:**
- `data-cookieconsent="marketing"` - tells Cookiebot which consent category gates this embed
- `data-src` instead of `src` - prevents the iframe from loading until consent. Cookiebot swaps `data-src` back to `src` when consent is granted

Note: for **scripts** (not iframes), also add `type="text/plain"` to prevent execution before consent.

**Vimeo and other video providers:** Same pattern - use `data-cookieconsent`, `data-src`, and `type="text/plain"`.

**In Webflow Designer:** Add these attributes via the element settings panel (custom attributes). Note that Webflow's native video component may not support all custom attributes - use an Embed element with raw HTML instead.

### Google Fonts

Google Fonts loaded from the CDN (`fonts.googleapis.com`, `fonts.gstatic.com`) transfer the visitor's IP address to Google servers on every page load. This is a GDPR violation with established precedent (Munich court, EUR 100 per violation).

**How to self-host in Webflow:**

1. Go to [google-webfonts-helper](https://gwfh.mranftl.com/fonts) or download fonts from Google Fonts
2. Download the font files (WOFF2 format preferred)
3. In Webflow: go to **Assets panel > Upload** the font files
4. In **Project Settings > Fonts > Custom Fonts**, upload the font files
5. Apply the custom font in the Webflow Designer instead of selecting from Google Fonts
6. Remove any Google Fonts selected in the Webflow Designer (Project Settings > Fonts)

**Verification:** After publishing, open DevTools > Network tab > filter for `fonts.googleapis.com` and `fonts.gstatic.com`. No requests should appear.

### Webflow forms

Webflow native forms do not set cookies by default - they are compliant from a cookie perspective.

However, if form submissions trigger tracking (e.g., conversion tracking on a thank-you page redirect, or form submit events in GA4), that tracking must go through GTM with proper consent gating.

**Form submission tracking in GTM:**
1. Create a trigger in GTM for the form submit event
2. Attach conversion tags to this trigger
3. Set appropriate consent requirements on the conversion tags (ad_storage for Google Ads conversions, etc.)

### Webflow Analytics

Webflow Analytics (available on paid plans) may set its own cookies. Check whether the site's plan includes analytics:
- If Webflow Analytics is active, verify the cookies it sets are categorized in Cookiebot
- If not needed, disable Webflow Analytics in Project Settings

---

## HubSpot (upcoming platform)

### GTM placement in HubSpot

1. Go to **Settings > Content > Pages**
2. Under **Site header HTML**, paste the GTM container snippet (same snippet as Webflow)
3. Alternatively: **Settings > Tracking & Analytics > Tracking Code** has a section for adding scripts to the head

**Important:** Only the GTM snippet goes here. Do not add Cookiebot, GA4, or any other tracking scripts directly.

### HubSpot's cookie banner vs Cookiebot

HubSpot has a built-in cookie consent banner. **Recommendation: disable HubSpot's banner and use Cookiebot instead.**

Reasons:
- Cookiebot provides a single consistent consent experience across all platforms (Webflow + HubSpot + Next.js)
- Cookiebot integrates with GTM's Consent Mode V2 via the Template Gallery template
- HubSpot's banner does not integrate with GTM consent types
- One CMP to manage, audit, and troubleshoot instead of multiple

**To disable HubSpot's banner:**
1. Go to **Settings > Privacy & Consent > Cookies**
2. Disable the cookie consent banner

### HubSpot tracking code

The HubSpot tracking code (`hs-script-loader`) sets cookies for analytics and marketing purposes (`__hssc`, `__hssrc`, `__hstc`, `hubspotutk`).

**Setup in GTM:**
1. Create a **Custom HTML** tag in GTM with the HubSpot tracking script
2. In Consent Overview: set to **"Require additional consent"**
3. Required consent types: `analytics_storage` and `ad_storage` (HubSpot tracking serves both analytics and lead tracking purposes)
4. Trigger: `cookie_consent_update`
5. Tag firing: Once per page

Alternatively, if HubSpot only needs analytics: require `analytics_storage` only.

### HubSpot forms

HubSpot forms embedded on pages may load the HubSpot tracking code as a side effect.

**Options:**
1. **Forms embedded via GTM:** Load the HubSpot forms embed script through a GTM Custom HTML tag with consent requirements
2. **Forms embedded directly on HubSpot-hosted pages:** The HubSpot tracking code (managed via GTM) handles consent. Ensure the form itself only collects necessary data.

**Form compliance (same as all platforms):**
- Link to privacy policy at or near the form
- Separate consent checkbox for newsletter/marketing if the form serves multiple purposes
- No pre-ticked consent boxes
- Data minimization - only fields needed for the stated purpose

---

## Next.js (upcoming platform)

### GTM integration

**Option A: Using `@next/third-parties` (recommended)**

```tsx
// app/layout.tsx
import { GoogleTagManager } from '@next/third-parties/google'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
      <GoogleTagManager gtmId="GTM-XXXXXX" />
    </html>
  )
}
```

**Option B: Using `next/script`**

```tsx
// app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-XXXXXX');`,
          }}
        />
      </body>
    </html>
  )
}
```

**Important:** Place GTM in the root layout so it loads on every page. Do not add it to individual pages.

### Server-side vs client-side considerations

- **GTM and Cookiebot are client-side only.** They run in the browser. No server-side rendering or server component considerations apply.
- **Do not import GTM scripts in server components.** The `Script` component and `GoogleTagManager` component are client-side by design.
- **No consent-dependent server-side rendering.** Server components render the same HTML regardless of consent state. Consent-dependent behavior happens entirely in the browser via GTM.
- **Cookie Declaration:** If using a cookie policy page, add the Cookie Declaration script using `next/script`:

```tsx
// app/cookie-policy/page.tsx
import Script from 'next/script'

export default function CookiePolicyPage() {
  return (
    <div>
      <h1>Cookie Policy</h1>
      <div id="CookieDeclaration">
        <Script
          id="CookieDeclaration"
          src="https://consent.cookiebot.com/YOUR-DOMAIN-GROUP-ID/cd.js"
          strategy="afterInteractive"
        />
      </div>
    </div>
  )
}
```

### Consent state on route changes (SPA behavior)

Next.js App Router uses client-side navigation for route changes. This means:

- **GTM fires on the initial page load** and the consent state is established
- **Subsequent route changes** do not reload the page, so the consent state persists
- **The consent banner** remains functional across route changes (Cookiebot handles this)
- **GTM History Change trigger** may be needed for tracking page views on client-side navigation:
  1. In GTM, create a trigger: **Trigger type > Other > History Change**
  2. Attach your GA4 page view event tag to both the standard "All Pages" trigger and this History Change trigger
  3. Consent requirements carry over automatically

**No additional consent handling is needed for SPA route changes.** The consent state stored in the `CookieConsent` cookie and the GTM consent state persist across client-side navigations.

### Environment variables

Store the GTM container ID in an environment variable:

```env
NEXT_PUBLIC_GTM_ID=GTM-XXXXXX
```

Then reference it:

```tsx
<GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID!} />
```

**Note:** The `NEXT_PUBLIC_` prefix is required for the value to be available in client-side code.

---

## Verification Checklist (all platforms)

Run these tests after every setup or configuration change. Use GTM Preview Mode (tagassistant.google.com) and Chrome DevTools.

### Test 1: Decline all cookies

1. Open site in fresh incognito window with DevTools Network tab open
2. Connect GTM Preview Mode (Tag Assistant)
3. Do NOT interact with the consent banner
4. In Tag Assistant: click "Consent Initialization" event > Consent tab
5. Verify all consent types show `Denied`
6. Click Decline/Reject on the banner
7. Verify: non-Google tags appear under "Tags Not Fired"
8. Verify: DevTools > Application > Cookies shows only `CookieConsent` cookie (no `_ga`, `_fbp`, `_gcl_au`)

### Test 2: Accept all cookies

1. Fresh incognito window with Tag Assistant connected
2. Click Accept All on the banner
3. Verify: Consent tab shows `Granted` for all parameters
4. Verify: all tags fire (Google and non-Google)
5. Verify: tracking cookies appear in DevTools > Application > Cookies

### Test 3: Selective consent

1. Fresh incognito window with Tag Assistant connected
2. Open granular consent controls on the banner
3. Accept only Statistics, decline Marketing
4. Verify: analytics tags (GA4, HotJar) fire
5. Verify: marketing tags (Meta Pixel, LinkedIn Insight) do NOT fire
6. Verify: only statistics cookies appear, no marketing cookies

### Test 4: Network-level verification

1. In DevTools Network tab, filter for `collect` (GA4 requests)
2. Click on a GA4 request > Payload tab
3. Check the `gcs` parameter:
   - `G100` = all consent denied (correct after decline)
   - `G111` = all consent granted (correct after accept all)
4. Check the `gcd` parameter:
   - Contains `r` = denied then granted (correct GDPR flow)
   - Contains `l` = no consent signal detected (ERROR - misconfigured)

### Test 5: Cookie tab verification

1. DevTools > Application > Cookies
2. Before any consent action: only `CookieConsent` cookie should exist
3. After declining all: no `_ga`, `_gcl_au`, `_fbp`, `_li_fat_id`, or other tracking cookies
4. After accepting all: tracking cookies appear

### Additional verification tools

- **Cookiebot GCM Check:** admin.cookiebot.com > select domain > "Start GCM Check"
- **MeasureMinds Consent Mode Monitor:** free Chrome extension, shows consent state in real time

---

## Common Mistakes

| Mistake | Why it breaks | Fix |
|---------|--------------|-----|
| Using Custom HTML tag instead of Template Gallery for Cookiebot | Misses Consent Mode V2 fields, no auto-updates | Delete and recreate using the official Cookiebot CMP template |
| AutoBlock ON without proper exclusions | AutoBlock can interfere with GTM's consent-aware tag management if GTM/CMP scripts aren't excluded | Turn AutoBlock OFF, or add `data-cookieconsent="ignore"` to GTM and CMP scripts |
| CMP tag on "All Pages" trigger instead of "Consent Initialization - All Pages" | Tags fire before consent state is set | Change trigger to "Consent Initialization - All Pages" |
| Non-Google tags still on "All Pages" trigger | Tags fire before consent is granted | Change to `cookie_consent_update` trigger |
| Scripts hardcoded in site AND loaded via GTM | Double-firing, scripts bypass consent | Remove hardcoded scripts, manage everything through GTM |
| Consent defaults not set (or set after GTM loads) | First tags fire without any consent state | Cookiebot CMP tag on Consent Initialization handles this automatically |
| Regional defaults in wrong order | Wrong defaults applied | Most specific region first, global fallback last |
| Non-Google tags missing "Require additional consent" | Tags fire without consent check | Set in Consent Overview for every non-Google tag |
| Wrong consent update event name | Tags never fire after consent | Event name must be exactly `cookie_consent_update` |
| Google Fonts loaded from CDN | IP transfer to Google without consent (EUR 100/violation precedent) | Self-host fonts |
| YouTube embed using youtube.com | Sets cookies before consent | Use youtube-nocookie.com |

---

## Quick Reference: Setup Order

1. Place GTM snippet in site header (Webflow/HubSpot/Next.js)
2. Remove ALL other scripts from site code (Clean Slate Principle)
3. Enable Consent Overview in GTM container settings
4. Add Cookiebot CMP template from GTM Template Gallery
5. Create Cookiebot CMP tag (Domain Group ID, Consent Mode V2, defaults denied, AutoBlock OFF)
6. Set Cookiebot CMP trigger to "Consent Initialization - All Pages"
7. Create `cookie_consent_update` custom event trigger
8. Configure Google tags: "No additional consent required"
9. Configure non-Google tags: "Require additional consent" + correct consent type + `cookie_consent_update` trigger
10. Add Cookie Declaration script to cookie policy page
11. Configure geo-targeting in Cookiebot admin (if needed)
12. Run all 5 verification tests
