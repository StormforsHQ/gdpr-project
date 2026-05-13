import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, ClipboardCheck, AlertTriangle } from "lucide-react";
import { getSites } from "@/app/actions/sites";
import { COVERAGE_TYPES, getEssentialChecks, type CoverageType } from "@/lib/checklist";
import { DownloadHandoff } from "@/components/download-handoff";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const sites = await getSites();

  const totalSites = sites.length;
  const activeSites = sites.filter((s) => s.active);

  let auditsComplete = 0;
  let auditsInProgress = 0;

  const issuesByType: Record<CoverageType, number> = { sla: 0, "no-sla": 0, "us-based": 0, unknown: 0 };
  const siteCountByType: Record<CoverageType, number> = { sla: 0, "no-sla": 0, "us-based": 0, unknown: 0 };

  const sitesWithIssues: {
    id: string;
    name: string;
    coverageType: CoverageType;
    issueCount: number;
    checkedCount: number;
    totalChecks: number;
  }[] = [];

  for (const site of activeSites) {
    const audit = site.audits[0];
    if (!audit) continue;

    const coverageType = (site.coverageType || "unknown") as CoverageType;
    const essentialChecks = getEssentialChecks(coverageType);
    const relevantResults = audit.results.filter((r) => essentialChecks.has(r.checkKey));
    const issues = relevantResults.filter((r) => r.status === "issue").length;
    const checked = relevantResults.filter((r) => r.status !== "not_checked").length;

    issuesByType[coverageType] += issues;
    siteCountByType[coverageType]++;

    if ((audit as { status?: string }).status === "in_progress") {
      auditsInProgress++;
    } else {
      auditsComplete++;
    }

    if (issues > 0) {
      sitesWithIssues.push({
        id: site.id,
        name: site.name,
        coverageType,
        issueCount: issues,
        checkedCount: checked,
        totalChecks: relevantResults.length,
      });
    }
  }

  const totalIssues = Object.values(issuesByType).reduce((a, b) => a + b, 0);

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
            <div className="mt-1 space-y-0.5">
              {(Object.entries(issuesByType) as [CoverageType, number][])
                .filter(([type]) => siteCountByType[type] > 0)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{COVERAGE_TYPES[type].label}</span>
                    <span className={count > 0 ? "text-destructive font-medium" : ""}>{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {sitesWithIssues.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Scanned Sites with Issues</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Only sites that have been scanned</p>
            </div>
            <DownloadHandoff />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sitesWithIssues.map((site) => {
                const typeConfig = COVERAGE_TYPES[site.coverageType];
                return (
                  <Link
                    key={site.id}
                    href={`/sites/${site.id}`}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{site.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeConfig.className}`}>
                        {typeConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{site.checkedCount}/{site.totalChecks} checked</span>
                      <span className="text-destructive font-medium">{site.issueCount} issue{site.issueCount !== 1 ? "s" : ""}</span>
                    </div>
                  </Link>
                );
              })}
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
