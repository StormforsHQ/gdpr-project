# GDPR Audit Protocol

Step-by-step procedure for auditing a website's GDPR compliance.

## 1. Set up the site

1. Add the site in the app (Sites > Add site)
2. Enter the URL and select the platform (Webflow, HubSpot, Next.js, etc.)
3. Select the client type (SLA, Non-SLA, US-based)
4. If available, add the GTM Container ID (format: GTM-XXXXXXX)
5. If available, add the Cookiebot ID (format: UUID from Cookiebot admin)

## 2. Select audit type

Choose the audit type based on the client relationship:

- **SLA client**: Full GDPR compliance - we manage their Cookiebot and GTM setup. ~20 essential checks.
- **Non-SLA client**: EU-based but manages their own compliance. ~8 checks focused on what we can observe.
- **US-based client**: GDPR does not apply directly. ~14 checks for US privacy laws and best practices.
- **Basic/Full**: Basic covers the most critical checks. Full adds detailed configuration verification.

## 3. Run the automated scan

1. Click "Scan site" - this runs all automated checks:
   - **Page scan**: Fetches the page HTML and checks for scripts, meta tags, forms, iframes
   - **GTM API**: Connects to GTM and checks tag configuration, consent settings, triggers
   - **AI analysis**: Reviews findings that need contextual judgment
2. Wait for the scan to complete (usually 30-60 seconds)
3. Review the results - each check shows OK, Issue, or Not Checked

## 4. Complete manual checks

Some checks require a human to verify in a browser:

- **G1-G8**: Open the site in an incognito window and interact with the consent banner
- **H2**: Run the Cookiebot GCM check in admin.cookiebot.com
- **E1-E5**: Read the privacy policy and verify its content

For each manual check:
1. Expand the check to see the "How to check" instructions
2. Follow the steps
3. Set the status (OK, Issue, N/A)
4. Add notes if anything needs attention

## 5. Review and fix issues

For each issue found:
1. Click the check to see the detailed finding
2. Read the fix steps - they explain where to go and what to change
3. Fix the issue in GTM, Cookiebot admin, or the site CMS
4. Re-scan to verify the fix

## 6. Generate the report

Once all checks are complete:
1. Go to the site's page and click "Generate report"
2. Review the report - it shows all findings grouped by category
3. Add category comments where needed
4. The report can be printed or shared as a reference

## Audit frequency

- **SLA clients**: Full audit on onboarding, then quarterly re-scans
- **Non-SLA clients**: Initial audit, then as-needed
- **After any GTM/Cookiebot changes**: Re-scan affected checks
