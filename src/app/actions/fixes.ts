"use server";

import { AUTO_FIXES, type FixDefinition } from "@/lib/fixes";
import { isWebflowConfigured } from "@/lib/api/webflow";
import { isGtmConfigured } from "@/lib/api/gtm";

export interface FixAvailability {
  checkKey: string;
  fix: FixDefinition;
  ready: boolean;
  missingServices: string[];
}

export interface ScriptAnalysis {
  tracking: Array<{ script: string; detail: string }>;
  nonTracking: Array<{ script: string; detail: string }>;
  unknown: Array<{ script: string; detail: string }>;
}

export interface FixAnalysisResult {
  checkKey: string;
  canAutoFix: boolean;
  warning?: string;
  message: string;
  scripts?: ScriptAnalysis;
  existingGtmSnippet?: { apiManaged: boolean; detail: string } | null;
}

export async function getFixAvailability(): Promise<Record<string, FixAvailability>> {
  const webflowReady = isWebflowConfigured();
  const gtmReady = isGtmConfigured();

  const result: Record<string, FixAvailability> = {};

  for (const [key, fix] of Object.entries(AUTO_FIXES)) {
    const missing: string[] = [];
    if (fix.requires.includes("webflow") && !webflowReady) {
      missing.push("Webflow API token (WEBFLOW_API_TOKEN)");
    }
    if (fix.requires.includes("gtm") && !gtmReady) {
      missing.push("Google OAuth credentials (GOOGLE_REFRESH_TOKEN)");
    }

    result[key] = {
      checkKey: key,
      fix,
      ready: missing.length === 0,
      missingServices: missing,
    };
  }

  return result;
}

const TRACKING_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /google-analytics\.com|googletagmanager\.com\/gtag|gtag\s*\(/i, name: "Google Analytics" },
  { pattern: /fbevents\.js|connect\.facebook\.net/i, name: "Meta Pixel" },
  { pattern: /hotjar\.com/i, name: "HotJar" },
  { pattern: /linkedin\.com\/insight|snap\.licdn\.com/i, name: "LinkedIn Insight Tag" },
  { pattern: /googleads\.g\.doubleclick|google_conversion|gtag.*conversion/i, name: "Google Ads" },
  { pattern: /clarity\.ms/i, name: "Microsoft Clarity" },
  { pattern: /hubspot\.com.*analytics|hs-analytics/i, name: "HubSpot Analytics" },
  { pattern: /plausible\.io/i, name: "Plausible Analytics" },
  { pattern: /matomo\.|piwik\./i, name: "Matomo" },
  { pattern: /twitter\.com\/i\/adsct|twq\s*\(/i, name: "Twitter/X Pixel" },
  { pattern: /pinterest\.com\/ct|pintrk\s*\(/i, name: "Pinterest Tag" },
  { pattern: /tiktok\.com.*analytics|ttq\s*\./i, name: "TikTok Pixel" },
];

const NON_TRACKING_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /webkit-font-smoothing|font-smoothing|text-rendering/i, name: "CSS font fix" },
  { pattern: /@font-face|fonts\.googleapis\.com|typekit\.net/i, name: "Custom font" },
  { pattern: /application\/ld\+json/i, name: "JSON-LD structured data" },
  { pattern: /webflow\.js|Webflow\.push/i, name: "Webflow framework script" },
  { pattern: /jquery|jQuery/i, name: "jQuery" },
  { pattern: /accessibility|a11y|aria-/i, name: "Accessibility tool" },
];

function categorizeScript(scriptHtml: string): { category: "tracking" | "nonTracking" | "unknown"; name: string } {
  for (const { pattern, name } of TRACKING_PATTERNS) {
    if (pattern.test(scriptHtml)) return { category: "tracking", name };
  }
  for (const { pattern, name } of NON_TRACKING_PATTERNS) {
    if (pattern.test(scriptHtml)) return { category: "nonTracking", name };
  }
  return { category: "unknown", name: "Unrecognized script" };
}

function extractScripts(html: string): string[] {
  const scriptPattern = /<script[\s\S]*?<\/script>/gi;
  const stylePattern = /<style[\s\S]*?<\/style>/gi;
  const scripts = html.match(scriptPattern) || [];
  const styles = html.match(stylePattern) || [];
  return [...scripts, ...styles];
}

function truncateScript(script: string, maxLength = 120): string {
  const oneLine = script.replace(/\s+/g, " ").trim();
  return oneLine.length > maxLength ? oneLine.slice(0, maxLength) + "..." : oneLine;
}

