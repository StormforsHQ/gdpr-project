import { Badge } from "@/components/ui/badge";
import { ChecklistView } from "@/components/checklist-view";
import { SiteHeader } from "@/components/site-header";
import { getSite } from "@/app/actions/sites";
import { getLatestAudit, createAudit, getScanRuns } from "@/app/actions/audits";
import { listReports } from "@/app/actions/report";

export const dynamic = "force-dynamic";

interface SitePageProps {
  params: Promise<{ id: string }>;
}

async function loadSiteData(id: string) {
  try {
    const site = await getSite(id);
    if (!site) return null;

    const existingAudit = await getLatestAudit(site.id);
    if (existingAudit) {
      let scanRuns: Awaited<ReturnType<typeof getScanRuns>> = [];
      try {
        scanRuns = await getScanRuns(existingAudit.id);
      } catch (err) {
        console.error("getScanRuns failed (non-fatal):", err);
      }
      const reportVersions = await listReports(existingAudit.id);
      return { site, audit: existingAudit, scanRuns, reportVersions };
    }

    const newAudit = await createAudit(site.id, false);
    return {
      site,
      audit: {
        ...newAudit,
        results: [] as { id: string; auditId: string; checkKey: string; status: string; notes: string; source: string; createdAt: Date; updatedAt: Date }[],
      },
      scanRuns: [],
      reportVersions: [],
    };

  } catch (error) {
    console.error("loadSiteData failed for id:", id, "error:", error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error("Stack:", error.stack);
    }
    return null;
  }
}

export default async function SitePage({ params }: SitePageProps) {
  const { id } = await params;

  const data = await loadSiteData(id);

  if (!data) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Site Audit</h1>
          <Badge variant="destructive" className="text-sm px-3 py-1">Demo mode</Badge>
        </div>
        <div className="rounded-md border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-300">
          <p className="font-medium">Database not connected - running in demo mode</p>
          <p className="mt-1 text-red-700 dark:text-red-400">
            You can run scans, AI checks, and generate reports as usual, but nothing will be saved to the database. Any changes you make (statuses, notes) will be lost when you leave this page.
          </p>
        </div>
        <ChecklistView />
      </div>
    );
  }

  const { site, audit, scanRuns, reportVersions } = data;
  const initialStates: Record<string, { status: string; notes: string; source: string }> = {};
  for (const result of audit.results) {
    initialStates[result.checkKey] = {
      status: result.status,
      notes: result.notes,
      source: (result as Record<string, unknown>).source as string ?? "manual",
    };
  }

  return (
    <div className="p-6 space-y-6">
      <SiteHeader site={site} auditId={audit.id} reportVersions={reportVersions} />
      <ChecklistView
        siteUrl={site.url}
        siteId={site.id}
        auditId={audit.id}
        auditType={(audit as Record<string, unknown>).auditType as "basic" | "full" ?? "full"}
        initialStates={initialStates}
        initialScanRuns={scanRuns}
        siteFields={{ cookiebotId: site.cookiebotId, gtmId: site.gtmId }}
      />
    </div>
  );
}
