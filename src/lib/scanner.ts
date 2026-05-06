import * as cheerio from "cheerio";
import { normalizeUrl } from "@/lib/url";

export interface ScanFinding {
  element: string;
  detail: string;
  severity: "error" | "warning" | "info";
}

export interface CheckResult {
  checkKey: string;
  status: "ok" | "issue" | "na";
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
}

const KNOWN_TRACKING_SCRIPTS = [
  { pattern: /google-analytics\.com\/analytics\.js/i, name: "Google Analytics (analytics.js)" },
  { pattern: /googletagmanager\.com\/gtag\/js/i, name: "Google Analytics (gtag.js)" },
  { pattern: /connect\.facebook\.net/i, name: "Meta Pixel" },
  { pattern: /snap\.licdn\.com/i, name: "LinkedIn Insight Tag" },
  { pattern: /platform\.twitter\.com/i, name: "Twitter/X Pixel" },
  { pattern: /static\.ads-twitter\.com/i, name: "Twitter/X Ads" },
  { pattern: /analytics\.tiktok\.com/i, name: "TikTok Pixel" },
  { pattern: /sc-static\.net\/scevent\.min\.js/i, name: "Snapchat Pixel" },
  { pattern: /tr\.snapchat\.com/i, name: "Snapchat Conversion" },
  { pattern: /bat\.bing\.com/i, name: "Microsoft/Bing UET" },
  { pattern: /cdn\.segment\.com/i, name: "Segment" },
  { pattern: /cdn\.amplitude\.com/i, name: "Amplitude" },
  { pattern: /cdn\.mxpnl\.com|cdn\.mixpanel\.com/i, name: "Mixpanel" },
  { pattern: /plausible\.io\/js/i, name: "Plausible Analytics" },
  { pattern: /js\.hs-scripts\.com|js\.hs-analytics\.net/i, name: "HubSpot Tracking" },
  { pattern: /static\.hotjar\.com/i, name: "HotJar" },
  { pattern: /clarity\.ms/i, name: "Microsoft Clarity" },
];

const GHOST_SCRIPTS = [
  { pattern: /static\.hotjar\.com/i, name: "HotJar" },
  { pattern: /cdn\.leadfeeder\.net/i, name: "Leadfeeder" },
  { pattern: /js\.driftt\.com|drift\.com\/include/i, name: "Drift" },
  { pattern: /app\.getbeamer\.com/i, name: "Beamer" },
  { pattern: /cdn\.heapanalytics\.com/i, name: "Heap Analytics" },
  { pattern: /d2wy8f7a9ursnm\.cloudfront\.net.*bugsnag/i, name: "Bugsnag" },
  { pattern: /cdn\.optimizely\.com/i, name: "Optimizely" },
  { pattern: /cdn\.mouseflow\.com/i, name: "Mouseflow" },
  { pattern: /cdn\.luckyorange\.com/i, name: "Lucky Orange" },
  { pattern: /static\.zdassets\.com|widget\.zopim\.com/i, name: "Zendesk Widget (old)" },
  { pattern: /cdn\.inspectlet\.com/i, name: "Inspectlet" },
  { pattern: /js\.intercomcdn\.com/i, name: "Intercom" },
  { pattern: /cdn\.usefathom\.com/i, name: "Fathom Analytics" },
];

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
];

const SOCIAL_EMBEDS = [
  { pattern: /platform\.twitter\.com\/widgets/i, name: "Twitter/X Embed" },
  { pattern: /connect\.facebook\.net.*sdk/i, name: "Facebook SDK" },
  { pattern: /platform\.instagram\.com/i, name: "Instagram Embed" },
  { pattern: /platform\.linkedin\.com/i, name: "LinkedIn Widget" },
  { pattern: /assets\.pinterest\.com/i, name: "Pinterest Widget" },
  { pattern: /embedsocial\.com/i, name: "EmbedSocial" },
];


