"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { CheckStatus } from "@/lib/checklist";

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

export async function createAudit(siteId: string) {
  const audit = await prisma.audit.create({
    data: {
      siteId,
      status: "in_progress",
    },
  });

  revalidatePath(`/sites/${siteId}`);
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
  notes: string
) {
  const result = await prisma.checkResult.upsert({
    where: {
      auditId_checkKey: { auditId, checkKey },
    },
    update: { status, notes },
    create: { auditId, checkKey, status, notes },
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

  return results;
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
