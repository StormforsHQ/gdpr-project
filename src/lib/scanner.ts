import * as cheerio from "cheerio";
import { normalizeUrl } from "@/lib/url";
import { detectVendors, type DetectedVendor } from "@/lib/vendors";
import { prisma } from "@/lib/db";

export type HeadElementType = "script" | "style" | "meta" | "comment" | "link" | "noscript" | "other";

export interface ScanFinding {
  element: string;
  detail: string;
  severity: "error" | "warning" | "info";
  pageUrl?: string;
  scriptContent?: string;
  elementType?: HeadElementType;
}

export interface CheckResult {
  checkKey: string;
  status: "ok" | "issue" | "na" | "blocked" | "client_managed" | "not_checked";
  findings: ScanFinding[];
  summary: string;
}

export interface ScanResult {
  url: string;
  scannedAt: string;
  checks: CheckResult[];
  error?: string;
  detectedCookiebotId?: string;
  detectedGtmId?: string;
  pagesScanned?: number;
  detectedVendors?: DetectedVendor[];
}

// --- Analytics & measurement ---
const ANALYTICS_SCRIPTS = [
  { pattern: /google-analytics\.com\/analytics\.js/i, name: "Google Analytics (analytics.js)" },
  { pattern: /googletagmanager\.com\/gtag\/js/i, name: "Google Analytics (gtag.js)" },
  { pattern: /analytics\.google\.com/i, name: "Google Analytics" },
  { pattern: /plausible\.io\/js/i, name: "Plausible Analytics" },
  { pattern: /cdn\.usefathom\.com/i, name: "Fathom Analytics" },
  { pattern: /simpleanalytics\.com\/latest/i, name: "Simple Analytics" },
  { pattern: /umami\.is\/script|analytics\.umami/i, name: "Umami Analytics" },
  { pattern: /cdn\.counter\.dev/i, name: "Counter.dev" },
  { pattern: /goatcounter\.com\/count/i, name: "GoatCounter" },
  { pattern: /cdn\.matomo\.cloud|matomo\.js|piwik\.js/i, name: "Matomo/Piwik" },
  { pattern: /js\.hs-scripts\.com|js\.hs-analytics\.net/i, name: "HubSpot Tracking" },
  { pattern: /cdn\.amplitude\.com/i, name: "Amplitude" },
  { pattern: /cdn\.mxpnl\.com|cdn\.mixpanel\.com/i, name: "Mixpanel" },
  { pattern: /cdn\.heapanalytics\.com/i, name: "Heap Analytics" },
  { pattern: /cdn\.segment\.com/i, name: "Segment" },
  { pattern: /cdn\.rudderstacks\.com|rudderanalytics/i, name: "RudderStack" },
  { pattern: /js\.posthog\.com|posthog-js/i, name: "PostHog" },
  { pattern: /d\.snowplowanalytics\.com|sp\.js/i, name: "Snowplow Analytics" },
  { pattern: /kissmetrics\.com|doug1izaez\.cloudfront/i, name: "Kissmetrics" },
  { pattern: /chartbeat\.com\/js/i, name: "Chartbeat" },
  { pattern: /cdn\.parsely\.com/i, name: "Parse.ly" },
  { pattern: /static\.woopra\.com/i, name: "Woopra" },
  { pattern: /d2dq2ahtl5zl1z\.cloudfront\.net.*gauges/i, name: "Gauges" },
  { pattern: /cdn\.mparticle\.com/i, name: "mParticle" },
  { pattern: /cdn\.countly\.com/i, name: "Countly" },
  { pattern: /js\.tealiumiq\.com|tags\.tiqcdn\.com/i, name: "Tealium" },
  { pattern: /script\.hotjar\.com|static\.hotjar\.com/i, name: "Hotjar" },
  { pattern: /clarity\.ms/i, name: "Microsoft Clarity" },
];

// --- Advertising, retargeting & conversion pixels ---
const ADVERTISING_SCRIPTS = [
  { pattern: /connect\.facebook\.net/i, name: "Meta Pixel" },
  { pattern: /snap\.licdn\.com/i, name: "LinkedIn Insight Tag" },
  { pattern: /platform\.twitter\.com/i, name: "Twitter/X Pixel" },
  { pattern: /static\.ads-twitter\.com/i, name: "Twitter/X Ads" },
  { pattern: /analytics\.tiktok\.com/i, name: "TikTok Pixel" },
  { pattern: /sc-static\.net\/scevent/i, name: "Snapchat Pixel" },
  { pattern: /tr\.snapchat\.com/i, name: "Snapchat Conversion" },
  { pattern: /bat\.bing\.com/i, name: "Microsoft/Bing UET" },
  { pattern: /googleadservices\.com|googlesyndication\.com/i, name: "Google Ads" },
  { pattern: /doubleclick\.net/i, name: "Google DoubleClick" },
  { pattern: /s\.amazon-adsystem\.com/i, name: "Amazon Ads" },
  { pattern: /static\.criteo\.net|dynamic\.criteo\.com/i, name: "Criteo" },
  { pattern: /d\.adroll\.com|s\.adroll\.com/i, name: "AdRoll" },
  { pattern: /cdn\.taboola\.com/i, name: "Taboola" },
  { pattern: /widgets\.outbrain\.com/i, name: "Outbrain" },
  { pattern: /ct\.pinterest\.com|pintrk/i, name: "Pinterest Tag" },
  { pattern: /q\.quora\.com/i, name: "Quora Pixel" },
  { pattern: /alb\.reddit\.com|rdt\.li/i, name: "Reddit Pixel" },
  { pattern: /cdn\.pdst\.fm|podsights\.com/i, name: "Podsights" },
  { pattern: /cdn\.branch\.io/i, name: "Branch.io" },
  { pattern: /cdn\.appsflyer\.com/i, name: "AppsFlyer" },
  { pattern: /cdn\.adjust\.com/i, name: "Adjust" },
  { pattern: /cdn\.leadfeeder\.net|lf\.leadfeeder/i, name: "Leadfeeder" },
  { pattern: /munchkin\.marketo\.net/i, name: "Marketo Munchkin" },
  { pattern: /pi\.pardot\.com/i, name: "Pardot/Salesforce" },
  { pattern: /trackcmp\.net|activecampaign\.com\/f\/tr/i, name: "ActiveCampaign" },
  { pattern: /chimpstatic\.com|mailchimp\.com\/js/i, name: "Mailchimp Tracking" },
  { pattern: /getdrip\.com/i, name: "Drip" },
];

// --- Session recording & heatmaps ---
const SESSION_RECORDING_SCRIPTS = [
  { pattern: /cdn\.mouseflow\.com/i, name: "Mouseflow" },
  { pattern: /cdn\.luckyorange\.com/i, name: "Lucky Orange" },
  { pattern: /cdn\.inspectlet\.com/i, name: "Inspectlet" },
  { pattern: /rs\.fullstory\.com|fullstory\.com\/s\/fs\.js/i, name: "FullStory" },
  { pattern: /cdn\.logrocket\.io|cdn\.lr-ingest\.io/i, name: "LogRocket" },
  { pattern: /web-sdk\.smartlook\.com|rec\.smartlook\.com/i, name: "Smartlook" },
  { pattern: /script\.crazyegg\.com/i, name: "Crazy Egg" },
  { pattern: /ws\.sessioncam\.com/i, name: "SessionCam" },
  { pattern: /cdn-app\.contentsquare\.com|c\.contentsquare\.net/i, name: "Contentsquare" },
  { pattern: /d2wy8f7a9ursnm\.cloudfront\.net.*bugsnag/i, name: "Bugsnag" },
  { pattern: /app\.getbeamer\.com/i, name: "Beamer" },
];

