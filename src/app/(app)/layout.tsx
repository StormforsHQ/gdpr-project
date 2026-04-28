import { Toaster } from "@/components/ui/sonner";
import { TopNavbar } from "@/components/top-navbar";
import { Sidebar } from "@/components/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorLogProvider } from "@/components/error-log";
import { getSites } from "@/app/actions/sites";

export const dynamic = "force-dynamic";

export interface SidebarSite {
  id: string;
  name: string;
  platform: string;
  auditProgress: "none" | "partial" | "complete";
}

async function loadSidebarSites(): Promise<SidebarSite[]> {
  try {
    const sites = await getSites();
    return sites.map((s) => {
      const results = s.audits[0]?.results ?? [];
      const checked = results.filter((r) => r.status !== "not_checked").length;
      let auditProgress: SidebarSite["auditProgress"] = "none";
      if (checked > 0) auditProgress = "partial";
      if (checked >= 69) auditProgress = "complete";
      return { id: s.id, name: s.name, platform: s.platform, auditProgress };
    });
  } catch {
    return [];
  }
}

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sites = await loadSidebarSites();

  return (
    <TooltipProvider>
      <ErrorLogProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar sites={sites} />
          <div className="flex flex-1 flex-col">
            <TopNavbar />
            <main className="flex-1 overflow-y-auto scrollbar-subtle">
              {children}
            </main>
          </div>
          <Toaster />
        </div>
      </ErrorLogProvider>
    </TooltipProvider>
  );
}
