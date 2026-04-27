export interface GlossaryTerm {
  term: string;
  definition: string;
}

export const GLOSSARY: Record<string, GlossaryTerm> = {
  GCM: {
    term: "GCM - Google Consent Mode",
    definition: "How Google tags respect cookie consent choices. Requires 4 consent parameters (ad_storage, analytics_storage, ad_user_data, ad_personalization) to be set in the dataLayer.",
  },
  CMP: {
    term: "CMP - Consent Management Platform",
    definition: "The tool that shows the cookie consent banner and manages user consent choices. In this setup, Cookiebot is the CMP, deployed via GTM.",
  },
  GTM: {
    term: "GTM - Google Tag Manager",
    definition: "A tag management system that controls when scripts run on the site. All tracking scripts should be inside GTM so they can be consent-gated.",
  },
  DPA: {
    term: "DPA - Data Processing Agreement",
    definition: "A mandatory contract (GDPR Art. 28) between a data controller (the client) and any processor that handles personal data on their behalf (analytics, CRM, hosting, etc.).",
  },
  DSAR: {
    term: "DSAR - Data Subject Access Request",
    definition: "When someone asks what personal data you hold about them. Must be responded to within 1 month (GDPR Art. 12/15).",
  },
  ePrivacy: {
    term: "ePrivacy Directive",
    definition: "EU Directive 2002/58/EC covering cookies and electronic communications. Art. 5(3) requires consent before storing/accessing information on a user's device, with limited exceptions for strictly necessary cookies.",
  },
  AutoBlock: {
    term: "AutoBlock (Cookiebot)",
    definition: "A Cookiebot feature that auto-blocks scripts before consent. Should be OFF when using GTM, because GTM handles consent gating instead. Having both active causes conflicts.",
  },
  ConsentInit: {
    term: "Consent Initialization (GTM trigger)",
    definition: "A GTM trigger type that fires before any other triggers. The Cookiebot CMP tag must use this trigger so consent state is established before any other tags fire.",
  },
  DPF: {
    term: "DPF - Data Privacy Framework",
    definition: "The EU-US Data Privacy Framework (adequacy decision, Jul 2023). US companies self-certify at dataprivacyframework.gov. If certified, data transfers to that company are lawful without additional safeguards.",
  },
  SCC: {
    term: "SCCs - Standard Contractual Clauses",
    definition: "EU-approved contract templates for international data transfers. Required when transferring personal data to countries without an adequacy decision (and the recipient is not DPF-certified).",
  },
  IMY: {
    term: "IMY - Integritetsskyddsmyndigheten",
    definition: "Sweden's data protection authority (DPA). Supervises GDPR compliance in Sweden. Breach notifications must be filed with IMY within 72 hours.",
  },
  ROPA: {
    term: "ROPA - Records of Processing Activities",
    definition: "A mandatory register (GDPR Art. 30) documenting all processing activities: purposes, data categories, recipients, retention periods, and transfer safeguards. Must be available to the DPA on request.",
  },
  DPIA: {
    term: "DPIA - Data Protection Impact Assessment",
    definition: "A formal risk assessment (GDPR Art. 35) required before processing that is likely to result in high risk to individuals (e.g. large-scale profiling, systematic monitoring, children's data).",
  },
};

export type CheckRequirement = "cookiebotId" | "gtmId";

export interface CheckFieldRequirement {
  field: CheckRequirement;
  label: string;
  reason: string;
}

export const CHECK_REQUIREMENTS: Record<string, CheckFieldRequirement[]> = {
  A3: [{ field: "gtmId", label: "GTM Container ID", reason: "Need GTM access to check Cookiebot CMP tag trigger configuration" }],
  A4: [{ field: "gtmId", label: "GTM Container ID", reason: "Need GTM access to verify official Cookiebot template is used" }],
  A5: [{ field: "gtmId", label: "GTM Container ID", reason: "Need GTM access to check AutoBlock setting in Cookiebot CMP tag" }],
  B2: [{ field: "gtmId", label: "GTM Container ID", reason: "Need GTM access to check Google tag consent overview settings" }],
  B3: [{ field: "gtmId", label: "GTM Container ID", reason: "Need GTM access to verify non-Google tags have consent requirements" }],
  B4: [{ field: "gtmId", label: "GTM Container ID", reason: "Need GTM access to check non-Google tag triggers" }],
  B5: [{ field: "gtmId", label: "GTM Container ID", reason: "Need GTM access to verify Consent Mode V2 is enabled in Cookiebot CMP tag" }],
  C1: [{ field: "cookiebotId", label: "Cookiebot ID", reason: "Need Cookiebot ID to fetch cc.js and check cookie categories" }],
  C2: [{ field: "cookiebotId", label: "Cookiebot ID", reason: "Need Cookiebot ID to fetch cc.js and verify statistics cookies require consent" }],
  C3: [{ field: "cookiebotId", label: "Cookiebot ID", reason: "Need Cookiebot ID to fetch cc.js and verify marketing cookies require consent" }],
  C4: [{ field: "cookiebotId", label: "Cookiebot ID", reason: "Need Cookiebot ID to fetch cc.js and verify preference cookies require consent" }],
  C5: [{ field: "cookiebotId", label: "Cookiebot ID", reason: "Need Cookiebot ID to fetch cc.js and check for unclassified cookies" }],
  H1: [{ field: "cookiebotId", label: "Cookiebot ID", reason: "Need Cookiebot admin access to run compliance scan" }],
  H2: [{ field: "cookiebotId", label: "Cookiebot ID", reason: "Need Cookiebot admin access to run GCM checker" }],
  H3: [{ field: "gtmId", label: "GTM Container ID", reason: "Need GTM Preview Mode access to test decline-all behavior" }],
  H4: [{ field: "gtmId", label: "GTM Container ID", reason: "Need GTM Preview Mode access to test accept-all behavior" }],
  H5: [{ field: "gtmId", label: "GTM Container ID", reason: "Need GTM Preview Mode access to test selective consent" }],
};
