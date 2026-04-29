"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { SidebarSite } from "@/app/(app)/layout";
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  Globe,
  BookOpen,
} from "lucide-react";

const PLATFORM_LABELS: Record<string, string> = {
  webflow: "Webflow",
  hubspot: "HubSpot",
  nextjs: "Next.js",
  wordpress: "WordPress",
  other: "Other",
};

const PLATFORM_ORDER = ["webflow", "hubspot", "nextjs", "wordpress", "other"];

const STATUS_COLORS: Record<SidebarSite["auditProgress"], string> = {
  complete: "bg-green-500",
  partial: "bg-amber-500",
  none: "bg-blue-400/60 dark:bg-blue-400/50",
};

const STATUS_LABELS: Record<SidebarSite["auditProgress"], string> = {
  complete: "Audit complete",
  partial: "Audit in progress",
  none: "Not started",
};

interface SidebarProps {
  sites: SidebarSite[];
}

function groupByPlatform(sites: SidebarSite[]) {
  const groups: Record<string, SidebarSite[]> = {};
  for (const site of sites) {
    const key = PLATFORM_LABELS[site.platform] ? site.platform : "other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(site);
  }
  return PLATFORM_ORDER
    .filter((p) => groups[p]?.length)
    .map((p) => ({ platform: p, label: PLATFORM_LABELS[p] || p, sites: groups[p] }));
}

export function Sidebar({ sites }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sitesOpen, setSitesOpen] = useState(true);
  const [refsOpen, setRefsOpen] = useState(true);

  const isActive = (path: string) => pathname === path;
  const isSiteActive = (id: string) => pathname === `/sites/${id}`;

  const groups = groupByPlatform(sites);
  const hasMultiplePlatforms = groups.length > 1;

  const navLinkClass = (active: boolean) =>
    `flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
      active
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
    }`;

  const subLinkClass = (active: boolean) =>
    `flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors truncate ${
      active
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
    }`;

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-sm font-semibold text-sidebar-foreground">
          GDPR Audit
        </span>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hidden md:inline-flex"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto scrollbar-subtle">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className={navLinkClass(isActive("/"))}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        <div>
          <div className="flex items-center">
            <Link
              href="/sites"
              onClick={() => setMobileOpen(false)}
              className={navLinkClass(pathname.startsWith("/sites"))}
            >
              <Globe className="h-4 w-4" />
              Sites ({sites.length})
            </Link>
            {sites.length > 0 && (
              <button
                onClick={() => setSitesOpen(!sitesOpen)}
                className="p-1 rounded hover:bg-sidebar-accent/50 text-muted-foreground"
                aria-label={sitesOpen ? "Collapse sites" : "Expand sites"}
              >
                {sitesOpen ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
          {sitesOpen && (
            <div className="ml-4 space-y-0.5">
              {sites.length === 0 ? (
                <p className="px-3 py-1.5 text-xs text-muted-foreground">
                  No sites yet
                </p>
              ) : (
                groups.map((group) => (
                  <div key={group.platform}>
                    {hasMultiplePlatforms && (
                      <p className="px-3 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        {group.label}
                      </p>
                    )}
                    {group.sites.map((site) => (
                      <Link
                        key={site.id}
                        href={`/sites/${site.id}`}
                        onClick={() => setMobileOpen(false)}
                        className={subLinkClass(isSiteActive(site.id))}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_COLORS[site.auditProgress]}`}
                          title={STATUS_LABELS[site.auditProgress]}
                        />
                        <span className="truncate">{site.name}</span>
                      </Link>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => setRefsOpen(!refsOpen)}
            className={navLinkClass(pathname.startsWith("/reference"))}
          >
            <BookOpen className="h-4 w-4" />
            Reference
          </button>
          {refsOpen && (
            <div className="ml-4 space-y-0.5">
              <Link
                href="/reference/technical-guide"
                onClick={() => setMobileOpen(false)}
                className={subLinkClass(isActive("/reference/technical-guide"))}
              >
                Technical Guide
              </Link>
              <Link
                href="/reference/audit-protocol"
                onClick={() => setMobileOpen(false)}
                className={subLinkClass(isActive("/reference/audit-protocol"))}
              >
                Audit Protocol
              </Link>
              <Link
                href="/reference/mcp-servers"
                onClick={() => setMobileOpen(false)}
                className={subLinkClass(isActive("/reference/mcp-servers"))}
              >
                MCP Servers
              </Link>
            </div>
          )}
        </div>

        <div className="pt-3 mt-3 border-t">
          <div className="px-3 space-y-1">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Complete
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              In progress
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400/60 dark:bg-blue-400/50" />
              Not started
            </div>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t px-3 pb-2">
          <p className="text-[10px] text-muted-foreground/50">
            Next.js 16 / Prisma / PostgreSQL / Hetzner via Coolify
          </p>
        </div>
      </nav>
    </>
  );

  return (
    <>
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-50 rounded-md border border-border bg-sidebar p-2 md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar transition-transform md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {collapsed && (
        <aside className="hidden md:flex w-12 flex-col items-center border-r bg-sidebar py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </aside>
      )}

      {!collapsed && (
        <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar">
          {sidebarContent}
        </aside>
      )}
    </>
  );
}