export async function analyzeFix(
  checkKey: string,
  siteWebflowId?: string | null,
  siteGtmId?: string | null,
): Promise<FixAnalysisResult> {
  const fix = AUTO_FIXES[checkKey];
  if (!fix) return { checkKey, canAutoFix: false, message: `No fix available for ${checkKey}` };

  if (fix.requires.includes("webflow") && !isWebflowConfigured()) {
    return { checkKey, canAutoFix: false, message: "Webflow API token not configured" };
  }
  if (fix.requires.includes("gtm") && !isGtmConfigured()) {
    return { checkKey, canAutoFix: false, message: "GTM API token not configured" };
  }
  if (fix.requires.includes("webflow") && !siteWebflowId) {
    return { checkKey, canAutoFix: false, message: "This site has no Webflow ID. Add it in site settings (Edit Site)." };
  }

  switch (checkKey) {
    case "A1":
    case "A2":
    case "D1":
    case "D3":
      return analyzeScripts(checkKey, siteWebflowId!, checkKey === "A2" ? "footer" : "header");
    case "B1":
      return analyzeB1(siteWebflowId!, siteGtmId);
    default:
      return {
        checkKey,
        canAutoFix: fix.safetyLevel !== "guided",
        message: fix.description,
        warning: fix.warning,
      };
  }
}

async function analyzeScripts(
  checkKey: string,
  webflowId: string,
  location: "header" | "footer",
): Promise<FixAnalysisResult> {
  const { getCustomCode } = await import("@/lib/api/webflow");
  const { headCode, footerCode } = await getCustomCode(webflowId);
  const code = location === "header" ? headCode : footerCode;

  if (!code.trim()) {
    return {
      checkKey,
      canAutoFix: false,
      message: `${location === "header" ? "Header" : "Footer"} is empty - nothing to analyze.`,
    };
  }

  const gtmPattern = /<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/gi;
  const cookiebotPattern = /<script[^>]*consent\.cookiebot\.com[^>]*>[\s\S]*?<\/script>/gi;

  const codeWithoutGtmCb = code.replace(gtmPattern, "").replace(cookiebotPattern, "");
  const scripts = extractScripts(codeWithoutGtmCb);

  const analysis: ScriptAnalysis = { tracking: [], nonTracking: [], unknown: [] };

  for (const script of scripts) {
    const { category, name } = categorizeScript(script);
    analysis[category].push({ script: truncateScript(script), detail: name });
  }

  const hasGtm = gtmPattern.test(code);
  const hasCookiebot = cookiebotPattern.test(code);
  const parts: string[] = [];
  if (hasGtm) parts.push("GTM snippet");
  if (hasCookiebot) parts.push("Cookiebot script");

  let message = `Found ${scripts.length} script(s) in the ${location} (excluding ${parts.join(" and ") || "nothing recognized"}).`;
  if (analysis.tracking.length > 0) {
    message += ` ${analysis.tracking.length} tracking script(s) need to move into GTM.`;
  }
  if (analysis.unknown.length > 0) {
    message += ` ${analysis.unknown.length} script(s) need manual review.`;
  }

  return {
    checkKey,
    canAutoFix: false,
    message,
    warning: "Script removal must be done manually in the Webflow Designer. Move tracking scripts to GTM first, then comment out the old code.",
    scripts: analysis,
  };
}

async function analyzeB1(
  webflowId: string,
  gtmId: string | null | undefined,
): Promise<FixAnalysisResult> {
  if (!gtmId) {
    return {
      checkKey: "B1",
      canAutoFix: false,
      message: "GTM container ID is required. Add it in site settings first.",
    };
  }

  const { getCustomCode, getRegisteredScripts } = await import("@/lib/api/webflow");
  const { headCode } = await getCustomCode(webflowId);

  const hasGtmInHtml = /googletagmanager\.com\/gtm\.js/i.test(headCode);
  let apiManagedGtm: { apiManaged: boolean; detail: string } | null = null;

  try {
    const registeredScripts = await getRegisteredScripts(webflowId);
    const gtmScript = registeredScripts.find((s: { displayName?: string; sourceCode?: string }) =>
      s.displayName?.toLowerCase().includes("gtm") ||
      s.sourceCode?.includes("googletagmanager.com/gtm.js")
    );
    if (gtmScript) {
      apiManagedGtm = { apiManaged: true, detail: "Found an API-managed GTM snippet already registered." };
    }
  } catch {
    // getRegisteredScripts may not be available
  }

  if (apiManagedGtm) {
    return {
      checkKey: "B1",
      canAutoFix: true,
      message: "An API-managed GTM snippet already exists. You can replace it with an updated one if the container ID has changed.",
      warning: "Replacing will delete the old API-managed snippet and push a new one.",
      existingGtmSnippet: apiManagedGtm,
    };
  }

  if (hasGtmInHtml) {
    return {
      checkKey: "B1",
      canAutoFix: true,
      message: "A GTM snippet was detected in the site HTML. This is likely a manually-added snippet in the Designer custom code.",
      warning: "You must comment out the manually-added GTM snippet in the Webflow Designer before pushing an API-managed one. Two GTM snippets cause double-tracking.",
      existingGtmSnippet: { apiManaged: false, detail: "Detected in HTML - likely manually added in Designer." },
    };
  }

  return {
    checkKey: "B1",
    canAutoFix: true,
    message: `No existing GTM snippet found. Safe to push the GTM snippet for container ${gtmId}.`,
    existingGtmSnippet: null,
  };
}

