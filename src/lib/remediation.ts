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
      { instruction: "Find the chat widget script in the site code (header/footer custom code, or an embed element). Copy the script code", platform: "all" },
      { instruction: "Remove the script from the site code. In GTM: create a new Custom HTML tag, paste the chat script, set consent to 'Require additional consent' with type 'functionality_storage' (preferences) or 'ad_storage' (marketing) depending on the widget*", platform: "all", needsDevOrLegal: true },
      { instruction: "If the chat provider has a consent-aware mode (e.g. HubSpot chat has a cookie consent setting): enable it in the provider's admin panel instead of managing via GTM", platform: "all" },
      { instruction: "Test: decline all cookies, verify the chat widget does not appear. Accept cookies, verify it loads", platform: "all" },
    ],
    devLegalNote: "Chat widgets that only provide customer support typically go under 'preferences'. If the widget also tracks behavior or feeds into marketing automation (like HubSpot Chat), it should go under 'marketing'. Check what cookies the widget sets to decide.",
  },

  E5: {
    plainExplanation: "Social media embeds (Facebook feeds, Twitter widgets, Instagram posts) load external scripts that track visitors across sites. They need consent before loading, or should be replaced with simple links to the social profiles.",
    steps: [
      { instruction: "Find social media embeds in the page source (Facebook feeds, Twitter/X timelines, Instagram widgets). In Webflow: check embed elements and custom code blocks", platform: "all" },
      { instruction: "Remove the embed script from the site code. In GTM: create a new Custom HTML tag with the embed code, set consent trigger to 'ad_storage' (marketing)*", platform: "all", needsDevOrLegal: true },
      { instruction: "For iframe embeds (e.g. Facebook Page Plugin): replace with a static image/screenshot of the feed + a link to the social profile page. This avoids consent requirements entirely", platform: "all" },
    ],
    devLegalNote: "Social media embeds that track visitors should be assigned to the 'marketing' consent category. Simple links to social profiles don't require consent since they don't load any external scripts.",
  },

  F2: {
    plainExplanation: "GDPR requires data minimization: only collect personal data that is actually needed for the form's purpose. A contact form asking for a phone number, company size, or birthday when none of those are necessary is over-collecting.",
    steps: [
      { instruction: "Open each form on the site and list every field: name, email, phone, company, address, etc.", platform: "all" },
      { instruction: "For each field, ask: would the form's purpose fail without this? A contact form needs name + email, but not phone or company size", platform: "all" },
      { instruction: "Webflow: Edit the form component > delete unnecessary fields or set them to 'Not required' and label them '(optional)'", platform: "webflow" },
      { instruction: "If a field seems excessive but the client insists it's needed: document the business reason in writing*", platform: "all", needsDevOrLegal: true },
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
      { instruction: "Find forms with a single checkbox covering multiple purposes (e.g. 'I agree to terms AND want marketing emails')", platform: "all" },
      { instruction: "Split into separate checkboxes: one per purpose (e.g. 'I accept the terms of service' + 'I want to receive marketing emails')", platform: "all" },
      { instruction: "Webflow: Edit the form > add separate checkbox fields for each consent purpose, set all to unchecked by default", platform: "webflow" },
      { instruction: "Set all consent checkboxes to unchecked by default in the form builder - never pre-tick them", platform: "all" },
      { instruction: "Test: submit the form with the marketing checkbox unchecked - the form must still work*", platform: "all", needsDevOrLegal: true },
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
      { instruction: "Browse all forms on the site and look for fields labeled 'personnummer', 'personal identity number', 'samordningsnummer', 'SSN', or similar national ID fields", platform: "all" },
      { instruction: "For each field found: ask the client why they collect it. Write down the specific business reason (e.g. 'required for insurance claim processing')*", platform: "all", needsDevOrLegal: true },
      { instruction: "If the form works without it (e.g. a contact form or newsletter signup): remove the field entirely. Webflow: edit the form and delete the field", platform: "webflow" },
      { instruction: "If personnummer is genuinely needed: make the field optional if possible, and add helper text next to the field explaining why (e.g. 'Required for identity verification when processing your insurance claim')", platform: "all" },
      { instruction: "Open the privacy policy and add a specific section about personnummer: why it's collected, the legal basis under dataskyddslagen 2018:218, and how it's protected*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "Under the Swedish Data Protection Act (2018:218), processing personnummer requires that it is 'clearly justified' by the purpose. The privacy policy must state why personnummer is collected, the legal basis for processing it, and how it is protected.",
    docLinks: [
      { label: "Dataskyddslagen (2018:218) - English", url: "https://www.government.se/government-policy/the-constitution-of-sweden-and-personal-privacy/act-containing-supplementary-provisions-to-the-eu-sfs-2018218-general-data-protection-regulation/" },
    ],
  },

  G2: {
    plainExplanation: "If the 'Accept' button is big and green but 'Reject' is small, grey, or hidden behind a 'Settings' link, that's a dark pattern. Both choices must be equally easy to find and click. EU regulators actively enforce this.",
    steps: [
      { instruction: "Open the site in incognito and look at the consent banner - compare the Accept and Reject buttons side by side", platform: "all" },
      { instruction: "Cookiebot: Go to admin > Banner > Layout. Set the template to one that shows both Accept All and Reject All as buttons (not a link) on the first screen", platform: "all" },
      { instruction: "Cookiebot: Go to admin > Banner > Styling. Set both buttons to the same size, font weight, and similar color contrast (e.g. both solid-colored, not one solid and one outline/ghost)", platform: "all" },
      { instruction: "Reject must be on the first screen - not hidden behind 'Settings' or 'Customize'. If it's only accessible after clicking into preferences, change the banner layout*", platform: "all", needsDevOrLegal: true },
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
      { instruction: "Cookiebot: Go to admin > Banner > Layout. If the consent dialog uses checkboxes, verify they are all unticked by default. If pre-ticked: change to unticked in the template settings", platform: "all" },
      { instruction: "Cookiebot: Go to admin > Banner > Layout. Choose a template that includes a 'Reject All' button on the first screen, next to 'Accept All'", platform: "all" },
      { instruction: "Remove guilt language or manipulative wording from the banner text (e.g. \"Don't miss out!\", \"We value your experience\", \"Accept to continue enjoying our site\")", platform: "all" },
      { instruction: "Cookiebot: Go to admin > Banner > Text and review all banner copy", platform: "all" },
      { instruction: "Ensure declining cookies does not block access to site content (no cookie walls) - test by clicking Reject All and verifying all pages, content, and features remain fully accessible*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "Cookie walls (blocking site access until the visitor consents) are generally not allowed under GDPR unless the site genuinely offers an equivalent alternative (which is rare). If declining cookies causes any part of the site to become inaccessible, that's a compliance issue.",
  },

  I1: {
    plainExplanation: "GDPR Article 13 lists 12 specific things that must be in a privacy policy (like who controls the data, why it's collected, how long it's kept, and the visitor's rights). Missing any of these is a compliance gap.",
    steps: [
      { instruction: "Open the privacy policy page and check for each of the 12 required Art. 13 items: (1) company name + contact, (2) DPO contact if applicable, (3) each processing purpose + its legal basis, (4) legitimate interests if used, (5) who data is shared with, (6) international transfers, (7) how long data is kept, (8) visitor rights (access, rectify, erase, restrict, port, object), (9) right to withdraw consent, (10) right to complain to a DPA, (11) whether data provision is required, (12) automated decision-making if applicable", platform: "all" },
      { instruction: "For each missing item: draft the text and add it to the privacy policy page. Webflow: edit the privacy policy page content directly*", platform: "all", needsDevOrLegal: true },
      { instruction: "Check that each processing purpose (e.g. analytics, marketing, contact forms) states a specific legal basis - not just 'legitimate interest' for everything. Common bases: consent (marketing), legitimate interest (analytics), contractual necessity (order processing)*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "Updating a privacy policy is a legal task - the content must be accurate and reflect the actual data processing that happens on the site. Work with someone who understands the site's data flows and the legal requirements.",
  },

  I2: {
    plainExplanation: "If the site has content in multiple languages, the privacy policy must also be available in each of those languages. A Swedish visitor browsing a Swedish site should not need to read an English privacy policy to understand how their data is handled.",
    steps: [
      { instruction: "List the languages the site has content in (check the language switcher or URL structure like /en/, /sv/, /de/)", platform: "all" },
      { instruction: "For each language that doesn't have a privacy policy: create a translated version of the policy. Use a professional translator, not just Google Translate, for legal text*", platform: "all", needsDevOrLegal: true },
      { instruction: "Webflow: create a new privacy policy page for each language version, add the translated content, and link to it from that language version's footer", platform: "webflow" },
      { instruction: "Test: switch to each language and click the footer privacy policy link - it should open in the matching language", platform: "all" },
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
      { instruction: "Open the privacy policy page. If it's a wall of text with no headings: add H2 headings for each section (e.g. 'Who we are', 'What data we collect', 'How we use it', 'Your rights', 'Contact us')*", platform: "all", needsDevOrLegal: true },
      { instruction: "If the policy is longer than ~1000 words: add a clickable table of contents at the top with anchor links to each section", platform: "all" },
      { instruction: "Look for dense legal jargon (e.g. 'data subjects may exercise their right to data portability pursuant to Art. 20') and rewrite in plain language (e.g. 'You can ask us to send your data to another service'). Keep the legal reference in parentheses if needed*", platform: "all", needsDevOrLegal: true },
      { instruction: "Add a visible 'Last updated: [date]' line at the top of the policy page", platform: "all" },
      { instruction: "Add a 2-3 sentence summary at the very top: who you are, what data you collect, and how to contact you - then the full details below", platform: "all" },
    ],
    devLegalNote: "Simplifying a privacy policy doesn't mean removing legally required content. It means restructuring and rewording so a non-lawyer can understand it. Consider a layered approach: a simple overview first, then the full legal detail below.",
  },

  A3: {
    plainExplanation: "Cookiebot needs to be the very first thing that runs on the page so visitors see the consent banner before any tracking starts. In GTM, this means using the 'Consent Initialization' trigger, which fires before 'All Pages' and everything else.",
    steps: [
      { instruction: "In GTM, open the site's container workspace and go to Tags. Find the Cookiebot CMP tag", platform: "all" },
      { instruction: "Click on the tag and check its trigger - it should be 'Consent Initialization - All Pages'", platform: "all" },
      { instruction: "If the trigger is 'All Pages' or something else: change it to 'Consent Initialization - All Pages'*", platform: "all", needsDevOrLegal: true },
      { instruction: "If no 'Consent Initialization' trigger exists: create one (Trigger Type > Other > Consent Initialization)", platform: "all" },
      { instruction: "Publish the GTM container and verify the banner appears before any scripts fire", platform: "all" },
    ],
    devLegalNote: "The 'Consent Initialization' trigger is a special GTM trigger type designed specifically for consent management platforms. It fires before all other triggers, ensuring consent is established before any tags run.",
    docLinks: [
      { label: "GTM: Consent Initialization trigger", url: "https://support.google.com/tagmanager/answer/10718549" },
    ],
  },

  A4: {
    plainExplanation: "Cookiebot offers an official GTM template in the Template Gallery that handles Google Consent Mode V2 automatically. Custom HTML implementations often miss consent signals, meaning Google doesn't know whether the visitor consented or not.",
    steps: [
      { instruction: "In GTM, open the site's container workspace and go to Tags. Find the Cookiebot tag", platform: "all" },
      { instruction: "Check if it's a 'Custom HTML' tag or uses the official 'Cookiebot CMP' template", platform: "all" },
      { instruction: "If Custom HTML: go to Templates > Search Gallery > search 'Cookiebot CMP' and add it", platform: "all" },
      { instruction: "Create a new tag using the Cookiebot CMP template with your Cookiebot ID*", platform: "all", needsDevOrLegal: true },
      { instruction: "Set the trigger to 'Consent Initialization - All Pages'", platform: "all" },
      { instruction: "Delete the old Custom HTML Cookiebot tag", platform: "all" },
      { instruction: "Publish and verify the banner still works correctly", platform: "all" },
    ],
    docLinks: [
      { label: "Cookiebot: GTM template setup", url: "https://www.cookiebot.com/en/help/google-tag-manager/" },
    ],
  },

  A5: {
    plainExplanation: "Cookiebot's AutoBlock feature tries to automatically block scripts until consent. The problem is it also blocks the anonymous pings that Google Consent Mode sends, which are allowed even without consent. This breaks your analytics baseline data.",
    steps: [
      { instruction: "Log in to the Cookiebot admin panel", platform: "all" },
      { instruction: "Go to Configuration or Settings", platform: "all" },
      { instruction: "Find the 'AutoBlock' or 'Auto-blocking' setting and make sure it's turned OFF", platform: "all" },
      { instruction: "Save changes", platform: "all" },
      { instruction: "Instead of AutoBlock, rely on GTM's built-in consent controls to manage when tags fire", platform: "all" },
    ],
    docLinks: [
      { label: "Cookiebot: AutoBlock vs Consent Mode", url: "https://www.cookiebot.com/en/help/google-consent-mode/" },
    ],
  },

  B2: {
    plainExplanation: "Google's own tags (GA4, Google Ads, Floodlight) already understand Consent Mode - they automatically adjust their behavior based on consent state. Setting them to 'No additional consent required' lets them send anonymous pings even when consent is denied, which is allowed and useful for modeling.",
    steps: [
      { instruction: "In GTM, open the site's container workspace and go to Tags", platform: "all" },
      { instruction: "For each Google tag (GA4, Google Ads, Conversion Linker, etc.): click the tag", platform: "all" },
      { instruction: "Go to Advanced Settings > Consent Settings", platform: "all" },
      { instruction: "Set to 'No additional consent required' (not 'Require additional consent')*", platform: "all", needsDevOrLegal: true },
      { instruction: "This is correct because Consent Mode already handles consent for Google tags automatically", platform: "all" },
      { instruction: "Publish the container", platform: "all" },
    ],
    devLegalNote: "Google tags with Consent Mode send 'consent pings' even when consent is denied. These pings contain no personal data - they help Google model conversions and traffic. This is allowed under GDPR because no personal data is processed. Adding extra consent requirements on top would block these pings unnecessarily.",
  },

  B3: {
    plainExplanation: "Unlike Google tags, third-party tags (LinkedIn, HotJar, Meta, etc.) don't understand Consent Mode. They fire whenever their trigger activates, regardless of consent. You must explicitly tell GTM to block them until the visitor agrees.",
    steps: [
      { instruction: "In GTM, open the site's container workspace and go to Tags", platform: "all" },
      { instruction: "For each non-Google tag: click the tag > Advanced Settings > Consent Settings", platform: "all" },
      { instruction: "Enable 'Require additional consent'*", platform: "all", needsDevOrLegal: true },
      { instruction: "Add the correct consent type: 'ad_storage' for marketing tags (LinkedIn, Meta, etc.) or 'analytics_storage' for analytics tags (HotJar, Clarity, etc.)*", platform: "all", needsDevOrLegal: true },
      { instruction: "Publish and verify in GTM Preview Mode that these tags only fire after consent is given", platform: "all" },
    ],
    devLegalNote: "The consent type must match what the tag does: ad_storage for anything related to advertising/remarketing, analytics_storage for analytics tools. If a tag does both (rare), add both consent types. Getting this wrong means either blocking too much or not blocking enough.",
    docLinks: [
      { label: "GTM: Consent overview for tags", url: "https://support.google.com/tagmanager/answer/10718549" },
    ],
  },

  B4: {
    plainExplanation: "If a non-Google tag's trigger is 'All Pages', it fires on every page load immediately - before the visitor has seen the consent banner. Even with consent settings on the tag, the 'All Pages' trigger can cause timing issues. Use a consent-aware trigger instead.",
    steps: [
      { instruction: "In GTM, open the site's container workspace and go to Tags. Find each non-Google tag", platform: "all" },
      { instruction: "Check the trigger - if it says 'All Pages', it needs to change", platform: "all" },
      { instruction: "Option 1: Keep 'All Pages' but ensure 'Require additional consent' is set on the tag (simpler, usually sufficient)*", platform: "all", needsDevOrLegal: true },
      { instruction: "Option 2: Create a custom trigger that fires on a consent-granted event (more robust)*", platform: "all", needsDevOrLegal: true },
      { instruction: "Publish and test in GTM Preview Mode - verify the tag appears under 'Tags Not Fired' before consent", platform: "all" },
    ],
    devLegalNote: "Option 1 (consent settings on tag) works in most cases because GTM blocks the tag until consent is granted even on 'All Pages'. Option 2 (custom trigger) is more explicit and recommended by Google for complex setups. Either way, verify the result in Preview Mode.",
  },

  B5: {
    plainExplanation: "Google Consent Mode V2 is the system that tells Google services whether a visitor has consented. Without it, Google doesn't know the consent state and may either track without permission or block everything. All 4 signals must be transmitting: ad_storage, analytics_storage, ad_user_data, and ad_personalization.",
    steps: [
      { instruction: "In GTM, open the site's container workspace and go to Tags. Find the Cookiebot CMP tag", platform: "all" },
      { instruction: "Verify it uses the official Cookiebot template (not Custom HTML) - see check A4", platform: "all" },
      { instruction: "In the tag settings, verify Google Consent Mode is enabled", platform: "all" },
      { instruction: "Check that all 4 default consent states are set: ad_storage=denied, analytics_storage=denied, ad_user_data=denied, ad_personalization=denied", platform: "all" },
      { instruction: "Publish and verify: open the site with DevTools > Console, type 'dataLayer' and look for consent_default and consent_update events", platform: "all" },
      { instruction: "The consent_default should show all 4 types as 'denied', and after accepting they should change to 'granted'", platform: "all" },
    ],
    docLinks: [
      { label: "Google: Consent Mode V2 setup", url: "https://developers.google.com/tag-platform/security/guides/consent" },
      { label: "Cookiebot: Consent Mode integration", url: "https://www.cookiebot.com/en/help/google-consent-mode/" },
    ],
  },

  C1: {
    plainExplanation: "Necessary cookies are the ones the site genuinely can't work without - login sessions, security tokens, CDN cookies (like Cloudflare's __cf_bm). These are allowed without consent, but they must truly be essential. A tracking cookie labeled 'necessary' is a compliance violation.",
    steps: [
      { instruction: "Log in to the Cookiebot admin panel and go to the cookie report", platform: "all" },
      { instruction: "Review the 'Necessary' category - each cookie listed must be genuinely essential for the site to function", platform: "all" },
      { instruction: "Common legitimate necessary cookies: CookieConsent, __cf_bm (Cloudflare), session IDs, CSRF tokens", platform: "all" },
      { instruction: "If a tracking or analytics cookie is listed as necessary: move it to the correct category (Statistics or Marketing)*", platform: "all", needsDevOrLegal: true },
      { instruction: "Run a new Cookiebot scan to ensure the categorization is up to date", platform: "all" },
    ],
    devLegalNote: "The 'necessary' category is the only one exempt from consent. Misclassifying a cookie here means it runs without permission. When in doubt, classify as Statistics or Marketing - it's safer to require consent than to skip it.",
  },

  C2: {
    plainExplanation: "Analytics cookies like _ga (Google Analytics) and _hjSession (HotJar) must be in the Statistics category in Cookiebot. This ensures they're only set after a visitor consents to statistics cookies. If they're missing or miscategorized, they may fire without permission.",
    steps: [
      { instruction: "Log in to Cookiebot admin and review the cookie report", platform: "all" },
      { instruction: "Check that all analytics cookies are in the 'Statistics' category: _ga, _gid, _gat, _hjSession, _clarity, etc.", platform: "all" },
      { instruction: "If any analytics cookies are unclassified or in the wrong category: reassign them to Statistics", platform: "all" },
      { instruction: "Run a new Cookiebot scan to detect any analytics cookies that may have been missed", platform: "all" },
      { instruction: "Verify in the browser: decline statistics cookies, then check DevTools > Cookies - no analytics cookies should appear", platform: "all" },
    ],
  },

  C3: {
    plainExplanation: "Marketing cookies (like _fbp from Meta, li_fat_id from LinkedIn, _gcl_au from Google Ads) are used for ad targeting and tracking across websites. These are the most sensitive category and always need explicit consent before they're set.",
    steps: [
      { instruction: "Log in to Cookiebot admin and review the cookie report", platform: "all" },
      { instruction: "Check that all advertising/marketing cookies are in the 'Marketing' category: _fbp, li_fat_id, _gcl_au, _uetsid, IDE, etc.", platform: "all" },
      { instruction: "If any marketing cookies are unclassified or in the wrong category: reassign them to Marketing", platform: "all" },
      { instruction: "Run a new Cookiebot scan to detect any marketing cookies that may have been missed", platform: "all" },
      { instruction: "Verify: decline marketing cookies, then check DevTools > Cookies - no ad tracking cookies should appear", platform: "all" },
    ],
  },

  C4: {
    plainExplanation: "Preference cookies remember things like language choice or UI settings. They're not essential (the site works without them), so they need consent. If the site uses them, they should be in Cookiebot's Preferences category.",
    steps: [
      { instruction: "Log in to Cookiebot admin and check if any cookies are in the 'Preferences' category", platform: "all" },
      { instruction: "Look for cookies that store UI or language preferences (e.g. lang, theme, locale)", platform: "all" },
      { instruction: "If preference cookies are missing from the category or unclassified: assign them to Preferences", platform: "all" },
      { instruction: "If the site doesn't use any preference cookies: this check is N/A", platform: "all" },
    ],
  },

  C5: {
    plainExplanation: "If Cookiebot detects a cookie on the site but it hasn't been assigned to any category (Necessary, Statistics, Marketing, or Preferences), visitors can't know what it does or make an informed consent choice. Every cookie must be classified.",
    steps: [
      { instruction: "Log in to Cookiebot admin and check for 'Unclassified' cookies in the cookie report", platform: "all" },
      { instruction: "For each unclassified cookie: identify what service sets it and what it does", platform: "all" },
      { instruction: "Assign it to the correct category based on its purpose*", platform: "all", needsDevOrLegal: true },
      { instruction: "If you can't identify a cookie: check if it comes from an old or removed service (may need to be cleaned up)", platform: "all" },
      { instruction: "Run a new Cookiebot scan after categorizing to confirm no unclassified cookies remain", platform: "all" },
    ],
    devLegalNote: "When categorizing an unknown cookie, err on the side of caution: if it might be tracking-related, classify it as Marketing. If it's analytics-related, use Statistics. Only use Necessary for cookies the site genuinely can't function without.",
  },

  C6: {
    plainExplanation: "Cookies that last too long are collecting data beyond what's reasonable. A marketing cookie that expires in 10 years is disproportionate. The widely accepted maximum is 13 months for non-essential cookies. For French visitors, the CNIL recommends 6 months.",
    steps: [
      { instruction: "Check the Cookiebot cookie report for each cookie's expiry period", platform: "all" },
      { instruction: "Alternatively: open DevTools > Application > Cookies and check the 'Expires' column for each cookie", platform: "all" },
      { instruction: "Flag any non-essential cookie with a lifetime exceeding 13 months", platform: "all" },
      { instruction: "For cookies set by third-party services (GA, Meta, etc.): these lifetimes are set by the service and may not be configurable", platform: "all" },
      { instruction: "For cookies your site sets directly: adjust the max-age or expires value in the code*", platform: "all", needsDevOrLegal: true },
      { instruction: "Document any cookies that exceed 13 months with a justification if they can't be shortened", platform: "all" },
    ],
  },

  D2: {
    plainExplanation: "Marketing campaigns come and go, but their tracking scripts often stay on the site forever. Old Salesforce campaign tracking, expired promotion pixels, and deactivated remarketing tags keep collecting data with no current purpose.",
    steps: [
      { instruction: "Review the list of scripts found in checks A1/B1 and the GTM tag list", platform: "all" },
      { instruction: "For each script/tag: ask the client if the campaign or service is still active", platform: "all" },
      { instruction: "If a campaign has ended: remove the tag from GTM or the script from the site code*", platform: "all", needsDevOrLegal: true },
      { instruction: "If the client isn't sure: pause the tag in GTM (don't delete) and schedule a follow-up review", platform: "all" },
      { instruction: "Document which scripts were removed and why", platform: "all" },
    ],
    devLegalNote: "Check with the client before removing any script - what looks abandoned may still be feeding data to a report someone relies on. Pausing in GTM is safer than deleting, since it can be re-enabled.",
  },

  E6: {
    plainExplanation: "CRM systems like HubSpot and Salesforce receive personal data from forms (names, emails, etc.) and may also track visitor behavior. If the CRM is a US-based service, you need both a DPA and a valid data transfer mechanism.",
    steps: [
      { instruction: "List all CRM integrations on the site (check form action URLs, embedded scripts, and GTM tags for HubSpot, Salesforce, Pipedrive, etc.)", platform: "all" },
      { instruction: "For each CRM: check the DPA status. HubSpot: Settings > Account > Data Privacy > DPA. Salesforce: Trust & Compliance > DPA. Most have a DPA you can accept in their admin panel", platform: "all" },
      { instruction: "For US-based CRMs: search the company name on dataprivacyframework.gov and confirm the status shows 'Active'*", platform: "all", needsDevOrLegal: true },
      { instruction: "Check what the CRM receives: open a form on the site, submit test data, then check the CRM to see what was stored (form fields, IP address, page URL, referrer)", platform: "all" },
      { instruction: "If the CRM sets tracking cookies (e.g. HubSpot's __hs* cookies): open Cookiebot admin > cookie report and verify those cookies are categorized as Marketing or Statistics, not Necessary", platform: "all" },
    ],
    devLegalNote: "A DPA is a legal contract, not a technical setting. Most major CRMs (HubSpot, Salesforce) have standard DPAs available in their account settings or legal pages. The client (data controller) must accept/sign the DPA.",
  },

  F1: {
    plainExplanation: "Every form on the site collects personal data - even a simple contact form asks for a name and email. You need to know exactly how many forms exist and what they collect so you can review each one for privacy compliance.",
    steps: [
      { instruction: "Check the scan findings above for detected forms. Then manually browse the full site (especially /contact, /about, /newsletter, landing pages) to catch forms the scanner missed", platform: "all" },
      { instruction: "For each form found: open it and write down every field (name, email, phone, company, message, etc.) and whether each is marked required or optional", platform: "all" },
      { instruction: "Check the form's action URL or integration: right-click the form > Inspect > look at the <form> tag's action attribute. Common destinations: HubSpot, Mailchimp, Webflow native, custom API", platform: "all" },
      { instruction: "Create a simple list: form name/location, fields collected, where data goes, privacy policy link present (yes/no). Use this for checks F2-F6", platform: "all" },
    ],
  },

  G3: {
    plainExplanation: "A consent banner that only offers 'Accept All' or 'Reject All' isn't enough. Visitors must be able to choose individually - for example, accepting analytics cookies but declining marketing cookies. Cookiebot supports this by default, but it needs to be configured correctly.",
    steps: [
      { instruction: "Open the site in incognito. When the banner appears, look for individual category toggles/checkboxes (Statistics, Marketing, Preferences) - not just Accept All / Reject All", platform: "all" },
      { instruction: "If no category controls are visible: go to Cookiebot admin > Banner > Layout. Change the dialog type to 'Opt-in' and select a template that shows category details with toggles", platform: "all" },
      { instruction: "In the banner layout settings, make sure each category (Necessary, Statistics, Marketing, Preferences) is shown as a separate toggleable option", platform: "all" },
      { instruction: "Test: accept only Statistics, decline Marketing. Open DevTools > Application > Cookies. Marketing cookies like _fbp or li_fat_id should NOT be present. Analytics cookies like _ga should be present", platform: "all" },
    ],
    docLinks: [
      { label: "Cookiebot: Banner configuration", url: "https://www.cookiebot.com/en/help/consent-dialog/" },
    ],
  },

  G8: {
    plainExplanation: "After a visitor makes a consent choice, the banner disappears. But they must be able to change their mind at any time. Most sites use either Cookiebot's floating widget (small icon in a corner) or a 'Cookie settings' link in the footer to reopen the consent banner.",
    steps: [
      { instruction: "Accept all cookies, then navigate to another page", platform: "all" },
      { instruction: "Look for a floating widget icon (usually bottom-left) or a 'Cookie settings'/'Manage cookies' link in the footer", platform: "all" },
      { instruction: "Click it and verify the consent preference panel opens with current choices pre-filled", platform: "all" },
      { instruction: "If neither exists: add the Cookiebot widget or a footer link that calls CookieConsent.renew()", platform: "all" },
      { instruction: "Webflow: add a link in the footer with href='#' and onclick='CookieConsent.renew()' or use the Cookiebot widget setting", platform: "webflow" },
      { instruction: "Test that changing a choice (e.g. turning off Marketing) actually takes effect - check DevTools > Cookies", platform: "all" },
    ],
    docLinks: [
      { label: "Cookiebot: Consent withdrawal", url: "https://www.cookiebot.com/en/help/consent-renewal/" },
    ],
  },

  G9: {
    plainExplanation: "Consent doesn't last forever. After a set period (maximum 12 months, or 6 months for French visitors), the banner should reappear so visitors can reconsider their choice. It should also reappear if the cookie policy changes significantly.",
    steps: [
      { instruction: "Log in to Cookiebot admin > Configuration", platform: "all" },
      { instruction: "Find the 'Renew consent' or consent expiry setting", platform: "all" },
      { instruction: "Set to 12 months maximum (6 months if the site targets French visitors)", platform: "all" },
      { instruction: "Verify the CookieConsent cookie's expiry date matches the renewal period (check DevTools > Application > Cookies)", platform: "all" },
      { instruction: "If the cookie policy changes: consider forcing a re-consent by resetting the consent version in Cookiebot", platform: "all" },
    ],
  },

  H1: {
    plainExplanation: "Cookiebot has a built-in scanner that crawls your site and detects all cookies. Running it regularly ensures newly added cookies get detected and categorized. The scan report also serves as documentation that you've done your due diligence.",
    steps: [
      { instruction: "Log in to Cookiebot admin panel", platform: "all" },
      { instruction: "Go to the scan settings and verify the correct domain and pages are configured", platform: "all" },
      { instruction: "Run a full scan (this may take a few minutes depending on site size)", platform: "all" },
      { instruction: "Review the results: check for any new or unclassified cookies", platform: "all" },
      { instruction: "Save or export the scan report for your records", platform: "all" },
      { instruction: "Schedule regular scans (monthly recommended) to catch changes", platform: "all" },
    ],
  },

  H2: {
    plainExplanation: "Cookiebot includes a Google Consent Mode checker that verifies consent signals are being sent correctly. This confirms that when a visitor accepts or declines, Google actually receives the right signal.",
    steps: [
      { instruction: "Log in to Cookiebot admin panel", platform: "all" },
      { instruction: "Find the Google Consent Mode (GCM) check tool - usually under compliance or reports", platform: "all" },
      { instruction: "Run the GCM check against your site", platform: "all" },
      { instruction: "Review the results: all 4 consent types should show as transmitting (ad_storage, analytics_storage, ad_user_data, ad_personalization)", platform: "all" },
      { instruction: "If any signals are missing: check the Cookiebot GTM template configuration (see checks A3-A5)", platform: "all" },
      { instruction: "Save the report as evidence of compliance", platform: "all" },
    ],
  },

  H3: {
    plainExplanation: "GTM Preview Mode lets you see exactly which tags fire and which are blocked in real time. The 'decline all' test is the most important one - it proves that rejecting cookies actually prevents tracking.",
    steps: [
      { instruction: "In GTM, open the site's container workspace and click 'Preview' (top right)", platform: "all" },
      { instruction: "Enter the site URL and start the preview session", platform: "all" },
      { instruction: "When the consent banner appears: decline all cookies", platform: "all" },
      { instruction: "In the GTM debugger panel: check the 'Consent' tab - all types should show 'Denied'", platform: "all" },
      { instruction: "Check 'Tags Fired' vs 'Tags Not Fired' - non-Google tags should all be under 'Not Fired'", platform: "all" },
      { instruction: "Google tags may still fire (they send anonymous pings via Consent Mode) - this is expected and allowed", platform: "all" },
      { instruction: "If non-Google tags appear under 'Tags Fired': fix their consent settings (see B3)", platform: "all" },
    ],
    docLinks: [
      { label: "GTM: Preview and debug mode", url: "https://support.google.com/tagmanager/answer/6107056" },
    ],
  },

  H4: {
    plainExplanation: "The reverse of H3 - verify that accepting cookies actually enables all your tracking and analytics tags. If tags don't fire after accepting, your marketing and analytics tools won't collect any data, which defeats their purpose.",
    steps: [
      { instruction: "Open GTM Preview Mode and enter the site URL", platform: "all" },
      { instruction: "When the consent banner appears: accept all cookies", platform: "all" },
      { instruction: "In the GTM debugger: check the 'Consent' tab - all types should show 'Granted'", platform: "all" },
      { instruction: "Check 'Tags Fired' - all tags (Google and non-Google) should appear here", platform: "all" },
      { instruction: "If any expected tags are under 'Not Fired': check their trigger and consent settings", platform: "all" },
    ],
  },

  H5: {
    plainExplanation: "This tests whether granular consent actually works. If a visitor accepts Statistics but declines Marketing, only analytics tags should fire - not advertising pixels. This is the real test of whether your consent categories are wired up correctly.",
    steps: [
      { instruction: "Open GTM Preview Mode and enter the site URL", platform: "all" },
      { instruction: "When the banner appears: customize consent - accept Statistics, decline Marketing", platform: "all" },
      { instruction: "In the GTM debugger: analytics tags (GA4, HotJar, etc.) should be under 'Tags Fired'", platform: "all" },
      { instruction: "Marketing tags (LinkedIn Pixel, Meta Pixel, etc.) should be under 'Tags Not Fired'", platform: "all" },
      { instruction: "If marketing tags fire despite being declined: their consent type is wrong - they need 'ad_storage' (see B3)", platform: "all" },
      { instruction: "Repeat with the opposite: accept Marketing, decline Statistics - verify analytics tags don't fire", platform: "all" },
    ],
  },

  H7: {
    plainExplanation: "When a data protection authority investigates, they ask: 'Prove this visitor consented.' Without consent logs, you can't. Cookiebot stores these records automatically, but the feature must be enabled and the retention period must be long enough (5 years recommended).",
    steps: [
      { instruction: "Log in to Cookiebot admin > check for a 'Consent log' or 'Audit log' section", platform: "all" },
      { instruction: "Verify consent logging is enabled", platform: "all" },
      { instruction: "Check that the log records: timestamp, consent choice (accepted/declined per category), banner version, visitor ID", platform: "all" },
      { instruction: "Verify the retention period is set to at least 5 years*", platform: "all", needsDevOrLegal: true },
      { instruction: "Test: make a consent choice on the site, then check the log - your choice should appear", platform: "all" },
    ],
    devLegalNote: "The 5-year recommendation comes from the typical statute of limitations for GDPR enforcement. Some authorities may investigate actions from several years ago, and you need the consent record from that time to defend yourself.",
  },

  I5: {
    plainExplanation: "A script inventory is an internal document (not published on the site) that lists every script, what it does, and why it's there. It's essential for maintaining the consent setup - when someone asks 'why is this script running?', the inventory has the answer.",
    steps: [
      { instruction: "Create a spreadsheet (Google Sheets or Excel) with columns: Script name | Vendor | Purpose | Cookie category (necessary/statistics/marketing/preferences) | Consent type in GTM (analytics_storage/ad_storage/none) | Managed via GTM? (yes/no) | DPA signed? (yes/no) | Notes", platform: "all" },
      { instruction: "Open GTM > Tags and add every tag name to the spreadsheet. Then open Cookiebot admin > cookie report and add any vendor not already listed", platform: "all" },
      { instruction: "Check the A1 and B1 scan results for scripts loaded directly from site code (outside GTM) - add these too, and flag them in the 'Notes' column as needing to move to GTM", platform: "all" },
      { instruction: "For each entry: open the tag/script and note whether it's in GTM (tag name) or loaded directly (header/footer/embed code). Direct-loaded scripts are the highest priority to fix", platform: "all" },
      { instruction: "Share the completed inventory with the client and set a calendar reminder for annual review", platform: "all" },
    ],
  },

  I6: {
    plainExplanation: "If the site uses AI or automated systems that make decisions affecting people (like automated loan approvals, content filtering, or dynamic pricing), the privacy policy must explain the logic and give people the right to request human review. Most marketing websites don't have this - mark as N/A if it doesn't apply.",
    steps: [
      { instruction: "Ask the client: 'Does the site automatically make decisions about people without human involvement?' Examples: automated loan/application rejection, algorithmic pricing that varies per visitor, content blocking based on user profiling, automated hiring screening", platform: "all" },
      { instruction: "If no automated decision-making: mark as N/A and add an internal note ('No automated decision-making with legal/significant effects identified')", platform: "all" },
      { instruction: "If yes: open the privacy policy and check for a section about automated decision-making. It must explain: what decisions are automated, the logic involved, and the consequences for the individual*", platform: "all", needsDevOrLegal: true },
      { instruction: "The privacy policy must also state that individuals can contest automated decisions and request human review. If this text is missing: add it to the policy*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "This applies to decisions with 'legal or similarly significant effects'. Basic personalization (showing different homepage banners) doesn't count. Credit decisions, automated hiring, or algorithmic content blocking do count.",
  },

  I7: {
    plainExplanation: "Some organizations are legally required to have a Data Protection Officer (DPO): public authorities, companies doing large-scale monitoring, or those handling sensitive data like health records. If a DPO exists, their contact details must be in the privacy policy.",
    steps: [
      { instruction: "Ask the client: 'Do you have a Data Protection Officer, and is one required?' A DPO is mandatory for: (1) public authorities, (2) organizations whose core activity is large-scale systematic monitoring, (3) organizations processing sensitive data at scale (health, criminal, biometric)", platform: "all" },
      { instruction: "If a DPO exists: open the privacy policy and check that it includes the DPO's contact details (name or title + email address). If missing: add them to the policy", platform: "all" },
      { instruction: "If a DPO is required but not appointed: flag as a critical compliance gap - the client must appoint one. This can be internal staff or an external DPO service*", platform: "all", needsDevOrLegal: true },
      { instruction: "If a DPO is not required (most standard businesses): mark as N/A and add an internal note documenting why ('Not a public authority, no large-scale monitoring, no sensitive data processing')", platform: "all" },
    ],
  },

  J1: {
    plainExplanation: "Every third-party service that touches personal data needs a Data Processing Agreement (DPA). This is a legal contract that defines what the service can and can't do with the data. Most major services (Google, HubSpot, Cloudflare, Webflow) have standard DPAs available in their settings.",
    steps: [
      { instruction: "List every third-party service touching personal data. Sources: GTM tag list, Cookiebot cookie report, form action URLs, site header/footer scripts, hosting provider, CDN", platform: "all" },
      { instruction: "For each service, find and accept/sign the DPA. Common locations: Google (admin.google.com > Account > Legal), HubSpot (Settings > Account > Data Privacy), Webflow (included in Terms of Service), Cloudflare (dash.cloudflare.com > Account > Legal), Mailchimp (Account > Settings > Data Processing Addendum)", platform: "all" },
      { instruction: "If a service has no DPA in their admin panel: check their legal/privacy page for a downloadable DPA. If none exists: contact their support to request one*", platform: "all", needsDevOrLegal: true },
      { instruction: "Add each vendor to the vendor inventory (J2) with DPA status: signed, pending, or unavailable", platform: "all" },
    ],
  },

  J2: {
    plainExplanation: "A vendor inventory is a master list of every company that handles your visitors' data. It tracks what data they get, where they store it, and whether the legal agreements are in place. This is a core accountability requirement and one of the first things authorities check.",
    steps: [
      { instruction: "Create a spreadsheet (Google Sheets or Excel) with columns: Vendor | Service type | Data received | Storage location (EU/US/other) | DPA signed (yes/no/date) | DPF certified (yes/no, check dataprivacyframework.gov) | Last reviewed", platform: "all" },
      { instruction: "Fill it in from: the script inventory (I5), GTM tag list (all tag names), form action URLs, and the Cookiebot cookie report (each cookie comes from a vendor)", platform: "all" },
      { instruction: "Don't forget infrastructure vendors that also process visitor data: hosting (Webflow, Vercel), CDN (Cloudflare), DNS, email service (Mailchimp, SendGrid), payment (Stripe)", platform: "all" },
      { instruction: "Set a calendar reminder to review the inventory annually. Add it to the client's shared calendar or project management tool*", platform: "all", needsDevOrLegal: true },
      { instruction: "Share the completed inventory with the client. They are the data controller and legally responsible for keeping it current", platform: "all" },
    ],
  },

  J3: {
    plainExplanation: "Sending EU visitor data to US companies is only legal if there's a valid transfer mechanism. The easiest is the EU-US Data Privacy Framework (DPF) - if the US company is DPF-certified, the transfer is lawful. You can check certification on dataprivacyframework.gov.",
    steps: [
      { instruction: "From the vendor inventory (J2), list all US-based services: Google, Meta, HubSpot, Salesforce, Cloudflare, Mailchimp, etc.", platform: "all" },
      { instruction: "For each: go to dataprivacyframework.gov/list, search the company name, and check the status column shows 'Active'", platform: "all" },
      { instruction: "If status is 'Active': note the certification date in the vendor inventory. Screenshot the result as evidence", platform: "all" },
      { instruction: "If a US service is NOT listed or status is 'Inactive'/'Withdrawn': flag for legal review. The client needs Standard Contractual Clauses (SCCs) + a Transfer Impact Assessment (see J8) to legally use this service*", platform: "all", needsDevOrLegal: true },
    ],
    docLinks: [
      { label: "Data Privacy Framework: Search participants", url: "https://www.dataprivacyframework.gov/list" },
    ],
  },

  J4: {
    plainExplanation: "People have the right to ask: 'What data do you have about me?' and 'Delete my data.' The organization must have a process to handle these requests within 30 days. This includes knowing who receives the request, how it's tracked, and who fulfills it.",
    steps: [
      { instruction: "Ask the client: 'If someone emails you asking what data you have on them, who handles it and what do you do?' If the answer is unclear, they don't have a process", platform: "all" },
      { instruction: "If they have a process: ask to see it. Check it includes: who receives the request (name/role), how requests are tracked (spreadsheet, ticket system), response templates for access/deletion, and the 30-day deadline", platform: "all" },
      { instruction: "Open the privacy policy and find the 'Your rights' section. It must include a working contact method (email or form) for exercising rights. Try sending a test email to the address listed", platform: "all" },
      { instruction: "If no process exists: flag as an issue. At minimum they need: a designated contact person, an email template for acknowledging requests, and a simple log (even a spreadsheet) to track deadlines*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "This is primarily a client/organizational responsibility, not a website issue. But the privacy policy must tell visitors how to exercise their rights, and the contact method must actually work.",
  },

  J5: {
    plainExplanation: "If personal data is leaked or stolen, the data protection authority must be notified within 72 hours. Without a plan in place before a breach happens, teams scramble, miss the deadline, and face larger fines. The plan doesn't need to be complex - it just needs to exist.",
    steps: [
      { instruction: "Ask the client: 'If customer data was leaked tomorrow, what would you do in the first hour?' If they can't answer clearly, they need a plan", platform: "all" },
      { instruction: "If they have a plan: ask to see it. Check it includes: (1) internal contact list (who to call first), (2) assessment checklist (what data, how many people, how serious), (3) authority notification template with the 72-hour deadline, (4) affected person notification template, (5) a breach log document (even if empty)", platform: "all" },
      { instruction: "If no plan exists: flag as an issue. A basic plan is a 1-2 page document with the items above. The supervisory authority must be named: IMY for Sweden (imy.se), ICO for UK, CNIL for France*", platform: "all", needsDevOrLegal: true },
      { instruction: "Check that a breach log exists as a file or spreadsheet - even if it has zero entries. Columns: date, description, data affected, people affected, authority notified (yes/no), actions taken", platform: "all" },
    ],
    devLegalNote: "The breach plan is an organizational document, not something published on the website. But having one is a legal requirement, and its absence is a compliance gap the audit should flag.",
  },

  J6: {
    plainExplanation: "Records of Processing Activities (ROPA) is the master document that lists everything the organization does with personal data. It's mandatory for most organizations and is one of the first things a data protection authority asks for during an inspection.",
    steps: [
      { instruction: "Ask the client: 'Do you have a Record of Processing Activities (ROPA) document?' - it's usually a spreadsheet or document maintained by legal/compliance", platform: "all" },
      { instruction: "If they have one: check that it covers website-related processing: analytics tracking, form data collection, marketing pixels, CRM syncing, email marketing, and hosting", platform: "all" },
      { instruction: "Each processing activity in the ROPA must list: purpose, categories of data, recipients, retention period, transfer safeguards (if data leaves EU), and security measures. If any of these columns are empty: they need to be filled in*", platform: "all", needsDevOrLegal: true },
      { instruction: "If no ROPA exists: flag as a compliance gap. Most organizations are required to have one (the <250 employee exemption rarely applies when the site uses analytics and marketing cookies). Recommend the client create one or hire a privacy consultant*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "The exemption for organizations under 250 employees only applies if processing is 'occasional' - website tracking, analytics, and marketing cookies are not occasional, so the exemption rarely applies in practice.",
  },

  J7: {
    plainExplanation: "Your vendors (like Google or HubSpot) use their own sub-vendors to process data. The DPA should require vendors to tell you before changing sub-vendors, give you the right to object, and ensure sub-vendors follow the same data protection rules.",
    steps: [
      { instruction: "Review the DPAs for key vendors: look for sub-processor clauses", platform: "all" },
      { instruction: "The DPA should include: advance notice of sub-processor changes, your right to object, and flow-down of data protection obligations", platform: "all" },
      { instruction: "Check if key vendors publish their sub-processor list (most major ones do - Google, HubSpot, etc.)", platform: "all" },
      { instruction: "Verify the client has a process for reviewing sub-processor change notifications*", platform: "all", needsDevOrLegal: true },
      { instruction: "If a DPA lacks sub-processor clauses: flag for legal review*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "Most standard DPAs from major vendors already include sub-processor clauses. The issue is more common with smaller or niche vendors. The client should subscribe to sub-processor change notifications from key vendors.",
  },

  J8: {
    plainExplanation: "For US vendors NOT on the Data Privacy Framework (DPF), or vendors in other non-EU countries without an adequacy agreement, you need a Transfer Impact Assessment (TIA). This documents the risks of sending data to that country and what extra safeguards are in place.",
    steps: [
      { instruction: "Review the vendor inventory (J2) and DPF certification status (J3)", platform: "all" },
      { instruction: "If all vendors are DPF-certified or in EU/EEA/adequate countries: this check is N/A", platform: "all" },
      { instruction: "For any vendor without DPF certification or adequacy: a TIA is needed*", platform: "all", needsDevOrLegal: true },
      { instruction: "The TIA must assess: the legal framework of the destination country, government access risks, and supplementary measures (like encryption)", platform: "all" },
      { instruction: "Standard Contractual Clauses (SCCs) are typically needed alongside the TIA*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "Transfer Impact Assessments are legal documents that require understanding of the destination country's surveillance laws. This is specialist legal work - recommend the client involve a privacy lawyer if non-DPF transfers are identified.",
  },

  J9: {
    plainExplanation: "A Data Protection Impact Assessment (DPIA) is required when data processing is likely to result in high risk to individuals. Most standard marketing websites don't need one - but the audit should document whether a DPIA is needed and why or why not.",
    steps: [
      { instruction: "Review the site's processing activities against DPIA triggers: large-scale profiling, systematic monitoring of public areas, automated decision-making with legal effects, sensitive data at scale, children's data, innovative new technologies", platform: "all" },
      { instruction: "If any trigger applies: verify a DPIA has been completed*", platform: "all", needsDevOrLegal: true },
      { instruction: "If no triggers apply: document the conclusion ('DPIA not required because...') and mark as N/A", platform: "all" },
      { instruction: "If unsure whether triggers apply: flag for legal review - it's safer to do a DPIA than to skip one that was needed*", platform: "all", needsDevOrLegal: true },
    ],
    devLegalNote: "Most standard corporate/marketing websites with analytics and contact forms won't trigger DPIA requirements. But sites with extensive user tracking, A/B testing at scale, personalization engines, or user profiling might. Document the assessment either way.",
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
