# Plan: Fix Flow UI

Status: IN PROGRESS - Phases 1-2 done, Phase 2.5 (Webflow ID) partially done
Branch: main (merged after each phase)

## Context

The audit app already has:
- A checklist with scan results drawer (sidebar) per check
- 11 auto-fix functions in src/app/actions/fixes.ts (A1, A2, A3, A4, A5, B1, B3, B4, D1, D3, E1, I4)
- Fix buttons on check items that call these functions
- Remediation text in src/lib/remediation.ts (31 checks)
- A chatbot with 11 tools and 4 reference pages

Problems with current fixes:
- A1 fix silently removes non-GTM scripts from header - dangerous, no warnings
- B1 fix injects GTM snippet without checking if one already exists
- No confirmation dialogs, no warnings about manual steps needed first
- Fixes run immediately on button click with no user guidance
- Chatbot has hardcoded reference pages, no web search, can't explain fix flow

---

## Phase 1: Update HTML doc + write reference content - DONE

Completed:
- Added Q&A section to docs/webflow-script-management.html (7 common questions)
- Created docs/fix-flow-guide.md (complete fix flow reference for chatbot)
- Added "fix-flow" to chatbot's getReferencePage tool
- Created reference page at /reference/fix-flow with sidebar link

## Phase 2: Rework existing auto-fixes with safety - DONE

Completed:
- Added FixSafetyLevel type: "safe" | "confirm" | "guided"
- All 12 fixes categorized: A1/A2/D1/D3 = guided, A3/A4/A5/B1/B3/B4 = confirm, E1/I4 = safe
- Added `analyzeFix` server action for pre-flight analysis without changes
- Script categorization: TRACKING_PATTERNS (12) and NON_TRACKING_PATTERNS (6)
- A1/A2/D1/D3 applyFix now refuses and redirects to guided flow
- B1 checks for existing GTM snippet before pushing
- Analyze button (Search icon) for guided fixes, Fix button (Wrench icon) for safe/confirm
- Confirmation dialog for "confirm" level fixes with warning text
- Analysis results shown as prominent card in drawer (not just sidebar text)
- Webflow ID null check with user-friendly error

## Phase 2.5: Webflow ID in site management - IN PROGRESS

### Done
- `findWebflowSiteByDomain()` in src/lib/api/webflow.ts - matches by customDomain, defaultDomain, or shortName
- `listAllSites()` with pagination in src/lib/api/webflow.ts
- Retry with backoff (3 attempts) for 429 rate limits in webflowFetch
- `detectSiteIds` now looks up Webflow site when WEBFLOW_API_TOKEN is configured
- Webflow Site ID field in add-site-dialog.tsx (visible when platform = webflow)
- Webflow Site ID field in edit-site-dialog.tsx (visible when platform = webflow)
- Auto-fill Webflow ID from detect results
- User-friendly error messages for all Webflow API errors (rate limit, scopes, auth, forbidden)
- Detect button helper text updated: "Scans the URL to find IDs automatically"
- Webflow OAuth app created with scopes: sites:read, custom_code:read, custom_code:write
- New token exchanged and set in Coolify

### Remaining - must fix before moving on
- **listAllSites() fetches all 446 Webflow sites on every detect call** - this hits rate limits and is wasteful. Only 34 sites have custom domains and are real clients. Need a caching strategy:
  - Option A: Cache the Webflow sites list in DB (one-time sync, refresh on demand)
  - Option B: Skip Webflow lookup entirely if the site already has a webflowId in our DB
  - Option C: In-memory cache with TTL (simplest but lost on restart)
  - Recommended: Option A (store Webflow site mapping in DB) combined with Option B (skip lookup if already known). This also sets up the 34-site import flow.
- Verify detect actually finds and fills Webflow ID once rate limit issue is resolved
- Test end-to-end: add site -> detect -> Webflow ID auto-fills -> save -> ID persisted

## Phase 3: Enhanced scan results drawer (Tier 3 guided flow)

Add interactive fix flow to the scan results drawer for A1 (script cleanup).

### New component: FixFlowPanel
Lives inside the scan results drawer, replaces the current static "How to fix" steps for checks that need guided flows.

