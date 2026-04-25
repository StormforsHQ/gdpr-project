import { Badge } from "@/components/ui/badge";
import { ChecklistView } from "@/components/checklist-view";

interface SitePageProps {
  params: Promise<{ id: string }>;
}

export default async function SitePage({ params }: SitePageProps) {
  const { id } = await params;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Site Audit</h1>
        <Badge variant="secondary">Not started</Badge>
      </div>

      <ChecklistView />
    </div>
  );
}
