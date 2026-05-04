import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { CHECKLIST, type CheckCategory } from "@/lib/checklist";
import { CHECK_GUIDES } from "@/lib/check-guides";
import { getEffectiveAPIKey, getAISettings } from "@/app/actions/ai-settings";

export const dynamic = "force-dynamic";

function buildCheckIndex(): string {
  const lines: string[] = [];
  for (const cat of CHECKLIST) {
    const keys = cat.checks.map((c) => c.key).join(", ");
    lines.push(`- **${cat.id}. ${cat.label}**: ${keys}`);
  }
  return lines.join("\n");
}

function findRelevantChecks(userMessage: string): string {
  const upper = userMessage.toUpperCase();
  const relevant: string[] = [];

  for (const cat of CHECKLIST) {
    const catMentioned = upper.includes(cat.id + ".") || upper.includes(cat.label.toUpperCase());

    for (const check of cat.checks) {
      const checkMentioned = upper.includes(check.key);
      if (checkMentioned || catMentioned) {
        let detail = `**${check.key}**: ${check.label} - ${check.description} [${check.automation}]`;
        const guide = CHECK_GUIDES[check.key];
        if (guide) {
          detail += `\n  Why: ${guide.why}`;
          detail += `\n  Steps: ${guide.steps.join(" -> ")}`;
        }
        relevant.push(detail);
      }
    }
  }

  return relevant.length > 0
    ? `\n## Relevant check details\n${relevant.join("\n\n")}`
    : "";
}

function findTopicChecks(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  const topicMap: Record<string, string[]> = {
    cookiebot: ["C1", "C2", "C3", "C4", "C5", "C6", "G3"],
    consent: ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9"],
    gtm: ["A3", "A4", "A5", "B1", "B2", "B3", "B4"],
    script: ["A1", "A2", "D1", "D3"],
    privacy: ["I1", "I2", "I3", "I4", "I5", "I6", "I7", "I8"],
    form: ["F1", "F2", "F3", "F4", "F5", "F6"],
    embed: ["E1", "E2", "E3", "E4", "E5", "E6"],
    tracking: ["D1", "D2", "D3", "H6", "H8"],
    cookie: ["C1", "C2", "C3", "C4", "C5", "C6", "H6"],
    scan: ["A1", "A2", "B1", "B5", "D1", "D3", "E1", "E2", "E3", "E4", "E5", "F1", "F3", "F5", "G1", "G8", "I3", "I4"],
    fix: ["A1", "A2", "B1", "D1", "D3", "E1", "I4", "A3", "A4", "A5", "B3", "B4"],
  };

  const matchedKeys = new Set<string>();
  for (const [topic, keys] of Object.entries(topicMap)) {
    if (lower.includes(topic)) {
      keys.forEach((k) => matchedKeys.add(k));
    }
  }

  if (matchedKeys.size === 0) return "";

  const allChecks = CHECKLIST.flatMap((cat) => cat.checks);
  const details = [...matchedKeys].slice(0, 15).map((key) => {
    const check = allChecks.find((c) => c.key === key);
    if (!check) return "";
    return `**${check.key}**: ${check.label} - ${check.description} [${check.automation}]`;
  }).filter(Boolean);

  return details.length > 0
    ? `\n## Topic-related checks\n${details.join("\n")}`
    : "";
}

async function buildSiteContext(siteId: string): Promise<string> {
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
    if (!site) return "";

    const lines: string[] = [
      `\n## Current site context`,
      `Site: ${site.name}`,
      `URL: ${site.url}`,
      `Platform: ${site.platform}`,
      site.cookiebotId ? `Cookiebot ID: ${site.cookiebotId}` : "Cookiebot ID: not set",
      site.gtmId ? `GTM Container ID: ${site.gtmId}` : "GTM Container ID: not set",
    ];

    const audit = site.audits[0];
    if (audit && audit.results.length > 0) {
      const statusCounts = { ok: 0, issue: 0, na: 0, not_checked: 0 };
      for (const r of audit.results) {
        if (r.status in statusCounts) statusCounts[r.status as keyof typeof statusCounts]++;
      }
      lines.push(`\nAudit progress: ${statusCounts.ok} OK, ${statusCounts.issue} issues, ${statusCounts.na} N/A, ${statusCounts.not_checked} not checked`);

      const issues = audit.results.filter((r) => r.status === "issue");
      if (issues.length > 0) {
        lines.push("\nChecks with issues:");
        for (const r of issues) {
          const check = CHECKLIST.flatMap((cat) => cat.checks).find((c) => c.key === r.checkKey);
          lines.push(`- ${r.checkKey} (${check?.label ?? "unknown"}): ${r.notes || "(no notes)"}`);
        }
      }
    }
    return lines.join("\n");
  } catch {
    return "";
  }
}

function buildSystemPrompt(siteContext: string, relevantChecks: string, topicChecks: string): string {
  const checkIndex = buildCheckIndex();

  return `You are a GDPR compliance assistant built into the Stormfors audit app.
Help users understand checks, scan results, and what actions to take.
Be concise and practical. Answer in the same language the user writes in.

## App overview
This app audits websites for GDPR and ePrivacy compliance. It has 69 checks across 11 categories, automated scanning, AI analysis, and report generation.

## App navigation
- Sites list: add/edit/delete sites, each has URL + platform + optional Cookiebot/GTM IDs
- Audit page: 69 checks in 11 categories, run scans, review results, set statuses
- Reports: generate versioned PDF-ready reports with executive summary and findings
- Settings: database backup, AI/LLM model settings, error log

## How scans work
- "Scan site" runs 18 page scan checks (HTML analysis)
- "AI Analyze" runs 9 AI checks (costs OpenRouter credits)
- Cookiebot checks run automatically if a Cookiebot ID is set
- GTM API checks need a GTM Container ID and run individually
- Individual checks can be re-run with the play button on each row

## Warning triangles
Amber triangles appear when a check needs a Cookiebot ID or GTM Container ID that hasn't been added. Add IDs via Edit Site (pencil icon).

## Check index (69 checks, 11 categories)
${checkIndex}

If the user asks about a specific check, use the detailed information below. If they ask a general question, use the index to orient your answer.
${relevantChecks}${topicChecks}${siteContext}`;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
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
    const lastUserMsg = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
    const relevantChecks = findRelevantChecks(lastUserMsg);
    const topicChecks = relevantChecks ? "" : findTopicChecks(lastUserMsg);
    const siteContext = siteId ? await buildSiteContext(siteId) : "";
    const systemPrompt = buildSystemPrompt(siteContext, relevantChecks, topicChecks);

    const openRouterMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: settings.primaryModel,
        messages: openRouterMessages,
        stream: true,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return new Response(
        JSON.stringify({ error: `OpenRouter error ${response.status}: ${text.slice(0, 200)}` }),
        { status: 502 },
      );
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let totalTokens = 0;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;
              const data = trimmed.slice(6);
              if (data === "[DONE]") {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, usage: { totalTokens } })}\n\n`));
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
                }
                if (parsed.usage?.total_tokens) {
                  totalTokens = parsed.usage.total_tokens;
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Stream error" })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500 },
    );
  }
}
