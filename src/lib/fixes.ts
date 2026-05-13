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
    label: "How to fix Cookiebot trigger",
    description: "Shows how to change the Cookiebot CMP tag trigger to 'Consent Initialization - All Pages' in GTM.",
    requires: ["gtm"],
    safetyLevel: "guided",
    warning: "This does NOT modify GTM. Follow the steps to make the change yourself in the GTM web interface.",
  },
  A4: {
    checkKey: "A4",
    label: "How to switch to official template",
    description: "Shows how to replace a Custom HTML Cookiebot tag with the official GTM template.",
    requires: ["gtm"],
    safetyLevel: "guided",
    warning: "This does NOT modify GTM. Follow the steps to make the change yourself in the GTM web interface.",
  },
  A5: {
    checkKey: "A5",
    label: "How to disable AutoBlock",
    description: "Shows how to turn off AutoBlock in the Cookiebot CMP tag settings in GTM.",
    requires: ["gtm"],
    safetyLevel: "guided",
    warning: "This does NOT modify GTM. Follow the steps to make the change yourself in the GTM web interface.",
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
    label: "How to set consent on tags",
    description: "Shows how to add consent requirements to non-Google GTM tags via the Consent Overview.",
    requires: ["gtm"],
    safetyLevel: "guided",
    warning: "This does NOT modify GTM. Follow the steps to make the change yourself in the GTM web interface.",
  },
  B4: {
    checkKey: "B4",
    label: "How to fix tag triggers",
    description: "Shows how to update non-Google tag triggers to use consent-aware events instead of 'All Pages'.",
    requires: ["gtm"],
    safetyLevel: "guided",
    warning: "This does NOT modify GTM. Follow the steps to make the change yourself in the GTM web interface.",
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
