import ReactMarkdown from "react-markdown";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-base prose-h4:text-sm prose-p:leading-relaxed prose-table:text-sm prose-th:text-left prose-th:font-medium prose-td:py-1.5 prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:text-xs">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