// --- A/B testing ---
const AB_TESTING_SCRIPTS = [
  { pattern: /cdn\.optimizely\.com/i, name: "Optimizely" },
  { pattern: /dev\.visualwebsiteoptimizer\.com|d22rdv1y0bwxx4\.cloudfront/i, name: "VWO" },
  { pattern: /cdn-app\.abtasty\.com|try\.abtasty\.com/i, name: "AB Tasty" },
  { pattern: /cdn-3\.convertexperiments\.com/i, name: "Convert" },
];

// --- Chat widgets (set cookies, track users) ---
const CHAT_WIDGETS = [
  { pattern: /js\.intercomcdn\.com|widget\.intercom\.io/i, name: "Intercom" },
  { pattern: /js\.driftt\.com|drift\.com/i, name: "Drift" },
  { pattern: /static\.zdassets\.com|widget\.zopim\.com/i, name: "Zendesk Chat" },
  { pattern: /cdn\.crisp\.chat|client\.crisp\.chat/i, name: "Crisp" },
  { pattern: /cdn\.livechatinc\.com/i, name: "LiveChat" },
  { pattern: /code\.tidio\.co/i, name: "Tidio" },
  { pattern: /embed\.tawk\.to/i, name: "Tawk.to" },
  { pattern: /js\.hubspot\.com.*messages/i, name: "HubSpot Chat" },
  { pattern: /cdn\.olark\.com/i, name: "Olark" },
  { pattern: /wchat\.freshchat\.com|assets\.freshdesk\.com/i, name: "Freshchat/Freshdesk" },
  { pattern: /chatwoot\.com\/packs/i, name: "Chatwoot" },
];

// --- Social embeds (track users) ---
const SOCIAL_EMBEDS = [
  { pattern: /platform\.twitter\.com\/widgets/i, name: "Twitter/X Embed" },
  { pattern: /connect\.facebook\.net.*sdk/i, name: "Facebook SDK" },
  { pattern: /platform\.instagram\.com/i, name: "Instagram Embed" },
  { pattern: /platform\.linkedin\.com/i, name: "LinkedIn Widget" },
  { pattern: /assets\.pinterest\.com/i, name: "Pinterest Widget" },
  { pattern: /embedsocial\.com/i, name: "EmbedSocial" },
  { pattern: /addthis\.com/i, name: "AddThis" },
  { pattern: /addtoany\.com/i, name: "AddToAny" },
  { pattern: /sharethis\.com/i, name: "ShareThis" },
];

// --- Consent management platforms (not Cookiebot) ---
const CONSENT_SCRIPTS = [
  { pattern: /widgets\.openli\.com|legalmonster/i, name: "Openli Cookie Consent" },
  { pattern: /cdn\.onetrust\.com|optanon/i, name: "OneTrust" },
  { pattern: /cdn\.cookielaw\.org/i, name: "CookieLaw (OneTrust)" },
  { pattern: /cdn\.iubenda\.com/i, name: "iubenda" },
  { pattern: /cdn\.termly\.io/i, name: "Termly" },
  { pattern: /quantcast\.mgr\.consensu\.org|cmp\.quantcast/i, name: "Quantcast Choice" },
  { pattern: /cdn\.usercentrics\.eu/i, name: "Usercentrics" },
  { pattern: /app\.complianz\.io/i, name: "Complianz" },
  { pattern: /consent\.trustarc\.com|truste\.com\/notice/i, name: "TrustArc" },
  { pattern: /sdk\.didomi\.io/i, name: "Didomi" },
  { pattern: /policy\.cookie-information\.com/i, name: "Cookie Information" },
  { pattern: /cdn\.cookieyes\.com/i, name: "CookieYes" },
  { pattern: /cc\.cdn\.civiccomputing\.com/i, name: "Civic Cookie Control" },
  { pattern: /cdn\.osano\.com|cmp\.osano\.com/i, name: "Osano" },
  { pattern: /cdn\.klaro\.org|kiprotect\.com\/klaro/i, name: "Klaro" },
  { pattern: /cdn\.cookie-script\.com/i, name: "Cookie Script" },
  { pattern: /cdn\.axept\.io/i, name: "Axeptio" },
];

// --- Other privacy-sensitive third-party scripts ---
const OTHER_PRIVACY_SCRIPTS = [
  { pattern: /recaptcha.*api\.js|google\.com\/recaptcha/i, name: "Google reCAPTCHA" },
  { pattern: /hcaptcha\.com/i, name: "hCaptcha" },
  { pattern: /js\.sentry-cdn\.com|browser\.sentry-cdn/i, name: "Sentry" },
  { pattern: /js-agent\.newrelic\.com|nr-data\.net/i, name: "New Relic" },
  { pattern: /browser-intake-datadoghq\.com|dd-rum/i, name: "Datadog RUM" },
  { pattern: /cdn\.ravenjs\.com/i, name: "Raven.js (Sentry legacy)" },
  { pattern: /cdn\.rollbar\.com/i, name: "Rollbar" },
];


const PAGE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

async function fetchPage(url: string): Promise<{ $: cheerio.CheerioAPI; html: string } | null> {
  try {
    const cached = await prisma.pageCache.findUnique({ where: { url } });
    if (cached && Date.now() - cached.fetchedAt.getTime() < PAGE_CACHE_TTL) {
      return { $: cheerio.load(cached.html), html: cached.html };
    }
  } catch {}

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "StormforsGDPRAudit/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return null;
    const html = await response.text();
    try {
      await prisma.pageCache.upsert({
        where: { url },
        update: { html, fetchedAt: new Date() },
        create: { url, html },
      });
    } catch {}
    return { $: cheerio.load(html), html };
  } catch {
    return null;
  }
}

const PAGE_SPECIFIC_KEYS = new Set(["E1", "E3", "E4", "E5", "F1", "F3", "F5"]);

function runSiteWideChecks($: cheerio.CheerioAPI, html: string, detectedGtmId: string | null, detectedCookiebotId: string | null): CheckResult[] {
  const g1Result = checkG1($, html, detectedGtmId, detectedCookiebotId);
  const hasBanner = g1Result.status === "ok";
  return [
    checkA1($, html),
    checkA2($, html),
    checkB1($, html),
    checkD1($, html),
    checkD3($, html),
    checkE2($, html),
    checkI3($),
    checkI4($),
    g1Result,
    checkB5($, html, detectedGtmId, detectedCookiebotId),
  ];
}

function runPageSpecificChecks($: cheerio.CheerioAPI, html: string, pageUrl: string): CheckResult[] {
  const checks = [
    checkE1($),
    checkE3($),
    checkE4($, html),
    checkE5($, html),
    checkF1($),
    checkF3($),
    checkF5($),
  ];

  for (const check of checks) {
    for (const finding of check.findings) {
      finding.pageUrl = pageUrl;
    }
  }

  return checks;
}

