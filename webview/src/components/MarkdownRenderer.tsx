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
    <div className={`prose prose-invert max-w-none ${className}`}>
      <Streamdown
        className={`text-slate-100 whitespace-pre-wrap prose prose-invert prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-xl prose-p:text-base prose-p:leading-relaxed [&_button]:cursor-pointer ${mdClassname}`}
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
