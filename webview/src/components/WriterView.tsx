import { useState, useEffect } from 'react';
import { messageHandler } from '@estruyf/vscode/dist/client';
import { TranscriptFile, VoiceFile } from '../types';

export default function WriterView() {
  const [transcripts, setTranscripts] = useState<TranscriptFile[]>([]);
  const [voiceFiles, setVoiceFiles] = useState<VoiceFile[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [customTranscript, setCustomTranscript] = useState<string>('');
  const [customVoice, setCustomVoice] = useState<string>('');

  useEffect(() => {
    // Request transcript and voice files on mount
    messageHandler.request<TranscriptFile[]>('getTranscripts').then((response) => {
      setTranscripts(response || []);
    }).catch((error) => {
      console.error('Error loading transcripts:', error);
      setTranscripts([]);
    });

    messageHandler.request<VoiceFile[]>('getVoiceFiles').then((response) => {
      setVoiceFiles(response || []);
      // Auto-select if only one voice file
      if (response?.length === 1) {
        setSelectedVoice(response[0].path);
      }
    }).catch((error) => {
      console.error('Error loading voice files:', error);
      setVoiceFiles([]);
    });
  }, []);

  const selectCustomTranscript = () => {
    messageHandler.request<string>('selectCustomTranscript').then((response) => {
      if (response) {
        setCustomTranscript(response);
        setSelectedTranscript('');
      }
    }).catch((error) => {
      console.error('Error selecting custom transcript:', error);
    });
  };

  const selectCustomVoice = () => {
    messageHandler.request<string>('selectCustomVoice').then((response) => {
      if (response) {
        setCustomVoice(response);
        setSelectedVoice('');
      }
    }).catch((error) => {
      console.error('Error selecting custom voice:', error);
    });
  };

  const startWriting = () => {
    const transcript = customTranscript || selectedTranscript;
    const voice = customVoice || selectedVoice;

    if (!transcript) {
      return;
    }

    messageHandler.send('startWriting', { transcript, voice });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Writer</h1>
      <p className="mb-6 opacity-80">
        Select an interview transcript and voice file to start writing.
      </p>

      {/* Transcript Selection */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-3">Interview Transcript</h2>
        
        {transcripts.length > 0 ? (
          <div className="space-y-2 mb-3">
            <label className="block font-medium text-sm mb-1">
              From Workspace (.ghostwriter folder)
            </label>
            <select
              value={selectedTranscript}
              onChange={(e) => {
                setSelectedTranscript(e.target.value);
                setCustomTranscript('');
              }}
              className="w-full px-3 py-2 bg-vscode-input border border-vscode-border rounded focus:outline-none focus:ring-2 focus:ring-vscode-button"
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
          <p className="text-sm opacity-60 mb-3">
            No transcripts found in .ghostwriter folder
          </p>
        )}

        <div className="space-y-2">
          <label className="block font-medium text-sm">Or select custom file</label>
          {customTranscript && (
            <p className="text-sm opacity-80 mb-1">Selected: {customTranscript}</p>
          )}
          <button
            onClick={selectCustomTranscript}
            className="px-4 py-2 bg-vscode-input hover:bg-vscode-button-hover border border-vscode-border rounded"
          >
            Browse for Transcript...
          </button>
        </div>
      </div>

      {/* Voice File Selection */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-3">Voice File (Optional)</h2>
        
        {voiceFiles.length > 0 ? (
          <div className="space-y-2 mb-3">
            <label className="block font-medium text-sm mb-1">
              {voiceFiles.length === 1 ? 'Default Voice' : 'Select Voice'}
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => {
                setSelectedVoice(e.target.value);
                setCustomVoice('');
              }}
              className="w-full px-3 py-2 bg-vscode-input border border-vscode-border rounded focus:outline-none focus:ring-2 focus:ring-vscode-button"
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
          <p className="text-sm opacity-60 mb-3">
            No voice files found in .ghostwriter folder
          </p>
        )}

        <div className="space-y-2">
          <label className="block font-medium text-sm">Or select custom file</label>
          {customVoice && (
            <p className="text-sm opacity-80 mb-1">Selected: {customVoice}</p>
          )}
          <button
            onClick={selectCustomVoice}
            className="px-4 py-2 bg-vscode-input hover:bg-vscode-button-hover border border-vscode-border rounded"
          >
            Browse for Voice File...
          </button>
        </div>
      </div>

      {/* Start Writing Button */}
      <div className="mt-8">
        <button
          onClick={startWriting}
          disabled={!selectedTranscript && !customTranscript}
          className="px-6 py-2 bg-vscode-button hover:bg-vscode-button-hover text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Writing
        </button>
      </div>
    </div>
  );
}
