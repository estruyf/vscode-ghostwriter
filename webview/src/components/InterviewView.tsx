import { useState, useEffect, useRef } from 'react';
import { messageHandler } from '@estruyf/vscode/dist/client';
import ModelSelector from './ModelSelector';
import { AgentFile } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const INTERVIEW_COMPLETION_PHRASES = [
  'interview is now complete',
  'interview is complete',
  'the interview has concluded',
  'we\'ve concluded the interview',
  'interview completed',
];

declare const acquireVsCodeApi: () => any;

export default function InterviewView({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [agents, setAgents] = useState<AgentFile[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [hasUserStarted, setHasUserStarted] = useState(false);
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [showCreateAgentForm, setShowCreateAgentForm] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasStartedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus textarea when AI responds (not loading and not sending)
    if (!isLoading && !isSending && messages.length > 0) {
      textareaRef.current?.focus();
    }
  }, [isLoading, isSending, messages.length]);

  useEffect(() => {
    // Handle messages from the extension
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === 'interviewMessage') {
        const { role, content } = message.payload;
        setMessages((prev) => [...prev, { role, content }]);
        setIsSending(false);
        setIsLoading(false);

        // Auto-detect interview completion
        if (role === 'assistant') {
          const lowerContent = content.toLowerCase();
          const isInterviewComplete = INTERVIEW_COMPLETION_PHRASES.some((phrase) =>
            lowerContent.includes(phrase),
          );

          if (isInterviewComplete) {
            // Wait a moment for the message to be visible, then auto-end
            setTimeout(() => {
              messageHandler.send('interview:end', { isManualStop: false });
            }, 1500);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    // Load interviewer agents
    messageHandler.request<AgentFile[]>('getInterviewerAgents').then((response) => {
      setAgents(response || []);
    }).catch((error) => {
      console.error('Error loading interviewer agents:', error);
      setAgents([]);
    });

    // Load selected agent
    messageHandler.request<string>('getSelectedInterviewerAgent').then((response) => {
      if (response) {
        setSelectedAgent(response);
      }
    }).catch((error) => {
      console.error('Error loading selected interviewer agent:', error);
    });
  }, []);

  const startInterview = (overrides?: { agentPath?: string; modelId?: string }) => {
    const agentPath = overrides?.agentPath ?? selectedAgent;
    const modelId = overrides?.modelId ?? selectedModelId;

    if (!modelId) {
      return;
    }

    setIsLoading(true);
    setIsSending(false);
    setMessages([]);
    setHasUserStarted(false);

    messageHandler.send('interview:start', {
      agentPath: agentPath || undefined,
      modelId: modelId || undefined,
    });

    hasStartedRef.current = true;
  };

  useEffect(() => {
    // Start the interview once a model is selected (only once)
    if (!hasStartedRef.current && selectedModelId) {
      startInterview();
    }
  }, [selectedModelId]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const userMessage = inputValue.trim();

    // Check for end commands
    if (userMessage.toLowerCase() === 'stop' || userMessage.toLowerCase() === 'done') {
      setIsSending(true);
      messageHandler.send('interview:end', { isManualStop: true });
      return;
    }

    // Add user message to the chat
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInputValue('');
    setIsSending(true);

    if (!hasUserStarted) {
      setHasUserStarted(true);
    }

    // Send the message to the extension
    messageHandler.send('interview:message', {
      message: userMessage,
      modelId: selectedModelId || undefined,
    });
  };

  const handleAgentSelect = (agentPath: string) => {
    if (hasUserStarted) return;
    setSelectedAgent(agentPath);
    messageHandler.send('setSelectedInterviewerAgent', { agentPath });
    if (hasStartedRef.current) {
      startInterview({ agentPath, modelId: selectedModelId });
    }
  };

  const handleModelSelect = (modelId: string) => {
    if (hasUserStarted) return;
    setSelectedModelId(modelId);
    if (hasStartedRef.current) {
      startInterview({ agentPath: selectedAgent, modelId });
    }
  };

  const openCreateAgentForm = () => {
    setNewAgentName('');
    setShowCreateAgentForm(true);
  };

  const handleCreateAgent = async () => {
    if (!newAgentName.trim()) {
      alert('Please enter an agent name');
      return;
    }

    try {
      const agent = await messageHandler.request<AgentFile>('createInterviewerAgent', {
        name: newAgentName,
      });

      setAgents([...agents, agent]);
      setShowCreateAgentForm(false);
      setNewAgentName('');

      await messageHandler.send('openAgentFile', { agentPath: agent.path });
    } catch (error) {
      console.error('Error creating interviewer agent:', error);
      alert('Failed to create agent');
    }
  };

  const handleEditAgent = async (agent: AgentFile) => {
    try {
      await messageHandler.send('openAgentFile', { agentPath: agent.path });
    } catch (error) {
      console.error('Error opening agent file:', error);
      alert('Failed to open agent file');
    }
  };

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
            <label className="text-sm text-slate-300">Interviewer:</label>
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
              onClick={() => setShowAgentDialog(true)}
              disabled={hasUserStarted}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-colors"
              title="Manage Interviewer Agents"
            >
              Manage
            </button>
            <button
              onClick={openCreateAgentForm}
              disabled={hasUserStarted}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
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

      {/* Manage Agents Dialog */}
      {showAgentDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-slate-900 border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <div>
                <h3 className="text-lg font-semibold text-white">Manage Interviewer Agents</h3>
                <p className="text-sm text-slate-400">View and edit your interviewer agents.</p>
              </div>
              <button
                onClick={() => setShowAgentDialog(false)}
                className="text-slate-400 hover:text-slate-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4">
              {agents.length === 0 ? (
                <p className="text-sm text-slate-400">No interviewer agents yet. Create one to get started.</p>
              ) : (
                <div className="space-y-2">
                  {agents.map((agent) => (
                    <div
                      key={agent.path}
                      className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{agent.name}</p>
                        <p className="text-xs text-slate-400 truncate max-w-sm">{agent.path}</p>
                      </div>
                      <button
                        onClick={() => handleEditAgent(agent)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-700 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAgentDialog(false);
                  openCreateAgentForm();
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
              >
                + New
              </button>
              <button
                onClick={() => setShowAgentDialog(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Agent Dialog */}
      {showCreateAgentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-700 shadow-xl">
            <div className="px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Create Interviewer Agent</h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Agent Name</label>
                <input
                  type="text"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateAgent()}
                  placeholder="e.g., Technical Interviewer"
                  autoFocus
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <p className="text-sm text-slate-400">
                A markdown file will be created and opened in your editor for you to write the agent prompt.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCreateAgentForm(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAgent}
                  disabled={!newAgentName.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xl lg:max-w-2xl px-4 py-3 rounded-lg ${msg.role === 'user'
                ? 'bg-purple-600 text-white rounded-br-none'
                : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-lg">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-700 bg-slate-900 px-6 py-4">
        <form onSubmit={sendMessage} className="space-y-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e as any);
              }
            }}
            placeholder="Type your answer (or 'stop' to end)... Shift+Enter for new line"
            disabled={isSending}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50 resize-none"
            rows={3}
          />
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Type "stop" or "done" when you want to end the interview.</p>
            <button
              type="submit"
              disabled={isSending || !inputValue.trim()}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all hover:cursor-pointer"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
