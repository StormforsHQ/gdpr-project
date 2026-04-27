export type CheckStatus = "not_checked" | "ok" | "issue" | "na";

export type AutomationType =
  | "page-scan"
  | "browser-test"
  | "ai-agent"
  | "gtm-api"
  | "cookiebot-api"
  | "webflow-api"
  | "human";

export interface LegalReference {
  label: string;
  url: string;
}

export interface Check {
  key: string;
  label: string;
  description: string;
  automation: AutomationType;
  legalBasis?: string;
  references?: LegalReference[];
}

export interface CheckCategory {
  id: string;
  label: string;
  checks: Check[];
}

export const AUTOMATION_CONFIG: Record<AutomationType, { label: string; className: string }> = {
  "page-scan": { label: "Auto", className: "bg-green-500/15 text-green-600 dark:text-green-400" },
  "browser-test": { label: "Browser", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  "ai-agent": { label: "AI", className: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
  "gtm-api": { label: "GTM API", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  "cookiebot-api": { label: "Cookiebot", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  "webflow-api": { label: "Webflow", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  "human": { label: "Manual", className: "bg-muted text-muted-foreground" },
};

export const CHECKLIST: CheckCategory[] = [
  {
    id: "A",
    label: "Script setup",
    checks: [
      {
        key: "A1", label: "Only GTM script in site header", description: "No other scripts hardcoded (Cookiebot deploys via GTM)", automation: "page-scan",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 5(1)(a), Art. 7, Art. 25",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "GDPR Art. 25 - Data protection by design", url: "https://gdpr-info.eu/art-25-gdpr/" },
          { label: "EDPB Guidelines 05/2020 on consent", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
          { label: "CJEU C-673/17 Planet49 (prior consent)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
        ],
      },
      {
        key: "A2", label: "No scripts hardcoded in footer", description: "Everything managed through GTM", automation: "page-scan",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 5(1)(a), Art. 7, Art. 25",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "EDPB Guidelines 4/2019 on Art. 25", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-42019-article-25-data-protection-design-and_en" },
        ],
      },
      {
        key: "A3", label: "Cookiebot CMP tag on correct trigger", description: 'Must be "Consent Initialization - All Pages" (NOT "All Pages")', automation: "gtm-api",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 7(1) - consent must precede processing",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "CJEU C-673/17 Planet49 (consent must precede data collection)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
          { label: "EDPB Cookie Banner Taskforce Report 2023", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/other/report-work-undertaken-cookie-banner-taskforce_en" },
        ],
      },
      {
        key: "A4", label: "Official Cookiebot GTM template used", description: "Not Custom HTML (Custom HTML misses V2 consent fields)", automation: "gtm-api",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 25 - data protection by design",
        references: [
          { label: "GDPR Art. 25 - Data protection by design", url: "https://gdpr-info.eu/art-25-gdpr/" },
          { label: "GDPR Art. 5(2) - Accountability", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
      },
      {
        key: "A5", label: "AutoBlock is OFF", description: "Breaks Advanced Consent Mode cookieless pings", automation: "gtm-api",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 7(1), Art. 25",
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
        key: "B1", label: "All tracking scripts inside GTM", description: "Nothing running outside GTM except the GTM snippet itself", automation: "page-scan",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 5(1)(a), Art. 7, Art. 25",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "GDPR Art. 5(2) - Accountability", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
      },
      {
        key: "B2", label: "Google tags: consent overview set", description: '"No additional consent required" (they self-adapt)', automation: "gtm-api",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 7(1)",
        references: [
          { label: "EDPB Guidelines 05/2020 on consent (granularity)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
        ],
      },
      {
        key: "B3", label: "Non-Google tags: consent gated", description: '"Require additional consent" + correct type (ad_storage/analytics_storage)', automation: "gtm-api",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 7(1), Art. 6(1)(a)",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "CJEU C-673/17 Planet49", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
        ],
      },
      {
        key: "B4", label: "Non-Google tag triggers correct", description: 'Using cookie_consent_update event, not "All Pages"', automation: "gtm-api",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 7(1), Art. 25",
        references: [
          { label: "EDPB Guidelines 05/2020 on consent", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
          { label: "GDPR Art. 25 - Data protection by design", url: "https://gdpr-info.eu/art-25-gdpr/" },
        ],
      },
      {
        key: "B5", label: "Google Consent Mode V2 enabled", description: "Checkbox in Cookiebot CMP template. All 4 parameters transmitting.", automation: "browser-test",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 6(1)(a), Art. 7, Art. 25",
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
        key: "C1", label: "Necessary cookies identified", description: "CDN (Webflow, Cloudflare), session, security - no consent needed", automation: "cookiebot-api",
        legalBasis: "ePrivacy Directive Art. 5(3) - strictly necessary exemption",
        references: [
          { label: "ePrivacy Directive Art. 5(3) - strictly necessary exemption", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "EDPB Cookie Banner Taskforce Report 2023", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/other/report-work-undertaken-cookie-banner-taskforce_en" },
        ],
      },
      {
        key: "C2", label: "Statistics cookies under consent", description: "Google Analytics, HotJar, etc. - require opt-in (EU). UK: exempt post-DUAA if conditions met.", automation: "cookiebot-api",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 6(1)(a). UK: PECR Schedule A1 (analytics exemption, DUAA 2025)",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "CJEU C-673/17 Planet49 (consent per purpose)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
          { label: "UK DUAA 2025 - PECR cookie exceptions", url: "https://www.legislation.gov.uk/ukpga/2025/18/part/5" },
          { label: "ICO - What are the exceptions?", url: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/" },
        ],
      },
      {
        key: "C3", label: "Marketing cookies under consent", description: "LinkedIn Pixel, Meta Pixel, ad trackers - require opt-in", automation: "cookiebot-api",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 6(1)(a), Art. 21",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "EDPB Guidelines 8/2020 on social media targeting", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-82020-targeting-social-media-users_en" },
          { label: "CJEU C-673/17 Planet49", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
        ],
      },
      {
        key: "C4", label: "Preference cookies under consent", description: "Language, UI customization - if applicable. UK: exempt post-DUAA if conditions met.", automation: "cookiebot-api",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 6(1)(a). UK: PECR Schedule A1 (functionality exemption, DUAA 2025)",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "UK DUAA 2025 - PECR cookie exceptions", url: "https://www.legislation.gov.uk/ukpga/2025/18/part/5" },
        ],
      },
      {
        key: "C5", label: "No unclassified cookies", description: "All cookies categorized in Cookiebot admin", automation: "cookiebot-api",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 5(2) - accountability, Art. 30",
        references: [
          { label: "GDPR Art. 5(2) - Accountability", url: "https://gdpr-info.eu/art-5-gdpr/" },
          { label: "GDPR Art. 30 - Records of processing", url: "https://gdpr-info.eu/art-30-gdpr/" },
        ],
      },
      {
        key: "C6", label: "Cookie lifetimes proportionate", description: "No non-essential cookies exceed 13 months duration. Check in DevTools or Cookiebot scan.", automation: "human",
        legalBasis: "GDPR Art. 5(1)(c) - data minimization; ePrivacy Directive Art. 5(3); CNIL guidance (13 months max)",
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
        key: "D1", label: "No ghost scripts", description: "Leftover scripts from discontinued services (HotJar, Leadfeeder, etc.)", automation: "page-scan",
        legalBasis: "GDPR Art. 5(1)(c) - data minimization; Art. 5(1)(e) - storage limitation; ePrivacy Directive Art. 5(3)",
        references: [
          { label: "GDPR Art. 5(1)(c) - Data minimization", url: "https://gdpr-info.eu/art-5-gdpr/" },
          { label: "GDPR Art. 25 - Data protection by design and by default", url: "https://gdpr-info.eu/art-25-gdpr/" },
        ],
      },
      {
        key: "D2", label: "No old campaign scripts", description: "Old Salesforce/marketing campaigns. Ask client before removing.", automation: "human",
        legalBasis: "GDPR Art. 5(1)(b) - purpose limitation; Art. 5(1)(c) - data minimization",
        references: [
          { label: "GDPR Art. 5(1)(b) - Purpose limitation", url: "https://gdpr-info.eu/art-5-gdpr/" },
          { label: "EDPB Guidelines 05/2020 on consent (purpose-specific)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
        ],
      },
      {
        key: "D3", label: "No orphaned pixels", description: "Pixels placed directly in header instead of GTM", automation: "page-scan",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 5(1)(c) - data minimization; Art. 5(2) - accountability",
        references: [
          { label: "GDPR Art. 5 - Principles", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
      },
    ],
  },
  {
    id: "E",
    label: "Third-party services",
    checks: [
      {
        key: "E1", label: "Video embeds audited", description: "YouTube (use youtube-nocookie.com), Vimeo - block until consent or click-to-load", automation: "page-scan",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 6(1)(a), Art. 44-49 (international transfers)",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "LG Munchen - Google Fonts ruling (same transfer principle)", url: "https://gdprhub.eu/index.php?title=LG_M%C3%BCnchen_-_3_O_17493/20" },
        ],
      },
      {
        key: "E2", label: "Google Fonts self-hosted", description: "NOT loaded from Google CDN (EUR 100/violation precedent). Use local files or Fontsource.", automation: "page-scan",
        legalBasis: "GDPR Art. 6(1) - no legal basis for IP transfer; Art. 44-46 - international data transfers; Art. 5(1)(c) - data minimization",
        references: [
          { label: "LG Munchen I, 3 O 17493/20 (Google Fonts ruling, Jan 2022)", url: "https://gdprhub.eu/index.php?title=LG_M%C3%BCnchen_-_3_O_17493/20" },
          { label: "GDPR Art. 44-46 - International transfers", url: "https://gdpr-info.eu/art-44-gdpr/" },
          { label: "EDPB Guidelines 4/2019 on Art. 25 (self-hosting as design measure)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-42019-article-25-data-protection-design-and_en" },
        ],
      },
      {
        key: "E3", label: "Maps blocked until consent", description: "Google Maps, Mapbox, etc. Or use static image with link.", automation: "page-scan",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 6(1)(a), Art. 44-49",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "LG Munchen - Google Fonts ruling (same transfer principle)", url: "https://gdprhub.eu/index.php?title=LG_M%C3%BCnchen_-_3_O_17493/20" },
        ],
      },
      {
        key: "E4", label: "Chat widgets checked", description: "If non-essential cookies: consent before loading", automation: "page-scan",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 6(1)(a), Art. 13, Art. 28",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "EDPB Guidelines 07/2020 on controller/processor", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-072020-concepts-controller-and-processor-gdpr_en" },
        ],
      },
      {
        key: "E5", label: "Social embeds checked", description: "Social feeds, share buttons, etc.", automation: "page-scan",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 6(1)(a), Art. 44-49",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "EDPB Guidelines 8/2020 on social media targeting", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-82020-targeting-social-media-users_en" },
        ],
      },
      {
        key: "E6", label: "CRM integrations reviewed", description: "HubSpot, Salesforce - DPA in place, data transfer mechanism verified", automation: "human",
        legalBasis: "GDPR Art. 28 - processor obligations; Art. 44-46 - international transfers; Art. 26 - joint controllers",
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
        key: "F1", label: "All forms identified", description: "List every form on the site", automation: "page-scan",
        legalBasis: "GDPR Art. 30 - records of processing; Art. 5(2) - accountability",
        references: [
          { label: "GDPR Art. 30 - Records of processing", url: "https://gdpr-info.eu/art-30-gdpr/" },
          { label: "WP260 rev.01 - Transparency guidelines", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/article-29-working-party-guidelines-transparency-under-regulation_en" },
        ],
      },
      {
        key: "F2", label: "Data minimization", description: "Only collecting what's needed for stated purpose", automation: "ai-agent",
        legalBasis: "GDPR Art. 5(1)(c) - data minimization; Art. 25(2) - data protection by default",
        references: [
          { label: "GDPR Art. 5(1)(c) - Data minimization", url: "https://gdpr-info.eu/art-5-gdpr/" },
          { label: "GDPR Art. 25(2) - Data protection by default", url: "https://gdpr-info.eu/art-25-gdpr/" },
          { label: "EDPB Guidelines 4/2019 on Art. 25", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-42019-article-25-data-protection-design-and_en" },
        ],
      },
      {
        key: "F3", label: "Privacy policy linked at/near form", description: "User informed at point of collection", automation: "page-scan",
        legalBasis: "GDPR Art. 13 - information at point of collection; Art. 12 - transparency",
        references: [
          { label: "GDPR Art. 13 - Information at point of collection", url: "https://gdpr-info.eu/art-13-gdpr/" },
          { label: "GDPR Art. 12 - Transparent communication", url: "https://gdpr-info.eu/art-12-gdpr/" },
          { label: "WP260 rev.01 - Transparency guidelines", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/article-29-working-party-guidelines-transparency-under-regulation_en" },
        ],
      },
      {
        key: "F4", label: "Separate consent per purpose", description: "Inquiry vs marketing = separate checkboxes, no pre-ticking", automation: "ai-agent",
        legalBasis: "GDPR Art. 7 - conditions for consent; Art. 6(1)(a); Recital 32 - pre-ticked boxes prohibited",
        references: [
          { label: "GDPR Art. 7 - Conditions for consent", url: "https://gdpr-info.eu/art-7-gdpr/" },
          { label: "GDPR Recital 32 - Active consent required", url: "https://gdpr-info.eu/recitals/no-32/" },
          { label: "CJEU C-673/17 Planet49 (pre-ticked boxes invalid)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
          { label: "EDPB Guidelines 05/2020 on consent (granular, unbundled)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
        ],
      },
      {
        key: "F5", label: "Form submissions encrypted", description: "SSL/TLS on form POST", automation: "page-scan",
        legalBasis: "GDPR Art. 5(1)(f) - integrity and confidentiality; Art. 32(1)(a) - encryption as security measure",
        references: [
          { label: "GDPR Art. 32 - Security of processing", url: "https://gdpr-info.eu/art-32-gdpr/" },
          { label: "GDPR Art. 5(1)(f) - Integrity and confidentiality", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
      },
    ],
  },
  {
    id: "G",
    label: "Consent banner",
    checks: [
      {
        key: "G1", label: "Banner appears on first visit", description: "Consent dialog visible and functional", automation: "browser-test",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 6(1)(a), Art. 7 - consent must precede processing",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "CJEU C-673/17 Planet49 (consent must precede processing)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
          { label: "EDPB Cookie Banner Taskforce Report 2023", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/other/report-work-undertaken-cookie-banner-taskforce_en" },
        ],
      },
      {
        key: "G2", label: "Accept and Reject equally prominent", description: "Same size, same visual weight, same number of clicks", automation: "ai-agent",
        legalBasis: "GDPR Art. 7(4) - freely given consent; Art. 4(11) - definition of consent; Recital 42",
        references: [
          { label: "GDPR Art. 7 - Conditions for consent", url: "https://gdpr-info.eu/art-7-gdpr/" },
          { label: "EDPB Cookie Banner Taskforce Report 2023 (reject must be on same layer)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/other/report-work-undertaken-cookie-banner-taskforce_en" },
          { label: "CJEU C-673/17 Planet49", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
        ],
      },
      {
        key: "G3", label: "Granular category controls available", description: "User can accept/reject per category", automation: "browser-test",
        legalBasis: "GDPR Art. 7 - conditions for consent; Art. 4(11) - specific consent",
        references: [
          { label: "GDPR Art. 7 - Conditions for consent", url: "https://gdpr-info.eu/art-7-gdpr/" },
          { label: "EDPB Guidelines 05/2020 on consent (granularity)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
          { label: "CJEU C-673/17 Planet49 (specific consent per purpose)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
        ],
      },
      {
        key: "G4", label: "Declining actually blocks scripts", description: "Non-necessary scripts don't fire after decline (verify in DevTools)", automation: "browser-test",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 7(3) - withdrawal must be effective",
        references: [
          { label: "GDPR Art. 7(3) - Withdrawal of consent", url: "https://gdpr-info.eu/art-7-gdpr/" },
          { label: "EDPB Guidelines 05/2020 on consent (effective withdrawal)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
        ],
      },
      {
        key: "G5", label: "Consent remembered on return", description: "CookieConsent cookie persists, no re-prompt", automation: "browser-test",
        legalBasis: "GDPR Art. 7(1) - demonstrating consent; Art. 5(2) - accountability",
        references: [
          { label: "GDPR Art. 7(1) - Demonstrating consent", url: "https://gdpr-info.eu/art-7-gdpr/" },
          { label: "GDPR Art. 5(2) - Accountability", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
      },
      {
        key: "G6", label: "Banner in correct language(s)", description: "Matches site content language(s). Cookiebot multi-language configured.", automation: "ai-agent",
        legalBasis: "GDPR Art. 12(1) - clear and plain language; Art. 7 - informed consent",
        references: [
          { label: "GDPR Art. 12 - Transparent communication", url: "https://gdpr-info.eu/art-12-gdpr/" },
          { label: "WP260 rev.01 - Transparency guidelines (language of audience)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/article-29-working-party-guidelines-transparency-under-regulation_en" },
        ],
      },
      {
        key: "G7", label: "No dark patterns", description: "No pre-ticked boxes, no cookie walls, no guilt language, no hidden reject, no pay-or-consent without free alternative (EDPB Opinion 08/2024)", automation: "ai-agent",
        legalBasis: "GDPR Art. 7(4) - freely given consent; Art. 4(11) - unambiguous indication; Recitals 42-43",
        references: [
          { label: "EDPB Cookie Banner Taskforce Report 2023 (8 dark pattern violations)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/other/report-work-undertaken-cookie-banner-taskforce_en" },
          { label: "CJEU C-673/17 Planet49 (pre-ticked boxes invalid)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
          { label: "GDPR Art. 7 - Conditions for consent", url: "https://gdpr-info.eu/art-7-gdpr/" },
        ],
      },
      {
        key: "G8", label: "Consent withdrawal accessible at all times", description: "Persistent widget or footer link lets users review and change consent. Withdrawal must be as easy as giving consent.", automation: "browser-test",
        legalBasis: "GDPR Art. 7(3) - withdrawal must be as easy as giving consent",
        references: [
          { label: "GDPR Art. 7(3) - Withdrawal of consent", url: "https://gdpr-info.eu/art-7-gdpr/" },
          { label: "EDPB Guidelines 05/2020 on consent", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
        ],
      },
      {
        key: "G9", label: "Consent renewal period configured", description: "CMP re-prompts after max 12 months (6 months for French visitors). Also re-prompts when cookie notice changes.", automation: "human",
        legalBasis: "GDPR Art. 5(2) - accountability; CNIL guidance (6 months); EDPB recommendations (12 months max)",
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
        key: "H1", label: "Cookiebot compliance scan run", description: "Run scanner, document result, no unclassified cookies", automation: "human",
        legalBasis: "GDPR Art. 5(2) - accountability; ePrivacy Directive Art. 5(3)",
        references: [
          { label: "GDPR Art. 5(2) - Accountability", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
      },
      {
        key: "H2", label: "Cookiebot GCM Check run", description: "Google Consent Mode Checker in Cookiebot admin", automation: "human",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 7 - verifies consent signals are working",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
        ],
      },
      {
        key: "H3", label: "GTM Preview Mode test: decline all", description: 'Consent tab shows Denied, non-Google tags under "Not Fired"', automation: "human",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 7, Art. 25 - verifies consent implementation",
        references: [
          { label: "GDPR Art. 25 - Data protection by design", url: "https://gdpr-info.eu/art-25-gdpr/" },
        ],
      },
      {
        key: "H4", label: "GTM Preview Mode test: accept all", description: "All tags fire, Consent tab shows Granted", automation: "human",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 7, Art. 25 - verifies consent implementation",
        references: [
          { label: "GDPR Art. 25 - Data protection by design", url: "https://gdpr-info.eu/art-25-gdpr/" },
        ],
      },
      {
        key: "H5", label: "GTM Preview Mode test: selective", description: "Accept Statistics only, verify Marketing tags don't fire", automation: "human",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 7 - verifies granular consent works",
        references: [
          { label: "GDPR Art. 7 - Conditions for consent", url: "https://gdpr-info.eu/art-7-gdpr/" },
          { label: "EDPB Guidelines 05/2020 on consent (granularity)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" },
        ],
      },
      {
        key: "H6", label: "Cookie tab check in DevTools", description: "Before consent: only CookieConsent. After decline: no tracking cookies.", automation: "browser-test",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 5(2) - accountability",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
        ],
      },
      {
        key: "H7", label: "Consent records stored and auditable", description: "CMP consent log enabled. Records: timestamp, consent choices per category, banner version. Retention 5+ years.", automation: "human",
        legalBasis: "GDPR Art. 7(1) - controller must demonstrate consent was given; Art. 5(2) - accountability",
        references: [
          { label: "GDPR Art. 7(1) - Demonstrating consent", url: "https://gdpr-info.eu/art-7-gdpr/" },
          { label: "GDPR Art. 5(2) - Accountability", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
      },
      {
        key: "H8", label: "Non-cookie tracking checked", description: "Check localStorage, sessionStorage, IndexedDB, fingerprinting scripts. Same consent rules apply as for cookies.", automation: "browser-test",
        legalBasis: "ePrivacy Directive Art. 5(3) - applies to ALL storage/access on user device, not just cookies",
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
        key: "I1", label: "Privacy Policy complete (Art. 13/14)", description: "Controller ID, DPO contact (if applicable), purposes per processing activity, legal basis, data categories, recipients, international transfers, retention periods, all data subject rights, right to withdraw consent, right to complain to DPA, automated decision-making info (if used)", automation: "ai-agent",
        legalBasis: "GDPR Art. 13 - information at point of collection; Art. 14 - information not from data subject; Art. 12 - transparency",
        references: [
          { label: "GDPR Art. 13 - Information at point of collection", url: "https://gdpr-info.eu/art-13-gdpr/" },
          { label: "GDPR Art. 14 - Information not obtained from data subject", url: "https://gdpr-info.eu/art-14-gdpr/" },
          { label: "WP260 rev.01 - Transparency guidelines (13 mandatory items)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/article-29-working-party-guidelines-transparency-under-regulation_en" },
          { label: "CCPA 1798.100 - Privacy policy requirements (US)", url: "https://oag.ca.gov/privacy/ccpa" },
        ],
      },
      {
        key: "I2", label: "Privacy Policy in site language(s)", description: "Available in every language the site content uses", automation: "ai-agent",
        legalBasis: "GDPR Art. 12(1) - clear and plain language; Art. 5(1)(a) - transparency",
        references: [
          { label: "GDPR Art. 12 - Transparent communication", url: "https://gdpr-info.eu/art-12-gdpr/" },
          { label: "WP260 rev.01 - Transparency guidelines (language of audience)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/article-29-working-party-guidelines-transparency-under-regulation_en" },
        ],
      },
      {
        key: "I3", label: "Cookie Policy exists (separate page)", description: "Lists all cookies, purpose, duration, vendor. Cookie Declaration script installed.", automation: "page-scan",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 13(1)(c)-(d)",
        references: [
          { label: "CJEU C-673/17 Planet49 (cookie duration and function must be disclosed)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-673/17_-_Planet49" },
          { label: "GDPR Art. 13 - Information at point of collection", url: "https://gdpr-info.eu/art-13-gdpr/" },
        ],
      },
      {
        key: "I4", label: "Privacy Policy linked from every page", description: "Typically in footer", automation: "page-scan",
        legalBasis: "GDPR Art. 12(1) - easily accessible; Art. 13",
        references: [
          { label: "GDPR Art. 12 - Transparent communication", url: "https://gdpr-info.eu/art-12-gdpr/" },
          { label: "WP260 rev.01 - Transparency guidelines (easily accessible)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/article-29-working-party-guidelines-transparency-under-regulation_en" },
        ],
      },
      {
        key: "I5", label: "Script inventory documented", description: "All scripts and their purposes documented internally", automation: "human",
        legalBasis: "GDPR Art. 30 - records of processing; Art. 5(2) - accountability",
        references: [
          { label: "GDPR Art. 30 - Records of processing", url: "https://gdpr-info.eu/art-30-gdpr/" },
          { label: "GDPR Art. 5(2) - Accountability", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
      },
      {
        key: "I6", label: "Automated decision-making disclosed (if applicable)", description: "If site uses profiling or automated decisions with significant effects: privacy policy discloses logic, significance, consequences, and right to human review. N/A for most marketing websites.", automation: "human",
        legalBasis: "GDPR Art. 13(2)(f), Art. 14(2)(g), Art. 22",
        references: [
          { label: "GDPR Art. 22 - Automated decision-making", url: "https://gdpr-info.eu/art-22-gdpr/" },
          { label: "GDPR Art. 13(2)(f) - Disclosure requirement", url: "https://gdpr-info.eu/art-13-gdpr/" },
        ],
      },
      {
        key: "I7", label: "DPO contact in privacy policy (if applicable)", description: "If client has a DPO (mandatory for public authorities, large-scale monitoring, special category data): contact details in privacy policy. If DPO required but not appointed, flag as critical.", automation: "human",
        legalBasis: "GDPR Art. 37-39 - DPO requirements; Art. 13(1)(b) - must disclose DPO contact",
        references: [
          { label: "GDPR Art. 37 - Designation of DPO", url: "https://gdpr-info.eu/art-37-gdpr/" },
          { label: "GDPR Art. 13(1)(b) - DPO contact disclosure", url: "https://gdpr-info.eu/art-13-gdpr/" },
        ],
      },
      {
        key: "I8", label: "Privacy information accessible and layered", description: "Clear, plain language. Long policies should use layered approach (summary + full detail). Easy to navigate (sections, anchors). 2026 DPA coordinated enforcement priority.", automation: "ai-agent",
        legalBasis: "GDPR Art. 12 - concise, transparent, intelligible, easily accessible",
        references: [
          { label: "GDPR Art. 12 - Transparent communication", url: "https://gdpr-info.eu/art-12-gdpr/" },
          { label: "WP260 rev.01 - Transparency guidelines (layered approach)", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/article-29-working-party-guidelines-transparency-under-regulation_en" },
        ],
      },
    ],
  },
  {
    id: "J",
    label: "Data processing & legal",
    checks: [
      {
        key: "J1", label: "DPAs in place for all processors", description: "Analytics, CRM, email, hosting, CDN, payment, any SaaS with personal data", automation: "human",
        legalBasis: "GDPR Art. 28 - processor obligations (mandatory written contract); Art. 28(3) - required contract terms",
        references: [
          { label: "GDPR Art. 28 - Processor", url: "https://gdpr-info.eu/art-28-gdpr/" },
          { label: "EDPB Guidelines 07/2020 on controller/processor", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-072020-concepts-controller-and-processor-gdpr_en" },
        ],
      },
      {
        key: "J2", label: "Vendor inventory maintained", description: "List of all third parties, what data they process, DPA status", automation: "human",
        legalBasis: "GDPR Art. 30 - records of processing; Art. 5(2) - accountability",
        references: [
          { label: "GDPR Art. 30 - Records of processing", url: "https://gdpr-info.eu/art-30-gdpr/" },
          { label: "GDPR Art. 5(2) - Accountability", url: "https://gdpr-info.eu/art-5-gdpr/" },
        ],
      },
      {
        key: "J3", label: "US services DPF-certified", description: "Check dataprivacyframework.gov for each US-based vendor. If certified: transfer is lawful. If NOT certified: verify SCCs + Transfer Impact Assessment are in place (see J8).", automation: "page-scan",
        legalBasis: "GDPR Art. 44-46 - international transfers; EU-US DPF adequacy decision (Art. 45, Jul 2023)",
        references: [
          { label: "GDPR Art. 44-46 - International transfers", url: "https://gdpr-info.eu/art-44-gdpr/" },
          { label: "EU-US Data Privacy Framework", url: "https://www.dataprivacyframework.gov/list" },
          { label: "CJEU C-311/18 Schrems II (transfer mechanisms)", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-311/18_-_Schrems_II" },
          { label: "EU adequacy decisions overview", url: "https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en" },
        ],
      },
      {
        key: "J4", label: "Data subject rights process exists", description: "DSAR handling procedure documented, 30-day response capability", automation: "human",
        legalBasis: "GDPR Art. 15-21 - data subject rights; Art. 12 - response within 1 month",
        references: [
          { label: "GDPR Art. 15 - Right of access", url: "https://gdpr-info.eu/art-15-gdpr/" },
          { label: "GDPR Art. 17 - Right to erasure", url: "https://gdpr-info.eu/art-17-gdpr/" },
          { label: "GDPR Art. 12 - Response timeline (1 month)", url: "https://gdpr-info.eu/art-12-gdpr/" },
          { label: "CCPA 1798.100-1798.125 - Consumer rights (US)", url: "https://oag.ca.gov/privacy/ccpa" },
        ],
      },
      {
        key: "J5", label: "Data breach response plan exists", description: "72-hour notification procedure, breach register maintained", automation: "human",
        legalBasis: "GDPR Art. 33 - notification to DPA within 72 hours; Art. 34 - communication to data subjects",
        references: [
          { label: "GDPR Art. 33 - Notification to supervisory authority", url: "https://gdpr-info.eu/art-33-gdpr/" },
          { label: "GDPR Art. 34 - Communication to data subject", url: "https://gdpr-info.eu/art-34-gdpr/" },
          { label: "EDPB Guidelines 9/2022 on breach notification", url: "https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2022/guidelines-92022-personal-data-breach_en" },
        ],
      },
      {
        key: "J6", label: "Records of Processing Activities (ROPA) exist", description: "Client maintains ROPA covering all website processing: purposes, data categories, recipients, retention periods, transfer safeguards. Must be available to DPA on request.", automation: "human",
        legalBasis: "GDPR Art. 30 - records of processing activities (mandatory for controllers)",
        references: [
          { label: "GDPR Art. 30 - Records of processing", url: "https://gdpr-info.eu/art-30-gdpr/" },
        ],
      },
      {
        key: "J7", label: "Sub-processor management in DPAs", description: "DPAs include sub-processor clauses: prior notification of changes, right to object, same obligations flow down. Key vendors have accessible sub-processor lists.", automation: "human",
        legalBasis: "GDPR Art. 28(2), Art. 28(4) - sub-processor obligations",
        references: [
          { label: "GDPR Art. 28 - Processor", url: "https://gdpr-info.eu/art-28-gdpr/" },
          { label: "EDPB Guidelines 07/2020 on controller/processor", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-072020-concepts-controller-and-processor-gdpr_en" },
        ],
      },
      {
        key: "J8", label: "Transfer Impact Assessments for non-DPF transfers", description: "For US vendors NOT on DPF, or non-adequate country vendors: TIA completed, covering legal framework, government access risks, supplementary measures. N/A if all vendors DPF-certified or in adequate countries.", automation: "human",
        legalBasis: "GDPR Art. 46 - appropriate safeguards; Schrems II ruling; EDPB Recommendations 01/2020",
        references: [
          { label: "GDPR Art. 46 - Appropriate safeguards", url: "https://gdpr-info.eu/art-46-gdpr/" },
          { label: "CJEU C-311/18 Schrems II", url: "https://gdprhub.eu/index.php?title=CJEU_-_C-311/18_-_Schrems_II" },
        ],
      },
      {
        key: "J9", label: "DPIA need assessed", description: "Evaluate if processing triggers DPIA: large-scale profiling, systematic monitoring, automated decision-making, special category data, children's data. Document conclusion. If required, verify completion.", automation: "human",
        legalBasis: "GDPR Art. 35 - Data Protection Impact Assessment",
        references: [
          { label: "GDPR Art. 35 - DPIA", url: "https://gdpr-info.eu/art-35-gdpr/" },
          { label: "EDPB Guidelines on DPIA", url: "https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/obligations/when-data-protection-impact-assessment-dpia-required_en" },
        ],
      },
    ],
  },
  {
    id: "K",
    label: "Geo-targeting",
    checks: [
      {
        key: "K1", label: "EU/EEA visitors get opt-in banner", description: "Full blocking consent banner", automation: "browser-test",
        legalBasis: "ePrivacy Directive Art. 5(3); GDPR Art. 6(1)(a), Art. 7; GDPR Art. 3(2) - territorial scope",
        references: [
          { label: "ePrivacy Directive Art. 5(3)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219" },
          { label: "GDPR Art. 3 - Territorial scope", url: "https://gdpr-info.eu/art-3-gdpr/" },
          { label: "EDPB Guidelines 3/2018 on territorial scope", url: "https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-32018-territorial-scope-gdpr-article-3_en" },
        ],
      },
      {
        key: "K2", label: "US visitors get appropriate notice", description: 'Opt-out model. "Do Not Sell/Share" link (CCPA). Honor GPC browser signals.', automation: "browser-test",
        legalBasis: "CCPA/CPRA Cal. Civ. Code 1798.120, 1798.135 - opt-out of sale/sharing; state privacy laws (20+ states)",
        references: [
          { label: "CCPA - California Consumer Privacy Act", url: "https://oag.ca.gov/privacy/ccpa" },
          { label: "CCPA 1798.120 - Right to opt out", url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.120.&lawCode=CIV" },
          { label: "Global Privacy Control (GPC)", url: "https://globalprivacycontrol.org/" },
          { label: "US state privacy law tracker - IAPP", url: "https://iapp.org/resources/article/us-state-privacy-legislation-tracker" },
        ],
      },
      {
        key: "K3", label: "UK visitors handled correctly", description: "Marketing: opt-in required. Analytics: can load without consent if solely for service improvement, users informed, opt-out provided, and third-party provider does not use data for own purposes (DUAA 2025, in force Feb 2026).", automation: "browser-test",
        legalBasis: "UK GDPR; PECR Reg. 6; PECR Schedule A1 (inserted by DUAA 2025 s.112); UK GDPR Art. 6(1)(f)",
        references: [
          { label: "UK PECR - Cookie consent rules", url: "https://www.legislation.gov.uk/uksi/2003/2426" },
          { label: "UK DUAA 2025 Part 5 - PECR amendments", url: "https://www.legislation.gov.uk/ukpga/2025/18/part/5" },
          { label: "ICO - Storage and access technologies guidance", url: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/" },
          { label: "ICO - What are the PECR exceptions?", url: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/" },
          { label: "UK GDPR (retained EU law)", url: "https://www.legislation.gov.uk/eur/2016/679" },
        ],
      },
      {
        key: "K4", label: "GPC browser signal honored", description: "Website/CMP detects and honors Global Privacy Control signals as valid opt-out. Required in 11+ US states (CA, CO, CT, TX, MT, OR, DE, NH, KY, RI, IN). Verify with GPC browser extension.", automation: "browser-test",
        legalBasis: "CCPA/CPRA 1798.135; Colorado CPA; Connecticut CTDPA; Texas TDPSA; 7+ additional state laws",
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
};
