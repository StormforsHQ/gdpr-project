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

  // Each fix will be implemented here when API tokens are available.
  // The pattern for each:
  //   1. Fetch current state from API
  //   2. Compute the change
  //   3. Apply via API
  //   4. Return result

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

async function applyA1Fix(webflowId: string) {
  const { getCustomCode, updateCustomCode } = await import("@/lib/api/webflow");
  const { headCode, footerCode } = await getCustomCode(webflowId);

  const gtmPattern = /<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/gi;
  const cookiebotPattern = /<script[^>]*consent\.cookiebot\.com[^>]*>[\s\S]*?<\/script>/gi;

  const gtmSnippets = headCode.match(gtmPattern) || [];
  const cbSnippets = headCode.match(cookiebotPattern) || [];
  const cleanedHead = [...gtmSnippets, ...cbSnippets].join("\n");

  if (cleanedHead === headCode) {
    return { success: true, message: "Header already clean - only GTM and Cookiebot present" };
  }

  await updateCustomCode(webflowId, cleanedHead, footerCode);
  return { success: true, message: "Removed non-GTM/Cookiebot scripts from header" };
}

async function applyA2Fix(webflowId: string) {
  const { getCustomCode, updateCustomCode } = await import("@/lib/api/webflow");
  const { headCode, footerCode } = await getCustomCode(webflowId);

  if (!footerCode.trim()) {
    return { success: true, message: "Footer already clean - no scripts present" };
  }

  await updateCustomCode(webflowId, headCode, "");
  return { success: true, message: "Cleared footer scripts (re-add via GTM with consent triggers)" };
}

async function applyB1Fix(webflowId: string, gtmId: string | null | undefined) {
  if (!gtmId) return { success: false, message: "GTM container ID required to inject GTM snippet" };

  const { getCustomCode, updateCustomCode } = await import("@/lib/api/webflow");
  const { headCode, footerCode } = await getCustomCode(webflowId);

  if (/googletagmanager\.com\/gtm\.js/i.test(headCode)) {
    return { success: true, message: "GTM snippet already present in header" };
  }

  const gtmSnippet = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');</script>
<!-- End Google Tag Manager -->`;

  await updateCustomCode(webflowId, gtmSnippet + "\n" + headCode, footerCode);
  return { success: true, message: `Injected GTM snippet for container ${gtmId}` };
}

async function applyD1Fix(webflowId: string) {
  return applyA1Fix(webflowId);
}

async function applyD3Fix(webflowId: string) {
  return applyA1Fix(webflowId);
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
