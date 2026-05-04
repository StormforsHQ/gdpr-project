"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteSiteButton } from "@/components/delete-site-button";
import { Search, ArrowUpDown } from "lucide-react";

export type SiteWithAudit = {
  id: string;
  name: string;
  url: string;
  platform: string;
  status: string;
  checkCount: number;
  issueCount: number;
};

const STATUS_DOT: Record<string, string> = {
  not_started: "bg-blue-400/60 dark:bg-blue-400/50",
  in_progress: "bg-amber-500",
  issues_found: "bg-amber-500",
  compliant: "bg-green-500",
};

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  not_started: { label: "Not started", variant: "secondary" },
  in_progress: { label: "In progress", variant: "default" },
  issues_found: { label: "Issues found", variant: "destructive" },
  compliant: { label: "Compliant", variant: "secondary" },
};

const PLATFORM_LABELS: Record<string, string> = {
  webflow: "Webflow",
  hubspot: "HubSpot",
  nextjs: "Next.js",
  wordpress: "WordPress",
  other: "Other",
};

type SortField = "name" | "platform" | "status";
type SortDir = "asc" | "desc";

export function SiteList({ sites }: { sites: SiteWithAudit[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [platformFilter, setPlatformFilter] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const platforms = useMemo(() => {
    const set = new Set(sites.map((s) => s.platform));
    return [...set].sort();
  }, [sites]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { not_started: 0, in_progress: 0, issues_found: 0, compliant: 0 };
    for (const s of sites) counts[s.status] = (counts[s.status] || 0) + 1;
    return counts;
  }, [sites]);

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of sites) counts[s.platform] = (counts[s.platform] || 0) + 1;
    return counts;
  }, [sites]);

  const toggleStatus = (status: string) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const togglePlatform = (platform: string) => {
    setPlatformFilter((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) next.delete(platform);
      else next.add(platform);
      return next;
    });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let result = sites;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q)
      );
    }

    if (statusFilter.size > 0) {
      result = result.filter((s) => statusFilter.has(s.status));
    }

    if (platformFilter.size > 0) {
      result = result.filter((s) => platformFilter.has(s.platform));
    }

    const statusOrder = ["issues_found", "in_progress", "not_started", "compliant"];
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "platform") cmp = a.platform.localeCompare(b.platform);
      else if (sortField === "status") cmp = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [sites, search, statusFilter, platformFilter, sortField, sortDir]);

  const hasFilters = search.trim() || statusFilter.size > 0 || platformFilter.size > 0;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {hasFilters ? `${filtered.length} of ${sites.length}` : sites.length} site{sites.length !== 1 ? "s" : ""}
          </CardTitle>
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setStatusFilter(new Set()); setPlatformFilter(new Set()); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search sites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["not_started", "in_progress", "issues_found", "compliant"] as const).map((status) => {
            const badge = STATUS_BADGES[status];
            const active = statusFilter.has(status);
            return (
              <button key={status} onClick={() => toggleStatus(status)}>
                <Badge
                  variant="secondary"
                  className={`cursor-pointer text-xs gap-1.5 ${active ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
                  {badge.label} ({statusCounts[status] || 0})
                </Badge>
              </button>
            );
          })}
          <span className="w-px h-5 bg-border self-center mx-1" />
          {platforms.map((platform) => (
            <button key={platform} onClick={() => togglePlatform(platform)}>
              <Badge
                variant="outline"
                className={`cursor-pointer text-xs capitalize ${platformFilter.has(platform) ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""}`}
              >
                {PLATFORM_LABELS[platform] || platform} ({platformCounts[platform] || 0})
              </Badge>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filtered.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("name")}>
                    Name
                    {sortField === "name" && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </TableHead>
                <TableHead>URL</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("platform")}>
                    Platform
                    {sortField === "platform" && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("status")}>
                    Status
                    {sortField === "status" && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((site) => {
                const badge = STATUS_BADGES[site.status] ?? STATUS_BADGES.not_started;
                const dot = STATUS_DOT[site.status] ?? STATUS_DOT.not_started;
                return (
                  <TableRow key={site.id} className="group relative cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${dot}`}
                          title={badge.label}
                        />
                        <Link
                          href={`/sites/${site.id}`}
                          className="text-sm font-medium after:absolute after:inset-0"
                        >
                          {site.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <a
                        href={site.url.startsWith("http") ? site.url : `https://${site.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative z-10 hover:underline"
                      >
                        {site.url}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {PLATFORM_LABELS[site.platform] || site.platform}
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
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No sites match your filters.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
