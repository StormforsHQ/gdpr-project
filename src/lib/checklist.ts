export type CheckStatus = "not_checked" | "ok" | "issue" | "na";

export interface Check {
  key: string;
  label: string;
  description: string;
}

export interface CheckCategory {
  id: string;
  label: string;
  checks: Check[];
}

export const CHECKLIST: CheckCategory[] = [
  {
    id: "A",
    label: "Script setup",
    checks: [
      { key: "A1", label: "Only GTM script in site header", description: "No other scripts hardcoded (Cookiebot deploys via GTM)" },
      { key: "A2", label: "No scripts hardcoded in footer", description: "Everything managed through GTM" },
      { key: "A3", label: "Cookiebot CMP tag on correct trigger", description: 'Must be "Consent Initialization - All Pages" (NOT "All Pages")' },
      { key: "A4", label: "Official Cookiebot GTM template used", description: "Not Custom HTML (Custom HTML misses V2 consent fields)" },
      { key: "A5", label: "AutoBlock is OFF", description: "Breaks Advanced Consent Mode cookieless pings" },
    ],
  },
  {
    id: "B",
    label: "GTM configuration",
    checks: [
      { key: "B1", label: "All tracking scripts inside GTM", description: "Nothing running outside GTM except the GTM snippet itself" },
      { key: "B2", label: "Google tags: consent overview set", description: '"No additional consent required" (they self-adapt)' },
      { key: "B3", label: "Non-Google tags: consent gated", description: '"Require additional consent" + correct type (ad_storage/analytics_storage)' },
      { key: "B4", label: "Non-Google tag triggers correct", description: 'Using cookie_consent_update event, not "All Pages"' },
      { key: "B5", label: "Google Consent Mode V2 enabled", description: "Checkbox in Cookiebot CMP template. All 4 parameters transmitting." },
    ],
  },
  {
    id: "C",
    label: "Cookie categories",
    checks: [
      { key: "C1", label: "Necessary cookies identified", description: "CDN (Webflow, Cloudflare), session, security - no consent needed" },
      { key: "C2", label: "Statistics cookies under consent", description: "Google Analytics, HotJar, etc. - require opt-in" },
      { key: "C3", label: "Marketing cookies under consent", description: "LinkedIn Pixel, Meta Pixel, ad trackers - require opt-in" },
      { key: "C4", label: "Preference cookies under consent", description: "Language, UI customization - if applicable" },
      { key: "C5", label: "No unclassified cookies", description: "All cookies categorized in Cookiebot admin" },
    ],
  },
  {
    id: "D",
    label: "Legacy/cleanup",
    checks: [
      { key: "D1", label: "No ghost scripts", description: "Leftover scripts from discontinued services (HotJar, Leadfeeder, etc.)" },
      { key: "D2", label: "No old campaign scripts", description: "Old Salesforce/marketing campaigns. Ask client before removing." },
      { key: "D3", label: "No orphaned pixels", description: "Pixels placed directly in header instead of GTM" },
    ],
  },
  {
    id: "E",
    label: "Third-party services",
    checks: [
      { key: "E1", label: "Video embeds audited", description: "YouTube (use youtube-nocookie.com), Vimeo - block until consent or click-to-load" },
      { key: "E2", label: "Google Fonts self-hosted", description: "NOT loaded from Google CDN (EUR 100/violation precedent). Use local files or Fontsource." },
      { key: "E3", label: "Maps blocked until consent", description: "Google Maps, Mapbox, etc. Or use static image with link." },
      { key: "E4", label: "Chat widgets checked", description: "If non-essential cookies: consent before loading" },
      { key: "E5", label: "Social embeds checked", description: "Social feeds, share buttons, etc." },
      { key: "E6", label: "CRM integrations reviewed", description: "HubSpot, Salesforce - DPA in place, data transfer mechanism verified" },
    ],
  },
  {
    id: "F",
    label: "Forms & data collection",
    checks: [
      { key: "F1", label: "All forms identified", description: "List every form on the site" },
      { key: "F2", label: "Data minimization", description: "Only collecting what's needed for stated purpose" },
      { key: "F3", label: "Privacy policy linked at/near form", description: "User informed at point of collection" },
      { key: "F4", label: "Separate consent per purpose", description: "Inquiry vs marketing = separate checkboxes, no pre-ticking" },
      { key: "F5", label: "Form submissions encrypted", description: "SSL/TLS on form POST" },
    ],
  },
  {
    id: "G",
    label: "Consent banner",
    checks: [
      { key: "G1", label: "Banner appears on first visit", description: "Consent dialog visible and functional" },
      { key: "G2", label: "Accept and Reject equally prominent", description: "Same size, same visual weight, same number of clicks" },
      { key: "G3", label: "Granular category controls available", description: "User can accept/reject per category" },
      { key: "G4", label: "Declining actually blocks scripts", description: "Non-necessary scripts don't fire after decline (verify in DevTools)" },
      { key: "G5", label: "Consent remembered on return", description: "CookieConsent cookie persists, no re-prompt" },
      { key: "G6", label: "Banner in correct language(s)", description: "Matches site content language(s). Cookiebot multi-language configured." },
      { key: "G7", label: "No dark patterns", description: "No pre-ticked boxes, no cookie walls, no guilt language, no hidden reject" },
    ],
  },
  {
    id: "H",
    label: "Verification",
    checks: [
      { key: "H1", label: "Cookiebot compliance scan run", description: "Run scanner, document result, no unclassified cookies" },
      { key: "H2", label: "Cookiebot GCM Check run", description: "Google Consent Mode Checker in Cookiebot admin" },
      { key: "H3", label: "GTM Preview Mode test: decline all", description: 'Consent tab shows Denied, non-Google tags under "Not Fired"' },
      { key: "H4", label: "GTM Preview Mode test: accept all", description: "All tags fire, Consent tab shows Granted" },
      { key: "H5", label: "GTM Preview Mode test: selective", description: "Accept Statistics only, verify Marketing tags don't fire" },
      { key: "H6", label: "Cookie tab check in DevTools", description: "Before consent: only CookieConsent. After decline: no tracking cookies." },
    ],
  },
  {
    id: "I",
    label: "Privacy documentation",
    checks: [
      { key: "I1", label: "Privacy Policy complete (Art. 13/14)", description: "Controller ID, purposes, legal basis, rights, transfers, retention periods" },
      { key: "I2", label: "Privacy Policy in site language(s)", description: "Available in every language the site content uses" },
      { key: "I3", label: "Cookie Policy exists (separate page)", description: "Lists all cookies, purpose, duration, vendor. Cookie Declaration script installed." },
      { key: "I4", label: "Privacy Policy linked from every page", description: "Typically in footer" },
      { key: "I5", label: "Script inventory documented", description: "All scripts and their purposes documented internally" },
    ],
  },
  {
    id: "J",
    label: "Data processing & legal",
    checks: [
      { key: "J1", label: "DPAs in place for all processors", description: "Analytics, CRM, email, hosting, CDN, payment, any SaaS with personal data" },
      { key: "J2", label: "Vendor inventory maintained", description: "List of all third parties, what data they process, DPA status" },
      { key: "J3", label: "US services DPF-certified", description: "Check dataprivacyframework.gov for each US-based vendor" },
      { key: "J4", label: "Data subject rights process exists", description: "DSAR handling procedure documented, 30-day response capability" },
      { key: "J5", label: "Data breach response plan exists", description: "72-hour notification procedure, breach register maintained" },
    ],
  },
  {
    id: "K",
    label: "Geo-targeting",
    checks: [
      { key: "K1", label: "EU/EEA visitors get opt-in banner", description: "Full blocking consent banner" },
      { key: "K2", label: "US visitors get appropriate notice", description: 'Opt-out model, "Do Not Sell/Share" link if California' },
      { key: "K3", label: "UK visitors handled correctly", description: "Marketing consent required, analytics can load (post-DUAA Feb 2026)" },
    ],
  },
];

export const STATUS_CONFIG: Record<CheckStatus, { label: string; color: string }> = {
  not_checked: { label: "Not checked", color: "text-muted-foreground" },
  ok: { label: "OK", color: "text-green-500" },
  issue: { label: "Issue", color: "text-destructive" },
  na: { label: "N/A", color: "text-muted-foreground" },
};
