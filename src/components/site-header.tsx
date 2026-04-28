"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EditSiteDialog } from "@/components/edit-site-dialog";
import { CHECK_REQUIREMENTS, type CheckRequirement } from "@/lib/glossary";
import { Settings, ExternalLink, AlertTriangle, FileText } from "lucide-react";

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

export function SiteHeader({ site, auditId }: SiteHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);
  const missingFields = getMissingFieldCounts(site);

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
            <a href={`/report/${site.id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                Report
              </Button>
            </a>
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
