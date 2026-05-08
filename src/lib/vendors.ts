export interface VendorInfo {
  name: string;
  country: "us" | "eu" | "other";
  patterns: RegExp[];
  dpaStatus: "covered-by-tos" | "needs-verification";
  dpaNote: string;
  dpfCertified?: boolean;
  dpfNote?: string;
}

export interface DetectedVendor {
  name: string;
  country: "us" | "eu" | "other";
  detectedVia: string;
  dpaStatus: "covered-by-tos" | "needs-verification";
  dpaNote: string;
  dpfCertified?: boolean;
  dpfNote?: string;
}

const VENDORS: VendorInfo[] = [
  // --- US vendors ---
  {
    name: "Google Analytics",
    country: "us",
    patterns: [
      /google-analytics\.com/i,
      /googletagmanager\.com\/gtag\/js/i,
    ],
    dpaStatus: "needs-verification",
    dpaNote: "The client must accept Google's Data Processing Terms. Google Analytics: Admin > Account Settings > scroll to 'Data Processing Amendment'. EU accounts usually have this auto-accepted at signup, but verify.",
    dpfCertified: true,
    dpfNote: "Google LLC is DPF-certified (EU-US, UK Extension, Swiss-US). Certified since 2016.",
  },
  {
    name: "Google Tag Manager",
    country: "us",
    patterns: [
      /googletagmanager\.com\/gtm\.js/i,
      /gtm\.start/i,
    ],
    dpaStatus: "needs-verification",
    dpaNote: "Covered by the same Google Data Processing Terms as Analytics. The client should verify acceptance in their Google admin.",
    dpfCertified: true,
    dpfNote: "Google LLC is DPF-certified.",
  },
  {
    name: "Meta Pixel",
    country: "us",
    patterns: [
      /connect\.facebook\.net/i,
      /facebook\.net.*fbevents/i,
    ],
    dpaStatus: "needs-verification",
    dpaNote: "The client must accept Meta's Data Processing Terms in Meta Business Suite > Business Settings > Data Sources.",
    dpfCertified: true,
    dpfNote: "Meta Platforms, Inc. is DPF-certified.",
  },
  {
    name: "LinkedIn",
    country: "us",
    patterns: [
      /snap\.licdn\.com/i,
      /platform\.linkedin\.com/i,
    ],
    dpaStatus: "covered-by-tos",
    dpaNote: "LinkedIn's DPA is part of their Customer Terms. No separate action needed.",
    dpfCertified: true,
    dpfNote: "LinkedIn Corporation is DPF-certified.",
  },
  {
    name: "Twitter/X",
    country: "us",
    patterns: [
      /platform\.twitter\.com/i,
      /static\.ads-twitter\.com/i,
    ],
    dpaStatus: "needs-verification",
    dpaNote: "Check X/Twitter's current data processing terms in their ads platform settings.",
    dpfCertified: false,
    dpfNote: "X Corp has not been consistently DPF-certified. Check dataprivacyframework.gov for current status.",
  },
  {
    name: "HubSpot",
    country: "us",
    patterns: [
      /js\.hs-scripts\.com/i,
      /js\.hs-analytics\.net/i,
      /js\.hsforms\.net/i,
      /js\.hscollectedforms\.net/i,
      /js\.hubspot\.com/i,
    ],
    dpaStatus: "covered-by-tos",
    dpaNote: "HubSpot's DPA is part of their Customer Terms. No separate action needed.",
    dpfCertified: true,
    dpfNote: "HubSpot, Inc. is DPF-certified.",
  },
  {
    name: "Stripe",
    country: "us",
    patterns: [
      /js\.stripe\.com/i,
      /checkout\.stripe\.com/i,
    ],
    dpaStatus: "covered-by-tos",
    dpaNote: "Stripe's DPA is part of their Services Agreement. No separate action needed.",
    dpfCertified: true,
    dpfNote: "Stripe, Inc. is DPF-certified.",
  },
  {
    name: "Mailchimp",
    country: "us",
    patterns: [
      /cdn-images\.mailchimp\.com/i,
      /chimpstatic\.com/i,
      /list-manage\.com/i,
    ],
    dpaStatus: "covered-by-tos",
    dpaNote: "Mailchimp's DPA is part of their Standard Terms. No separate action needed.",
    dpfCertified: true,
    dpfNote: "The Rocket Science Group LLC (Mailchimp) is DPF-certified.",
  },
  {
    name: "HotJar",
    country: "eu",
    patterns: [/static\.hotjar\.com/i],
    dpaStatus: "covered-by-tos",
    dpaNote: "HotJar's DPA is part of their Terms of Service. No separate action needed.",
  },
  {
    name: "Microsoft Clarity",
    country: "us",
    patterns: [/clarity\.ms/i],
    dpaStatus: "covered-by-tos",
    dpaNote: "Microsoft's DPA is part of their Online Services Terms. No separate action needed.",
    dpfCertified: true,
    dpfNote: "Microsoft Corporation is DPF-certified.",
  },
  {
    name: "Microsoft/Bing Ads",
    country: "us",
    patterns: [/bat\.bing\.com/i],
    dpaStatus: "covered-by-tos",
    dpaNote: "Microsoft's DPA is part of their Online Services Terms. No separate action needed.",
    dpfCertified: true,
    dpfNote: "Microsoft Corporation is DPF-certified.",
  },
  {
    name: "TikTok",
    country: "other",
    patterns: [/analytics\.tiktok\.com/i],
    dpaStatus: "needs-verification",
    dpaNote: "TikTok's data processing terms vary by region. Check the TikTok Business Center for current DPA terms.",
    dpfCertified: false,
    dpfNote: "TikTok (ByteDance) is not a US company and is not part of the DPF. Data transfers require SCCs or other mechanisms.",
  },
  {
    name: "Snapchat",
    country: "us",
    patterns: [
      /sc-static\.net\/scevent/i,
      /tr\.snapchat\.com/i,
    ],
    dpaStatus: "needs-verification",
    dpaNote: "Check Snap's data processing terms in their Ads Manager settings.",
    dpfCertified: true,
    dpfNote: "Snap Inc. is DPF-certified.",
  },
  {
    name: "Segment",
    country: "us",
    patterns: [/cdn\.segment\.com/i],
    dpaStatus: "covered-by-tos",
    dpaNote: "Segment's DPA is part of their Customer Agreement. No separate action needed.",
    dpfCertified: true,
    dpfNote: "Twilio Inc. (Segment's parent) is DPF-certified.",
  },
  {
    name: "Amplitude",
    country: "us",
    patterns: [/cdn\.amplitude\.com/i],
    dpaStatus: "covered-by-tos",
    dpaNote: "Amplitude's DPA is part of their Terms of Service. No separate action needed.",
    dpfCertified: true,
    dpfNote: "Amplitude, Inc. is DPF-certified.",
  },
  {
    name: "Mixpanel",
    country: "us",
    patterns: [/cdn\.mxpnl\.com|cdn\.mixpanel\.com/i],
    dpaStatus: "covered-by-tos",
    dpaNote: "Mixpanel's DPA is part of their Terms of Use. No separate action needed.",
    dpfCertified: true,
    dpfNote: "Mixpanel, Inc. is DPF-certified.",
  },
  {
    name: "Plausible Analytics",
    country: "eu",
    patterns: [/plausible\.io/i],
    dpaStatus: "covered-by-tos",
    dpaNote: "Plausible is EU-based (Estonia). DPA is part of their Terms. No separate action needed.",
  },
  {
    name: "Intercom",
    country: "us",
    patterns: [
      /js\.intercomcdn\.com/i,
      /widget\.intercom\.io/i,
    ],
    dpaStatus: "covered-by-tos",
    dpaNote: "Intercom's DPA is part of their Terms of Service. No separate action needed.",
    dpfCertified: true,
    dpfNote: "Intercom, Inc. is DPF-certified.",
  },
  {
    name: "Zendesk",
    country: "us",
    patterns: [
      /static\.zdassets\.com/i,
      /widget\.zopim\.com/i,
    ],
    dpaStatus: "covered-by-tos",
    dpaNote: "Zendesk's DPA is part of their Terms of Service. No separate action needed.",
    dpfCertified: true,
    dpfNote: "Zendesk, Inc. is DPF-certified.",
  },
  {
    name: "Drift",
    country: "us",
    patterns: [
      /js\.driftt\.com/i,
      /drift\.com\/include/i,
    ],
    dpaStatus: "covered-by-tos",
    dpaNote: "Drift (now part of Salesloft) includes DPA in their terms.",
    dpfCertified: true,
    dpfNote: "Salesloft, Inc. (Drift's parent) is DPF-certified.",
  },
  {
    name: "Crisp",
    country: "eu",
    patterns: [/cdn\.crisp\.chat|client\.crisp\.chat/i],
    dpaStatus: "covered-by-tos",
    dpaNote: "Crisp is EU-based (France). DPA is part of their Terms. No separate action needed.",
  },
  {
    name: "Tidio",
    country: "eu",
    patterns: [/code\.tidio\.co/i],
    dpaStatus: "covered-by-tos",
    dpaNote: "Tidio is EU-based (Poland). DPA is part of their Terms. No separate action needed.",
  },
  {
    name: "Tawk.to",
    country: "us",
    patterns: [/embed\.tawk\.to/i],
    dpaStatus: "needs-verification",
    dpaNote: "Check tawk.to's data processing terms in their dashboard settings.",
    dpfCertified: false,
    dpfNote: "Check dataprivacyframework.gov for current status.",
  },
  {
    name: "Pinterest",
    country: "us",
    patterns: [/assets\.pinterest\.com/i, /pintrk/i],
    dpaStatus: "covered-by-tos",
    dpaNote: "Pinterest's DPA is part of their Advertising Terms. No separate action needed.",
    dpfCertified: true,
    dpfNote: "Pinterest, Inc. is DPF-certified.",
  },
  {
    name: "Leadfeeder",
    country: "eu",
    patterns: [/cdn\.leadfeeder\.net/i],
    dpaStatus: "covered-by-tos",
    dpaNote: "Leadfeeder (now Dealfront) is EU-based (Finland). DPA is part of their Terms.",
  },
  {
    name: "Mouseflow",
    country: "eu",
    patterns: [/cdn\.mouseflow\.com/i],
    dpaStatus: "covered-by-tos",
    dpaNote: "Mouseflow is EU-based (Denmark). DPA is part of their Terms. No separate action needed.",
  },
  {
    name: "Optimizely",
    country: "us",
    patterns: [/cdn\.optimizely\.com/i],
    dpaStatus: "covered-by-tos",
    dpaNote: "Optimizely's DPA is part of their Terms of Service. No separate action needed.",
    dpfCertified: true,
    dpfNote: "Optimizely, Inc. is DPF-certified.",
  },
  {
    name: "Cookiebot",
    country: "eu",
    patterns: [
      /consent\.cookiebot\.com/i,
      /consentcdn\.cookiebot\.com/i,
    ],
    dpaStatus: "covered-by-tos",
    dpaNote: "Cookiebot (Usercentrics) is EU-based (Denmark/Germany). DPA is part of their Terms. No separate action needed.",
  },
  {
    name: "Cloudflare",
    country: "us",
    patterns: [
      /cdnjs\.cloudflare\.com/i,
      /cdn-cgi\/scripts/i,
    ],
    dpaStatus: "covered-by-tos",
    dpaNote: "Cloudflare's DPA is part of their Self-Serve Terms. No separate action needed.",
    dpfCertified: true,
    dpfNote: "Cloudflare, Inc. is DPF-certified.",
  },
  {
    name: "Fathom Analytics",
    country: "other",
    patterns: [/cdn\.usefathom\.com/i],
    dpaStatus: "covered-by-tos",
    dpaNote: "Fathom is privacy-focused (Canada). DPA is part of their Terms. No separate action needed.",
  },
];

