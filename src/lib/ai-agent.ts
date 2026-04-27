import * as cheerio from "cheerio";
import type { CheckResult } from "@/lib/scanner";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const PRIMARY_MODEL = "google/gemini-2.0-flash-001";
const FALLBACK_MODEL = "google/gemini-2.0-flash-lite-001";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(status: number): boolean {
  return status >= 500 || status === 429;
}

async function callOpenRouter(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const models = [PRIMARY_MODEL, FALLBACK_MODEL];

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
          if (isRetryable(response.status) && model === PRIMARY_MODEL) {
            console.warn(`OpenRouter ${model} failed after ${attempt + 1} attempts, trying fallback model`);
            break;
          }
          throw new Error(`OpenRouter API error ${response.status}: ${text.slice(0, 200)}`);
        }

        const data = await response.json();
        if (model !== PRIMARY_MODEL) {
          console.info(`OpenRouter: used fallback model ${model}`);
        }
        return data.choices?.[0]?.message?.content || "";
      } catch (err) {
        if (err instanceof TypeError && attempt < MAX_RETRIES) {
          console.warn(`OpenRouter ${model} attempt ${attempt + 1} network error, retrying...`);
          continue;
        }
        if (err instanceof TypeError && model === PRIMARY_MODEL) {
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
  status: "ok" | "issue" | "na";
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

function normalizeUrl(url: string): string {
  if (!url.startsWith("http")) url = "https://" + url;
  return url.replace(/\/$/, "");
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

export async function runAICheck(checkKey: string, url: string): Promise<CheckResult> {
  try {
    const { html, text } = await fetchPageContent(url);

    const handler = AI_CHECKS[checkKey];
    if (!handler) {
      return {
        checkKey,
        status: "na",
        findings: [{ element: "", detail: `No AI check handler for ${checkKey}`, severity: "info" }],
        summary: "Check not implemented",
      };
    }

    const result = await handler(html, text, url);
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

type AICheckHandler = (html: string, text: string, url: string) => Promise<AICheckResult>;

const AI_CHECKS: Record<string, AICheckHandler> = {
  F2: async (_html, text) => {
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

Page content:
${text.slice(0, 8000)}`
    );
    return parseAIResponse(raw);
  },

  F4: async (html) => {
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
${forms.slice(0, 8000)}`
    );
    return parseAIResponse(raw);
  },

  G2: async (html) => {
    const $ = cheerio.load(html);
    const bannerSelectors = [
      "[class*='cookie']", "[class*='consent']", "[class*='gdpr']",
      "[id*='cookie']", "[id*='consent']", "[id*='CybotCookiebot']",
      "[class*='banner']", "[class*='notice']",
    ];
    let bannerHtml = "";
    for (const sel of bannerSelectors) {
      const el = $(sel);
      if (el.length > 0) {
        bannerHtml += $.html(el) + "\n";
      }
    }

    if (!bannerHtml) {
      return {
        status: "na" as const,
        findings: [{ detail: "No consent banner HTML detected in page source", severity: "info" as const }],
        summary: "Consent banner not found in static HTML (may load dynamically)",
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
${bannerHtml.slice(0, 6000)}`
    );
    return parseAIResponse(raw);
  },

  G6: async (_html, text, url) => {
    const raw = await callOpenRouter(
      `You are a GDPR compliance auditor checking if a website's cookie consent banner language matches the site's content language.
${RESPONSE_FORMAT_INSTRUCTION}`,
      `Analyze this page content and determine:
1. What language(s) is the main site content written in?
2. Is there evidence of a cookie consent banner? If so, what language is it in?
3. Do the languages match?

If the site is in Swedish but the banner is only in English, that's an issue. Multi-language sites need multi-language banners.

URL: ${url}
Page content (first 6000 chars):
${text.slice(0, 6000)}`
    );
    return parseAIResponse(raw);
  },

  G7: async (html, text) => {
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
${text.slice(0, 3000)}`
    );
    return parseAIResponse(raw);
  },

  I1: async (_html, text, url) => {
    const privacyPatterns = /privacy|dataskydd|integritet|personuppgift/i;
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
${contentToAnalyze.slice(0, 10000)}`
    );
    return parseAIResponse(raw);
  },

  I8: async (_html, text, url) => {
    const privacyPatterns = /privacy|dataskydd|integritet|personuppgift/i;
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
${text.slice(0, 12000)}`
    );
    return parseAIResponse(raw);
  },

  I2: async (_html, text, url) => {
    const raw = await callOpenRouter(
      `You are a GDPR compliance auditor checking if a privacy policy is available in all languages the website uses.
${RESPONSE_FORMAT_INSTRUCTION}`,
      `Analyze this page to determine:
1. What language(s) does the site content use?
2. Are there language switcher links visible?
3. If the site has content in multiple languages, is there evidence of a translated privacy policy?

Look for:
- Language switcher elements (flags, "EN/SV/DE" links)
- hreflang meta tags
- Multiple language versions of navigation items
- Privacy policy links in different languages

URL: ${url}
Page content:
${text.slice(0, 6000)}`
    );
    return parseAIResponse(raw);
  },
};

export const AI_CHECK_KEYS = Object.keys(AI_CHECKS);
