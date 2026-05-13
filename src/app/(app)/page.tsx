import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, ClipboardCheck, AlertTriangle, FileText } from "lucide-react";
import { getSites } from "@/app/actions/sites";
import { CHECKLIST } from "@/lib/checklist";
import Link from "next/link";

export const dynamic = "force-dynamic";

const checksByKey = new Map(CHECKLIST.flatMap((c) => c.checks.map((ch) => [ch.key, ch])));

export default async function OverviewPage() {
  const sites = await getSites();

  const totalSites = sites.length;
  const activeSites = sites.filter((s) => s.active);

  let totalIssues = 0;
  let auditsComplete = 0;
  let auditsInProgress = 0;
  const sitesWithIssues: { id: string; name: string; issueCount: number; checkedCount: number; totalChecks: number }[] = [];

  for (const site of activeSites) {
    const audit = site.audits[0];
    if (!audit) continue;

    const results = audit.results;
    const issues = results.filter((r) => r.status === "issue").length;
    const checked = results.filter((r) => r.status !== "not_checked").length;
    totalIssues += issues;

    if ((audit as { status?: string }).status === "in_progress") {
      auditsInProgress++;
    } else {
      auditsComplete++;
    }

    if (issues > 0) {
      sitesWithIssues.push({
        id: site.id,
        name: site.name,
        issueCount: issues,
        checkedCount: checked,
        totalChecks: results.length,
      });
    }
  }

  sitesWithIssues.sort((a, b) => b.issueCount - a.issueCount);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          GDPR compliance audit progress
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSites.length}</div>
            <p className="text-xs text-muted-foreground">
              {totalSites} total ({totalSites - activeSites.length} inactive)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Audits</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditsInProgress}</div>
            <p className="text-xs text-muted-foreground">
              in progress ({auditsComplete} complete)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIssues}</div>
            <p className="text-xs text-muted-foreground">
              across {sitesWithIssues.length} site{sitesWithIssues.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {sitesWithIssues.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Sites with Issues</CardTitle>
            <Link
              href="/handoff"
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              Print issue handoff
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sitesWithIssues.map((site) => (
                <Link
                  key={site.id}
                  href={`/sites/${site.id}`}
                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-medium">{site.name}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{site.checkedCount}/{site.totalChecks} checked</span>
                    <span className="text-destructive font-medium">{site.issueCount} issue{site.issueCount !== 1 ? "s" : ""}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {sitesWithIssues.length === 0 && auditsInProgress > 0 && (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground text-center">
              No issues found yet. {auditsInProgress} audit{auditsInProgress !== 1 ? "s" : ""} in progress.
            </p>
          </CardContent>
        </Card>
      )}

      {activeSites.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground text-center">
              No sites yet. Add sites to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
