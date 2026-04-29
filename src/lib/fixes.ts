export interface FixDefinition {
  checkKey: string;
  label: string;
  description: string;
  requires: ("webflow" | "gtm")[];
}

export const AUTO_FIXES: Record<string, FixDefinition> = {
  A1: {
    checkKey: "A1",
    label: "Remove non-GTM scripts from header",
    description: "Removes hardcoded scripts from the Webflow site header, keeping only GTM and Cookiebot.",
    requires: ["webflow"],
  },
  A2: {
    checkKey: "A2",
    label: "Remove scripts from footer",
    description: "Removes hardcoded scripts from the Webflow site footer.",
    requires: ["webflow"],
  },
  A3: {
    checkKey: "A3",
    label: "Fix Cookiebot CMP trigger",
    description: "Updates the Cookiebot CMP tag trigger from 'All Pages' to 'Consent Initialization - All Pages'.",
    requires: ["gtm"],
  },
  A4: {
    checkKey: "A4",
    label: "Switch to official Cookiebot template",
    description: "Replaces the Custom HTML Cookiebot tag with the official Cookiebot CMP GTM template.",
    requires: ["gtm"],
  },
  A5: {
    checkKey: "A5",
    label: "Disable AutoBlock",
    description: "Turns off AutoBlock in the Cookiebot CMP tag settings.",
    requires: ["gtm"],
  },
  B1: {
    checkKey: "B1",
    label: "Add GTM snippet to header",
    description: "Injects the Google Tag Manager container snippet into the Webflow site header.",
    requires: ["webflow"],
  },
  B3: {
    checkKey: "B3",
    label: "Set consent on non-Google tags",
    description: "Adds 'Require additional consent' settings to non-Google GTM tags.",
    requires: ["gtm"],
  },
  B4: {
    checkKey: "B4",
    label: "Fix non-Google tag triggers",
    description: "Updates non-Google tag triggers to use cookie_consent_update event.",
    requires: ["gtm"],
  },
  D1: {
    checkKey: "D1",
    label: "Remove ghost scripts",
    description: "Removes scripts from discontinued services found in the site header/footer.",
    requires: ["webflow"],
  },
  D3: {
    checkKey: "D3",
    label: "Remove orphaned pixels",
    description: "Removes tracking pixels hardcoded in the site header (should be in GTM).",
    requires: ["webflow"],
  },
  E1: {
    checkKey: "E1",
    label: "Fix YouTube embeds",
    description: "Replaces youtube.com/embed URLs with youtube-nocookie.com.",
    requires: ["webflow"],
  },
  I4: {
    checkKey: "I4",
    label: "Add privacy policy link",
    description: "Adds a privacy policy link to the site footer.",
    requires: ["webflow"],
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
  if (fix.requires.includes("gtm") && !process.env.GTM_API_TOKEN) {
    missing.push("GTM API token");
  }
  return missing;
}
