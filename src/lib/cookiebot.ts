import type { CheckResult } from "@/lib/scanner";

export interface CookiebotCookie {
  name: string;
  category: string;
  expiry: string;
  provider: string;
  purpose: string;
}

export interface CookiebotData {
  necessary: CookiebotCookie[];
  statistics: CookiebotCookie[];
  marketing: CookiebotCookie[];
  preferences: CookiebotCookie[];
  unclassified: CookiebotCookie[];
}

export async function fetchCookiebotData(cbid: string, referer?: string): Promise<CookiebotData | null> {
  try {
    const url = referer
      ? `https://consent.cookiebot.com/${cbid}/cc.js?referer=${encodeURIComponent(referer)}`
      : `https://consent.cookiebot.com/${cbid}/cc.js`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (/setOutOfRegion/i.test(text) && !/cookieTable/i.test(text)) {
      const retryRes = await fetch(`https://consent.cookiebot.com/${cbid}/cc.js?referer=${encodeURIComponent(referer || "audit.example.com")}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!retryRes.ok) return null;
      const retryText = await retryRes.text();
      return parseCcJs(retryText);
    }
    return parseCcJs(text);
  } catch {
    return null;
  }
}

function parseCcJs(js: string): CookiebotData {
  const data: CookiebotData = {
    necessary: [],
    statistics: [],
    marketing: [],
    preferences: [],
    unclassified: [],
  };

  const categoryMap: Record<string, keyof CookiebotData> = {
    "CookieConsentBulkTicket": "necessary",
    "CookieConsentBulkSetting": "necessary",
  };

  const tableMatch = js.match(/CookieConsentDialog\.cookieTableNecessary\s*=\s*(\[[\s\S]*?\]);/);
  const statsMatch = js.match(/CookieConsentDialog\.cookieTableStatistics\s*=\s*(\[[\s\S]*?\]);/);
  const marketingMatch = js.match(/CookieConsentDialog\.cookieTableAdvertising\s*=\s*(\[[\s\S]*?\]);/);
  const prefMatch = js.match(/CookieConsentDialog\.cookieTablePreference\s*=\s*(\[[\s\S]*?\]);/);
  const unclassMatch = js.match(/CookieConsentDialog\.cookieTableUnclassified\s*=\s*(\[[\s\S]*?\]);/);

  data.necessary = parseCookieTable(tableMatch?.[1]);
  data.statistics = parseCookieTable(statsMatch?.[1]);
  data.marketing = parseCookieTable(marketingMatch?.[1]);
  data.preferences = parseCookieTable(prefMatch?.[1]);
  data.unclassified = parseCookieTable(unclassMatch?.[1]);

  return data;
}

function parseCookieTable(raw: string | undefined): CookiebotCookie[] {
  if (!raw) return [];
  const cookies: CookiebotCookie[] = [];

  const rowPattern = /\[([^\]]*(?:\[[^\]]*\][^\]]*)*)\]/g;
  let match;
  while ((match = rowPattern.exec(raw)) !== null) {
    const inner = match[1];
    const fields = extractFields(inner);
    if (fields.length >= 4) {
      cookies.push({
        name: fields[0] || "",
        category: fields[1] || "",
        expiry: fields[2] || "",
        provider: fields[3] || "",
        purpose: fields[4] || "",
      });
    }
  }

  return cookies;
}

function extractFields(raw: string): string[] {
  const fields: string[] = [];
  const pattern = /(?:"([^"]*(?:""[^"]*)*)"|'([^']*(?:''[^']*)*)')/g;
  let match;
  while ((match = pattern.exec(raw)) !== null) {
    if (match[1] !== undefined) {
      fields.push(match[1].replace(/""/g, '"'));
    } else {
      fields.push(match[2].replace(/''/g, "'"));
    }
  }
  return fields;
}

const MAX_REASONABLE_DAYS: Record<string, number> = {
  necessary: 395,
  statistics: 395,
  marketing: 395,
  preferences: 395,
};

function parseExpiryDays(expiry: string): number | null {
  if (!expiry) return null;
  const sessionPatterns = /^(session|sess\.?)$/i;
  if (sessionPatterns.test(expiry.trim())) return 0;

  const yearMatch = expiry.match(/(\d+)\s*(?:year|yr|ar)/i);
  if (yearMatch) return parseInt(yearMatch[1]) * 365;

  const monthMatch = expiry.match(/(\d+)\s*(?:month|mon|manad)/i);
  if (monthMatch) return parseInt(monthMatch[1]) * 30;

  const dayMatch = expiry.match(/(\d+)\s*(?:day|dag)/i);
  if (dayMatch) return parseInt(dayMatch[1]);

  const hourMatch = expiry.match(/(\d+)\s*(?:hour|timm)/i);
  if (hourMatch) return 1;

  return null;
}

export function checkC1(data: CookiebotData): CheckResult {
  const necessary = data.necessary;

  if (necessary.length === 0) {
    return {
      checkKey: "C1",
      status: "issue",
      findings: [{
        element: "Cookiebot",
        detail: "No necessary cookies identified. This is unusual - most sites have at least session/consent cookies.",
        severity: "warning",
      }],
      summary: "No necessary cookies found in Cookiebot configuration",
    };
  }

  return {
    checkKey: "C1",
    status: "ok",
    findings: necessary.map((c) => ({
      element: c.name,
      detail: `Provider: ${c.provider}, Expiry: ${c.expiry}`,
      severity: "info" as const,
    })),
    summary: `${necessary.length} necessary cookie${necessary.length !== 1 ? "s" : ""} registered in Cookiebot`,
  };
}

export function checkC2(data: CookiebotData): CheckResult {
  const stats = data.statistics;
  const findings = stats.map((c) => ({
    element: c.name,
    detail: `Provider: ${c.provider}, Expiry: ${c.expiry}`,
    severity: "info" as const,
  }));

  return {
    checkKey: "C2",
    status: "ok",
    findings,
    summary: stats.length === 0
      ? "No statistics cookies found - check if this is expected"
      : `${stats.length} statistics cookie${stats.length !== 1 ? "s" : ""} registered and require visitor consent`,
  };
}

export function checkC3(data: CookiebotData): CheckResult {
  const marketing = data.marketing;
  const findings = marketing.map((c) => ({
    element: c.name,
    detail: `Provider: ${c.provider}, Expiry: ${c.expiry}`,
    severity: "info" as const,
  }));

  return {
    checkKey: "C3",
    status: "ok",
    findings,
    summary: marketing.length === 0
      ? "No marketing cookies found - check if this is expected"
      : `${marketing.length} marketing cookie${marketing.length !== 1 ? "s" : ""} registered and require visitor consent`,
  };
}

export function checkC4(data: CookiebotData): CheckResult {
  const prefs = data.preferences;
  const findings = prefs.map((c) => ({
    element: c.name,
    detail: `Provider: ${c.provider}, Expiry: ${c.expiry}`,
    severity: "info" as const,
  }));

  return {
    checkKey: "C4",
    status: "ok",
    findings,
    summary: prefs.length === 0
      ? "No preference cookies found - check if this is expected"
      : `${prefs.length} preference cookie${prefs.length !== 1 ? "s" : ""} registered and require visitor consent`,
  };
}

export function checkC5(data: CookiebotData): CheckResult {
  const unclassified = data.unclassified;

  if (unclassified.length === 0) {
    return {
      checkKey: "C5",
      status: "ok",
      findings: [],
      summary: "No unclassified cookies",
    };
  }

  return {
    checkKey: "C5",
    status: "issue",
    findings: unclassified.map((c) => ({
      element: c.name,
      detail: `Provider: ${c.provider} - needs to be sorted into a category (statistics, marketing, or preferences)`,
      severity: "error" as const,
    })),
    summary: `${unclassified.length} cookie${unclassified.length !== 1 ? "s" : ""} not sorted into any category - visitors can't give proper consent for these`,
  };
}

export function checkC6(data: CookiebotData): CheckResult {
  const findings: { element: string; detail: string; severity: "error" | "warning" | "info" }[] = [];

  const allCategories: [string, CookiebotCookie[]][] = [
    ["necessary", data.necessary],
    ["statistics", data.statistics],
    ["marketing", data.marketing],
    ["preferences", data.preferences],
  ];

  for (const [category, cookies] of allCategories) {
    const maxDays = MAX_REASONABLE_DAYS[category] || 395;
    for (const cookie of cookies) {
      const days = parseExpiryDays(cookie.expiry);
      if (days !== null && days > maxDays) {
        findings.push({
          element: cookie.name,
          detail: `${category} cookie expires in ${cookie.expiry} (~${days} days). Max recommended: ${maxDays} days.`,
          severity: "warning",
        });
      }
    }
  }

  return {
    checkKey: "C6",
    status: findings.length === 0 ? "ok" : "issue",
    findings,
    summary: findings.length === 0
      ? "All cookies expire within recommended timeframes"
      : `${findings.length} cookie${findings.length !== 1 ? "s" : ""} expire later than recommended`,
  };
}

export function checkG3(data: CookiebotData): CheckResult {
  const categories = [
    { name: "Statistics", count: data.statistics.length },
    { name: "Marketing", count: data.marketing.length },
    { name: "Preferences", count: data.preferences.length },
  ];

  const activeCategories = categories.filter((c) => c.count > 0);

  if (activeCategories.length === 0) {
    return {
      checkKey: "G3",
      status: "issue",
      findings: [{
        element: "Cookiebot",
        detail: "No optional cookie categories found. Visitors should be able to choose which types of cookies to accept (statistics, marketing, preferences).",
        severity: "warning",
      }],
      summary: "No optional cookie categories found",
    };
  }

  return {
    checkKey: "G3",
    status: "ok",
    findings: activeCategories.map((c) => ({
      element: c.name,
      detail: `${c.count} cookie(s) in ${c.name.toLowerCase()} category`,
      severity: "info" as const,
    })),
    summary: `Visitors can choose from ${activeCategories.length} cookie categories: ${activeCategories.map((c) => c.name).join(", ")}`,
  };
}

export function runCookiebotChecks(data: CookiebotData): CheckResult[] {
  return [
    checkC1(data),
    checkC2(data),
    checkC3(data),
    checkC4(data),
    checkC5(data),
    checkC6(data),
    checkG3(data),
  ];
}
