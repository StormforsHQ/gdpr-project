import type { CheckResult } from "@/lib/scanner";
import type { GtmTag, GtmTrigger } from "@/lib/api/gtm";

const GOOGLE_BUILT_IN_TYPES = ["gaawc", "gaawe", "gclidw", "awct", "sp", "flc", "googtag", "ua", "fls"];

function isCookiebotTag(tag: GtmTag): boolean {
  return /cookiebot/i.test(tag.type) || /cookiebot/i.test(tag.name);
}

function isGoogleTag(tag: GtmTag): boolean {
  return GOOGLE_BUILT_IN_TYPES.includes(tag.type);
}

function isSystemTag(tag: GtmTag): boolean {
  return isCookiebotTag(tag);
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

  const consentInitTrigger = triggers.find((t) => t.type === "consentInit");
  if (!consentInitTrigger) {
    return {
      checkKey: "A3",
      status: "issue",
      findings: [{
        element: cookiebotTag.name,
        detail: "No 'Consent Initialization - All Pages' trigger exists in the container. This trigger must be created and assigned to the Cookiebot tag.",
        severity: "error",
      }],
      summary: "Consent Initialization trigger missing from container",
    };
  }

  const firesOnConsentInit = cookiebotTag.firingTriggerId?.includes(consentInitTrigger.triggerId);
  if (!firesOnConsentInit) {
    const actualTriggers = (cookiebotTag.firingTriggerId || [])
      .map((id) => triggers.find((t) => t.triggerId === id))
      .filter(Boolean);
    const triggerNames = actualTriggers.map((t) => `"${t!.name}" (${t!.type})`).join(", ") || "none";

    return {
      checkKey: "A3",
      status: "issue",
      findings: [{
        element: cookiebotTag.name,
        detail: `Cookiebot fires on: ${triggerNames}. Must fire on "Consent Initialization - All Pages" to load before any other tags.`,
        severity: "error",
      }],
      summary: "Cookiebot not on Consent Initialization trigger",
    };
  }

  return {
    checkKey: "A3",
    status: "ok",
    findings: [{
      element: cookiebotTag.name,
      detail: "Fires on Consent Initialization - All Pages (correct)",
      severity: "info",
    }],
    summary: "Cookiebot CMP tag on correct trigger",
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
      summary: "Cookiebot using Custom HTML instead of official template",
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
    summary: "Official Cookiebot GTM template in use",
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
      summary: "AutoBlock is enabled (should be off)",
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
    summary: "AutoBlock is off",
  };
}

export function checkB2(tags: GtmTag[]): CheckResult {
  const googleTags = tags.filter(isGoogleTag);

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
      ? `${issueCount} Google tag(s) with unnecessary consent requirement`
      : `${googleTags.length} Google tag(s) correctly configured`,
  };
}

export function checkB3(tags: GtmTag[]): CheckResult {
  const nonGoogleNonSystem = tags.filter((t) => !isGoogleTag(t) && !isSystemTag(t));

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
    const status = tag.consentSettings?.consentStatus;
    if (status === "needed") {
      findings.push({
        element: tag.name,
        detail: `Consent requirement set to "Require additional consent" (correct)`,
        severity: "info",
      });
    } else {
      findings.push({
        element: tag.name,
        detail: `Consent overview: ${status === "notNeeded" ? "No additional consent required" : status || "not set"}. Non-Google tags must have "Require additional consent" with the right consent types (e.g. ad_storage, analytics_storage).`,
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
      ? `${issueCount} non-Google tag(s) missing consent requirement`
      : `${nonGoogleNonSystem.length} non-Google tag(s) correctly consent-gated`,
  };
}

export function checkB4(tags: GtmTag[], triggers: GtmTrigger[]): CheckResult {
  const nonGoogleNonSystem = tags.filter((t) => !isGoogleTag(t) && !isSystemTag(t));

  if (nonGoogleNonSystem.length === 0) {
    return {
      checkKey: "B4",
      status: "na",
      findings: [{ element: "GTM", detail: "No non-Google tags found in container", severity: "info" }],
      summary: "No non-Google tags to check",
    };
  }

  const pageviewTrigger = triggers.find((t) => t.type === "pageview");
  const findings: CheckResult["findings"] = [];
  let issueCount = 0;

  for (const tag of nonGoogleNonSystem) {
    const tagTriggerIds = tag.firingTriggerId || [];
    const tagTriggers = tagTriggerIds
      .map((id) => triggers.find((t) => t.triggerId === id))
      .filter(Boolean);

    const firesOnAllPages = pageviewTrigger && tagTriggerIds.includes(pageviewTrigger.triggerId);
    const triggerNames = tagTriggers.map((t) => `"${t!.name}" (${t!.type})`).join(", ") || "none";

    if (firesOnAllPages) {
      findings.push({
        element: tag.name,
        detail: `Fires on "All Pages" trigger. Non-Google tags should use a consent-aware trigger (e.g. cookie_consent_update custom event) so they only fire after the visitor grants consent.`,
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
      ? `${issueCount} non-Google tag(s) firing on "All Pages" instead of consent-aware trigger`
      : `${nonGoogleNonSystem.length} non-Google tag(s) using correct triggers`,
  };
}

export function runGtmChecks(tags: GtmTag[], triggers: GtmTrigger[]): CheckResult[] {
  return [
    checkA3(tags, triggers),
    checkA4(tags),
    checkA5(tags),
    checkB2(tags),
    checkB3(tags),
    checkB4(tags, triggers),
  ];
}
