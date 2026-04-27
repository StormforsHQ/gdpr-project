"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GLOSSARY } from "@/lib/glossary";

interface GlossaryTipProps {
  term: keyof typeof GLOSSARY;
  children?: React.ReactNode;
}

export function GlossaryTip({ term, children }: GlossaryTipProps) {
  const entry = GLOSSARY[term];
  if (!entry) return <>{children || term}</>;

  return (
    <Tooltip>
      <TooltipTrigger
        className="underline decoration-dotted underline-offset-2 cursor-help"
        onClick={(e) => e.stopPropagation()}
      >
        {children || term}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium">{entry.term}</p>
        <p className="mt-1 text-[11px] opacity-80 leading-snug">{entry.definition}</p>
      </TooltipContent>
    </Tooltip>
  );
}
