"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  LayoutDashboard,
  Globe,
} from "lucide-react";

interface SidebarSite {
  id: string;
  name: string;
}

interface SidebarProps {
  sites: SidebarSite[];
}

export function Sidebar({ sites }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sitesOpen, setSitesOpen] = useState(true);

  const isActive = (path: string) => pathname === path;
  const isSiteActive = (id: string) => pathname === `/sites/${id}`;

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
          className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
            isActive("/")
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        <div>
          <button
            onClick={() => setSitesOpen(!sitesOpen)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <Globe className="h-4 w-4" />
            Sites ({sites.length})
          </button>
          {sitesOpen && (
            <div className="ml-6 space-y-0.5">
              {sites.length === 0 ? (
                <p className="px-3 py-1.5 text-xs text-muted-foreground">
                  No sites yet
                </p>
              ) : (
                sites.map((site) => (
                  <Link
                    key={site.id}
                    href={`/sites/${site.id}`}
                    onClick={() => setMobileOpen(false)}
                    className={`flex w-full items-center rounded-md px-3 py-1.5 text-xs transition-colors truncate ${
                      isSiteActive(site.id)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}
                  >
                    {site.name}
                  </Link>
                ))
              )}
            </div>
          )}
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
