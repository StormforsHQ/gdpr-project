"use server";

import { scanSite, type ScanResult } from "@/lib/scanner";
import { runAICheck, AI_CHECK_KEYS } from "@/lib/ai-agent";
import type { CheckResult } from "@/lib/scanner";

export async function runPageScan(url: string): Promise<ScanResult> {
  if (!url || url.trim().length === 0) {
    return {
      url: "",
      scannedAt: new Date().toISOString(),
      checks: [],
      error: "URL is required",
    };
  }

  try {
    return await scanSite(url);
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
