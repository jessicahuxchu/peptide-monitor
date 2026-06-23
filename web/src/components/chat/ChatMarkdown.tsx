import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  return (
    <div className={cn("chat-markdown text-sm leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold text-command-text">{children}</strong>
        ),
        em: ({ children }) => <em className="italic text-command-text-secondary">{children}</em>,
        h1: ({ children }) => (
          <h1 className="mb-2 mt-3 text-base font-semibold text-command-text first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 mt-3 text-sm font-semibold text-command-text first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1.5 mt-2 text-sm font-medium text-command-text first:mt-0">
            {children}
          </h3>
        ),
        ul: ({ children }) => (
          <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li className="text-command-text-secondary">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-command-teal-bright underline underline-offset-2 hover:text-command-teal"
          >
            {children}
          </a>
        ),
        code: ({ className: codeClass, children }) => {
          const isBlock = codeClass?.includes("language-");
          if (isBlock) {
            return (
              <code className="block overflow-x-auto rounded-md bg-black/40 px-3 py-2 font-mono text-xs text-command-text">
                {children}
              </code>
            );
          }
          return (
            <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs text-command-teal-bright">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="mb-2 overflow-x-auto rounded-md bg-black/40 p-3 last:mb-0">{children}</pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-command-teal/50 pl-3 text-command-text-muted last:mb-0">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-3 border-command-border" />,
        table: ({ children }) => (
          <div className="mb-2 overflow-x-auto last:mb-0">
            <table className="w-full border-collapse text-xs">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-command-border bg-command-card px-2 py-1 text-left font-medium text-command-text">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-command-border px-2 py-1 text-command-text-secondary">
            {children}
          </td>
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
