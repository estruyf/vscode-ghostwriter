import { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSending: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

/**
 * Chat input component
 * Textarea for user input with send button
 * Supports Shift+Enter for new lines, Enter to send
 * Resizable from the top border
 */
export default function ChatInput({
  inputValue,
  setInputValue,
  onSubmit,
  isSending,
  textareaRef,
}: ChatInputProps) {
  const [height, setHeight] = useState(140);
  const isResizing = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;

      const newHeight = window.innerHeight - e.clientY;
      const maxHeight = window.innerHeight - 100; // Keep some space for header

      if (newHeight >= 140 && newHeight <= maxHeight) {
        setHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      className="relative bg-slate-900 px-6 py-4 border-t border-slate-700 flex flex-col"
      style={{ height: `${height}px`, minHeight: '140px' }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1.5 -mt-0.5 cursor-ns-resize z-50 hover:bg-purple-500/50 transition-colors"
        onMouseDown={(e) => {
          isResizing.current = true;
          document.body.style.cursor = 'ns-resize';
          e.preventDefault();
        }}
        title="Drag to resize"
      />

      <form onSubmit={onSubmit} className="space-y-2 flex-1 flex flex-col h-full">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e as any);
            }
          }}
          placeholder="Type your answer (or 'stop' to end)... Shift+Enter for new line"
          disabled={isSending}
          className="w-full flex-1 min-h-24 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50 resize-none"
        />
        <div className="flex justify-between items-center shrink-0">
          <p className="text-sm text-slate-500">Type "stop" or "done" when you want to end the interview.</p>
          <button
            type="submit"
            disabled={isSending || !inputValue.trim()}
            className="px-6 py-2 bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all hover:cursor-pointer"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