function deduplicateFindings(findings: ScanFinding[]): ScanFinding[] {
  const groups = new Map<string, { finding: ScanFinding; pages: string[] }>();

  for (const f of findings) {
    const key = `${f.element}||${f.detail}||${f.severity}`;
    const existing = groups.get(key);
    if (existing) {
      if (f.pageUrl && !existing.pages.includes(f.pageUrl)) {
        existing.pages.push(f.pageUrl);
      }
    } else {
      groups.set(key, { finding: { ...f }, pages: f.pageUrl ? [f.pageUrl] : [] });
    }
  }

  return [...groups.values()].map(({ finding, pages }) => {
    if (pages.length > 1) {
      finding.detail = `${finding.detail} (found on ${pages.length} pages)`;
      finding.pageUrl = pages[0];
    }
    return finding;
  });
}

function mergePageSpecificResults(allResults: CheckResult[][]): CheckResult[] {
  const merged = new Map<string, CheckResult>();

  for (const pageResults of allResults) {
    for (const result of pageResults) {
      const existing = merged.get(result.checkKey);
      if (!existing) {
        merged.set(result.checkKey, { ...result });
      } else {
        existing.findings.push(...result.findings);
        if (result.status === "issue") existing.status = "issue";
        else if (result.status === "ok" && existing.status === "na") existing.status = "ok";
      }
    }
  }

  for (const result of merged.values()) {
    result.findings = deduplicateFindings(result.findings);

    const issueFindings = result.findings.filter((f) => f.severity === "error" || f.severity === "warning");
    if (result.checkKey === "F1") {
      const formFindings = result.findings.filter((f) => f.element !== "page");
      result.summary = formFindings.length === 0
        ? "No forms detected"
        : `${formFindings.length} form(s) found across scanned pages`;
      result.status = formFindings.length === 0 ? "na" : "ok";
    } else if (result.checkKey === "F3") {
      const issues = result.findings.filter((f) => f.severity === "error");
      result.summary = issues.length === 0
        ? "All forms have privacy policy links nearby"
        : `${issues.length} unique form(s) missing privacy policy link`;
      result.status = issues.length > 0 ? "issue" : "ok";
    } else if (result.checkKey === "F5") {
      const issues = result.findings.filter((f) => f.severity === "error");
      result.summary = issues.length === 0
        ? "All form submissions use HTTPS or relative URLs"
        : `${issues.length} form(s) submit over unencrypted HTTP`;
      result.status = issues.length > 0 ? "issue" : "ok";
    } else if (issueFindings.length > 0) {
      result.summary = `${issueFindings.length} issue(s) found across scanned pages`;
    }
  }

  return [...merged.values()];
}

export async function scanSite(url: string, platform?: string | null, opts?: { storedCookiebotId?: string; storedGtmId?: string }): Promise<ScanResult> {
  const normalizedUrl = normalizeUrl(url);

  const homePage = await fetchPage(normalizedUrl);
  if (!homePage) {
    return {
      url: normalizedUrl,
      scannedAt: new Date().toISOString(),
      checks: [],
      error: `Could not reach ${normalizedUrl}. Check that the URL is correct and the site is online.`,
    };
  }

  const { $: home$, html: homeHtml } = homePage;
  const detectedCookiebotId = detectCookiebotId(home$);
  const detectedGtmId = detectGtmId(home$, homeHtml);
  const effectiveCookiebotId = detectedCookiebotId || opts?.storedCookiebotId || null;
  const effectiveGtmId = detectedGtmId || opts?.storedGtmId || null;

  const allScripts = getScriptSources(home$);
  const vendors = detectVendors(allScripts, platform);

  const siteWideChecks = runSiteWideChecks(home$, homeHtml, effectiveGtmId, effectiveCookiebotId);
  siteWideChecks.push(checkJ1(vendors), checkJ3(vendors));

  for (const check of siteWideChecks) {
    for (const finding of check.findings) {
      if (!finding.pageUrl) finding.pageUrl = normalizedUrl;
    }
  }

  const homePageSpecific = runPageSpecificChecks(home$, homeHtml, normalizedUrl);

  const { fetchSitemapUrls } = await import("@/lib/sitemap");
  const sitemapUrls = await fetchSitemapUrls(normalizedUrl);
  const subpageUrls = sitemapUrls.filter((u) => u !== normalizedUrl);

  const allPageSpecific: CheckResult[][] = [homePageSpecific];

  const CONCURRENCY = 5;
  for (let i = 0; i < subpageUrls.length; i += CONCURRENCY) {
    const batch = subpageUrls.slice(i, i + CONCURRENCY);
    const pages = await Promise.all(batch.map((pageUrl) => fetchPage(pageUrl).then((page) => page ? { page, pageUrl } : null)));
    for (const result of pages) {
      if (result) allPageSpecific.push(runPageSpecificChecks(result.page.$, result.page.html, result.pageUrl));
    }
  }

  const mergedPageChecks = mergePageSpecificResults(allPageSpecific);

  return {
    url: normalizedUrl,
    scannedAt: new Date().toISOString(),
    checks: [...siteWideChecks, ...mergedPageChecks],
    detectedCookiebotId: detectedCookiebotId || undefined,
    detectedGtmId: detectedGtmId || undefined,
    pagesScanned: 1 + subpageUrls.length,
    detectedVendors: vendors.length > 0 ? vendors : undefined,
  };
}

function getScriptSources($: cheerio.CheerioAPI): { src: string; location: string; outerHtml: string }[] {
  const scripts: { src: string; location: string; outerHtml: string }[] = [];

  $("head script").each((_, el) => {
    const src = $(el).attr("src") || "";
    const inline = $(el).html() || "";
    scripts.push({
      src: src || inline.slice(0, 200),
      location: "head",
      outerHtml: $.html(el)?.slice(0, 300) || "",
    });
  });

  $("body script").each((_, el) => {
    const src = $(el).attr("src") || "";
    const inline = $(el).html() || "";
    scripts.push({
      src: src || inline.slice(0, 200),
      location: "body",
      outerHtml: $.html(el)?.slice(0, 300) || "",
    });
  });

  return scripts;
}

function isGtmScript(src: string): boolean {
  return /googletagmanager\.com\/gtm\.js/i.test(src) || /gtm\.start/i.test(src);
}

function isCookiebotScript(src: string): boolean {
  return /consent\.cookiebot\.com|consentcdn\.cookiebot\.com/i.test(src);
}

function isJsonLd($el: ReturnType<cheerio.CheerioAPI>): boolean {
  return $el.attr("type") === "application/ld+json";
}

function isFrameworkScript($el: ReturnType<cheerio.CheerioAPI>, src: string): boolean {
  const type = $el.attr("type") || "";
  if (type === "application/json") return true;
  if ($el.attr("id") === "__NEXT_DATA__") return true;
  if (/\/_next\/static/i.test(src)) return true;

  // Webflow platform scripts
  if (/webflow\.js|webflow-.*\.js/i.test(src)) return true;
  if (/Webflow\.push/i.test(src)) return true;
  if (/cdn\.prod\.website-files\.com\/.+\.js/i.test(src)) return true;
  if (/d3e54v103j8qbb\.cloudfront\.net\/js\/jquery/i.test(src)) return true;
  if (/use\.typekit\.net/i.test(src)) return true;
  if (/Typekit\.load/i.test(src)) return true;
  if (/w-mod-/i.test(src) && src.length < 200) return true;
  if (/\.wf-force-outline-none/i.test(src)) return true;
  if (/ajax\.googleapis\.com\/ajax\/libs\/webfont/i.test(src)) return true;
  if (/WebFont\.load/i.test(src)) return true;
  if (/scrollRestoration/i.test(src)) return true;

  // Other platforms
  if (/assets\.squarespace/i.test(src)) return true;
  if (/cdn\.shopify\.com\/s\/files/i.test(src)) return true;

  // HubSpot platform scripts (not tracking)
  if (/js\.hsforms\.net/i.test(src)) return true;
  if (/js\.hscollectedforms\.net/i.test(src)) return true;

  // Weglot translation widget (no tracking)
  if (/cdn\.weglot\.com/i.test(src)) return true;
  if (/Weglot\.initialize/i.test(src)) return true;

  return false;
}

