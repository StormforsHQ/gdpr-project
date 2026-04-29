"use server";

import { scanSite, type ScanResult } from "@/lib/scanner";
import { runAICheck, AI_CHECK_KEYS } from "@/lib/ai-agent";
import { fetchCookiebotData, runCookiebotChecks } from "@/lib/cookiebot";
import { prisma } from "@/lib/db";
import type { CheckResult } from "@/lib/scanner";

export async function checkOpenRouterCredits(): Promise<{ available: boolean; credits: number; error?: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { available: false, credits: 0, error: "OPENROUTER_API_KEY not configured" };
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
    const result = await scanSite(url);

    if (result.detectedCookiebotId && siteId) {
      try {
        const site = await prisma.site.findUnique({ where: { id: siteId } });
        if (site && !site.cookiebotId) {
          await prisma.site.update({
            where: { id: siteId },
            data: { cookiebotId: result.detectedCookiebotId },
          });
        }
      } catch {}
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

export async function runCookiebotScan(cookiebotId: string): Promise<CheckResult[]> {
  if (!cookiebotId || cookiebotId.trim().length === 0) {
    return [{
      checkKey: "C1",
      status: "na",
      findings: [{ element: "", detail: "Cookiebot ID is required", severity: "warning" }],
      summary: "No Cookiebot ID provided",
    }];
  }

  try {
    const data = await fetchCookiebotData(cookiebotId.trim());
    if (!data) {
      return [{
        checkKey: "C1",
        status: "na",
        findings: [{ element: "", detail: `Could not fetch data for Cookiebot ID: ${cookiebotId}`, severity: "warning" }],
        summary: "Cookiebot data unavailable",
      }];
    }
    return runCookiebotChecks(data);
  } catch (error) {
    return [{
      checkKey: "C1",
      status: "na",
      findings: [{ element: "", detail: error instanceof Error ? error.message : "Cookiebot scan failed", severity: "warning" }],
      summary: "Cookiebot scan failed",
    }];
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
