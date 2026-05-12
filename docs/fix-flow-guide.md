# Fix Flow Guide

How to fix issues found during GDPR compliance scans.

## Scripts in the wrong place (A1, A2, B1)

**Problem**: Tracking scripts (GA, Meta Pixel, LinkedIn, etc.) are hardcoded in the site header or footer instead of being managed through GTM.

**Fix**:
1. Identify the script in the scan findings (it shows the exact script tag)
2. Go to the site's CMS (Webflow, HubSpot, WordPress, etc.)
3. Remove the script from the header/footer code
4. Add the equivalent tag in GTM instead:
   - For Google Analytics: Add a GA4 Configuration tag
   - For Meta Pixel: Add a Custom HTML tag with the pixel code, set consent requirements
   - For LinkedIn Insight: Add a Custom HTML tag, set consent requirements
5. Set the correct trigger and consent requirements in GTM
6. Publish the GTM container
7. Re-scan to verify

**Platform-specific locations**:
- **Webflow**: Project Settings > Custom Code > Head/Footer Code
- **HubSpot**: Settings > Website > Pages > Header/Footer HTML
- **WordPress**: Theme settings or header.php

## Cookiebot trigger wrong (A3)

**Problem**: Cookiebot CMP tag fires on "All Pages" or "Initialization" instead of "Consent Initialization".

**Fix**:
1. Open GTM > Tags > find the Cookiebot tag
2. Click the Triggering section
3. Remove the current trigger
4. Add "Consent Initialization - All Pages"
5. Save and publish

## Cookiebot using Custom HTML (A4)

**Problem**: Cookiebot is set up as a Custom HTML tag instead of the official template.

**Fix**:
1. Open GTM > Tags > find the Cookiebot Custom HTML tag
2. Note the Cookiebot serial number (UUID) from the script
3. Create a new tag using the Cookiebot CMP template from the Template Gallery
4. Enter the same serial number
5. Set trigger to "Consent Initialization - All Pages"
6. Enable Consent Mode in the template settings
7. Disable AutoBlock
8. Delete the old Custom HTML tag
9. Save and publish

## Tags missing consent requirements (B3)

**Problem**: Non-Google tags can fire without visitor consent.

**Fix**:
1. Open GTM > Tags > click the shield icon (Consent Overview)
2. Find the flagged tag
3. Click it and select "Require additional consent"
4. Add the appropriate consent types:
   - Marketing tags: `ad_storage`, `ad_personalization`
   - Analytics tags: `analytics_storage`
   - Tags that send user data: `ad_user_data`
5. Save and publish

## Tags on wrong trigger (B4)

**Problem**: Non-Google tags fire on "All Pages" (before consent is given).

**Fix**:
1. Open GTM > Tags > find the flagged tag
2. Change the trigger from "All Pages" to a consent-aware trigger
3. If no consent-aware trigger exists, create one:
   - Trigger type: Custom Event
   - Event name: Based on the consent category (varies by setup)
4. Save and publish

## Missing Google Tag (B6)

**Problem**: GA4 event tags exist but no base Google Tag to send data.

**Fix**:
1. Open GTM > Tags > New
2. Choose "Google Tag" as the tag type
3. Enter the GA4 measurement ID (format: G-XXXXXXXXXX, found in GA4 admin)
4. Set trigger to "Initialization - All Pages"
5. Check Consent Settings - should show built-in consent checks for all 4 signals
6. Save and publish

## Privacy policy issues (E1-E5)

These are content issues, not technical ones. The client or their legal team needs to:
- Create or update the privacy policy
- Include all required elements (data controller, data collected, legal basis, rights)
- Write it in the site's language
- Link it from the site footer or navigation

## Consent banner issues (G1-G8)

Most banner issues are configured in the Cookiebot admin panel (admin.cookiebot.com):
- **Banner not showing**: Check that the Cookiebot tag fires and the domain is registered
- **Missing decline button**: Cookiebot admin > Banner > Layout settings
- **Wrong language**: Cookiebot admin > Banner > Languages
- **Pre-ticked categories**: Cookiebot admin > Banner > ensure no categories are pre-selected
