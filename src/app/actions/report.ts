"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { CHECKLIST, STATUS_CONFIG } from "@/lib/checklist";

function deduplicateNotes(notes: string): string {
  if (!notes) return "";
  const parts = notes.split(";").map((s) => s.trim()).filter(Boolean);
  const unique = [...new Set(parts)];
  return unique.join("; ");
}

export interface ReportData {
  id: string;
  version: number;
  executiveSummary: string;
  conclusion: string;
  createdAt: Date;
  statsOk: number;
  statsIssues: number;
  statsNa: number;
  statsNotChecked: number;
  auditType: "basic" | "full";
  site: {
    name: string;
    url: string;
    platform: string;
    cookiebotId: string | null;
    gtmId: string | null;
  };
  auditorName: string | null;
  categories: CategoryData[];
  categoryComments: Record<string, string>;
}

export interface CategoryData {
  id: string;
  label: string;
  checks: CheckData[];
}

export interface CheckData {
  key: string;
  label: string;
  description: string;
  status: string;
  statusLabel: string;
  notes: string;
}

export interface ReportListItem {
  id: string;
  version: number;
  statsOk: number;
  statsIssues: number;
  statsNa: number;
  statsNotChecked: number;
  createdAt: Date;
}

function generateCategoryComment(cat: CategoryData): string {
  const total = cat.checks.length;
  const issues = cat.checks.filter((c) => c.status === "issue");
  const ok = cat.checks.filter((c) => c.status === "ok");
  const na = cat.checks.filter((c) => c.status === "na");

  if (issues.length === 0 && ok.length === total) {
    return `All ${total} checks in this category are compliant. No issues identified.`;
  }
  if (issues.length === 0 && ok.length + na.length === total) {
    return `${ok.length} of ${total} checks are compliant, ${na.length} not applicable. No issues identified.`;
  }
  if (issues.length === 0) {
    return `${ok.length} of ${total} checks completed so far. No issues identified. ${total - ok.length - na.length} checks remain.`;
  }

  const issueLabels = issues.map((c) => c.label).join(", ");
  return `${issues.length} of ${total} checks flagged as non-compliant: ${issueLabels}. Remediation is recommended before the next audit cycle.`;
}

function generateAllCategoryComments(categories: CategoryData[]): Record<string, string> {
  const comments: Record<string, string> = {};
  for (const cat of categories) {
    comments[cat.id] = generateCategoryComment(cat);
  }
  return comments;
}

const DEFAULT_EXECUTIVE_SUMMARY = `Following a comprehensive internal audit of the site's digital privacy infrastructure, Stormfors has conducted a rigorous review of cookie consent mechanisms, script management, and third-party integrations. This report documents the current compliance status and identifies areas requiring attention to ensure full alignment with EU GDPR and ePrivacy Directive standards.`;

const DEFAULT_CONCLUSION = `Based on the findings of this audit, the recommendations outlined above should be implemented to ensure continued compliance with GDPR and ePrivacy regulations. Stormfors recommends scheduling a follow-up review after remediation to verify all identified issues have been resolved.`;

async function loadAuditData(auditId: string) {
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    include: { site: true, results: true },
  });
  if (!audit) return null;

  const resultMap: Record<string, { status: string; notes: string }> = {};
  for (const r of audit.results) {
    resultMap[r.checkKey] = { status: r.status, notes: r.notes };
  }

  const totalChecks = CHECKLIST.reduce((sum, cat) => sum + cat.checks.length, 0);
  const ok = audit.results.filter((r) => r.status === "ok").length;
  const issues = audit.results.filter((r) => r.status === "issue").length;
  const na = audit.results.filter((r) => r.status === "na").length;
  const notChecked = totalChecks - ok - issues - na;

  const categories: CategoryData[] = CHECKLIST.map((cat) => ({
    id: cat.id,
    label: cat.label,
    checks: cat.checks.map((check) => {
      const result = resultMap[check.key];
      const status = result?.status || "not_checked";
      return {
        key: check.key,
        label: check.label,
        description: check.description,
        status,
        statusLabel: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || "Not checked",
        notes: deduplicateNotes(result?.notes || ""),
      };
    }),
  }));

  return {
    audit,
    site: audit.site,
    statsOk: ok,
    statsIssues: issues,
    statsNa: na,
    statsNotChecked: notChecked,
    categories,
  };
}

