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
 */
export default function ChatInput({
  inputValue,
  setInputValue,
  onSubmit,
  isSending,
  textareaRef,
}: ChatInputProps) {
  return (
    <div className="border-t border-slate-700 bg-slate-900 px-6 py-4">
      <form onSubmit={onSubmit} className="space-y-2">
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
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50 resize-none"
          rows={3}
        />
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">Type "stop" or "done" when you want to end the interview.</p>
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
  );
}
