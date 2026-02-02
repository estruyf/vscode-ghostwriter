import { useCallback, useState } from 'react';
import { messageHandler } from '@estruyf/vscode/dist/client';
import { useDialog } from '../../hooks/useDialog';
import { useInterview } from '../../hooks/useInterview';
import ModelSelector from '../ModelSelector';
import ChatWindow from '../ChatWindow';
import ChatInput from '../ChatInput';
import { AgentDialog, CreateAgentForm } from '../AgentManager';
import { AgentFile } from '../../types';
import { VisitorBadge } from '../VisitorBadge';

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
    handleAgentSelect,
    handleModelSelect,
  } = useInterview();

  // Dialog state
  const agentDialog = useDialog();
  const createAgentDialog = useDialog();
  const [newAgentName, setNewAgentName] = useState('');

  // Agent management handlers
  const handleCreateAgent = useCallback(async () => {
    if (!newAgentName.trim()) {
      alert('Please enter an agent name');
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
      alert('Failed to create agent');
    }
  }, [newAgentName, createAgentDialog]);

  const handleEditAgent = useCallback(async (agent: AgentFile) => {
    try {
      await messageHandler.send('openAgentFile', { agentPath: agent.path });
    } catch (error) {
      console.error('Error opening agent file:', error);
      alert('Failed to open agent file');
    }
  }, []);


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
            <h2 className="text-xl font-semibold text-white">Interview Session</h2>
            <p className="text-base text-slate-400">Answer questions to gather content material</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          {/* Agent Selection */}
          <div className="flex gap-2 items-center">
            <label className="text-base text-slate-300">Interviewer:</label>
            <select
              value={selectedAgent}
              onChange={(e) => handleAgentSelect(e.target.value)}
              disabled={hasUserStarted}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
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

      {/* Chat Area */}
      <ChatWindow messages={messages} isLoading={isLoading} messagesEndRef={messagesEndRef} />

      {/* Input Area */}
      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSubmit={sendMessage}
        isSending={isSending}
        textareaRef={textareaRef}
      />
      <VisitorBadge viewType="interview" />
    </div>
  );
}
