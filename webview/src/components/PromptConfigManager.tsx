import { useState, useEffect } from 'react';
import { messageHandler } from '@estruyf/vscode/dist/client';
import { PromptConfig, PromptConfigInput } from '../types';

interface PromptConfigManagerProps {
  selectedConfigId?: string;
  onSelect: (configId: string) => void;
}

export default function PromptConfigManager({
  selectedConfigId,
  onSelect,
}: PromptConfigManagerProps) {
  const [configs, setConfigs] = useState<PromptConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PromptConfigInput>({
    name: '',
    description: '',
    domain: '',
    systemPrompt: '',
    tags: [],
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const loaded = await messageHandler.request<PromptConfig[]>('getPromptConfigs');
      setConfigs(loaded || []);
    } catch (error) {
      console.error('Error loading prompt configs:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.domain || !formData.systemPrompt) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingId) {
        const updated = await messageHandler.request<PromptConfig>('updatePromptConfig', {
          id: editingId,
          updates: formData,
        });
        setConfigs(configs.map(c => c.id === editingId ? updated : c));
        setEditingId(null);
      } else {
        const created = await messageHandler.request<PromptConfig>('createPromptConfig', formData);
        setConfigs([...configs, created]);
      }
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving prompt config:', error);
      alert('Failed to save prompt configuration');
    }
  };

  const handleEdit = (config: PromptConfig) => {
    setFormData({
      name: config.name,
      description: config.description,
      domain: config.domain,
      systemPrompt: config.systemPrompt,
      tags: config.tags,
    });
    setEditingId(config.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    try {
      await messageHandler.request('deletePromptConfig', { id });
      setConfigs(configs.filter(c => c.id !== id));
      if (selectedConfigId === id) {
        onSelect('');
      }
    } catch (error) {
      console.error('Error deleting prompt config:', error);
      alert('Failed to delete prompt configuration');
    }
  };

  const handleExport = async (config: PromptConfig) => {
    try {
      const json = await messageHandler.request<string>('exportPromptConfig', { config });
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json));
      element.setAttribute('download', `${config.name.replace(/\s+/g, '_')}.json`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Error exporting prompt config:', error);
      alert('Failed to export configuration');
    }
  };

  const handleImport = async () => {
    try {
      // Trigger file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const text = await file.text();
          const imported = await messageHandler.request<PromptConfig>('importPromptConfig', { json: text });
          setConfigs([...configs, imported]);
        }
      };
      input.click();
    } catch (error) {
      console.error('Error importing prompt config:', error);
      alert('Failed to import configuration');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      domain: '',
      systemPrompt: '',
      tags: [],
    });
    setEditingId(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Header with buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-base font-semibold rounded-lg transition-colors hover:cursor-pointer"
          >
            + New Config
          </button>
          <button
            onClick={handleImport}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 text-base font-semibold rounded-lg transition-colors hover:cursor-pointer"
          >
            Import
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg space-y-4">
          <h4 className="text-base font-semibold text-white">
            {editingId ? 'Edit Configuration' : 'Create New Configuration'}
          </h4>

          <div className="space-y-2">
            <label className="block text-base font-medium text-slate-300">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Blog Posts, Strategy Docs"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium text-slate-300">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this configuration for?"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium text-slate-300">Domain *</label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="e.g., blog, specs, internal_comms"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium text-slate-300">System Prompt *</label>
            <textarea
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              placeholder="Enter the system prompt that defines how the AI should behave..."
              rows={8}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono text-base"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium text-slate-300">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tags: e.target.value.split(',').map(t => t.trim()).filter(t => t),
                })
              }
              placeholder="e.g., technical, marketing, documentation"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-base font-semibold rounded-lg transition-colors hover:cursor-pointer"
            >
              {editingId ? 'Update' : 'Create'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 text-base font-semibold rounded-lg transition-colors hover:cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Configurations list */}
      <div className="space-y-3">
        {configs.length === 0 ? (
          <p className="text-center text-slate-400 text-base py-6">
            No configurations yet. Create one to get started!
          </p>
        ) : (
          configs.map((config) => (
            <div
              key={config.id}
              className={`border rounded-lg transition-all ${selectedConfigId === config.id
                ? 'bg-slate-700 border-purple-500'
                : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                } ${config.id.startsWith('preset_') ? 'opacity-90' : ''}`}
            >
              {/* Config header */}
              <div
                className="p-3 flex items-center gap-3 cursor-pointer"
                onClick={() => {
                  onSelect(config.id);
                  if (expandedId !== config.id) {
                    setExpandedId(config.id);
                  }
                }}
              >
                <input
                  type="radio"
                  name="promptConfig"
                  value={config.id}
                  checked={selectedConfigId === config.id}
                  onChange={() => {
                    onSelect(config.id);
                    setExpandedId(config.id);
                  }}
                  className="w-4 h-4 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="text-base font-semibold text-white truncate">{config.name}</h5>
                  <p className="text-sm text-slate-400 truncate">{config.description}</p>
                </div>
                <span className="inline-block px-2 py-1 bg-slate-700 text-slate-300 text-sm font-medium rounded whitespace-nowrap">
                  {config.domain}
                </span>

                {config.id.startsWith('preset_') ? (
                  <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-300 text-sm font-semibold rounded whitespace-nowrap">
                    PRESET
                  </span>
                ) : (
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(config);
                      }}
                      className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-200 hover:cursor-pointer"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(config.id);
                      }}
                      className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-slate-400 hover:text-red-400 hover:cursor-pointer"
                      title="Delete"
                    >
                      ✕
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExport(config);
                      }}
                      className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-200 hover:cursor-pointer"
                      title="Export"
                    >
                      ↓3 text-base font-mono text-slate-300 overflow-x-auto max-h-[500px]
                    </button>
                  </div>
                )}
              </div>

              {/* Config preview */}
              {expandedId === config.id && (
                <div className="px-3 pb-3 pt-0 border-t border-slate-700 space-y-3">
                  <div>
                    <h6 className="text-sm font-semibold text-slate-300 mb-2">System Prompt:</h6>
                    <pre className="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-300 overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
                      {config.systemPrompt}
                    </pre>
                  </div>
                  {config.tags && config.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {config.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-2 py-1 bg-slate-700 text-slate-300 text-sm rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
