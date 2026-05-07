# Test Plan

Pre-audit testing to verify all check types, UI features, and data flows work correctly. Use a real site with Cookiebot + GTM configured (e.g. asedo.se or another site already set up in the app).

## 1. Page scan (18 checks)

- Run "Scan site" on a configured site
- Verify results appear inline on each check row (summary + error findings)
- Open the findings drawer (ClipboardList icon) on a check with issues - verify: check name, status badge, findings list, remediation steps with "How to fix" section
- Open the findings drawer on a passing check - verify green "No issues found" state
- Open the findings drawer on a check with no scan result - verify the check guide appears as fallback
- Verify the scan summary badge above checks shows correct counts (basic vs full breakdown)
- Re-run scan and verify results update (not duplicated)

## 2. Cookiebot API checks (6 checks: C1-C5, G3)

- Verify these run automatically as part of "Scan site" when a Cookiebot ID is set
- Remove the Cookiebot ID from a site, scan, and verify these checks show the "Cookiebot ID required" warning instead of results
- Open findings drawer on a Cookiebot check - verify remediation steps appear

## 3. GTM API checks (6 checks: A3-A5, B2-B4)

- Run a GTM check individually using the "Run check" button on a site with GTM configured
- Verify results appear inline and in the findings drawer
- Open findings drawer - verify remediation steps appear (these were missing before, now added)
- Remove GTM ID from a site and verify the "GTM Container ID required" warning appears

## 4. AI checks (9 checks: F2, F4, F6, G2, G6, G7, I1, I2, I8)

- Check OpenRouter credits in Settings before running
- Run "AI Analyze" on a configured site
- Verify results appear inline on each AI check
- Open findings drawer on an AI check - verify remediation steps and the AI analysis section
- Verify the AI badge (purple) shows correctly on these checks

## 5. Browser checks (8 checks: G4, G5, H6, H8, K1-K4)

- Verify all 8 show the blue "Browser" badge
- Open check guide (info icon) on each - verify step-by-step guide is present and user-friendly
- Open findings drawer on a browser check that has been manually set to "issue" - verify remediation steps appear with "How to fix" section
- Manually set a browser check to OK, issue, and N/A - verify status saves and icon updates

## 6. Manual checks (22 checks: C6, D2, E6, G9, H1-H5, H7, I5-I7, J1-J9)

- Verify all 22 show the grey "Manual" badge
- Open check guide on a manual check - verify guide is present
- Open findings drawer - verify remediation steps appear (these were missing before, now added)
- Add an internal note to a manual check - verify it saves and the "Internal notes" badge count updates
- Set a manual check to each status (OK, issue, N/A) and verify persistence after page reload

## 7. Tier filtering

- Toggle between "Basic audit" and "Full audit"
- Verify check count, issue badges (basic vs full breakdown), and visible checks change correctly
- Verify issue badges show separate counts even when on Basic view (both basic and full badges visible)

## 8. Filter bar

- Click each filter badge (OK, Issues, N/A, Not checked, Internal notes) and verify the check list filters correctly
- Verify active filter shows ring highlight
- Click again to deselect

## 9. Findings drawer content

Pick one check from each type (page-scan, cookiebot-api, gtm-api, ai-agent, browser-manual, human) and verify the drawer shows:
- Check name and key badge
- Status badge (OK/Issue/N/A)
- "What this means" explanation
- Summary (for automated checks)
- Findings list with severity icons (for checks with issues)
- "How to fix" section with numbered steps
- Platform badges on platform-specific steps (Webflow/HubSpot)
- "Needs developer or legal input" note (where applicable)
- Doc links (where applicable)

## 10. Chatbot

- Ask "what checks are there for cookies?" - verify it uses searchChecks tool and returns relevant results
- Ask "how do I fix check B3?" - verify it uses getCheckGuide and returns both the guide AND remediation steps (new)
- Ask "what's the status of this site?" while on a site page - verify it returns audit progress
- Ask about a browser check (e.g. "how do I test G4?") - verify the chatbot explains the manual browser testing steps

## 11. Legend

- Open "How this page works" section
- Verify all badge types are listed: Auto, Cookiebot, GTM API, AI, Browser, Manual
- Verify Browser description mentions real browser interaction and step-by-step guides
- Verify Manual description mentions human review and contacting clients

## 12. Report generation

- Generate a report for a site with mixed results (some OK, some issues, some not checked)
- Verify browser and manual check results appear in the report alongside automated results
- Verify remediation steps are included for checks with issues

## 13. Edge cases

- Scan a site with no Cookiebot ID and no GTM ID - verify only page-scan checks run, others show appropriate warnings
- Scan a site with an invalid URL - verify error handling (no crash, clear message)
- Open the app with no sites added - verify empty state
- Check that the compliance dashboard reflects current check statuses correctly
