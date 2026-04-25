# TSS Incident (2026-04-22)

## What happened
An external company (web agency, sales tactic) emailed TSS's CEO flagging GDPR issues on tssab.com. CEO escalated urgently. Josefin at TSS forwarded to Stormfors asking for help.

## What Fredric found on inspection
- **Cookiebot script was NOT in the header** - essentially deactivated despite being configured in GTM
- Scripts hardcoded directly in the header tag, NOT managed through GTM, firing without consent:
  - HotJar (probably inactive, loaded no cookies)
  - Leadfeeder
  - Adline
  - LinkedIn Pixel
- 2 Salesforce campaigns on the site (Clinical Module, TSS General 2022) - removed temporarily

## Actions taken
- Moved HotJar, Leadfeeder, Adline, LinkedIn Pixel into GTM with Consent
- Removed the 2 Salesforce campaigns pending confirmation if still active
- Josefin confirmed: remove Hotjar, Leadfeeder, and Adline completely

## Key takeaway
The external company was using a sales tactic, but the issues they flagged were real. The actual scan showed 10+ misconfigurations on a single site.
