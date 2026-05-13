"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { CheckStatus } from "@/lib/checklist";

export interface HandoffSite {
  name: string;
  url: string;
  coverageType: string;
  checks: {
    key: string;
    label: string;
    description: string;
    summary: string;
    internalNote: string | null;
    findings: { detail: string; severity: string; pageUrl?: string }[];
  }[];
}

export async function getHandoffData(): Promise<HandoffSite[]> {
  const { CHECKLIST, getEssentialChecks } = await import("@/lib/checklist");
  type CoverageType = import("@/lib/checklist").CoverageType;

  const checkMap = new Map<string, { label: string; description: string }>();
  for (const cat of CHECKLIST) {
    for (const check of cat.checks) {
      checkMap.set(check.key, { label: check.label, description: check.description });
    }
  }

  const audits = await prisma.audit.findMany({
    where: { status: "in_progress" },
    include: {
      site: true,
      results: true,
      scans: { orderBy: { startedAt: "desc" } },
    },
  });

  const sites: HandoffSite[] = [];

  for (const audit of audits) {
    const coverageType = (audit.site.coverageType || "unknown") as CoverageType;
    const essentialChecks = getEssentialChecks(coverageType);
    const issueResults = audit.results.filter((r) => r.status === "issue" && essentialChecks.has(r.checkKey));
    if (issueResults.length === 0) continue;

    const latestScanByType = new Map<string, (typeof audit.scans)[0]>();
    for (const scan of audit.scans) {
      if (!latestScanByType.has(scan.scanType)) {
        latestScanByType.set(scan.scanType, scan);
      }
    }

    const scanFindings = new Map<string, { summary: string; findings: { detail: string; severity: string; pageUrl?: string }[] }>();
    for (const scan of latestScanByType.values()) {
      try {
        const parsed = JSON.parse(scan.findings) as { checkKey: string; status: string; summary: string; findings?: { detail: string; severity: string; pageUrl?: string }[] }[];
        for (const f of parsed) {
          if (f.status === "issue" || f.status === "blocked") {
            scanFindings.set(f.checkKey, {
              summary: f.summary || "",
              findings: (f.findings || []).filter((ff) => ff.severity === "error" || ff.severity === "warning"),
            });
          }
        }
      } catch {}
    }

    const checks = issueResults.map((r) => {
      const info = checkMap.get(r.checkKey);
      const scan = scanFindings.get(r.checkKey);
      return {
        key: r.checkKey,
        label: info?.label ?? r.checkKey,
        description: info?.description ?? "",
        summary: scan?.summary ?? "",
        internalNote: r.internalNote,
        findings: scan?.findings ?? [],
      };
    });

    checks.sort((a, b) => a.key.localeCompare(b.key));

    sites.push({
      name: audit.site.name,
      url: audit.site.url,
      coverageType: audit.site.coverageType || "unknown",
      checks,
    });
  }

  sites.sort((a, b) => a.name.localeCompare(b.name));
  return sites;
}

export async function getAudit(id: string) {
  return prisma.audit.findUnique({
    where: { id },
    include: {
      site: true,
      results: true,
    },
  });
}

export async function getLatestAudit(siteId: string) {
  return prisma.audit.findFirst({
    where: { siteId },
    orderBy: { createdAt: "desc" },
    include: {
      results: true,
    },
  });
}

export async function createAudit(siteId: string, revalidate = true, auditType: "basic" | "full" = "full") {
  const data = { siteId, status: "in_progress", auditType };
  const audit = await (prisma.audit.create as Function)({ data });

  if (revalidate) {
    revalidatePath(`/sites/${siteId}`);
  }
  return audit;
}

export async function updateAuditStatus(id: string, status: string, notes?: string) {
  const audit = await prisma.audit.update({
    where: { id },
    data: {
      status,
      ...(notes !== undefined && { notes }),
    },
    include: { site: true },
  });

  revalidatePath(`/sites/${audit.site.id}`);
  return audit;
}

export async function updateAuditType(id: string, auditType: "basic" | "full") {
  const audit = await (prisma.audit.update as Function)({
    data: { auditType },
    where: { id },
    include: { site: true },
  });
  revalidatePath(`/sites/${audit.site.id}`);
  return audit;
}

