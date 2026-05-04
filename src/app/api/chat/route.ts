import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { CHECKLIST } from "@/lib/checklist";
import { CHECK_GUIDES } from "@/lib/check-guides";
import { getEffectiveAPIKey, getAISettings } from "@/app/actions/ai-settings";

export const dynamic = "force-dynamic";

const MAX_TOOL_ROUNDS = 5;

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "listCategories",
      description:
        "List all 11 audit categories with their IDs, names, and how many checks each has. Use this to get an overview of what the audit covers or to find which category a topic belongs to.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getChecks",
      description:
        "Get all checks in a specific category. Returns each check's key, full name, description, and how it's automated. Use this when the user asks about a topic area (e.g. cookies, consent, forms, tracking) or when you need to find specific checks.",
      parameters: {
        type: "object",
        properties: {
          categoryId: {
            type: "string",
            description:
              "The category ID letter (A through K). Call listCategories first if you don't know the ID.",
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
        "Get the detailed guide for a specific check: why it matters, step-by-step instructions, tools to use, and practical tips. Use this when the user asks how to check or fix something specific.",
      parameters: {
        type: "object",
        properties: {
          checkKey: {
            type: "string",
            description:
              "The check key (e.g. 'A1', 'C3', 'G4'). Call getChecks first if you need to find the right key.",
          },
        },
        required: ["checkKey"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getSiteStatus",
      description:
        "Get the current audit status for the site the user is viewing: site info, configuration, audit progress, and which checks have issues. The site is identified automatically from the page the user is on - you do not need to provide any ID. Use this when the user asks 'what should I fix?', 'how is this site doing?', or anything about the current site's results.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

function executeListCategories(): string {
  const categories = CHECKLIST.map((cat) => ({
    id: cat.id,
    name: cat.label,
    checkCount: cat.checks.length,
    checks: cat.checks.map((c) => `${c.key}: ${c.label}`),
  }));
  return JSON.stringify(categories);
}

function executeGetChecks(categoryId: string): string {
  const cat = CHECKLIST.find((c) => c.id === categoryId.toUpperCase());
  if (!cat) return JSON.stringify({ error: `Category '${categoryId}' not found. Use listCategories to see valid IDs.` });

  const checks = cat.checks.map((c) => ({
    key: c.key,
    name: c.label,
    description: c.description,
    automation: c.automation,
    legalBasis: c.legalBasis || null,
  }));
  return JSON.stringify({ category: cat.label, checks });
}

function executeGetCheckGuide(checkKey: string): string {
  const key = checkKey.toUpperCase();
  const guide = CHECK_GUIDES[key];
  const check = CHECKLIST.flatMap((cat) => cat.checks).find((c) => c.key === key);

  if (!guide && !check) {
    return JSON.stringify({ error: `Check '${checkKey}' not found. Use getChecks to find valid keys.` });
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

async function executeGetSiteStatus(siteId: string): Promise<string> {
  try {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        audits: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { results: true },
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
      result.auditStatus = "No audit results yet. The user should run a scan first.";
      return JSON.stringify(result);
    }

    const counts = { ok: 0, issue: 0, na: 0, not_checked: 0 };
    for (const r of audit.results) {
      if (r.status in counts) counts[r.status as keyof typeof counts]++;
    }
    result.progress = counts;

    const issues = audit.results.filter((r) => r.status === "issue");
    if (issues.length > 0) {
      const allChecks = CHECKLIST.flatMap((cat) => cat.checks);
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

    return JSON.stringify(result);
  } catch {
    return JSON.stringify({ error: "Failed to load site data" });
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
    case "getSiteStatus":
      return executeGetSiteStatus(args.siteId || fallbackSiteId || "");
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

const SYSTEM_PROMPT = `You are a GDPR compliance assistant built into the Stormfors audit app.
Help users understand checks, scan results, what actions to take, and how to use the app.
Be concise and practical. Answer in the same language the user writes in.

## About this app
This app audits websites for GDPR and ePrivacy compliance. It has 69 checks across 11 categories (A through K), covering script setup, consent banners, cookies, tracking, forms, embeds, privacy policies, and more.

## How to navigate the app
- **Dashboard**: Overview page with quick links
- **Sites list** (left sidebar): All sites being audited. Click a site to open its audit page. Add new sites with the + button. Each site has a URL, platform, and optional Cookiebot ID and GTM Container ID.
- **Audit page**: Shows all 69 checks grouped by category. Each check has a status (OK, Issue, N/A, or Not checked), notes field, and automation badge showing how it's tested.
- **Running scans**: Click "Scan site" to run 18 automated page checks. Click "AI Analyze" to run 9 AI-powered checks (uses OpenRouter credits). Cookiebot checks run automatically if a Cookiebot ID is set. Individual checks can be re-run with the play button.
- **Reports**: Generate versioned compliance reports with an executive summary and detailed findings. Click "New report" on the audit page.
- **Settings**: Database backup/restore, AI model configuration, error log. Access from the sidebar.
- **Guide drawer**: Click the book icon on any check to see detailed instructions for that specific check.

## Reference pages (in the sidebar under "Reference")
- **Technical Guide**: Detailed technical documentation covering how Cookiebot, GTM, consent management, and script setup work together. Explains the technical architecture behind the audit checks.
- **Audit Protocol**: Step-by-step protocol for conducting a complete GDPR audit from start to finish. Covers preparation, execution, and reporting phases.
- **Audit Cheat Sheet**: Quick reference card with the most important checks and common issues to look for.
- **MCP Servers**: Overview of Model Context Protocol servers used for automation. Lists available MCP servers for Webflow, GTM, and Cookiebot with their capabilities, setup instructions, and what audit checks they enable. MCP servers allow the app to read and modify site configurations programmatically.

## Warning triangles
Amber warning triangles appear on checks that need a Cookiebot ID or GTM Container ID that hasn't been added to the site yet. Go to Edit Site (pencil icon) to add the IDs.

## Getting started with a new audit
1. Add the site (+ button in sidebar) with its URL and platform
2. If the site uses Cookiebot, add the Cookiebot ID (found in the Cookiebot dashboard or in the page source)
3. If the site uses GTM, add the GTM Container ID (starts with GTM-)
4. Click "Scan site" to run automated checks
5. Click "AI Analyze" for AI-powered checks
6. Review results, set statuses, add notes for anything that needs attention
7. Handle manual checks using the step-by-step guides (book icon)
8. Generate a report when the audit is complete

## Your tools
You have access to tools that let you look up check details, guides, and the current site's audit status. Use them to give specific, accurate answers. Don't guess about check details - look them up.

When the user asks about a topic (cookies, consent, tracking, etc.), use listCategories and getChecks to find the relevant checks. When they ask "what should I fix first?" or about the current site's results, use getSiteStatus - it automatically returns data for the site the user is currently viewing.

IMPORTANT: getSiteStatus can only see the site the user is currently viewing. You cannot look up other sites by name. If the user asks about a site they are not currently viewing, tell them to navigate to that site's audit page first. If they ask about a site that doesn't exist, suggest they add it using the + button in the sidebar.`;

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

          const fallback = "I looked up several things but couldn't form a complete answer. Could you rephrase your question?";
          send({ content: fallback });
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
