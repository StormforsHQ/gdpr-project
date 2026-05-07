"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import type { FixAnalysisResult, GtmVerificationResult, PushGtmResult } from "@/app/actions/fixes";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  ExternalLink,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Shield,
  Trash2,
} from "lucide-react";

interface SiteContext {
  platform?: string | null;
  webflowId?: string | null;
  gtmId?: string | null;
  cookiebotId?: string | null;
}

interface FixFlowPanelProps {
  checkKey: string;
  analysisResult: FixAnalysisResult;
  site: SiteContext;
  onVerifyGtm?: (gtmId: string) => Promise<GtmVerificationResult>;
  onPushGtmSnippet?: (webflowId: string, gtmId: string) => Promise<PushGtmResult>;
  onDeleteScript?: (webflowId: string, scriptId: string) => Promise<{ success: boolean; message: string }>;
  onRescan?: () => void;
  onSaveNote?: (step: string, note: string) => void;
}

type StepStatus = "pending" | "active" | "done" | "skipped";

interface StepState {
  status: StepStatus;
  expanded: boolean;
}

const STEP_LABELS = [
  "What we found",
  "Recreate in GTM",
  "Verify GTM setup",
  "Handle old scripts",
  "Push GTM snippet",
  "Re-scan to verify",
];

function StepHeader({
  index,
  label,
  status,
  expanded,
  onClick,
}: {
  index: number;
  label: string;
  status: StepStatus;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2 text-left hover:bg-accent/30 rounded-md px-2 transition-colors"
    >
      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
        status === "done"
          ? "bg-green-500/15 text-green-600 dark:text-green-400"
          : status === "active"
            ? "bg-primary/15 text-primary"
            : status === "skipped"
              ? "bg-muted text-muted-foreground line-through"
              : "bg-muted text-muted-foreground"
      }`}>
        {status === "done" ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
      </div>
      <span className={`text-sm flex-1 ${
        status === "done"
          ? "text-green-600 dark:text-green-400"
          : status === "active"
            ? "font-medium"
            : status === "skipped"
              ? "text-muted-foreground line-through"
              : "text-muted-foreground"
      }`}>
        {label}
      </span>
      {expanded ? (
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

export function FixFlowPanel({
  checkKey,
  analysisResult,
  site,
  onVerifyGtm,
  onPushGtmSnippet,
  onDeleteScript,
  onRescan,
  onSaveNote,
}: FixFlowPanelProps) {
  const isWebflow = site.platform === "webflow" || !site.platform;
  const hasWebflowId = !!site.webflowId;
  const hasGtmId = !!site.gtmId;
  const isA1orA2 = checkKey === "A1" || checkKey === "A2";

  const [steps, setSteps] = useState<StepState[]>(() =>
    STEP_LABELS.map((_, i) => ({
      status: i === 0 ? "active" : "pending",
      expanded: i === 0,
    }))
  );

  const [gtmVerification, setGtmVerification] = useState<GtmVerificationResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [pushResult, setPushResult] = useState<PushGtmResult | null>(null);
  const [pushing, setPushing] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [manualStepsDone, setManualStepsDone] = useState<Record<string, boolean>>({});

  const toggleStep = (index: number) => {
    setSteps((prev) => prev.map((s, i) => i === index ? { ...s, expanded: !s.expanded } : s));
  };

  const completeStep = (index: number) => {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i === index) return { ...s, status: "done", expanded: false };
        if (i === index + 1 && s.status === "pending") return { ...s, status: "active", expanded: true };
        return s;
      })
    );
    onSaveNote?.(STEP_LABELS[index], "Completed");
  };

  const skipStep = (index: number) => {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i === index) return { ...s, status: "skipped", expanded: false };
        if (i === index + 1 && s.status === "pending") return { ...s, status: "active", expanded: true };
        return s;
      })
    );
    onSaveNote?.(STEP_LABELS[index], "Skipped");
  };

  const markManualDone = (key: string) => {
    setManualStepsDone((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleVerifyGtm = async () => {
    if (!onVerifyGtm || !site.gtmId) return;
    setVerifying(true);
    try {
      const result = await onVerifyGtm(site.gtmId);
      setGtmVerification(result);
    } finally {
      setVerifying(false);
    }
  };

  const handlePushSnippet = async () => {
    if (!onPushGtmSnippet || !site.webflowId || !site.gtmId) return;
    setPushing(true);
    try {
      const result = await onPushGtmSnippet(site.webflowId, site.gtmId);
      setPushResult(result);
    } finally {
      setPushing(false);
    }
  };

  const handleCopySnippet = async () => {
    if (!site.gtmId) return;
    const snippet = `<!-- Google Tag Manager -->\n<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\nnew Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\nj=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n})(window,document,'script','dataLayer','${site.gtmId}');</script>\n<!-- End Google Tag Manager -->`;
    await navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  // Prerequisites check
  if (!isA1orA2 && checkKey !== "D1" && checkKey !== "D3") {
    return null;
  }

  const prerequisiteWarnings: string[] = [];
  if (isWebflow && !hasWebflowId) {
    prerequisiteWarnings.push(
      "Connect this site to Webflow to enable automated fixes. Use Detect IDs or enter the Webflow ID manually in site settings."
    );
  }
  if (!hasGtmId) {
    prerequisiteWarnings.push(
      "This site has no GTM container ID. Add it in site settings to enable GTM verification and snippet push."
    );
  }

  const scripts = analysisResult.scripts;
  const hasTrackingScripts = (scripts?.tracking.length ?? 0) > 0;
  const hasUnknownScripts = (scripts?.unknown.length ?? 0) > 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Fix flow</h3>
        <Badge variant="secondary" className="text-[10px]">
          {steps.filter((s) => s.status === "done").length}/{STEP_LABELS.length} steps
        </Badge>
      </div>

      {prerequisiteWarnings.length > 0 && (
        <div className="space-y-2 mb-4">
          {prerequisiteWarnings.map((warning, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">{warning}</p>
            </div>
          ))}
        </div>
      )}

      {site.platform && site.platform !== "webflow" && (
        <div className="flex items-start gap-2 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-md mb-4">
          <AlertCircle className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-400">
            This is a {site.platform} site. Steps 4-5 (handle scripts, push snippet) require manual action in the {site.platform} platform.
            Webflow API-based automation is not available for this platform.
          </p>
        </div>
      )}

      {/* Step 1: What we found */}
      <div>
        <StepHeader
          index={0}
          label={STEP_LABELS[0]}
          status={steps[0].status}
          expanded={steps[0].expanded}
          onClick={() => toggleStep(0)}
        />
        {steps[0].expanded && (
          <div className="pl-11 pr-2 pb-3 space-y-3">
            <p className="text-xs text-muted-foreground">{analysisResult.message}</p>

            {scripts && (
              <div className="space-y-3">
                {scripts.tracking.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-destructive mb-1.5">
                      Tracking scripts - must move to GTM ({scripts.tracking.length})
                    </h4>
                    <div className="space-y-1.5">
                      {scripts.tracking.map((item, i) => (
                        <div key={i} className="space-y-0.5">
                          <p className="text-xs font-medium">{item.detail}</p>
                          <code className="text-[11px] bg-muted text-muted-foreground px-2 py-1 rounded block break-all">
                            {item.script}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {scripts.nonTracking.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1.5">
                      Non-tracking scripts - can stay ({scripts.nonTracking.length})
                    </h4>
                    <div className="space-y-1.5">
                      {scripts.nonTracking.map((item, i) => (
                        <div key={i} className="space-y-0.5">
                          <p className="text-xs font-medium">{item.detail}</p>
                          <code className="text-[11px] bg-muted text-muted-foreground px-2 py-1 rounded block break-all">
                            {item.script}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {scripts.unknown.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1.5">
                      Unknown scripts - review manually ({scripts.unknown.length})
                    </h4>
                    <div className="space-y-1.5">
                      {scripts.unknown.map((item, i) => (
                        <div key={i} className="space-y-0.5">
                          <p className="text-xs font-medium">{item.detail}</p>
                          <code className="text-[11px] bg-muted text-muted-foreground px-2 py-1 rounded block break-all">
                            {item.script}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!hasTrackingScripts && !hasUnknownScripts && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-xs font-medium">No tracking scripts found - header looks clean.</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => completeStep(0)}>
                Continue
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Recreate in GTM */}
      <div>
        <StepHeader
          index={1}
          label={STEP_LABELS[1]}
          status={steps[1].status}
          expanded={steps[1].expanded}
          onClick={() => toggleStep(1)}
        />
        {steps[1].expanded && (
          <div className="pl-11 pr-2 pb-3 space-y-3">
            {hasTrackingScripts ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Each tracking script found in step 1 needs to be recreated as a GTM tag with proper consent triggers.
                  This is a manual step done in the GTM web interface.
                </p>
                <div className="space-y-2">
                  {scripts?.tracking.map((item, i) => (
                    <label key={i} className="flex items-start gap-2 cursor-pointer">
                      <Checkbox
                        checked={!!manualStepsDone[`gtm-${i}`]}
                        onCheckedChange={() => markManualDone(`gtm-${i}`)}
                        className="mt-0.5"
                      />
                      <span className="text-xs">
                        <span className="font-medium">{item.detail}</span> - recreated as GTM tag with consent trigger
                      </span>
                    </label>
                  ))}
                </div>
                {site.gtmId && (
                  <a
                    href={`https://tagmanager.google.com/#/container/accounts/~/containers/~/workspaces/default?id=${site.gtmId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open GTM
                  </a>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                No tracking scripts to move. You can skip this step.
              </p>
            )}

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => completeStep(1)}>
                {hasTrackingScripts ? "I've recreated these in GTM" : "Continue"}
              </Button>
              {hasTrackingScripts && (
                <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => skipStep(1)}>
                  Skip for now
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Verify GTM setup */}
      <div>
        <StepHeader
          index={2}
          label={STEP_LABELS[2]}
          status={steps[2].status}
          expanded={steps[2].expanded}
          onClick={() => toggleStep(2)}
        />
        {steps[2].expanded && (
          <div className="pl-11 pr-2 pb-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              Verify that the GTM container has proper consent configuration: Cookiebot tag firing on Consent Initialization,
              and all non-Google tags requiring consent before firing.
            </p>

            {hasGtmId && onVerifyGtm ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs gap-1.5"
                  onClick={handleVerifyGtm}
                  disabled={verifying}
                >
                  {verifying ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Search className="h-3 w-3" />
                  )}
                  {verifying ? "Checking..." : "Check GTM container"}
                </Button>

                {gtmVerification && (
                  <div className="rounded-md border p-3 space-y-2">
                    <p className="text-xs font-medium">{gtmVerification.message}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        {gtmVerification.hasCookiebot ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-destructive" />
                        )}
                        <span>Cookiebot tag</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {gtmVerification.cookiebotTriggerCorrect ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-amber-500" />
                        )}
                        <span>Consent Init trigger</span>
                      </div>
                    </div>
                    {gtmVerification.missingConsent.length > 0 && (
                      <div>
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">
                          Tags missing consent ({gtmVerification.missingConsent.length}):
                        </p>
                        <ul className="space-y-0.5">
                          {gtmVerification.missingConsent.map((tag, i) => (
                            <li key={i} className="text-xs text-muted-foreground">
                              {tag.name} ({tag.type})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {!hasGtmId
                    ? "No GTM container ID set. Add it in site settings to enable automatic verification."
                    : "GTM API not available. Check manually:"}
                </p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
                  <li>Open GTM and go to Tags</li>
                  <li>Check that Cookiebot CMP fires on "Consent Initialization - All Pages"</li>
                  <li>Check that non-Google tags have "Additional Consent Required"</li>
                </ol>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => completeStep(2)}>
                {gtmVerification ? "Continue" : "I've verified manually"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => skipStep(2)}>
                Skip
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Step 4: Handle old scripts */}
      <div>
        <StepHeader
          index={3}
          label={STEP_LABELS[3]}
          status={steps[3].status}
          expanded={steps[3].expanded}
          onClick={() => toggleStep(3)}
        />
        {steps[3].expanded && (
          <div className="pl-11 pr-2 pb-3 space-y-3">
            {hasTrackingScripts || hasUnknownScripts ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Now that tracking scripts are recreated in GTM, the old scripts in the {checkKey === "A2" ? "footer" : "header"} need
                  to be removed or commented out. This prevents them from running outside of consent control.
                </p>

                {isWebflow && hasWebflowId ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium">In the Webflow Designer:</p>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
                      <li>Go to Site Settings - Custom Code - {checkKey === "A2" ? "Footer Code" : "Head Code"}</li>
                      <li>Comment out each tracking script by wrapping it in {"<!-- "} and {" -->"}</li>
                      <li>Leave non-tracking scripts (fonts, CSS fixes) in place</li>
                      <li>Save and publish</li>
                    </ol>
                    <a
                      href={`https://webflow.com/dashboard/sites/${site.webflowId}/code`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open Webflow Custom Code
                    </a>
                  </div>
                ) : isWebflow ? (
                  <div className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      No Webflow ID set. Add it in site settings to get a direct link to the Designer.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Manual steps for {site.platform}:</p>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
                      <li>Open your site's {checkKey === "A2" ? "footer" : "header"} code settings</li>
                      <li>Remove or comment out each tracking script identified in step 1</li>
                      <li>Keep non-tracking scripts in place</li>
                      <li>Save and deploy</li>
                    </ol>
                  </div>
                )}

                {analysisResult.existingGtmSnippet?.apiManaged && onDeleteScript && site.webflowId && (
                  <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                      API-managed script detected
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {analysisResult.existingGtmSnippet.detail}
                    </p>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs gap-1.5"
                      onClick={async () => {
                        // This would need the actual script ID - for now just mark as needing manual review
                        onSaveNote?.("Handle old scripts", "API-managed script flagged for review");
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove API-managed script
                    </Button>
                  </div>
                )}

                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox
                    checked={!!manualStepsDone["old-scripts"]}
                    onCheckedChange={() => markManualDone("old-scripts")}
                    className="mt-0.5"
                  />
                  <span className="text-xs">
                    I have commented out / removed old tracking scripts in the {isWebflow ? "Webflow Designer" : `${site.platform} platform`}
                  </span>
                </label>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                No tracking or unknown scripts were found. You can skip this step.
              </p>
            )}

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => completeStep(3)}>
                {hasTrackingScripts || hasUnknownScripts ? "Done" : "Continue"}
              </Button>
              {(hasTrackingScripts || hasUnknownScripts) && (
                <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => skipStep(3)}>
                  Skip for now
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step 5: Push GTM snippet */}
      <div>
        <StepHeader
          index={4}
          label={STEP_LABELS[4]}
          status={steps[4].status}
          expanded={steps[4].expanded}
          onClick={() => toggleStep(4)}
        />
        {steps[4].expanded && (
          <div className="pl-11 pr-2 pb-3 space-y-3">
            {checkKey === "A2" ? (
              <p className="text-xs text-muted-foreground">
                This step is for header scripts (A1). The footer doesn't need a GTM snippet.
                You can skip this step.
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Push the GTM container snippet to the site header. This ensures GTM loads on every page
                  and manages all tags through consent-controlled triggers.
                </p>

                {analysisResult.existingGtmSnippet && !analysisResult.existingGtmSnippet.apiManaged && (
                  <div className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      A manually-added GTM snippet was detected. Comment it out in the Webflow Designer before pushing,
                      or you'll have duplicate GTM snippets causing double-tracking.
                    </p>
                  </div>
                )}

                {isWebflow && hasWebflowId && hasGtmId && onPushGtmSnippet ? (
                  <div className="space-y-3">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <Checkbox
                        checked={confirmCheckbox}
                        onCheckedChange={(checked) => setConfirmCheckbox(checked === true)}
                        className="mt-0.5"
                      />
                      <span className="text-xs">
                        I have removed or commented out old scripts in the Webflow Designer
                      </span>
                    </label>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        disabled={!confirmCheckbox || pushing}
                        onClick={handlePushSnippet}
                      >
                        {pushing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                        {pushing ? "Pushing..." : `Push GTM snippet (${site.gtmId})`}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5"
                        onClick={handleCopySnippet}
                      >
                        <ClipboardCopy className="h-3 w-3" />
                        {copiedSnippet ? "Copied!" : "Copy snippet"}
                      </Button>
                    </div>

                    {pushResult && (
                      <div className={`flex items-start gap-2 p-2.5 rounded-md ${
                        pushResult.success
                          ? "bg-green-500/10 border border-green-500/20"
                          : "bg-destructive/10 border border-destructive/20"
                      }`}>
                        {pushResult.success ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                        )}
                        <p className={`text-xs ${pushResult.success ? "text-green-700 dark:text-green-400" : "text-destructive"}`}>
                          {pushResult.message}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {!hasGtmId && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        No GTM container ID set. Add it in site settings.
                      </p>
                    )}
                    {!hasWebflowId && isWebflow && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        No Webflow ID set. Add it in site settings to enable API push, or copy the snippet manually.
                      </p>
                    )}
                    {hasGtmId && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5"
                        onClick={handleCopySnippet}
                      >
                        <ClipboardCopy className="h-3 w-3" />
                        {copiedSnippet ? "Copied!" : "Copy GTM snippet"}
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Paste the snippet at the top of the {isWebflow ? "Webflow site header custom code" : "site header"}.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => completeStep(4)}>
                {pushResult?.success ? "Continue" : checkKey === "A2" ? "Skip" : "Done manually"}
              </Button>
              {checkKey !== "A2" && (
                <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => skipStep(4)}>
                  Skip
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step 6: Re-scan */}
      <div>
        <StepHeader
          index={5}
          label={STEP_LABELS[5]}
          status={steps[5].status}
          expanded={steps[5].expanded}
          onClick={() => toggleStep(5)}
        />
        {steps[5].expanded && (
          <div className="pl-11 pr-2 pb-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              Run a new scan to verify that the changes are working: tracking scripts removed from the header,
              GTM snippet present, and consent controls active.
            </p>

            {onRescan ? (
              <Button
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => {
                  onRescan();
                  completeStep(5);
                }}
              >
                <RefreshCw className="h-3 w-3" />
                Re-scan site
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Close this panel and click "Scan site" to run a fresh scan.
              </p>
            )}

            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => completeStep(5)}>
              Done
            </Button>
          </div>
        )}
      </div>

      <Separator className="my-3" />
      <p className="text-[11px] text-muted-foreground">
        Step completion is saved to the audit trail. You can revisit any step by clicking its header.
      </p>
    </div>
  );
}
