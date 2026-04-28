"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { generateReport } from "@/app/actions/report";

interface ReportEmptyProps {
  siteId: string;
  auditId: string;
}

export function ReportEmpty({ siteId, auditId }: ReportEmptyProps) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);

  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="py-12 text-center space-y-4">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">No report generated yet</h2>
          <p className="text-sm text-muted-foreground">
            Generate a compliance report snapshot based on the current audit state.
            The report can be edited and printed as a client-facing document.
          </p>
          <Button
            onClick={async () => {
              setGenerating(true);
              await generateReport(auditId);
              router.refresh();
              setGenerating(false);
            }}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate report"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
