# TSS Compliance Report Summary (2026-04-23)

Source: `TSS_GDPR_Compliance_Audit_-_Stormfors_AB.pdf` - client-facing report sent after fixes.

## What it covers

| Section | Finding | Action taken |
|---------|---------|-------------|
| Legacy scripts (HotJar, Leadfeeder, Adline) | Ghost scripts from discontinued services, outside GTM | Purged entirely |
| Salesforce campaigns (2) | Internal data comms, covered by Privacy Policy | Removed until further notice (precautionary) |
| LinkedIn pixels | Firing outside consent perimeter | Migrated into GDPR-compliant GTM container |
| CDN cookies (Webflow, Cloudflare) | Strictly Necessary cookies, no consent required | No action needed - bots flag these but they're legal |
| Video embeds (Vimeo) | May set cookies on load | Under observation; evaluating "click-to-load" barrier |

## Verification
- Cookiebot compliance test was run and linked in the report
- Status declared: FULLY COMPLIANT

## New audit checklist items extracted from this report

These are things we should include in our reusable audit process:

1. **Legacy/ghost script scan** - check for leftover scripts from discontinued services
2. **CDN cookie classification** - identify Strictly Necessary cookies (Webflow, Cloudflare, etc.) and confirm they don't need consent
3. **Video embed audit** - check if embedded players (Vimeo, YouTube, etc.) set cookies on load; consider click-to-load barriers
4. **Campaign script review** - check for marketing campaign scripts (Salesforce, etc.) and whether they're covered by Privacy Policy
5. **Cookiebot compliance test** - run the Cookiebot scanner and document results
6. **Client-facing report** - produce a compliance report for the client after audit/remediation
