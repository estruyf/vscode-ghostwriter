import { AgentFile } from '../../types';

interface AgentDialogProps {
  isOpen: boolean;
  agents: AgentFile[];
  onClose: () => void;
  onEdit: (agent: AgentFile) => void;
  onNew: () => void;
  title: string;
  emptyMessage: string;
}

/**
 * Reusable agent management dialog component
 * Used by both InterviewView and WriterView to manage their respective agents
 * Displays a list of agents with edit buttons and allows creating new agents
 */
export default function AgentDialog({
  isOpen,
  agents,
  onClose,
  onEdit,
  onNew,
  title,
  emptyMessage,
}: AgentDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-2xl rounded-xl bg-slate-900 border border-slate-700 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors hover:cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {agents.length === 0 ? (
            <p className="text-sm text-slate-400">{emptyMessage}</p>
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.path}
                  className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{agent.name}</p>
                    <p className="text-xs text-slate-400 truncate">{agent.path}</p>
                  </div>
                  <button
                    onClick={() => onEdit(agent)}
                    className="ml-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors whitespace-nowrap hover:cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 flex gap-2 justify-end">
          <button
            onClick={onNew}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors hover:cursor-pointer"
          >
            + New
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-lg transition-colors hover:cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
