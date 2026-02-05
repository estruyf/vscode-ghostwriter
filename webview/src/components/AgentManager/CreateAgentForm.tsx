interface CreateAgentFormProps {
  isOpen: boolean;
  agentName: string;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
}

/**
 * Reusable create agent form dialog
 * Used by both InterviewView and WriterView for creating new agents
 */
export default function CreateAgentForm({
  isOpen,
  agentName,
  onNameChange,
  onSubmit,
  onCancel,
  isLoading = false,
  title = 'Create Agent',
}: CreateAgentFormProps) {
  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && agentName.trim()) {
      onSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-700 shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Agent Name</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Technical Interviewer"
              autoFocus
              disabled={isLoading}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
            />
          </div>
          <p className="text-sm text-slate-400">
            A markdown file will be created and opened in your editor for you to write the agent prompt.
          </p>

          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 font-semibold rounded-lg transition-colors hover:cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={!agentName.trim() || isLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors hover:cursor-pointer"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