export async function deleteAudit(id: string) {
  const audit = await prisma.audit.findUnique({
    where: { id },
    select: { siteId: true },
  });

  await prisma.audit.delete({ where: { id } });

  if (audit) {
    revalidatePath(`/sites/${audit.siteId}`);
  }
}

export async function saveCheckResult(
  auditId: string,
  checkKey: string,
  status: CheckStatus,
  notes: string,
  source: "manual" | "scan" | "ai" = "manual"
) {
  const result = await prisma.checkResult.upsert({
    where: {
      auditId_checkKey: { auditId, checkKey },
    },
    update: { status, notes, source },
    create: { auditId, checkKey, status, notes, source },
  });

  revalidatePath("/", "layout");
  return result;
}

export async function saveInternalNote(
  auditId: string,
  checkKey: string,
  internalNote: string,
) {
  const result = await prisma.checkResult.upsert({
    where: {
      auditId_checkKey: { auditId, checkKey },
    },
    update: { internalNote },
    create: { auditId, checkKey, status: "not_checked", notes: "", internalNote },
  });

  return result;
}

export async function saveCheckResults(
  auditId: string,
  checks: { checkKey: string; status: CheckStatus; notes: string }[]
) {
  const results = await prisma.$transaction(
    checks.map((check) =>
      prisma.checkResult.upsert({
        where: {
          auditId_checkKey: { auditId, checkKey: check.checkKey },
        },
        update: { status: check.status, notes: check.notes },
        create: {
          auditId,
          checkKey: check.checkKey,
          status: check.status,
          notes: check.notes,
        },
      })
    )
  );

  revalidatePath("/", "layout");
  return results;
}

export async function saveScanRun(
  auditId: string,
  scanType: "page-scan" | "ai-agent" | "cookiebot" | "gtm-api",
  url: string,
  findings: { checkKey: string; status: string; summary: string; findings?: { element: string; detail: string; severity: string }[] }[],
  error?: string,
  cost?: number
) {
  const run = await prisma.scanRun.create({
    data: {
      auditId,
      scanType,
      url,
      status: error ? "failed" : "completed",
      findings: JSON.stringify(findings),
      error: error || null,
      cost: cost && cost > 0 ? cost : null,
      completedAt: new Date(),
    },
  });

  if (!error) {
    const { createSnapshot } = await import("@/app/actions/dashboard");
    await createSnapshot(auditId, "scan").catch(() => {});
  }

  return run;
}

export async function getScanRuns(auditId: string) {
  return prisma.scanRun.findMany({
    where: { auditId },
    orderBy: { startedAt: "desc" },
    take: 20,
  });
}

export async function deleteScanRun(id: string): Promise<{ success: boolean }> {
  try {
    await prisma.scanRun.delete({ where: { id } });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function deleteAllScanRuns(auditId: string): Promise<{ success: boolean }> {
  try {
    await prisma.scanRun.deleteMany({ where: { auditId } });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function resetAllChecks(auditId: string): Promise<{ success: boolean }> {
  try {
    await prisma.checkResult.deleteMany({ where: { auditId } });
    await prisma.scanRun.deleteMany({ where: { auditId } });
    await prisma.auditSnapshot.deleteMany({ where: { auditId } });
    revalidatePath("/sites");
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function saveAuditNotes(auditId: string, notes: string) {
  await prisma.audit.update({
    where: { id: auditId },
    data: { notes },
  });
}

export async function getAuditProgress(auditId: string) {
  const results = await prisma.checkResult.findMany({
    where: { auditId },
  });

  const total = results.length;
  const checked = results.filter((r) => r.status !== "not_checked").length;
  const issues = results.filter((r) => r.status === "issue").length;
  const ok = results.filter((r) => r.status === "ok").length;

  return { total, checked, issues, ok };
}

export async function markAuditComplete(auditId: string, completedForType: string) {
  const audit = await prisma.audit.update({
    where: { id: auditId },
    data: {
      completedForType,
      completedAt: new Date(),
      status: "complete",
    },
  });
  revalidatePath(`/sites/${audit.siteId}`);
  revalidatePath("/sites");
  return audit;
}

export async function reopenAudit(auditId: string) {
  const audit = await prisma.audit.update({
    where: { id: auditId },
    data: {
      completedForType: null,
      completedAt: null,
      status: "in_progress",
    },
  });
  revalidatePath(`/sites/${audit.siteId}`);
  revalidatePath("/sites");
  return audit;
}
