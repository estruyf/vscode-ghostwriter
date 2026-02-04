import { useCallback, useState } from 'react';
import { messageHandler } from '@estruyf/vscode/dist/client';
import { useDialog } from '../../hooks/useDialog';
import { useInterview } from '../../hooks/useInterview';
import ModelSelector from '../ModelSelector';
import ChatWindow from '../ChatWindow';
import ChatInput from '../ChatInput';
import { AgentDialog, CreateAgentForm } from '../AgentManager';
import { AgentFile, TranscriptFile } from '../../types';
import { VisitorBadge } from '../VisitorBadge';
import { TranscriptSelector } from '../TranscriptSelector';
import ConfirmDialog from '../ConfirmDialog';

declare const acquireVsCodeApi: () => any;

export default function InterviewView({ onBack }: { onBack: () => void }) {
  // Use custom hooks
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    isSending,
    agents,
    selectedAgent,
    selectedModelId,
    hasUserStarted,
    textareaRef,
    messagesEndRef,
    sendMessage,
    resumeInterview,
    resetInterview,
    handleAgentSelect,
    handleModelSelect,
  } = useInterview();

  // Dialog state
  const agentDialog = useDialog();
  const createAgentDialog = useDialog();
  const resumeDialog = useDialog();
  const resetDialog = useDialog();
  const alertDialog = useDialog();
  const [alertInfo, setAlertInfo] = useState({ title: '', message: '' });

  const [newAgentName, setNewAgentName] = useState('');
  const [transcripts, setTranscripts] = useState<TranscriptFile[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<string>('');
  const [customTranscript, setCustomTranscript] = useState<string>('');

  const showAlert = useCallback((title: string, message: string) => {
    setAlertInfo({ title, message });
    alertDialog.open();
  }, [alertDialog]);

  // Agent management handlers
  const handleCreateAgent = useCallback(async () => {
    if (!newAgentName.trim()) {
      showAlert('Input Required', 'Please enter an agent name');
      return;
    }

    try {
      const agent = await messageHandler.request<AgentFile>('createInterviewerAgent', {
        name: newAgentName,
      });

      createAgentDialog.close();
      setNewAgentName('');
      await messageHandler.send('openAgentFile', { agentPath: agent.path });
    } catch (error) {
      console.error('Error creating interviewer agent:', error);
      showAlert('Error', 'Failed to create agent');
    }
  }, [newAgentName, createAgentDialog, showAlert]);

  const handleEditAgent = useCallback(async (agent: AgentFile) => {
    try {
      await messageHandler.send('openAgentFile', { agentPath: agent.path });
    } catch (error) {
      console.error('Error opening agent file:', error);
      showAlert('Error', 'Failed to open agent file');
    }
  }, [showAlert]);

  const handleResumeClick = useCallback(async () => {
    try {
      const transcriptList = await messageHandler.request<TranscriptFile[]>('getTranscripts');
      setTranscripts(transcriptList || []);
      setSelectedTranscript('');
      setCustomTranscript('');
      resumeDialog.open();
    } catch (error) {
      console.error('Error loading transcripts:', error);
      showAlert('Error', 'Failed to load transcripts');
    }
  }, [resumeDialog, showAlert]);

  const handleCustomTranscriptSelect = useCallback(async () => {
    try {
      const path = await messageHandler.request<string>('selectCustomTranscript');
      if (path) {
        setCustomTranscript(path);
        setSelectedTranscript('');
      }
    } catch (error) {
      console.error('Error selecting custom transcript:', error);
    }
  }, []);

  const handleResumeConfirm = useCallback(() => {
    const transcriptPath = selectedTranscript || customTranscript;
    if (!transcriptPath) {
      showAlert('Selection Required', 'Please select a transcript to resume');
      return;
    }

    resumeInterview(transcriptPath);
    resumeDialog.close();
  }, [selectedTranscript, customTranscript, resumeInterview, resumeDialog, showAlert]);

  const handleResetClick = useCallback(() => {
    resetDialog.open();
  }, [resetDialog]);

  const handleResetConfirm = useCallback(() => {
    resetInterview();
    resetDialog.close();
  }, [resetInterview, resetDialog]);


  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="flex flex-col border-b border-slate-700 bg-slate-900 shadow-md z-10">
        <div className="px-6 py-4 flex items-center justify-between">
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
              <h2 className="text-xl font-bold text-white tracking-tight">Interview Session</h2>
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-400">Answer questions to gather content material</p>
                {hasUserStarted && (
                  <span className="flex h-2 w-2 relative ml-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hasUserStarted && (
              <button
                onClick={handleResumeClick}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-all border border-slate-700 hover:border-slate-600 flex items-center gap-2 shadow-sm hover:cursor-pointer"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Resume
              </button>
            )}

            {hasUserStarted && (
              <button
                onClick={handleResetClick}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 text-sm font-medium rounded-lg transition-all border border-red-500/20 hover:border-red-500/30 flex items-center gap-2 hover:cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="px-6 pb-4 flex flex-wrap items-center justify-end gap-4 border-t border-slate-800/50 pt-3">
          {/* Agent Selection */}
          <div className="flex items-center gap-2 bg-slate-800/50 p-1 pl-3 pr-1 rounded-lg border border-slate-700/50">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Interviewer</span>
            <div className="h-4 w-px bg-slate-700 mx-1"></div>
            <select
              value={selectedAgent}
              onChange={(e) => handleAgentSelect(e.target.value)}
              disabled={hasUserStarted}
              className="bg-transparent text-white text-sm focus:outline-none border-none py-1 pr-2 cursor-pointer hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed max-w-50 truncate"
            >
              <option value="">Default Interviewer</option>
              {agents.map((agent) => (
                <option key={agent.path} value={agent.path}>
                  {agent.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-px ml-1 border-l border-slate-700 pl-1">
              <button
                onClick={agentDialog.open}
                disabled={hasUserStarted}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded transition-colors disabled:opacity-30 shrink-0 hover:cursor-pointer"
                title="Manage Agents"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
              <button
                onClick={createAgentDialog.open}
                disabled={hasUserStarted}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded transition-colors disabled:opacity-30 shrink-0 hover:cursor-pointer"
                title="Create New Agent"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <ModelSelector
            value={selectedModelId}
            onChange={handleModelSelect}
            className={hasUserStarted ? 'opacity-50 pointer-events-none' : ''}
          />
        </div>
      </div>

      {/* Agent Dialogs */}
      <AgentDialog
        isOpen={agentDialog.isOpen}
        agents={agents}
        onClose={agentDialog.close}
        onEdit={handleEditAgent}
        onNew={() => {
          agentDialog.close();
          createAgentDialog.open();
        }}
        title="Manage Interviewer Agents"
        emptyMessage="No interviewer agents yet. Create one to get started."
      />

      <CreateAgentForm
        isOpen={createAgentDialog.isOpen}
        agentName={newAgentName}
        onNameChange={setNewAgentName}
        onSubmit={handleCreateAgent}
        onCancel={() => {
          createAgentDialog.close();
          setNewAgentName('');
        }}
        title="Create Interviewer Agent"
      />

      {/* Resume Interview Dialog */}
      {resumeDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-white mb-4">Resume Interview</h2>
            <TranscriptSelector
              transcripts={transcripts}
              selectedTranscript={selectedTranscript}
              onTranscriptChange={setSelectedTranscript}
              customTranscript={customTranscript}
              onCustomSelect={handleCustomTranscriptSelect}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleResumeConfirm}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
              >
                Resume
              </button>
              <button
                onClick={resumeDialog.close}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <ChatWindow messages={messages} isLoading={isLoading} messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>} />

      {/* Input Area */}
      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSubmit={sendMessage}
        isSending={isSending}
        textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={resetDialog.isOpen}
        title="Reset Interview"
        message="Are you sure you want to reset this interview? This will delete the current transcript and all messages."
        onConfirm={handleResetConfirm}
        onCancel={resetDialog.close}
        showCancel={true}
        confirmText="Reset"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={alertDialog.isOpen}
        title={alertInfo.title}
        message={alertInfo.message}
        onConfirm={alertDialog.close}
        showCancel={false}
        confirmText="OK"
        variant="info"
      />

      <VisitorBadge viewType="interview" />
    </div>
  );
}
