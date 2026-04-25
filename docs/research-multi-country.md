# Multi-Country & US Compliance

Source: deep research, April 2026.

## EU country-specific differences

### Sweden (IMY - Integritetsskyddsmyndigheten)

**2026 priorities:** Crime prevention, AI/automated decisions, digital marketing/tracking.

Key enforcement:
- Fined companies and ordered others to stop using Google Analytics (unlawful US data transfers)
- Enforced against Meta Pixel on same grounds
- NO analytics exemption - ALL analytics cookies require consent (unlike France)

Legislation: Data Protection Act (2018:218) + Electronic Communications Act (LEK).

### Germany (strictest in EU)

- TTDSG/TDDDG: Section 25 requires consent before any non-essential device access
- 17 supervisory authorities (16 state + 1 federal)
- "Reject All" must have equal prominence to "Accept All" (court ruling 2026)
- Fines up to EUR 300,000 for TTDSG violations specifically
- Double opt-in for newsletters effectively required by case law

### France (CNIL)

- Must name each tracker explicitly (not just categories)
- Equal reject/accept buttons required
- Analytics exemption exists for certain privacy-friendly tools (GA does NOT qualify)
- New guidance on tracking pixels in email (April 2026) requiring consent

### Netherlands (AP)

- Cookie walls explicitly banned
- 9-point guidance for clear banners
- Active enforcement against large and small organizations

## US privacy regulations

**20 states have comprehensive privacy laws.** No federal law exists (APRA did not pass).

### CCPA/CPRA (California - most important)

| Requirement | Detail |
|-------------|--------|
| Model | Opt-OUT (opposite of GDPR opt-in) |
| "Do Not Sell/Share" link | Mandatory on website |
| Global Privacy Control (GPC) | Must honor browser opt-out signals |
| Applies when | >$25M revenue, OR 100k+ consumers data, OR >50% revenue from data sales |
| Fines | $2,500/violation, $7,500/intentional |
| Private right of action | Yes (for data breaches) |

### EU vs US key differences

| Aspect | GDPR (EU) | CCPA/US |
|--------|-----------|---------|
| Consent model | Opt-in (block until consent) | Opt-out (collect, user opts out) |
| Cookie banner | Required, must block cookies | Not required for cookies |
| "Do Not Sell" link | Not needed | Mandatory |
| Right to delete | Yes | Yes |
| DPO required | Often yes | No |

## UK post-Brexit

### Data Use and Access Act 2025 (DUAA) - effective Feb 5, 2026

Major change: consent NO longer required for certain cookies:
- Analytics/performance cookies
- Security cookies
- A/B testing cookies
- Software update cookies

Marketing cookies still require consent.

**Practical impact:** EU GDPR compliance is stricter than UK now requires. For simplicity, many sites keep the EU standard for all visitors.

EU adequacy decision for UK remains active (data flows freely EU > UK).

## Multi-language requirements

**Consent banner:** Must match the website's content language. GDPR Art. 12 requires "clear and plain language" = user must understand what they're consenting to.

**Privacy policy:** Same principle - if site content is in a language, privacy policy should be in that language too.

**Cookiebot:** Supports 48 languages, auto-detects browser language. Standard template text is pre-translated. Custom text must be translated manually.

## Cross-border data transfers

### EU-US Data Privacy Framework (DPF)

Status: active and valid (upheld by EU General Court 2025).

US companies self-certify at dataprivacyframework.gov. Major services (Google, Meta, Microsoft) are certified.

DPF covers the transfer mechanism only - still need consent for the cookies/processing itself. Some DPAs recommend having backup plan (SCCs) in case DPF is invalidated.

## Geo-targeting recommendations for a Swedish agency

| Visitor location | Banner behavior |
|-----------------|-----------------|
| EU/EEA | Full opt-in, block everything until consent |
| UK | Opt-in for marketing; analytics can load without consent (post-DUAA) |
| California | Notice + "Do Not Sell/Share" link, honor GPC |
| Other US states with laws | Opt-out notice per state |
| US without laws | Optional notice |
| Rest of world | Best practice notice |

Cookiebot supports geo-targeting natively (IP-based geolocation, configurable in admin panel).
