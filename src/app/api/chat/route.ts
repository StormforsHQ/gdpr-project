import { NextRequest } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/db";
import { CHECKLIST } from "@/lib/checklist";
import { CHECK_GUIDES } from "@/lib/check-guides";
import { REMEDIATION } from "@/lib/remediation";
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
        "List all audit categories with their IDs, names, check count, and check names. Use this to get an overview of what the audit covers, to find which category a topic belongs to, or to orient before answering a general question.",
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
            description: "The category ID (e.g. 'pre', 'A', 'B', ... 'K'). Call listCategories first if you don't know the ID.",
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
        "Get the detailed guide for a specific check: why it matters, step-by-step audit instructions, tools to use, practical tips, AND how to fix issues (remediation steps with platform-specific instructions). Use this when the user asks how to check or fix something, or wants to understand why a check matters.",
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
        "Search all checks by keyword. Searches check names, descriptions, and legal basis text. Returns matching checks with their category, name, and description. Use this when the user asks about a topic and you need to find relevant checks without knowing the category.",
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
        "Read the content of a reference page in the app. Available pages: 'technical-guide' (how Cookiebot, GTM, and consent work together), 'audit-protocol' (step-by-step audit procedure), 'cheat-sheet' (quick reference for common checks), 'mcp-servers' (MCP server details for automation), 'fix-flow' (how to fix issues found during scans - the complete guided flow for cleaning up scripts, what's automated vs manual, warnings and safety). Use this when the user asks about fixing issues, the fix flow, cleanup steps, or how to remediate problems.",
      parameters: {
        type: "object",
        properties: {
          page: {
            type: "string",
            enum: ["technical-guide", "audit-protocol", "cheat-sheet", "mcp-servers", "fix-flow"],
            description: "Which reference page to read",
          },
        },
        required: ["page"],
      },
    },
  },
];

const WEB_SEARCH_TOOL = { type: "openrouter:web_search" as const };

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
  const cat = CHECKLIST.find((c) => c.id.toLowerCase() === categoryId.toLowerCase());
  if (!cat) return JSON.stringify({ error: `Category '${categoryId}' not found. Call listCategories to see valid IDs.` });

  return JSON.stringify({
    category: cat.label,
    checks: cat.checks.map((c) => ({
      key: c.key,
      name: c.label,
      description: c.description,
      automation: c.automation,
      tier: c.tier,
      responsibility: c.responsibility || "agency",
      legalBasis: c.legalBasis || null,
    })),
  });
}

