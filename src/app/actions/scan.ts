"use server";

import { scanSite, type ScanResult } from "@/lib/scanner";
import { runAICheck, AI_CHECK_KEYS, getSessionAICost, resetSessionAICost } from "@/lib/ai-agent";
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
    const result = await scanSite(url, site?.platform, {
      storedCookiebotId: site?.cookiebotId || undefined,
      storedGtmId: site?.gtmId || undefined,
    });

    if (result.detectedGtmId && !result.detectedCookiebotId && !site?.cookiebotId && isGtmConfigured()) {
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
        `Couldn't get data from Cookiebot for ID ${cookiebotId}. This usually means the ID is wrong or the Cookiebot subscription has expired. Double-check the ID in admin.cookiebot.com and make sure the subscription is active.`,
        "Cookiebot not responding",
      );
    }
    return runCookiebotChecks(data);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return cookiebotFailureResults(
      `Something went wrong checking Cookiebot: ${errMsg}. Try scanning again - if it keeps failing, verify the Cookiebot ID in admin.cookiebot.com.`,
      "Cookiebot check failed",
    );
  }
}

const GTM_CHECK_KEYS = ["A3", "A4", "A5", "B2", "B3", "B4"];

function gtmFailureResults(detail: string, summary: string, status: "blocked" | "client_managed" = "blocked"): CheckResult[] {
  return GTM_CHECK_KEYS.map((checkKey) => ({
    checkKey,
    status,
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
      "The GTM API connection isn't set up yet. Go to Settings and connect your Google account to enable these checks.",
      "GTM API not connected",
    );
  }

  try {
    const container = await getContainerInfo(gtmId.trim());
    const workspaces = await listWorkspaces(container.accountId, container.containerId);
    const defaultWs = workspaces.find((w) => w.name === "Default Workspace") || workspaces[0];
    if (!defaultWs) {
      return gtmFailureResults(
        "This GTM container looks empty - no workspace was found inside it. It might be a new container that hasn't been set up yet. Check tagmanager.google.com to see if it has any tags configured.",
        "GTM container is empty",
      );
    }

    const tags = await listTags(container.accountId, container.containerId, defaultWs.workspaceId);
    const triggers = await listTriggers(container.accountId, container.containerId, defaultWs.workspaceId);

    return runGtmChecks(tags, triggers);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const isNoAccess = /forbidden|403|permission|access|not found/i.test(msg);
    const detail = isNoAccess
      ? `We can't see inside this GTM container (${gtmId}) because it's not in our Google account. The client probably manages it themselves.\n\nWhat you can do:\n- Ask the client to invite our Google account as a reader in their GTM (Admin > User Management)\n- Or ask the client to check these items themselves in tagmanager.google.com\n- Or log into the client's GTM directly if they share access`
      : `Something went wrong connecting to the GTM API: ${msg}. Try scanning again - if it keeps failing, check that the GTM OAuth credentials in Settings are still valid.`;
    return gtmFailureResults(detail, isNoAccess ? "Client managed?" : "GTM connection error", isNoAccess ? "client_managed" : "blocked");
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

export async function runAllAIChecks(url: string, priorResults: CheckResult[] = []): Promise<{ checks: CheckResult[]; cost: number }> {
  if (!url || url.trim().length === 0) return { checks: [], cost: 0 };

  resetSessionAICost();
  const results = await Promise.allSettled(
    AI_CHECK_KEYS.map((key) => runAICheck(key, url, priorResults))
  );
  const cost = getSessionAICost();

  const checks = results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return {
      checkKey: AI_CHECK_KEYS[i],
      status: "na" as const,
      findings: [{ element: "", detail: `AI check failed: ${r.reason instanceof Error ? r.reason.message : "Unknown error"}`, severity: "warning" as const }],
      summary: "AI check failed",
    };
  });

  return { checks, cost };
}