export async function applyFix(
  checkKey: string,
  siteWebflowId?: string | null,
  siteGtmId?: string | null
): Promise<{ success: boolean; message: string }> {
  const fix = AUTO_FIXES[checkKey];
  if (!fix) {
    return { success: false, message: `No auto-fix available for ${checkKey}` };
  }

  if (fix.requires.includes("webflow") && !isWebflowConfigured()) {
    return { success: false, message: "Webflow API token not configured" };
  }
  if (fix.requires.includes("gtm") && !isGtmConfigured()) {
    return { success: false, message: "GTM API token not configured" };
  }

  if (fix.requires.includes("webflow") && !siteWebflowId) {
    return { success: false, message: "Site has no Webflow ID - add it in site settings" };
  }
  if (fix.requires.includes("gtm") && !siteGtmId) {
    return { success: false, message: "Site has no GTM container ID - add it in site settings" };
  }

  const fixDef = AUTO_FIXES[checkKey];
  if (fixDef.safetyLevel === "guided") {
    return { success: false, message: `${checkKey} requires a guided flow - use "Analyze" to review what needs to change, then follow the steps manually.` };
  }

  switch (checkKey) {
    case "A1":
      return applyA1Fix(siteWebflowId!);
    case "A2":
      return applyA2Fix(siteWebflowId!);
    case "A3":
      return applyA3Fix(siteGtmId!);
    case "A4":
      return applyA4Fix(siteGtmId!);
    case "A5":
      return applyA5Fix(siteGtmId!);
    case "B1":
      return applyB1Fix(siteWebflowId!, siteGtmId);
    case "B3":
      return applyB3Fix(siteGtmId!);
    case "B4":
      return applyB4Fix(siteGtmId!);
    case "D1":
      return applyD1Fix(siteWebflowId!);
    case "D3":
      return applyD3Fix(siteWebflowId!);
    case "E1":
      return applyE1Fix(siteWebflowId!);
    case "I4":
      return applyI4Fix(siteWebflowId!);
    default:
      return { success: false, message: `Fix for ${checkKey} not implemented yet` };
  }
}

// --- Webflow fixes ---

async function applyA1Fix(_webflowId: string) {
  return {
    success: false,
    message: "A1 requires a guided flow. Use 'Analyze' to see what scripts are in the header, then remove tracking scripts manually in the Webflow Designer after recreating them in GTM.",
  };
}

async function applyA2Fix(_webflowId: string) {
  return {
    success: false,
    message: "A2 requires a guided flow. Use 'Analyze' to see what scripts are in the footer, then handle tracking scripts through GTM and remove the old code manually in the Webflow Designer.",
  };
}

async function applyB1Fix(webflowId: string, gtmId: string | null | undefined) {
  if (!gtmId) return { success: false, message: "GTM container ID required to push GTM snippet" };

  const { getCustomCode, updateCustomCode } = await import("@/lib/api/webflow");
  const { headCode, footerCode } = await getCustomCode(webflowId);

  if (/googletagmanager\.com\/gtm\.js/i.test(headCode)) {
    return {
      success: false,
      message: "A GTM snippet is already in the site header. If this is a manually-added snippet, comment it out in the Webflow Designer first, then try again. Use 'Analyze' to check the details.",
    };
  }

  const gtmSnippet = generateGtmSnippet(gtmId);
  await updateCustomCode(webflowId, gtmSnippet + "\n" + headCode, footerCode);
  return { success: true, message: `Pushed API-managed GTM snippet for container ${gtmId}` };
}

function generateGtmSnippet(gtmId: string): string {
  return `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');</script>
<!-- End Google Tag Manager -->`;
}

