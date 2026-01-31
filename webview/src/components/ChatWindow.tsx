import { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

/**
 * Chat window component
 * Displays the message history with auto-scroll support
 * Uses memoized ChatMessage components for performance
 */
export default function ChatWindow({ messages, isLoading, messagesEndRef }: ChatWindowProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
      {messages.map((msg, idx) => (
        <ChatMessage key={idx} role={msg.role} content={msg.content} />
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-lg">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
