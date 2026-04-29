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

export async function fetchCookiebotData(cbid: string): Promise<CookiebotData | null> {
  try {
    const res = await fetch(`https://consent.cookiebot.com/${cbid}/cc.js`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const text = await res.text();
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
  const prefMatch = js.match(/CookieConsentDialog\.cookieTablePreferences\s*=\s*(\[[\s\S]*?\]);/);
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
  const pattern = /'([^']*(?:''[^']*)*)'/g;
  let match;
  while ((match = pattern.exec(raw)) !== null) {
    fields.push(match[1].replace(/''/g, "'"));
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
    summary: `${necessary.length} necessary cookie(s) correctly identified`,
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
      ? "No statistics cookies configured (verify this is correct)"
      : `${stats.length} statistics cookie(s) under consent`,
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
      ? "No marketing cookies configured (verify this is correct)"
      : `${marketing.length} marketing cookie(s) under consent`,
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
      ? "No preference cookies configured (verify this is correct)"
      : `${prefs.length} preference cookie(s) under consent`,
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
      detail: `Provider: ${c.provider} - must be classified into a consent category`,
      severity: "error" as const,
    })),
    summary: `${unclassified.length} unclassified cookie(s) need categorization`,
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
      ? "All cookie lifetimes are proportionate"
      : `${findings.length} cookie(s) with excessive lifetime`,
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
        detail: "No optional cookie categories configured. Users have nothing to consent to granularly.",
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
    summary: `${activeCategories.length} granular consent categories available (${activeCategories.map((c) => c.name).join(", ")})`,
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
