const API_BASE = "https://api.webflow.com/v2";

function getToken(): string | null {
  return process.env.WEBFLOW_API_TOKEN || null;
}

export function isWebflowConfigured(): boolean {
  return !!getToken();
}

async function webflowFetch(path: string, options?: RequestInit) {
  const token = getToken();
  if (!token) throw new Error("WEBFLOW_API_TOKEN not configured");

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (res.status === 429) {
      if (attempt === 1) throw new Error("Webflow API rate limited - wait a few minutes and try again");
      const retryAfter = Math.min(parseInt(res.headers.get("retry-after") || "5", 10), 10);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Webflow API ${res.status}: ${body}`);
    }

    return res.json();
  }

  throw new Error("Webflow API rate limited - wait a few minutes and try again");
}

export async function getCustomCode(siteId: string): Promise<{
  headCode: string;
  footerCode: string;
}> {
  const data = await webflowFetch(`/sites/${siteId}/custom_code`);
  return {
    headCode: data.headCode || "",
    footerCode: data.footerCode || "",
  };
}

export async function updateCustomCode(
  siteId: string,
  headCode: string,
  footerCode: string
): Promise<void> {
  await webflowFetch(`/sites/${siteId}/custom_code`, {
    method: "PUT",
    body: JSON.stringify({ headCode, footerCode }),
  });
}

export async function getRegisteredScripts(siteId: string): Promise<
  { id: string; displayName: string; sourceCode: string; location: string }[]
> {
  const data = await webflowFetch(`/sites/${siteId}/registered_scripts`);
  return data.registeredScripts || [];
}

export async function getSiteInfo(siteId: string): Promise<{
  id: string;
  displayName: string;
  shortName: string;
  defaultDomain: string;
}> {
  return webflowFetch(`/sites/${siteId}`);
}

export interface WebflowSite {
  id: string;
  displayName: string;
  shortName: string;
  defaultDomain: string;
  customDomains?: Array<{ url: string }>;
}

export async function listAllSites(): Promise<WebflowSite[]> {
  const sites: WebflowSite[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    console.log(`[Webflow API] Fetching sites page offset=${offset}`);
    const data = await webflowFetch(`/sites?offset=${offset}&limit=${limit}`);
    const batch = data.sites || data;
    if (!Array.isArray(batch) || batch.length === 0) break;
    sites.push(...batch);
    console.log(`[Webflow API] Got ${batch.length} sites (total: ${sites.length})`);
    if (batch.length < limit) break;
    offset += limit;
  }

  return sites;
}

export async function findWebflowSiteByDomain(domain: string): Promise<WebflowSite | null> {
  const sites = await listAllSites();
  const normalizedDomain = domain.replace(/^www\./, "").toLowerCase();

  for (const site of sites) {
    if (site.defaultDomain?.toLowerCase().includes(normalizedDomain)) return site;
    if (site.customDomains?.some((d) => d.url.replace(/^www\./, "").toLowerCase().includes(normalizedDomain))) return site;
    if (site.shortName?.toLowerCase() === normalizedDomain.split(".")[0]) return site;
  }

  return null;
}
