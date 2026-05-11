export type CheckStatus = "not_checked" | "ok" | "issue" | "na" | "blocked" | "client_managed";

export type AutomationType =
  | "page-scan"
  | "browser-test"
  | "browser-manual"
  | "ai-agent"
  | "gtm-api"
  | "cookiebot-api"
  | "webflow-api"
  | "human";

export interface LegalReference {
  label: string;
  url: string;
}

export type AuditTier = "basic" | "full";

export type CoverageType = "sla" | "no-sla" | "us-based" | "unknown";

export const COVERAGE_TYPES: Record<CoverageType, { label: string; description: string; className: string }> = {
  sla: {
    label: "SLA client",
    description: "We manage their Cookiebot and GDPR compliance",
    className: "bg-green-500/15 text-green-600 dark:text-green-400",
  },
  "no-sla": {
    label: "Non-SLA client",
    description: "EU-based but manages their own GDPR compliance",
    className: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  },
  "us-based": {
    label: "US-based",
    description: "GDPR does not apply - US privacy laws may apply",
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  unknown: {
    label: "Unknown",
    description: "Coverage type not yet determined",
    className: "bg-muted text-muted-foreground",
  },
};

const SLA_ESSENTIAL_CHECKS = new Set([
  "A1", "A3", "A5",
  "B3", "B5",
  "E1", "E2",
  "F3", "F4", "F5",
  "G1", "G2", "G3", "G6", "G7", "G8",
  "H2",
  "I2", "I4",
]);

const NO_SLA_ESSENTIAL_CHECKS = new Set([
  "E1", "E2",
  "F3", "F5",
  "I2", "I4",
  "J1", "J3",
]);

const US_BASED_ESSENTIAL_CHECKS = new Set([
  "A1",
  "D3",
  "E1", "E2",
  "F3", "F4", "F5",
  "I1", "I2", "I4",
  "J1", "J3",
  "K2", "K4",
]);

export function getEssentialChecks(coverageType: CoverageType): Set<string> {
  switch (coverageType) {
    case "sla": return SLA_ESSENTIAL_CHECKS;
    case "no-sla": return NO_SLA_ESSENTIAL_CHECKS;
    case "us-based": return US_BASED_ESSENTIAL_CHECKS;
    case "unknown": return new Set(CHECKLIST.flatMap((c) => c.checks.map((ch) => ch.key)));
  }
}

export type CheckResponsibility = "agency" | "client" | "content-author";

export interface Check {
  key: string;
  label: string;
  description: string;
  automation: AutomationType;
  tier: AuditTier;
  responsibility?: CheckResponsibility;
  legalBasis?: string;
  references?: LegalReference[];
  imyNote?: string;
  imyReferences?: LegalReference[];
  manualHint?: string;
}

export interface CheckCategory {
  id: string;
  label: string;
  checks: Check[];
}

export const AUTOMATION_CONFIG: Record<AutomationType, { label: string; className: string }> = {
  "page-scan": { label: "Auto", className: "bg-green-500/15 text-green-600 dark:text-green-400" },
  "browser-test": { label: "Browser", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  "browser-manual": { label: "Browser", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  "ai-agent": { label: "AI", className: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
  "gtm-api": { label: "GTM API", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  "cookiebot-api": { label: "Cookiebot", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  "webflow-api": { label: "Webflow", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  "human": { label: "Manual", className: "bg-slate-500/15 text-slate-600 dark:text-slate-400" },
};

export const RESPONSIBILITY_CONFIG: Record<CheckResponsibility, { label: string; className: string; description: string }> = {
  agency: { label: "Agency", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400", description: "Technical implementation - the web agency's responsibility" },
  client: { label: "Client", className: "bg-orange-500/15 text-orange-600 dark:text-orange-400", description: "The client's responsibility as data controller. Our job is to make them aware and document their answer." },
  "content-author": { label: "Content", className: "bg-violet-500/15 text-violet-600 dark:text-violet-400", description: "Responsibility of whoever writes the content (usually the client or their legal team). We check it, but the content is not ours to write." },
};

export const CHECKLIST: CheckCategory[] = [
  {
    id: "pre",
    label: "Pre-check",
    checks: [
      {
        key: "H2", label: "Cookiebot GCM Check passed", description: "Run the Google Consent Mode Checker inside the Cookiebot admin panel. If all checks pass, the consent-to-GTM pipeline is working correctly. This is the single most important verification step for SLA clients.", automation: "human", tier: "basic",
        manualHint: "Log into admin.cookiebot.com > select the site from the dropdown > Analytics tab > on the Consent Analytics tab, scroll down to User Consent Logging > click 'View more' > scroll down and click 'Start GCM check'. The checker tests that all Google Consent Mode V2 signals (ad_storage, analytics_storage, ad_user_data, ad_personalization) are correctly transmitted from Cookiebot through GTM. If all parameters show green: mark this check as OK. If any are red: the issue is usually a missing 'additional consent' setting on a tag in GTM, or Cookiebot not being set as an initialization tag. Check the GTM tag that failed and add the correct consent parameters.",
        legalBasis: "Confirms that your Consent Mode setup actually works - that Google receives the right consent signals when visitors accept or decline.",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
        ],
      },
    ],
  },
  {
    id: "A",
    label: "Script setup",
    checks: [
      {
        key: "A1", label: "Only GTM script in site header", description: "The only script in the site header should be Google Tag Manager. All other scripts (analytics, marketing, consent) should be loaded through GTM so they respect consent settings.", automation: "page-scan", tier: "basic",
        legalBasis: "Scripts outside GTM can fire before consent is given, which violates EU cookie consent rules. Swedish DPA (IMY) fined pharmacies SEK 45M for this exact issue.",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "GDPR Art. 25 - Data protection by design", url: "https://gdpr-info.eu/art-25-gdpr/" },
          { label: "EDPB Guidelines 05/2020 on consent", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
          { label: "CJEU C-673/17 Planet49 (prior consent)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
        ],
        imyNote: "IMY fined Apoteket SEK 37M and Apohem SEK 8M (Jan 2025) for Meta Pixel loading outside consent management - scripts in header transferred health data to Meta without valid consent. Hardcoded scripts bypass consent controls entirely.",
        imyReferences: [
          { label: "IMY - Apoteket/Apohem Meta Pixel decision (Jan 2025)", url: "https://www.imy.se/en/news/administrative-fines-against-apoteket-and-apohem-for-transferring-personal-data-to-meta/" },
        ],
      },
      {
        key: "A2", label: "No scripts hardcoded in footer", description: "Footer scripts (analytics, chat widgets, pixels) should also be managed through GTM, not placed directly in the site footer code.", automation: "page-scan", tier: "full",
        legalBasis: "Same as header scripts - anything outside GTM bypasses consent controls and can track visitors without permission.",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "EDPB Guidelines 4/2019 on Art. 25", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-42019-article-25-data-protection-design-and_en" },
        ],
      },
      {
        key: "A3", label: "Cookiebot CMP tag on correct trigger", description: "Cookiebot must load before everything else on the page. In GTM, it needs to be on the 'Consent Initialization' trigger - not 'All Pages' - so visitors see the consent banner before any tracking starts.", automation: "gtm-api", tier: "basic",
        legalBasis: "EU law requires consent before any tracking. If Cookiebot loads too late, other scripts may fire first and track visitors without permission.",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "CJEU C-673/17 Planet49 (consent must precede data collection)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
          { label: "EDPB Cookie Banner Taskforce Report 2023", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/other/report-work-undertaken-cookie-banner-taskforce_en" },
        ],
      },
      {
        key: "A4", label: "Official Cookiebot GTM template used", description: "Cookiebot should be set up using the official GTM template from the Template Gallery, not as a custom HTML tag. The official template includes Google Consent Mode V2 support that custom HTML misses.", automation: "gtm-api", tier: "full",
        legalBasis: "The official template ensures consent signals are sent correctly to Google services. Custom HTML setups often miss important consent fields.",
        references: [
          { label: "GDPR Art. 25 - Data protection by design", url: "https://gdpr-info.eu/art-25-gdpr/" },
          { label: "GDPR Art. 5(2) - Accountability", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
      },
      {
        key: "A5", label: "AutoBlock is OFF", description: "AutoBlock is a Cookiebot setting that tries to block scripts automatically. It should be OFF because it interferes with Google's Consent Mode, which needs to send anonymous pings even before consent.", automation: "gtm-api", tier: "basic",
        legalBasis: "AutoBlock can accidentally block the anonymous data collection that Google Consent Mode uses, breaking analytics setup even though no personal data is involved.",
        references: [
          { label: "EDPB Guidelines 05/2020 on consent", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
          { label: "GDPR Art. 25 - Data protection by design", url: "https://gdpr-info.eu/art-25-gdpr/" },
        ],
      },
    ],
  },
  {
    id: "B",
    label: "GTM configuration",
    checks: [
      {
        key: "B1", label: "All tracking scripts inside GTM", description: "Every tracking script (analytics, pixels, marketing tools) should be managed inside GTM. The only script running directly on the page should be the GTM snippet itself.", automation: "page-scan", tier: "basic",
        legalBasis: "Scripts outside GTM bypass consent controls completely. IMY fined Swedish pharmacies SEK 45M because Meta Pixel ran outside GTM and sent health data to Meta without consent.",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "GDPR Art. 5(2) - Accountability", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
        imyNote: "IMY's Apoteket/Apohem case (Jan 2025, SEK 45M total) showed that tracking scripts running outside GTM bypass consent controls entirely. The pharmacy sites had Meta Pixel loading directly, transferring health-related purchase data to Meta without consent.",
        imyReferences: [
          { label: "IMY - Apoteket/Apohem decision (Jan 2025)", url: "https://www.imy.se/en/news/administrative-fines-against-apoteket-and-apohem-for-transferring-personal-data-to-meta/" },
        ],
      },
      {
        key: "B2", label: "Google tags: consent overview set", description: "Google's own tags (GA4, Google Ads, etc.) automatically adapt to consent state - they send less data when consent is denied. Their Consent Overview should be set to 'No additional consent required' so they aren't blocked unnecessarily.", automation: "gtm-api", tier: "full",
        legalBasis: "Google tags already respect consent signals. Adding extra consent requirements on top can block them entirely, losing even the anonymous data you're allowed to collect.",
        references: [
          { label: "EDPB Guidelines 05/2020 on consent (granularity)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
        ],
      },
      {
        key: "B3", label: "Non-Google tags: consent gated", description: "Third-party tags (LinkedIn Pixel, HotJar, etc.) must wait for visitor consent before firing. In GTM, each tag needs 'Require additional consent' turned on with the right consent type (e.g. ad_storage for marketing, analytics_storage for analytics).", automation: "gtm-api", tier: "basic",
        legalBasis: "Non-Google tags don't automatically respect consent. Without consent gating, they fire immediately and track visitors who haven't agreed to it.",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "CJEU C-673/17 Planet49", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
        ],
      },
      {
        key: "B4", label: "Non-Google tag triggers correct", description: "Non-Google tags should fire on a consent-aware trigger (like a custom event that fires after consent is given), not on 'All Pages'. The 'All Pages' trigger fires on every page load regardless of consent.", automation: "gtm-api", tier: "full",
        legalBasis: "Tags on the 'All Pages' trigger fire before the visitor has a chance to accept or decline cookies, which violates consent requirements.",
        references: [
          { label: "EDPB Guidelines 05/2020 on consent", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
          { label: "GDPR Art. 25 - Data protection by design", url: "https://gdpr-info.eu/art-25-gdpr/" },
        ],
      },
      {
        key: "B5", label: "Google Consent Mode V2 enabled", description: "Google Consent Mode V2 tells Google services whether a visitor has given consent. It must be enabled in the Cookiebot GTM template and all 4 consent signals (ad_storage, analytics_storage, ad_user_data, ad_personalization) should be transmitting.", automation: "page-scan", tier: "basic",
        legalBasis: "Without Consent Mode V2, Google services don't know the visitor's consent choice and may collect data they shouldn't, or block data collection entirely.",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "EDPB Guidelines 05/2020 on consent", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
        ],
      },
    ],
  },
  {
    id: "C",
    label: "Cookie categories",
    checks: [
      {
        key: "C1", label: "Necessary cookies identified", description: "Cookies the site needs to function (session, security, CDN cookies from Webflow or Cloudflare). These don't need visitor consent because the site can't work without them.", automation: "cookiebot-api", tier: "full",
        legalBasis: "EU law exempts 'strictly necessary' cookies from consent. But they must genuinely be essential - not just convenient.",
        references: [
          { label: "ePrivacy Directive Art. 5(3) - strictly necessary exemption", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "EDPB Cookie Banner Taskforce Report 2023", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/other/report-work-undertaken-cookie-banner-taskforce_en" },
        ],
      },
      {
        key: "C2", label: "Statistics cookies under consent", description: "Analytics cookies (Google Analytics, HotJar, etc.) must be listed in the 'Statistics' category in Cookiebot. In the EU, visitors must actively agree before these cookies are set.", automation: "cookiebot-api", tier: "basic",
        legalBasis: "EU rules require opt-in consent for analytics cookies. They are not 'necessary' - the site works without them. UK rules are slightly more relaxed for pure analytics since 2025.",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "CJEU C-673/17 Planet49 (consent per purpose)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
          { label: "UK DUAA 2025 - PECR cookie exceptions", url: "https://www.legislation.gov.uk/ukpga/2025/18/part/5" },
          { label: "ICO - What are the exceptions?", url: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/" },
        ],
      },
      {
        key: "C3", label: "Marketing cookies under consent", description: "Ad tracking cookies (LinkedIn Pixel, Meta Pixel, Google Ads, etc.) must be listed in the 'Marketing' category in Cookiebot. These always require visitor consent before they can be set.", automation: "cookiebot-api", tier: "basic",
        legalBasis: "Marketing cookies track visitors across websites for ad targeting. This is the most privacy-sensitive category and always requires explicit consent in the EU.",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "EDPB Guidelines 8/2020 on social media targeting", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-82020-targeting-social-media-users_en" },
          { label: "CJEU C-673/17 Planet49", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
        ],
      },
      {
        key: "C4", label: "Preference cookies under consent", description: "Cookies that remember visitor preferences (language choice, UI settings). If the site uses these, they should be in the 'Preferences' category in Cookiebot and require consent.", automation: "cookiebot-api", tier: "full",
        legalBasis: "Preference cookies are not strictly necessary for the site to work, so they need consent in the EU. UK rules allow some functionality cookies without consent since 2025.",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "UK DUAA 2025 - PECR cookie exceptions", url: "https://www.legislation.gov.uk/ukpga/2025/18/part/5" },
        ],
      },
      {
        key: "C5", label: "No unclassified cookies", description: "Every cookie on the site must be sorted into a category (necessary, statistics, marketing, or preferences) in the Cookiebot admin. Unclassified cookies mean visitors can't make an informed consent choice.", automation: "cookiebot-api", tier: "basic",
        legalBasis: "Visitors must know what each cookie does before they can give valid consent. Unclassified cookies make consent meaningless.",
        references: [
          { label: "GDPR Art. 5(2) - Accountability", url: "https://gdpr-info.eu/art-5-gdpr/" },
          { label: "GDPR Art. 30 - Records of processing", url: "https://gdpr-info.eu/art-30-gdpr/" },
        ],
      },
      {
        key: "C6", label: "Cookie lifetimes proportionate", description: "Cookies should not last longer than necessary. The recommended maximum is 13 months. Check expiry dates in Cookiebot or browser DevTools.", automation: "human", tier: "full",
        manualHint: "Open the site in Chrome > DevTools > Application > Cookies. Check the 'Expires' column for each cookie. Anything over 13 months is too long. Also check the Cookiebot admin cookie report if available.",
        legalBasis: "Data privacy rules say you shouldn't keep data longer than needed. A marketing cookie lasting 10 years is disproportionate. 13 months is the widely accepted maximum.",
        references: [
          { label: "GDPR Art. 5(1)(c) - Data minimization", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
      },
    ],
  },
  {
    id: "D",
    label: "Legacy/cleanup",
    checks: [
      {
        key: "D1", label: "No ghost scripts", description: "Old scripts from services the site no longer uses (cancelled HotJar, old Leadfeeder, etc.) that are still loading. These waste bandwidth and may still send visitor data to services nobody monitors.", automation: "page-scan", tier: "full",
        legalBasis: "Sending visitor data to services you no longer use has no legitimate purpose. You can't justify tracking that serves nobody.",
        references: [
          { label: "GDPR Art. 5(1)(c) - Data minimization", url: "https://gdpr-info.eu/art-5-gdpr/" },
          { label: "GDPR Art. 25 - Data protection by design and by default", url: "https://gdpr-info.eu/art-25-gdpr/" },
        ],
      },
      {
        key: "D2", label: "No old campaign scripts", description: "Scripts left over from past marketing campaigns (old Salesforce tracking, expired promotions, etc.). Check with the client before removing - some may still be needed.", automation: "human", tier: "full",
        manualHint: "Open Google Tag Manager > Tags. Look for tags named after specific campaigns, dates, or promotions that are likely finished. Also check the site source code for scripts referencing specific campaign URLs or IDs. Ask the client before removing anything.",
        legalBasis: "Data collection must have a clear, current purpose. Scripts from finished campaigns no longer have one.",
        references: [
          { label: "GDPR Art. 5(1)(b) - Purpose limitation", url: "https://gdpr-info.eu/art-5-gdpr/" },
          { label: "EDPB Guidelines 05/2020 on consent (purpose-specific)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
        ],
      },
      {
        key: "D3", label: "No orphaned pixels", description: "Tracking pixels (Meta Pixel, LinkedIn Insight Tag, etc.) placed directly in the page HTML instead of through GTM. These run without any consent check.", automation: "page-scan", tier: "basic",
        legalBasis: "Pixels outside GTM track visitors immediately, bypassing consent. IMY fined Swedish pharmacies SEK 45M specifically for orphaned Meta Pixels sending health data without consent.",
        references: [
          { label: "GDPR Art. 5 - Principles", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
        imyNote: "Orphaned Meta/Facebook pixels were the direct cause of the Apoteket/Apohem fines (SEK 45M total, Jan 2025). Pixels placed directly in the header bypass consent management and transfer personal data (including potentially sensitive data) to third parties without legal basis.",
        imyReferences: [
          { label: "IMY - Apoteket/Apohem decision (Jan 2025)", url: "https://www.imy.se/en/news/administrative-fines-against-apoteket-and-apohem-for-transferring-personal-data-to-meta/" },
        ],
      },
    ],
  },
  {
    id: "E",
    label: "Third-party services",
    checks: [
      {
        key: "E1", label: "Video embeds audited", description: "YouTube and Vimeo embeds set tracking cookies and send visitor IP addresses to US servers on page load. Use youtube-nocookie.com for YouTube, and consider blocking all video embeds until the visitor gives consent.", automation: "page-scan", tier: "basic",
        legalBasis: "Video embeds transfer visitor data to third parties (often in the US) before consent. They must be blocked or use privacy-friendly alternatives.",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "LG Munchen - Google Fonts ruling (same transfer principle)", url: "https://gdprhub.eu/index.php?title=LG_M%C3%BCnchen_-_3_O_17493/20" },
        ],
      },
      {
        key: "E2", label: "Google Fonts self-hosted", description: "Fonts must be hosted on the site itself, not loaded from Google's servers. Loading from Google sends every visitor's IP address to Google on every page view. A German court set a EUR 100/visitor fine precedent for this.", automation: "page-scan", tier: "basic",
        legalBasis: "Loading fonts from Google transfers visitor IP to the US without consent or legal justification. Courts have fined websites for this. Self-hosting fonts eliminates the issue entirely.",
        references: [
          { label: "LG Munchen I, 3 O 17493/20 (Google Fonts ruling, Jan 2022)", url: "https://gdprhub.eu/index.php?title=LG_M%C3%BCnchen_-_3_O_17493/20" },
          { label: "GDPR Art. 44-46 - International transfers", url: "https://gdpr-info.eu/art-44-gdpr/" },
          { label: "EDPB Guidelines 4/2019 on Art. 25 (self-hosting as design measure)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-42019-article-25-data-protection-design-and_en" },
        ],
        imyNote: "IMY ordered Tele2, CDON, Coop, and Dagens Industri to stop using Google Analytics (Jun 2023) specifically for US data transfers. The same principle applies to Google Fonts - visitor IP addresses are transferred to Google (US) on every page load without consent or legal basis.",
        imyReferences: [
          { label: "IMY - Google Analytics decisions (Jun 2023)", url: "https://www.imy.se/en/news/four-companies-must-stop-using-google-analytics/" },
        ],
      },
      {
        key: "E3", label: "Maps blocked until consent", description: "Google Maps and similar embeds send visitor IP to third-party servers on load. Block them until consent, or replace with a static map image that links to Google Maps.", automation: "page-scan", tier: "full",
        legalBasis: "Same principle as video embeds and fonts - loading third-party content transfers visitor data without consent.",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "LG Munchen - Google Fonts ruling (same transfer principle)", url: "https://gdprhub.eu/index.php?title=LG_M%C3%BCnchen_-_3_O_17493/20" },
        ],
        imyNote: "Same transfer principle as Google Analytics/Fonts. IMY's 2023 Google Analytics decisions established that transferring visitor IP to US services (Google) requires valid legal basis. Google Maps embeds transfer IP on load.",
        imyReferences: [
          { label: "IMY - Google Analytics decisions (Jun 2023)", url: "https://www.imy.se/en/news/four-companies-must-stop-using-google-analytics/" },
        ],
      },
      {
        key: "E4", label: "Chat widgets checked", description: "Chat widgets (Intercom, Drift, HubSpot chat, etc.) often set tracking cookies and send data to third parties. If they use non-essential cookies, they need consent before loading.", automation: "page-scan", tier: "full",
        legalBasis: "Chat widgets that track visitors need consent like any other tracking tool. The chat provider is also a data processor and needs a data processing agreement.",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "EDPB Guidelines 07/2020 on controller/processor", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-072020-concepts-controller-and-processor-gdpr_en" },
        ],
      },
      {
        key: "E5", label: "Social embeds checked", description: "Embedded social media content (Instagram feeds, Twitter timelines, Facebook like buttons, share buttons) loads scripts from those platforms and tracks visitors. Consider blocking until consent or using static alternatives.", automation: "page-scan", tier: "full",
        legalBasis: "Social embeds let platforms like Meta and X track visitors on your site, even if they don't click anything. This requires consent.",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "EDPB Guidelines 8/2020 on social media targeting", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-82020-targeting-social-media-users_en" },
        ],
      },
      {
        key: "E6", label: "CRM integrations reviewed", description: "CRM systems (HubSpot, Salesforce, etc.) that receive form data or track visitors need a signed Data Processing Agreement (DPA). If the CRM is US-based, verify they have a valid data transfer mechanism.", automation: "human", tier: "full",
        manualHint: "Ask the client which CRM they use. Check if a DPA is signed (HubSpot: Account > Privacy; Salesforce: DPA addendum in contract). For US-based CRMs, verify DPF certification at dataprivacyframework.gov/list.",
        legalBasis: "Any service that handles personal data on your behalf needs a DPA. Sending data to US services also needs a legal transfer mechanism (like the EU-US Data Privacy Framework).",
        references: [
          { label: "GDPR Art. 28 - Processor", url: "https://gdpr-info.eu/art-28-gdpr/" },
          { label: "GDPR Art. 44-46 - International transfers", url: "https://gdpr-info.eu/art-44-gdpr/" },
          { label: "CJEU C-311/18 Schrems II (transfer mechanisms)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-311/18_-_Schrems_II" },
          { label: "EDPB Guidelines 07/2020 on controller/processor", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-072020-concepts-controller-and-processor-gdpr_en" },
        ],
      },
    ],
  },
  {
    id: "F",
    label: "Forms & data collection",
    checks: [
      {
        key: "F1", label: "All forms identified", description: "Find and list every form on the site (contact forms, newsletter signups, quote requests, login forms, etc.). Each one collects personal data and needs to be reviewed.", automation: "page-scan", tier: "full",
        legalBasis: "You need to know what personal data you collect and where. Forms are the most common collection point on websites.",
        references: [
          { label: "GDPR Art. 30 - Records of processing", url: "https://gdpr-info.eu/art-30-gdpr/" },
          { label: "WP260 rev.01 - Transparency guidelines", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/article-29-working-party-guidelines-transparency-under-regulation_en" },
        ],
      },
      {
        key: "F2", label: "Data minimization", description: "Forms should only ask for what's actually needed. A newsletter signup doesn't need a phone number. A contact form doesn't need a date of birth. Remove unnecessary fields.", automation: "ai-agent", tier: "full",
        legalBasis: "GDPR says you may only collect data that's necessary for the stated purpose. Collecting 'nice to have' data violates this principle.",
        references: [
          { label: "GDPR Art. 5(1)(c) - Data minimization", url: "https://gdpr-info.eu/art-5-gdpr/" },
          { label: "GDPR Art. 25(2) - Data protection by default", url: "https://gdpr-info.eu/art-25-gdpr/" },
          { label: "EDPB Guidelines 4/2019 on Art. 25", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-42019-article-25-data-protection-design-and_en" },
        ],
        imyNote: "For Swedish sites: personnummer (personal identity numbers) have extra protection under dataskyddslagen (2018:218). They may only be collected with consent or when 'clearly justified'. See check F6 for details. Also: Sweden sets children's consent age at 13 (not 16) - if forms may be used by minors, this affects data collection requirements.",
      },
      {
        key: "F3", label: "Privacy policy linked at/near form", description: "Every form that collects personal data should have a visible link to the privacy policy near the submit button. Visitors must know how their data will be used before they submit.", automation: "page-scan", tier: "basic",
        legalBasis: "GDPR requires that visitors are informed about data processing at the point where their data is collected - not buried on a separate page.",
        references: [
          { label: "GDPR Art. 13 - Information at point of collection", url: "https://gdpr-info.eu/art-13-gdpr/" },
          { label: "GDPR Art. 12 - Transparent communication", url: "https://gdpr-info.eu/art-12-gdpr/" },
          { label: "WP260 rev.01 - Transparency guidelines", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/article-29-working-party-guidelines-transparency-under-regulation_en" },
        ],
      },
      {
        key: "F4", label: "Separate consent per purpose", description: "If a form is used for both an inquiry and marketing emails, these need separate checkboxes. The marketing checkbox must not be pre-ticked. Visitors must actively opt in to each purpose.", automation: "ai-agent", tier: "basic",
        legalBasis: "Consent must be specific to each purpose. Bundling 'contact us' with 'subscribe to newsletter' in one action is not valid consent for the newsletter.",
        references: [
          { label: "GDPR Art. 7 - Conditions for consent", url: "https://gdpr-info.eu/art-7-gdpr/" },
          { label: "GDPR Recital 32 - Active consent required", url: "https://gdpr-info.eu/recitals/no-32/" },
          { label: "CJEU C-673/17 Planet49 (pre-ticked boxes invalid)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
          { label: "EDPB Guidelines 05/2020 on consent (granular, unbundled)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
        ],
      },
      {
        key: "F5", label: "Form submissions encrypted", description: "Form data must be sent over HTTPS (encrypted connection). Check that the form action URL starts with https:// and that the site has a valid SSL certificate.", automation: "page-scan", tier: "basic",
        legalBasis: "Personal data sent over an unencrypted connection can be intercepted. GDPR requires appropriate security measures, and encryption is a basic one.",
        references: [
          { label: "GDPR Art. 32 - Security of processing", url: "https://gdpr-info.eu/art-32-gdpr/" },
          { label: "GDPR Art. 5(1)(f) - Integrity and confidentiality", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
        imyNote: "IMY fined the Equality Ombudsman (Diskrimineringsombudsmannen) SEK 100K (May 2025) for collecting personal data via a web form without adequate security measures. Even public authorities are fined for web form security failures.",
        imyReferences: [
          { label: "IMY - Equality Ombudsman web form decision (May 2025)", url: "https://www.imy.se/en/news/administrative-fine-against-the-discrimination-ombudsman-when-personal-data-was-collection-via-a-web-form/" },
        ],
      },
      {
        key: "F6", label: "Personnummer collection justified (SE)", description: "Swedish personal identity numbers (personnummer) have extra legal protection. Only collect them in web forms if absolutely necessary and clearly justified. Most website forms do not need them.", automation: "ai-agent", tier: "full",
        legalBasis: "Swedish law adds extra restrictions on personnummer beyond normal GDPR rules. Collection must be 'clearly justified' - a higher bar than general data minimization.",
        references: [
          { label: "Dataskyddslagen (2018:218) - English translation", url: "https://www.government.se/government-policy/the-constitution-of-sweden-and-personal-privacy/act-containing-supplementary-provisions-to-the-eu-sfs-2018218-general-data-protection-regulation/" },
          { label: "GDPR Art. 5(1)(c) - Data minimization", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
        imyNote: "This is a Sweden-specific requirement with no EU equivalent. The dataskyddslagen restricts personnummer processing beyond standard GDPR data minimization. Personnummer are not 'sensitive data' under Art. 9, but Sweden adds extra protection. Collection must be 'clearly justified' (klart motiverat) - a higher bar than general data minimization.",
        imyReferences: [
          { label: "White & Case - GDPR Sweden implementation guide", url: "https://www.whitecase.com/insight-our-thinking/gdpr-guide-national-implementation-sweden" },
        ],
      },
    ],
  },
  {
    id: "G",
    label: "Consent banner",
    checks: [
      {
        key: "G1", label: "Banner appears on first visit", description: "The cookie consent banner must appear when a visitor first arrives on the site. It should be clearly visible and functional (buttons work, categories load).", automation: "page-scan", tier: "basic",
        legalBasis: "Visitors must be asked for consent before any non-essential cookies are set. No banner means no consent, which means all tracking is unlawful.",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "CJEU C-673/17 Planet49 (consent must precede processing)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
          { label: "EDPB Cookie Banner Taskforce Report 2023", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/other/report-work-undertaken-cookie-banner-taskforce_en" },
        ],
        imyNote: "In all three April 2025 cookie banner cases (Aller Media, ATG, Warner Music), IMY found cookies were placed before valid consent was obtained. Swedish implementation via LEK (2022:482) requires consent before any non-essential cookies/tracking.",
        imyReferences: [
          { label: "IMY - Cookie banner decisions (Apr 2025)", url: "https://www.imy.se/nyheter/imy-riktar-kritik-mot-foretags-kakbanners/" },
        ],
      },
      {
        key: "G2", label: "Accept and Reject equally prominent", description: "The 'Accept' and 'Reject/Decline' buttons must be equally visible - same size, same visual weight, same number of clicks to reach. Hiding or de-emphasizing 'Reject' is a dark pattern.", automation: "ai-agent", tier: "basic",
        legalBasis: "Consent must be freely given. If rejecting is harder than accepting, the consent is not truly free. IMY reprimanded three Swedish companies in 2025 for exactly this.",
        references: [
          { label: "GDPR Art. 7 - Conditions for consent", url: "https://gdpr-info.eu/art-7-gdpr/" },
          { label: "EDPB Cookie Banner Taskforce Report 2023 (reject must be on same layer)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/other/report-work-undertaken-cookie-banner-taskforce_en" },
          { label: "CJEU C-673/17 Planet49", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
        ],
        imyNote: "IMY reprimanded Aller Media, ATG, and Warner Music Sweden (Apr 2025) specifically for this violation. ATG had no reject option on the first layer - users had to click into settings to decline. IMY requires accept and reject to be equally visible on the first layer with the same number of clicks.",
        imyReferences: [
          { label: "IMY - Cookie banner decisions (Apr 2025)", url: "https://www.imy.se/nyheter/imy-riktar-kritik-mot-foretags-kakbanners/" },
          { label: "IMY - ATG decision PDF", url: "https://www.imy.se/globalassets/dokument/beslut/2025/tillsynsbeslut-aktiebolaget-trav-och-galopp.pdf" },
        ],
      },
      {
        key: "G3", label: "Granular category controls available", description: "Visitors must be able to choose which cookie categories to accept (e.g. accept statistics but decline marketing). An all-or-nothing choice is not valid consent.", automation: "cookiebot-api", tier: "basic",
        legalBasis: "Consent must be specific to each purpose. Visitors need the option to accept some categories while declining others.",
        references: [
          { label: "GDPR Art. 7 - Conditions for consent", url: "https://gdpr-info.eu/art-7-gdpr/" },
          { label: "EDPB Guidelines 05/2020 on consent (granularity)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
          { label: "CJEU C-673/17 Planet49 (specific consent per purpose)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
        ],
      },
      {
        key: "G4", label: "Declining actually blocks scripts", description: "When a visitor clicks 'Decline' or 'Reject all', non-essential scripts (analytics, marketing) must actually stop. Verify in browser DevTools that no tracking scripts fire after declining.", automation: "browser-manual", tier: "basic",
        manualHint: "Open the site in an incognito window. Open DevTools > Network tab. Click 'Decline' or 'Reject all' on the consent banner. Check: are there still requests to google-analytics.com, facebook.net, linkedin, hotjar, etc.? Also check DevTools > Application > Cookies - no analytics/marketing cookies should appear after declining.",
        legalBasis: "A decline button that doesn't actually block tracking is worse than no button at all - it gives visitors a false sense of control.",
        references: [
          { label: "GDPR Art. 7(3) - Withdrawal of consent", url: "https://gdpr-info.eu/art-7-gdpr/" },
          { label: "EDPB Guidelines 05/2020 on consent (effective withdrawal)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
        ],
      },
      {
        key: "G5", label: "Consent remembered on return", description: "When a visitor returns to the site, their previous consent choice should be remembered. The banner should not appear again on every visit - that's annoying and undermines trust.", automation: "browser-manual", tier: "basic",
        manualHint: "Open the site in a normal browser window (not incognito). Make a consent choice (accept or decline). Close the tab, then open the site again. The banner should NOT reappear - your previous choice should be remembered via the CookieConsent cookie.",
        legalBasis: "The site must be able to prove that consent was given. Storing the consent choice in a cookie is the standard way to do this.",
        references: [
          { label: "GDPR Art. 7(1) - Demonstrating consent", url: "https://gdpr-info.eu/art-7-gdpr/" },
          { label: "GDPR Art. 5(2) - Accountability", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
      },
      {
        key: "G6", label: "Banner in correct language(s)", description: "The consent banner must be in the same language as the site content. A Swedish site needs a Swedish banner. Cookiebot supports multiple languages - make sure the right ones are configured.", automation: "ai-agent", tier: "basic",
        legalBasis: "Consent information must be in clear, plain language the visitor understands. An English banner on a Swedish site fails this requirement.",
        references: [
          { label: "GDPR Art. 12 - Transparent communication", url: "https://gdpr-info.eu/art-12-gdpr/" },
          { label: "WP260 rev.01 - Transparency guidelines (language of audience)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/article-29-working-party-guidelines-transparency-under-regulation_en" },
        ],
        imyNote: "For Swedish-language sites: the consent banner must be in Swedish. An English-only banner on a Swedish site fails the 'clear and plain language' requirement. Cookiebot supports Swedish (sv) - ensure it is configured.",
      },
      {
        key: "G7", label: "No dark patterns", description: "The consent banner must not use manipulative design: no pre-ticked boxes, no cookie walls that block content, no guilt-tripping language ('You'll miss out!'), no hidden reject button, no 'pay or accept cookies' without a free alternative.", automation: "ai-agent", tier: "basic",
        legalBasis: "Dark patterns make consent invalid because the visitor was manipulated, not freely choosing. This is now an active enforcement area - IMY issued its first cookie banner fines in 2025.",
        references: [
          { label: "EDPB Cookie Banner Taskforce Report 2023 (8 dark pattern violations)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/other/report-work-undertaken-cookie-banner-taskforce_en" },
          { label: "CJEU C-673/17 Planet49 (pre-ticked boxes invalid)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
          { label: "GDPR Art. 7 - Conditions for consent", url: "https://gdpr-info.eu/art-7-gdpr/" },
        ],
        imyNote: "IMY's April 2025 cookie banner enforcement (Aller Media, ATG, Warner Music) specifically targeted dark patterns: pre-ticked checkboxes, hidden reject options, misleading banner designs, and cookies placed before valid consent. These were IMY's first-ever cookie banner decisions, signaling this is now an active enforcement area.",
        imyReferences: [
          { label: "IMY - Cookie banner decisions (Apr 2025)", url: "https://www.imy.se/nyheter/imy-riktar-kritik-mot-foretags-kakbanners/" },
          { label: "IMY - Aller Media decision PDF", url: "https://www.imy.se/globalassets/dokument/beslut/2025/tillsynsbeslut-aller-media-ab.pdf" },
          { label: "IMY - Warner Music decision PDF", url: "https://www.imy.se/globalassets/dokument/beslut/2025/tillsynsbeslut-warner-music-sweden-ab.pdf" },
        ],
      },
      {
        key: "G8", label: "Consent withdrawal accessible at all times", description: "Visitors must be able to change their consent choice at any time. This is usually done via a small floating widget or a 'Cookie settings' link in the footer that reopens the consent banner.", automation: "page-scan", tier: "basic",
        legalBasis: "Withdrawing consent must be as easy as giving it. If accepting takes one click, changing your mind should also take one click.",
        references: [
          { label: "GDPR Art. 7(3) - Withdrawal of consent", url: "https://gdpr-info.eu/art-7-gdpr/" },
          { label: "EDPB Guidelines 05/2020 on consent", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
        ],
      },
      {
        key: "G9", label: "Consent renewal period configured", description: "The consent banner should re-appear after a set period (max 12 months, 6 months for French visitors) so visitors can reconsider their choice. It should also re-appear if the cookie policy changes.", automation: "human", tier: "full",
        manualHint: "Log into Cookiebot admin > Settings > Banner. Check the 'Consent renewal' setting. It should be 12 months or less (6 months if the site has French visitors). Also check that 'Renew on policy change' is enabled.",
        legalBasis: "Consent is not forever. Visitors should periodically be reminded of their choice and given the option to change it.",
        references: [
          { label: "GDPR Art. 5(2) - Accountability", url: "https://gdpr-info.eu/art-5-gdpr/" },
          { label: "EDPB Guidelines 05/2020 on consent", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
        ],
      },
    ],
  },
  {
    id: "H",
    label: "Verification",
    checks: [
      {
        key: "H1", label: "Cookiebot compliance scan run", description: "Run a full scan in the Cookiebot admin panel and save the results. This checks that all cookies are detected and properly categorized.", automation: "human", tier: "full",
        manualHint: "Log into admin.cookiebot.com > select the domain > Compliance. Click 'Start scan'. Wait for it to finish (can take a few minutes). Review the results - look for uncategorized or miscategorized cookies.",
        legalBasis: "You need documented proof that you've checked your cookie setup. The scan report serves as evidence of due diligence.",
        references: [
          { label: "GDPR Art. 5(2) - Accountability", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
      },
      {
        key: "H3", label: "GTM Preview Mode test: decline all", description: "Open GTM Preview Mode, decline all cookies, and verify: the Consent tab should show 'Denied' for all types, and non-Google tags should appear under 'Not Fired'.", automation: "human", tier: "full",
        manualHint: "Open tagmanager.google.com > select the container > click Preview (top right). Enter the site URL. On the site, click 'Decline all'. In the GTM debugger: check the Tags tab (marketing/analytics tags should say 'Not Fired') and the Consent tab (all types should show 'Denied').",
        legalBasis: "The most important test - proves that declining cookies actually prevents tracking. If tags still fire after declining, your setup is broken.",
        references: [
          { label: "GDPR Art. 25 - Data protection by design", url: "https://gdpr-info.eu/art-25-gdpr/" },
        ],
      },
      {
        key: "H4", label: "GTM Preview Mode test: accept all", description: "Open GTM Preview Mode, accept all cookies, and verify: all tags should fire and the Consent tab should show 'Granted' for all types.", automation: "human", tier: "full",
        manualHint: "Open tagmanager.google.com > select the container > click Preview. Enter the site URL. On the site, click 'Accept all'. In the GTM debugger: check the Tags tab (all tags should say 'Fired') and the Consent tab (all types should show 'Granted').",
        legalBasis: "Verifies the other side - that accepting cookies actually enables tracking. If tags don't fire after accepting, your analytics and marketing tools won't collect data.",
        references: [
          { label: "GDPR Art. 25 - Data protection by design", url: "https://gdpr-info.eu/art-25-gdpr/" },
        ],
      },
      {
        key: "H5", label: "GTM Preview Mode test: selective", description: "Accept only Statistics cookies (decline Marketing), then verify in GTM Preview that marketing tags (LinkedIn Pixel, Meta Pixel, etc.) did NOT fire while analytics tags did.", automation: "human", tier: "full",
        manualHint: "Open GTM Preview Mode. On the site, accept only Statistics (decline Marketing). In the GTM debugger: analytics tags (GA4) should say 'Fired', but marketing tags (Meta Pixel, LinkedIn, etc.) should say 'Not Fired'. This confirms consent categories actually control which tags run.",
        legalBasis: "Tests that granular consent actually works - accepting one category should not enable another.",
        references: [
          { label: "GDPR Art. 7 - Conditions for consent", url: "https://gdpr-info.eu/art-7-gdpr/" },
          { label: "EDPB Guidelines 05/2020 on consent (granularity)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
        ],
      },
      {
        key: "H6", label: "Cookie tab check in DevTools", description: "Open browser DevTools > Application > Cookies. Before any consent choice: only the CookieConsent cookie should exist. After declining: no analytics or marketing cookies should appear.", automation: "browser-manual", tier: "full",
        manualHint: "Open the site in incognito. Open DevTools > Application > Cookies (left sidebar). Before making any consent choice: only CookieConsent should exist. Click 'Decline all', reload, and check again - you should NOT see _ga, _gid, _fbp, _hjSession, or similar tracking cookies.",
        legalBasis: "The ultimate proof that consent works - if tracking cookies appear before or after declining consent, something is broken regardless of what GTM Preview shows.",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
        ],
      },
      {
        key: "H7", label: "Consent records stored and auditable", description: "Cookiebot's consent log must be enabled. It records when each visitor consented, what they accepted/declined, and which banner version they saw. Keep these records for at least 5 years.", automation: "human", tier: "basic",
        manualHint: "Log into admin.cookiebot.com > select the domain > Consent log. Verify that logging is enabled and that consent records are being stored. If the log is empty or disabled, enable it in Settings. This is required for demonstrating GDPR compliance.",
        legalBasis: "If a data protection authority investigates, you must prove that each visitor actually consented. Without consent records, you have no evidence.",
        references: [
          { label: "GDPR Art. 7(1) - Demonstrating consent", url: "https://gdpr-info.eu/art-7-gdpr/" },
          { label: "GDPR Art. 5(2) - Accountability", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
        imyNote: "IMY's cookie banner enforcement (Apr 2025) underscores the need for demonstrable consent. If IMY investigates, you must be able to show that consent was validly obtained for each user. Cookiebot's consent log should be enabled and retention set appropriately.",
        imyReferences: [
          { label: "IMY - Cookie banner decisions (Apr 2025)", url: "https://www.imy.se/nyheter/imy-riktar-kritik-mot-foretags-kakbanners/" },
        ],
      },
      {
        key: "H8", label: "Non-cookie tracking checked", description: "Tracking isn't limited to cookies. Check localStorage, sessionStorage, and IndexedDB in browser DevTools for tracking data. Also check for fingerprinting scripts. The same consent rules apply to all of these.", automation: "browser-manual", tier: "full",
        manualHint: "Open the site in incognito. Open DevTools > Application. Check Local Storage, Session Storage, and IndexedDB (left sidebar) for tracking data from analytics or marketing tools. These are subject to the same consent rules as cookies.",
        legalBasis: "EU consent rules apply to ALL data stored on the visitor's device, not just cookies. localStorage tracking without consent is just as illegal as cookie tracking without consent.",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "ICO - Storage and access technologies guidance", url: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/" },
        ],
      },
    ],
  },
  {
    id: "I",
    label: "Privacy documentation",
    checks: [
      {
        key: "I1", label: "Privacy Policy complete", description: "The privacy policy must include: who is responsible for the site (company name, contact), what data is collected, why, who it's shared with, how long it's kept, visitor rights (access, delete, object), how to withdraw consent, and how to complain to a data protection authority.", automation: "ai-agent", tier: "basic", responsibility: "content-author",
        legalBasis: "GDPR lists specific information that must be provided to visitors. Missing any of these items is a violation - IMY fined Klarna SEK 7.5M and Spotify SEK 58M for incomplete privacy notices.",
        references: [
          { label: "GDPR Art. 13 - Information at point of collection", url: "https://gdpr-info.eu/art-13-gdpr/" },
          { label: "GDPR Art. 14 - Information not obtained from data subject", url: "https://gdpr-info.eu/art-14-gdpr/" },
          { label: "WP260 rev.01 - Transparency guidelines (13 mandatory items)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/article-29-working-party-guidelines-transparency-under-regulation_en" },
          { label: "CCPA 1798.100 - Privacy policy requirements (US)", url: "https://oag.ca.gov/privacy/ccpa" },
        ],
        imyNote: "IMY fined Klarna SEK 7.5M (Mar 2022) and Spotify SEK 58M (Jun 2023) for insufficient transparency in privacy notices. Both failed to provide clear enough information about how personal data was processed. For Swedish clients: the privacy policy should mention IMY as the supervisory authority (not just a generic 'DPA') and include IMY's contact details.",
        imyReferences: [
          { label: "IMY - Klarna privacy notice fine (Mar 2022)", url: "https://www.imy.se/en/about-us/arkiv/nyhetsarkiv/administrative-fine-against-klarna-after-investigation/" },
          { label: "IMY - Spotify transparency fine (Jun 2023)", url: "https://www.edpb.europa.eu/news/national-news/2023/imy-issues-administrative-fine-against-spotify-shortcomings-regarding_en" },
        ],
      },
      {
        key: "I2", label: "Privacy Policy in site language(s)", description: "The privacy policy must be available in every language the site uses. A Swedish site needs a Swedish privacy policy. An English-only policy on a Swedish site is not compliant.", automation: "ai-agent", tier: "basic", responsibility: "content-author",
        legalBasis: "Privacy information must be in a language the visitor understands. Using only English on a non-English site fails the transparency requirement.",
        references: [
          { label: "GDPR Art. 12 - Transparent communication", url: "https://gdpr-info.eu/art-12-gdpr/" },
          { label: "WP260 rev.01 - Transparency guidelines (language of audience)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/article-29-working-party-guidelines-transparency-under-regulation_en" },
        ],
      },
      {
        key: "I3", label: "Cookie Policy exists (separate page)", description: "A dedicated cookie policy page that lists every cookie: its name, purpose, how long it lasts, and which service sets it. Cookiebot can auto-generate this via the Cookie Declaration script.", automation: "page-scan", tier: "full",
        legalBasis: "Visitors must be able to see exactly which cookies are used and why, so they can make an informed consent decision.",
        references: [
          { label: "CJEU C-673/17 Planet49 (cookie duration and function must be disclosed)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
          { label: "GDPR Art. 13 - Information at point of collection", url: "https://gdpr-info.eu/art-13-gdpr/" },
        ],
      },
      {
        key: "I4", label: "Privacy Policy linked from every page", description: "A link to the privacy policy should be in the site footer so it's accessible from every page. Visitors should never have to search for it.", automation: "page-scan", tier: "basic",
        legalBasis: "Privacy information must be easily accessible. A footer link on every page is the standard way to achieve this.",
        references: [
          { label: "GDPR Art. 12 - Transparent communication", url: "https://gdpr-info.eu/art-12-gdpr/" },
          { label: "WP260 rev.01 - Transparency guidelines (easily accessible)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/article-29-working-party-guidelines-transparency-under-regulation_en" },
        ],
      },
      {
        key: "I5", label: "Script inventory documented", description: "Keep an internal document listing every script on the site, what it does, and why it's there. This is for your own records - not published on the site.", automation: "human", tier: "full",
        manualHint: "Create a spreadsheet listing every script on the site. Columns: script name, vendor, purpose, consent category, DPA status. Use the B1 scan results and GTM tag list as a starting point. This is an internal document, not for the client's site.",
        legalBasis: "You need to be able to account for every piece of tracking on your site. If a data protection authority asks, you should be able to show this list immediately.",
        references: [
          { label: "GDPR Art. 30 - Records of processing", url: "https://gdpr-info.eu/art-30-gdpr/" },
          { label: "GDPR Art. 5(2) - Accountability", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
      },
      {
        key: "I6", label: "Automated decision-making disclosed (if applicable)", description: "If the site uses AI or automated systems that make decisions affecting people (e.g. automated loan approvals, content filtering), the privacy policy must explain how it works and the visitor's right to human review. Not applicable to most marketing websites.", automation: "human", tier: "full", responsibility: "content-author",
        manualHint: "Ask the client: does this site or any connected service use automated decision-making that affects people (e.g. credit scoring, automated hiring, content filtering)? If no, mark as N/A. If yes, check that the privacy policy explains the logic and the right to human review.",
        legalBasis: "People have a right to know when decisions about them are made by machines, and to request a human review.",
        references: [
          { label: "GDPR Art. 22 - Automated decision-making", url: "https://gdpr-info.eu/art-22-gdpr/" },
          { label: "GDPR Art. 13(2)(f) - Disclosure requirement", url: "https://gdpr-info.eu/art-13-gdpr/" },
        ],
      },
      {
        key: "I7", label: "DPO contact in privacy policy (if applicable)", description: "If the organization has a Data Protection Officer (required for public authorities and companies doing large-scale monitoring or handling sensitive data), their contact details must be in the privacy policy.", automation: "human", tier: "full", responsibility: "content-author",
        manualHint: "Ask the client: do they have a Data Protection Officer (DPO)? Required if they are a public authority or do large-scale monitoring/sensitive data processing. If yes, check the privacy policy includes the DPO's contact details. If no DPO exists and none is required, mark as N/A.",
        legalBasis: "If a DPO is required and appointed, visitors must be able to contact them. If a DPO is required but not appointed, that's a separate compliance issue to flag.",
        references: [
          { label: "GDPR Art. 37 - Designation of DPO", url: "https://gdpr-info.eu/art-37-gdpr/" },
          { label: "GDPR Art. 13(1)(b) - DPO contact disclosure", url: "https://gdpr-info.eu/art-13-gdpr/" },
        ],
      },
      {
        key: "I8", label: "Privacy information accessible and layered", description: "Privacy policies should be written in clear, plain language - not legal jargon. Long policies should use a layered approach: a short summary at the top with links to detailed sections. Easy to scan with clear headings.", automation: "ai-agent", tier: "full", responsibility: "content-author",
        legalBasis: "A privacy policy nobody can understand is the same as no privacy policy. Both Klarna and Spotify were fined by IMY partly for dense, unreadable privacy notices.",
        references: [
          { label: "GDPR Art. 12 - Transparent communication", url: "https://gdpr-info.eu/art-12-gdpr/" },
          { label: "WP260 rev.01 - Transparency guidelines (layered approach)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/article-29-working-party-guidelines-transparency-under-regulation_en" },
        ],
        imyNote: "Both the Klarna (SEK 7.5M) and Spotify (SEK 58M) IMY decisions cited readability and accessibility failures. For Swedish sites: privacy policy must be available in Swedish if the site targets Swedish visitors. Dense legal text without plain-language summaries is a documented IMY concern.",
        imyReferences: [
          { label: "IMY - Klarna decision (Mar 2022)", url: "https://www.imy.se/en/about-us/arkiv/nyhetsarkiv/administrative-fine-against-klarna-after-investigation/" },
          { label: "IMY - Spotify decision (Jun 2023)", url: "https://www.edpb.europa.eu/news/national-news/2023/imy-issues-administrative-fine-against-spotify-shortcomings-regarding_en" },
        ],
      },
    ],
  },
  {
    id: "J",
    label: "Data processing & legal",
    checks: [
      {
        key: "J1", label: "DPAs in place for all processors", description: "Every third-party service that handles visitor or customer data (analytics, CRM, email tools, hosting, CDN, payment) must have a signed Data Processing Agreement (DPA). The scan detects which services the site uses and checks the DPA status for each one.", automation: "page-scan", tier: "basic",
        legalBasis: "GDPR requires a written agreement with every company that processes personal data on your behalf. Without a DPA, the data sharing has no legal basis.",
        references: [
          { label: "GDPR Art. 28 - Processor", url: "https://gdpr-info.eu/art-28-gdpr/" },
          { label: "EDPB Guidelines 07/2020 on controller/processor", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-072020-concepts-controller-and-processor-gdpr_en" },
        ],
      },
      {
        key: "J2", label: "Vendor inventory maintained", description: "Keep an up-to-date list of every third-party service used: what data they receive, where they store it, and whether a DPA is signed. Review this list at least annually.", automation: "human", tier: "full",
        manualHint: "Create or update a vendor spreadsheet. Columns: service name, data received, storage location (EU/US/other), DPA signed (yes/no/covered by ToS), DPF certified (yes/no). Use J1 and J3 scan results as a starting point for the list of detected services.",
        legalBasis: "You must be able to show exactly which companies handle your visitors' data. This is a core accountability requirement.",
        references: [
          { label: "GDPR Art. 30 - Records of processing", url: "https://gdpr-info.eu/art-30-gdpr/" },
          { label: "GDPR Art. 5(2) - Accountability", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
      },
      {
        key: "J3", label: "US services DPF-certified", description: "For every US-based service (Google, Meta, HubSpot, etc.), check if they're certified under the EU-US Data Privacy Framework. The scan detects US services and checks their DPF certification status automatically.", automation: "page-scan", tier: "basic",
        legalBasis: "Sending EU visitor data to US companies is only legal if there's a valid transfer mechanism. The EU-US Data Privacy Framework (since 2023) is the easiest one. IMY fined companies SEK 12M+ for US transfers without proper safeguards.",
        references: [
          { label: "GDPR Art. 44-46 - International transfers", url: "https://gdpr-info.eu/art-44-gdpr/" },
          { label: "EU-US Data Privacy Framework", url: "https://www.dataprivacyframework.gov/list" },
          { label: "CJEU C-311/18 Schrems II (transfer mechanisms)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-311/18_-_Schrems_II" },
          { label: "EU adequacy decisions overview", url: "https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en" },
        ],
        imyNote: "IMY fined Tele2 SEK 12M and CDON SEK 300K (Jun 2023) for Google Analytics data transfers to the US - this was pre-DPF. Post-DPF (Jul 2023), DPF-certified services have a valid transfer mechanism. But IMY's precedent shows they actively investigate transfer complaints. Verify each US vendor's DPF certification status.",
        imyReferences: [
          { label: "IMY - Google Analytics decisions (Jun 2023)", url: "https://www.imy.se/en/news/four-companies-must-stop-using-google-analytics/" },
          { label: "noyb - First major fine for Google Analytics (Tele2)", url: "https://noyb.eu/en/noyb-win-first-major-fine-eu-1-million-using-google-analytics" },
        ],
      },
      {
        key: "J4", label: "Data subject rights process exists", description: "There must be a documented process for handling requests from people who want to see, correct, or delete their data. You must be able to respond within 30 days.", automation: "human", tier: "full", responsibility: "client",
        manualHint: "Ask the client: what happens if someone emails asking to see or delete their data? Is there a documented process? Who handles it? Can they respond within 30 days? If no process exists, flag it as an issue and recommend they create one.",
        legalBasis: "People have the right to access, correct, and delete their personal data. If someone asks and you can't respond within 30 days, that's a violation.",
        references: [
          { label: "GDPR Art. 15 - Right of access", url: "https://gdpr-info.eu/art-15-gdpr/" },
          { label: "GDPR Art. 17 - Right to erasure", url: "https://gdpr-info.eu/art-17-gdpr/" },
          { label: "GDPR Art. 12 - Response timeline (1 month)", url: "https://gdpr-info.eu/art-12-gdpr/" },
          { label: "CCPA 1798.100-1798.125 - Consumer rights (US)", url: "https://oag.ca.gov/privacy/ccpa" },
        ],
        imyNote: "IMY fined Spotify SEK 58M (Jun 2023) partly for deficiencies in handling right of access requests (Art. 15). The information provided to users was not clear enough. IMY participates in coordinated EDPB enforcement on right of access - this is actively monitored.",
        imyReferences: [
          { label: "IMY - Spotify right of access decision (Jun 2023)", url: "https://www.edpb.europa.eu/news/national-news/2023/imy-issues-administrative-fine-against-spotify-shortcomings-regarding_en" },
        ],
      },
      {
        key: "J5", label: "Data breach response plan exists", description: "There must be a plan for what to do if personal data is leaked or stolen. The data protection authority must be notified within 72 hours. Affected individuals may also need to be told. Keep a log of all breaches.", automation: "human", tier: "full", responsibility: "client",
        manualHint: "Ask the client: do they have a data breach response plan? Key things it should cover: who to contact internally, how to notify the data protection authority within 72 hours, when to inform affected individuals, and a breach log. If no plan exists, flag it.",
        legalBasis: "A data breach without a response plan means slower notification, worse outcomes, and larger fines. IMY received 12,000+ breach reports in 2025 alone.",
        references: [
          { label: "GDPR Art. 33 - Notification to supervisory authority", url: "https://gdpr-info.eu/art-33-gdpr/" },
          { label: "GDPR Art. 34 - Communication to data subject", url: "https://gdpr-info.eu/art-34-gdpr/" },
          { label: "EDPB Guidelines 9/2022 on breach notification", url: "https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2022/guidelines-92022-personal-data-breach_en" },
        ],
        imyNote: "IMY received 12,276 breach reports in 2025 - an 89% increase from 2024. IMY fined Sportadmin SEK 6M (Jan 2026) for inadequate security measures leading to a breach affecting 2.1M individuals. Breach notification is filed via IMY's online form. For Swedish clients: the 72-hour clock runs to IMY specifically.",
        imyReferences: [
          { label: "IMY - Breach notification form", url: "https://www.imy.se/en/organisations/forms-and-e-services/notification-of-a-personal-data-breach/" },
          { label: "IMY - Sportadmin security breach fine (Jan 2026)", url: "https://www.imy.se/en/news/administrative-fine-against-sportadmin/" },
          { label: "IMY 2025 annual report - 89% breach increase", url: "https://www.dataguidance.com/news/sweden-imy-publishes-2025-annual-report" },
        ],
      },
      {
        key: "J6", label: "Records of Processing Activities (ROPA) exist", description: "The client must maintain a formal record of all personal data processing: what data, why, who receives it, how long it's kept, and what safeguards are in place. Must be available to the data protection authority if they ask.", automation: "human", tier: "full", responsibility: "client",
        manualHint: "Ask the client: do they have a Record of Processing Activities (ROPA)? This is a formal document required by GDPR Art. 30. It should list all personal data they process, why, who receives it, retention periods, and security measures. If they don't have one, the data from this audit can help them create it.",
        legalBasis: "ROPA is mandatory for most organizations. It's the master document that ties together everything else in your data protection setup.",
        references: [
          { label: "GDPR Art. 30 - Records of processing", url: "https://gdpr-info.eu/art-30-gdpr/" },
        ],
      },
      {
        key: "J7", label: "Sub-processor management in DPAs", description: "Your vendors often use their own sub-vendors (sub-processors). DPAs should include: advance notice when sub-processors change, your right to object, and that sub-processors follow the same data protection rules.", automation: "human", tier: "full",
        manualHint: "Review the DPAs for each vendor identified in J1. Check: does the DPA mention sub-processors? Does it require advance notice when sub-processors change? Does it give you the right to object? Most major vendors (Google, HubSpot, etc.) cover this in their standard DPA.",
        legalBasis: "You're responsible for the entire chain. If your vendor shares data with a sub-processor who mishandles it, you're still accountable.",
        references: [
          { label: "GDPR Art. 28 - Processor", url: "https://gdpr-info.eu/art-28-gdpr/" },
          { label: "EDPB Guidelines 07/2020 on controller/processor", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-072020-concepts-controller-and-processor-gdpr_en" },
        ],
      },
      {
        key: "J8", label: "Transfer Impact Assessments for non-DPF transfers", description: "For US vendors not on the Data Privacy Framework, or vendors in other non-EU countries: you need a Transfer Impact Assessment documenting the risks of sending data there. Not needed if all vendors are DPF-certified or in EU-approved countries.", automation: "human", tier: "full",
        manualHint: "Check J3 results first. If all US vendors are DPF-certified and no data goes to other non-EU countries, mark as N/A. Otherwise, for each uncertified vendor: document what data is transferred, the legal basis (usually SCCs), and the risks. Consider consulting legal if unsure.",
        legalBasis: "When there's no adequacy agreement (like the DPF), you must assess whether the destination country adequately protects personal data and what supplementary measures are needed.",
        references: [
          { label: "GDPR Art. 46 - Appropriate safeguards", url: "https://gdpr-info.eu/art-46-gdpr/" },
          { label: "CJEU C-311/18 Schrems II", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-311/18_-_Schrems_II" },
        ],
      },
      {
        key: "J9", label: "DPIA need assessed", description: "Check if the site's data processing requires a Data Protection Impact Assessment (DPIA). Triggers include: large-scale profiling, systematic monitoring of public areas, automated decision-making, handling sensitive data, or collecting children's data. Document your conclusion either way.", automation: "human", tier: "full",
        manualHint: "Ask: does this site do any of these? Large-scale profiling, systematic monitoring of public areas, automated decisions affecting people, processing sensitive data (health, ethnicity, etc.), or collecting children's data. If none apply, mark N/A and note why. If any apply, a formal DPIA is needed.",
        legalBasis: "High-risk data processing requires a formal risk assessment before you start. Even if a DPIA isn't needed, you should document why not.",
        references: [
          { label: "GDPR Art. 35 - DPIA", url: "https://gdpr-info.eu/art-35-gdpr/" },
          { label: "EDPB Guidelines on DPIA", url: "https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/obligations/when-data-protection-impact-assessment-dpia-required_en" },
        ],
        imyNote: "IMY's 2026 priorities include AI in the public sector and children's data protection. If the site uses AI features or targets children (note: Sweden sets consent age at 13, not the GDPR default of 16), a DPIA may be required. IMY actively monitors these areas.",
        imyReferences: [
          { label: "IMY 2026 priorities (AI, children, law enforcement)", url: "https://www.imy.se/en/news/imys-prioriteringar-2026--ai-barn-och-brottsbekampning/" },
          { label: "IMY - Children's rights on digital platforms report", url: "https://www.imy.se/globalassets/dokument/rapporter/the-rights-of-children-and-young-people-on-digital-platforms_accessible.pdf" },
        ],
      },
    ],
  },
  {
    id: "K",
    label: "Geo-targeting",
    checks: [
      {
        key: "K1", label: "EU/EEA visitors get opt-in banner", description: "Visitors from EU/EEA countries must see a full consent banner that blocks all non-essential cookies until they actively choose to accept. This is the strictest consent model.", automation: "browser-manual", tier: "basic",
        manualHint: "Open the site in an incognito window from an EU location (or use a VPN/browser extension set to an EU country). A full consent banner should appear that blocks all non-essential cookies until the visitor actively clicks 'Accept'. Check DevTools > Application > Cookies to confirm no tracking cookies exist before consent.",
        legalBasis: "EU rules require opt-in consent - nothing tracks until the visitor says yes. This applies to any website that targets EU visitors, even if the company is based elsewhere.",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "GDPR Art. 3 - Territorial scope", url: "https://gdpr-info.eu/art-3-gdpr/" },
          { label: "EDPB Guidelines 3/2018 on territorial scope", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-32018-territorial-scope-gdpr-article-3_en" },
        ],
      },
      {
        key: "K2", label: "US visitors get appropriate notice", description: "US visitors use an opt-out model (tracking can start, but visitors can say stop). The site needs a 'Do Not Sell/Share My Personal Information' link and must honor the Global Privacy Control (GPC) browser signal.", automation: "browser-manual", tier: "full",
        manualHint: "Use a VPN/browser extension set to a US location and open the site in incognito. Check: does the banner use opt-out language (not opt-in)? Is there a 'Do Not Sell/Share My Personal Information' link in the footer? In Cookiebot admin, check that geo-targeting is configured for US visitors.",
        legalBasis: "California (CCPA) and 20+ other US states require an opt-out option. GPC browser signals must be treated as a valid opt-out request.",
        references: [
          { label: "CCPA - California Consumer Privacy Act", url: "https://oag.ca.gov/privacy/ccpa" },
          { label: "CCPA 1798.120 - Right to opt out", url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.120.&lawCode=CIV" },
          { label: "Global Privacy Control (GPC)", url: "https://globalprivacycontrol.org/" },
          { label: "US state privacy law tracker - IAPP", url: "https://iapp.org/resources/article/us-state-privacy-legislation-tracker" },
        ],
      },
      {
        key: "K3", label: "UK visitors handled correctly", description: "UK rules differ from EU: marketing cookies still need opt-in, but analytics cookies can load without consent if they're only used for service improvement, visitors are informed, an opt-out is provided, and the analytics provider doesn't use the data for their own purposes (since Feb 2026).", automation: "browser-manual", tier: "full",
        manualHint: "Use a VPN set to UK and open the site in incognito. Marketing cookies should still require opt-in. Analytics cookies might load without consent if the site meets all 4 UK DUAA 2025 conditions. Check Cookiebot admin for UK-specific geo-targeting rules.",
        legalBasis: "The UK relaxed analytics cookie rules in 2025 but kept strict rules for marketing. If you serve UK visitors, your consent banner should reflect these different requirements.",
        references: [
          { label: "UK PECR - Cookie consent rules", url: "https://www.legislation.gov.uk/uksi/2003/2426" },
          { label: "UK DUAA 2025 Part 5 - PECR amendments", url: "https://www.legislation.gov.uk/ukpga/2025/18/part/5" },
          { label: "ICO - Storage and access technologies guidance", url: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/" },
          { label: "ICO - What are the PECR exceptions?", url: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/" },
          { label: "UK GDPR (retained EU law)", url: "https://www.legislation.gov.uk/eur/2016/679" },
        ],
      },
      {
        key: "K4", label: "GPC browser signal honored", description: "Some visitors have Global Privacy Control (GPC) enabled in their browser, which signals 'do not sell/share my data'. The site must detect and honor this signal. Required by law in 11+ US states. Test with the GPC browser extension.", automation: "browser-manual", tier: "full",
        manualHint: "Install the GPC browser extension (globalprivacycontrol.org). Open the site. The site should detect the GPC signal and automatically opt the visitor out of data sharing. In Cookiebot admin, check that GPC signal handling is enabled.",
        legalBasis: "California, Colorado, Texas, and 8+ other US states legally require websites to honor GPC signals as a valid opt-out of data sale/sharing.",
        references: [
          { label: "Global Privacy Control (GPC)", url: "https://globalprivacycontrol.org/" },
          { label: "CA Attorney General - GPC guidance", url: "https://oag.ca.gov/privacy/ccpa/gpc" },
          { label: "US state privacy law tracker - IAPP", url: "https://iapp.org/resources/article/us-state-privacy-legislation-tracker" },
        ],
      },
    ],
  },
];

export const STATUS_CONFIG: Record<CheckStatus, { label: string; color: string }> = {
  not_checked: { label: "Not checked", color: "text-muted-foreground" },
  ok: { label: "OK", color: "text-green-500" },
  issue: { label: "Issue", color: "text-destructive" },
  na: { label: "N/A", color: "text-muted-foreground" },
  blocked: { label: "Blocked", color: "text-amber-500" },
  client_managed: { label: "Client managed?", color: "text-cyan-500" },
};
