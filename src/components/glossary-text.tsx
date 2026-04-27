"use client";

import { Fragment } from "react";
import { GlossaryTip } from "@/components/glossary-tip";
import { GLOSSARY } from "@/lib/glossary";

const TERM_PATTERNS: { pattern: RegExp; key: keyof typeof GLOSSARY }[] = [
  { pattern: /\bGoogle Consent Mode(?:\s+V2)?\b/i, key: "GCM" },
  { pattern: /\bGCM\b/, key: "GCM" },
  { pattern: /\bCMP\b/, key: "CMP" },
  { pattern: /\bGTM\b/, key: "GTM" },
  { pattern: /\bDPA(?:s)?\b/, key: "DPA" },
  { pattern: /\bDSAR\b/, key: "DSAR" },
  { pattern: /\bePrivacy(?:\s+Directive)?\b/, key: "ePrivacy" },
  { pattern: /\bAutoBlock\b/i, key: "AutoBlock" },
  { pattern: /\bConsent Initialization\b/, key: "ConsentInit" },
  { pattern: /\bDPF\b/, key: "DPF" },
  { pattern: /\bSCCs?\b/, key: "SCC" },
  { pattern: /\bIMY\b/, key: "IMY" },
  { pattern: /\bROPA\b/, key: "ROPA" },
  { pattern: /\bDPIA\b/, key: "DPIA" },
];

interface GlossaryTextProps {
  text: string;
}

export function GlossaryText({ text }: GlossaryTextProps) {
  const parts: { text: string; key?: keyof typeof GLOSSARY }[] = [];
  let remaining = text;
  const usedKeys = new Set<string>();

  while (remaining.length > 0) {
    let earliestMatch: { index: number; length: number; key: keyof typeof GLOSSARY } | null = null;

    for (const { pattern, key } of TERM_PATTERNS) {
      if (usedKeys.has(key)) continue;
      const match = remaining.match(pattern);
      if (match && match.index !== undefined) {
        if (!earliestMatch || match.index < earliestMatch.index) {
          earliestMatch = { index: match.index, length: match[0].length, key };
        }
      }
    }

    if (!earliestMatch) {
      parts.push({ text: remaining });
      break;
    }

    if (earliestMatch.index > 0) {
      parts.push({ text: remaining.slice(0, earliestMatch.index) });
    }

    parts.push({
      text: remaining.slice(earliestMatch.index, earliestMatch.index + earliestMatch.length),
      key: earliestMatch.key,
    });
    usedKeys.add(earliestMatch.key);
    remaining = remaining.slice(earliestMatch.index + earliestMatch.length);
  }

  return (
    <>
      {parts.map((part, i) =>
        part.key ? (
          <GlossaryTip key={i} term={part.key}>
            {part.text}
          </GlossaryTip>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        )
      )}
    </>
  );
}
