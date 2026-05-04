import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { CHECKLIST } from "@/lib/checklist";
import { CHECK_GUIDES } from "@/lib/check-guides";
import { getEffectiveAPIKey, getAISettings } from "@/app/actions/ai-settings";

export const dynamic = "force-dynamic";

function buildCheckReference(): string {
  const lines: string[] = [];
  for (const cat of CHECKLIST) {
    lines.push(`\n### ${cat.id}. ${cat.label}`);
    for (const check of cat.checks) {
      lines.push(`- **${check.key}**: ${check.label} — ${check.description} [${check.automation}]`);
    }
  }
  return lines.join("\n");
}

function buildGuideReference(): string {
  const lines: string[] = [];
  for (const [key, guide] of Object.entries(CHECK_GUIDES)) {
    lines.push(`**${key} — ${guide.title}**: ${guide.why}`);
    if (guide.steps.length > 0) {
      lines.push(`Steps: ${guide.steps.join(" → ")}`);
    }
  }
  return lines.join("\n");
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
          lines.push(`- ${r.checkKey}: ${r.notes || "(no notes)"}`);
        }
      }
    }
    return lines.join("\n");
  } catch {
    return "";
  }
}

function buildSystemPrompt(checkRef: string, guideRef: string, siteContext: string): string {
  return `You are a GDPR compliance assistant built into the Stormfors audit app.
Help users understand checks, scan results, and what actions to take.
Be concise and practical. Answer in the same language the user writes in.

## App navigation
- Sites list: add/edit/delete sites, each has URL + platform + optional Cookiebot/GTM IDs
- Audit page: 69 checks across 11 categories, run scans, review results
- Reports: generate versioned reports with summary and findings
- Settings: database backup, AI/LLM model settings, error log

## Warning triangles
Checks show amber triangles when they need a Cookiebot ID or GTM Container ID that hasn't been added in site settings. Add IDs via the Edit Site dialog (pencil icon on the site header).

## Running scans
- "Scan site" runs 18 page scan checks (HTML analysis with cheerio)
- "AI Analyze" runs 9 AI checks (costs OpenRouter credits)
- Cookiebot checks run automatically if a Cookiebot ID is set on the site
- GTM API checks need a GTM Container ID and run individually per check
- Individual checks can be re-run with the play button on each row

## Check reference
${checkRef}

## Check guides (why + steps)
${guideRef}
${siteContext}`;
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
    const checkRef = buildCheckReference();
    const guideRef = buildGuideReference();
    const siteContext = siteId ? await buildSiteContext(siteId) : "";
    const systemPrompt = buildSystemPrompt(checkRef, guideRef, siteContext);

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
