import { useState, useEffect, useRef, useCallback } from 'react';
import { messageHandler } from '@estruyf/vscode/dist/client';
import { AgentFile } from '../types';
import { Streamdown } from 'streamdown';
import { code } from "@streamdown/code";
import ModelSelector from './ModelSelector';
import { TranscriptSelector } from './TranscriptSelector';
import { VoiceSelector } from './VoiceSelector';
import { WritingOptions } from './WritingOptions';
import AgentDialog from './AgentManager/AgentDialog';
import CreateAgentForm from './AgentManager/CreateAgentForm';
import { useWriterData, useDialog } from '../hooks';

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
  const [language, setLanguage] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

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
    messageHandler.send('saveArticle', { content: streamingContent });
    setIsSaving(false);
  }, [streamingContent]);

  const handleCreateWriterAgent = useCallback(async () => {
    if (!newAgentName.trim()) {
      alert('Please enter an agent name');
      return;
    }

    try {
      await writerHandlers.handleCreateWriterAgent(newAgentName);
      createAgentDialog.close();
      setNewAgentName('');
    } catch (error) {
      console.error('Error creating writer agent:', error);
      alert('Failed to create agent');
    }
  }, [newAgentName, writerHandlers, createAgentDialog]);

  const handleEditWriterAgent = useCallback(async (agent: AgentFile) => {
    try {
      await writerHandlers.handleEditWriterAgent(agent);
    } catch (error) {
      console.error('Error opening agent file:', error);
      alert('Failed to open agent file');
    }
  }, [writerHandlers]);

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
              <h2 className="text-xl font-semibold text-white">
                {streamingContent ? 'Article Generated' : 'Generating Article'}
              </h2>
              <p className="text-base text-slate-400">
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
                  className="text-slate-100 whitespace-pre-wrap prose prose-invert prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-xl prose-p:text-base prose-p:leading-relaxed"
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
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Writer Setup */}
          <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-6 space-y-4">
            <h3 className="text-xl font-semibold text-white">Writer & Model</h3>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-slate-300">Writer:</label>
              <select
                value={writerData.selectedWriterAgent}
                onChange={(e) => writerHandlers.handleWriterAgentSelect(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="">Default Writer</option>
                {writerData.writerAgents.map((agent) => (
                  <option key={agent.path} value={agent.path}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <button
                onClick={agentDialog.open}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-colors"
                title="Manage Writer Agents"
              >
                Manage
              </button>
              <button
                onClick={createAgentDialog.open}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
                title="Create New Writer Agent"
              >
                + New
              </button>
            </div>
            <ModelSelector
              value={selectedModelId}
              onChange={setSelectedModelId}
              showLabel={true}
              className="mt-1"
            />
          </div>

          {/* Transcript Selection */}
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

          {/* Voice File Selection */}
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

          {/* Writing Options */}
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
