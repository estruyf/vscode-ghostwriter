import { AgentFile } from '../types';

interface AgentSelectorProps {
  value?: string;
  onChange?: (agentPath: string) => void;
  agents: AgentFile[];
  onManage?: () => void;
  onCreateNew?: () => void;
  className?: string;
  label?: string;
}

export default function AgentSelector({
  value = '',
  onChange,
  agents,
  onManage,
  onCreateNew,
  className = '',
  label = 'Writer Agent',
}: AgentSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2 bg-slate-800/50 p-1 pl-3 pr-2 rounded-lg border border-slate-700/50 flex-1 min-w-0">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className="h-4 w-px bg-slate-700 mx-1"></div>
        <div className={`flex items-center gap-2 flex-1 ${className}`}>
          <select
            value={value}
            onChange={handleChange}
            className="flex-1 bg-transparent text-white text-sm focus:outline-none border-none py-1 pr-2 cursor-pointer hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed truncate"
          >
            <option value="">Default Writer</option>
            {agents.map((agent) => (
              <option key={agent.path} value={agent.path}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {onManage && (
        <button
          onClick={onManage}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors border border-slate-700 hover:cursor-pointer"
          title="Manage Writer Agents"
        >
          Manage
        </button>
      )}
      {onCreateNew && (
        <button
          onClick={onCreateNew}
          className="px-3 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 text-xs font-semibold rounded-lg transition-colors border border-purple-500/30 hover:cursor-pointer"
          title="Create New Writer Agent"
        >
          + New
        </button>
      )}
    </div>
  );
}