function buildSnapshotKey(categories: CategoryData[]): string {
  const parts: string[] = [];
  for (const cat of categories) {
    for (const check of cat.checks) {
      parts.push(`${check.key}:${check.status}:${check.notes}`);
    }
  }
  return parts.join("|");
}

export async function getOrCreateReport(auditId: string): Promise<string | null> {
  const data = await loadAuditData(auditId);
  if (!data) return null;

  const snapshotKey = buildSnapshotKey(data.categories);

  const lastReport = await prisma.report.findFirst({
    where: { auditId },
    orderBy: { version: "desc" },
  });

  if (lastReport && lastReport.snapshotHtml === snapshotKey) {
    return lastReport.id;
  }

  const version = (lastReport?.version ?? 0) + 1;
  const summary = lastReport?.executiveSummary || DEFAULT_EXECUTIVE_SUMMARY;
  const concl = lastReport?.conclusion || DEFAULT_CONCLUSION;
  const catComments = generateAllCategoryComments(data.categories);

  const report = await (prisma.report.create as Function)({
    data: {
      auditId,
      version,
      executiveSummary: summary,
      conclusion: concl,
      snapshotHtml: snapshotKey,
      statsOk: data.statsOk,
      statsIssues: data.statsIssues,
      statsNa: data.statsNa,
      statsNotChecked: data.statsNotChecked,
      categoryComments: JSON.stringify(catComments),
    },
  });

  return report.id;
}

function buildReportData(
  report: { id: string; version: number; executiveSummary: string; conclusion: string; createdAt: Date; statsOk: number; statsIssues: number; statsNa: number; statsNotChecked: number; categoryComments?: string },
  audit: { auditorName: string | null; auditType?: string; site: { name: string; url: string; platform: string; cookiebotId: string | null; gtmId: string | null } },
  categories: CategoryData[],
): ReportData {
  let categoryComments: Record<string, string> = {};
  try {
    categoryComments = JSON.parse(report.categoryComments || "{}");
  } catch { /* use empty */ }

  return {
    id: report.id,
    version: report.version,
    executiveSummary: report.executiveSummary || DEFAULT_EXECUTIVE_SUMMARY,
    conclusion: report.conclusion || DEFAULT_CONCLUSION,
    createdAt: report.createdAt,
    statsOk: report.statsOk,
    statsIssues: report.statsIssues,
    statsNa: report.statsNa,
    statsNotChecked: report.statsNotChecked,
    auditType: (audit.auditType as "basic" | "full") || "full",
    site: {
      name: audit.site.name,
      url: audit.site.url,
      platform: audit.site.platform,
      cookiebotId: audit.site.cookiebotId,
      gtmId: audit.site.gtmId,
    },
    auditorName: audit.auditorName,
    categories,
    categoryComments,
  };
}

export async function getReportById(reportId: string): Promise<ReportData | null> {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { audit: { include: { site: true } } },
  });
  if (!report) return null;

  const data = await loadAuditData(report.auditId);
  if (!data) return null;

  return buildReportData(report, report.audit, data.categories);
}

export async function listReports(auditId: string): Promise<ReportListItem[]> {
  return prisma.report.findMany({
    where: { auditId },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      statsOk: true,
      statsIssues: true,
      statsNa: true,
      statsNotChecked: true,
      createdAt: true,
    },
  });
}

export async function deleteReport(reportId: string): Promise<{ success: boolean }> {
  try {
    await prisma.report.delete({ where: { id: reportId } });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function deleteAllReports(auditId: string): Promise<{ success: boolean }> {
  try {
    await prisma.report.deleteMany({ where: { auditId } });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updateReportText(reportId: string, executiveSummary: string, conclusion: string) {
  const report = await prisma.report.update({
    where: { id: reportId },
    data: { executiveSummary, conclusion },
    include: { audit: { include: { site: true } } },
  });
  revalidatePath(`/report/${report.audit.site.id}`);
}

export async function updateCategoryComment(reportId: string, categoryId: string, comment: string) {
  const existing = await (prisma.report.findUnique as Function)({
    where: { id: reportId },
    include: { audit: { include: { site: true } } },
  }) as { categoryComments?: string; audit: { site: { id: string } } } | null;
  if (!existing) return;

  let comments: Record<string, string> = {};
  try {
    comments = JSON.parse(existing.categoryComments || "{}");
  } catch { /* use empty */ }
  comments[categoryId] = comment;

  await (prisma.report.update as Function)({
    where: { id: reportId },
    data: { categoryComments: JSON.stringify(comments) },
  });
  revalidatePath(`/report/${existing.audit.site.id}`);
}
