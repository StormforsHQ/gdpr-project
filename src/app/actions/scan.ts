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

  return scanSite(url);
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

  return results
    .filter((r): r is PromiseFulfilledResult<CheckResult> => r.status === "fulfilled")
    .map((r) => r.value);
}
