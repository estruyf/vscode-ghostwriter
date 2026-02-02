import { useState, useEffect } from 'react';
import { messageHandler } from '@estruyf/vscode/dist/client';

interface Model {
  id: string;
  name: string;
  family: string;
}

interface ModelSelectorProps {
  value?: string;
  onChange?: (modelId: string) => void;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

const DEFAULT_MODEL_NAME = 'GPT-5 mini';

export default function ModelSelector({
  value,
  onChange,
  className = '',
  label = 'Model:',
  showLabel = true
}: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(value || '');

  useEffect(() => {
    const fetchModels = async () => {
      let availableModels = await messageHandler.request<Model[]>('getModels', {});
      if (availableModels && availableModels.length > 0) {
        availableModels = availableModels.filter(model => model.id !== 'auto');
        availableModels = availableModels.sort((a, b) => a.name.localeCompare(b.id));
        setModels(availableModels.filter(model => model.id !== 'auto'));

        // Set initial model if not provided
        if (!value && !selectedModel) {
          // Load from backend state
          const storedModelId = await messageHandler.request<string>('getSelectedModelId', {});
          const storedModel = storedModelId ? availableModels.find((model) => model.id === storedModelId) : null;

          if (storedModel) {
            setSelectedModel(storedModel.id);
            onChange?.(storedModel.id);
            return;
          }

          // Fallback to default model
          const defaultModel = availableModels.find((model) =>
            model.name.toLowerCase() === DEFAULT_MODEL_NAME.toLowerCase(),
          );
          if (defaultModel) {
            setSelectedModel(defaultModel?.id);
            onChange?.(defaultModel.id);
            messageHandler.send('setSelectedModelId', { modelId: defaultModel.id });
            return;
          }

          // Fallback to first model
          const defaultModelId = availableModels[0].id;
          setSelectedModel(defaultModelId);
          onChange?.(defaultModelId);
          messageHandler.send('setSelectedModelId', { modelId: defaultModelId });
        }
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    if (value !== undefined && value !== selectedModel) {
      setSelectedModel(value);
      // Persist to backend state
      messageHandler.send('setSelectedModelId', { modelId: value });
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setSelectedModel(newValue);
    // Persist to backend state
    messageHandler.send('setSelectedModelId', { modelId: newValue });
    onChange?.(newValue);
  };

  if (models.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && <span className="text-base text-slate-300">{label}</span>}
      <select
        value={selectedModel}
        onChange={handleChange}
        className="bg-transparent text-white text-sm focus:outline-none border-none py-1 pr-2 cursor-pointer hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed max-w-50 truncate appearance-none"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.id}
          </option>
        ))}
      </select>
    </div>
  );
}