const ALL_KNOWN_SCRIPTS = [
  ...ANALYTICS_SCRIPTS,
  ...ADVERTISING_SCRIPTS,
  ...SESSION_RECORDING_SCRIPTS,
  ...AB_TESTING_SCRIPTS,
  ...CHAT_WIDGETS,
  ...SOCIAL_EMBEDS,
  ...CONSENT_SCRIPTS,
  ...OTHER_PRIVACY_SCRIPTS,
];

function isTrackingOrPrivacyConcern(src: string): string | null {
  for (const p of ALL_KNOWN_SCRIPTS) {
    if (p.pattern.test(src)) return p.name;
  }
  return null;
}

function scriptPreview(src: string, inline: string): string {
  if (src) return `<script src="${src}">`;
  return `<script> ${inline.slice(0, 120)}${inline.length > 120 ? "..." : ""}`;
}

function scriptFullContent($el: ReturnType<cheerio.CheerioAPI>, src: string, inline: string): string {
  if (src) return `<script src="${src}"></script>`;
  return `<script>\n${inline}\n</script>`;
}

function classifyScript($: cheerio.CheerioAPI, el: Parameters<cheerio.CheerioAPI>[0], src: string, inline: string): { label: string; severity: "error" | "warning" | "info" } {
  const content = src || inline;
  if (isGtmScript(content)) return { label: "Google Tag Manager (consent mechanism)", severity: "info" };
  if (isCookiebotScript(content)) return { label: "Cookiebot (consent mechanism)", severity: "info" };
  if (isJsonLd($(el))) return { label: "JSON-LD structured data", severity: "info" };
  if (isFrameworkScript($(el), content)) return { label: "Platform/framework script (safe)", severity: "info" };
  const tracker = isTrackingOrPrivacyConcern(content);
  if (tracker) return { label: tracker, severity: "error" };
  return { label: "Unknown script", severity: "warning" };
}

function checkA1($: cheerio.CheerioAPI, html: string): CheckResult {
  const findings: ScanFinding[] = [];
  let issueCount = 0;
  let scriptIndex = 0;

  const headScripts = $("head script").toArray();
  const consentIdx = headScripts.findIndex((el) => {
    const src = $(el).attr("src") || $(el).html() || "";
    return isGtmScript(src) || isCookiebotScript(src);
  });

  const headChildren = $("head").contents().toArray();

  for (const node of headChildren) {
    if (node.type === "comment") {
      const text = (node as unknown as { data: string }).data?.trim();
      if (!text) continue;
      const preview = text.length > 120 ? `${text.slice(0, 120)}...` : text;
      findings.push({
        element: `<!-- ${preview} -->`,
        detail: "HTML comment",
        severity: "info",
        elementType: "comment",
        scriptContent: text.length > 120 ? `<!-- ${text} -->` : undefined,
      });
      continue;
    }

    if (node.type !== "tag" && node.type !== "script" && node.type !== "style") continue;
    const el = node;
    const tagName = ((el as { tagName?: string }).tagName || "").toLowerCase();

    if (tagName === "meta") {
      const name = $(el).attr("name") || $(el).attr("property") || $(el).attr("http-equiv") || "";
      const content = $(el).attr("content") || "";
      const charset = $(el).attr("charset") || "";
      let label = "Meta tag";
      if (charset) label = `charset: ${charset}`;
      else if (name) label = `${name}`;
      const outerHtml = $.html(el).trim();
      const preview = outerHtml.length > 120 ? `${outerHtml.slice(0, 120)}...` : outerHtml;
      findings.push({
        element: preview,
        detail: label,
        severity: "info",
        elementType: "meta",
        scriptContent: outerHtml.length > 120 ? outerHtml : undefined,
      });
      continue;
    }

    if (tagName === "link") {
      const rel = $(el).attr("rel") || "";
      const href = $(el).attr("href") || "";
      const label = rel ? `<link rel="${rel}">` : "<link>";
      const outerHtml = $.html(el).trim();
      const preview = outerHtml.length > 120 ? `${outerHtml.slice(0, 120)}...` : outerHtml;
      findings.push({
        element: preview,
        detail: label,
        severity: "info",
        elementType: "link",
        scriptContent: outerHtml.length > 120 ? outerHtml : undefined,
      });
      continue;
    }

    if (tagName === "style") {
      const content = $(el).html() || "";
      if (!content.trim()) continue;
      const preview = `<style> ${content.trim().slice(0, 120)}${content.trim().length > 120 ? "..." : ""}`;
      findings.push({
        element: preview,
        detail: "Inline stylesheet",
        severity: "info",
        elementType: "style",
        scriptContent: `<style>\n${content}\n</style>`,
      });
      continue;
    }

    if (tagName === "noscript") {
      const content = $(el).html() || "";
      if (!content.trim()) continue;
      const preview = `<noscript> ${content.trim().slice(0, 120)}${content.trim().length > 120 ? "..." : ""}`;
      const isGtmNoscript = content.includes("googletagmanager.com/ns.html");
      findings.push({
        element: preview,
        detail: isGtmNoscript ? "GTM noscript fallback" : "Noscript content",
        severity: "info",
        elementType: "noscript",
        scriptContent: `<noscript>\n${content}\n</noscript>`,
      });
      continue;
    }

    if (tagName === "script") {
      const src = $(el).attr("src") || "";
      const inline = $(el).html() || "";
      if (!src && !inline.trim()) { scriptIndex++; continue; }

      const { label, severity } = classifyScript($, el, src, inline);
      const loadsBefore = consentIdx >= 0 && scriptIndex < consentIdx;
      const preview = scriptPreview(src, inline);
      const fullContent = scriptFullContent($(el), src, inline);

      if (severity === "info") {
        findings.push({
          element: preview,
          detail: label,
          severity: "info",
          scriptContent: fullContent,
          elementType: "script",
        });
      } else if (severity === "error") {
        issueCount++;
        const orderNote = loadsBefore
          ? ` Loads BEFORE GTM/Cookiebot, so it fires without user consent.`
          : "";
        findings.push({
          element: preview,
          detail: `${label} loaded directly in <head>.${orderNote} Remove this script from the site header and add it as a tag inside the GTM container instead, so it only fires after the visitor gives consent.`,
          severity: "error",
          scriptContent: fullContent,
          elementType: "script",
        });
      } else {
        issueCount++;
        if (loadsBefore) {
          findings.push({
            element: preview,
            detail: "Unrecognized script loads BEFORE GTM/Cookiebot. It fires before consent is obtained. Check what this script does - if it tracks users or sets cookies, move it into the GTM container. If it's a harmless utility, move it after the GTM script so consent loads first.",
            severity: "error",
            scriptContent: fullContent,
            elementType: "script",
          });
        } else {
          findings.push({
            element: preview,
            detail: "Unrecognized script - not in our known tracker list. Check manually: does it set cookies, track users, or send data to third parties? If yes, move it into the GTM container. If unsure, treat it as a potential issue.",
            severity: "warning",
            scriptContent: fullContent,
            elementType: "script",
          });
        }
      }
      scriptIndex++;
      continue;
    }

    if (!["title", "base"].includes(tagName)) {
      const outerHtml = $.html(el).trim();
      if (!outerHtml) continue;
      const preview = outerHtml.length > 120 ? `${outerHtml.slice(0, 120)}...` : outerHtml;
      findings.push({
        element: preview,
        detail: `<${tagName}> element`,
        severity: "info",
        elementType: "other",
        scriptContent: outerHtml.length > 120 ? outerHtml : undefined,
      });
    }
  }

  const scriptCount = findings.filter((f) => f.elementType === "script").length;
  const totalCount = findings.length;

  return {
    checkKey: "A1",
    status: issueCount > 0 ? "issue" : "ok",
    findings,
    summary: issueCount > 0
      ? `${issueCount} issue(s) in <head>: tracking scripts outside GTM or scripts loading before consent. ${totalCount} elements found (${scriptCount} scripts).`
      : `${totalCount} elements in <head> (${scriptCount} scripts) - all safe`,
  };
}

