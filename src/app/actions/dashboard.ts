"use server";

import { prisma } from "@/lib/db";
import { CHECKLIST, type AuditTier } from "@/lib/checklist";

export type CategorySnapshot = {
  id: string;
  label: string;
  ok: number;
  issues: number;
  na: number;
  notChecked: number;
  total: number;
};

export type SnapshotPoint = {
  date: string;
  ok: number;
  issues: number;
  na: number;
  notChecked: number;
};

export type DashboardData = {
  current: {
    ok: number;
    issues: number;
    na: number;
    notChecked: number;
    total: number;
    categories: CategorySnapshot[];
  };
  baseline: SnapshotPoint | null;
  history: SnapshotPoint[];
  auditType: "basic" | "full";
};

function getFilteredChecklist(auditType: AuditTier) {
  if (auditType === "basic") {
    return CHECKLIST.map((cat) => ({
      ...cat,
      checks: cat.checks.filter((c) => c.tier === "basic"),
    })).filter((cat) => cat.checks.length > 0);
  }
  return CHECKLIST;
}

export async function createSnapshot(auditId: string, trigger: "scan" | "manual" = "scan") {
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    include: { results: true },
  });
  if (!audit) return null;

  const auditType = (audit as { auditType?: string }).auditType as AuditTier || "full";
  const checklist = getFilteredChecklist(auditType);
  const allCheckKeys = checklist.flatMap((cat) => cat.checks.map((c) => c.key));

  let ok = 0, issues = 0, na = 0, notChecked = 0;
  const categoryData: CategorySnapshot[] = [];

  for (const cat of checklist) {
    let catOk = 0, catIssues = 0, catNa = 0, catNotChecked = 0;
    for (const check of cat.checks) {
      const result = audit.results.find((r) => r.checkKey === check.key);
      const status = result?.status || "not_checked";
      if (status === "ok") { ok++; catOk++; }
      else if (status === "issue") { issues++; catIssues++; }
      else if (status === "na") { na++; catNa++; }
      else { notChecked++; catNotChecked++; }
    }
    categoryData.push({
      id: cat.id,
      label: cat.label,
      ok: catOk,
      issues: catIssues,
      na: catNa,
      notChecked: catNotChecked,
      total: cat.checks.length,
    });
  }

  const db = prisma as unknown as Record<string, Record<string, Function>>;
  const snapshot = await db.auditSnapshot.create({
    data: {
      auditId,
      auditType,
      statsOk: ok,
      statsIssues: issues,
      statsNa: na,
      statsNotChecked: notChecked,
      categoryData: JSON.stringify(categoryData),
      trigger,
    },
  });

  return snapshot;
}

export async function getDashboardData(auditId: string): Promise<DashboardData | null> {
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    include: { results: true },
  });
  if (!audit) return null;

  const auditType = (audit as { auditType?: string }).auditType as AuditTier || "full";
  const checklist = getFilteredChecklist(auditType);

  let ok = 0, issues = 0, na = 0, notChecked = 0;
  const categories: CategorySnapshot[] = [];

  for (const cat of checklist) {
    let catOk = 0, catIssues = 0, catNa = 0, catNotChecked = 0;
    for (const check of cat.checks) {
      const result = audit.results.find((r) => r.checkKey === check.key);
      const status = result?.status || "not_checked";
      if (status === "ok") { ok++; catOk++; }
      else if (status === "issue") { issues++; catIssues++; }
      else if (status === "na") { na++; catNa++; }
      else { notChecked++; catNotChecked++; }
    }
    categories.push({
      id: cat.id,
      label: cat.label,
      ok: catOk,
      issues: catIssues,
      na: catNa,
      notChecked: catNotChecked,
      total: cat.checks.length,
    });
  }

  const total = ok + issues + na + notChecked;

  const db = prisma as unknown as Record<string, Record<string, Function>>;
  const snapshots = await db.auditSnapshot.findMany({
    where: { auditId },
    orderBy: { createdAt: "asc" },
  }) as { statsOk: number; statsIssues: number; statsNa: number; statsNotChecked: number; createdAt: Date }[];

  const history: SnapshotPoint[] = snapshots.map((s) => ({
    date: s.createdAt.toISOString().split("T")[0],
    ok: s.statsOk,
    issues: s.statsIssues,
    na: s.statsNa,
    notChecked: s.statsNotChecked,
  }));

  const baseline = history.length > 0 ? history[0] : null;

  return {
    current: { ok, issues, na, notChecked, total, categories },
    baseline,
    history,
    auditType,
  };
}
