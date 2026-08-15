import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Server Component (no "use client") — Sonnet-authored guide markdown is
// parsed to semantic HTML entirely during RSC render, so crawlers and GEO
// engines get the finished <article> in the initial HTML response instead
// of waiting on client-side parsing.
//
// Headings are shifted down one level (markdown h1 -> <h2>, h2 -> <h3>, ...)
// because the page's own <h1>{card.cardName}</h1> already owns the top of
// the document outline; keeping the guide's headings nested under it is
// what preserves an unbroken heading hierarchy for AI search citation.
const components: Components = {
  h1: ({ children }) => <h2 className="text-xl font-bold text-white">{children}</h2>,
  h2: ({ children }) => <h3 className="text-lg font-bold text-white">{children}</h3>,
  h3: ({ children }) => <h4 className="text-base font-semibold text-white">{children}</h4>,
  h4: ({ children }) => <h5 className="text-sm font-semibold text-white">{children}</h5>,
  p: ({ children }) => <p className="leading-relaxed text-neutral-300">{children}</p>,
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-5 text-neutral-300">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5 text-neutral-300">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-neutral-700 pl-4 text-neutral-400 italic">{children}</blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-sm text-neutral-200">{children}</code>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-blue-400 underline-offset-2 hover:underline"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-neutral-800 bg-neutral-900 px-3 py-2 text-left font-semibold text-white">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border border-neutral-800 px-3 py-2 text-neutral-300">{children}</td>,
};

/** Renders Sonnet-generated wiki markdown as semantic HTML for the SSR
 * guide tab. Never call with empty/whitespace-only markdown — the caller
 * (CardTabs' guideContent prop) must stay null in that case so no empty
 * heading/tag structure ever reaches the page. */
export function GuideMarkdown({ markdown }: { markdown: string }) {
  return (
    <article className="space-y-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
