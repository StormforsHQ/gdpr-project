import type { CheckResult } from "@/lib/scanner";
import type { GtmTag, GtmTrigger } from "@/lib/api/gtm";

const GOOGLE_BUILT_IN_TYPES = ["gaawc", "gaawe", "gclidw", "awct", "sp", "flc", "googtag", "ua", "fls"];

// Built-in triggers are NOT returned by the GTM API triggers.list endpoint.
// Tags reference them via these hardcoded trigger IDs.
const BUILTIN_TRIGGER_IDS = {
  consentInit: "2147479572",
  init: "2147479573",
  allPages: "2147479553",
};

function isCookiebotTag(tag: GtmTag): boolean {
  return /cookiebot/i.test(tag.type) || /cookiebot/i.test(tag.name);
}

function isGoogleTag(tag: GtmTag): boolean {
  return GOOGLE_BUILT_IN_TYPES.includes(tag.type);
}

function isSystemTag(tag: GtmTag): boolean {
  return isCookiebotTag(tag);
}

function isConsentAwareTrigger(trigger: GtmTrigger): boolean {
  return trigger.type === "customEvent" && /consent|cookie|accept/i.test(trigger.name);
}

function hasConsentAwareTriggers(tag: GtmTag, triggers: GtmTrigger[]): boolean {
  const triggerIds = tag.firingTriggerId || [];
  if (triggerIds.length === 0) return false;
  return triggerIds.every((id) => {
    if (id === BUILTIN_TRIGGER_IDS.consentInit || id === BUILTIN_TRIGGER_IDS.init) return true;
    const trigger = triggers.find((t) => t.triggerId === id);
    if (!trigger) return false;
    return isConsentAwareTrigger(trigger);
  });
}

export function checkA3(tags: GtmTag[], triggers: GtmTrigger[]): CheckResult {
  const cookiebotTag = tags.find(isCookiebotTag);
  if (!cookiebotTag) {
    return {
      checkKey: "A3",
      status: "na",
      findings: [{ element: "GTM", detail: "No Cookiebot CMP tag found in container", severity: "warning" }],
      summary: "No Cookiebot tag to check",
    };
  }

  const triggerIds = cookiebotTag.firingTriggerId || [];

  // Check for built-in Consent Initialization trigger (not returned by triggers.list API)
  const firesOnBuiltinConsentInit = triggerIds.includes(BUILTIN_TRIGGER_IDS.consentInit);

  // Also check for custom triggers with consentInit type
  const firesOnCustomConsentInit = triggerIds.some((id) => {
    const trigger = triggers.find((t) => t.triggerId === id);
    return trigger?.type === "consentInit";
  });

  if (firesOnBuiltinConsentInit || firesOnCustomConsentInit) {
    return {
      checkKey: "A3",
      status: "ok",
      findings: [{
        element: cookiebotTag.name,
        detail: "Fires on Consent Initialization - All Pages (correct)",
        severity: "info",
      }],
      summary: "Cookiebot loads before all other tags (correct setup)",
    };
  }

  const actualTriggerNames = triggerIds
    .map((id) => {
      if (id === BUILTIN_TRIGGER_IDS.allPages) return '"All Pages" (pageview)';
      if (id === BUILTIN_TRIGGER_IDS.init) return '"Initialization - All Pages" (init)';
      const trigger = triggers.find((t) => t.triggerId === id);
      return trigger ? `"${trigger.name}" (${trigger.type})` : `unknown (${id})`;
    })
    .join(", ") || "none";

  return {
    checkKey: "A3",
    status: "issue",
    findings: [{
      element: cookiebotTag.name,
      detail: `Cookiebot fires on: ${actualTriggerNames}. Must fire on "Consent Initialization - All Pages" to load before any other tags.`,
      severity: "error",
    }],
    summary: "Cookiebot may load too late - other tags could fire before consent is collected",
  };
}

export function checkA4(tags: GtmTag[]): CheckResult {
  const cookiebotTag = tags.find(isCookiebotTag);
  if (!cookiebotTag) {
    return {
      checkKey: "A4",
      status: "na",
      findings: [{ element: "GTM", detail: "No Cookiebot CMP tag found in container", severity: "warning" }],
      summary: "No Cookiebot tag to check",
    };
  }

  if (cookiebotTag.type === "html") {
    return {
      checkKey: "A4",
      status: "issue",
      findings: [{
        element: cookiebotTag.name,
        detail: "Cookiebot is set up as Custom HTML instead of the official GTM template. Custom HTML misses Consent Mode v2 fields. Install the official Cookiebot CMP template from the GTM Template Gallery.",
        severity: "error",
      }],
      summary: "Cookiebot set up as custom code instead of the official template - may miss consent features",
    };
  }

  return {
    checkKey: "A4",
    status: "ok",
    findings: [{
      element: cookiebotTag.name,
      detail: `Using official template (type: ${cookiebotTag.type})`,
      severity: "info",
    }],
    summary: "Cookiebot uses the official GTM template (correct setup)",
  };
}

