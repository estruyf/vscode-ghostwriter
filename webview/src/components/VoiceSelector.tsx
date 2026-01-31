import { VoiceFile } from '../types';

interface VoiceSelectorProps {
  voiceFiles: VoiceFile[];
  selectedVoice: string;
  onVoiceChange: (path: string) => void;
  customVoice: string;
  onCustomSelect: () => void;
}

export function VoiceSelector({
  voiceFiles,
  selectedVoice,
  onVoiceChange,
  customVoice,
  onCustomSelect,
}: VoiceSelectorProps) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4">Voice File (Optional)</h3>

      {voiceFiles.length > 0 ? (
        <div className="space-y-3 mb-4">
          <label className="block text-base font-medium text-slate-300 mb-2">
            {voiceFiles.length === 1 ? 'Default Voice (.ghostwriter folder)' : 'Select Voice'}
          </label>
          <select
            value={selectedVoice}
            onChange={(e) => onVoiceChange(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="">No voice file</option>
            {voiceFiles.map((v) => (
              <option key={v.path} value={v.path}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-base text-slate-400 mb-4">
          No voice files found in .ghostwriter folder
        </p>
      )}

      <div className="space-y-2">
        <label className="block text-base font-medium text-slate-300">Or select custom file</label>
        {customVoice && (
          <p className="text-base text-slate-400">Selected: {customVoice}</p>
        )}
        <button
          onClick={onCustomSelect}
          className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
        >
          Browse for Voice File...
        </button>
      </div>
    </div>
  );
}
