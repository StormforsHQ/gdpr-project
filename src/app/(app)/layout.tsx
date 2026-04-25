import { Toaster } from "@/components/ui/sonner";
import { TopNavbar } from "@/components/top-navbar";
import { Sidebar } from "@/components/sidebar";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sites: { id: string; name: string }[] = [];

  return (
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
  );
}
