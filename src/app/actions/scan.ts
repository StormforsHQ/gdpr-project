"use server";

import { scanSite, type ScanResult } from "@/lib/scanner";

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
