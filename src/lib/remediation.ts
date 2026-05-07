export interface RemediationStep {
  instruction: string;
  platform?: "webflow" | "hubspot" | "nextjs" | "all";
  needsDevOrLegal?: boolean;
}

export interface RemediationInfo {
  plainExplanation: string;
  steps: RemediationStep[];
  devLegalNote?: string;
  docLinks?: { label: string; url: string }[];
}

export const REMEDIATION: Record<string, RemediationInfo> = {
  A1: {
    plainExplanation: "Scripts in the site header run immediately when a visitor loads the page, before they get a chance to accept or decline cookies. Only the GTM container and the consent manager (Cookiebot) should be here - everything else needs to go through GTM so consent rules apply.",
    steps: [
      { instruction: "Open site CMS > Custom Code > Head Code section", platform: "all" },
      { instruction: "Webflow: Site settings > Custom Code > Head Code", platform: "webflow" },
      { instruction: "HubSpot: Settings > Content > Pages > Site header HTML", platform: "hubspot" },
      { instruction: "Remove any scripts that are not the GTM container snippet or Cookiebot", platform: "all" },
      { instruction: "Re-add each removed script as a GTM tag with proper consent triggers*", platform: "all", needsDevOrLegal: true },
      { instruction: "Also check individual page head code settings for stray scripts", platform: "webflow" },
    ],
    devLegalNote: "When moving a script into GTM, you need to assign it to the correct consent category (marketing, statistics, preferences, or necessary). This determines when the script is allowed to run and has legal implications - the classification should be reviewed with someone familiar with the site's data processing purposes.",
    docLinks: [
      { label: "GTM: Create a new tag", url: "https://support.google.com/tagmanager/answer/6106716" },
    ],
  },

  A2: {
    plainExplanation: "Scripts in the footer also run without waiting for consent. The only exception is the Cookiebot Cookie Declaration script on the cookie policy page, which just displays the cookie list and doesn't track anything.",
    steps: [
      { instruction: "Open site CMS > Custom Code > Footer Code section", platform: "all" },
      { instruction: "Webflow: Site settings > Custom Code > Footer Code", platform: "webflow" },
      { instruction: "Remove all scripts except the Cookiebot Cookie Declaration (if on cookie policy page)", platform: "all" },
      { instruction: "Re-add each removed script as a GTM tag with consent triggers*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "Each script moved into GTM must be assigned to the correct consent category (marketing, statistics, preferences, or necessary). This classification affects when the script runs and should be reviewed with someone who knows the site's data processing purposes.",
  },

  B1: {
    plainExplanation: "Known tracking scripts (like Google Analytics, Meta Pixel, or HubSpot) were found loading directly from the site code instead of through GTM. This means they run regardless of whether the visitor has given consent, which violates GDPR.",
    steps: [
      { instruction: "Identify which tracking scripts are loading outside GTM from the findings above", platform: "all" },
      { instruction: "For each script: remove from site code and create a corresponding GTM tag*", platform: "all", needsDevOrLegal: true },
      { instruction: "Set appropriate consent triggers on each new GTM tag (analytics_storage or ad_storage)*", platform: "all", needsDevOrLegal: true },
      { instruction: "Verify in GTM Preview Mode that tags fire only after consent", platform: "all" },
    ],
    devLegalNote: "Each tracking script needs to be assigned to a consent category: 'analytics_storage' for analytics tools (Google Analytics, HotJar, etc.) or 'ad_storage' for advertising pixels (Meta, LinkedIn, etc.). This classification determines which consent checkbox controls when the script runs.",
    docLinks: [
      { label: "GTM: Consent overview for tags", url: "https://support.google.com/tagmanager/answer/10718549" },
    ],
  },

  D1: {
    plainExplanation: "These scripts belong to services that may no longer be in use (e.g. an old analytics or chat tool that was tried and abandoned). If the service is no longer needed, the script is just collecting data for nothing - and still requires consent.",
    steps: [
      { instruction: "Verify with the client whether each flagged service is still in active use", platform: "all" },
      { instruction: "If discontinued: remove the script from the site header/footer or from GTM", platform: "all" },
      { instruction: "If still in use: ensure it's managed through GTM with consent triggers*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "If the service is still needed, move it into GTM and assign the correct consent category based on what the service does (analytics tools go under statistics, marketing tools under marketing, etc.).",
  },

  D3: {
    plainExplanation: "Advertising pixels (Meta, LinkedIn, TikTok, etc.) were found directly in the site header instead of inside GTM. These pixels track visitors for ad targeting and must only run after the visitor explicitly consents to marketing cookies.",
    steps: [
      { instruction: "Remove each orphaned pixel from the site header custom code", platform: "all" },
      { instruction: "Re-create each pixel as a GTM tag with ad_storage consent requirement*", platform: "all", needsDevOrLegal: true },
      { instruction: "Use the official GTM templates when available (Meta Pixel, LinkedIn Insight, etc.)", platform: "all" },
    ],
    devLegalNote: "Advertising pixels must be assigned to the 'ad_storage' consent category in GTM. This means they will only fire after a visitor clicks 'Accept' on the marketing category in the consent banner.",
    docLinks: [
      { label: "Meta Pixel GTM template", url: "https://www.facebook.com/business/help/1021909254506499" },
    ],
  },

  E1: {
    plainExplanation: "Standard YouTube embeds set cookies and track visitors as soon as the page loads, even if the visitor never clicks play. The privacy-enhanced mode (youtube-nocookie.com) prevents this by only setting cookies when the visitor interacts with the video.",
    steps: [
      { instruction: "Replace youtube.com/embed URLs with youtube-nocookie.com/embed", platform: "all" },
      { instruction: "Webflow: Edit the embed element > change the iframe src URL", platform: "webflow" },
      { instruction: "Next.js: Update the iframe src in your component code", platform: "nextjs" },
      { instruction: "For Vimeo: implement click-to-load (show thumbnail, load iframe only after user clicks)*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "Vimeo does not have a no-cookie mode like YouTube. The recommended approach is click-to-load: show a thumbnail image of the video, and only load the actual Vimeo player when the visitor clicks it (or after they consent to marketing cookies).",
    docLinks: [
      { label: "YouTube privacy-enhanced mode", url: "https://support.google.com/youtube/answer/171780" },
    ],
  },

  E2: {
    plainExplanation: "Google Fonts loaded from Google's servers cause the visitor's IP address to be sent to Google on every page load, without consent. A German court set a precedent of EUR 100 per violation. The fix is simple: download the font files and host them on the site's own server.",
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
    plainExplanation: "Embedded Google Maps sends the visitor's IP address to Google as soon as the page loads, even if the visitor never interacts with the map. This counts as a data transfer that requires consent.",
    steps: [
      { instruction: "Option 1: Replace interactive map with a static image + link to Google Maps", platform: "all" },
      { instruction: "Option 2: Implement click-to-load (show placeholder image, load map iframe only after user clicks)*", platform: "all", needsDevOrLegal: true },
      { instruction: "Option 3: Gate map loading behind marketing/statistics consent category in Cookiebot*", platform: "all", needsDevOrLegal: true },
      { instruction: "Webflow: Replace embed element with image + link component", platform: "webflow" },
    ],
    devLegalNote: "If using consent-gated loading, the map script should be assigned to the 'statistics' or 'marketing' consent category depending on how the data is used. A static image with a link to Google Maps is the simplest option and requires no consent configuration.",
  },

  E4: {
    plainExplanation: "Chat widgets (like Intercom, Drift, Crisp) often set cookies and track visitor behavior as soon as they load. If the chat is not strictly necessary for the site to function, it needs to wait for the visitor's consent before loading.",
    steps: [
      { instruction: "Move the chat widget script from site code into GTM*", platform: "all", needsDevOrLegal: true },
      { instruction: "Set consent trigger on the GTM tag (typically preferences or marketing category)*", platform: "all", needsDevOrLegal: true },
      { instruction: "Alternative: check if the chat provider offers a consent-aware loading option", platform: "all" },
    ],
    devLegalNote: "Chat widgets that only provide customer support typically go under 'preferences'. If the widget also tracks behavior or feeds into marketing automation (like HubSpot Chat), it should go under 'marketing'. Check what cookies the widget sets to decide.",
  },

  E5: {
    plainExplanation: "Social media embeds (Facebook feeds, Twitter widgets, Instagram posts) load external scripts that track visitors across sites. They need consent before loading, or should be replaced with simple links to the social profiles.",
    steps: [
      { instruction: "Move social embed scripts from site code into GTM with consent triggers*", platform: "all", needsDevOrLegal: true },
      { instruction: "For iframe embeds: implement click-to-load or gate behind consent*", platform: "all", needsDevOrLegal: true },
      { instruction: "Alternative: use simple text links to social profiles instead of embedded widgets", platform: "all" },
    ],
    devLegalNote: "Social media embeds that track visitors should be assigned to the 'marketing' consent category. Simple links to social profiles don't require consent since they don't load any external scripts.",
  },

  F2: {
    plainExplanation: "GDPR requires data minimization: only collect personal data that is actually needed for the form's purpose. A contact form asking for a phone number, company size, or birthday when none of those are necessary is over-collecting.",
    steps: [
      { instruction: "Review each form field flagged and determine if it's necessary for the form's purpose", platform: "all" },
      { instruction: "Remove fields that aren't needed, or make them optional with clear labeling", platform: "all" },
      { instruction: "If a field is legally required, document the justification*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "If a field collects data beyond what's obviously needed (e.g. a newsletter signup asking for a home address), there should be a documented business reason. This justification may be needed if a data protection authority asks why that data is collected.",
  },

  F3: {
    plainExplanation: "Visitors must know how their personal data will be used before they submit a form. A link to the privacy policy at or near the form tells them where to find this information.",
    steps: [
      { instruction: "Add a privacy policy link at or near each form that collects personal data", platform: "all" },
      { instruction: "Webflow: Add a text block below the form with a link to the privacy policy page", platform: "webflow" },
      { instruction: "Use clear text like 'By submitting this form, your data is processed per our Privacy Policy'", platform: "all" },
      { instruction: "Link text should be visible and styled as a clickable link", platform: "all" },
    ],
  },

  F4: {
    plainExplanation: "GDPR requires that consent is specific and freely given. A single checkbox that says 'I agree to receive marketing AND accept the terms' bundles two different things together. Each purpose needs its own separate checkbox, and none can be pre-ticked.",
    steps: [
      { instruction: "Separate bundled consent checkboxes into individual checkboxes per purpose", platform: "all" },
      { instruction: "Ensure all consent checkboxes are unchecked by default (no pre-ticking)", platform: "all" },
      { instruction: "Label each checkbox clearly: one for inquiry/service, one for marketing/newsletter", platform: "all" },
      { instruction: "Marketing consent must be optional - form submission should work without it*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "The form must work even if the visitor only checks the required boxes (like accepting terms) and leaves optional ones unchecked (like marketing). If the form fails to submit without marketing consent, that's forced consent and violates GDPR.",
  },

  F5: {
    plainExplanation: "Forms that submit over HTTP (not HTTPS) send personal data unencrypted across the internet. Anyone on the same network could intercept the data. All form submissions must use HTTPS.",
    steps: [
      { instruction: "Change the form action URL from http:// to https://", platform: "all" },
      { instruction: "If the form endpoint doesn't support HTTPS, contact the form service provider*", platform: "all", needsDevOrLegal: true },
      { instruction: "Webflow native forms already use HTTPS - check third-party form integrations", platform: "webflow" },
    ],
    devLegalNote: "If the form service provider does not support HTTPS, they should not be used for collecting personal data. Consider switching to a provider that does.",
  },

  F6: {
    plainExplanation: "Swedish personnummer (personal identity number) is classified as specially protected data under Swedish law. Collecting it requires a specific and documented need - it can't be collected 'just in case' or for convenience.",
    steps: [
      { instruction: "Search all forms on the site for fields collecting personnummer, samordningsnummer, or similar national ID numbers", platform: "all" },
      { instruction: "For each field found: document the business justification for why personnummer is needed*", platform: "all", needsDevOrLegal: true },
      { instruction: "If the form's purpose can be achieved without personnummer, remove the field", platform: "all" },
      { instruction: "If personnummer is genuinely needed: make the field optional if possible, and add clear text explaining why it is needed", platform: "all" },
      { instruction: "Ensure the privacy policy specifically mentions personnummer processing and the legal basis*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "Under the Swedish Data Protection Act (2018:218), processing personnummer requires that it is 'clearly justified' by the purpose. The privacy policy must state why personnummer is collected, the legal basis for processing it, and how it is protected.",
    docLinks: [
      { label: "Dataskyddslagen (2018:218) - English", url: "https://www.government.se/government-policy/the-constitution-of-sweden-and-personal-privacy/act-containing-supplementary-provisions-to-the-eu-sfs-2018218-general-data-protection-regulation/" },
    ],
  },

  G2: {
    plainExplanation: "If the 'Accept' button is big and green but 'Reject' is small, grey, or hidden behind a 'Settings' link, that's a dark pattern. Both choices must be equally easy to find and click. EU regulators actively enforce this.",
    steps: [
      { instruction: "Ensure Accept and Reject/Decline buttons have the same visual weight", platform: "all" },
      { instruction: "Cookiebot: Go to Cookiebot admin > Banner > Layout and ensure Reject is on the same layer as Accept", platform: "all" },
      { instruction: "Both buttons should be the same size, same styling, same number of clicks to reach", platform: "all" },
      { instruction: "EDPB Cookie Banner Taskforce: reject must be available on the first layer, not hidden in settings*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "The EDPB (European Data Protection Board) has explicitly stated that rejecting cookies must be as easy as accepting them. Hiding 'Reject' behind a settings menu or making it visually less prominent than 'Accept' counts as a dark pattern and can result in enforcement action.",
    docLinks: [
      { label: "Cookiebot: Banner customization", url: "https://www.cookiebot.com/en/help/banner-layout/" },
    ],
  },

  G6: {
    plainExplanation: "The consent banner should appear in the same language as the page content. A Swedish site showing an English consent banner (or vice versa) makes it harder for visitors to understand what they're agreeing to, which undermines informed consent.",
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
    plainExplanation: "Dark patterns are design tricks that push visitors toward accepting cookies when they might not want to. Pre-ticked boxes, guilt-trip language ('you'll miss out!'), cookie walls that block the site, or making 'Reject' hard to find are all violations.",
    steps: [
      { instruction: "Fix any pre-ticked consent checkboxes (must be unticked by default)", platform: "all" },
      { instruction: "Add a visible Reject/Decline All button on the same layer as Accept All", platform: "all" },
      { instruction: "Remove guilt language or manipulative wording from the banner text", platform: "all" },
      { instruction: "Cookiebot: Go to admin > Banner > Text and review all banner copy", platform: "all" },
      { instruction: "Ensure declining cookies does not block access to site content (no cookie walls)*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "Cookie walls (blocking site access until the visitor consents) are generally not allowed under GDPR unless the site genuinely offers an equivalent alternative (which is rare). If declining cookies causes any part of the site to become inaccessible, that's a compliance issue.",
  },

  I1: {
    plainExplanation: "GDPR Article 13 lists 12 specific things that must be in a privacy policy (like who controls the data, why it's collected, how long it's kept, and the visitor's rights). Missing any of these is a compliance gap.",
    steps: [
      { instruction: "Review the privacy policy against the 12 required GDPR Art. 13 elements listed in the findings*", platform: "all", needsDevOrLegal: true },
      { instruction: "Add any missing elements identified by the audit*", platform: "all", needsDevOrLegal: true },
      { instruction: "Ensure legal basis is stated for each processing purpose (not just 'legitimate interest' for everything)*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "Updating a privacy policy is a legal task - the content must be accurate and reflect the actual data processing that happens on the site. Work with someone who understands the site's data flows and the legal requirements.",
  },

  I2: {
    plainExplanation: "If the site has content in multiple languages, the privacy policy must also be available in each of those languages. A Swedish visitor browsing a Swedish site should not need to read an English privacy policy to understand how their data is handled.",
    steps: [
      { instruction: "Create translated versions of the privacy policy for each language the site supports*", platform: "all", needsDevOrLegal: true },
      { instruction: "Link each translated privacy policy from the corresponding language version of the site", platform: "all" },
    ],
    devLegalNote: "Translations should be done by someone who understands legal language in the target language. Machine translations of legal text can introduce inaccuracies that create compliance issues.",
  },

  I3: {
    plainExplanation: "Visitors need a dedicated page where they can see exactly which cookies the site uses, what each cookie does, and how long it lasts. Cookiebot can generate this list automatically using the Cookie Declaration script.",
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
    plainExplanation: "The privacy policy must be easy to find from every page on the site. A link in the footer is the standard location that visitors expect. Without it, visitors have no straightforward way to learn how their data is handled.",
    steps: [
      { instruction: "Add a 'Privacy Policy' link to the site footer", platform: "all" },
      { instruction: "Webflow: Open the footer symbol/component and add a text link", platform: "webflow" },
      { instruction: "The link should be visible on every page (use a global footer component)", platform: "all" },
      { instruction: "For Swedish sites: label it 'Integritetspolicy' or 'Dataskyddspolicy'", platform: "all" },
    ],
  },

  G1: {
    plainExplanation: "No cookie consent banner was found on this site. Without one, tracking scripts (like Google Analytics) may collect visitor data without asking for permission first, which violates GDPR.",
    steps: [
      { instruction: "Open the site in an incognito/private browser window and check if a cookie banner appears", platform: "all" },
      { instruction: "If no banner appears, check whether the client has a Cookiebot subscription at cookiebot.com", platform: "all" },
      { instruction: "If they have Cookiebot: add the Cookiebot CMP tag inside GTM with trigger 'Consent Initialization - All Pages'", platform: "all" },
      { instruction: "If they don't have Cookiebot: flag this to the client - they need a consent solution before tracking is compliant", platform: "all" },
    ],
    docLinks: [
      { label: "Cookiebot: Getting started", url: "https://www.cookiebot.com/en/help/" },
    ],
  },

  I8: {
    plainExplanation: "A privacy policy that is hard to read defeats its purpose. GDPR requires that privacy information is provided in 'clear and plain language'. Long walls of legal text with no structure or headings make it practically impossible for a normal person to understand their rights.",
    steps: [
      { instruction: "Restructure the privacy policy with clear headings and sections*", platform: "all", needsDevOrLegal: true },
      { instruction: "Add a table of contents at the top if the policy is longer than 1000 words", platform: "all" },
      { instruction: "Replace legal jargon with plain language, or add explanations in parentheses*", platform: "all", needsDevOrLegal: true },
      { instruction: "Add a 'Last updated' date at the top of the policy", platform: "all" },
      { instruction: "Consider adding a short summary/overview section before the full details", platform: "all" },
    ],
    devLegalNote: "Simplifying a privacy policy doesn't mean removing legally required content. It means restructuring and rewording so a non-lawyer can understand it. Consider a layered approach: a simple overview first, then the full legal detail below.",
  },

  G4: {
    plainExplanation: "The consent banner is only useful if it actually controls what happens. If tracking scripts and cookies still fire after a visitor clicks 'Decline', the banner is just decoration - and the site is collecting data without permission.",
    steps: [
      { instruction: "Open the site in a fresh incognito/private window with DevTools open (F12 > Network tab)", platform: "all" },
      { instruction: "When the consent banner appears, click 'Decline' or 'Reject All'", platform: "all" },
      { instruction: "Check the Network tab for requests to tracking domains (google-analytics.com, facebook.net, linkedin.com, etc.) - there should be none", platform: "all" },
      { instruction: "Check DevTools > Application > Cookies - only the CookieConsent cookie (and necessary cookies like __cf_bm) should exist", platform: "all" },
      { instruction: "If tracking requests or cookies appear after declining: check GTM consent settings for each tag that fired*", platform: "all", needsDevOrLegal: true },
      { instruction: "In GTM: open each non-Google tag > Advanced Settings > Consent Settings > enable 'Require additional consent' with the correct type*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "Each tag in GTM needs the correct consent type: 'ad_storage' for marketing/advertising tags, 'analytics_storage' for analytics tags. Google's own tags handle this automatically via Consent Mode, but all third-party tags need manual configuration.",
    docLinks: [
      { label: "GTM: Consent overview for tags", url: "https://support.google.com/tagmanager/answer/10718549" },
    ],
  },

  G5: {
    plainExplanation: "When a visitor makes a consent choice and comes back later, they shouldn't see the banner again. The choice is stored in a cookie (usually called 'CookieConsent'). If it's not persisting, either the cookie is being cleared or the consent manager isn't configured correctly.",
    steps: [
      { instruction: "Open the site in a normal (non-incognito) browser window", platform: "all" },
      { instruction: "Make a consent choice (accept or decline) on the banner", platform: "all" },
      { instruction: "Close the tab completely, then reopen the site", platform: "all" },
      { instruction: "The banner should NOT reappear - the previous choice should be remembered", platform: "all" },
      { instruction: "If the banner reappears: check DevTools > Application > Cookies for a 'CookieConsent' cookie and verify its expiry date", platform: "all" },
      { instruction: "In Cookiebot admin: check that the consent cookie lifetime is set (typically 12 months)", platform: "all" },
      { instruction: "Check that no other script or cache plugin is clearing cookies on each visit", platform: "all" },
    ],
  },

  H6: {
    plainExplanation: "This is the direct check - looking at what cookies actually exist in the browser at each stage. Before consent: only essential cookies. After declining: still only essential cookies. After accepting: tracking cookies appear. If tracking cookies show up before or after declining consent, something is wrong.",
    steps: [
      { instruction: "Open a fresh incognito window and go to DevTools > Application > Cookies (before interacting with the banner)", platform: "all" },
      { instruction: "Only the CookieConsent cookie and necessary cookies (like __cf_bm from Cloudflare) should exist at this point", platform: "all" },
      { instruction: "Click 'Decline All' on the consent banner, then check cookies again - no new tracking cookies should appear", platform: "all" },
      { instruction: "Tracking cookies to look for: _ga, _gid (Google Analytics), _fbp (Meta), _gcl_au (Google Ads), li_fat_id (LinkedIn), _hjSession (HotJar)", platform: "all" },
      { instruction: "Open a new incognito window, accept all cookies, and verify tracking cookies now appear", platform: "all" },
      { instruction: "If tracking cookies appear before consent or after declining: the corresponding scripts need consent gating in GTM*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "Each tracking cookie comes from a specific script/tag. Identify which tag sets the cookie, then configure that tag's consent settings in GTM. Google tags use Consent Mode automatically; non-Google tags need 'Require additional consent' enabled manually.",
  },

  H8: {
    plainExplanation: "Cookies aren't the only way websites store data on your device. localStorage, sessionStorage, and IndexedDB can also be used for tracking - and the same consent rules apply. Some scripts use these instead of cookies specifically to avoid cookie consent checks, which is not allowed.",
    steps: [
      { instruction: "Open a fresh incognito window with DevTools > Application panel open", platform: "all" },
      { instruction: "Before interacting with the consent banner, check Local Storage, Session Storage, and IndexedDB", platform: "all" },
      { instruction: "Look for entries from known tracking services (analytics IDs, marketing pixel data, session replay tools)", platform: "all" },
      { instruction: "Click 'Decline All', then check again - no new tracking-related entries should appear", platform: "all" },
      { instruction: "Common tracking storage to look for: _ga (Google Analytics), amplitude_*, _hjSession*, crisp-client/*", platform: "all" },
      { instruction: "If tracking storage appears before consent: the script setting it needs to be moved behind consent gating in GTM*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "The ePrivacy rules cover all 'storage and access' on the user's device, not just cookies. Scripts that write to localStorage or IndexedDB for tracking purposes need the same consent controls as cookie-based tracking.",
  },

  K1: {
    plainExplanation: "EU and EEA visitors must see a full opt-in consent banner. This means all non-essential cookies and scripts are blocked until the visitor actively clicks 'Accept'. This is the strictest consent model and is required by EU law. Most consent managers like Cookiebot handle this via geo-targeting settings.",
    steps: [
      { instruction: "Open the Cookiebot admin panel > Settings > Geo-targeting", platform: "all" },
      { instruction: "Verify that EU/EEA regions are configured with the 'Opt-in' consent model", platform: "all" },
      { instruction: "If geo-targeting is not set up: the safe default is to apply opt-in rules to all visitors globally", platform: "all" },
      { instruction: "Test by visiting the site from an EU location (or use a VPN/browser extension to simulate EU)", platform: "all" },
      { instruction: "Verify the banner shows: Accept All, Reject All, and a way to customize individual categories", platform: "all" },
      { instruction: "After declining: verify no non-essential cookies are set (check DevTools > Application > Cookies)", platform: "all" },
    ],
    docLinks: [
      { label: "Cookiebot: Geo-targeting consent models", url: "https://www.cookiebot.com/en/help/regional-consent/" },
    ],
  },

  K2: {
    plainExplanation: "US privacy laws (like California's CCPA/CPRA) use an opt-out model instead of opt-in. This means tracking can start by default, but visitors must be able to say 'stop'. The site needs a visible 'Do Not Sell or Share My Personal Information' link, and must honor the browser's Global Privacy Control (GPC) signal.",
    steps: [
      { instruction: "Check Cookiebot admin > Settings > Geo-targeting for US region configuration", platform: "all" },
      { instruction: "Verify the US region uses an 'Opt-out' or 'Informational' consent model (not the strict EU opt-in)", platform: "all" },
      { instruction: "Check for a 'Do Not Sell or Share My Personal Information' link on the site (usually in the footer)", platform: "all" },
      { instruction: "Verify the link opens a working opt-out mechanism", platform: "all" },
      { instruction: "Test with a VPN set to a US location to confirm the correct banner appears", platform: "all" },
      { instruction: "If the site has minimal US traffic: this check may be N/A, but document the decision", platform: "all" },
    ],
    docLinks: [
      { label: "Cookiebot: CCPA compliance", url: "https://www.cookiebot.com/en/ccpa-compliance/" },
    ],
  },

  K3: {
    plainExplanation: "UK rules changed in February 2026. Marketing cookies still need opt-in consent, but analytics cookies can now load without consent IF four conditions are all met: they're only used for service improvement, visitors are informed, an opt-out is provided, and the analytics provider doesn't use the data for its own purposes. If any condition isn't met, opt-in consent is still required.",
    steps: [
      { instruction: "Check Cookiebot admin > Settings > Geo-targeting for UK region configuration", platform: "all" },
      { instruction: "Marketing and advertising cookies: must still require opt-in consent for UK visitors", platform: "all" },
      { instruction: "Analytics cookies: check if all 4 exemption conditions are met before allowing without consent*", platform: "all", needsDevOrLegal: true },
      { instruction: "Condition 1: analytics data is used solely for service improvement (not ads or profiling)", platform: "all" },
      { instruction: "Condition 2: visitors are given clear information about the analytics cookies", platform: "all" },
      { instruction: "Condition 3: a simple, free opt-out mechanism is provided", platform: "all" },
      { instruction: "Condition 4: the analytics provider (e.g. Google) does NOT use the data for its own purposes - check Google Analytics data sharing settings*", platform: "all", needsDevOrLegal: true },
      { instruction: "When in doubt: apply the stricter EU opt-in rules to UK visitors as well", platform: "all" },
    ],
    devLegalNote: "The UK analytics exemption is new (Feb 2026) and nuanced. Google Analytics typically shares data with Google for benchmarking and ads by default - if those settings are enabled, the exemption does NOT apply. Check GA admin > Data settings > Data sharing to verify.",
  },

  K4: {
    plainExplanation: "Global Privacy Control (GPC) is a setting in some browsers and extensions that sends a 'do not sell or share my data' signal to every website. As of 2026, at least 11 US states legally require websites to honor this signal. Cookiebot can detect GPC automatically - but it needs to be enabled.",
    steps: [
      { instruction: "Check Cookiebot admin panel for GPC detection settings - verify it's enabled", platform: "all" },
      { instruction: "Install a GPC browser extension (like Privacy Badger or OptMeowt) for testing", platform: "all" },
      { instruction: "Visit the site with GPC enabled and verify the consent manager detects the signal", platform: "all" },
      { instruction: "With GPC active: marketing and advertising scripts should not fire", platform: "all" },
      { instruction: "Check for a visible 'Do Not Sell/Share' link on the site for US visitors (often combined with K2)", platform: "all" },
      { instruction: "If the site doesn't target US audiences: this check may be N/A, but document the decision", platform: "all" },
    ],
    docLinks: [
      { label: "Global Privacy Control specification", url: "https://globalprivacycontrol.github.io/gpc-spec/" },
      { label: "Cookiebot: GPC support", url: "https://www.cookiebot.com/en/help/gpc-global-privacy-control/" },
    ],
  },
};