const PLATFORM_VENDORS: Record<string, VendorInfo> = {
  webflow: {
    name: "Webflow (hosting)",
    country: "us",
    patterns: [],
    dpaStatus: "covered-by-tos",
    dpaNote: "Webflow's DPA is part of their Terms of Service. No separate action needed.",
    dpfCertified: true,
    dpfNote: "Webflow, Inc. is DPF-certified.",
  },
  hubspot: {
    name: "HubSpot (hosting)",
    country: "us",
    patterns: [],
    dpaStatus: "covered-by-tos",
    dpaNote: "HubSpot's DPA is part of their Customer Terms. No separate action needed.",
    dpfCertified: true,
    dpfNote: "HubSpot, Inc. is DPF-certified.",
  },
};

export function detectVendors(
  scripts: { src: string }[],
  platform?: string | null,
): DetectedVendor[] {
  const found = new Map<string, DetectedVendor>();

  if (platform && PLATFORM_VENDORS[platform]) {
    const v = PLATFORM_VENDORS[platform];
    found.set(v.name, {
      name: v.name,
      country: v.country,
      detectedVia: "Site platform",
      dpaStatus: v.dpaStatus,
      dpaNote: v.dpaNote,
      dpfCertified: v.dpfCertified,
      dpfNote: v.dpfNote,
    });
  }

  for (const script of scripts) {
    const src = script.src;
    if (!src) continue;

    for (const vendor of VENDORS) {
      if (found.has(vendor.name)) continue;
      for (const pattern of vendor.patterns) {
        if (pattern.test(src)) {
          found.set(vendor.name, {
            name: vendor.name,
            country: vendor.country,
            detectedVia: `Script: ${src.slice(0, 80)}`,
            dpaStatus: vendor.dpaStatus,
            dpaNote: vendor.dpaNote,
            dpfCertified: vendor.dpfCertified,
            dpfNote: vendor.dpfNote,
          });
          break;
        }
      }
    }
  }

  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
}
