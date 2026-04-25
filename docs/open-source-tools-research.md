# Open Source GDPR Tools Research

## Most relevant for our use case

### Website scanners (audit automation)

| Tool | What it does | Language | Maintained | Link |
|------|-------------|----------|------------|------|
| **Crumble** | Automated cookie compliance scanner. Detects trackers loading before consent. Generates HTML/PDF reports. Batch processing via GitHub Actions. | PowerShell | Active (Mar 2026) | github.com/n7on/crumble |
| **AesirX Privacy Scanner** | Free web-based scanner based on EU EDPS software. Detects pre-consent behavior, AI advisor, instant PDF. No signup needed. | Web tool | Active (2026) | aesirx.io/services/privacy-scanner |
| **Helsinki GDPR Scanner** | Scans cookies, localStorage, sessionStorage, indexedDB. Generates interactive HTML reports. Docker-based. | Node.js | Active (Apr 2026) | github.com/City-of-Helsinki/GDPR-compliance-scanner |
| **EDPB Auditing Tool** | Official tool from European Data Protection Board. Desktop app, manual auditing, logs network activity. Authoritative reference. | Desktop | Stable (2024-25) | code.europa.eu/edpb/website-auditing-tool |

### Cookie consent alternatives (to Cookiebot)

| Tool | What it does | Cost | Link |
|------|-------------|------|------|
| **Silktide Consent Manager** | Open source banner with Google Consent Mode V2. No account, no traffic limits, 44Kb, multi-domain, multi-language. | Free forever | github.com/silktide/consent-manager |
| **Osano Cookie Consent** | Lightweight JS plugin, 3.5k GitHub stars, 38 languages, 2B+ monthly uses. | Free | github.com/osano/cookieconsent |

### Code-level privacy tools

| Tool | What it does | Link |
|------|-------------|------|
| **Privado AI** | Scans source code for data flows and privacy risks | privado.ai/open-source |
| **Slashgear gdpr-report** | CLI tool for automated consent checks, dark pattern detection | github.com/Slashgear/gdpr-report |

## Key takeaways

1. **Crumble** is the strongest match for our needs - batch scanning, professional reports, actively maintained, can run via GitHub Actions across all client sites
2. **AesirX** is great for quick one-off checks - no setup, instant results
3. **Silktide** is worth evaluating as a free Cookiebot alternative (unlimited domains, no cost tiers)
4. We should still keep Cookiebot for now (clients are already set up) but Silktide could be interesting for new projects or the merging company's sites
5. **EDPB tool** is useful as a reference for what the regulators themselves look for
