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
import { REMEDIATION } from "@/lib/remediation";
import type { FixAnalysisResult, ScriptAnalysis } from "@/app/actions/fixes";
import { AlertCircle, CheckCircle2, ExternalLink, Info, Wrench, AlertTriangle, Search } from "lucide-react";

interface ScanResultsDrawerProps {
  checkKey: string | null;
  scanResult: ScanResult | null;
  analysisResult?: FixAnalysisResult | null;
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

function ScriptAnalysisSection({ scripts }: { scripts: ScriptAnalysis }) {
  const sections = [
    { key: "tracking" as const, label: "Tracking scripts (move to GTM)", items: scripts.tracking, color: "text-destructive" },
    { key: "nonTracking" as const, label: "Non-tracking scripts (can stay)", items: scripts.nonTracking, color: "text-green-600 dark:text-green-400" },
    { key: "unknown" as const, label: "Unknown scripts (review manually)", items: scripts.unknown, color: "text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div className="space-y-4">
      {sections.map(({ key, label, items, color }) => (
        items.length > 0 && (
          <div key={key}>
            <h4 className={`text-xs font-semibold mb-2 ${color}`}>
              {label} ({items.length})
            </h4>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="space-y-0.5">
                  <p className="text-xs font-medium">{item.detail}</p>
                  <code className="text-[11px] bg-muted text-muted-foreground px-2 py-1 rounded block break-all">
                    {item.script}
                  </code>
                </div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}

export function ScanResultsDrawer({
  checkKey,
  scanResult,
  analysisResult,
  open,
  onOpenChange,
}: ScanResultsDrawerProps) {
  const checkResult = checkKey
    ? scanResult?.checks.find((c) => c.checkKey === checkKey)
    : null;

  const hasAnalysis = analysisResult && analysisResult.checkKey === checkKey;
  if (!checkResult && !hasAnalysis) return null;

  const effectiveKey = checkResult?.checkKey ?? checkKey!;
  const remediation = REMEDIATION[effectiveKey];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-mono">
              {effectiveKey}
            </Badge>
            <SheetTitle className="text-base">
              {hasAnalysis && !checkResult ? "Script Analysis" : "Scan Results"}
            </SheetTitle>
            {checkResult?.status === "ok" ? (
              <Badge variant="secondary" className="text-xs bg-green-500/15 text-green-600 dark:text-green-400">OK</Badge>
            ) : checkResult?.status === "issue" ? (
              <Badge variant="destructive" className="text-xs">Issue</Badge>
            ) : checkResult ? (
              <Badge variant="secondary" className="text-xs">N/A</Badge>
            ) : null}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="px-6 py-5 space-y-5">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Check
              </h3>
              <p className="text-sm">{getCheckLabel(effectiveKey)}</p>
            </div>

            {remediation?.plainExplanation && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  What this means
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {remediation.plainExplanation}
                </p>
              </div>
            )}

            {checkResult && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Summary
                </h3>
                <p className="text-sm">{checkResult.summary}</p>
              </div>
            )}

            {checkResult && checkResult.findings.length > 0 && (
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

            {checkResult?.status === "ok" && checkResult.findings.length === 0 && (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">No issues found</p>
              </div>
            )}

            {hasAnalysis && (
              <>
                <Separator />
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Search className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold">Analysis Results</h3>
                  </div>
                  <p className="text-sm leading-relaxed">{analysisResult!.message}</p>
                  {analysisResult!.warning && (
                    <div className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">{analysisResult!.warning}</p>
                    </div>
                  )}
                  {analysisResult!.scripts && <ScriptAnalysisSection scripts={analysisResult!.scripts} />}
                  {analysisResult!.existingGtmSnippet && (
                    <div className="p-2.5 bg-muted rounded-md">
                      <p className="text-xs font-medium">Existing GTM snippet</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{analysisResult!.existingGtmSnippet.detail}</p>
                      <Badge variant={analysisResult!.existingGtmSnippet.apiManaged ? "secondary" : "outline"} className="mt-1.5 text-[10px]">
                        {analysisResult!.existingGtmSnippet.apiManaged ? "API-managed" : "Manually added"}
                      </Badge>
                    </div>
                  )}
                  {!analysisResult!.scripts && !analysisResult!.existingGtmSnippet && !analysisResult!.canAutoFix && (
                    <p className="text-xs text-muted-foreground">
                      No automated action available. Follow the steps below to resolve this manually.
                    </p>
                  )}
                </div>
              </>
            )}

            {checkResult?.status === "issue" && remediation && (
              <>
                <Separator />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Wrench className="h-3 w-3" />
                    How to fix
                  </h3>
                  <ol className="space-y-2">
                    {remediation.steps.map((step, i) => (
                      <li key={i} className="text-sm leading-relaxed flex gap-3">
                        <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0 w-5 text-right">
                          {i + 1}.
                        </span>
                        <span>
                          {step.instruction}
                          {step.platform && step.platform !== "all" && (
                            <Badge variant="outline" className="ml-1.5 text-[10px] py-0 px-1 align-middle capitalize">
                              {step.platform}
                            </Badge>
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>

                  {remediation.devLegalNote && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">
                        * Needs developer or legal input
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {remediation.devLegalNote}
                      </p>
                    </div>
                  )}

                  {remediation.docLinks && (
                    <div className="mt-3 space-y-1">
                      {remediation.docLinks.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {scanResult && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    <p>Scanned: {scanResult.url}</p>
                    <p>Time: {scanResult.scannedAt ? new Date(scanResult.scannedAt).toLocaleString() : "-"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    For more details, click the <Info className="h-3 w-3 inline" /> icon on this check in the checklist.
                  </p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