function checkA2($: cheerio.CheerioAPI, html: string): CheckResult {
  const findings: ScanFinding[] = [];
  const bodyScripts = $("body script").toArray();
  let issueCount = 0;

  for (const el of bodyScripts) {
    const src = $(el).attr("src") || "";
    const inline = $(el).html() || "";
    if (!src && !inline.trim()) continue;

    const { label, severity } = classifyScript($, el, src, inline);
    const preview = scriptPreview(src, inline);
    const fullContent = scriptFullContent($(el), src, inline);

    if (severity === "info") {
      findings.push({
        element: preview,
        detail: label,
        severity: "info",
        scriptContent: fullContent,
      });
    } else if (severity === "error") {
      issueCount++;
      findings.push({
        element: preview,
        detail: `${label} loaded directly in <body>. Remove this script from the site footer/body and add it as a tag inside the GTM container instead, so it only fires after the visitor gives consent.`,
        severity: "error",
        scriptContent: fullContent,
      });
    } else {
      issueCount++;
      findings.push({
        element: preview,
        detail: "Unrecognized script - not in our known tracker list. Check manually: does it set cookies, track users, or send data to third parties? If yes, move it into the GTM container. If unsure, treat it as a potential issue.",
        severity: "warning",
        scriptContent: fullContent,
      });
    }
  }

  return {
    checkKey: "A2",
    status: issueCount > 0 ? "issue" : "ok",
    findings,
    summary: issueCount > 0
      ? `${issueCount} issue(s) in <body>: scripts outside GTM. ${findings.length} total scripts found.`
      : findings.length > 0
        ? `${findings.length} script(s) in <body> - all safe (platform scripts)`
        : "No scripts in body/footer",
  };
}

function checkB1($: cheerio.CheerioAPI, html: string): CheckResult {
  const findings: ScanFinding[] = [];
  const allScripts = getScriptSources($);

  for (const script of allScripts) {
    for (const tracker of ALL_KNOWN_SCRIPTS) {
      if (tracker.pattern.test(script.src)) {
        findings.push({
          element: script.outerHtml.slice(0, 200),
          detail: `${tracker.name} loaded directly (${script.location}). Should be inside GTM.`,
          severity: "error",
          scriptContent: script.outerHtml,
        });
      }
    }
  }

  return {
    checkKey: "B1",
    status: findings.length === 0 ? "ok" : "issue",
    findings,
    summary: findings.length === 0
      ? "No tracking scripts found outside GTM"
      : `${findings.length} tracking script(s) loaded outside GTM`,
  };
}

function checkD1($: cheerio.CheerioAPI, html: string): CheckResult {
  const findings: ScanFinding[] = [];
  const allScripts = getScriptSources($);

  for (const script of allScripts) {
    for (const ghost of [...SESSION_RECORDING_SCRIPTS, ...AB_TESTING_SCRIPTS]) {
      if (ghost.pattern.test(script.src)) {
        findings.push({
          element: script.outerHtml.slice(0, 200),
          detail: `${ghost.name} script detected (${script.location}). Verify if still in use.`,
          severity: "warning",
          scriptContent: script.outerHtml,
        });
      }
    }
  }

  return {
    checkKey: "D1",
    status: findings.length === 0 ? "ok" : "issue",
    findings,
    summary: findings.length === 0
      ? "No ghost scripts from discontinued services"
      : `${findings.length} potential ghost script(s) found`,
  };
}

function checkD3($: cheerio.CheerioAPI, html: string): CheckResult {
  const findings: ScanFinding[] = [];
  const headScripts = $("head script").toArray();

  const pixelPatterns = [
    { pattern: /connect\.facebook\.net/i, name: "Meta Pixel" },
    { pattern: /snap\.licdn\.com/i, name: "LinkedIn Pixel" },
    { pattern: /static\.ads-twitter\.com|analytics\.twitter\.com/i, name: "Twitter/X Pixel" },
    { pattern: /analytics\.tiktok\.com/i, name: "TikTok Pixel" },
    { pattern: /bat\.bing\.com/i, name: "Bing UET Pixel" },
    { pattern: /sc-static\.net\/scevent/i, name: "Snapchat Pixel" },
  ];

  for (const el of headScripts) {
    const src = $(el).attr("src") || $(el).html() || "";
    for (const pixel of pixelPatterns) {
      if (pixel.pattern.test(src)) {
        const fullScript = $(el).attr("src") ? `<script src="${$(el).attr("src")}"></script>` : `<script>\n${$(el).html()}\n</script>`;
        findings.push({
          element: `<script> ${pixel.name}`,
          detail: `${pixel.name} placed directly in <head> instead of GTM`,
          severity: "error",
          scriptContent: fullScript,
        });
      }
    }
  }

  return {
    checkKey: "D3",
    status: findings.length === 0 ? "ok" : "issue",
    findings,
    summary: findings.length === 0
      ? "No orphaned pixels in header"
      : `${findings.length} pixel(s) hardcoded in header instead of GTM`,
  };
}

function checkE1($: cheerio.CheerioAPI): CheckResult {
  const findings: ScanFinding[] = [];

  $("iframe").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "";

    if (/youtube\.com\/embed/i.test(src) && !/youtube-nocookie\.com/i.test(src)) {
      findings.push({
        element: `<iframe src="${src.slice(0, 100)}">`,
        detail: "YouTube embed should use youtube-nocookie.com domain",
        severity: "error",
        scriptContent: $.html(el) || undefined,
      });
    }

    if (/player\.vimeo\.com/i.test(src)) {
      findings.push({
        element: `<iframe src="${src.slice(0, 100)}">`,
        detail: "Vimeo embed found. Must block until consent or use click-to-load.",
        severity: "warning",
        scriptContent: $.html(el) || undefined,
      });
    }
  });

  return {
    checkKey: "E1",
    status: findings.length === 0 ? "ok" : "issue",
    findings: findings.length === 0
      ? [{ element: "page", detail: "No YouTube or Vimeo embeds detected. If the site has video embeds that appear after clicking something, double-check those in the browser.", severity: "info" as const }]
      : findings,
    summary: findings.length === 0
      ? "No video embeds detected"
      : `${findings.length} video embed issue(s) found`,
  };
}

