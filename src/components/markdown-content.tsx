import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h1:border-b prose-h1:pb-3 prose-h1:mb-6 prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-base prose-h3:mt-6 prose-h4:text-sm prose-h4:mt-4 prose-p:leading-relaxed prose-p:text-foreground/90 prose-strong:text-foreground prose-table:text-sm prose-th:text-left prose-th:font-medium prose-th:px-3 prose-th:py-2 prose-th:bg-muted prose-td:px-3 prose-td:py-2 prose-td:border-b prose-td:border-border prose-code:text-xs prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted prose-pre:text-xs prose-pre:rounded-md prose-li:text-foreground/90 prose-hr:border-border prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </article>
  );
}
