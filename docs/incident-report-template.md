# GDPR Incident Report Template

Use this template when a compliance issue is reported on a client site - whether flagged by an external party, discovered internally, or reported by the client.

## Incident details

| Field | Value |
|-------|-------|
| Date reported | YYYY-MM-DD |
| Reported by | Name / role / company |
| Client site | Site name + URL |
| Platform | Webflow / HubSpot / Next.js / Other |
| Severity | Critical / High / Medium / Low |
| Status | Open / In progress / Resolved / Closed |

## Source of report

How was the issue discovered?

- [ ] External company (sales/compliance scanner)
- [ ] Client self-reported
- [ ] Internal audit
- [ ] Data protection authority (DPA/IMY)
- [ ] End user complaint (DSAR, cookie complaint)
- [ ] Other: ___

If external company: note that many "compliance alerts" are sales tactics, but always verify the technical claims regardless of motive.

## Issues found

For each issue, document:

| # | Check ID | Issue | Severity | Evidence |
|---|----------|-------|----------|----------|
| 1 | e.g. A1 | e.g. Scripts hardcoded in header, firing without consent | Critical | Screenshot / scan result |
| 2 | | | | |
| 3 | | | | |

### How to determine severity

- **Critical** - Scripts firing without consent, personal data sent to third parties without legal basis, no consent banner at all
- **High** - Consent banner present but misconfigured, cookies set before consent, missing privacy policy
- **Medium** - Cookie categorization errors, outdated privacy policy, missing vendor in cookie declaration
- **Low** - Minor text issues, cosmetic consent banner problems, non-blocking configuration warnings

## Root cause analysis

What caused the issue(s)?

- [ ] Scripts added directly to header/footer instead of through GTM
- [ ] CMP (Cookiebot) not properly installed or deactivated
- [ ] GTM consent settings not configured correctly
- [ ] Third-party integration added without consent gating
- [ ] Platform migration broke existing setup
- [ ] Never set up properly from the start
- [ ] Other: ___

## Actions taken

| # | Action | Who | Date | Status |
|---|--------|-----|------|--------|
| 1 | e.g. Moved scripts from header into GTM with consent triggers | | | Done |
| 2 | e.g. Verified Cookiebot CMP tag fires on Consent Initialization | | | Done |
| 3 | | | | |

## Verification

- [ ] Ran GDPR audit app scan after fixes - all checks pass
- [ ] Verified in browser: consent banner appears on first visit
- [ ] Verified in browser: declining blocks all non-essential scripts
- [ ] Verified in browser: no cookies set before consent
- [ ] Checked DevTools Network tab for unauthorized requests
- [ ] Client notified of findings and resolution

## Communication

| Recipient | Date | Channel | Summary |
|-----------|------|---------|---------|
| Client contact | | Email | |
| Internal team | | Slack | |
| DPA (if required) | | | |

### When to notify a DPA

A data breach must be reported to the relevant DPA (e.g. IMY in Sweden) within 72 hours if it:
- Involves personal data being sent to unauthorized third parties
- Results from scripts firing without consent that collect/transmit personal data
- Affects a large number of data subjects

When in doubt, consult legal. Document the decision either way.

## Lessons learned

What should change to prevent this from happening again?

- [ ] Add site to regular audit schedule
- [ ] Update deployment protocol
- [ ] Update technical configuration guide
- [ ] Train team on specific issue
- [ ] Other: ___

## Timeline

| Date | Event |
|------|-------|
| | Issue reported |
| | Investigation started |
| | Root cause identified |
| | Fixes applied |
| | Verification complete |
| | Client notified |
| | Incident closed |
