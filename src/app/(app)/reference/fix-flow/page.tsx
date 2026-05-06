import { readFileSync } from "fs";
import { join } from "path";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownContent } from "@/components/markdown-content";
import { PrintButton } from "@/components/print-button";

export default function FixFlowGuidePage() {
  const content = readFileSync(
    join(process.cwd(), "docs/fix-flow-guide.md"),
    "utf-8"
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-end print:hidden">
        <PrintButton />
      </div>
      <Card className="print:shadow-none print:border-none">
        <CardContent className="py-6">
          <MarkdownContent content={content} />
        </CardContent>
      </Card>
    </div>
  );
}
