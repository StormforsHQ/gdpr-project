"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CHECK_GUIDES } from "@/lib/check-guides";
import { CHECKLIST, RESPONSIBILITY_CONFIG } from "@/lib/checklist";
import { CHECK_REQUIREMENTS } from "@/lib/glossary";
import { GlossaryText } from "@/components/glossary-text";
import { REMEDIATION } from "@/lib/remediation";
import { AUTO_FIXES } from "@/lib/fixes";
import { FixFlowPanel } from "@/components/fix-flow-panel";
import type { ScanResult } from "@/lib/scanner";
import type { FixAnalysisResult, ScriptAnalysis } from "@/app/actions/fixes";
import { Wrench, Lightbulb, AlertTriangle, Info, AlertCircle, CheckCircle2, ExternalLink, Search } from "lucide-react";

interface SiteContext {
  platform?: string | null;
  webflowId?: string | null;
  gtmId?: string | null;
  cookiebotId?: string | null;
}

interface CheckGuideDrawerProps {
  checkKey: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanResult?: ScanResult | null;
  analysisResult?: FixAnalysisResult | null;
  site?: SiteContext;
  onVerifyGtm?: (gtmId: string) => Promise<import("@/app/actions/fixes").GtmVerificationResult>;
  onPushGtmSnippet?: (webflowId: string, gtmId: string) => Promise<import("@/app/actions/fixes").PushGtmResult>;
  onDeleteScript?: (webflowId: string, scriptId: string) => Promise<{ success: boolean; message: string }>;
  onRescan?: () => void;
  onSaveNote?: (step: string, note: string) => void;
}

const SEVERITY_ICON = {
  error: <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />,
  warning: <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />,
  info: <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />,
};

