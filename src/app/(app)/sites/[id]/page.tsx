import { Badge } from "@/components/ui/badge";
import { ChecklistView } from "@/components/checklist-view";
import { SiteHeader } from "@/components/site-header";
import { getSite } from "@/app/actions/sites";
import { getLatestAudit, createAudit, getScanRuns } from "@/app/actions/audits";

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
      return { site, audit: existingAudit, scanRuns };
    }

    const newAudit = await createAudit(site.id, false);
    return {
      site,
      audit: {
        ...newAudit,
        results: [] as { id: string; auditId: string; checkKey: string; status: string; notes: string; source: string; createdAt: Date; updatedAt: Date }[],
      },
      scanRuns: [],
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
          <Badge variant="secondary">Demo mode</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Database not connected. Showing checklist in demo mode (changes won't be saved).
        </p>
        <ChecklistView />
      </div>
    );
  }

  const { site, audit, scanRuns } = data;
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
      <SiteHeader site={site} auditId={audit.id} />
      <ChecklistView
        siteUrl={site.url}
        auditId={audit.id}
        initialStates={initialStates}
        initialScanRuns={scanRuns}
        siteFields={{ cookiebotId: site.cookiebotId, gtmId: site.gtmId }}
      />
    </div>
  );
}
