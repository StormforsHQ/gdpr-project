import { readFileSync } from "fs";
import { join } from "path";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownContent } from "@/components/markdown-content";

export default function AuditProtocolPage() {
  const content = readFileSync(
    join(process.cwd(), "docs/audit-protocol.md"),
    "utf-8"
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardContent className="py-6">
          <MarkdownContent content={content} />
        </CardContent>
      </Card>
    </div>
  );
}
