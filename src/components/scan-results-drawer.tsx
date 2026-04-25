"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CHECKLIST } from "@/lib/checklist";
import type { ScanResult } from "@/lib/scanner";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface ScanResultsDrawerProps {
  checkKey: string | null;
  scanResult: ScanResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SEVERITY_ICON = {
  error: <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />,
  warning: <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />,
  info: <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />,
};

function getCheckLabel(key: string): string {
  for (const cat of CHECKLIST) {
    const check = cat.checks.find((c) => c.key === key);
    if (check) return check.label;
  }
  return key;
}

export function ScanResultsDrawer({
  checkKey,
  scanResult,
  open,
  onOpenChange,
}: ScanResultsDrawerProps) {
  const checkResult = checkKey
    ? scanResult?.checks.find((c) => c.checkKey === checkKey)
    : null;

  if (!checkResult) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-mono">
              {checkResult.checkKey}
            </Badge>
            <SheetTitle className="text-base">
              Scan Results
            </SheetTitle>
            {checkResult.status === "ok" ? (
              <Badge variant="secondary" className="text-xs bg-green-500/15 text-green-600 dark:text-green-400">OK</Badge>
            ) : checkResult.status === "issue" ? (
              <Badge variant="destructive" className="text-xs">Issue</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">N/A</Badge>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="px-6 py-5 space-y-5">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Check
              </h3>
              <p className="text-sm">{getCheckLabel(checkResult.checkKey)}</p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Summary
              </h3>
              <p className="text-sm">{checkResult.summary}</p>
            </div>

            {checkResult.findings.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Findings ({checkResult.findings.length})
                  </h3>
                  <div className="space-y-3">
                    {checkResult.findings.map((finding, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-start gap-2">
                          {SEVERITY_ICON[finding.severity]}
                          <p className="text-sm">{finding.detail}</p>
                        </div>
                        {finding.element && finding.element !== "page" && (
                          <code className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded block ml-5 break-all">
                            {finding.element}
                          </code>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {checkResult.status === "ok" && checkResult.findings.length === 0 && (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">No issues found</p>
              </div>
            )}

            <Separator />

            <div className="text-xs text-muted-foreground">
              <p>Scanned: {scanResult?.url}</p>
              <p>Time: {scanResult?.scannedAt ? new Date(scanResult.scannedAt).toLocaleString() : "-"}</p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
