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

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Webflow API ${res.status}: ${body}`);
  }

  return res.json();
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
    const data = await webflowFetch(`/sites?offset=${offset}&limit=${limit}`);
    const batch = data.sites || data;
    if (!Array.isArray(batch) || batch.length === 0) break;
    sites.push(...batch);
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
