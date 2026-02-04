import { useState, useEffect, useRef, useCallback } from 'react';
import { messageHandler } from '@estruyf/vscode/dist/client';
import { AgentFile, Draft } from '../../types';
import { Save } from 'lucide-react';
import ModelSelector from '../ModelSelector';
import AgentSelector from '../AgentSelector';
import { TranscriptSelector } from '../TranscriptSelector';
import { VoiceSelector } from '../VoiceSelector';
import { WritingOptions } from '../WritingOptions';
import AgentDialog from '../AgentManager/AgentDialog';
import CreateAgentForm from '../AgentManager/CreateAgentForm';
import ConfirmDialog from '../ConfirmDialog';
import { useWriterData, useDialog } from '../../hooks';
import DraftIterationView from './DraftIterationView';
import { VisitorBadge } from '../VisitorBadge';
import { parseContent } from '../../utils/markdown';
import { MarkdownRenderer } from '../MarkdownRenderer';

declare const acquireVsCodeApi: () => any;

export default function WriterView({ onBack }: { onBack: () => void }) {
  // Custom hooks
  const [writerData, writerHandlers] = useWriterData();
  const agentDialog = useDialog();
  const createAgentDialog = useDialog();

  // Local state
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
  const [showFrontmatterEditor, setShowFrontmatterEditor] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [activeDraft, setActiveDraft] = useState<Draft | null>(null);
  const [language, setLanguage] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    showCancel: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => { },
    showCancel: false
  });

  const showAlert = useCallback((message: string, title = 'Error') => {
    setAlertDialog({
      isOpen: true,
      title,
      message,
      type: 'info',
      onConfirm: () => setAlertDialog(prev => ({ ...prev, isOpen: false })),
      showCancel: false
    });
  }, []);

  // Scroll to bottom when content updates
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamingContent]);

  // Load saved language preference on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await messageHandler.request<string>('getSelectedLanguage');
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };
    loadLanguage();
  }, []);

  // Handle messages from the extension
  useEffect(() => {
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

  const selectCustomTranscript = useCallback(async () => {
    const response = await messageHandler.request<string>('selectCustomTranscript');
    if (response) {
      setCustomTranscript(response);
      setSelectedTranscript('');
    }
  }, []);

  const selectCustomVoice = useCallback(async () => {
    const response = await messageHandler.request<string>('selectCustomVoice');
    if (response) {
      setCustomVoice(response);
      setSelectedVoice('');
    }
  }, []);

  const startWriting = useCallback(() => {
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
      keywords: keywords.trim() || undefined,
      language: language.trim() || undefined
    };

    messageHandler.send('startWriting', {
      transcript,
      voice,
      options,
      modelId: selectedModelId,
      frontmatter: writerData.frontmatter.trim() || undefined,
      promptConfigId: writerData.selectedPromptConfigId || undefined,
      writerAgentPath: writerData.selectedWriterAgent || undefined,
    });
  }, [customTranscript, selectedTranscript, customVoice, selectedVoice, writingStyle, includeHeadings, includeSEO, keywords, language, selectedModelId, writerData]);

  const saveFrontmatter = useCallback(() => {
    writerHandlers.saveFrontmatter(writerData.frontmatter);
    setShowFrontmatterEditor(false);
  }, [writerData.frontmatter, writerHandlers]);

  const clearFrontmatter = useCallback(() => {
    writerHandlers.clearFrontmatter();
  }, [writerHandlers]);

  const handleLanguageChange = useCallback((newLanguage: string) => {
    setLanguage(newLanguage);
    messageHandler.send('setSelectedLanguage', { language: newLanguage });
  }, []);

  const saveArticle = useCallback(() => {
    if (!streamingContent) return;

    setIsSaving(true);

    const { frontmatter, markdown } = parseContent(streamingContent);
    const contentToSave = frontmatter
      ? `---\n${frontmatter}\n---\n\n${markdown}`
      : markdown;

    messageHandler.send('saveArticle', { content: contentToSave });
    setIsSaving(false);
  }, [streamingContent]);

  const handleCreateWriterAgent = useCallback(async () => {
    if (!newAgentName.trim()) {
      showAlert('Please enter an agent name', 'Validation Error');
      return;
    }

    try {
      await writerHandlers.handleCreateWriterAgent(newAgentName);
      createAgentDialog.close();
      setNewAgentName('');
    } catch (error) {
      console.error('Error creating writer agent:', error);
      showAlert('Failed to create agent');
    }
  }, [newAgentName, writerHandlers, createAgentDialog, showAlert]);

  const handleEditWriterAgent = useCallback(async (agent: AgentFile) => {
    try {
      await writerHandlers.handleEditWriterAgent(agent);
    } catch (error) {
      console.error('Error opening agent file:', error);
      showAlert('Failed to open agent file');
    }
  }, [writerHandlers, showAlert]);

  const enterDraftMode = useCallback(async () => {
    if (!streamingContent || !isFinishedWriting) return;

    const transcript = customTranscript || selectedTranscript;
    const voice = customVoice || selectedVoice;

    const title = `Draft ${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}`;

    const { frontmatter, markdown } = parseContent(streamingContent);
    const initialContent = frontmatter
      ? `---\n${frontmatter}\n---\n\n${markdown}`
      : markdown;

    const draft = await messageHandler.request<Draft>('createDraft', {
      title,
      transcript,
      initialContent,
      voice,
      options: {
        style: writingStyle,
        includeHeadings,
        includeSEO,
        keywords: keywords.trim() || undefined
      },
      frontmatter: writerData.frontmatter.trim() || undefined,
      writerAgentPath: writerData.selectedWriterAgent || undefined,
    });

    if (draft) {
      setActiveDraft(draft);
    }
  }, [streamingContent, isFinishedWriting, customTranscript, selectedTranscript, customVoice, selectedVoice, writingStyle, includeHeadings, includeSEO, keywords, writerData]);

  // Show Draft Iteration View if there's an active draft
  if (activeDraft) {
    return (
      <DraftIterationView
        draft={activeDraft}
        onBack={() => setActiveDraft(null)}
        onClose={() => {
          setActiveDraft(null);
          setIsWriting(false);
          setStreamingContent('');
        }}
      />
    );
  }

  if (isWriting) {
    return (
      <div className="flex flex-col h-screen bg-slate-950">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all hover:cursor-pointer"
              title="Back to Configuration"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                {streamingContent ? 'Article Generated' : 'Generating Article'}
                {!isFinishedWriting && streamingContent && (
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                  </span>
                )}
              </h2>
              <p className="text-sm text-slate-400 hidden sm:block">
                {streamingContent ? 'Review and save your generated article' : 'Creating your article from the transcript...'}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-3 w-full sm:w-auto'>
            <button
              onClick={enterDraftMode}
              disabled={!streamingContent || !isFinishedWriting}
              className="flex-1 sm:flex-none px-4 py-2 bg-purple-500/10 border border-purple-500/50 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-purple-200 font-semibold rounded-lg transition-all hover:cursor-pointer whitespace-nowrap"
            >
              Iterate Draft
            </button>
            <button
              onClick={saveArticle}
              disabled={isSaving || !streamingContent || !isFinishedWriting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all hover:cursor-pointer whitespace-nowrap shadow-lg shadow-orange-900/20"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Article'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto" ref={contentRef}>
          <div className="p-6 max-w-4xl mx-auto">
            {streamingContent ? (
              (() => {
                const { frontmatter, markdown } = parseContent(streamingContent);

                return (
                  <>
                    {frontmatter && (
                      <div className="mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Frontmatter</h3>
                        <pre className="text-sm text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap">
                          {frontmatter}
                        </pre>
                      </div>
                    )}

                    <MarkdownRenderer
                      content={markdown}
                    />
                  </>
                );
              })()
            ) : (
              <div className="prose prose-invert max-w-none">
                <div className="flex gap-2 py-12">
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}
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
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">Write Article</h2>
            <p className="text-base text-slate-400">Transform your interview into a polished article</p>
          </div>
        </div>
      </div>

      {/* Agent Dialog */}
      <AgentDialog
        isOpen={agentDialog.isOpen}
        agents={writerData.writerAgents}
        onClose={agentDialog.close}
        onEdit={handleEditWriterAgent}
        onNew={createAgentDialog.open}
        title="Manage Writer Agents"
        emptyMessage="No writer agents yet. Create one to get started."
      />

      <ConfirmDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        onConfirm={alertDialog.onConfirm}
        onCancel={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
        variant={alertDialog.type}
        showCancel={alertDialog.showCancel}
        confirmText="OK"
      />

      {/* Create Agent Form */}
      <CreateAgentForm
        isOpen={createAgentDialog.isOpen}
        agentName={newAgentName}
        onNameChange={setNewAgentName}
        onSubmit={handleCreateWriterAgent}
        onCancel={createAgentDialog.close}
        title="Create Writer Agent"
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column: Input Sources */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">1</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Input Source</h3>
              </div>

              {/* Writer Setup */}
              <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl space-y-5 hover:border-purple-500/30 transition-colors">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    Writer Configuration
                  </h3>
                </div>

                <div className="space-y-4">
                  <AgentSelector
                    value={writerData.selectedWriterAgent}
                    onChange={writerHandlers.handleWriterAgentSelect}
                    agents={writerData.writerAgents}
                    onManage={agentDialog.open}
                    onCreateNew={createAgentDialog.open}
                  />

                  <ModelSelector
                    value={selectedModelId}
                    onChange={setSelectedModelId}
                  />
                </div>
              </div>

              {/* Transcript Selection */}
              <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-purple-500/30 transition-colors">
                <TranscriptSelector
                  transcripts={writerData.transcripts}
                  selectedTranscript={selectedTranscript}
                  onTranscriptChange={(path) => {
                    setSelectedTranscript(path);
                    setCustomTranscript('');
                  }}
                  customTranscript={customTranscript}
                  onCustomSelect={selectCustomTranscript}
                />
              </div>

              {/* Voice File Selection */}
              <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-purple-500/30 transition-colors">
                <VoiceSelector
                  voiceFiles={writerData.voiceFiles}
                  selectedVoice={selectedVoice}
                  onVoiceChange={(path) => {
                    setSelectedVoice(path);
                    setCustomVoice('');
                  }}
                  customVoice={customVoice}
                  onCustomSelect={selectCustomVoice}
                />
              </div>
            </div>

            {/* Right Column: Configuration & Actions */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">2</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Generation Settings</h3>
              </div>

              {/* Writing Options */}
              <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-purple-500/30 transition-colors">
                <WritingOptions
                  writingStyle={writingStyle}
                  onStyleChange={setWritingStyle}
                  includeHeadings={includeHeadings}
                  onHeadingsChange={setIncludeHeadings}
                  includeSEO={includeSEO}
                  onSEOChange={setIncludeSEO}
                  keywords={keywords}
                  onKeywordsChange={setKeywords}
                  frontmatter={writerData.frontmatter}
                  onFrontmatterChange={writerHandlers.setFrontmatter}
                  onFrontmatterClear={clearFrontmatter}
                  hasVoiceFile={!!(selectedVoice || customVoice)}
                  showFrontmatterEditor={showFrontmatterEditor}
                  setShowFrontmatterEditor={setShowFrontmatterEditor}
                  language={language}
                  onLanguageChange={handleLanguageChange}
                />
              </div>

              {/* Start Writing Button - Sticky on mobile, inline on desktop */}
              <div className="sticky bottom-0 z-10 pt-4 pb-2 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent lg:static lg:bg-none lg:p-0">
                <button
                  onClick={startWriting}
                  disabled={!selectedTranscript && !customTranscript}
                  className="w-full group relative flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-lg shadow-purple-900/20 transition-all hover:shadow-purple-900/40 hover:-translate-y-0.5 hover:cursor-pointer"
                >
                  <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Generate Article
                </button>
                <p className="mt-3 text-center text-xs text-slate-500">
                  Select input sources and configure settings to start generation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <VisitorBadge viewType="writer" />
    </div>
  );
}