export async function scanSite(url: string): Promise<ScanResult> {
  const normalizedUrl = normalizeUrl(url);

  try {
    const response = await fetch(normalizedUrl, {
      headers: { "User-Agent": "StormforsGDPRAudit/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return {
        url: normalizedUrl,
        scannedAt: new Date().toISOString(),
        checks: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const detectedCookiebotId = detectCookiebotId($);
    const detectedGtmId = detectGtmId($, html);

    const checks: CheckResult[] = [
      checkA1($, html),
      checkA2($, html),
      checkB1($, html),
      checkD1($, html),
      checkD3($, html),
      checkE1($),
      checkE2($, html),
      checkE3($),
      checkE4($, html),
      checkE5($, html),
      checkF1($),
      checkF3($),
      checkF5($),
      checkI3($),
      checkI4($),
      checkG1($, html),
      checkG8($, html),
      checkB5($, html),
    ];

    return {
      url: normalizedUrl,
      scannedAt: new Date().toISOString(),
      checks,
      detectedCookiebotId: detectedCookiebotId || undefined,
      detectedGtmId: detectedGtmId || undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    let userError = message;
    if (/fetch failed|ENOTFOUND|getaddrinfo/i.test(message)) {
      userError = `Could not reach ${normalizedUrl}. Check that the URL is correct and the site is online.`;
    } else if (/timed? ?out|aborted/i.test(message)) {
      userError = `The site at ${normalizedUrl} took too long to respond (15s timeout).`;
    }
    return {
      url: normalizedUrl,
      scannedAt: new Date().toISOString(),
      checks: [],
      error: userError,
    };
  }
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
  if (/webflow\.js|webflow-.*\.js/i.test(src)) return true;
  if (/Webflow\.push/i.test(src)) return true;
  if (/assets\.squarespace/i.test(src)) return true;
  if (/cdn\.shopify\.com\/s\/files/i.test(src)) return true;
  return false;
}

function checkA1($: cheerio.CheerioAPI, html: string): CheckResult {
  const findings: ScanFinding[] = [];
  const headScripts = $("head script").toArray();

  const nonAllowed = headScripts.filter((el) => {
    const src = $(el).attr("src") || $(el).html() || "";
    return !isGtmScript(src) && !isCookiebotScript(src) && !isJsonLd($(el)) && !isFrameworkScript($(el), src) && src.trim().length > 0;
  });

  for (const el of nonAllowed) {
    const src = $(el).attr("src") || $(el).html()?.slice(0, 100) || "";
    findings.push({
      element: `<script src="${src}">`,
      detail: "Non-GTM script found in <head>. Should be managed through GTM.",
      severity: "error",
    });
  }

  return {
    checkKey: "A1",
    status: findings.length === 0 ? "ok" : "issue",
    findings,
    summary: findings.length === 0
      ? "Only GTM (and Cookiebot/JSON-LD) scripts found in <head>"
      : `${findings.length} non-GTM script(s) found in <head>`,
  };
}

function checkA2($: cheerio.CheerioAPI, html: string): CheckResult {
  const findings: ScanFinding[] = [];
  const bodyScripts = $("body script").toArray();

  const nonAllowed = bodyScripts.filter((el) => {
    const src = $(el).attr("src") || $(el).html() || "";
    return !isGtmScript(src) && !isJsonLd($(el)) && !isFrameworkScript($(el), src) && src.trim().length > 0;
  });

  for (const el of nonAllowed) {
    const src = $(el).attr("src") || $(el).html()?.slice(0, 100) || "";
    findings.push({
      element: `<script src="${src}">`,
      detail: "Script found in <body>. Should be managed through GTM.",
      severity: "warning",
    });
  }

  return {
    checkKey: "A2",
    status: findings.length === 0 ? "ok" : "issue",
    findings,
    summary: findings.length === 0
      ? "No hardcoded scripts in body/footer"
      : `${findings.length} script(s) found outside <head>`,
  };
}

function checkB1($: cheerio.CheerioAPI, html: string): CheckResult {
  const findings: ScanFinding[] = [];
  const allScripts = getScriptSources($);

  for (const script of allScripts) {
    for (const tracker of KNOWN_TRACKING_SCRIPTS) {
      if (tracker.pattern.test(script.src)) {
        findings.push({
          element: script.outerHtml.slice(0, 200),
          detail: `${tracker.name} loaded directly (${script.location}). Should be inside GTM.`,
          severity: "error",
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
    for (const ghost of GHOST_SCRIPTS) {
      if (ghost.pattern.test(script.src)) {
        findings.push({
          element: script.outerHtml.slice(0, 200),
          detail: `${ghost.name} script detected (${script.location}). Verify if still in use.`,
          severity: "warning",
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
        findings.push({
          element: `<script> ${pixel.name}`,
          detail: `${pixel.name} placed directly in <head> instead of GTM`,
          severity: "error",
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
      });
    }

    if (/player\.vimeo\.com/i.test(src)) {
      findings.push({
        element: `<iframe src="${src.slice(0, 100)}">`,
        detail: "Vimeo embed found. Must block until consent or use click-to-load.",
        severity: "warning",
      });
    }
  });

  return {
    checkKey: "E1",
    status: findings.length === 0 ? "ok" : "issue",
    findings,
    summary: findings.length === 0
      ? "No problematic video embeds found"
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
      });
    }
    if (/api\.mapbox\.com/i.test(src)) {
      findings.push({
        element: `<iframe src="${src.slice(0, 100)}">`,
        detail: "Mapbox embed found. Block until consent or use static image.",
        severity: "warning",
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
      });
    }
  }

  return {
    checkKey: "E3",
    status: findings.length === 0 ? "ok" : "issue",
    findings,
    summary: findings.length === 0
      ? "No unblocked map embeds found"
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
        });
      }
    }
  }

  return {
    checkKey: "E4",
    status: findings.length === 0 ? "ok" : "issue",
    findings,
    summary: findings.length === 0
      ? "No ungated chat widgets found"
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
      });
    }
  });

  return {
    checkKey: "E5",
    status: findings.length === 0 ? "ok" : "issue",
    findings,
    summary: findings.length === 0
      ? "No ungated social embeds found"
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
    });
  });

  return {
    checkKey: "F1",
    status: "ok",
    findings,
    summary: findings.length === 0
      ? "No forms found on this page"
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

function checkG1($: cheerio.CheerioAPI, html: string): CheckResult {
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

  findings.push({
    element: "page",
    detail: "No consent management script detected. Consent banner will not appear.",
    severity: "error",
  });
  return { checkKey: "G1", status: "issue", findings, summary: "No consent banner/CMP detected" };
}

function checkG8($: cheerio.CheerioAPI, html: string): CheckResult {
  const findings: ScanFinding[] = [];

  const hasCookiebotWidget = /CookiebotWidget|CookieConsent\.renew|Cookiebot\.renew/i.test(html);
  const hasConsentLink = $("a").toArray().some((a) => {
    const href = $(a).attr("href") || "";
    const text = $(a).text() || "";
    const onclick = $(a).attr("onclick") || "";
    return /cookie.*settings|consent.*settings|manage.*cookies|cookie.*preferences|hantera.*kakor|cookie-?settings/i.test(text)
      || /cookie.*settings|consent.*settings/i.test(href)
      || /CookieConsent\.renew|Cookiebot\.renew/i.test(onclick);
  });
  const hasConsentButton = $("button").toArray().some((btn) => {
    const text = $(btn).text() || "";
    const onclick = $(btn).attr("onclick") || "";
    return /cookie.*settings|manage.*cookies|consent.*settings|hantera.*kakor/i.test(text)
      || /CookieConsent\.renew|Cookiebot\.renew/i.test(onclick);
  });

  if (hasCookiebotWidget) {
    findings.push({
      element: "CookiebotWidget",
      detail: "Cookiebot persistent consent widget detected",
      severity: "info",
    });
    return { checkKey: "G8", status: "ok", findings, summary: "Consent withdrawal widget found" };
  }

  if (hasConsentLink || hasConsentButton) {
    findings.push({
      element: "consent link/button",
      detail: "Consent management link or button found on page",
      severity: "info",
    });
    return { checkKey: "G8", status: "ok", findings, summary: "Consent settings link found" };
  }

  findings.push({
    element: "page",
    detail: "No persistent consent widget, link, or button found. Users must be able to withdraw consent at any time.",
    severity: "error",
  });
  return { checkKey: "G8", status: "issue", findings, summary: "No consent withdrawal mechanism found" };
}

function checkB5($: cheerio.CheerioAPI, html: string): CheckResult {
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

  findings.push({
    element: "page",
    detail: "No Google Consent Mode V2 configuration detected. Check GTM Cookiebot template settings.",
    severity: "info",
  });
  return { checkKey: "B5", status: "na", findings, summary: "Cannot determine Consent Mode V2 from HTML alone - verify in GTM" };
}

function detectGtmId($: cheerio.CheerioAPI, html: string): string | null {
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

function detectCookiebotId($: cheerio.CheerioAPI): string | null {
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
