"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EditSiteDialog } from "@/components/edit-site-dialog";
import { CHECK_REQUIREMENTS, type CheckRequirement } from "@/lib/glossary";
import { Settings, ExternalLink, AlertTriangle, FileText, ChevronDown } from "lucide-react";
import type { ReportListItem } from "@/app/actions/report";

interface SiteHeaderProps {
  site: {
    id: string;
    name: string;
    url: string;
    platform: string;
    cookiebotId?: string | null;
    gtmId?: string | null;
    webflowId?: string | null;
  };
  auditId: string;
  reportVersions: ReportListItem[];
}

const PLATFORM_LABELS: Record<string, string> = {
  webflow: "Webflow",
  hubspot: "HubSpot",
  nextjs: "Next.js",
  wordpress: "WordPress",
  other: "Other",
};

function getMissingFieldCounts(site: SiteHeaderProps["site"]): { field: CheckRequirement; label: string; count: number }[] {
  const missing: Record<CheckRequirement, { label: string; count: number }> = {
    cookiebotId: { label: "Cookiebot ID", count: 0 },
    gtmId: { label: "GTM Container ID", count: 0 },
  };

  for (const reqs of Object.values(CHECK_REQUIREMENTS)) {
    for (const req of reqs) {
      const value = site[req.field];
      if (!value) {
        missing[req.field].count++;
      }
    }
  }

  return Object.entries(missing)
    .filter(([, v]) => v.count > 0)
    .map(([field, v]) => ({ field: field as CheckRequirement, label: v.label, count: v.count }));
}

export function SiteHeader({ site, auditId, reportVersions }: SiteHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const missingFields = getMissingFieldCounts(site);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setReportMenuOpen(false);
      }
    }
    if (reportMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [reportMenuOpen]);

  const hasVersions = reportVersions.length > 0;

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{site.name}</h1>
            <Badge variant="secondary" className="text-xs">
              {PLATFORM_LABELS[site.platform] || site.platform}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={menuRef}>
              <div className="flex">
                <a href={`/report/${site.id}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className={`gap-2 ${hasVersions ? "rounded-r-none border-r-0" : ""}`}>
                    <FileText className="h-4 w-4" />
                    Report
                  </Button>
                </a>
                {hasVersions && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-l-none px-1.5"
                    onClick={() => setReportMenuOpen(!reportMenuOpen)}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {reportMenuOpen && (
                <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-md border border-border bg-popover shadow-md">
                  <div className="p-1">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Saved versions
                    </div>
                    {reportVersions.map((v) => (
                      <a
                        key={v.id}
                        href={`/report/${site.id}?version=${v.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-2 py-1.5 text-sm rounded-sm hover:bg-accent cursor-pointer"
                        onClick={() => setReportMenuOpen(false)}
                      >
                        <span>v{v.version}.0</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(v.createdAt).toISOString().split("T")[0]}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setEditOpen(true)}
            >
              <Settings className="h-4 w-4" />
              Edit site
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs">
          {site.url && (
            <a
              href={`https://${site.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              {site.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {site.cookiebotId ? (
            <a
              href={`https://manager.cookiebot.com/goto/settings/${site.cookiebotId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <span className="text-muted-foreground/60">Cookiebot:</span>
              <span className="font-mono">{site.cookiebotId}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-muted-foreground/50">Cookiebot ID not set</span>
          )}

          {site.gtmId ? (
            <a
              href={`https://tagmanager.google.com/#/container/accounts/~/containers/~/versions/~?id=${site.gtmId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <span className="text-muted-foreground/60">GTM:</span>
              <span className="font-mono">{site.gtmId}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-muted-foreground/50">GTM ID not set</span>
          )}

          {site.platform === "webflow" && site.webflowId && (
            <span className="text-muted-foreground flex items-center gap-1">
              <span className="text-muted-foreground/60">Webflow:</span>
              <span className="font-mono">{site.webflowId}</span>
            </span>
          )}
        </div>

        {missingFields.length > 0 && (
          <div className="flex items-start gap-2 rounded-md bg-amber-500/10 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-600 dark:text-amber-400">
              {missingFields.map((mf, i) => (
                <span key={mf.field}>
                  {i > 0 && " "}
                  <button
                    className="font-medium underline underline-offset-2 hover:no-underline"
                    onClick={() => setEditOpen(true)}
                  >
                    {mf.label}
                  </button>
                  {" "}not set - {mf.count} check{mf.count !== 1 ? "s" : ""} need it.
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <EditSiteDialog
        site={site}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </Card>
  );
}
