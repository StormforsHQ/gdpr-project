# Technical Configuration Guide

How Cookiebot, GTM, and Google Consent Mode work together.

## The consent pipeline

```
Visitor loads page
    |
    v
GTM loads (Consent Initialization trigger)
    |
    v
Cookiebot CMP tag fires FIRST (sets default consent state: all denied)
    |
    v
Consent banner appears
    |
    +---> Visitor accepts all --> Cookiebot updates consent state --> GTM tags fire
    |
    +---> Visitor declines --> Consent stays denied --> Only necessary tags fire
    |
    +---> Visitor picks categories --> Partial consent --> Matching tags fire
```

## Google Consent Mode V2

Consent Mode V2 is how Google services know whether a visitor has consented. It uses four signals:

| Signal | Purpose | Default |
|--------|---------|---------|
| `ad_storage` | Advertising cookies (Google Ads, remarketing) | denied |
| `analytics_storage` | Analytics cookies (GA4 pageviews, events) | denied |
| `ad_user_data` | Sending user data to Google for advertising | denied |
| `ad_personalization` | Personalized advertising | denied |

When Cookiebot is set up correctly via the official GTM template:
- All four signals default to "denied" before the visitor makes a choice
- When the visitor accepts, Cookiebot updates the signals to "granted"
- Google tags automatically adapt - they send full data when granted, anonymous pings when denied

## GTM tag types

| Type code | Tag | Behavior with Consent Mode |
|-----------|-----|---------------------------|
| `googtag` | Google Tag (base) | Self-adapts to consent. Sends anonymous pings when denied. |
| `gaawe` | GA4 Event | Self-adapts. Needs a `googtag` base tag to work. |
| `gaawc` | Google Ads Conversion | Self-adapts. |
| `awct` | Google Ads Conversion Tracking | Self-adapts. |
| `html` | Custom HTML | Does NOT self-adapt. Must be consent-gated manually. |
| `cvt_*` | Community Template | Depends on the template. Cookiebot uses this type. |

## GTM trigger types

| Trigger | When it fires | Use for |
|---------|--------------|---------|
| Consent Initialization - All Pages | Before anything else | Cookiebot CMP tag ONLY |
| Initialization - All Pages | After consent init, before pageview | Google Tag (base) |
| All Pages | On every pageview | Google tags that self-adapt to consent |
| Custom Event (consent-aware) | After visitor grants consent | Non-Google tags (LinkedIn, HotJar, etc.) |

## Cookiebot setup in GTM

The correct setup uses the official Cookiebot CMP template from the GTM Community Template Gallery:

1. **Tag type**: Community Template (type starts with `cvt_`), not Custom HTML
2. **Cookiebot ID**: The site's Cookiebot serial number (UUID format)
3. **Consent Mode**: Enabled in the template settings
4. **AutoBlock**: OFF - it interferes with Consent Mode anonymous pings
5. **Trigger**: "Consent Initialization - All Pages" (fires before everything)

## Consent Overview in GTM

GTM has a Consent Overview (shield icon) that shows each tag's consent requirements:

- **Google tags**: Set to "No additional consent required" - they self-adapt
- **Non-Google tags**: Set to "Require additional consent" with the right types:
  - Marketing tags (LinkedIn, Meta): `ad_storage`, `ad_personalization`
  - Analytics tags (HotJar, Clarity): `analytics_storage`
  - Tags that send user data: `ad_user_data`

## Verifying the setup

1. **Cookiebot GCM Check**: In admin.cookiebot.com, run the Google Consent Mode Checker. If all four signals show green, the pipeline works.
2. **GTM Preview Mode**: Click Preview in GTM, enter the site URL, and check that tags fire at the right time with the right consent state.
3. **Browser DevTools**: Open the Console and look for `gtag('consent', 'default', ...)` calls to verify consent defaults are set.
