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
