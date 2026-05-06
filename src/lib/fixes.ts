export type FixSafetyLevel = "safe" | "confirm" | "guided";

export interface FixDefinition {
  checkKey: string;
  label: string;
  description: string;
  requires: ("webflow" | "gtm")[];
  safetyLevel: FixSafetyLevel;
  warning?: string;
}

export const AUTO_FIXES: Record<string, FixDefinition> = {
  A1: {
    checkKey: "A1",
    label: "Analyze header scripts",
    description: "Analyzes scripts in the Webflow site header and categorizes them as tracking, non-tracking, or unknown. Does not remove anything automatically.",
    requires: ["webflow"],
    safetyLevel: "guided",
    warning: "Script removal must be done manually in the Webflow Designer. The app categorizes what's there so you know what to move to GTM and what can stay.",
  },
  A2: {
    checkKey: "A2",
    label: "Analyze footer scripts",
    description: "Analyzes scripts in the Webflow site footer and categorizes them.",
    requires: ["webflow"],
    safetyLevel: "guided",
    warning: "Footer scripts that track visitors need to move into GTM. Non-tracking scripts can stay.",
  },
  A3: {
    checkKey: "A3",
    label: "Fix Cookiebot CMP trigger",
    description: "Updates the Cookiebot CMP tag trigger from 'All Pages' to 'Consent Initialization - All Pages'.",
    requires: ["gtm"],
    safetyLevel: "confirm",
    warning: "This changes the Cookiebot tag's trigger inside GTM. The consent banner will start loading earlier (before other tags), which is the correct behavior.",
  },
  A4: {
    checkKey: "A4",
    label: "Switch to official Cookiebot template",
    description: "Replaces the Custom HTML Cookiebot tag with the official Cookiebot CMP GTM template.",
    requires: ["gtm"],
    safetyLevel: "confirm",
    warning: "This requires the official Cookiebot template from the GTM Community Gallery to be installed first. The tag type will change but the behavior should be the same.",
  },
  A5: {
    checkKey: "A5",
    label: "Disable AutoBlock",
    description: "Turns off AutoBlock in the Cookiebot CMP tag settings.",
    requires: ["gtm"],
    safetyLevel: "confirm",
    warning: "AutoBlock can interfere with GTM's consent mode. Disabling it lets GTM handle consent properly through trigger-based firing.",
  },
  B1: {
    checkKey: "B1",
    label: "Push GTM snippet to header",
    description: "Adds the GTM container snippet to the Webflow site header via the API.",
    requires: ["webflow"],
    safetyLevel: "confirm",
    warning: "Before pushing, make sure any manually-added GTM snippet in the Designer custom code is commented out. Two GTM snippets cause double-tracking.",
  },
  B3: {
    checkKey: "B3",
    label: "Set consent on non-Google tags",
    description: "Adds 'Require additional consent' settings to non-Google GTM tags.",
    requires: ["gtm"],
    safetyLevel: "confirm",
    warning: "This adds consent requirements to tags that currently fire without checking consent. After this change, these tags will only fire when the visitor has accepted the relevant cookie categories.",
  },
  B4: {
    checkKey: "B4",
    label: "Fix non-Google tag triggers",
    description: "Updates non-Google tag triggers to use cookie_consent_update event.",
    requires: ["gtm"],
    safetyLevel: "confirm",
    warning: "Each tag needs the correct consent-specific trigger based on its purpose. This requires manual review in GTM.",
  },
  D1: {
    checkKey: "D1",
    label: "Analyze ghost scripts",
    description: "Identifies scripts from discontinued services in the site header/footer.",
    requires: ["webflow"],
    safetyLevel: "guided",
    warning: "Ghost scripts should be removed manually in the Webflow Designer after confirming the service is truly discontinued.",
  },
  D3: {
    checkKey: "D3",
    label: "Analyze orphaned pixels",
    description: "Identifies tracking pixels hardcoded in the site header that should be in GTM.",
    requires: ["webflow"],
    safetyLevel: "guided",
    warning: "These pixels need to be recreated as GTM tags first, then the old code removed from the Designer.",
  },
  E1: {
    checkKey: "E1",
    label: "Fix YouTube embeds",
    description: "Replaces youtube.com/embed URLs with youtube-nocookie.com.",
    requires: ["webflow"],
    safetyLevel: "safe",
  },
  I4: {
    checkKey: "I4",
    label: "Add privacy policy link",
    description: "Adds a privacy policy link to the site footer.",
    requires: ["webflow"],
    safetyLevel: "safe",
  },
};

export function getFixForCheck(checkKey: string): FixDefinition | null {
  return AUTO_FIXES[checkKey] || null;
}

export function getMissingServices(fix: FixDefinition): string[] {
  const missing: string[] = [];
  if (fix.requires.includes("webflow") && !process.env.WEBFLOW_API_TOKEN) {
    missing.push("Webflow API token");
  }
  if (fix.requires.includes("gtm") && !process.env.GOOGLE_REFRESH_TOKEN) {
    missing.push("Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)");
  }
  return missing;
}
