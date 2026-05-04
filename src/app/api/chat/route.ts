import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { CHECKLIST } from "@/lib/checklist";
import { CHECK_GUIDES } from "@/lib/check-guides";
import { getEffectiveAPIKey, getAISettings } from "@/app/actions/ai-settings";

export const dynamic = "force-dynamic";

const MAX_TOOL_ROUNDS = 8;

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "listCategories",
      description:
        "List all 11 audit categories with their IDs, names, check count, and check names. Use this to get an overview of what the audit covers, to find which category a topic belongs to, or to orient before answering a general question.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getChecks",
      description:
        "Get all checks in a specific category. Returns each check's key, full name, description, automation type, and legal basis. Use this when the user asks about a topic area (e.g. cookies, consent, forms, tracking, scripts, embeds, privacy policy) or when you need to find specific checks.",
      parameters: {
        type: "object",
        properties: {
          categoryId: {
            type: "string",
            description: "The category ID letter (A through K). Call listCategories first if you don't know the ID.",
          },
        },
        required: ["categoryId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getCheckGuide",
      description:
        "Get the detailed guide for a specific check: why it matters, step-by-step audit instructions, tools to use, and practical tips. Use this when the user asks how to check or fix something, or wants to understand why a check matters.",
      parameters: {
        type: "object",
        properties: {
          checkKey: {
            type: "string",
            description: "The check key (e.g. 'A1', 'C3', 'G4'). Call getChecks or searchChecks first if you need to find the right key.",
          },
        },
        required: ["checkKey"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "searchChecks",
      description:
        "Search all 69 checks by keyword. Searches check names, descriptions, and legal basis text. Returns matching checks with their category, name, and description. Use this when the user asks about a topic and you need to find relevant checks without knowing the category.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search term (e.g. 'cookie', 'consent', 'youtube', 'form', 'pixel', 'privacy policy')",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "listSites",
      description:
        "List all sites in the app with their name, URL, platform, configuration status, and a summary of their latest audit progress. Use this when the user asks 'what sites do we have?', 'show me all sites', or wants to compare across sites.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getSiteByName",
      description:
        "Look up a specific site by name and get its full audit status including configuration, progress counts, issues found, and scan history. Use this when the user mentions a site by name (e.g. 'how is Luna Diabetes doing?', 'tell me about the Stormfors audit').",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The site name or partial name to search for (case-insensitive)",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getCurrentSiteStatus",
      description:
        "Get the audit status for the site the user is currently viewing. Automatically identified from the page URL - no parameters needed. Returns site info, configuration, audit progress, issues, and recent scan history. Use when the user asks about 'this site', 'current results', or 'what should I fix?' without naming a specific site.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getCheckResult",
      description:
        "Get the detailed result for a specific check on a specific site: its current status, notes, how it was tested (manual vs automated), and when it was last updated. Use when the user asks about a specific check on a specific site, e.g. 'what's the status of A2 for Luna Diabetes?' or 'did we check the footer scripts?'.",
      parameters: {
        type: "object",
        properties: {
          siteName: {
            type: "string",
            description: "The site name to look up. Use 'current' to use the site the user is currently viewing.",
          },
          checkKey: {
            type: "string",
            description: "The check key (e.g. 'A1', 'C3', 'G4').",
          },
        },
        required: ["siteName", "checkKey"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getScanHistory",
      description:
        "Get the scan history for a site: all scan runs with their type, URL scanned, status, timing, and number of findings. Use when the user asks 'when was the last scan?', 'how many scans have we run?', or about scan results.",
      parameters: {
        type: "object",
        properties: {
          siteName: {
            type: "string",
            description: "The site name to look up. Use 'current' to use the site the user is currently viewing.",
          },
        },
        required: ["siteName"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getComplianceOverview",
      description:
        "Get a compliance overview across all sites: each site's progress, issue count, and configuration status. Use when the user asks 'which sites have the most issues?', 'overall compliance status', or wants a portfolio view.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

// --- Tool implementations ---

function executeListCategories(): string {
  return JSON.stringify(
    CHECKLIST.map((cat) => ({
      id: cat.id,
      name: cat.label,
      checkCount: cat.checks.length,
      checks: cat.checks.map((c) => `${c.key}: ${c.label}`),
    })),
  );
}

function executeGetChecks(categoryId: string): string {
  const cat = CHECKLIST.find((c) => c.id === categoryId.toUpperCase());
  if (!cat) return JSON.stringify({ error: `Category '${categoryId}' not found. Valid IDs: A through K.` });

  return JSON.stringify({
    category: cat.label,
    checks: cat.checks.map((c) => ({
      key: c.key,
      name: c.label,
      description: c.description,
      automation: c.automation,
      legalBasis: c.legalBasis || null,
    })),
  });
}

function executeGetCheckGuide(checkKey: string): string {
  const key = checkKey.toUpperCase();
  const guide = CHECK_GUIDES[key];
  const check = CHECKLIST.flatMap((cat) => cat.checks).find((c) => c.key === key);

  if (!guide && !check) {
    return JSON.stringify({ error: `Check '${checkKey}' not found. Use searchChecks to find the right key.` });
  }

  const result: Record<string, unknown> = {};
  if (check) {
    result.key = check.key;
    result.name = check.label;
    result.description = check.description;
    result.automation = check.automation;
    result.legalBasis = check.legalBasis || null;
  }
  if (guide) {
    result.why = guide.why;
    result.steps = guide.steps;
    result.tools = guide.tools || [];
    result.tips = guide.tips || [];
  }
  return JSON.stringify(result);
}

function executeSearchChecks(query: string): string {
  const lower = query.toLowerCase();
  const allChecks = CHECKLIST.flatMap((cat) =>
    cat.checks.map((c) => ({ ...c, category: cat.label, categoryId: cat.id })),
  );

  const matches = allChecks.filter(
    (c) =>
      c.label.toLowerCase().includes(lower) ||
      c.description.toLowerCase().includes(lower) ||
      (c.legalBasis && c.legalBasis.toLowerCase().includes(lower)) ||
      c.key.toLowerCase() === lower,
  );

  if (matches.length === 0) {
    return JSON.stringify({ results: [], message: `No checks found matching '${query}'. Try a broader search term.` });
  }

  return JSON.stringify({
    results: matches.map((c) => ({
      key: c.key,
      name: c.label,
      category: `${c.categoryId}. ${c.category}`,
      description: c.description,
      automation: c.automation,
    })),
  });
}

async function executeListSites(): Promise<string> {
  const sites = await prisma.site.findMany({
    include: {
      audits: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          results: { select: { status: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  if (sites.length === 0) {
    return JSON.stringify({ sites: [], message: "No sites added yet. Add one using the + button in the sidebar." });
  }

  return JSON.stringify({
    sites: sites.map((s) => {
      const audit = s.audits[0];
      const counts = { ok: 0, issue: 0, na: 0, not_checked: 0 };
      if (audit) {
        for (const r of audit.results) {
          if (r.status in counts) counts[r.status as keyof typeof counts]++;
        }
      }
      return {
        name: s.name,
        url: s.url,
        platform: s.platform,
        cookiebotConfigured: !!s.cookiebotId,
        gtmConfigured: !!s.gtmId,
        auditProgress: audit ? counts : "No audit started",
      };
    }),
  });
}

async function findSiteByName(name: string): Promise<{ id: string; name: string } | null> {
  const sites = await prisma.site.findMany({ select: { id: true, name: true } });
  const lower = name.toLowerCase();
  return sites.find((s) => s.name.toLowerCase().includes(lower)) || null;
}

async function executeSiteAuditStatus(siteId: string): Promise<string> {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      audits: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          results: true,
          scans: { orderBy: { startedAt: "desc" }, take: 3 },
        },
      },
    },
  });
  if (!site) return JSON.stringify({ error: "Site not found" });

  const result: Record<string, unknown> = {
    name: site.name,
    url: site.url,
    platform: site.platform,
    cookiebotId: site.cookiebotId || "not set",
    gtmId: site.gtmId || "not set",
  };

  const audit = site.audits[0];
  if (!audit || audit.results.length === 0) {
    result.auditStatus = "No audit results yet. Run a scan first.";
    return JSON.stringify(result);
  }

  const counts = { ok: 0, issue: 0, na: 0, not_checked: 0 };
  for (const r of audit.results) {
    if (r.status in counts) counts[r.status as keyof typeof counts]++;
  }
  result.progress = counts;

  const allChecks = CHECKLIST.flatMap((cat) => cat.checks);

  const issues = audit.results.filter((r) => r.status === "issue");
  if (issues.length > 0) {
    result.issues = issues.map((r) => {
      const check = allChecks.find((c) => c.key === r.checkKey);
      return {
        key: r.checkKey,
        name: check?.label ?? "Unknown",
        automation: check?.automation ?? "unknown",
        notes: r.notes || null,
      };
    });
  }

  if (audit.scans.length > 0) {
    result.recentScans = audit.scans.map((s) => ({
      type: s.scanType,
      url: s.url,
      status: s.status,
      date: s.startedAt.toISOString().split("T")[0],
    }));
  }

  return JSON.stringify(result);
}

async function executeGetSiteByName(name: string): Promise<string> {
  const site = await findSiteByName(name);
  if (!site) {
    return JSON.stringify({
      error: `No site found matching '${name}'. Use listSites to see all available sites.`,
    });
  }
  return executeSiteAuditStatus(site.id);
}

async function executeGetCurrentSiteStatus(siteId: string): Promise<string> {
  if (!siteId) {
    return JSON.stringify({
      error: "The user is not currently viewing a site audit page. They need to navigate to a site first, or you can use getSiteByName to look up a specific site.",
    });
  }
  return executeSiteAuditStatus(siteId);
}

async function executeGetCheckResult(siteName: string, checkKey: string, fallbackSiteId?: string): Promise<string> {
  const key = checkKey.toUpperCase();
  const check = CHECKLIST.flatMap((cat) => cat.checks).find((c) => c.key === key);
  if (!check) {
    return JSON.stringify({ error: `Check '${checkKey}' not found.` });
  }

  let siteId: string | undefined;
  let resolvedSiteName: string;

  if (siteName === "current") {
    siteId = fallbackSiteId;
    resolvedSiteName = "current site";
    if (!siteId) {
      return JSON.stringify({ error: "User is not viewing a site page. Use a site name instead of 'current'." });
    }
  } else {
    const site = await findSiteByName(siteName);
    if (!site) {
      return JSON.stringify({ error: `No site found matching '${siteName}'.` });
    }
    siteId = site.id;
    resolvedSiteName = site.name;
  }

  const audit = await prisma.audit.findFirst({
    where: { siteId },
    orderBy: { createdAt: "desc" },
    include: { results: { where: { checkKey: key } } },
  });

  if (!audit || audit.results.length === 0) {
    return JSON.stringify({
      site: resolvedSiteName,
      check: { key, name: check.label },
      status: "not_checked",
      notes: null,
      message: "This check has not been evaluated yet.",
    });
  }

  const result = audit.results[0];
  return JSON.stringify({
    site: resolvedSiteName,
    check: { key, name: check.label, description: check.description, automation: check.automation },
    status: result.status,
    notes: result.notes || null,
    source: result.source,
    lastUpdated: result.updatedAt.toISOString().split("T")[0],
  });
}

async function executeGetScanHistory(siteName: string, fallbackSiteId?: string): Promise<string> {
  let siteId: string | undefined;
  let resolvedSiteName: string;

  if (siteName === "current") {
    siteId = fallbackSiteId;
    resolvedSiteName = "current site";
    if (!siteId) {
      return JSON.stringify({ error: "User is not viewing a site page. Use a site name instead." });
    }
  } else {
    const site = await findSiteByName(siteName);
    if (!site) {
      return JSON.stringify({ error: `No site found matching '${siteName}'.` });
    }
    siteId = site.id;
    resolvedSiteName = site.name;
  }

  const audit = await prisma.audit.findFirst({
    where: { siteId },
    orderBy: { createdAt: "desc" },
    include: { scans: { orderBy: { startedAt: "desc" }, take: 10 } },
  });

  if (!audit || audit.scans.length === 0) {
    return JSON.stringify({ site: resolvedSiteName, scans: [], message: "No scans have been run yet." });
  }

  return JSON.stringify({
    site: resolvedSiteName,
    totalScans: audit.scans.length,
    scans: audit.scans.map((s) => ({
      type: s.scanType,
      url: s.url,
      status: s.status,
      findings: (() => { try { return JSON.parse(s.findings).length; } catch { return 0; } })(),
      date: s.startedAt.toISOString().split("T")[0],
      duration: s.completedAt
        ? `${Math.round((s.completedAt.getTime() - s.startedAt.getTime()) / 1000)}s`
        : "in progress",
      error: s.error || null,
    })),
  });
}

async function executeGetComplianceOverview(): Promise<string> {
  const sites = await prisma.site.findMany({
    include: {
      audits: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          results: { select: { status: true } },
          scans: { orderBy: { startedAt: "desc" }, take: 1, select: { startedAt: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  if (sites.length === 0) {
    return JSON.stringify({ message: "No sites in the system yet." });
  }

  const overview = sites.map((s) => {
    const audit = s.audits[0];
    const counts = { ok: 0, issue: 0, na: 0, not_checked: 0 };
    if (audit) {
      for (const r of audit.results) {
        if (r.status in counts) counts[r.status as keyof typeof counts]++;
      }
    }
    return {
      name: s.name,
      platform: s.platform,
      cookiebotConfigured: !!s.cookiebotId,
      gtmConfigured: !!s.gtmId,
      progress: audit ? counts : null,
      lastScan: audit?.scans[0]?.startedAt.toISOString().split("T")[0] || "never",
    };
  });

  return JSON.stringify({ totalSites: sites.length, sites: overview });
}

async function executeTool(name: string, args: Record<string, string>, fallbackSiteId?: string): Promise<string> {
  switch (name) {
    case "listCategories":
      return executeListCategories();
    case "getChecks":
      return executeGetChecks(args.categoryId);
    case "getCheckGuide":
      return executeGetCheckGuide(args.checkKey);
    case "searchChecks":
      return executeSearchChecks(args.query);
    case "listSites":
      return executeListSites();
    case "getSiteByName":
      return executeGetSiteByName(args.name);
    case "getCurrentSiteStatus":
      return executeGetCurrentSiteStatus(fallbackSiteId || "");
    case "getCheckResult":
      return executeGetCheckResult(args.siteName, args.checkKey, fallbackSiteId);
    case "getScanHistory":
      return executeGetScanHistory(args.siteName, fallbackSiteId);
    case "getComplianceOverview":
      return executeGetComplianceOverview();
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

const SYSTEM_PROMPT = `You are GDPR Help, the built-in assistant for this GDPR compliance audit app.
The app is built by Stormfors, a Swedish web agency. "Stormfors" is the company name, NOT the name of this app and NOT a website being audited.
Be concise and practical. Answer in the same language the user writes in.

## CRITICAL RULE: Always use tools
You MUST call at least one tool before answering ANY question about checks, sites, audits, scans, results, issues, compliance, or any data in the app. NEVER answer from memory alone. Even if you think you know the answer, verify with a tool first.

The ONLY questions you may answer without tools are simple navigation questions like "where is the settings page?" or "how do I add a site?".

If the user mentions a company, site, or project name, ALWAYS call getSiteByName or listSites first to check if it exists as a site in the app. Do not assume it refers to the app itself.

## About this app
This app audits websites for GDPR and ePrivacy compliance. It has 69 checks across 11 categories (A through K).

## App pages and navigation
- **Dashboard**: Overview page, entry point
- **Sites** (sidebar): All sites being audited. Click a site to open its audit. Add new sites with +. Each site has URL, platform, optional Cookiebot ID and GTM Container ID.
- **Audit page** (click a site): All 69 checks grouped by category. Each has a status, notes field, and automation badge. Run scans from here.
- **Scans**: "Scan site" runs 18 page checks. "AI Analyze" runs 9 AI checks (costs credits). Cookiebot checks run if Cookiebot ID is set. Re-run individual checks with the play button.
- **Reports**: Generate versioned compliance reports with executive summary and findings. Click "New report" on the audit page.
- **Settings** (sidebar): Database backup/restore, AI/LLM model config, error log.
- **Guide drawer**: Book icon on any check opens step-by-step instructions.

### Reference section (sidebar under "Reference")
These are documentation pages built into the app:
- **Technical Guide**: How Cookiebot, GTM, consent management, and script setup work together technically. Explains the architecture behind the audit checks.
- **Audit Protocol**: Step-by-step protocol for conducting a complete GDPR audit from start to finish.
- **Audit Cheat Sheet**: Quick reference with the most important checks and common issues.
- **MCP Servers**: Overview of Model Context Protocol (MCP) servers for automation. Three servers:
  - Webflow MCP (official): Read/write site headers, footers, custom code. Enables fixes for A1, A2, B1, D1, D3, E1, I4.
  - GTM MCP (community): Read/write GTM tags, triggers, variables. Enables checks A3-A5, B2-B4.
  - Cookiebot: No MCP needed, uses the public cc.js endpoint directly for checks C1-C6, G3.

## Warning triangles
Amber triangles = check needs a Cookiebot ID or GTM Container ID that isn't set. Add via Edit Site (pencil icon).

## Getting started with a new audit
1. Add site (+ in sidebar) with URL and platform
2. Add Cookiebot ID if used (from Cookiebot dashboard or page source)
3. Add GTM Container ID if used (starts with GTM-)
4. "Scan site" for automated checks
5. "AI Analyze" for AI checks
6. Review results, set statuses, add notes
7. Guide drawer (book icon) for manual checks
8. Generate report when done

## Tool reference
- **searchChecks(query)**: Search all 69 checks by keyword
- **listCategories()**: List all 11 categories with check names
- **getChecks(categoryId)**: All checks in a category with details
- **getCheckGuide(checkKey)**: Step-by-step guide for a check
- **listSites()**: All sites with audit summaries
- **getSiteByName(name)**: Look up any site by name
- **getCurrentSiteStatus()**: Audit data for the page the user is on
- **getCheckResult(siteName, checkKey)**: Specific check result for a site
- **getScanHistory(siteName)**: Scan history for a site
- **getComplianceOverview()**: Compare compliance across all sites`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface OpenRouterMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }[];
  tool_call_id?: string;
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const body = await req.json();
    const { messages, siteId } = body as { messages: ChatMessage[]; siteId?: string };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), { status: 400 });
    }

    const apiKey = await getEffectiveAPIKey();
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "No OpenRouter API key configured. Add one in Settings." }),
        { status: 400 },
      );
    }

    const settings = await getAISettings();

    const openRouterMessages: OpenRouterMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    const readable = new ReadableStream({
      async start(controller) {
        function send(data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }

        try {
          for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: settings.primaryModel,
                messages: openRouterMessages,
                tools: TOOLS,
                temperature: 0.3,
              }),
            });

            if (!response.ok) {
              const text = await response.text();
              send({ error: `OpenRouter error ${response.status}: ${text.slice(0, 200)}` });
              controller.close();
              return;
            }

            const data = await response.json();
            const choice = data.choices?.[0];
            if (!choice) {
              send({ error: "No response from model" });
              controller.close();
              return;
            }

            const assistantMessage = choice.message;

            if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
              const content = assistantMessage.content || "";
              const chunkSize = 12;
              for (let i = 0; i < content.length; i += chunkSize) {
                send({ content: content.slice(i, i + chunkSize) });
              }
              send({ done: true, usage: { totalTokens: data.usage?.total_tokens || 0 } });
              controller.close();
              return;
            }

            send({ thinking: true });

            openRouterMessages.push({
              role: "assistant",
              content: assistantMessage.content || null,
              tool_calls: assistantMessage.tool_calls,
            });

            for (const toolCall of assistantMessage.tool_calls) {
              let args: Record<string, string> = {};
              try {
                args = JSON.parse(toolCall.function.arguments);
              } catch {
                args = {};
              }

              const result = await executeTool(toolCall.function.name, args, siteId);

              openRouterMessages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: result,
              });
            }
          }

          send({ content: "I looked up several things but couldn't form a complete answer. Could you rephrase your question?" });
          send({ done: true, usage: { totalTokens: 0 } });
          controller.close();
        } catch (err) {
          send({ error: err instanceof Error ? err.message : "Stream error" });
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500 },
    );
  }
}
