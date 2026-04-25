# GDPR & ePrivacy Legal Requirements for Websites

Source: deep research, April 2026.

## Cookie consent rules

Two laws apply simultaneously: **ePrivacy Directive** (cookie-specific) and **GDPR** (personal data processing). The ePrivacy Regulation was withdrawn Feb 2025 - current rules remain.

### Cookie categories

| Category | Consent needed? | Examples |
|----------|----------------|---------|
| Strictly Necessary | No | Session, load balancing, security, shopping cart, login |
| Preferences | Yes | Language, UI customization, chat widgets |
| Statistics | Yes | Google Analytics, HotJar, Matomo |
| Marketing | Yes | Ad tracking, retargeting pixels, social pixels |

**Key rules:**
- Prior consent is MANDATORY for all non-essential cookies
- Opt-in only - pre-ticked boxes, implied consent (scrolling/continuing), time-based acceptance are all invalid
- Granular consent required - users must accept/reject by category
- Legitimate interest CANNOT replace consent for non-essential cookies
- Consent records must be kept 5+ years
- Cookie lifespan recommended under 13 months
- Regular scanning recommended quarterly

### Consent banner requirements

**Mandatory:**
- Clear plain-language explanation of cookie purposes
- Accept and Reject with equal prominence (same size, same clicks to reach)
- Granular per-category controls
- Link to cookie policy (separate from privacy policy)
- Link to privacy policy
- Data controller identification

**Prohibited dark patterns:**
- Accept more prominent than Reject
- Reject hidden behind multiple clicks
- Pre-ticked boxes
- Cookie walls blocking site access
- Fear/guilt-based language
- Bundling cookie consent with terms of service
- Implied consent through continued browsing

## Beyond cookies

### Privacy policy (MANDATORY - Art. 13/14)

Must contain ALL of:
- Controller identity and contact details
- DPO contact (if applicable)
- Purposes and legal basis for each processing activity
- Categories of personal data collected
- Recipients of data
- International transfer details and safeguards
- Specific retention periods (not vague)
- All data subject rights listed
- Right to withdraw consent
- Right to complain to supervisory authority
- Whether data provision is statutory/contractual requirement
- Automated decision-making info (if used)
- Clear plain language, accessible from every page

### Contact forms (MANDATORY)
- Data minimization - only collect what's needed
- Inform users at point of collection
- Link to privacy policy at/near form
- No pre-ticked consent checkboxes
- Separate consent for each purpose (inquiry vs marketing)
- SSL/TLS encryption for submissions

### Newsletter signups (MANDATORY)
- Explicit separate opt-in consent
- Double opt-in strongly recommended (effectively required in Germany)
- Easy unsubscribe from every email
- Keep records proving consent

### Data subject rights (MANDATORY - respond within 30 days)

| Right | Article |
|-------|---------|
| Access - copy of all personal data | Art. 15 |
| Rectification - correct inaccurate data | Art. 16 |
| Erasure - delete on request | Art. 17 |
| Restriction - stop processing during disputes | Art. 18 |
| Portability - export in machine-readable format | Art. 20 |
| Object - stop direct marketing (absolute right) | Art. 21 |
| Automated decisions - right to human review | Art. 22 |

### Data breach notification (MANDATORY - Art. 33)
- Notify supervisory authority within 72 hours
- If high risk: notify affected individuals directly
- Must include: nature, categories affected, consequences, measures taken
- Maintain breach register (even for unreported breaches)

### Tracking beyond cookies
Same consent rules apply to: local storage, session storage, IndexedDB, browser fingerprinting, server-side tracking, pixel tracking/web beacons.

## Third-party services

| Service | Action required |
|---------|----------------|
| Google Analytics | Consent before loading. IP anonymization. Sign DPA. Consider GA4 EU data residency. |
| Google Fonts (CDN) | Self-host (recommended) or consent-gate. Munich court: EUR 100/violation precedent. |
| YouTube/Vimeo | Use privacy-enhanced mode (youtube-nocookie.com). Block until consent or click-to-load. |
| Social pixels (Meta, LinkedIn, TikTok) | Block ALL until marketing consent. DPA with each provider. |
| Google Maps | Block until consent, or static image with link. |
| CDN (Cloudflare) | Security cookies usually Strictly Necessary. Include in privacy policy. DPA required. |
| Chat widgets | If non-essential cookies: consent before loading. DPA required. |
| Payment processors | Contractual necessity (no separate consent). DPA required. PCI DSS compliance. |
| CRM (HubSpot, Salesforce) | DPA required. Check DPF certification for US transfers. |

## Data Processing Agreements (MANDATORY - Art. 28)

Required for EVERY processor relationship:
- Agency <> Client (when agency processes client customer data)
- Client <> Hosting, Analytics, Email, CRM, Payment, any SaaS with personal data
- Agency <> Subcontractors handling client data
- Keep a vendor inventory with DPA status for each

## Records of Processing Activities (MANDATORY - Art. 30)

Must document: controller details, purposes, data categories, recipients, transfers, retention periods, security measures. Practically required for every website operator.

## Fines

| Tier | Maximum |
|------|---------|
| Upper (consent violations, data rights) | EUR 20M or 4% global revenue |
| Lower (procedural: missing ROPA, no DPA, no DPIA) | EUR 10M or 2% global revenue |

Cumulative GDPR fines since 2018: over EUR 7.1 billion. 2025 alone: EUR 1.2 billion.
Regulators now use automated scanning tools to detect violations at scale.
