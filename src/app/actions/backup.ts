"use server";

import { prisma } from "@/lib/db";
import JSZip from "jszip";

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  values.push(current);
  return values;
}

function toDateOrNull(val: string): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function toDate(val: string): Date {
  return new Date(val);
}

function toIntOrDefault(val: string, fallback: number): number {
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
}

export async function importDatabase(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  counts?: { sites: number; audits: number; checkResults: number; scanRuns: number; reports: number };
}> {
  try {
    const file = formData.get("backup") as File;
    if (!file || !file.name.endsWith(".zip")) {
      return { success: false, error: "Please upload a .zip backup file" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);

    const readCsv = async (name: string) => {
      const f = zip.file(name);
      if (!f) return [];
      const text = await f.async("text");
      return parseCsv(text);
    };

    const [sitesData, auditsData, checkResultsData, scanRunsData, reportsData] =
      await Promise.all([
        readCsv("sites.csv"),
        readCsv("audits.csv"),
        readCsv("check_results.csv"),
        readCsv("scan_runs.csv"),
        readCsv("reports.csv"),
      ]);

    let siteCount = 0;
    let auditCount = 0;
    let checkResultCount = 0;
    let scanRunCount = 0;
    let reportCount = 0;

    for (const row of sitesData) {
      await prisma.site.upsert({
        where: { id: row.id },
        update: {
          name: row.name,
          url: row.url || "",
          platform: row.platform || "webflow",
          webflowId: row.webflowId || null,
          cookiebotId: row.cookiebotId || null,
          gtmId: row.gtmId || null,
          updatedAt: toDate(row.updatedAt),
        },
        create: {
          id: row.id,
          name: row.name,
          url: row.url || "",
          platform: row.platform || "webflow",
          webflowId: row.webflowId || null,
          cookiebotId: row.cookiebotId || null,
          gtmId: row.gtmId || null,
          createdAt: toDate(row.createdAt),
          updatedAt: toDate(row.updatedAt),
        },
      });
      siteCount++;
    }

    for (const row of auditsData) {
      await prisma.audit.upsert({
        where: { id: row.id },
        update: {
          siteId: row.siteId,
          status: row.status || "in_progress",
          notes: row.notes || "",
          auditorName: row.auditorName || null,
          updatedAt: toDate(row.updatedAt),
        },
        create: {
          id: row.id,
          siteId: row.siteId,
          status: row.status || "in_progress",
          notes: row.notes || "",
          auditorName: row.auditorName || null,
          createdAt: toDate(row.createdAt),
          updatedAt: toDate(row.updatedAt),
        },
      });
      auditCount++;
    }

    for (const row of checkResultsData) {
      await prisma.checkResult.upsert({
        where: { id: row.id },
        update: {
          auditId: row.auditId,
          checkKey: row.checkKey,
          status: row.status || "not_checked",
          notes: row.notes || "",
          source: row.source || "manual",
          updatedAt: toDate(row.updatedAt),
        },
        create: {
          id: row.id,
          auditId: row.auditId,
          checkKey: row.checkKey,
          status: row.status || "not_checked",
          notes: row.notes || "",
          source: row.source || "manual",
          createdAt: toDate(row.createdAt),
          updatedAt: toDate(row.updatedAt),
        },
      });
      checkResultCount++;
    }

    for (const row of scanRunsData) {
      await prisma.scanRun.upsert({
        where: { id: row.id },
        update: {
          auditId: row.auditId,
          scanType: row.scanType,
          url: row.url,
          status: row.status || "running",
          findings: row.findings || "[]",
          error: row.error || null,
          completedAt: toDateOrNull(row.completedAt),
        },
        create: {
          id: row.id,
          auditId: row.auditId,
          scanType: row.scanType,
          url: row.url,
          status: row.status || "running",
          findings: row.findings || "[]",
          error: row.error || null,
          startedAt: toDate(row.startedAt),
          completedAt: toDateOrNull(row.completedAt),
        },
      });
      scanRunCount++;
    }

    for (const row of reportsData) {
      await prisma.report.upsert({
        where: { id: row.id },
        update: {
          auditId: row.auditId,
          version: toIntOrDefault(row.version, 1),
          executiveSummary: row.executiveSummary || "",
          conclusion: row.conclusion || "",
          snapshotHtml: row.snapshotHtml || "",
          statsOk: toIntOrDefault(row.statsOk, 0),
          statsIssues: toIntOrDefault(row.statsIssues, 0),
          statsNa: toIntOrDefault(row.statsNa, 0),
          statsNotChecked: toIntOrDefault(row.statsNotChecked, 0),
        },
        create: {
          id: row.id,
          auditId: row.auditId,
          version: toIntOrDefault(row.version, 1),
          executiveSummary: row.executiveSummary || "",
          conclusion: row.conclusion || "",
          snapshotHtml: row.snapshotHtml || "",
          statsOk: toIntOrDefault(row.statsOk, 0),
          statsIssues: toIntOrDefault(row.statsIssues, 0),
          statsNa: toIntOrDefault(row.statsNa, 0),
          statsNotChecked: toIntOrDefault(row.statsNotChecked, 0),
          createdAt: toDate(row.createdAt),
        },
      });
      reportCount++;
    }

    return {
      success: true,
      counts: {
        sites: siteCount,
        audits: auditCount,
        checkResults: checkResultCount,
        scanRuns: scanRunCount,
        reports: reportCount,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Import failed",
    };
  }
}
