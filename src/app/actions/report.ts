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
  site: {
    name: string;
    url: string;
    platform: string;
    cookiebotId: string | null;
    gtmId: string | null;
  };
  auditorName: string | null;
  categories: CategoryData[];
}

export interface CategoryData {
  id: string;
  label: string;
  checks: CheckData[];
}

export interface CheckData {
  key: string;
  label: string;
  status: string;
  statusLabel: string;
  notes: string;
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

export async function generateReport(auditId: string, executiveSummary?: string, conclusion?: string): Promise<string | null> {
  const data = await loadAuditData(auditId);
  if (!data) return null;

  const lastReport = await prisma.report.findFirst({
    where: { auditId },
    orderBy: { version: "desc" },
  });
  const version = (lastReport?.version ?? 0) + 1;

  const summary = executiveSummary ?? lastReport?.executiveSummary ?? DEFAULT_EXECUTIVE_SUMMARY;
  const concl = conclusion ?? lastReport?.conclusion ?? DEFAULT_CONCLUSION;

  const report = await prisma.report.create({
    data: {
      auditId,
      version,
      executiveSummary: summary,
      conclusion: concl,
      snapshotHtml: "",
      statsOk: data.statsOk,
      statsIssues: data.statsIssues,
      statsNa: data.statsNa,
      statsNotChecked: data.statsNotChecked,
    },
  });

  revalidatePath(`/sites/${data.site.id}/report`);
  return report.id;
}

export async function getLatestReport(auditId: string): Promise<ReportData | null> {
  const report = await prisma.report.findFirst({
    where: { auditId },
    orderBy: { version: "desc" },
    include: { audit: { include: { site: true } } },
  });
  if (!report) return null;

  const data = await loadAuditData(auditId);
  if (!data) return null;

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
    site: {
      name: report.audit.site.name,
      url: report.audit.site.url,
      platform: report.audit.site.platform,
      cookiebotId: report.audit.site.cookiebotId,
      gtmId: report.audit.site.gtmId,
    },
    auditorName: report.audit.auditorName,
    categories: data.categories,
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
    site: {
      name: report.audit.site.name,
      url: report.audit.site.url,
      platform: report.audit.site.platform,
      cookiebotId: report.audit.site.cookiebotId,
      gtmId: report.audit.site.gtmId,
    },
    auditorName: report.audit.auditorName,
    categories: data.categories,
  };
}

export async function listReports(auditId: string) {
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

export async function updateReportText(reportId: string, executiveSummary: string, conclusion: string) {
  const report = await prisma.report.update({
    where: { id: reportId },
    data: { executiveSummary, conclusion },
    include: { audit: { include: { site: true } } },
  });
  revalidatePath(`/sites/${report.audit.site.id}/report`);
}
