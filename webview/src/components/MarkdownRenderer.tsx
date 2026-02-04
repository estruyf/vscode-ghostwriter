import { Streamdown } from 'streamdown';
import { code } from "@streamdown/code";
import { CustomLinkModal } from './CustomLinkModal';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  mdClassname?: string;
}

export function MarkdownRenderer({ content, className = '', mdClassname = '' }: MarkdownRendererProps) {
  if (!content) {
    return (
      <div className="text-slate-400 text-center py-12">
        No content available
      </div>
    );
  }

  return (
    <div className={`markdown_renderer prose prose-invert max-w-none ${className}`}>
      <Streamdown
        className={`text-slate-100 whitespace-pre-wrap prose prose-invert prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-xl prose-p:text-base prose-p:leading-relaxed prose-a:text-purple-400 hover:prose-a:text-purple-300 prose-a:underline prose-a:underline-offset-4 prose-a:decoration-purple-400/30 hover:prose-a:decoration-purple-300/50 prose-a:transition-colors [&_button]:cursor-pointer ${mdClassname}`}
        plugins={{ code: code }}
        controls={{
          table: false,
        }}
        linkSafety={{
          enabled: true,
          renderModal: (props) => <CustomLinkModal {...props} />,
        }}
      >
        {content}
      </Streamdown>
    </div>
  );
}
