import { useState, useEffect, useRef } from 'react';
import { messageHandler } from '@estruyf/vscode/dist/client';
import { TranscriptFile, VoiceFile } from '../types';
import { Streamdown } from 'streamdown';
import { code } from "@streamdown/code";
import ModelSelector from './ModelSelector';

declare const acquireVsCodeApi: () => any;

export default function WriterView({ onBack }: { onBack: () => void }) {
  const [transcripts, setTranscripts] = useState<TranscriptFile[]>([]);
  const [voiceFiles, setVoiceFiles] = useState<VoiceFile[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [customTranscript, setCustomTranscript] = useState<string>('');
  const [customVoice, setCustomVoice] = useState<string>('');
  const [isWriting, setIsWriting] = useState(false);
  const [isFinishedWriting, setIsFinishedWriting] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [writingStyle, setWritingStyle] = useState<'formal' | 'casual' | 'conversational'>('conversational');
  const [includeHeadings, setIncludeHeadings] = useState(true);
  const [includeSEO, setIncludeSEO] = useState(true);
  const [keywords, setKeywords] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [frontmatter, setFrontmatter] = useState<string>('');
  const [showFrontmatterEditor, setShowFrontmatterEditor] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when content updates
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamingContent]);

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

    // Load frontmatter template from backend
    messageHandler.request<string>('getFrontmatterTemplate').then((response) => {
      if (response) {
        setFrontmatter(response);
      }
    }).catch((error) => {
      console.error('Error loading frontmatter template:', error);
    });
  }, []);

  useEffect(() => {
    // Handle messages from the extension
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === 'writingStream') {
        if (message.payload?.chunk) {
          setStreamingContent((prev) => prev + message.payload.chunk);
        }
      } else if (message.command === 'writingComplete') {
        setIsFinishedWriting(true);
      } else if (message.command === 'failedWriting') {
        setIsWriting(false);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
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

    setIsWriting(true);
    setStreamingContent('');

    const options = {
      style: writingStyle,
      includeHeadings,
      includeSEO,
      keywords: keywords.trim() || undefined
    };

    messageHandler.send('startWriting', {
      transcript,
      voice,
      options,
      modelId: selectedModelId,
      frontmatter: frontmatter.trim() || undefined
    });
  };

  const saveFrontmatter = () => {
    messageHandler.send('setFrontmatterTemplate', { template: frontmatter.trim() || undefined });
    setShowFrontmatterEditor(false);
  };

  const clearFrontmatter = () => {
    setFrontmatter('');
    messageHandler.send('setFrontmatterTemplate', { template: undefined });
  };

  const saveArticle = () => {
    if (!streamingContent) return;

    setIsSaving(true);
    messageHandler.send('saveArticle', { content: streamingContent });
    setIsSaving(false);
  };

  if (isWriting) {
    return (
      <div className="flex flex-col h-screen bg-slate-950">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-slate-400 hover:text-slate-200 transition-colors hover:cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {streamingContent ? 'Article Generated' : 'Generating Article'}
              </h2>
              <p className="text-sm text-slate-400">
                {streamingContent ? 'Review and save your generated article' : 'Creating your article from the transcript...'}
              </p>
            </div>
          </div>

          <div className='gap-4 grid grid-cols-2'>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-slate-700 text-slate-200 font-semibold rounded-lg hover:bg-slate-600 transition-all hover:cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={saveArticle}
              disabled={isSaving || !streamingContent || !isFinishedWriting}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all hover:cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save Article'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto" ref={contentRef}>
          <div className="p-6 max-w-4xl mx-auto">
            <div className="prose prose-invert max-w-none">
              {streamingContent ? (
                <Streamdown
                  className="text-slate-100 whitespace-pre-wrap prose prose-invert prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-base prose-p:leading-relaxed"
                  plugins={{ code: code }}
                >
                  {streamingContent}
                </Streamdown>
              ) : (
                <div className="flex gap-2 py-12">
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-200 transition-colors hover:cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-semibold text-white">Write Article</h2>
            <p className="text-sm text-slate-400">Transform your interview into a polished article</p>
          </div>
        </div>
        <ModelSelector
          value={selectedModelId}
          onChange={setSelectedModelId}
          showLabel={true}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Transcript Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Interview Transcript</h3>

            {transcripts.length > 0 ? (
              <div className="space-y-3 mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  From Workspace (.ghostwriter folder)
                </label>
                <select
                  value={selectedTranscript}
                  onChange={(e) => {
                    setSelectedTranscript(e.target.value);
                    setCustomTranscript('');
                  }}
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
              <p className="text-sm text-slate-400 mb-4">
                No transcripts found in .ghostwriter folder
              </p>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Or select custom file</label>
              {customTranscript && (
                <p className="text-sm text-slate-400">Selected: {customTranscript}</p>
              )}
              <button
                onClick={selectCustomTranscript}
                className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
              >
                Browse for Transcript...
              </button>
            </div>
          </div>

          {/* Voice File Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Voice File (Optional)</h3>

            {voiceFiles.length > 0 ? (
              <div className="space-y-3 mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {voiceFiles.length === 1 ? 'Default Voice (.ghostwriter folder)' : 'Select Voice'}
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => {
                    setSelectedVoice(e.target.value);
                    setCustomVoice('');
                  }}
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
              <p className="text-sm text-slate-400 mb-4">
                No voice files found in .ghostwriter folder
              </p>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Or select custom file</label>
              {customVoice && (
                <p className="text-sm text-slate-400">Selected: {customVoice}</p>
              )}
              <button
                onClick={selectCustomVoice}
                className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
              >
                Browse for Voice File...
              </button>
            </div>
          </div>

          {/* Writing Options */}
          <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Writing Options</h3>

            {(selectedVoice || customVoice) && (
              <div className="mb-4 p-2 bg-blue-500/10 border-l-2 border-blue-500/50 rounded">
                <p className="text-base text-blue-300/90">
                  Voice file selected. Writing style and additional options are disabled to maintain consistency with the chosen voice.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Writing Style</label>
                <select
                  value={writingStyle}
                  onChange={(e) => setWritingStyle(e.target.value as any)}
                  disabled={!!(selectedVoice || customVoice)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="conversational">Conversational</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={includeHeadings}
                  onChange={(e) => setIncludeHeadings(e.target.checked)}
                  disabled={!!(selectedVoice || customVoice)}
                  className="w-4 h-4 bg-slate-700 border border-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className={(selectedVoice || customVoice) ? 'opacity-50' : ''}>Include Headings</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={includeSEO}
                  onChange={(e) => setIncludeSEO(e.target.checked)}
                  disabled={!!(selectedVoice || customVoice)}
                  className="w-4 h-4 bg-slate-700 border border-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className={(selectedVoice || customVoice) ? 'opacity-50' : ''}>Optimize for SEO</span>
              </label>
            </div>

            {/* Keyword Optimization */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Keyword Optimization
                <span className="text-slate-500 font-normal ml-1">(Optional)</span>
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Enter keywords separated by commas (e.g., AI, machine learning, automation)"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              <p className="mt-2 text-xs text-slate-500">
                {keywords.trim() ? `Keywords: ${keywords.split(',').map(k => k.trim()).filter(k => k).join(', ')}` : 'Add target keywords to optimize article for search engines'}
              </p>
            </div>

            {/* Frontmatter Template */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-300">
                  Frontmatter Template
                  <span className="text-slate-500 font-normal ml-1">(Optional)</span>
                </label>
                {frontmatter && (
                  <button
                    onClick={clearFrontmatter}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {!showFrontmatterEditor ? (
                <div className="space-y-2">
                  {frontmatter ? (
                    <>
                      <div className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg">
                        <pre className="text-xs text-slate-300 overflow-x-auto max-h-24 overflow-y-auto whitespace-pre-wrap">
                          {frontmatter}
                        </pre>
                      </div>
                      <button
                        onClick={() => setShowFrontmatterEditor(true)}
                        className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 text-sm transition-colors"
                      >
                        Edit Frontmatter
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowFrontmatterEditor(true)}
                      className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 text-sm transition-colors"
                    >
                      Add Frontmatter Template
                    </button>
                  )}
                  <p className="text-xs text-slate-500">
                    Define YAML frontmatter to include in all generated articles
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={frontmatter}
                    onChange={(e) => setFrontmatter(e.target.value)}
                    placeholder="---&#10;title: &quot;&quot;&#10;date: &quot;&quot;&#10;tags: []&#10;---"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono text-sm"
                    rows={10}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveFrontmatter}
                      className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Save Template
                    </button>
                    <button
                      onClick={() => setShowFrontmatterEditor(false)}
                      className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Start Writing Button */}
          <button
            onClick={startWriting}
            disabled={!selectedTranscript && !customTranscript}
            className="w-full px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all hover:cursor-pointer"
          >
            Start Writing
          </button>
        </div>
      </div>
    </div>
  );
}
