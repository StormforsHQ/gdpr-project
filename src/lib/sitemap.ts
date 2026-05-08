import { normalizeUrl } from "@/lib/url";

const PRIORITY_PATTERNS = [
  /contact/i,
  /about/i,
  /newsletter/i,
  /signup|sign-up/i,
  /register/i,
  /location/i,
  /form/i,
  /kontakt/i,
  /om-oss/i,
  /anmalan|anmälan/i,
];

const MAX_PAGES = 20;

export async function fetchSitemapUrls(siteUrl: string): Promise<string[]> {
  const base = normalizeUrl(siteUrl);
  const origin = new URL(base).origin;
  const sitemapUrl = `${origin}/sitemap.xml`;

  try {
    const res = await fetch(sitemapUrl, {
      headers: { "User-Agent": "StormforsGDPRAudit/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [base];

    const actualOrigin = new URL(res.url).origin;
    const allowedOrigins = new Set([origin, actualOrigin]);

    const xml = await res.text();
    const urls = extractUrls(xml, allowedOrigins);

    if (urls.length === 0) return [base];

    if (!urls.includes(base)) {
      urls.unshift(base);
    }

    return prioritizeAndCap(urls, base);
  } catch {
    return [base];
  }
}

function extractUrls(xml: string, allowedOrigins: Set<string>): string[] {
  const urls: string[] = [];
  const locRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
  let match;

  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1].trim();
    try {
      const urlOrigin = new URL(url).origin;
      if (allowedOrigins.has(urlOrigin)) {
        urls.push(url);
      }
    } catch {
      // skip malformed URLs
    }
  }

  return [...new Set(urls)];
}

function prioritizeAndCap(urls: string[], homepage: string): string[] {
  const priority: string[] = [homepage];
  const rest: string[] = [];

  for (const url of urls) {
    if (url === homepage) continue;
    const path = new URL(url).pathname;
    if (PRIORITY_PATTERNS.some((p) => p.test(path))) {
      priority.push(url);
    } else {
      rest.push(url);
    }
  }

  return [...priority, ...rest].slice(0, MAX_PAGES);
}
