# Fix Flow Guide

How to fix issues found during a GDPR compliance scan. This covers the complete flow from scan results to a fully compliant site.

## Before you start fixing anything

Run a scan first. The scan identifies every script in the site header and footer, flags tracking scripts that need consent, and detects whether GTM and Cookiebot are set up. You need scan results before you can decide what to fix.

Check two things before touching scripts:

1. Does the client have a GTM container? If not, one needs to be created at tagmanager.google.com first.
2. Does the client have a Cookiebot subscription? If not, flag this - Cookiebot is a paid service and the client needs to set it up at cookiebot.com. Without Cookiebot, there's no consent management.

## Understanding what the scan found

The scan categorizes scripts in the site header as:

- **Tracking scripts** - collect visitor data (analytics, pixels, heatmaps). These must move into GTM so they fire only after consent. Examples: Google Analytics (gtag.js), Meta Pixel, HotJar, LinkedIn Insight Tag.
- **Non-tracking scripts** - don't collect visitor data. These stay in Webflow. Examples: CSS fixes, custom fonts, JSON-LD structured data, accessibility tools.
- **Unknown scripts** - the scan couldn't determine the purpose. You need to check these manually and decide which category they belong to.

## The fix flow for existing sites (script cleanup)

This is the complex one. Most existing sites have tracking scripts pasted directly in the Webflow Designer custom code boxes. The order of steps matters - skip ahead and you risk breaking the client's analytics.

### Step 1: Review what's in the site

Look at the scan results. For each script found, decide: tracking (move to GTM), non-tracking (leave in Webflow), or unknown (investigate).

### Step 2: Recreate tracking scripts as GTM tags

Open tagmanager.google.com and go to the client's container. For each tracking script found in Webflow, create a new tag with the correct consent trigger. Example: a loose GA4 script becomes a Google Tag in GTM with the same measurement ID.

This step is always manual - the audit app cannot create or edit GTM tags because a mistake could break the client's analytics or consent flow.

### Step 3: Verify in GTM Preview mode

Use GTM's Preview mode to confirm the new tags fire correctly. Don't skip this - if a tag is misconfigured, the client loses that tracking data after you remove the old script.

The audit app can help here if the GTM API is connected: it checks whether Cookiebot is set up correctly inside GTM, whether tracking tags have consent triggers, and which tags exist.

### Step 4: Comment out old scripts in Webflow Designer

Open Site Settings > Custom Code in the Webflow Designer. Comment out (don't delete) the tracking scripts by wrapping them in `<!-- -->`. Also comment out any manually-added GTM snippet - we'll push an API-managed one next.

Leave non-tracking scripts as they are.

Why comment out instead of delete? If something goes wrong, you can quickly uncomment to restore the old setup. After a few weeks of confirmed-working new setup, go back and delete the comments.

This step is always manual. The Webflow API cannot touch scripts that were pasted in the Designer - only scripts added through the API are manageable programmatically.

### Step 5: Push the GTM snippet via the audit app

The audit app generates a standard GTM snippet using the client's container ID. You can either:
- Push it via the API (adds it to the site header as an API-managed script)
- Copy the snippet and paste it manually in the Designer

The API approach is preferred because the app can then manage, update, or remove the snippet later. Manually-pasted scripts are invisible to the API.

**Important:** Before pushing, confirm that old scripts are commented out. Having two GTM snippets causes double-tracking.

### Step 6: Re-scan and verify

Run another scan to confirm: no loose tracking scripts, GTM snippet present, Cookiebot detected through GTM, all tracking going through GTM with consent triggers.

## The fix flow for new sites

Much simpler because there's nothing to clean up:

1. Confirm the client has a GTM container and Cookiebot subscription
2. Set up Cookiebot CMP tag in GTM (Consent Initialization trigger, Consent Mode V2)
3. Add tracking tags to GTM with consent triggers
4. Push the GTM snippet to Webflow via the audit app
5. Scan to verify

## What the audit app automates vs what's manual

**Automated (app does it):**
- Scanning sites and categorizing scripts
- Detecting GTM and Cookiebot IDs
- Reading GTM container contents (when API connected)
- Checking Cookiebot configuration (public API, no auth needed)
- Generating and pushing the GTM snippet to Webflow
- Managing API-registered scripts (list, add, delete)

**Manual (human must do it):**
- Creating or editing GTM tags and triggers (tagmanager.google.com)
- Setting up Cookiebot subscriptions (cookiebot.com)
- Commenting out or deleting scripts in the Webflow Designer custom code
- Verifying tags in GTM Preview mode
- Deciding whether unknown scripts are tracking or non-tracking

## Common warnings

- Never remove a tracking script from Webflow before it exists as a GTM tag. The client loses that tracking data with no way to recover it.
- Never push a new GTM snippet without first commenting out any manually-added one. Two GTM snippets cause double-tracking.
- The Webflow API can only manage scripts it added. Scripts pasted in the Designer are invisible to the API, even though they appear in the same custom code box.
- Cookiebot is a paid service. Don't set it up for a client without confirming they have a subscription.