function RequirementsBox({ requirements }: { requirements: { label: string; reason: string }[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-md bg-amber-500/10 px-3 py-2">
      <button
        className="flex items-center gap-2 w-full text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        <span className="text-xs text-amber-600 dark:text-amber-400">
          Required:{" "}
          {requirements.map((r, i) => (
            <span key={i}>
              {i > 0 && ", "}
              <span className="underline">{r.label}</span>
            </span>
          ))}
        </span>
      </button>
      {expanded && (
        <div className="mt-1.5 pl-[22px] text-xs text-amber-600/80 dark:text-amber-400/80 space-y-1">
          {requirements.map((req, i) => (
            <p key={i}>{req.reason}</p>
          ))}
        </div>
      )}
    </div>
  );
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

export function CheckGuideDrawer({
  checkKey,
  open,
  onOpenChange,
  scanResult,
  analysisResult,
  site,
  onVerifyGtm,
  onPushGtmSnippet,
  onDeleteScript,
  onRescan,
  onSaveNote,
}: CheckGuideDrawerProps) {
  const guide = checkKey ? CHECK_GUIDES[checkKey] : null;
  const check = checkKey
    ? CHECKLIST.flatMap((c) => c.checks).find((c) => c.key === checkKey)
    : null;

  if (!guide) return null;

  const checkResult = checkKey
    ? scanResult?.checks.find((c) => c.checkKey === checkKey)
    : null;
  const remediation = checkKey ? REMEDIATION[checkKey] : null;
  const fixDef = checkKey ? AUTO_FIXES[checkKey] : null;
  const hasAnalysis = analysisResult && analysisResult.checkKey === checkKey;
  const isGuidedWithAnalysis = hasAnalysis && fixDef?.safetyLevel === "guided";
  const isAI = check?.automation === "ai-agent";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-mono">
              {guide.key}
            </Badge>
            <SheetTitle className="text-base">{guide.title}</SheetTitle>
            {checkResult?.status === "ok" && (
              <Badge variant="secondary" className="text-xs bg-green-500/15 text-green-600 dark:text-green-400">OK</Badge>
            )}
            {checkResult?.status === "issue" && (
              <Badge variant="destructive" className="text-xs">Issue</Badge>
            )}
            {checkResult?.status === "blocked" && (
              <Badge variant="secondary" className="text-xs bg-amber-500/15 text-amber-600 dark:text-amber-400">Blocked</Badge>
            )}
            {checkResult?.status === "client_managed" && (
              <Badge variant="secondary" className="text-xs bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">Client managed?</Badge>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="px-6 py-5 space-y-5">
            {checkKey && CHECK_REQUIREMENTS[checkKey] && (
              <RequirementsBox requirements={CHECK_REQUIREMENTS[checkKey]} />
            )}

            {(() => {
              const resp = check?.responsibility;
              if (!resp || resp === "agency") return null;
              const config = RESPONSIBILITY_CONFIG[resp];
              return (
                <div className={`flex items-start gap-2 p-2.5 rounded-md ${resp === "client" ? "bg-orange-500/10 border border-orange-500/20" : "bg-violet-500/10 border border-violet-500/20"}`}>
                  <Info className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${resp === "client" ? "text-orange-500" : "text-violet-500"}`} />
                  <p className={`text-xs ${resp === "client" ? "text-orange-700 dark:text-orange-400" : "text-violet-700 dark:text-violet-400"}`}>
                    {config.description}
                  </p>
                </div>
              );
            })()}

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Why this matters
              </h3>
              <p className="text-sm leading-relaxed">
                <GlossaryText text={guide.why} />
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                How to check
              </h3>
              <ol className="space-y-2">
                {guide.steps.map((step, i) => {
                  const isSubStep = step.startsWith("  -");
                  if (isSubStep) {
                    return (
                      <li key={i} className="text-sm leading-relaxed pl-8 text-muted-foreground">
                        {step.trim().replace(/^- /, "")}
                      </li>
                    );
                  }
                  return (
                    <li key={i} className="text-sm leading-relaxed flex gap-3">
                      <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0 w-5 text-right">
                        {i + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            {guide.tools && guide.tools.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Wrench className="h-3 w-3" />
                    Tools
                  </h3>
                  <ul className="space-y-1">
                    {guide.tools.map((tool, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        {tool}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {guide.tips && guide.tips.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Lightbulb className="h-3 w-3" />
                    Tips
                  </h3>
                  <ul className="space-y-1">
                    {guide.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {checkResult && (
              <>
                <Separator />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Summary{isAI ? " (AI)" : ""}
                  </h3>
                  <p className="text-sm">{checkResult.summary}</p>
                </div>

                {checkResult.findings.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                      Findings ({checkResult.findings.length})
                    </h3>
                    <div className="space-y-3">
                      {checkResult.findings.map((finding, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-start gap-2">
                            {SEVERITY_ICON[finding.severity]}
                            <p className="text-sm whitespace-pre-line">{finding.detail}</p>
                          </div>
                          {finding.element && finding.element !== "page" && (
                            <code className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded block ml-5 break-all">
                              {finding.element}
                            </code>
                          )}
                          {finding.pageUrl && (
                            <p className="text-xs text-muted-foreground ml-5">
                              Page: <a href={finding.pageUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{new URL(finding.pageUrl).pathname}</a>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {checkResult.status === "ok" && checkResult.findings.length === 0 && (
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="text-sm font-medium">No issues found</p>
                  </div>
                )}
              </>
            )}

            {isGuidedWithAnalysis && site ? (
              <>
                <Separator />
                <FixFlowPanel
                  checkKey={checkKey!}
                  analysisResult={analysisResult!}
                  site={site}
                  onVerifyGtm={onVerifyGtm}
                  onPushGtmSnippet={onPushGtmSnippet}
                  onDeleteScript={onDeleteScript}
                  onRescan={onRescan}
                  onSaveNote={onSaveNote}
                />
              </>
            ) : (
              <>
                {hasAnalysis && !isGuidedWithAnalysis && (
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
                          No automated action available. Follow the steps above to resolve this manually.
                        </p>
                      )}
                    </div>
                  </>
                )}

                {remediation && (checkResult?.status === "issue" || hasAnalysis) && (
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
              </>
            )}

            {scanResult && checkResult && (
              <>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  <p>Scanned: {scanResult.url}</p>
                  <p>Time: {scanResult.scannedAt ? new Date(scanResult.scannedAt).toLocaleString() : "-"}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
