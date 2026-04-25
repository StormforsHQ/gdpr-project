# Project Scope

## Problem
Stormfors clients receiving GDPR compliance warnings about their websites. Root causes appear to involve Cookiebot configuration, GTM setup, and script loading order in Webflow.

## Immediate goal
Audit all existing Webflow client sites to ensure GDPR compliance and prevent further warnings.

## Full scope

| Phase | What | Platform |
|-------|------|----------|
| 1 | Audit existing client sites | Webflow |
| 2 | Create reusable audit checklist/process | Webflow, HubSpot, Next.js |
| 3 | Research broader compliance requirements | All platforms |

## Platforms to cover
- **Webflow** - current client sites (priority)
- **HubSpot** - incoming via company merger
- **Next.js** - new app development

## Considerations
- Multi-country clients (different GDPR enforcement, language requirements)
- Multi-language sites
- Broader compliance areas beyond cookies (data processing, privacy policies, consent records, etc.)

## Key technical areas to investigate
- Cookiebot configuration and consent management
- GTM setup and its role in blocking/allowing cookies
- Script loading order in Webflow site headers
- How Cookiebot and GTM interact to enforce consent

## Known root causes (from TSS inspection)
- Cookiebot script missing from header (deactivated despite being in GTM)
- Tracking scripts hardcoded in header instead of managed through GTM
- Scripts firing without user consent (HotJar, Leadfeeder, Adline, LinkedIn Pixel)
- GTM tags not properly mapped to consent variables

## Threat landscape
- External companies/lawyers using automated bots to scan sites for these exact issues
- Second scare in one month for Stormfors
- Luna Diabetes received a 150,000 fine related to compliance

## Reference
- Luna Diabetes: now correctly configured (per colleague), but was fined 150k
- TSS: incident details in `tss-incident.md`
- Fredric's proposed protocol in `fredric-protocol-proposal.md`
