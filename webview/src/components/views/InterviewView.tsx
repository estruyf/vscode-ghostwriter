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
      <div className="px-6 py-4 border-b border-slate-700 bg-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-slate-400 hover:text-slate-200 transition-colors hover:cursor-pointer flex-shrink-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-semibold text-white">Interview Session</h2>
              <p className="text-base text-slate-400">Answer questions to gather content material</p>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
            {/* Agent Selection */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <label className="text-base text-slate-300 whitespace-nowrap">Interviewer:</label>
              <div className="flex gap-2 items-center flex-wrap">
                <select
                  value={selectedAgent}
                  onChange={(e) => handleAgentSelect(e.target.value)}
                  disabled={hasUserStarted}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50 flex-1 sm:flex-initial min-w-[160px]"
                >
                  <option value="">Default Interviewer</option>
                  {agents.map((agent) => (
                    <option key={agent.path} value={agent.path}>
                      {agent.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={agentDialog.open}
                  disabled={hasUserStarted}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                  title="Manage Interviewer Agents"
                >
                  Manage
                </button>
                <button
                  onClick={createAgentDialog.open}
                  disabled={hasUserStarted}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                  title="Create New Interviewer Agent"
                >
                  + New
                </button>
              </div>
            </div>

            {/* Resume and Model Selection */}
            <div className="flex gap-3 items-center flex-wrap">
              <button
                onClick={handleResumeClick}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                title="Resume an Existing Interview"
                aria-label={hasUserStarted ? "Resume Interview (disabled during active interview)" : "Resume an Existing Interview"}
              >
                Resume Interview
              </button>
              <ModelSelector
                value={selectedModelId}
                onChange={handleModelSelect}
                className={hasUserStarted ? 'opacity-50 pointer-events-none' : ''}
              />
            </div>
          </div>
          <button
            onClick={handleResumeClick}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            title="Resume an Existing Interview"
            aria-label={hasUserStarted ? "Resume Interview (disabled during active interview)" : "Resume an Existing Interview"}
          >
            Resume Interview
          </button>
          <button
            onClick={handleResetClick}
            disabled={!hasUserStarted}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            title="Reset the current interview and delete the transcript"
          >
            Reset
          </button>
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
