import { X } from 'lucide-react';
import SaveConfigManager from './SaveConfigManager';

interface SaveSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SaveSettingsModal({ isOpen, onClose }: SaveSettingsModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Save Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors hover:cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <SaveConfigManager onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
