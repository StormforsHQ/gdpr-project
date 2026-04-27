import { Toaster } from "@/components/ui/sonner";
import { TopNavbar } from "@/components/top-navbar";
import { Sidebar } from "@/components/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSites } from "@/app/actions/sites";

async function loadSidebarSites(): Promise<{ id: string; name: string }[]> {
  try {
    const sites = await getSites();
    return sites.map((s) => ({ id: s.id, name: s.name }));
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
    </TooltipProvider>
  );
}
