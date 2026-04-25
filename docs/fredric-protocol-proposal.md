# Fredric's Proposed Protocol (2026-04-22)

Source: internal message to team after TSS incident.

## Context
- TSS is the second scare in a month
- Luna Diabetes faced a 150,000 fine (source: John)
- Lawyers are using automated bots to scan for cookie/consent misconfigurations
- Financial risk to clients and reputational risk to Stormfors

## Proposed standard protocol

### 1. Script order
Cookiebot script must be hardcoded FIRST in the header, before the GTM script.

### 2. Centralized tracking
No scripts hardcoded in header/footer. Everything must be managed through GTM.

### 3. GTM configuration
Tags must be correctly mapped to consent variables. Not enough to just "install" Cookiebot - the GTM script definition must include the necessary text variables to feed data correctly.

### 4. Verification
Use AI tools (Claude for site scanning, Inspector AI mode) to verify which scripts fire under different consent settings.

## Proposed deliverables
1. Comprehensive audit spreadsheet and checklist for all client websites
2. 360 protocol for best practices including technical configuration manual
3. Run the protocol for all hosted domains
4. Ensure compliance with both EU and US privacy regulations