export function checkA5(tags: GtmTag[]): CheckResult {
  const cookiebotTag = tags.find((t) => isCookiebotTag(t) && t.type !== "html");
  if (!cookiebotTag) {
    return {
      checkKey: "A5",
      status: "na",
      findings: [{ element: "GTM", detail: "No Cookiebot CMP template tag found (check is only for the official template)", severity: "warning" }],
      summary: "No Cookiebot template tag to check",
    };
  }

  const params = cookiebotTag.parameter || [];
  const autoBlockParam = params.find((p) => /autoblock/i.test(p.key));

  if (autoBlockParam && autoBlockParam.value === "true") {
    return {
      checkKey: "A5",
      status: "issue",
      findings: [{
        element: cookiebotTag.name,
        detail: "AutoBlock is ON. This breaks Advanced Consent Mode cookieless pings because it intercepts script loading before consent signals are sent. Disable AutoBlock in the Cookiebot tag settings.",
        severity: "error",
      }],
      summary: "AutoBlock is on - this can break analytics tracking before consent",
    };
  }

  return {
    checkKey: "A5",
    status: "ok",
    findings: [{
      element: cookiebotTag.name,
      detail: autoBlockParam ? "AutoBlock is OFF (correct)" : "AutoBlock parameter not set (defaults to off)",
      severity: "info",
    }],
    summary: "AutoBlock is off (correct setup)",
  };
}

export function checkB2(tags: GtmTag[]): CheckResult {
  const googleTags = tags.filter((t) => isGoogleTag(t) && !t.paused);

  if (googleTags.length === 0) {
    return {
      checkKey: "B2",
      status: "na",
      findings: [{ element: "GTM", detail: "No Google tags found in container", severity: "info" }],
      summary: "No Google tags to check",
    };
  }

  const findings: CheckResult["findings"] = [];
  let issueCount = 0;

  for (const tag of googleTags) {
    const status = tag.consentSettings?.consentStatus;
    if (status === "needed") {
      findings.push({
        element: tag.name,
        detail: `Set to "Require additional consent" - should be "No additional consent required" because Google tags self-adapt to consent state.`,
        severity: "warning",
      });
      issueCount++;
    } else {
      findings.push({
        element: tag.name,
        detail: `Consent overview: ${status === "notNeeded" ? "No additional consent required" : status || "not set"} (OK - Google tags self-adapt)`,
        severity: "info",
      });
    }
  }

  return {
    checkKey: "B2",
    status: issueCount > 0 ? "issue" : "ok",
    findings,
    summary: issueCount > 0
      ? `${issueCount} Google tag${issueCount !== 1 ? "s" : ""} have an extra consent setting that may block data collection`
      : `${googleTags.length} Google tag${googleTags.length !== 1 ? "s" : ""} correctly configured`,
  };
}

export function checkB3(tags: GtmTag[], triggers: GtmTrigger[]): CheckResult {
  const nonGoogleNonSystem = tags.filter((t) => !isGoogleTag(t) && !isSystemTag(t) && !t.paused);

  if (nonGoogleNonSystem.length === 0) {
    return {
      checkKey: "B3",
      status: "na",
      findings: [{ element: "GTM", detail: "No non-Google tags found in container", severity: "info" }],
      summary: "No non-Google tags to check",
    };
  }

  const findings: CheckResult["findings"] = [];
  let issueCount = 0;

  for (const tag of nonGoogleNonSystem) {
    const consentStatus = tag.consentSettings?.consentStatus;
    const gatedByConsentSetting = consentStatus === "needed";
    const gatedByTrigger = hasConsentAwareTriggers(tag, triggers);

    if (gatedByConsentSetting) {
      findings.push({
        element: tag.name,
        detail: `Consent requirement: "Require additional consent" (correct)`,
        severity: "info",
      });
    } else if (gatedByTrigger) {
      const triggerNames = (tag.firingTriggerId || [])
        .map((id) => triggers.find((t) => t.triggerId === id))
        .filter(Boolean)
        .map((t) => t!.name)
        .join(", ");
      findings.push({
        element: tag.name,
        detail: `Consent-gated via trigger: ${triggerNames}. Consider also adding consent types in Consent Overview for defense in depth.`,
        severity: "info",
      });
    } else {
      const triggerIds = tag.firingTriggerId || [];
      const triggerNames = triggerIds
        .map((id) => {
          if (id === BUILTIN_TRIGGER_IDS.allPages) return "All Pages";
          const trigger = triggers.find((t) => t.triggerId === id);
          return trigger?.name || id;
        })
        .join(", ") || "none";
      findings.push({
        element: tag.name,
        detail: `No consent gating. Fires on: ${triggerNames}. In GTM, open the site's container workspace, go to Tags, and click the shield icon (Consent Overview). Click this tag and set "Require additional consent" with the right types (ad_storage for marketing tags, analytics_storage for analytics tags).`,
        severity: "error",
      });
      issueCount++;
    }
  }

  return {
    checkKey: "B3",
    status: issueCount > 0 ? "issue" : "ok",
    findings,
    summary: issueCount > 0
      ? `${issueCount} tag${issueCount !== 1 ? "s" : ""} can fire without visitor consent`
      : `All ${nonGoogleNonSystem.length} non-Google tag${nonGoogleNonSystem.length !== 1 ? "s" : ""} wait for visitor consent before firing`,
  };
}

