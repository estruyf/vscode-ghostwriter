import { useState, useEffect, useRef } from 'react';
import { messageHandler } from '@estruyf/vscode/dist/client';
import ModelSelector from './ModelSelector';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const INTERVIEW_COMPLETION_PHRASES = [
  'interview is now complete',
  'interview is complete',
  'the interview has concluded',
  'we\'ve concluded the interview',
  'interview completed',
];

declare const acquireVsCodeApi: () => any;

export default function InterviewView({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasStartedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus textarea when AI responds (not loading and not sending)
    if (!isLoading && !isSending && messages.length > 0) {
      textareaRef.current?.focus();
    }
  }, [isLoading, isSending, messages.length]);

  useEffect(() => {
    // Handle messages from the extension
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === 'interviewMessage') {
        const { role, content } = message.payload;
        setMessages((prev) => [...prev, { role, content }]);
        setIsSending(false);
        setIsLoading(false);

        // Auto-detect interview completion
        if (role === 'assistant') {
          const lowerContent = content.toLowerCase();
          const isInterviewComplete = INTERVIEW_COMPLETION_PHRASES.some((phrase) =>
            lowerContent.includes(phrase),
          );

          if (isInterviewComplete) {
            // Wait a moment for the message to be visible, then auto-end
            setTimeout(() => {
              messageHandler.send('interview:end', { isManualStop: false });
            }, 1500);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    // Start the interview immediately when component mounts (only once)
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      messageHandler.send('interview:start', {});
    }
  }, []);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const userMessage = inputValue.trim();

    // Check for end commands
    if (userMessage.toLowerCase() === 'stop' || userMessage.toLowerCase() === 'done') {
      setIsSending(true);
      messageHandler.send('interview:end', { isManualStop: true });
      return;
    }

    // Add user message to the chat
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInputValue('');
    setIsSending(true);

    // Send the message to the extension
    messageHandler.send('interview:message', { message: userMessage });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-200 transition-colors hover:cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-semibold text-white">Interview Session</h2>
            <p className="text-sm text-slate-400">Answer questions to gather content material</p>
          </div>
        </div>
        <ModelSelector />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xl lg:max-w-2xl px-4 py-3 rounded-lg ${msg.role === 'user'
                ? 'bg-purple-600 text-white rounded-br-none'
                : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
          </div>
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

      {/* Input Area */}
      <div className="border-t border-slate-700 bg-slate-900 px-6 py-4">
        <form onSubmit={sendMessage} className="space-y-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e as any);
              }
            }}
            placeholder="Type your answer (or 'stop' to end)... Shift+Enter for new line"
            disabled={isSending}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50 resize-none"
            rows={3}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">Type "stop" or "done" when you want to end the interview.</p>
            <button
              type="submit"
              disabled={isSending || !inputValue.trim()}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all hover:cursor-pointer"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
