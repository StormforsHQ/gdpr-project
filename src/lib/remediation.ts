export interface RemediationStep {
  instruction: string;
  platform?: "webflow" | "hubspot" | "nextjs" | "all";
  needsDevOrLegal?: boolean;
}

export interface RemediationInfo {
  steps: RemediationStep[];
  docLinks?: { label: string; url: string }[];
}

export const REMEDIATION: Record<string, RemediationInfo> = {
  A1: {
    steps: [
      { instruction: "Open site CMS > Custom Code > Head Code section", platform: "all" },
      { instruction: "Webflow: Site settings > Custom Code > Head Code", platform: "webflow" },
      { instruction: "HubSpot: Settings > Content > Pages > Site header HTML", platform: "hubspot" },
      { instruction: "Remove any scripts that are not the GTM container snippet or Cookiebot", platform: "all" },
      { instruction: "Re-add each removed script as a GTM tag with proper consent triggers", platform: "all", needsDevOrLegal: true },
      { instruction: "Also check individual page head code settings for stray scripts", platform: "webflow" },
    ],
    docLinks: [
      { label: "GTM: Create a new tag", url: "https://support.google.com/tagmanager/answer/6106716" },
    ],
  },

  A2: {
    steps: [
      { instruction: "Open site CMS > Custom Code > Footer Code section", platform: "all" },
      { instruction: "Webflow: Site settings > Custom Code > Footer Code", platform: "webflow" },
      { instruction: "Remove all scripts except the Cookiebot Cookie Declaration (if on cookie policy page)", platform: "all" },
      { instruction: "Re-add each removed script as a GTM tag with consent triggers", platform: "all", needsDevOrLegal: true },
    ],
  },

  B1: {
    steps: [
      { instruction: "Identify which tracking scripts are loading outside GTM from the findings above", platform: "all" },
      { instruction: "For each script: remove from site code and create a corresponding GTM tag", platform: "all", needsDevOrLegal: true },
      { instruction: "Set appropriate consent triggers on each new GTM tag (analytics_storage or ad_storage)", platform: "all", needsDevOrLegal: true },
      { instruction: "Verify in GTM Preview Mode that tags fire only after consent", platform: "all" },
    ],
    docLinks: [
      { label: "GTM: Consent overview for tags", url: "https://support.google.com/tagmanager/answer/10718549" },
    ],
  },

  D1: {
    steps: [
      { instruction: "Verify with the client whether each flagged service is still in active use", platform: "all" },
      { instruction: "If discontinued: remove the script from the site header/footer or from GTM", platform: "all" },
      { instruction: "If still in use: ensure it's managed through GTM with consent triggers", platform: "all", needsDevOrLegal: true },
    ],
  },

  D3: {
    steps: [
      { instruction: "Remove each orphaned pixel from the site header custom code", platform: "all" },
      { instruction: "Re-create each pixel as a GTM tag with ad_storage consent requirement", platform: "all", needsDevOrLegal: true },
      { instruction: "Use the official GTM templates when available (Meta Pixel, LinkedIn Insight, etc.)", platform: "all" },
    ],
    docLinks: [
      { label: "Meta Pixel GTM template", url: "https://www.facebook.com/business/help/1021909254506499" },
    ],
  },

  E1: {
    steps: [
      { instruction: "Replace youtube.com/embed URLs with youtube-nocookie.com/embed", platform: "all" },
      { instruction: "Webflow: Edit the embed element > change the iframe src URL", platform: "webflow" },
      { instruction: "Next.js: Update the iframe src in your component code", platform: "nextjs" },
      { instruction: "For Vimeo: implement click-to-load (show thumbnail, load iframe only after user clicks)", platform: "all", needsDevOrLegal: true },
    ],
    docLinks: [
      { label: "YouTube privacy-enhanced mode", url: "https://support.google.com/youtube/answer/171780" },
    ],
  },

  E2: {
    steps: [
      { instruction: "Download the font files from Google Fonts (fonts.google.com > Download family)", platform: "all" },
      { instruction: "Webflow: Upload font files via Site settings > Fonts > Upload Custom Fonts", platform: "webflow" },
      { instruction: "Next.js: Use next/font/local or fontsource package for self-hosting", platform: "nextjs" },
      { instruction: "Remove all <link> tags referencing fonts.googleapis.com or fonts.gstatic.com", platform: "all" },
      { instruction: "Remove any @import rules referencing Google Fonts from CSS files", platform: "all" },
      { instruction: "Test that fonts load correctly from the local domain", platform: "all" },
    ],
    docLinks: [
      { label: "Fontsource (npm packages for self-hosting)", url: "https://fontsource.org/" },
      { label: "Webflow: Upload custom fonts", url: "https://university.webflow.com/lesson/custom-fonts" },
      { label: "Next.js: next/font documentation", url: "https://nextjs.org/docs/app/building-your-application/optimizing/fonts" },
    ],
  },

  E3: {
    steps: [
      { instruction: "Option 1: Replace interactive map with a static image + link to Google Maps", platform: "all" },
      { instruction: "Option 2: Implement click-to-load (show placeholder image, load map iframe only after user clicks)", platform: "all", needsDevOrLegal: true },
      { instruction: "Option 3: Gate map loading behind marketing/statistics consent category in Cookiebot", platform: "all", needsDevOrLegal: true },
      { instruction: "Webflow: Replace embed element with image + link component", platform: "webflow" },
    ],
  },

  E4: {
    steps: [
      { instruction: "Move the chat widget script from site code into GTM", platform: "all", needsDevOrLegal: true },
      { instruction: "Set consent trigger on the GTM tag (typically preferences or marketing category)", platform: "all", needsDevOrLegal: true },
      { instruction: "Alternative: check if the chat provider offers a consent-aware loading option", platform: "all" },
    ],
  },

  E5: {
    steps: [
      { instruction: "Move social embed scripts from site code into GTM with consent triggers", platform: "all", needsDevOrLegal: true },
      { instruction: "For iframe embeds: implement click-to-load or gate behind consent", platform: "all", needsDevOrLegal: true },
      { instruction: "Alternative: use simple text links to social profiles instead of embedded widgets", platform: "all" },
    ],
  },

  F2: {
    steps: [
      { instruction: "Review each form field flagged and determine if it's necessary for the form's purpose", platform: "all" },
      { instruction: "Remove fields that aren't needed, or make them optional with clear labeling", platform: "all" },
      { instruction: "If a field is legally required, document the justification", platform: "all", needsDevOrLegal: true },
    ],
  },

  F3: {
    steps: [
      { instruction: "Add a privacy policy link at or near each form that collects personal data", platform: "all" },
      { instruction: "Webflow: Add a text block below the form with a link to the privacy policy page", platform: "webflow" },
      { instruction: "Use clear text like 'By submitting this form, your data is processed per our Privacy Policy'", platform: "all" },
      { instruction: "Link text should be visible and styled as a clickable link", platform: "all" },
    ],
  },

  F4: {
    steps: [
      { instruction: "Separate bundled consent checkboxes into individual checkboxes per purpose", platform: "all" },
      { instruction: "Ensure all consent checkboxes are unchecked by default (no pre-ticking)", platform: "all" },
      { instruction: "Label each checkbox clearly: one for inquiry/service, one for marketing/newsletter", platform: "all" },
      { instruction: "Marketing consent must be optional - form submission should work without it", platform: "all", needsDevOrLegal: true },
    ],
  },

  F5: {
    steps: [
      { instruction: "Change the form action URL from http:// to https://", platform: "all" },
      { instruction: "If the form endpoint doesn't support HTTPS, contact the form service provider", platform: "all", needsDevOrLegal: true },
      { instruction: "Webflow native forms already use HTTPS - check third-party form integrations", platform: "webflow" },
    ],
  },

  F6: {
    steps: [
      { instruction: "Search all forms on the site for fields collecting personnummer, samordningsnummer, or similar national ID numbers", platform: "all" },
      { instruction: "For each field found: document the business justification for why personnummer is needed", platform: "all", needsDevOrLegal: true },
      { instruction: "If the form's purpose can be achieved without personnummer, remove the field", platform: "all" },
      { instruction: "If personnummer is genuinely needed: make the field optional if possible, and add clear text explaining why it is needed", platform: "all" },
      { instruction: "Ensure the privacy policy specifically mentions personnummer processing and the legal basis", platform: "all", needsDevOrLegal: true },
    ],
    docLinks: [
      { label: "Dataskyddslagen (2018:218) - English", url: "https://www.government.se/government-policy/the-constitution-of-sweden-and-personal-privacy/act-containing-supplementary-provisions-to-the-eu-sfs-2018218-general-data-protection-regulation/" },
    ],
  },

  G2: {
    steps: [
      { instruction: "Ensure Accept and Reject/Decline buttons have the same visual weight", platform: "all" },
      { instruction: "Cookiebot: Go to Cookiebot admin > Banner > Layout and ensure Reject is on the same layer as Accept", platform: "all" },
      { instruction: "Both buttons should be the same size, same styling, same number of clicks to reach", platform: "all" },
      { instruction: "EDPB Cookie Banner Taskforce: reject must be available on the first layer, not hidden in settings", platform: "all", needsDevOrLegal: true },
    ],
    docLinks: [
      { label: "Cookiebot: Banner customization", url: "https://www.cookiebot.com/en/help/banner-layout/" },
    ],
  },

  G6: {
    steps: [
      { instruction: "Cookiebot: Go to admin > Settings > Languages and add all languages used on the site", platform: "all" },
      { instruction: "Set the default language to match the site's primary content language", platform: "all" },
      { instruction: "Enable auto-detection if the site serves multiple language versions", platform: "all" },
    ],
    docLinks: [
      { label: "Cookiebot: Multi-language setup", url: "https://www.cookiebot.com/en/help/multi-language/" },
    ],
  },

  G7: {
    steps: [
      { instruction: "Fix any pre-ticked consent checkboxes (must be unticked by default)", platform: "all" },
      { instruction: "Add a visible Reject/Decline All button on the same layer as Accept All", platform: "all" },
      { instruction: "Remove guilt language or manipulative wording from the banner text", platform: "all" },
      { instruction: "Cookiebot: Go to admin > Banner > Text and review all banner copy", platform: "all" },
      { instruction: "Ensure declining cookies does not block access to site content (no cookie walls)", platform: "all", needsDevOrLegal: true },
    ],
  },

  I1: {
    steps: [
      { instruction: "Review the privacy policy against the 12 required GDPR Art. 13 elements listed in the findings", platform: "all", needsDevOrLegal: true },
      { instruction: "Add any missing elements identified by the audit", platform: "all", needsDevOrLegal: true },
      { instruction: "Ensure legal basis is stated for each processing purpose (not just 'legitimate interest' for everything)", platform: "all", needsDevOrLegal: true },
    ],
  },

  I2: {
    steps: [
      { instruction: "Create translated versions of the privacy policy for each language the site supports", platform: "all", needsDevOrLegal: true },
      { instruction: "Link each translated privacy policy from the corresponding language version of the site", platform: "all" },
    ],
  },

  I3: {
    steps: [
      { instruction: "Create a dedicated cookie policy/declaration page on the site", platform: "all" },
      { instruction: "Add the Cookiebot Cookie Declaration script to this page", platform: "all" },
      { instruction: "Webflow: Create a new page, add a Custom Code embed, paste the Cookiebot declaration script", platform: "webflow" },
      { instruction: "Link to this page from the footer and from the consent banner", platform: "all" },
    ],
    docLinks: [
      { label: "Cookiebot: Cookie Declaration setup", url: "https://www.cookiebot.com/en/help/cookie-declaration/" },
    ],
  },

  I4: {
    steps: [
      { instruction: "Add a 'Privacy Policy' link to the site footer", platform: "all" },
      { instruction: "Webflow: Open the footer symbol/component and add a text link", platform: "webflow" },
      { instruction: "The link should be visible on every page (use a global footer component)", platform: "all" },
      { instruction: "For Swedish sites: label it 'Integritetspolicy' or 'Dataskyddspolicy'", platform: "all" },
    ],
  },

  I8: {
    steps: [
      { instruction: "Restructure the privacy policy with clear headings and sections", platform: "all", needsDevOrLegal: true },
      { instruction: "Add a table of contents at the top if the policy is longer than 1000 words", platform: "all" },
      { instruction: "Replace legal jargon with plain language, or add explanations in parentheses", platform: "all", needsDevOrLegal: true },
      { instruction: "Add a 'Last updated' date at the top of the policy", platform: "all" },
      { instruction: "Consider adding a short summary/overview section before the full details", platform: "all" },
    ],
  },
};
