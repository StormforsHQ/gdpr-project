export function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!normalized.startsWith("http")) normalized = "https://" + normalized;
  normalized = normalized.replace(/\/+$/, "");
  return normalized;
}

export function isValidUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  return /^(https?:\/\/)?[\w.-]+\.\w{2,}/.test(trimmed);
}
