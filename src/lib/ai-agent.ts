import * as cheerio from "cheerio";
import type { CheckResult } from "@/lib/scanner";
import { normalizeUrl } from "@/lib/url";
import { getAISettings, getEffectiveAPIKey } from "@/app/actions/ai-settings";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(status: number): boolean {
  return status >= 500 || status === 429;
}

async function callOpenRouter(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = await getEffectiveAPIKey();
  if (!apiKey) {
    throw new Error("No OpenRouter API key configured. Add one in Settings or set OPENROUTER_API_KEY in environment.");
  }

  const settings = await getAISettings();
  const models = [settings.primaryModel, settings.fallbackModel];

  for (const model of models) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await sleep(RETRY_DELAY_MS * attempt);
      }

      try {
        const response = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.1,
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          if (isRetryable(response.status) && attempt < MAX_RETRIES) {
            console.warn(`OpenRouter ${model} attempt ${attempt + 1} failed (${response.status}), retrying...`);
            continue;
          }
          if (isRetryable(response.status) && model === models[0]) {
            console.warn(`OpenRouter ${model} failed after ${attempt + 1} attempts, trying fallback model`);
            break;
          }
          throw new Error(`OpenRouter API error ${response.status}: ${text.slice(0, 200)}`);
        }

        const data = await response.json();
        if (model !== models[0]) {
          console.info(`OpenRouter: used fallback model ${model}`);
        }
        return data.choices?.[0]?.message?.content || "";
      } catch (err) {
        if (err instanceof TypeError && attempt < MAX_RETRIES) {
          console.warn(`OpenRouter ${model} attempt ${attempt + 1} network error, retrying...`);
          continue;
        }
        if (err instanceof TypeError && model === models[0]) {
          console.warn(`OpenRouter ${model} network error after ${attempt + 1} attempts, trying fallback model`);
          break;
        }
        throw err;
      }
    }
  }

  throw new Error("OpenRouter: all models and retries exhausted");
}

interface AICheckResult {
  status: "ok" | "issue" | "na" | "blocked";
  findings: { detail: string; severity: "error" | "warning" | "info" }[];
  summary: string;
}

function parseAIResponse(raw: string): AICheckResult {
  try {
    const cleaned = raw.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      status: parsed.status || "na",
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      summary: parsed.summary || "AI analysis complete",
    };
  } catch {
    console.error("Failed to parse AI response:", raw.slice(0, 500));
    return {
      status: "na",
      findings: [{ detail: "Could not parse AI response", severity: "warning" }],
      summary: "AI analysis failed to parse",
    };
  }
}


