# Meeting Notes (parsed from loose notes)

## Audit spreadsheet structure
- One row per site, columns = individual checks
- Each check: resolved (yes/no), reason if not resolved, optional comment
- "Forms globally big audit" = the full audit pass across all client sites

## Cookie categories
Three types of cookies (standard Cookiebot classification):
1. **Necessary** - always loaded, no consent needed (e.g. Webflow/Cloudflare CDN cookies)
2. **Marketing** - requires consent (e.g. LinkedIn Pixel, Salesforce campaigns)
3. **Statistics** (the missing third) - requires consent (e.g. Google Analytics, HotJar)

Note: there's also a fourth category "Preferences" in Cookiebot, but these three were the ones discussed.

## Technical flow
- **GTM -> Cookiebot**: Scripts go INTO GTM, GTM triggers fire based on Cookiebot consent status
- Flow: add script to GTM -> configure trigger -> trigger checks Cookiebot consent -> script only fires if user consented
- All scripts must be managed through GTM, nothing hardcoded in the header (except Cookiebot and GTM scripts themselves)
- Script order in header matters: Cookiebot first, then GTM

## Audit checks to include
- **Legacy cleanup**: check for old/unused scripts in Webflow header (HotJar, old Salesforce campaigns, etc.). Ask client before removing.
- **Map everything**: inventory all scripts, cookies, and tags across the site
- **Script execution**: verify how and in what order scripts run
- **Forms audit**: check that forms handle data correctly re: cookies/consent. Different forms on the same site may behave differently - need to verify each one.
- **LinkedIn Pixel**: was mentioned repeatedly as a common offender - often placed directly in header instead of GTM

## Process/protocol
- **Deployment protocol needed**: step-by-step guide for how audits and deployments are done, standardized across the company
- **Documentation rule**: whenever adding scripts to a site, document what was added and why

## Research items
- **MCP for Webflow header injection?** - can we use an MCP server to inspect/inject scripts in Webflow headers programmatically?
- **MCP for GTM?** - is there an MCP server for Google Tag Manager that could help with auditing/configuring tags?
