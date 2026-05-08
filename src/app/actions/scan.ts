"use server";

import { scanSite, type ScanResult } from "@/lib/scanner";
import { runAICheck, AI_CHECK_KEYS } from "@/lib/ai-agent";
import { fetchCookiebotData, runCookiebotChecks } from "@/lib/cookiebot";
import { isGtmConfigured, findCookiebotIdInContainer, getContainerInfo, listTags, listTriggers, listWorkspaces } from "@/lib/api/gtm";
import { runGtmChecks } from "@/lib/gtm-checks";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getEffectiveAPIKey } from "@/app/actions/ai-settings";
import type { CheckResult } from "@/lib/scanner";

export async function checkOpenRouterCredits(): Promise<{ available: boolean; credits: number; error?: string }> {
  const apiKey = await getEffectiveAPIKey();
  if (!apiKey) {
    return { available: false, credits: 0, error: "No OpenRouter API key configured. Add one in Settings." };
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      return { available: false, credits: 0, error: `API returned ${res.status}` };
    }

    const data = await res.json();
    const credits = data.data?.limit_remaining ?? data.data?.usage ?? 0;
    const hasLimit = data.data?.limit != null;
    const remaining = hasLimit ? (data.data.limit - (data.data.usage ?? 0)) : Infinity;

    return {
      available: remaining > 0.01,
      credits: Math.round(remaining * 100) / 100,
    };
  } catch {
    return { available: false, credits: 0, error: "Failed to check credits" };
  }
}

export async function runPageScan(url: string, siteId?: string): Promise<ScanResult> {
  if (!url || url.trim().length === 0) {
    return {
      url: "",
      scannedAt: new Date().toISOString(),
      checks: [],
      error: "URL is required",
    };
  }

  try {
    const site = siteId ? await prisma.site.findUnique({ where: { id: siteId }, select: { id: true, platform: true, cookiebotId: true, gtmId: true, webflowId: true, url: true } }) : null;
    const result = await scanSite(url, site?.platform);

    // If GTM ID found but no Cookiebot ID in HTML, try the GTM API
    if (result.detectedGtmId && !result.detectedCookiebotId && isGtmConfigured()) {
      try {
        const cbid = await findCookiebotIdInContainer(result.detectedGtmId);
        if (cbid) result.detectedCookiebotId = cbid;
      } catch (gtmErr) {
        console.error("GTM lookup for Cookiebot ID failed:", gtmErr);
      }
    }

    if (siteId && site) {
      try {
        const updates: { cookiebotId?: string; gtmId?: string; webflowId?: string } = {};
        if (result.detectedCookiebotId && site.cookiebotId !== result.detectedCookiebotId) {
          updates.cookiebotId = result.detectedCookiebotId;
        }
        if (result.detectedGtmId && site.gtmId !== result.detectedGtmId) {
          updates.gtmId = result.detectedGtmId;
        }
        if (!site.webflowId && site.platform === "webflow") {
          const domain = site.url.replace(/^www\./, "").toLowerCase();
          const match = await prisma.site.findFirst({
            where: {
              platform: "webflow",
              webflowId: { not: null },
              url: { contains: domain },
              id: { not: site.id },
            },
            select: { webflowId: true },
          });
          if (match?.webflowId) updates.webflowId = match.webflowId;
        }
        if (Object.keys(updates).length > 0) {
          await prisma.site.update({ where: { id: siteId }, data: updates });
          revalidatePath(`/sites/${siteId}`);
        }
      } catch (dbErr) {
        console.error("Failed to auto-save detected IDs:", dbErr);
      }
    }

    return result;
  } catch (error) {
    console.error("Page scan failed:", error);
    return {
      url,
      scannedAt: new Date().toISOString(),
      checks: [],
      error: error instanceof Error ? error.message : "Scan failed",
    };
  }
}

const COOKIEBOT_CHECK_KEYS = ["C1", "C2", "C3", "C4", "C5", "C6"];