function executeGetCheckGuide(checkKey: string): string {
  const key = checkKey.toUpperCase();
  const guide = CHECK_GUIDES[key];
  const check = CHECKLIST.flatMap((cat) => cat.checks).find((c) => c.key === key);
  const remediation = REMEDIATION[key];

  if (!guide && !check) {
    return JSON.stringify({ error: `Check '${checkKey}' not found. Use searchChecks to find the right key.` });
  }

  const result: Record<string, unknown> = {};
  if (check) {
    result.key = check.key;
    result.name = check.label;
    result.description = check.description;
    result.automation = check.automation;
    result.tier = check.tier;
    result.responsibility = check.responsibility || "agency";
    result.legalBasis = check.legalBasis || null;
  }
  if (guide) {
    result.why = guide.why;
    result.steps = guide.steps;
    result.tools = guide.tools || [];
    result.tips = guide.tips || [];
  }
  if (remediation) {
    result.remediation = {
      explanation: remediation.plainExplanation,
      fixSteps: remediation.steps.map((s) => ({
        instruction: s.instruction,
        platform: s.platform || "all",
        needsDevOrLegal: s.needsDevOrLegal || false,
      })),
      devLegalNote: remediation.devLegalNote || null,
      docLinks: remediation.docLinks || [],
    };
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
      tier: c.tier,
      responsibility: c.responsibility || "agency",
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
    "fix-flow": "docs/fix-flow-guide.md",
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
    return JSON.stringify({ error: `Unknown page '${page}'. Available: technical-guide, audit-protocol, cheat-sheet, mcp-servers, fix-flow` });
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
- User asks about MCP servers, technical guide, audit protocol, cheat sheet, or how to fix issues -> call getReferencePage
- User mentions any name (company, site, project) -> call getSiteByName to check if it's in the database
- User asks "what should I fix?" -> call getCurrentSiteStatus or getComplianceOverview
- User asks about overall status -> call getComplianceOverview
- User asks about a vendor, DPA, DPF certification, or something outside the app's data -> use web search

The ONLY exception: simple navigation like "where is settings?" or "how do I add a site?" - answer those directly.

NEVER answer with hardcoded knowledge about GDPR rules, check details, remediation steps, or compliance requirements. Always look it up using tools first - the app's data is the source of truth, not your training data. If you can't find the answer via tools, try web search. If you still can't find the answer, say so and suggest where to look.

## Check metadata
Each check has these properties (returned by tools):
- **tier**: "basic" (enforcement risk) or "full" (best practice). But the main filter is **coverage type**: SLA sites see a curated set of essential checks, no-SLA and US-based sites see their own smaller sets, and "unknown" coverage defaults to basic/full tiers
- **automation**: how the check runs - "page-scan" (automatic), "ai-agent" (AI), "gtm-api", "cookiebot-api", "human" (manual), etc.
- **responsibility**: who is responsible for this check:
  - "agency" (default) - our technical responsibility (scripts, config, setup)
  - "client" - the client's organizational responsibility (internal processes like breach plans, ROPA). Our job is to ask if they have it and flag it if they don't.
  - "content-author" - responsibility of whoever writes the content (privacy policy text, legal language). We check it but the content is not ours to write.

When answering, always mention the responsibility if it's "client" or "content-author" so the user knows what's their job vs what they need to communicate to the client.

## Vendor detection (J1, J3)
The scan automatically detects third-party services from the site's scripts (Google Analytics, Meta Pixel, HubSpot, etc.) and reports:
- DPA status: whether the service's Data Processing Agreement is covered by their ToS or needs the client to verify in their account settings
- DPF certification: whether US vendors are certified under the EU-US Data Privacy Framework
This data comes from the scan results. If the user asks about a specific vendor not in the app's data, use web search to check.

## Platform awareness
Sites can be on different platforms (Webflow, HubSpot, Next.js, WordPress, other). When giving advice:
- Always check the site's platform first (it's in the site data from tools)
- GTM and Cookiebot apply to ALL platforms - they are universal
- Platform-specific IDs (Webflow Site ID, HubSpot Hub ID) are only relevant for their platform
- Fix instructions differ by platform: Webflow has API-based fixes, other platforms need manual steps
- Missing IDs are auto-detected during scanning - users don't need to manually enter them unless auto-detection fails

## App structure (for navigation questions only)
Pages in the sidebar: Dashboard, Sites (click to see audit), Reference (Technical Guide, Audit Protocol, Cheat Sheet, Fix Flow Guide, MCP Servers), Settings.
On a site's audit page: checks grouped by category (Pre-check, then A through K), "Scan site" button, report generation, guide drawer (book icon).
Filter bar: a view dropdown (SLA essentials, No SLA, US-based, Basic, Full) to scope checks by coverage type, plus status badges (OK, Issue, N/A, Not checked) and a check type dropdown. For no-SLA and US-based sites, Cookiebot and GTM API scans are skipped since those checks aren't in their essential sets.
Warning triangles = missing Cookiebot ID or GTM Container ID. Add via Edit Site (pencil icon).
"Sync from Webflow" button on Sites page imports all Webflow workspace sites. "Detect IDs from site" in Edit Site scans the URL for GTM, Cookiebot, and platform-specific IDs.`;

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
                tools: [...TOOLS, WEB_SEARCH_TOOL],
                temperature: 0.3,
              }),
            });

            if (!response.ok) {
              const status = response.status;
              if (status === 401 || status === 403) {
                send({ error: "API key is invalid or expired. Check your key in Settings." });
              } else if (status === 402) {
                send({ error: "Out of OpenRouter credits. Top up your balance at openrouter.ai." });
              } else if (status === 429) {
                send({ error: "Too many requests - wait a moment and try again." });
              } else if (status >= 500) {
                send({ error: "The AI service is temporarily unavailable. Try again in a minute." });
              } else {
                send({ error: "Couldn't reach the AI service. Try again or check Settings." });
              }
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
              if (!toolCall.function) continue;

              let result: string;
              try {
                let args: Record<string, string> = {};
                try {
                  args = JSON.parse(toolCall.function.arguments);
                } catch {
                  args = {};
                }
                result = await executeTool(toolCall.function.name, args, siteId);
              } catch (toolErr) {
                console.error(`Tool ${toolCall.function.name} failed:`, toolErr);
                result = JSON.stringify({ error: "Could not look this up right now. Try again." });
              }

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
          console.error("Chat stream error:", err);
          send({ error: "Something went wrong. Try again or refresh the page." });
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
    console.error("Chat POST error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Try again or refresh the page." }),
      { status: 500 },
    );
  }
}
