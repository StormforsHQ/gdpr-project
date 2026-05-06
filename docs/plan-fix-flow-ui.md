# Plan: Fix Flow UI

Status: APPROVED BY USER - ready to implement in order
Branch: feat/fix-flow-ui

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

## Phase 1: Update HTML doc + write reference content

Update docs/webflow-script-management.html with:
- The Q&A section (how GTM snippet is generated, what's automated vs manual, etc.)
- The numbered step-by-step flow for both new sites and existing sites
- All in the current plain prose style

Add a new reference page the chatbot can read:
- docs/fix-flow-guide.md - explains the fix flow, what's automated vs manual, warnings, when to use which approach
- Add it to the chatbot's getReferencePage tool (enum + file mapping)

Files to change:
- docs/webflow-script-management.html
- docs/fix-flow-guide.md (new)
- src/app/api/chat/route.ts (add reference page)

## Phase 2: Rework existing auto-fixes with safety

The current fixes are too aggressive. Rework them:

### A1 fix (remove tracking scripts from header)
Current: silently removes everything except GTM/Cookiebot
New behavior:
- DON'T auto-remove anything
- Instead, return a categorized list: tracking (needs GTM), non-tracking (can stay), unknown (user decides)
- Show this in the scan results drawer as Step 1 of the guided flow
- The actual removal is manual (user comments out in Designer) or via API if the script was API-managed

### B1 fix (inject GTM snippet)
Current: injects GTM snippet without checking for existing one
New behavior:
- Check if there's already an API-managed GTM snippet (via list_registered_scripts)
- If yes: offer to replace (delete old, push new)
- If no API-managed one but scan detected a GTM snippet in HTML: warn that there's likely a manually-added one, user must comment it out first
- If no GTM snippet at all: safe to push, just confirm
- Always show the generated snippet with a "Copy" button as alternative

### A3 fix (Cookiebot trigger in GTM)
Current: directly modifies GTM tag trigger
Keep this but add: confirmation dialog explaining what will change in the GTM container

### Other fixes
Review each of the 11 fixes for similar safety issues. Add confirmations where needed.

Files to change:
- src/app/actions/fixes.ts (rework fix functions)
- src/lib/fixes.ts (update fix metadata/descriptions)

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

### Add fix flow reference page
- Add "fix-flow" to the getReferencePage enum
- Map to docs/fix-flow-guide.md
- Chatbot can now explain the fix flow when asked

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
- src/app/api/chat/route.ts (add reference page, add search tool, update system prompt)
- docs/fix-flow-guide.md (the reference content)

## Phase 6: Update HTML doc with everything

Final update to docs/webflow-script-management.html incorporating everything we've built and learned. This comes last because the implementation may surface things we didn't think of.

## Implementation order

Do one phase at a time, commit after each, verify before moving on.

1. Phase 1 (docs + reference) - foundation, no UI changes
2. Phase 2 (rework fixes) - safety improvements to existing code
3. Phase 3 (guided flow UI) - the big one, A1 script cleanup
4. Phase 4 (simpler fix buttons) - improvements to other checks
5. Phase 5 (chatbot) - dynamic knowledge + web search
6. Phase 6 (final doc update) - capture everything learned

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
