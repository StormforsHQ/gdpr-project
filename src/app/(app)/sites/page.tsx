import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddSiteDialog } from "@/components/add-site-dialog";
import { DeleteSiteButton } from "@/components/delete-site-button";
import { getSites } from "@/app/actions/sites";

type SiteWithAudit = {
  id: string;
  name: string;
  url: string;
  platform: string;
  status: string;
  checkCount: number;
  issueCount: number;
};

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  not_started: { label: "Not started", variant: "secondary" },
  in_progress: { label: "In progress", variant: "default" },
  issues_found: { label: "Issues found", variant: "destructive" },
  compliant: { label: "Compliant", variant: "secondary" },
};

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

      {sites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {sites.length} site{sites.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.map((site) => {
                  const badge = STATUS_BADGES[site.status] ?? STATUS_BADGES.not_started;
                  return (
                    <TableRow key={site.id} className="group relative cursor-pointer">
                      <TableCell>
                        <Link
                          href={`/sites/${site.id}`}
                          className="text-sm font-medium after:absolute after:inset-0"
                        >
                          {site.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <a
                          href={site.url.startsWith("http") ? site.url : `https://${site.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative z-10 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {site.url}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {site.platform}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {site.checkCount > 0 ? `${site.checkCount} checked` : "-"}
                        {site.issueCount > 0 && (
                          <Badge variant="destructive" className="text-xs ml-2">
                            {site.issueCount}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={badge.variant} className="text-xs">
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DeleteSiteButton siteId={site.id} siteName={site.name} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
