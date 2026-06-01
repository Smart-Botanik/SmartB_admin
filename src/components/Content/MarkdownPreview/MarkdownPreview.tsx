import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveMediaRefs } from "@growing/content-markdown";

type MarkdownPreviewProps = {
  markdown: string;
  mediaUrlById?: Record<string, string>;
  className?: string;
};

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  markdown,
  mediaUrlById = {},
  className,
}) => {
  const resolved = resolveMediaRefs(markdown, mediaUrlById);

  return (
    <div
      className={className ?? "guide-md-preview"}
      style={{
        padding: 16,
        border: "1px solid #f0f0f0",
        borderRadius: 8,
        minHeight: 200,
        background: "#fafafa",
        lineHeight: 1.6,
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{resolved || "*Пусто*"}</ReactMarkdown>
    </div>
  );
};
