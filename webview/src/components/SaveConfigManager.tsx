import { useState, useEffect } from 'react';
import { messageHandler } from '@estruyf/vscode/dist/client';
import { SaveConfiguration } from '../types';

interface SaveConfigManagerProps {
  onClose?: () => void;
}

export default function SaveConfigManager({ onClose }: SaveConfigManagerProps) {
  const [config, setConfig] = useState<SaveConfiguration>({
    defaultSaveLocation: '',
    filenameTemplate: '{{slug}}.md',
  });

  const [preview, setPreview] = useState<{ location: string; fileName: string }>({
    location: '',
    fileName: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    generatePreview();
  }, [config]);

  const loadConfig = async () => {
    try {
      const loaded = await messageHandler.request<SaveConfiguration>('getSaveConfig');
      if (loaded) {
        setConfig(loaded);
      }
    } catch (error) {
      console.error('Error loading save config:', error);
    }
  };

  const generatePreview = async () => {
    try {
      const p = await messageHandler.request<{ location: string; fileName: string }>(
        'generatePreviewPath',
        config,
      );
      if (p) {
        setPreview(p);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      await messageHandler.request('updateSaveConfig', config);
      setMessage({ type: 'success', text: 'Save configuration updated successfully!' });

      setTimeout(() => {
        setMessage(null);
        if (onClose) {
          onClose();
        }
      }, 2000);
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await messageHandler.request('resetSaveConfig');
      setMessage({ type: 'success', text: 'Configuration reset to defaults!' });
      loadConfig();

      setTimeout(() => {
        setMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error resetting config:', error);
      setMessage({ type: 'error', text: 'Failed to reset configuration' });
    }
  };

  return (
    <div className='space-y-6 max-w-2xl'>
      <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
        <p className='text-sm text-blue-900 dark:text-blue-200'>
          Configure how your articles are saved. Use template variables like <code className='bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded'>{'{{fileName}}'}</code>, <code className='bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded'>{'{{slug}}'}</code>, <code className='bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded'>{'{{title}}'}</code>, <code className='bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded'>{'{{date|yyyy-MM-dd}}'}</code>, and <code className='bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded'>{'{{year}}'}</code>.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 ${message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-900 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
            }`}
        >
          {message.text}
        </div>
      )}

      <div className='space-y-4'>
        {/* Save Location */}
        <div>
          <label className='block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>
            Default Save Location (optional)
          </label>
          <p className='text-xs text-gray-600 dark:text-gray-400 mb-2'>
            Relative path from workspace root. Leave empty for workspace root. Variables: {'{{year}}'}, {'{{month}}'}, {'{{day}}'}, {'{{slug}}'}, {'{{title}}'}
          </p>
          <input
            type='text'
            value={config.defaultSaveLocation || ''}
            onChange={(e) =>
              setConfig({ ...config, defaultSaveLocation: e.target.value })
            }
            placeholder='e.g., articles/{{year}}/{{month}}'
            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-mono'
          />
          {preview.location && (
            <div className='mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700'>
              <p className='text-xs text-gray-600 dark:text-gray-400'>Preview: {preview.location}</p>
            </div>
          )}
        </div>

        {/* Filename Format */}
        <div>
          <label className='block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>
            Filename Template
          </label>
          <p className='text-xs text-gray-600 dark:text-gray-400 mb-2'>
            Variables: {'{{fileName}}'}, {'{{slug}}'}, {'{{title}}'}, {'{{date|format}}'} (e.g., yyyy-MM-dd), {'{{year}}'}, {'{{month}}'}, {'{{day}}'}
          </p>
          <input
            type='text'
            value={config.filenameTemplate || ''}
            onChange={(e) =>
              setConfig({ ...config, filenameTemplate: e.target.value })
            }
            placeholder='e.g., {{date|yyyy-MM-dd}}-{{slug}}.md'
            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-mono'
          />
          {preview.fileName && (
            <div className='mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700'>
              <p className='text-xs text-gray-600 dark:text-gray-400'>Preview: {preview.fileName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700'>
        <button
          onClick={handleReset}
          disabled={isSaving}
          className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 hover:cursor-pointer'
        >
          Reset to Defaults
        </button>
        <div className='flex gap-2'>
          {onClose && (
            <button
              onClick={onClose}
              disabled={isSaving}
              className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 hover:cursor-pointer'
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 hover:cursor-pointer'
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
