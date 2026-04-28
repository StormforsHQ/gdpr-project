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
import { Button } from "@/components/ui/button";
import { HelpCircle, BookOpen } from "lucide-react";
import Link from "next/link";

interface HelpDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AUTOMATION_TYPES = [
  {
    label: "Auto",
    className: "bg-green-500/15 text-green-600 dark:text-green-400",
    description: "Runs automatically when you click 'Scan site'. Parses the page HTML to check for scripts, meta tags, and content.",
  },
  {
    label: "AI",
    className: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
    description: "Uses AI (via OpenRouter) to analyze page content. Runs when you click 'AI Analyze' or the individual 'Run check' button. Costs credits.",
  },
  {
    label: "Browser",
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    description: "Requires manual browser testing. Open the site, interact with the consent banner, and check behavior in DevTools.",
  },
  {
    label: "GTM API",
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    description: "Requires access to Google Tag Manager. Check tag configuration, triggers, and consent settings in the GTM dashboard.",
  },
  {
    label: "Cookiebot",
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    description: "Requires Cookiebot admin access. Check cookie categorization, scan settings, and compliance reports in the Cookiebot dashboard.",
  },
  {
    label: "Webflow",
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    description: "Requires Webflow Designer access. Check site settings, custom code, and form configurations.",
  },
  {
    label: "Manual",
    className: "bg-muted text-muted-foreground",
    description: "Requires human review. Read privacy policies, check legal documents, or verify processes that can't be automated.",
  },
];

const STATUS_INFO = [
  { label: "Not checked", dot: "bg-muted-foreground/30", description: "Not yet reviewed" },
  { label: "OK", dot: "bg-green-500", description: "Passes the requirement" },
  { label: "Issue", dot: "bg-destructive", description: "Needs attention or fixing" },
  { label: "N/A", dot: "bg-muted-foreground/50", description: "Not applicable to this site" },
];

export function HelpDrawer({ open, onOpenChange }: HelpDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-base flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Quick start
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="px-6 py-5 space-y-5">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                What this app does
              </h3>
              <p className="text-sm leading-relaxed">
                Audits websites for GDPR and ePrivacy compliance. Checks cookie consent setup
                (Cookiebot + GTM), data collection practices, privacy policies, and third-party
                services. Designed for auditing Webflow sites but works with any platform.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                How to audit a site
              </h3>
              <ol className="space-y-2">
                <li className="text-sm leading-relaxed flex gap-3">
                  <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0 w-5 text-right">1.</span>
                  <span>Go to <strong>Sites</strong> in the sidebar and add the site (name, URL, platform, Cookiebot ID, GTM ID)</span>
                </li>
                <li className="text-sm leading-relaxed flex gap-3">
                  <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0 w-5 text-right">2.</span>
                  <span>Click the site to open its audit page</span>
                </li>
                <li className="text-sm leading-relaxed flex gap-3">
                  <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0 w-5 text-right">3.</span>
                  <span>Click <strong>Scan site</strong> to run automated HTML checks (free, instant)</span>
                </li>
                <li className="text-sm leading-relaxed flex gap-3">
                  <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0 w-5 text-right">4.</span>
                  <span>Click <strong>AI Analyze</strong> to run AI-powered checks (uses OpenRouter credits)</span>
                </li>
                <li className="text-sm leading-relaxed flex gap-3">
                  <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0 w-5 text-right">5.</span>
                  <span>Work through remaining manual checks - click the <strong>info icon</strong> on any check for a step-by-step guide</span>
                </li>
                <li className="text-sm leading-relaxed flex gap-3">
                  <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0 w-5 text-right">6.</span>
                  <span>Set each check to OK, Issue, or N/A and add notes. Everything auto-saves.</span>
                </li>
              </ol>
            </div>

            <Separator />

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Check statuses
              </h3>
              <div className="space-y-1.5">
                {STATUS_INFO.map((s) => (
                  <div key={s.label} className="flex items-center gap-2 text-sm">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${s.dot}`} />
                    <span className="font-medium w-24">{s.label}</span>
                    <span className="text-muted-foreground text-xs">{s.description}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Automation types
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Each check has a badge showing how it's run:
              </p>
              <div className="space-y-2.5">
                {AUTOMATION_TYPES.map((t) => (
                  <div key={t.label} className="flex items-start gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 mt-0.5 ${t.className}`}>
                      {t.label}
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                <BookOpen className="h-3 w-3" />
                Reference docs
              </h3>
              <div className="space-y-1.5">
                <Link
                  href="/reference/technical-guide"
                  onClick={() => onOpenChange(false)}
                  className="block text-sm text-primary hover:underline"
                >
                  Technical Guide - Cookiebot + GTM configuration details
                </Link>
                <Link
                  href="/reference/audit-protocol"
                  onClick={() => onOpenChange(false)}
                  className="block text-sm text-primary hover:underline"
                >
                  Audit Protocol - Step-by-step audit process
                </Link>
                <Link
                  href="/reference/cheat-sheet"
                  onClick={() => onOpenChange(false)}
                  className="block text-sm text-primary hover:underline"
                >
                  Cheat Sheet - Quick reference for common checks
                </Link>
                <Link
                  href="/reference/mcp-servers"
                  onClick={() => onOpenChange(false)}
                  className="block text-sm text-primary hover:underline"
                >
                  MCP Servers - Platform integrations for automation
                </Link>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Tips
              </h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>Dotted-underlined terms have glossary tooltips - hover to learn what they mean</li>
                <li>Click the issue count badge to filter the checklist to issues only</li>
                <li>Missing Cookiebot ID or GTM ID? The site header shows which checks are blocked</li>
                <li>AI checks require OpenRouter credits - you'll get a warning if credits are low</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Help"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
      <HelpDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
