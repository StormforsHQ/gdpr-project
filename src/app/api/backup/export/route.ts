import { prisma } from "@/lib/db";
import JSZip from "jszip";

export const dynamic = "force-dynamic";

function toCsv<T extends Record<string, unknown>>(rows: T[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    const values = headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      if (val instanceof Date) return val.toISOString();
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    lines.push(values.join(","));
  }
  return lines.join("\n");
}

export async function GET() {
  try {
    const [sites, audits, checkResults, scanRuns, reports] = await Promise.all([
      prisma.site.findMany({ orderBy: { name: "asc" } }),
      prisma.audit.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.checkResult.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.scanRun.findMany({ orderBy: { startedAt: "asc" } }),
      prisma.report.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

    const zip = new JSZip();
    zip.file("sites.csv", toCsv(sites as unknown as Record<string, unknown>[]));
    zip.file("audits.csv", toCsv(audits as unknown as Record<string, unknown>[]));
    zip.file("check_results.csv", toCsv(checkResults as unknown as Record<string, unknown>[]));
    zip.file("scan_runs.csv", toCsv(scanRuns as unknown as Record<string, unknown>[]));
    zip.file("reports.csv", toCsv(reports as unknown as Record<string, unknown>[]));

    const timestamp = new Date().toISOString().slice(0, 10);
    const buffer = await zip.generateAsync({ type: "uint8array" });

    return new Response(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="gdpr-backup-${timestamp}.zip"`,
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }
}
