import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PLACEHOLDER_SITES = [
  { id: "1", name: "Example Client A", url: "example-a.com", platform: "webflow", status: "not_started" },
  { id: "2", name: "Example Client B", url: "example-b.com", platform: "webflow", status: "not_started" },
  { id: "3", name: "Example Client C", url: "example-c.com", platform: "webflow", status: "not_started" },
];

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  not_started: { label: "Not started", variant: "secondary" },
  in_progress: { label: "In progress", variant: "default" },
  issues_found: { label: "Issues found", variant: "destructive" },
  compliant: { label: "Compliant", variant: "secondary" },
};

export default function SitesPage() {
  const sites = PLACEHOLDER_SITES;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sites</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All sites registered for GDPR compliance auditing
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Site List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => {
                const badge = STATUS_BADGES[site.status] ?? STATUS_BADGES.not_started;
                return (
                  <TableRow key={site.id}>
                    <TableCell>
                      <Link
                        href={`/sites/${site.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {site.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {site.url}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {site.platform}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant} className="text-xs">
                        {badge.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