function checkE2($: cheerio.CheerioAPI, html: string): CheckResult {
  const findings: ScanFinding[] = [];

  $("link[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(href)) {
      findings.push({
        element: `<link href="${href.slice(0, 100)}">`,
        detail: "Google Fonts loaded from Google CDN. Must self-host (EUR 100/violation precedent).",
        severity: "error",
      });
    }
  });

  if (/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(html)) {
    const existing = findings.length;
    if (existing === 0) {
      findings.push({
        element: "inline reference",
        detail: "Google Fonts CDN reference found in page source (CSS @import or inline style)",
        severity: "error",
      });
    }
  }

  return {
    checkKey: "E2",
    status: findings.length === 0 ? "ok" : "issue",
    findings,
    summary: findings.length === 0
      ? "No Google Fonts loaded from CDN"
      : "Google Fonts loaded from Google CDN instead of self-hosted",
  };
}

function checkE3($: cheerio.CheerioAPI): CheckResult {
  const findings: ScanFinding[] = [];

  $("iframe").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "";
    if (/google\.com\/maps|maps\.google\.|maps\.googleapis/i.test(src)) {
      findings.push({
        element: `<iframe src="${src.slice(0, 100)}">`,
        detail: "Google Maps embed loads without consent. Block until consent or use static image.",
        severity: "error",
        scriptContent: $.html(el) || undefined,
      });
    }
    if (/api\.mapbox\.com/i.test(src)) {
      findings.push({
        element: `<iframe src="${src.slice(0, 100)}">`,
        detail: "Mapbox embed found. Block until consent or use static image.",
        severity: "warning",
        scriptContent: $.html(el) || undefined,
      });
    }
  });

  const allScripts = getScriptSources($);
  for (const script of allScripts) {
    if (/maps\.googleapis\.com\/maps\/api\/js/i.test(script.src)) {
      findings.push({
        element: script.outerHtml.slice(0, 200),
        detail: "Google Maps JavaScript API loaded via script. Must be consent-gated (transfers IP to Google).",
        severity: "error",
        scriptContent: script.outerHtml,
      });
    }
  }

  return {
    checkKey: "E3",
    status: findings.length === 0 ? "ok" : "issue",
    findings: findings.length === 0
      ? [{ element: "page", detail: "No Google Maps or other map embeds detected. If a map only appears on a contact page or after clicking something, check that page in the browser.", severity: "info" as const }]
      : findings,
    summary: findings.length === 0
      ? "No map embeds detected"
      : `${findings.length} map embed(s) loading without consent gate`,
  };
}

function checkE4($: cheerio.CheerioAPI, html: string): CheckResult {
  const findings: ScanFinding[] = [];
  const allScripts = getScriptSources($);

  for (const script of allScripts) {
    for (const widget of CHAT_WIDGETS) {
      if (widget.pattern.test(script.src)) {
        findings.push({
          element: script.outerHtml.slice(0, 200),
          detail: `${widget.name} loads without consent check. Gate behind consent if non-essential cookies.`,
          severity: "warning",
          scriptContent: script.outerHtml,
        });
      }
    }
  }

  return {
    checkKey: "E4",
    status: findings.length === 0 ? "ok" : "issue",
    findings: findings.length === 0
      ? [{ element: "page", detail: "No chat widgets detected (e.g. Intercom, Drift, Zendesk). If a chat bubble appears when you visit the site in a browser, it needs consent gating.", severity: "info" as const }]
      : findings,
    summary: findings.length === 0
      ? "No chat widgets detected"
      : `${findings.length} chat widget(s) loading without consent`,
  };
}

function checkE5($: cheerio.CheerioAPI, html: string): CheckResult {
  const findings: ScanFinding[] = [];
  const allScripts = getScriptSources($);

  for (const script of allScripts) {
    for (const embed of SOCIAL_EMBEDS) {
      if (embed.pattern.test(script.src)) {
        findings.push({
          element: script.outerHtml.slice(0, 200),
          detail: `${embed.name} loaded. Verify consent gating if it sets non-essential cookies.`,
          severity: "warning",
          scriptContent: script.outerHtml,
        });
      }
    }
  }

  $("iframe").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (/facebook\.com\/plugins|instagram\.com\/embed/i.test(src)) {
      findings.push({
        element: `<iframe src="${src.slice(0, 100)}">`,
        detail: "Social media embed found. Block until consent.",
        severity: "warning",
        scriptContent: $.html(el) || undefined,
      });
    }
  });

  return {
    checkKey: "E5",
    status: findings.length === 0 ? "ok" : "issue",
    findings: findings.length === 0
      ? [{ element: "page", detail: "No social media embeds detected (e.g. Facebook, Instagram). If social feeds or share widgets appear on the site, they need consent gating.", severity: "info" as const }]
      : findings,
    summary: findings.length === 0
      ? "No social embeds detected"
      : `${findings.length} social embed(s) found`,
  };
}

function checkF1($: cheerio.CheerioAPI): CheckResult {
  const findings: ScanFinding[] = [];

  $("form").each((i, el) => {
    const action = $(el).attr("action") || "(no action attribute)";
    const method = $(el).attr("method") || "GET";
    const id = $(el).attr("id") || $(el).attr("name") || `form-${i + 1}`;
    const inputs = $(el).find("input, textarea, select").toArray();
    const fields = inputs
      .map((inp) => $(inp).attr("name") || $(inp).attr("type") || "unnamed")
      .join(", ");

    findings.push({
      element: `<form id="${id}" action="${action}" method="${method}">`,
      detail: `Fields: ${fields || "none detected"}`,
      severity: "info",
      scriptContent: $.html(el) || undefined,
    });
  });

  return {
    checkKey: "F1",
    status: findings.length === 0 ? "na" : "ok",
    findings: findings.length === 0
      ? [{ element: "page", detail: "No forms detected on the scanned pages. If the site has forms on pages not in the sitemap (e.g. landing pages, gated content), check those separately.", severity: "info" as const }]
      : findings,
    summary: findings.length === 0
      ? "No forms detected"
      : `${findings.length} form(s) found`,
  };
}

function checkF3($: cheerio.CheerioAPI): CheckResult {
  const findings: ScanFinding[] = [];
  const privacyPatterns = /privacy|dataskydd|integritet|personuppgift|sekretesspolicy|privatlivspolicy|gdpr|cookie/i;

  $("form").each((i, el) => {
    const formId = $(el).attr("id") || $(el).attr("name") || `form-${i + 1}`;
    const formHtml = $.html(el) || "";
    const hasPrivacyLink = $(el).find("a").toArray().some((a) =>
      privacyPatterns.test($(a).attr("href") || "") || privacyPatterns.test($(a).text())
    );

    const parent = $(el).parent();
    const nearbyLinks = parent.find("a").toArray().some((a) =>
      privacyPatterns.test($(a).attr("href") || "") || privacyPatterns.test($(a).text())
    );

    if (!hasPrivacyLink && !nearbyLinks) {
      findings.push({
        element: `<form id="${formId}">`,
        detail: "No privacy policy link found at or near this form",
        severity: "error",
        scriptContent: formHtml || undefined,
      });
    }
  });

  const formCount = $("form").length;
  if (formCount === 0) {
    return { checkKey: "F3", status: "na", findings: [], summary: "No forms on page" };
  }

  return {
    checkKey: "F3",
    status: findings.length === 0 ? "ok" : "issue",
    findings,
    summary: findings.length === 0
      ? "All forms have privacy policy links nearby"
      : `${findings.length} form(s) missing privacy policy link`,
  };
}

