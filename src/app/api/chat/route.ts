import { NextRequest } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/db";
import { CHECKLIST } from "@/lib/checklist";
import { CHECK_GUIDES } from "@/lib/check-guides";
import { MCP_SERVERS } from "@/lib/mcp-servers";
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
  {
    type: "function" as const,
    function: {
      name: "getReferencePage",
      description:
        "Read the content of a reference page in the app. Available pages: 'technical-guide' (how Cookiebot, GTM, and consent work together), 'audit-protocol' (step-by-step audit procedure), 'cheat-sheet' (quick reference for common checks), 'mcp-servers' (MCP server details for automation). Use this when the user asks about any of these topics or pages.",
      parameters: {
        type: "object",
        properties: {
          page: {
            type: "string",
            enum: ["technical-guide", "audit-protocol", "cheat-sheet", "mcp-servers"],
            description: "Which reference page to read",
          },
        },
        required: ["page"],
      },
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

function executeGetReferencePage(page: string): string {
  const docFiles: Record<string, string> = {
    "technical-guide": "docs/technical-configuration-guide.md",
    "audit-protocol": "docs/audit-protocol.md",
    "cheat-sheet": "docs/audit-cheat-sheet.md",
  };

  if (page === "mcp-servers") {
    const servers = MCP_SERVERS.map((s) => ({
      name: s.name,
      platform: s.platform,
      official: s.official,
      status: s.status,
      auth: s.auth,
      description: s.description,
      capabilities: s.capabilities.map((c) => ({
        name: c.name,
        useful: c.useful,
        detail: c.detail,
      })),
      notes: s.notes || [],
    }));
    return JSON.stringify({ page: "MCP Servers", servers });
  }

  const filePath = docFiles[page];
  if (!filePath) {
    return JSON.stringify({ error: `Unknown page '${page}'. Available: technical-guide, audit-protocol, cheat-sheet, mcp-servers` });
  }

  try {
    const content = readFileSync(join(process.cwd(), filePath), "utf-8");
    const truncated = content.length > 8000 ? content.slice(0, 8000) + "\n\n[Content truncated - answer based on what's shown above]" : content;
    return JSON.stringify({ page, content: truncated });
  } catch {
    return JSON.stringify({ error: `Could not read ${page}` });
  }
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
    case "getReferencePage":
      return executeGetReferencePage(args.page);
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

const SYSTEM_PROMPT = `You are GDPR Help, the built-in assistant for this GDPR compliance audit app.
The app is built by Stormfors (a Swedish web agency). "Stormfors" is the company, not a site being audited.
Be concise and practical. Answer in the same language the user writes in.

## CRITICAL: Always use tools first
You MUST call at least one tool before answering ANY question. NEVER answer from memory or from this system prompt alone.

Examples:
- User asks about checks, categories, compliance -> call searchChecks, listCategories, getChecks, or getCheckGuide
- User asks about a site or its results -> call getSiteByName, getCurrentSiteStatus, or listSites
- User asks about scans -> call getScanHistory
- User asks about MCP servers, technical guide, audit protocol, or cheat sheet -> call getReferencePage
- User mentions any name (company, site, project) -> call getSiteByName to check if it's in the database
- User asks "what should I fix?" -> call getCurrentSiteStatus or getComplianceOverview
- User asks about overall status -> call getComplianceOverview

The ONLY exception: simple navigation like "where is settings?" or "how do I add a site?" - answer those directly.

## App structure (for navigation questions only)
Pages in the sidebar: Dashboard, Sites (click to see audit), Reference (Technical Guide, Audit Protocol, Cheat Sheet, MCP Servers), Settings.
On a site's audit page: 69 checks in 11 categories, "Scan site" button, "AI Analyze" button, report generation, guide drawer (book icon).
Warning triangles = missing Cookiebot ID or GTM Container ID. Add via Edit Site (pencil icon).`;

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
