"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, HelpCircle, CircleDashed, CheckCircle2, AlertCircle, MinusCircle, Info, Scan, UserCircle } from "lucide-react";

export function ChecklistLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="text-sm">
      <button
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen(!open)}
      >
        <HelpCircle className="h-3.5 w-3.5" />
        How this page works
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {open && (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 text-xs text-muted-foreground">
          <div className="space-y-2">
            <p className="font-medium text-foreground">Scan buttons</p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <Scan className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <p><span className="text-foreground">Scan site</span> - Runs all applicable checks based on the selected coverage view: page HTML analysis, Cookiebot API, GTM API, and AI evaluation. Cookiebot and GTM checks only run for SLA clients. Uses OpenRouter credits for the AI portion.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground">Status icons</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <CircleDashed className="h-4 w-4 text-muted-foreground shrink-0" />
                <p>Not checked yet</p>
              </div>
              <div className="flex items-center gap-2">
                <CircleDashed className="h-4 w-4 text-amber-500 shrink-0" />
                <p>Blocked - needs a service ID (GTM or Cookiebot) before it can run</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <p>OK - no issues found</p>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p>Issue found - needs attention</p>
              </div>
              <div className="flex items-center gap-2">
                <MinusCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                <p>N/A - not applicable to this site</p>
              </div>
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-cyan-500 shrink-0" />
                <p>Client managed? - the client likely manages this themselves (e.g. their own GTM). Verify with the client.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground">Check type badges</p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 bg-green-500/15 text-green-600 dark:text-green-400 mt-0.5">Auto</span>
                <p>Runs automatically with the Scan site button. Analyzes page HTML directly.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 bg-amber-500/15 text-amber-600 dark:text-amber-400 mt-0.5">Cookiebot</span>
                <p>Queries the Cookiebot API. Requires a Cookiebot ID on the site. Only runs for SLA clients.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 bg-amber-500/15 text-amber-600 dark:text-amber-400 mt-0.5">GTM API</span>
                <p>Queries the Google Tag Manager API. Requires a GTM container ID on the site. Only runs for SLA clients.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 bg-purple-500/15 text-purple-600 dark:text-purple-400 mt-0.5">AI</span>
                <p>An LLM reviews the page content and evaluates compliance. Uses OpenRouter credits. Cost per run is shown in the header.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 bg-blue-500/15 text-blue-600 dark:text-blue-400 mt-0.5">Browser</span>
                <p>Requires opening the site in a real browser and interacting with it (clicking buttons, simulating locations, checking DevTools). Follow the step-by-step guide for each check.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 bg-muted text-muted-foreground mt-0.5">Manual</span>
                <p>Requires a human to review. Cannot be automated - involves contacting clients, reviewing contracts, or checking admin panels.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground">Responsibility badges</p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 bg-orange-500/15 text-orange-600 dark:text-orange-400 mt-0.5">Client</span>
                <p>The client's responsibility as data controller. Our job is to make them aware and document their answer.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 bg-violet-500/15 text-violet-600 dark:text-violet-400 mt-0.5">Content</span>
                <p>Responsibility of whoever writes the content (usually the client or their legal team). We check it, but the content is not ours to write.</p>
              </div>
              <p className="text-muted-foreground/70">Checks without a responsibility badge are the agency's (our) responsibility - technical implementation we handle directly.</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground">Row icons</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                <p>Check guide - explains what this check looks for, how to verify it, and shows scan findings and fix steps after a scan has run.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
