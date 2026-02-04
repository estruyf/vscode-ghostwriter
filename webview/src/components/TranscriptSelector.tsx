import { TranscriptFile } from '../types';

interface TranscriptSelectorProps {
  transcripts: TranscriptFile[];
  selectedTranscript: string;
  onTranscriptChange: (path: string) => void;
  customTranscript: string;
  onCustomSelect: () => void;
}

export function TranscriptSelector({
  transcripts,
  selectedTranscript,
  onTranscriptChange,
  customTranscript,
  onCustomSelect,
}: TranscriptSelectorProps) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4">Interview Transcript</h3>

      {transcripts.length > 0 ? (
        <div className="space-y-3 mb-4">
          <label className="block text-base font-medium text-slate-300 mb-2">
            From Workspace (<code>.ghostwriter/transcripts</code> folder)
          </label>
          <select
            value={selectedTranscript}
            onChange={(e) => onTranscriptChange(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="">Select a transcript...</option>
            {transcripts.map((t) => (
              <option key={t.path} value={t.path}>
                {t.name} {t.date && `(${t.date})`}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-base text-slate-400 mb-4">
          No transcripts found in .ghostwriter folder
        </p>
      )}

      <div className="space-y-2">
        <label className="block text-base font-medium text-slate-300">Or select custom file</label>
        {customTranscript && (
          <p className="text-base text-slate-400">Selected: {customTranscript}</p>
        )}
        <button
          onClick={onCustomSelect}
          className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
        >
          Browse for Transcript...
        </button>
      </div>
    </div>
  );
}
