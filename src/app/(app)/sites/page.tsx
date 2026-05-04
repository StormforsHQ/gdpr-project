import { Card, CardContent } from "@/components/ui/card";
import { AddSiteDialog } from "@/components/add-site-dialog";
import { SiteList, type SiteWithAudit } from "@/components/site-list";
import { getSites } from "@/app/actions/sites";

export const dynamic = "force-dynamic";

function getAuditStatus(results: { status: string }[]): string {
  if (results.length === 0) return "not_started";
  const hasIssues = results.some((r) => r.status === "issue");
  if (hasIssues) return "issues_found";
  const allChecked = results.every((r) => r.status !== "not_checked");
  if (allChecked) return "compliant";
  return "in_progress";
}

async function loadSites(): Promise<SiteWithAudit[]> {
  try {
    const sites = await getSites();
    return sites.map((site) => {
      const latestAudit = site.audits[0];
      const results = latestAudit?.results || [];
      return {
        id: site.id,
        name: site.name,
        url: site.url,
        platform: site.platform,
        status: getAuditStatus(results),
        checkCount: results.filter((r) => r.status !== "not_checked").length,
        issueCount: results.filter((r) => r.status === "issue").length,
      };
    });
  } catch {
    return [];
  }
}

export default async function SitesPage() {
  const sites = await loadSites();
  const dbConnected = sites.length > 0 || process.env.DATABASE_URL;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sites</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All sites registered for GDPR compliance auditing
          </p>
        </div>
        <AddSiteDialog />
      </div>

      {!dbConnected && (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Database not connected. Set DATABASE_URL in .env.local and restart the dev server.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You can still use the checklist by navigating to /sites/demo
            </p>
          </CardContent>
        </Card>
      )}

      {sites.length > 0 && <SiteList sites={sites} />}

      {dbConnected && sites.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No sites yet. Click "Add site" to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
