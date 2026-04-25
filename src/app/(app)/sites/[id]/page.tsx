import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compliance Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Site {id} - checklist coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
