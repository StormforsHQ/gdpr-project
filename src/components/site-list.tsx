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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, ArrowUpDown, BarChart3, Eye, EyeOff } from "lucide-react";
import { toggleSiteActive } from "@/app/actions/sites";
import { COVERAGE_TYPES, type CoverageType } from "@/lib/checklist";

export type SiteWithAudit = {
  id: string;
  name: string;
  url: string;
  platform: string;
  coverageType: string;
  active: boolean;
  status: string;
  auditType: "basic" | "full" | null;
  checkCount: number;
  issueCount: number;
  hasInternalNotes?: boolean;
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

type ActiveFilter = "active" | "inactive" | "all";

export function SiteList({ sites }: { sites: SiteWithAudit[] }) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("active");
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [platformFilter, setPlatformFilter] = useState<Set<string>>(new Set());
  const [coverageFilter, setCoverageFilter] = useState<Set<string>>(new Set());
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const activeCount = useMemo(() => sites.filter((s) => s.active).length, [sites]);
  const inactiveCount = sites.length - activeCount;
  const flaggedCount = useMemo(() => sites.filter((s) => s.hasInternalNotes).length, [sites]);

  const platforms = useMemo(() => {
    const set = new Set(sites.map((s) => s.platform));
    return [...set].sort();
  }, [sites]);

  const visibleSites = useMemo(() => {
    if (activeFilter === "active") return sites.filter((s) => s.active);
    if (activeFilter === "inactive") return sites.filter((s) => !s.active);
    return sites;
  }, [sites, activeFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { not_started: 0, in_progress: 0, compliant: 0 };
    for (const s of visibleSites) counts[s.status] = (counts[s.status] || 0) + 1;
    return counts;
  }, [visibleSites]);

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of visibleSites) counts[s.platform] = (counts[s.platform] || 0) + 1;
    return counts;
  }, [visibleSites]);

  const coverageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of visibleSites) counts[s.coverageType] = (counts[s.coverageType] || 0) + 1;
    return counts;
  }, [visibleSites]);

  const toggleCoverage = (type: string) => {
    setCoverageFilter((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

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

    if (activeFilter === "active") result = result.filter((s) => s.active);
    else if (activeFilter === "inactive") result = result.filter((s) => !s.active);

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

    if (coverageFilter.size > 0) {
      result = result.filter((s) => coverageFilter.has(s.coverageType));
    }

    if (flaggedOnly) {
      result = result.filter((s) => s.hasInternalNotes);
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
  }, [sites, search, activeFilter, statusFilter, platformFilter, coverageFilter, flaggedOnly, sortField, sortDir]);

  const hasFilters = search.trim() || statusFilter.size > 0 || platformFilter.size > 0 || coverageFilter.size > 0 || flaggedOnly || activeFilter !== "active";

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {filtered.length} {filtered.length === 1 ? "site" : "sites"}
            {activeFilter !== "all" && <span className="text-muted-foreground font-normal"> of {sites.length} total</span>}
          </CardTitle>
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setActiveFilter("active"); setStatusFilter(new Set()); setPlatformFilter(new Set()); setCoverageFilter(new Set()); setFlaggedOnly(false); }}
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
          {([
            { key: "active" as const, label: "Active", count: activeCount, dot: "bg-green-500" },
            { key: "inactive" as const, label: "Inactive", count: inactiveCount, dot: "bg-muted-foreground/50" },
            { key: "all" as const, label: "All", count: sites.length, dot: null },
          ]).map(({ key, label, count, dot }) => (
            <button key={key} onClick={() => setActiveFilter(key)}>
              <Badge
                variant="secondary"
                className={`cursor-pointer text-xs gap-1.5 ${activeFilter === key ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""}`}
              >
                {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
                {label} ({count})
              </Badge>
            </button>
          ))}
          <span className="w-px h-5 bg-border self-center mx-1" />
          {(["not_started", "in_progress", "compliant"] as const).map((status) => {
            const badge = STATUS_BADGES[status];
            const isActive = statusFilter.has(status);
            return (
              <button key={status} onClick={() => toggleStatus(status)}>
                <Badge
                  variant="secondary"
                  className={`cursor-pointer text-xs gap-1.5 ${isActive ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""}`}
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
          {Object.keys(coverageCounts).length > 1 && (
            <>
              <span className="w-px h-5 bg-border self-center mx-1" />
              {(Object.keys(COVERAGE_TYPES) as CoverageType[]).map((type) => {
                const count = coverageCounts[type] || 0;
                if (count === 0) return null;
                const config = COVERAGE_TYPES[type];
                return (
                  <button key={type} onClick={() => toggleCoverage(type)}>
                    <Badge
                      variant="secondary"
                      className={`cursor-pointer text-xs ${config.className} ${coverageFilter.has(type) ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""}`}
                    >
                      {config.label} ({count})
                    </Badge>
                  </button>
                );
              })}
            </>
          )}
          {flaggedCount > 0 && (
            <>
              <span className="w-px h-5 bg-border self-center mx-1" />
              <button onClick={() => setFlaggedOnly(!flaggedOnly)}>
                <Badge
                  variant="outline"
                  className={`cursor-pointer text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 ${flaggedOnly ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""}`}
                >
                  Flagged ({flaggedCount})
                </Badge>
              </button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">
                  <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("name")}>
                    Name
                    {sortField === "name" && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </TableHead>
                <TableHead className="w-[25%]">URL</TableHead>
                <TableHead className="w-[9%]">
                  <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("platform")}>
                    Platform
                    {sortField === "platform" && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </TableHead>
                <TableHead className="w-[8%]">Coverage</TableHead>
                <TableHead className="w-[7%]">Audit</TableHead>
                <TableHead className="w-[10%]">Progress</TableHead>
                <TableHead className="w-[10%]">
                  <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("status")}>
                    Status
                    {sortField === "status" && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </TableHead>
                <TableHead className="w-[8%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((site) => {
                const badge = STATUS_BADGES[site.status] ?? STATUS_BADGES.not_started;
                const dot = STATUS_DOT[site.status] ?? STATUS_DOT.not_started;
                return (
                  <TableRow key={site.id} className={`group relative cursor-pointer ${!site.active && activeFilter !== "active" ? "opacity-50" : ""}`}>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${dot}`}
                          title={badge.label}
                        />
                        <Link
                          href={`/sites/${site.id}`}
                          className="text-sm font-medium truncate after:absolute after:inset-0"
                          title={site.name}
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
                        className="relative z-10 hover:underline truncate block"
                        title={site.url}
                      >
                        {site.url}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {PLATFORM_LABELS[site.platform] || site.platform}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const ct = (site.coverageType || "unknown") as CoverageType;
                        const config = COVERAGE_TYPES[ct];
                        return (
                          <Badge variant="secondary" className={`text-xs ${config.className}`}>
                            {config.label}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {site.auditType ? (
                        <Badge variant="secondary" className={`text-[10px] ${site.auditType === "basic" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" : "bg-purple-500/15 text-purple-600 dark:text-purple-400"}`}>
                          {site.auditType === "basic" ? "Basic" : "Full"}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
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
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger>
                            <button
                              className="relative z-10 text-muted-foreground hover:text-foreground p-1 rounded"
                              onClick={async () => {
                                await toggleSiteActive(site.id, !site.active);
                              }}
                            >
                              {site.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs text-black dark:text-black">
                            {site.active ? "Hide from active list" : "Show in active list"}
                          </TooltipContent>
                        </Tooltip>
                        {site.checkCount > 0 && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Link
                                href={`/sites/${site.id}/dashboard`}
                                className="relative z-10 text-muted-foreground hover:text-foreground p-1 rounded"
                              >
                                <BarChart3 className="h-3.5 w-3.5" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs text-black dark:text-black">
                              Compliance dashboard
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <DeleteSiteButton siteId={site.id} siteName={site.name} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
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