function cookiebotFailureResults(detail: string, summary: string): CheckResult[] {
  return COOKIEBOT_CHECK_KEYS.map((checkKey) => ({
    checkKey,
    status: "blocked" as const,
    findings: [{ element: "", detail, severity: "warning" as const }],
    summary,
  }));
}

export async function runCookiebotScan(cookiebotId: string, siteUrl?: string): Promise<CheckResult[]> {
  if (!cookiebotId || cookiebotId.trim().length === 0) {
    return cookiebotFailureResults("Cookiebot ID is required", "No Cookiebot ID provided");
  }

  try {
    const referer = siteUrl ? new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`).hostname : undefined;
    const data = await fetchCookiebotData(cookiebotId.trim(), referer);
    if (!data) {
      return cookiebotFailureResults(
        `Could not fetch data for Cookiebot ID: ${cookiebotId}. Check that the ID is correct and the Cookiebot subscription is active.`,
        "Cookiebot data unavailable",
      );
    }
    return runCookiebotChecks(data);
  } catch (error) {
    return cookiebotFailureResults(
      error instanceof Error ? error.message : "Cookiebot scan failed",
      "Cookiebot scan failed",
    );
  }
}

const GTM_CHECK_KEYS = ["A3", "A4", "A5", "B2", "B3", "B4"];

function gtmFailureResults(detail: string, summary: string): CheckResult[] {
  return GTM_CHECK_KEYS.map((checkKey) => ({
    checkKey,
    status: "blocked" as const,
    findings: [{ element: "", detail, severity: "warning" as const }],
    summary,
  }));
}

export async function runGtmScan(gtmId: string): Promise<CheckResult[]> {
  if (!gtmId || gtmId.trim().length === 0) {
    return gtmFailureResults("GTM ID is required", "No GTM ID provided");
  }

  if (!isGtmConfigured()) {
    return gtmFailureResults(
      "GTM API not configured (missing OAuth credentials). Set up GTM OAuth in Settings to enable these checks.",
      "GTM API not available",
    );
  }

  try {
    const container = await getContainerInfo(gtmId.trim());
    const workspaces = await listWorkspaces(container.accountId, container.containerId);
    const defaultWs = workspaces.find((w) => w.name === "Default Workspace") || workspaces[0];
    if (!defaultWs) {
      return gtmFailureResults(
        "No workspace found in this GTM container. The container may be empty or misconfigured.",
        "GTM workspace not found",
      );
    }

    const tags = await listTags(container.accountId, container.containerId, defaultWs.workspaceId);
    const triggers = await listTriggers(container.accountId, container.containerId, defaultWs.workspaceId);

    return runGtmChecks(tags, triggers);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const isNoAccess = /forbidden|403|permission|access|not found/i.test(msg);
    const detail = isNoAccess
      ? `Our Google account doesn't have access to this GTM container (${gtmId}). This usually means the client manages their own GTM. To run these checks: ask the client to grant read access to our Google account, or log into their GTM at tagmanager.google.com and check these items manually.`
      : `GTM API error: ${msg}`;
    return gtmFailureResults(detail, isNoAccess ? "No access to GTM container" : "GTM scan failed");
  }
}

export async function runSingleAICheck(checkKey: string, url: string): Promise<CheckResult> {
  if (!url || url.trim().length === 0) {
    return {
      checkKey,
      status: "na",
      findings: [{ element: "", detail: "URL is required", severity: "warning" }],
      summary: "No URL provided",
    };
  }

  return runAICheck(checkKey, url);
}

export async function runAllAIChecks(url: string): Promise<CheckResult[]> {
  if (!url || url.trim().length === 0) return [];

  const results = await Promise.allSettled(
    AI_CHECK_KEYS.map((key) => runAICheck(key, url))
  );

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return {
      checkKey: AI_CHECK_KEYS[i],
      status: "na" as const,
      findings: [{ element: "", detail: `AI check failed: ${r.reason instanceof Error ? r.reason.message : "Unknown error"}`, severity: "warning" as const }],
      summary: "AI check failed",
    };
  });
}