Structure:
- Step 1: "What we found" - shows categorized script list (tracking/non-tracking/unknown)
- Step 2: "Recreate in GTM" - manual instructions, link to GTM, user marks done (persisted to audit as note)
- Step 3: "Verify GTM setup" - button calls GTM API, shows results inline. If API not connected, shows manual steps
- Step 4: "Handle old scripts" - branches based on manual vs API-managed:
  - Manual path: instructions to comment out in Designer, link to Webflow Designer
  - API path: offer to delete old API-managed scripts (with option to re-add if something breaks)
- Step 5: "Push GTM snippet" - button with inline warnings + confirm checkbox. Also "Copy snippet" button for manual paste
- Step 6: "Re-scan" - button to verify final state

### Warnings and confirmations
- Step 5 requires checkbox: "I have commented out old scripts in the Webflow Designer"
- Step 5 button shows confirmation dialog for destructive action
- All automated actions show what will happen before executing
- Errors show clear recovery instructions

### State persistence
- Steps 2, 4 "marked as done" checkboxes save to the check result notes (audit trail)
- Step 3 verification results save to scan run
- Step 5 push action logged in scan history

Files to change:
- src/components/scan-results-drawer.tsx (add FixFlowPanel integration)
- src/components/fix-flow-panel.tsx (new component)
- src/app/actions/fixes.ts (new verification + push functions)
- src/lib/remediation.ts (update A1 remediation to reference guided flow)

## Phase 4: Fix buttons for simpler checks

For checks that aren't the complex script cleanup flow (Tier 1 and 2):
- Keep Fix buttons working as they do now
- Add inline confirmation for any fix that modifies external systems (GTM, Webflow)
- Improve remediation text to match the plain-language style
- Fix buttons for purely informational fixes just open the sidebar with guidance

Files to change:
- src/components/check-item.tsx (add confirmation dialog)
- src/lib/remediation.ts (improve text for remaining checks)

## Phase 5: Chatbot updates

### Add web search capability
- Add a new tool "searchOnline" that the chatbot can call
- Uses the same web search/fetch we have available
- Chatbot should offer to search online when:
  - It's unsure about something external (Cookiebot setup, GTM config, GDPR regulations)
  - The user asks something not covered by internal tools
- Chatbot should NOT search online for app-internal questions (use existing tools instead)
- Before searching, chatbot tells the user: "I'm not sure about this, let me look it up online"

### Update system prompt
- Tell the chatbot about the fix flow and that it can reference the fix-flow guide
- Tell it about the web search capability and when to use it
- Keep the prompt behavioral (no hardcoded content)

Files to change:
- src/app/api/chat/route.ts (add search tool, update system prompt)

## Phase 6: Update HTML doc with everything

Final update to docs/webflow-script-management.html incorporating everything we've built and learned. This comes last because the implementation may surface things we didn't think of.

## Implementation order

Do one phase at a time, commit after each, verify before moving on.

1. ~~Phase 1 (docs + reference)~~ - DONE
2. ~~Phase 2 (rework fixes)~~ - DONE
3. Phase 2.5 (Webflow ID) - fix caching, verify detection works
4. Phase 3 (guided flow UI) - the big one, A1 script cleanup
5. Phase 4 (simpler fix buttons) - improvements to other checks
6. Phase 5 (chatbot) - dynamic knowledge + web search
7. Phase 6 (final doc update) - capture everything learned

## Key decisions made with user

- Fix buttons open the sidebar (scan results drawer), not a separate wizard
- Inline warnings for most things, confirmation dialog for destructive actions
- Comment out instead of delete during cleanup (safety)
- Both branches built: manual scripts path AND API-managed scripts path
- Chatbot uses tools dynamically, no hardcoded content
- Chatbot can search online for external topics (with user awareness)
- All automated actions require user trigger (no auto-running fixes)
- "Copy snippet" always available as manual alternative to API push
- Step completion persisted to audit trail (notes on check results)
- Only ~34 Webflow sites with custom domains are real clients - these are the ones to import
- Webflow site list must be cached (not fetched fresh on every detect call)

## Infrastructure status

- **Webflow API**: OAuth token active with sites:read + custom_code:read + custom_code:write scopes. Token in Coolify env as WEBFLOW_API_TOKEN.
- **GTM API**: OAuth2 flow ready (scripts/get-google-token.js), blocked on boss's 2FA code for Google account authorization.
- **Cookiebot**: No API integration yet. Cookiebot IDs detected from HTML or from inside GTM container (when GTM API is connected). Many sites load Cookiebot through GTM (recommended setup) so HTML scanning won't find it.