async function fetchPageContent(url: string): Promise<{ html: string; text: string }> {
  const normalizedUrl = normalizeUrl(url);
  const response = await fetch(normalizedUrl, {
    headers: { "User-Agent": "StormforsGDPRAudit/1.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  return { html, text };
}

export async function runAICheck(checkKey: string, url: string, priorResults: CheckResult[] = []): Promise<CheckResult> {
  try {
    const { html, text } = await fetchPageContent(url);
    const scanContext = formatScanContext(priorResults);

    const handler = AI_CHECKS[checkKey];
    if (!handler) {
      return {
        checkKey,
        status: "na",
        findings: [{ element: "", detail: `No AI check handler for ${checkKey}`, severity: "info" }],
        summary: "Check not implemented",
      };
    }

    const result = await handler(html, text, url, scanContext);
    return {
      checkKey,
      status: result.status,
      findings: result.findings.map((f) => ({
        element: "",
        ...f,
      })),
      summary: result.summary,
    };
  } catch (err) {
    console.error(`AI check ${checkKey} failed:`, err);
    return {
      checkKey,
      status: "na",
      findings: [{
        element: "",
        detail: err instanceof Error ? err.message : "Unknown error",
        severity: "warning",
      }],
      summary: "AI check failed",
    };
  }
}

const RESPONSE_FORMAT_INSTRUCTION = `
Respond with a JSON object:
{
  "status": "ok" | "issue",
  "findings": [{ "detail": "description", "severity": "error" | "warning" | "info" }],
  "summary": "one-line summary"
}
Only include findings for actual problems. If everything looks fine, return status "ok" with empty findings.`;

function formatScanContext(priorResults: CheckResult[]): string {
  if (priorResults.length === 0) return "";
  const lines = priorResults.map((r) => {
    const status = r.status === "ok" ? "OK" : r.status === "issue" ? "ISSUE" : r.status === "client_managed" ? "CLIENT_MANAGED" : r.status.toUpperCase();
    const findings = r.findings
      .filter((f) => f.severity === "error" || f.severity === "warning")
      .map((f) => f.detail)
      .join("; ");
    return `${r.checkKey}: ${status} - ${r.summary}${findings ? ` [${findings}]` : ""}`;
  });
  return `\n\nContext from other checks already run on this site:\n${lines.join("\n")}`;
}

type AICheckHandler = (html: string, text: string, url: string, scanContext: string) => Promise<AICheckResult>;

function isBenignScript($el: ReturnType<cheerio.CheerioAPI>, src: string, inline: string): boolean {
  const content = src || inline;
  if (!content.trim()) return true;
  if (/googletagmanager\.com\/gtm\.js/i.test(content)) return true;
  if (/gtm\.start/i.test(content)) return true;
  if (/consent\.cookiebot\.com|consentcdn\.cookiebot\.com/i.test(content)) return true;
  if ($el.attr("type") === "application/ld+json") return true;
  if ($el.attr("type") === "application/json") return true;
  if ($el.attr("id") === "__NEXT_DATA__") return true;
  if (/\/_next\/static/i.test(src)) return true;

  // Platform scripts (Webflow, Squarespace, Shopify, HubSpot)
  if (/webflow\.js|webflow-.*\.js/i.test(src)) return true;
  if (/Webflow\.push/i.test(content)) return true;
  if (/cdn\.prod\.website-files\.com\/.+\.js/i.test(src)) return true;
  if (/d3e54v103j8qbb\.cloudfront\.net\/js\/jquery/i.test(src)) return true;
  if (/w-mod-/i.test(content) && content.length < 200) return true;
  if (/\.wf-force-outline-none/i.test(content)) return true;
  if (/scrollRestoration/i.test(content)) return true;
  if (/assets\.squarespace/i.test(src)) return true;
  if (/cdn\.shopify\.com\/s\/files/i.test(src)) return true;
  if (/js\.hsforms\.net/i.test(src)) return true;
  if (/js\.hscollectedforms\.net/i.test(src)) return true;

  // Font loaders (not tracking)
  if (/use\.typekit\.net/i.test(src)) return true;
  if (/Typekit\.load/i.test(content)) return true;
  if (/ajax\.googleapis\.com\/ajax\/libs\/webfont/i.test(src)) return true;
  if (/WebFont\.load/i.test(content)) return true;

  // Common UI/utility libraries
  if (/cdn\.jsdelivr\.net/i.test(src)) return true;
  if (/cdnjs\.cloudflare\.com/i.test(src)) return true;
  if (/unpkg\.com/i.test(src)) return true;
  if (/jquery/i.test(src) && !/jquery.*track/i.test(src)) return true;
  if (/gsap|greensock/i.test(src)) return true;
  if (/swiper/i.test(src)) return true;
  if (/lottie/i.test(src)) return true;
  if (/finsweet/i.test(src)) return true;

  return false;
}

function extractScripts($: cheerio.CheerioAPI, location: "head" | "body"): string[] {
  const scripts: string[] = [];
  $(`${location} script`).each((_, el) => {
    const $el = $(el);
    const src = $el.attr("src") || "";
    const inline = $el.html() || "";
    if (isBenignScript($el, src, inline)) return;
    scripts.push(src ? `External: ${src}` : `Inline (${inline.length} chars): ${inline.slice(0, 300)}`);
  });
  return scripts;
}

const SCRIPT_CLASSIFICATION_SYSTEM = `You are a GDPR compliance auditor classifying scripts found on a website.
${RESPONSE_FORMAT_INSTRUCTION}

Classification rules:
- TRACKING: analytics, advertising pixels, session recording, heatmaps, A/B testing that collects personal data, retargeting
- PRIVACY_CONCERN: chat widgets that set cookies, social media embeds that track users, services that transmit user data to third parties without consent
- BENIGN: UI/animation libraries (Finsweet, GSAP, Swiper, Lottie, etc.), CSS frameworks, font loaders, CMS platform scripts (Webflow, jQuery, Next.js), utility libraries, payment processing, accessibility tools

Return status "issue" ONLY if you find TRACKING or PRIVACY_CONCERN scripts. List each one as a finding with severity "error" and explain what it does and that it should be loaded through GTM to respect consent.

For BENIGN scripts, do NOT include them in findings. Just mention the count in your summary.

If ALL scripts are benign, return status "ok" with empty findings.`;

const AI_CHECKS: Record<string, AICheckHandler> = {
  A1: async (html, _text, _url, scanContext) => {
    const $ = cheerio.load(html);
    const scripts = extractScripts($, "head");

    if (scripts.length === 0) {
      return {
        status: "ok" as const,
        findings: [],
        summary: "Only GTM/Cookiebot/JSON-LD scripts found in <head>",
      };
    }

    const raw = await callOpenRouter(
      SCRIPT_CLASSIFICATION_SYSTEM,
      `These scripts were found in the <head> section of a website, loaded outside of Google Tag Manager. GTM and Cookiebot scripts have already been excluded.

Classify each script and flag any that are tracking or privacy concerns. These should be loaded through GTM so they respect the visitor's consent choice.

Scripts found in <head>:
${scripts.map((s, i) => `${i + 1}. ${s}`).join("\n")}
${scanContext}`
    );
    return parseAIResponse(raw);
  },

  A2: async (html, _text, _url, scanContext) => {
    const $ = cheerio.load(html);
    const scripts = extractScripts($, "body");

    if (scripts.length === 0) {
      return {
        status: "ok" as const,
        findings: [],
        summary: "No hardcoded scripts in <body> (outside GTM)",
      };
    }

    const raw = await callOpenRouter(
      SCRIPT_CLASSIFICATION_SYSTEM,
      `These scripts were found in the <body> section of a website, loaded outside of Google Tag Manager. GTM and Cookiebot scripts have already been excluded.

Classify each script and flag any that are tracking or privacy concerns. These should be loaded through GTM so they respect the visitor's consent choice.

Scripts found in <body>:
${scripts.map((s, i) => `${i + 1}. ${s}`).join("\n")}
${scanContext}`
    );
    return parseAIResponse(raw);
  },

  F2: async (_html, text, _url, scanContext) => {
    const raw = await callOpenRouter(
      `You are a GDPR compliance auditor analyzing web forms for data minimization (GDPR Art. 5(1)(c)).
${RESPONSE_FORMAT_INSTRUCTION}`,
      `Analyze this page text for forms that collect personal data. Check if each form collects only what's necessary for its stated purpose.

Flag issues like:
- Newsletter signup asking for more than email (name is borderline, anything beyond that is excessive)
- Forms collecting date of birth, gender, or other sensitive data without clear justification
- Hidden fields that collect tracking data
- Multiple optional fields that seem unrelated to the form's purpose
- Note: contact forms asking for both phone and email may be justified if the business offers multiple contact channels - only flag if the form purpose clearly doesn't need both
${scanContext}
Page content:
${text.slice(0, 8000)}`
    );
    return parseAIResponse(raw);
  },

  F4: async (html, _text, _url, scanContext) => {
    const $ = cheerio.load(html);
    const forms = $("form").toArray().map((el) => $.html(el)).join("\n---\n");

    if (!forms) {
      return { status: "na" as const, findings: [], summary: "No forms found on page" };
    }

    const raw = await callOpenRouter(
      `You are a GDPR compliance auditor checking consent separation in web forms.
${RESPONSE_FORMAT_INSTRUCTION}`,
      `Analyze these HTML forms for proper consent separation (GDPR Art. 6-7):

Check for:
- Single checkbox covering multiple purposes (e.g., "I agree to receive marketing AND my data being shared with partners")
- Pre-ticked consent checkboxes (must be opt-in, not opt-out)
- Missing separate consent for marketing vs. service communication
- Bundled consent (inquiry + newsletter in one checkbox)

Forms HTML:
${forms.slice(0, 8000)}${scanContext}`
    );
    return parseAIResponse(raw);
  },

  G2: async (html, _text, _url, scanContext) => {
    const $ = cheerio.load(html);
    const bannerSelectors = [
      "[class*='cookie']", "[class*='consent']", "[class*='gdpr']",
      "[id*='cookie']", "[id*='consent']", "[id*='CybotCookiebot']",
    ];
    let bannerHtml = "";
    for (const sel of bannerSelectors) {
      const el = $(sel);
      if (el.length > 0) {
        bannerHtml += $.html(el) + "\n";
      }
    }

    if (!bannerHtml) {
      const g1Ok = /G1:\s*OK/i.test(scanContext);
      if (g1Ok) {
        return {
          status: "blocked" as const,
          findings: [{ detail: "The consent banner can't be checked automatically because it loads after the page renders. Open the site in a browser and check: is 'Allow all' a big colorful button while 'Deny' is just an outline or text link? They must look equally clickable - same size, same visual weight. IMY fined companies in 2025 for exactly this.", severity: "warning" as const }],
          summary: "Check in browser: are Accept and Reject buttons equally visible?",
        };
      }
      return {
        status: "blocked" as const,
        findings: [{ detail: "No consent banner or Cookiebot script detected - prominence check not applicable", severity: "info" as const }],
        summary: "No consent banner detected",
      };
    }

    const raw = await callOpenRouter(
      `You are a GDPR compliance auditor checking consent banner design for equal prominence of Accept and Reject buttons.
${RESPONSE_FORMAT_INSTRUCTION}`,
      `Analyze this consent banner HTML for equal prominence of Accept and Reject options (EU ePrivacy Directive, EDPB guidelines):

Check for:
- Accept button is larger, more colorful, or more prominent than Reject/Decline (check class names for clues like "primary", "secondary", "outline", "ghost")
- Reject requires more clicks than Accept (e.g., hidden in "settings")
- Accept is a button but Reject is just a text link
- Different element types (button vs. anchor vs. span)
- Different positioning (Accept prominent, Reject tucked away)

IMPORTANT: This is HTML-only analysis. CSS styling (colors, exact sizes) is not visible. Note this limitation in your response if you cannot determine visual prominence from the HTML/class names alone. Check class names like "btn-primary" vs "btn-secondary" or "text-sm" vs "text-lg" for clues.

Banner HTML:
${bannerHtml.slice(0, 6000)}${scanContext}`
    );
    return parseAIResponse(raw);
  },

  G6: async (html, text, url, scanContext) => {
    const $ = cheerio.load(html);
    const bannerSelectors = [
      "[class*='cookie']", "[class*='consent']", "[class*='gdpr']",
      "[id*='cookie']", "[id*='consent']", "[id*='CybotCookiebot']",
    ];
    let bannerHtml = "";
    for (const sel of bannerSelectors) {
      const el = $(sel);
      if (el.length > 0) bannerHtml += $.html(el) + "\n";
    }

    const hasBannerContext = bannerHtml.length > 0;
    const g1Ok = /G1:\s*OK/i.test(scanContext);

    if (!hasBannerContext && !g1Ok) {
      return {
        status: "blocked" as const,
        findings: [{ detail: "No consent banner or Cookiebot script detected - language check not applicable", severity: "info" as const }],
        summary: "No consent banner detected",
      };
    }

    const bannerNote = hasBannerContext
      ? `Banner HTML found in page source:\n${bannerHtml.slice(0, 3000)}`
      : "The consent banner is loaded dynamically via Cookiebot/GTM (confirmed by G1 check). The banner HTML is not available for static analysis, but Cookiebot serves the banner in the language configured in admin.cookiebot.com.";

    const raw = await callOpenRouter(
      `You are a GDPR compliance auditor checking if a website's consent banner language is appropriate for the site's audience.
${RESPONSE_FORMAT_INSTRUCTION}`,
      `Determine what language(s) the site content is written in and whether the consent banner language setup is appropriate.

IMPORTANT RULES:
- A single-language site with Cookiebot configured is likely fine - Cookiebot auto-detects language when configured correctly
- Only flag an issue if the site is MULTILINGUAL and there's evidence the banner doesn't support all languages
- Do NOT flag single-language sites as issues just because you can't see the banner text

${bannerNote}

URL: ${url}
Page content (first 6000 chars):
${text.slice(0, 6000)}${scanContext}`
    );
    return parseAIResponse(raw);
  },

  G7: async (html, text, _url, scanContext) => {
    const $ = cheerio.load(html);
    const bannerSelectors = [
      "[class*='cookie']", "[class*='consent']", "[class*='gdpr']",
      "[id*='cookie']", "[id*='consent']", "[id*='CybotCookiebot']",
    ];
    let bannerHtml = "";
    for (const sel of bannerSelectors) {
      const el = $(sel);
      if (el.length > 0) bannerHtml += $.html(el) + "\n";
    }

    if (!bannerHtml) {
      const g1Ok = /G1:\s*OK/i.test(scanContext);
      if (g1Ok) {
        return {
          status: "blocked" as const,
          findings: [{ detail: "The consent banner can't be checked automatically because it loads after the page renders. Open the site in a browser and look for: pre-ticked checkboxes, a hidden or hard-to-find Reject button, guilt-tripping language, or content blocked until you accept cookies.", severity: "warning" as const }],
          summary: "Check in browser: any dark patterns in the consent banner?",
        };
      }
      return {
        status: "blocked" as const,
        findings: [{ detail: "No consent banner or Cookiebot script detected - dark pattern check not applicable", severity: "info" as const }],
        summary: "No consent banner detected",
      };
    }

    const raw = await callOpenRouter(
      `You are a GDPR compliance auditor checking for dark patterns in cookie consent banners (EDPB guidelines, EU Digital Services Act).
${RESPONSE_FORMAT_INSTRUCTION}`,
      `Analyze for dark patterns in this consent mechanism:

Check for:
- Pre-ticked checkboxes (must be unticked by default - CJEU Planet49)
- Cookie walls (blocking content until acceptance)
- Guilt language ("We value your experience" / "You might miss out")
- Hidden reject/decline option (EDPB: reject must be on same layer as accept)
- Confusing double negatives ("Don't not send me emails")
- "Accept all" prominent but no simple "Reject all"
- Forced re-consent (nagging users who declined)
- Misleading category names
- Pay-or-consent without genuine free alternative (EDPB Opinion 08/2024)

IMPORTANT: This is HTML-only analysis. CSS styling (colors, sizes, visual weight) is not visible. If you cannot determine visual prominence from HTML/class names alone, note this limitation. Focus on structural dark patterns (missing reject button, pre-ticked inputs, cookie walls) which ARE detectable from HTML.

Banner HTML:
${bannerHtml.slice(0, 4000)}

Page text near banner:
${text.slice(0, 3000)}${scanContext}`
    );
    return parseAIResponse(raw);
  },

  I1: async (_html, text, url, scanContext) => {
    const privacyPatterns = /privacy|dataskydd|integritet|personuppgift|sekretesspolicy|privatlivspolicy/i;
    const isPrivacyPage = privacyPatterns.test(url) || privacyPatterns.test(text.slice(0, 500));

    const contentToAnalyze = isPrivacyPage ? text : text.slice(0, 2000);
    const context = isPrivacyPage
      ? "This IS the privacy policy page. Analyze its completeness."
      : "This is NOT the privacy policy page. Check if a privacy policy link exists and note what cannot be verified without visiting the actual policy page.";

    const raw = await callOpenRouter(
      `You are a GDPR compliance auditor checking privacy policy completeness against GDPR Art. 13/14 requirements.
${RESPONSE_FORMAT_INSTRUCTION}`,
      `${context}

Required elements under GDPR Art. 13:
1. Identity and contact details of the controller
2. Contact details of the DPO (if applicable)
3. Purposes of processing and legal basis
4. Legitimate interests (if Art. 6(1)(f) is the basis)
5. Recipients or categories of recipients
6. International transfers and safeguards
7. Retention periods or criteria
8. Data subject rights (access, rectification, erasure, restriction, portability, objection)
9. Right to withdraw consent
10. Right to lodge complaint with supervisory authority
11. Whether provision of data is statutory/contractual requirement
12. Automated decision-making including profiling (if applicable)

Page content:
${contentToAnalyze.slice(0, 10000)}${scanContext}`
    );
    return parseAIResponse(raw);
  },

  I8: async (_html, text, url, scanContext) => {
    const privacyPatterns = /privacy|dataskydd|integritet|personuppgift|sekretesspolicy|privatlivspolicy/i;
    const isPrivacyPage = privacyPatterns.test(url) || privacyPatterns.test(text.slice(0, 500));

    if (!isPrivacyPage) {
      return {
        status: "na" as const,
        findings: [{ detail: "This is not the privacy policy page. Navigate to the privacy policy URL and run this check there.", severity: "info" as const }],
        summary: "Run this check on the privacy policy page",
      };
    }

    const raw = await callOpenRouter(
      `You are a GDPR compliance auditor assessing the accessibility and readability of a privacy policy (GDPR Art. 12).
${RESPONSE_FORMAT_INSTRUCTION}`,
      `Evaluate this privacy policy for accessibility and readability under GDPR Art. 12 requirements:

Check for:
1. Clear, plain language (no dense legal jargon without explanation)
2. Layered approach (summary/overview section before full details, or clear table of contents)
3. Easy navigation (headings, sections, anchor links for long policies)
4. Concise - not unnecessarily long or repetitive
5. Intelligible to the average person (not just lawyers)
6. Last updated date visible

This is a 2026 DPA coordinated enforcement priority (right of access and transparency). Be thorough.

Flag issues like:
- Wall of text with no headings or sections
- Legal jargon without plain-language explanation
- Missing table of contents on long policies (>1000 words)
- No "last updated" date
- Overly vague language ("we may share your data with partners" without specifics)

Privacy policy content:
${text.slice(0, 12000)}${scanContext}`
    );
    return parseAIResponse(raw);
  },

  F6: async (_html, text, _url, scanContext) => {
    const raw = await callOpenRouter(
      `You are a GDPR compliance auditor checking Swedish web forms for personnummer (Swedish personal identity number) collection. This check is specific to Swedish law (dataskyddslagen 2018:218).
${RESPONSE_FORMAT_INSTRUCTION}`,
      `Analyze this page for forms that collect personnummer (Swedish personal identity numbers, also called samordningsnummer/coordination numbers).

Look for:
- Form fields labeled "personnummer", "personal number", "SSN", "social security number", "ID-nummer", "identitetsnummer"
- Input fields with patterns matching YYMMDD-XXXX or YYYYMMDD-XXXX format
- Any field asking for a Swedish national ID number

If found, evaluate:
- Is the collection clearly justified by the service's purpose? (banking, insurance, tax = justified; contact form, newsletter = not justified)
- Is the field mandatory or optional?
- Is there a stated reason for why personnummer is needed?

If no personnummer fields are found, return status "ok" with summary "No personnummer collection detected".

Page content:
${text.slice(0, 8000)}${scanContext}`
    );
    return parseAIResponse(raw);
  },

  I2: async (_html, text, url, scanContext) => {
    const raw = await callOpenRouter(
      `You are a GDPR compliance auditor checking if a website is multilingual, and if so, whether the privacy policy is available in all languages.
${RESPONSE_FORMAT_INSTRUCTION}`,
      `First, determine if this website is multilingual. Look for:
- Language switcher elements (flags, "EN/SV/DE" links, language dropdowns)
- hreflang meta tags indicating multiple language versions
- Navigation items or content in multiple languages
- URL patterns like /en/, /sv/, /de/

DECISION LOGIC:
- If the site is SINGLE-LANGUAGE (no signs of multiple languages): return status "ok" with summary explaining the site appears to be single-language so no translation is needed.
- If the site IS multilingual: check whether the privacy policy is available in each language. If translations are missing, return status "issue" with findings listing which languages lack a privacy policy.

IMPORTANT: A site being in only one language (whether Swedish, English, or any other) is perfectly fine. The check only fails when a site serves content in multiple languages but the privacy policy is not available in all of them.

URL: ${url}
Page content:
${text.slice(0, 6000)}${scanContext}`
    );
    return parseAIResponse(raw);
  },
};

export const AI_CHECK_KEYS = Object.keys(AI_CHECKS);
