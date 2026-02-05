import React from 'react';
import { MessageContent, ImageAttachment } from '../types';
import { Streamdown } from 'streamdown';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string | MessageContent;
}

/**
 * Reusable chat message component
 * Displays a single message in the chat interface with role-based styling
 * Supports both text-only messages and messages with image attachments
 * Memoized to prevent unnecessary re-renders in long message lists
 */
const ChatMessage = React.memo(({ role, content }: ChatMessageProps) => {
  // Normalize content to MessageContent format
  const normalizedContent: MessageContent = typeof content === 'string'
    ? { text: content }
    : content;

  const hasImages = normalizedContent.images && normalizedContent.images.length > 0;

  return (
    <div className={`flex w-full gap-2 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-md px-4 py-3 relative ${role === 'user'
          ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-3xl rounded-tr-sm shadow-lg'
          : 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-100 rounded-3xl rounded-tl-sm shadow-md'
          }`}
      >
        {normalizedContent.text && (
          <Streamdown className="whitespace-pre-wrap wrap-break-word">{normalizedContent.text}</Streamdown>
        )}

        {hasImages && (
          <div className="mt-2 space-y-2">
            {normalizedContent.images!.map((image: ImageAttachment, idx: number) => (
              <div key={idx} className="rounded-2xl overflow-hidden">
                <img
                  src={image.data}
                  alt={image.name || `Image ${idx + 1}`}
                  className="max-w-full h-auto"
                  style={{ maxHeight: '300px' }}
                  loading="lazy"
                />
                {image.name && (
                  <p className="text-xs mt-1 opacity-70">{image.name}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
