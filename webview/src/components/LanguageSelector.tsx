import { useEffect, useState } from 'react';
import { messageHandler } from '@estruyf/vscode/dist/client';

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
  disabled?: boolean;
  className?: string;
}

// Common languages for content creation
const LANGUAGES = [
  { code: '', label: 'Default (English)' },
  { code: 'English', label: 'English' },
  { code: 'Spanish', label: 'Spanish (Español)' },
  { code: 'French', label: 'French (Français)' },
  { code: 'German', label: 'German (Deutsch)' },
  { code: 'Italian', label: 'Italian (Italiano)' },
  { code: 'Portuguese', label: 'Portuguese (Português)' },
  { code: 'Dutch', label: 'Dutch (Nederlands)' },
  { code: 'Chinese', label: 'Chinese (中文)' },
  { code: 'Japanese', label: 'Japanese (日本語)' },
  { code: 'Korean', label: 'Korean (한국어)' },
  { code: 'Russian', label: 'Russian (Русский)' },
  { code: 'Arabic', label: 'Arabic (العربية)' },
  { code: 'Hindi', label: 'Hindi (हिन्दी)' },
  { code: 'Turkish', label: 'Turkish (Türkçe)' },
  { code: 'Polish', label: 'Polish (Polski)' },
  { code: 'Swedish', label: 'Swedish (Svenska)' },
  { code: 'Norwegian', label: 'Norwegian (Norsk)' },
  { code: 'Danish', label: 'Danish (Dansk)' },
  { code: 'Finnish', label: 'Finnish (Suomi)' },
];

export function LanguageSelector({ value, onChange, disabled, className }: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(value);

  useEffect(() => {
    setSelectedLanguage(value);
  }, [value]);

  const handleChange = async (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    onChange(newLanguage);
    
    // Persist to workspace state
    await messageHandler.send('setSelectedLanguage', { language: newLanguage });
  };

  return (
    <div className={className}>
      <label className="block text-base font-medium text-slate-300 mb-2">
        Content Language
        <span className="text-slate-500 font-normal ml-1">(Optional)</span>
      </label>
      <select
        value={selectedLanguage}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
      {selectedLanguage && (
        <p className="mt-2 text-sm text-slate-500">
          Content will be created in {LANGUAGES.find(l => l.code === selectedLanguage)?.label || 'the selected language'}
        </p>
      )}
    </div>
  );
}
