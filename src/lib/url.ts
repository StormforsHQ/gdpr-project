export function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!normalized.startsWith("http")) normalized = "https://" + normalized;
  normalized = normalized.replace(/\/+$/, "");
  return normalized;
}

export function isValidUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    const parts = parsed.hostname.split(".");
    const domainParts = parts[0] === "www" ? parts.slice(1) : parts;
    if (domainParts.length < 2) return false;
    if (domainParts.some((p) => !p)) return false;
    const tld = domainParts[domainParts.length - 1];
    return /^[a-z]{2,}$/i.test(tld);
  } catch {
    return false;
  }
}
