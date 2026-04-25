"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditSiteDialog } from "@/components/edit-site-dialog";
import { Settings, ExternalLink } from "lucide-react";

interface SiteHeaderProps {
  site: {
    id: string;
    name: string;
    url: string;
    platform: string;
    cookiebotId?: string | null;
    gtmId?: string | null;
  };
  auditId: string;
}

export function SiteHeader({ site, auditId }: SiteHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{site.name}</h1>
        <Badge variant="secondary" className="text-xs capitalize">
          {site.platform}
        </Badge>
        {site.url && (
          <a
            href={`https://${site.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {site.url}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <div className="flex items-center gap-2">
        {site.gtmId && (
          <Badge variant="secondary" className="text-xs font-mono">
            {site.gtmId}
          </Badge>
        )}
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
      <EditSiteDialog
        site={site}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
