import React from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Reusable chat message component
 * Displays a single message in the chat interface with role-based styling
 * Memoized to prevent unnecessary re-renders in long message lists
 */
const ChatMessage = React.memo(({ role, content }: ChatMessageProps) => (
  <div className={`flex w-full ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`max-w-md rounded-lg px-4 py-2 ${role === 'user'
          ? 'bg-purple-600 text-white'
          : 'bg-slate-800 text-slate-100'
        }`}
    >
      <p className="whitespace-pre-wrap break-words text-sm">{content}</p>
    </div>
  </div>
));

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