function checkF5($: cheerio.CheerioAPI): CheckResult {
  const findings: ScanFinding[] = [];

  $("form").each((i, el) => {
    const action = $(el).attr("action") || "";
    const formId = $(el).attr("id") || $(el).attr("name") || `form-${i + 1}`;

    if (action && action.startsWith("http://")) {
      findings.push({
        element: `<form id="${formId}" action="${action}">`,
        detail: "Form submits over HTTP (unencrypted). Must use HTTPS.",
        severity: "error",
        scriptContent: $.html(el) || undefined,
      });
    }
  });

  const formCount = $("form").length;
  if (formCount === 0) {
    return { checkKey: "F5", status: "na", findings: [], summary: "No forms on page" };
  }

  return {
    checkKey: "F5",
    status: findings.length === 0 ? "ok" : "issue",
    findings,
    summary: findings.length === 0
      ? "All form submissions use HTTPS or relative URLs"
      : `${findings.length} form(s) submit over unencrypted HTTP`,
  };
}

function checkI3($: cheerio.CheerioAPI): CheckResult {
  const findings: ScanFinding[] = [];
  const cookiePolicyPatterns = /cookie.*(policy|declaration|notice)|kakor|kakpolicy|cookiepolicy|cookie-?policy/i;

  const links = $("a").toArray();
  const hasCookiePolicy = links.some((a) => {
    const href = $(a).attr("href") || "";
    const text = $(a).text() || "";
    return cookiePolicyPatterns.test(href) || cookiePolicyPatterns.test(text);
  });

  const hasCookiebotDeclaration = $("script[src*='consent.cookiebot.com'][data-culture]").length > 0
    || $("[id*='CookieDeclaration']").length > 0;

  if (!hasCookiePolicy && !hasCookiebotDeclaration) {
    findings.push({
      element: "page",
      detail: "No cookie policy/declaration page link found",
      severity: "error",
    });
  }

  return {
    checkKey: "I3",
    status: findings.length === 0 ? "ok" : "issue",
    findings,
    summary: findings.length === 0
      ? "Cookie policy/declaration link found"
      : "No cookie policy link detected on page",
  };
}

function checkI4($: cheerio.CheerioAPI): CheckResult {
  const findings: ScanFinding[] = [];
  const privacyPatterns = /privacy|dataskydd|integritet|personuppgift|sekretesspolicy|privatlivspolicy/i;

  let footerEl = $("footer").first();
  if (footerEl.length === 0) {
    footerEl = $("[role='contentinfo']").first();
  }
  if (footerEl.length === 0) {
    footerEl = $(".footer, #footer, .site-footer, #site-footer").first();
  }

  if (footerEl.length === 0) {
    const allLinks = $("a").toArray();
    const hasPrivacy = allLinks.some((a) => {
      const href = $(a).attr("href") || "";
      const text = $(a).text() || "";
      return privacyPatterns.test(href) || privacyPatterns.test(text);
    });

    if (!hasPrivacy) {
      findings.push({
        element: "page",
        detail: "No privacy policy link found anywhere on page (no footer element detected either)",
        severity: "error",
      });
    }

    return {
      checkKey: "I4",
      status: findings.length === 0 ? "ok" : "issue",
      findings,
      summary: findings.length === 0
        ? "Privacy policy link found on page"
        : "No privacy policy link detected",
    };
  }

  const footerLinks = footerEl.find("a").toArray();
  const hasPrivacyInFooter = footerLinks.some((a) => {
    const href = $(a).attr("href") || "";
    const text = $(a).text() || "";
    return privacyPatterns.test(href) || privacyPatterns.test(text);
  });

  if (!hasPrivacyInFooter) {
    findings.push({
      element: "<footer>",
      detail: "No privacy policy link found in footer",
      severity: "error",
    });
  }

  return {
    checkKey: "I4",
    status: findings.length === 0 ? "ok" : "issue",
    findings,
    summary: findings.length === 0
      ? "Privacy policy linked in footer"
      : "Privacy policy link missing from footer",
  };
}

function checkG1($: cheerio.CheerioAPI, html: string, detectedGtmId: string | null, detectedCookiebotId: string | null): CheckResult {
  const findings: ScanFinding[] = [];

  const hasCookiebotScript = $("script[src*='consent.cookiebot.com'], script[src*='consentcdn.cookiebot.com']").length > 0;
  const hasCookiebotBanner = $("[id*='CybotCookiebot'], [class*='CybotCookiebot'], #cookiebanner, .cookieconsent").length > 0;
  const hasOtherCMP = /OneTrust|onetrust|quantcast|didomi|trustarc|cookie-?consent|gdpr-?consent/i.test(html);

  if (hasCookiebotScript || hasCookiebotBanner) {
    findings.push({
      element: "Cookiebot",
      detail: "Cookiebot consent script detected - banner should appear on first visit",
      severity: "info",
    });
    return { checkKey: "G1", status: "ok", findings, summary: "Cookiebot consent banner script found" };
  }

  if (hasOtherCMP) {
    findings.push({
      element: "CMP",
      detail: "Non-Cookiebot consent management platform detected",
      severity: "info",
    });
    return { checkKey: "G1", status: "ok", findings, summary: "Consent management platform detected" };
  }

  if (detectedGtmId && detectedCookiebotId) {
    findings.push({
      element: "GTM + Cookiebot",
      detail: "Cookiebot is loaded through GTM (not directly in the HTML). The consent banner appears when the page loads via the Cookiebot CMP template in GTM.",
      severity: "info",
    });
    return { checkKey: "G1", status: "ok", findings, summary: "Cookiebot consent banner loaded via GTM" };
  }

  if (detectedGtmId) {
    return {
      checkKey: "G1",
      status: "blocked",
      findings: [{ element: "GTM", detail: "GTM detected but no Cookiebot script in page HTML. The GTM scan will check if Cookiebot is loaded via GTM.", severity: "info" }],
      summary: "Waiting for GTM scan to check consent banner",
    };
  }

  findings.push({
    element: "page",
    detail: "No Cookiebot or other consent management platform found in the page HTML. No GTM container detected either. Visitors will not see a cookie consent banner.",
    severity: "error",
  });
  findings.push({
    element: "page",
    detail: "Check if this client has a Cookiebot subscription at cookiebot.com. The site may need both GTM and Cookiebot set up.",
    severity: "warning",
  });

  return { checkKey: "G1", status: "issue", findings, summary: "No cookie consent banner found" };
}

