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
    return parsed.hostname.includes(".") && parsed.hostname.split(".").pop()!.length >= 2;
  } catch {
    return false;
  }
}
