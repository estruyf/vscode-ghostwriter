import { Streamdown } from 'streamdown';
import { code } from "@streamdown/code";
import { CustomLinkModal } from './CustomLinkModal';
import { useState, useEffect } from 'react';
import { messageHandler } from '@estruyf/vscode/dist/client';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  mdClassname?: string;
}

export function MarkdownRenderer({ content, className = '', mdClassname = '' }: MarkdownRendererProps) {
  const [processedContent, setProcessedContent] = useState('');

  useEffect(() => {
    // Process image paths in markdown to convert relative file paths to data URIs
    const processImages = async () => {
      let processed = content;

      // Find all markdown image patterns: ![alt](path)
      const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      const matches = Array.from(content.matchAll(imageRegex));

      // Process each image
      for (const match of matches) {
        const fullMatch = match[0];
        const alt = match[1];
        const path = match[2];

        // Only process relative file paths (not http URLs)
        if (!path.startsWith('http://') && !path.startsWith('https://')) {
          try {
            // Request the image data from the backend
            const imageData = await messageHandler.request<string>('readImageFile', {
              filePath: path,
            });

            if (imageData) {
              // Replace the markdown image syntax with the same syntax but using data URI
              const escapedMatch = fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              processed = processed.replace(
                new RegExp(escapedMatch, 'g'),
                `![${alt}](${imageData})`
              );
            }
          } catch (error) {
            console.error(`Failed to load image from ${path}:`, error);
            // Keep the original markdown if loading fails
          }
        }
      }

      setProcessedContent(processed);
    };

    processImages();
  }, [content]);

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
        {processedContent}
      </Streamdown>
    </div>
  );
}
