# Help Chatbot Plan

Branch: `feat/help-chatbot`

## What we're building
Floating chat button (bottom-right) that opens a slide-in panel where users can ask questions about the app, checks, scan results, and what to do next. Context-aware (knows which site/page user is on), session-only (no DB persistence for conversations).

## Tech
- OpenRouter + `google/gemini-2.0-flash-001` (same as existing AI checks in `src/lib/ai-agent.ts`)
- SSE streaming from API route
- Dynamic system prompt built from check data in DB
- Token + cost counter per session displayed in chat panel

## Key files to reference
- `src/lib/ai-agent.ts` - existing OpenRouter integration, retry logic, credit check
- `src/lib/checklist.ts` - 69 checks with descriptions, categories, automation types, legal refs
- `src/lib/check-guides.ts` - step-by-step guides for each check (why, steps, tools, tips)
- `src/app/(app)/layout.tsx` - app shell, chat button goes here (alongside Toaster)
- `src/components/top-navbar.tsx` - has Help button + theme toggle
- `src/components/error-log.tsx` - existing ErrorLogProvider (in-memory, max 100)
- `src/app/(app)/settings/page.tsx` - settings page, will add error log section
- `prisma/schema.prisma` - Site, Audit, CheckResult, ScanRun, Report models

## Steps

### 1. Chat API route (`src/app/api/chat/route.ts`)
- POST endpoint: accepts `{ message, pageContext: { siteId?, path? } }`
- Build dynamic system prompt:
  - Fetch all check definitions from `CHECKLIST` (src/lib/checklist.ts)
  - Fetch check guides from `CHECK_GUIDES` (src/lib/check-guides.ts)
  - If siteId provided: fetch site + latest audit + check results from DB
  - Include: app navigation guide, how to run scans, how to generate reports, what warning triangles mean, how to add Cookiebot/GTM IDs
- Stream response from OpenRouter (SSE, same endpoint as ai-agent.ts but with `stream: true`)
- Final SSE event includes: `{ tokenCount, estimatedCost }` based on model pricing
- Error responses: return structured error event, not 500

### 2. Chat UI components
- `src/components/chat/chat-button.tsx` - fixed bottom-6 right-6, MessageSquare icon, shadcn Button
- `src/components/chat/chat-panel.tsx` - fixed right-0 top-0 h-full w-[420px], header with close + clear, scrollable message list, input at bottom, token/cost counter at bottom
- `src/components/chat/chat-message.tsx` - user vs assistant styling, markdown rendering (react-markdown)
- Add ChatButton to layout.tsx after Toaster
- Client component (needs state, event handlers)

### 3. Streaming + context wiring
- ChatPanel manages messages array in state (session-only)
- On send: POST to /api/chat with message + { siteId from URL params, path from pathname }
- Read SSE stream, append tokens to assistant message in real-time
- On stream end: update session token/cost counter from final event
- Token counter format: "1,234 tokens / $0.002" - small text in chat panel footer

### 4. Error handling + settings error log
- Chat errors: show as error message in chat panel (red styling, retry button)
- Use existing addError() from ErrorLogProvider for all failures (source: "chat")
- Settings page: add "Error Log" section showing recent errors (from context, not DB)
- Future (backlog): persist errors to DB, add email alerts via Resend

## System prompt structure (dynamic)
```
You are a GDPR compliance assistant built into the Stormfors audit app.
Help users understand checks, scan results, and what actions to take.

## App navigation
- Sites list: add/edit/delete sites, each has URL + platform + optional Cookiebot/GTM IDs
- Audit page: 69 checks across 11 categories, run scans, review results
- Reports: generate versioned HTML reports with summary and findings
- Settings: database backup export/import

## Warning triangles
Checks show amber triangles when they need a Cookiebot ID or GTM Container ID
that hasn't been added in site settings. Add IDs via Edit Site dialog.

## Running scans
- "Scan site" runs 18 page scan checks (HTML analysis)
- "AI Analyze" runs 9 AI checks (costs OpenRouter credits)
- Cookiebot checks run automatically if Cookiebot ID is set
- Individual checks can be re-run with the run button

## Check reference
[dynamically inserted: all 69 checks with key, label, description, category, automation type]

## Check guides
[dynamically inserted: guides with why, steps, tools, tips]

## Current context
[if site selected: site name, URL, platform, IDs, current check results with statuses and notes]
```

## Dependencies to install
- `react-markdown` (for rendering assistant messages)
- `remark-gfm` (GitHub-flavored markdown support)

## Backlog (not this branch)
- Model selector in settings (update pricing dynamically)
- Persistent error log in DB
- Email alerts on errors via Resend