function checkB5($: cheerio.CheerioAPI, html: string, gtmId: string | null, cookiebotId: string | null): CheckResult {
  const findings: ScanFinding[] = [];

  const hasGtag = /googletagmanager\.com\/gtag\/js|gtag\s*\(\s*['"]consent['"]/i.test(html);
  const hasConsentDefault = /gtag\s*\(\s*['"]consent['"]\s*,\s*['"]default['"]/i.test(html);
  const hasGCMParams = /ad_storage|analytics_storage|ad_user_data|ad_personalization/i.test(html);
  const hasCookiebotGCM = /data-georegions|data-consentmode/i.test(
    ($("script[src*='consent.cookiebot.com']").attr("data-georegions") || "") +
    ($("script[src*='consent.cookiebot.com']").attr("data-consentmode") || "") +
    $.html($("script[src*='consent.cookiebot.com']")) || ""
  );

  if (hasConsentDefault && hasGCMParams) {
    findings.push({
      element: "gtag consent",
      detail: "Google Consent Mode V2 default command found with consent parameters",
      severity: "info",
    });
    return { checkKey: "B5", status: "ok", findings, summary: "Consent Mode V2 configured via gtag" };
  }

  if (hasCookiebotGCM) {
    findings.push({
      element: "Cookiebot GCM",
      detail: "Cookiebot script has Consent Mode attributes configured",
      severity: "info",
    });
    return { checkKey: "B5", status: "ok", findings, summary: "Consent Mode V2 configured via Cookiebot" };
  }

  if (hasGtag && !hasConsentDefault) {
    findings.push({
      element: "gtag",
      detail: "Google tag found but no consent default command. Consent Mode V2 may not be configured.",
      severity: "warning",
    });
    return { checkKey: "B5", status: "issue", findings, summary: "Google tag without Consent Mode V2 default" };
  }

  if (gtmId && cookiebotId) {
    findings.push({
      element: "GTM + Cookiebot",
      detail: "Both GTM and Cookiebot are detected, but Consent Mode V2 can't be verified from the page HTML alone - it's configured inside GTM via the Cookiebot CMP template. Check in the Cookiebot admin under Analytics > Google Consent Mode that all parameters pass, or verify in GTM Preview Mode that consent defaults are set.",
      severity: "warning",
    });
    return { checkKey: "B5", status: "not_checked", findings, summary: "GTM + Cookiebot detected - verify Consent Mode V2 in Cookiebot admin or GTM Preview" };
  }

  findings.push({
    element: "page",
    detail: "No Consent Mode V2 configuration found in the page HTML. This is usually configured inside GTM via the Cookiebot CMP template. To verify: add the GTM Container ID and Cookiebot ID in Edit Site, then run the scan again.",
    severity: "info",
  });
  return { checkKey: "B5", status: "blocked", findings, summary: "Needs GTM Container ID and Cookiebot ID to check Consent Mode" };
}

function checkJ1(vendors: DetectedVendor[]): CheckResult {
  const findings: ScanFinding[] = [];

  if (vendors.length === 0) {
    return {
      checkKey: "J1",
      status: "na",
      findings: [{ element: "", detail: "No third-party services detected on the site", severity: "info" }],
      summary: "No vendors detected to check",
    };
  }

  const covered = vendors.filter((v) => v.dpaStatus === "covered-by-tos");
  const needsCheck = vendors.filter((v) => v.dpaStatus === "needs-verification");

  for (const v of covered) {
    findings.push({
      element: "",
      detail: `${v.name} - DPA already covered by their terms of service`,
      severity: "info",
    });
  }

  for (const v of needsCheck) {
    findings.push({
      element: "",
      detail: `${v.name} - needs verification. ${v.dpaNote}`,
      severity: "warning",
    });
  }

  const status = needsCheck.length > 0 ? "issue" : "ok";
  const summary = needsCheck.length > 0
    ? `${vendors.length} service(s) detected: ${covered.length} covered by ToS, ${needsCheck.length} need client verification`
    : `${vendors.length} service(s) detected, all have DPAs covered by their terms of service`;

  return { checkKey: "J1", status, findings, summary };
}

function checkJ3(vendors: DetectedVendor[]): CheckResult {
  const findings: ScanFinding[] = [];
  const usVendors = vendors.filter((v) => v.country === "us");

  if (usVendors.length === 0) {
    return {
      checkKey: "J3",
      status: "ok",
      findings: [{ element: "", detail: "No US-based services detected on the site", severity: "info" }],
      summary: "No US vendors detected - no data transfer concerns",
    };
  }

  const certified = usVendors.filter((v) => v.dpfCertified === true);
  const notCertified = usVendors.filter((v) => v.dpfCertified === false);
  const unknown = usVendors.filter((v) => v.dpfCertified === undefined);

  for (const v of certified) {
    findings.push({
      element: "",
      detail: `${v.name} - DPF-certified. ${v.dpfNote || ""}`.trim(),
      severity: "info",
    });
  }

  for (const v of notCertified) {
    findings.push({
      element: "",
      detail: `${v.name} - NOT DPF-certified. ${v.dpfNote || "Alternative transfer mechanisms (SCCs) are needed."}`.trim(),
      severity: "error",
    });
  }

  for (const v of unknown) {
    findings.push({
      element: "",
      detail: `${v.name} - DPF status unknown. Check dataprivacyframework.gov manually.`,
      severity: "warning",
    });
  }

  const status = notCertified.length > 0 || unknown.length > 0 ? "issue" : "ok";
  const parts: string[] = [];
  if (certified.length > 0) parts.push(`${certified.length} certified`);
  if (notCertified.length > 0) parts.push(`${notCertified.length} not certified`);
  if (unknown.length > 0) parts.push(`${unknown.length} unknown`);
  const summary = `${usVendors.length} US service(s) detected: ${parts.join(", ")}`;

  return { checkKey: "J3", status, findings, summary };
}

export function detectGtmId($: cheerio.CheerioAPI, html: string): string | null {
  let gtmId: string | null = null;

  $("script[src]").each((_, el) => {
    const src = $(el).attr("src") || "";
    const match = src.match(/googletagmanager\.com\/gtm\.js\?[^'"]*id=(GTM-[A-Z0-9]+)/i);
    if (match) gtmId = match[1].toUpperCase();
  });

  if (!gtmId) {
    const inlineMatch = html.match(/googletagmanager\.com\/gtm\.js\?[^'"]*id=(GTM-[A-Z0-9]+)/i);
    if (inlineMatch) gtmId = inlineMatch[1].toUpperCase();
  }

  if (!gtmId) {
    const noscriptMatch = html.match(/googletagmanager\.com\/ns\.html\?id=(GTM-[A-Z0-9]+)/i);
    if (noscriptMatch) gtmId = noscriptMatch[1].toUpperCase();
  }

  // Standard GTM snippet passes the container ID as a string literal
  if (!gtmId) {
    const literalMatch = html.match(/['"](?:GTM-[A-Z0-9]{4,10})['"]/i);
    if (literalMatch) {
      const idMatch = literalMatch[0].match(/GTM-[A-Z0-9]{4,10}/i);
      if (idMatch) gtmId = idMatch[0].toUpperCase();
    }
  }

  return gtmId;
}

export function detectCookiebotId($: cheerio.CheerioAPI): string | null {
  const cbidAttr = $("script[data-cbid]").attr("data-cbid");
  if (cbidAttr) return cbidAttr;

  let cbid: string | null = null;
  $("script[src]").each((_, el) => {
    const src = $(el).attr("src") || "";
    const match = src.match(/consent\.cookiebot\.com\/uc\.js\?cbid=([a-f0-9-]+)/i)
      || src.match(/consentcdn\.cookiebot\.com\/.*?cbid=([a-f0-9-]+)/i);
    if (match) cbid = match[1];
  });

  return cbid;
}

export function detectHubspotId($: cheerio.CheerioAPI, html: string): string | null {
  let hubId: string | null = null;

  $("script[src]").each((_, el) => {
    const src = $(el).attr("src") || "";
    const match = src.match(/js\.hs-scripts\.com\/(\d+)/i)
      || src.match(/js\.hsforms\.net\/forms\/embed\/v2\.js/i) && null;
    if (match && match[1]) hubId = match[1];
  });

  if (!hubId) {
    const inlineMatch = html.match(/js\.hs-scripts\.com\/(\d+)/i);
    if (inlineMatch) hubId = inlineMatch[1];
  }

  if (!hubId) {
    const analyticsMatch = html.match(/js\.hs-analytics\.net\/analytics\/\d+\/(\d+)/i);
    if (analyticsMatch) hubId = analyticsMatch[1];
  }

  return hubId;
}