export function checkB4(tags: GtmTag[], triggers: GtmTrigger[]): CheckResult {
  const nonGoogleNonSystem = tags.filter((t) => !isGoogleTag(t) && !isSystemTag(t) && !t.paused);

  if (nonGoogleNonSystem.length === 0) {
    return {
      checkKey: "B4",
      status: "na",
      findings: [{ element: "GTM", detail: "No non-Google tags found in container", severity: "info" }],
      summary: "No non-Google tags to check",
    };
  }

  const findings: CheckResult["findings"] = [];
  let issueCount = 0;

  for (const tag of nonGoogleNonSystem) {
    const tagTriggerIds = tag.firingTriggerId || [];

    // Check both built-in All Pages trigger and any custom pageview triggers
    const firesOnAllPages = tagTriggerIds.includes(BUILTIN_TRIGGER_IDS.allPages)
      || tagTriggerIds.some((id) => {
        const trigger = triggers.find((t) => t.triggerId === id);
        return trigger?.type === "pageview";
      });

    const triggerNames = tagTriggerIds
      .map((id) => {
        if (id === BUILTIN_TRIGGER_IDS.allPages) return '"All Pages" (pageview)';
        if (id === BUILTIN_TRIGGER_IDS.consentInit) return '"Consent Initialization" (consentInit)';
        if (id === BUILTIN_TRIGGER_IDS.init) return '"Initialization" (init)';
        const trigger = triggers.find((t) => t.triggerId === id);
        return trigger ? `"${trigger.name}" (${trigger.type})` : `unknown (${id})`;
      })
      .join(", ") || "none";

    if (firesOnAllPages) {
      findings.push({
        element: tag.name,
        detail: `Fires on "All Pages" trigger. Non-Google tags should use a consent-aware trigger (e.g. a custom event that fires after the visitor grants consent) so they don't run before consent is given.`,
        severity: "error",
      });
      issueCount++;
    } else {
      findings.push({
        element: tag.name,
        detail: `Trigger: ${triggerNames}`,
        severity: "info",
      });
    }
  }

  return {
    checkKey: "B4",
    status: issueCount > 0 ? "issue" : "ok",
    findings,
    summary: issueCount > 0
      ? `${issueCount} tag${issueCount !== 1 ? "s" : ""} fire on every page load regardless of consent`
      : `All ${nonGoogleNonSystem.length} non-Google tag${nonGoogleNonSystem.length !== 1 ? "s" : ""} use consent-aware triggers`,
  };
}

export function checkG1Gtm(tags: GtmTag[]): CheckResult | null {
  const cookiebotTag = tags.find(isCookiebotTag);
  if (!cookiebotTag) return null;

  return {
    checkKey: "G1",
    status: "ok",
    findings: [{
      element: cookiebotTag.name,
      detail: `Cookiebot loaded via GTM (tag: "${cookiebotTag.name}", type: ${cookiebotTag.type}). Banner is delivered through Google Tag Manager, not directly in the HTML.`,
      severity: "info",
    }],
    summary: "Cookiebot consent banner loaded via GTM",
  };
}

export function runGtmChecks(tags: GtmTag[], triggers: GtmTrigger[]): CheckResult[] {
  const results: CheckResult[] = [
    checkA3(tags, triggers),
    checkA4(tags),
    checkA5(tags),
    checkB2(tags),
    checkB3(tags, triggers),
    checkB4(tags, triggers),
  ];

  const g1 = checkG1Gtm(tags);
  if (g1) {
    results.push(g1);
    results.push({
      checkKey: "G8",
      status: "blocked",
      findings: [{
        element: "Cookiebot via GTM",
        detail: "Cookiebot is loaded through GTM so the consent widget is dynamically injected. Verify in the browser that a floating cookie icon or 'Cookie settings' link exists for changing consent.",
        severity: "warning",
      }],
      summary: "Cookiebot via GTM - verify withdrawal widget in browser",
    });
  }

  return results;
}