async function applyD1Fix(_webflowId: string) {
  return {
    success: false,
    message: "D1 requires a guided flow. Use 'Analyze' to identify ghost scripts, then remove them manually in the Webflow Designer.",
  };
}

async function applyD3Fix(_webflowId: string) {
  return {
    success: false,
    message: "D3 requires a guided flow. Use 'Analyze' to identify orphaned pixels, then recreate them as GTM tags before removing the old code.",
  };
}

async function applyE1Fix(_webflowId: string) {
  return { success: false, message: "YouTube embed replacement requires page-level API access - apply manually in Webflow designer" };
}

async function applyI4Fix(_webflowId: string) {
  return { success: false, message: "Footer link insertion requires page-level API access - apply manually in Webflow designer" };
}

// --- GTM fixes ---

async function applyA3Fix(gtmContainerId: string) {
  const { getContainerInfo, listTags, listTriggers, updateTag } = await import("@/lib/api/gtm");
  const container = await getContainerInfo(gtmContainerId);

  const tags = await listTags(container.accountId, container.containerId, "default");
  const cbTag = tags.find((t) =>
    t.name.toLowerCase().includes("cookiebot") || t.type === "cvt_cbt_cmp"
  );
  if (!cbTag) return { success: false, message: "Cookiebot CMP tag not found in GTM" };

  const triggers = await listTriggers(container.accountId, container.containerId, "default");
  const consentInitTrigger = triggers.find((t) => t.type === "consentInit");
  if (!consentInitTrigger) {
    return { success: false, message: "Consent Initialization trigger not found - create it in GTM first" };
  }

  await updateTag(cbTag.path, {
    ...cbTag,
    firingTriggerId: [consentInitTrigger.triggerId],
  });

  return { success: true, message: "Updated Cookiebot CMP tag to fire on Consent Initialization" };
}

async function applyA4Fix(gtmContainerId: string) {
  const { getContainerInfo, listTags } = await import("@/lib/api/gtm");
  const container = await getContainerInfo(gtmContainerId);
  const tags = await listTags(container.accountId, container.containerId, "default");

  const cbTag = tags.find((t) =>
    t.name.toLowerCase().includes("cookiebot") && t.type === "html"
  );
  if (!cbTag) return { success: true, message: "No Custom HTML Cookiebot tag found - may already use official template" };

  return { success: false, message: "Switching tag type from Custom HTML to official template requires manual setup in GTM (template must be installed from Community Gallery first)" };
}

async function applyA5Fix(gtmContainerId: string) {
  const { getContainerInfo, listTags, updateTag } = await import("@/lib/api/gtm");
  const container = await getContainerInfo(gtmContainerId);
  const tags = await listTags(container.accountId, container.containerId, "default");

  const cbTag = tags.find((t) => t.type === "cvt_cbt_cmp");
  if (!cbTag) return { success: false, message: "Cookiebot CMP template tag not found in GTM" };

  const params = cbTag.parameter || [];
  const autoBlockParam = params.find((p) => p.key === "AutoBlockingMode");
  if (autoBlockParam) {
    autoBlockParam.value = "false";
  } else {
    params.push({ key: "AutoBlockingMode", value: "false", type: "boolean" });
  }

  await updateTag(cbTag.path, { ...cbTag, parameter: params });
  return { success: true, message: "Disabled AutoBlock in Cookiebot CMP tag" };
}

async function applyB3Fix(gtmContainerId: string) {
  const { getContainerInfo, listTags, updateTag } = await import("@/lib/api/gtm");
  const container = await getContainerInfo(gtmContainerId);
  const tags = await listTags(container.accountId, container.containerId, "default");

  const googleTypes = ["gaawc", "gaawe", "gclidw", "awct", "sp", "flc"];
  const nonGoogleTags = tags.filter((t) => !googleTypes.includes(t.type) && t.type !== "cvt_cbt_cmp");

  let fixed = 0;
  for (const tag of nonGoogleTags) {
    if (!tag.consentSettings || tag.consentSettings.consentStatus !== "needed") {
      await updateTag(tag.path, {
        ...tag,
        consentSettings: {
          consentStatus: "needed",
          consentType: [
            { type: "ad_storage", status: "needed" },
            { type: "analytics_storage", status: "needed" },
          ],
        },
      });
      fixed++;
    }
  }

  return {
    success: true,
    message: fixed > 0
      ? `Added consent requirements to ${fixed} non-Google tag(s)`
      : "All non-Google tags already have consent settings",
  };
}

async function applyB4Fix(_gtmContainerId: string) {
  return { success: false, message: "Trigger reassignment requires manual review - each tag needs the correct consent-specific trigger based on its purpose" };
}
