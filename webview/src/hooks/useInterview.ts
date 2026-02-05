import { useState, useEffect, useRef, useCallback } from "react";
import { messageHandler } from "@estruyf/vscode/dist/client";
import { AgentFile, MessageContent, ImageAttachment } from "../types";

interface Message {
  role: "user" | "assistant";
  content: string | MessageContent;
}

interface UseInterviewReturn {
  messages: Message[];
  inputValue: string;
  setInputValue: (value: string) => void;
  isLoading: boolean;
  isSending: boolean;
  agents: AgentFile[];
  selectedAgent: string;
  selectedModelId: string;
  hasUserStarted: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  sendMessage: (e: React.FormEvent, images?: ImageAttachment[]) => void;
  startInterview: (overrides?: {
    agentPath?: string;
    modelId?: string;
  }) => void;
  resumeInterview: (transcriptPath: string) => void;
  resetInterview: () => void;
  handleAgentSelect: (agentPath: string) => void;
  handleModelSelect: (modelId: string) => void;
}

const INTERVIEW_COMPLETION_PHRASES = [
  "interview is now complete",
  "interview is complete",
  "the interview has concluded",
  "we've concluded the interview",
  "interview completed",
];

/**
 * Custom hook for managing interview state and logic
 * Encapsulates all interview-related state management, API calls, and message handling
 */
export function useInterview(): UseInterviewReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [agents, setAgents] = useState<AgentFile[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [hasUserStarted, setHasUserStarted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasStartedRef = useRef(false);

  // Load agents on mount
  useEffect(() => {
    messageHandler
      .request<AgentFile[]>("getInterviewerAgents")
      .then((response) => {
        setAgents(response || []);
      })
      .catch((error) => {
        console.error("Error loading interviewer agents:", error);
        setAgents([]);
      });

    messageHandler
      .request<string>("getSelectedInterviewerAgent")
      .then((response) => {
        if (response) {
          setSelectedAgent(response);
        }
      })
      .catch((error) => {
        console.error("Error loading selected interviewer agent:", error);
      });
  }, []);

  // Handle messages from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === "interviewMessage") {
        const { role, content } = message.payload;
        setMessages((prev) => [...prev, { role, content }]);
        setIsSending(false);
        setIsLoading(false);

        // Auto-detect interview completion
        if (role === "assistant") {
          const lowerContent = content.toLowerCase();
          const isInterviewComplete = INTERVIEW_COMPLETION_PHRASES.some(
            (phrase) => lowerContent.includes(phrase),
          );

          if (isInterviewComplete) {
            setTimeout(() => {
              messageHandler.send("interview:end", { isManualStop: false });
            }, 1500);
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea when ready for input
  useEffect(() => {
    if (!isLoading && !isSending && messages.length > 0) {
      textareaRef.current?.focus();
    }
  }, [isLoading, isSending, messages.length]);

  const startInterview = useCallback(
    (overrides?: { agentPath?: string; modelId?: string }) => {
      const agentPath = overrides?.agentPath ?? selectedAgent;
      const modelId = overrides?.modelId ?? selectedModelId;

      if (!modelId) {
        return;
      }

      setIsLoading(true);
      setIsSending(false);
      setMessages([]);
      setHasUserStarted(false);

      messageHandler.send("interview:start", {
        agentPath: agentPath || undefined,
        modelId: modelId || undefined,
      });

      hasStartedRef.current = true;
    },
    [selectedAgent, selectedModelId],
  );

  const resumeInterview = useCallback(
    (transcriptPath: string) => {
      if (!selectedModelId) {
        return;
      }

      setIsLoading(true);
      setIsSending(false);
      setMessages([]);
      setHasUserStarted(true); // Mark as started since we're resuming

      messageHandler.send("interview:resume", {
        transcriptPath,
        agentPath: selectedAgent || undefined,
        modelId: selectedModelId || undefined,
      });

      hasStartedRef.current = true;
    },
    [selectedAgent, selectedModelId],
  );

  // Start interview once model is selected
  useEffect(() => {
    if (!hasStartedRef.current && selectedModelId) {
      startInterview();
    }
  }, [selectedModelId, startInterview]);

  const sendMessage = useCallback(
    (e: React.FormEvent, images?: ImageAttachment[]) => {
      e.preventDefault();
      if ((!inputValue.trim() && !images?.length) || isSending) return;

      const userMessage = inputValue.trim();

      // Check for end commands
      if (
        userMessage.toLowerCase() === "stop" ||
        userMessage.toLowerCase() === "done"
      ) {
        setIsSending(true);
        messageHandler.send("interview:end", { isManualStop: true });
        return;
      }

      // Create message content
      const messageContent: MessageContent = {
        text: userMessage || undefined,
        images: images && images.length > 0 ? images : undefined,
      };

      // Add user message to chat
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: images && images.length > 0 ? messageContent : userMessage,
        },
      ]);
      setInputValue("");
      setIsSending(true);
      setIsLoading(true);

      // First message is the topic
      if (!hasUserStarted) {
        setHasUserStarted(true);
        // Send topic to create the transcript file
        messageHandler.send("interview:setTopic", {
          topic: userMessage,
          modelId: selectedModelId || undefined,
          images: images,
        });
      } else {
        // Regular interview message
        messageHandler.send("interview:message", {
          message: userMessage,
          modelId: selectedModelId || undefined,
          images: images,
        });
      }
    },
    [inputValue, isSending, selectedModelId, hasUserStarted],
  );

  const handleAgentSelect = useCallback(
    (agentPath: string) => {
      if (hasUserStarted) return;
      setSelectedAgent(agentPath);
      messageHandler.send("setSelectedInterviewerAgent", { agentPath });
      if (hasStartedRef.current) {
        startInterview({
          agentPath,
          modelId: selectedModelId,
        });
      }
    },
    [hasUserStarted, selectedModelId, startInterview],
  );

  const handleModelSelect = useCallback(
    (modelId: string) => {
      if (hasUserStarted) return;
      setSelectedModelId(modelId);
      if (hasStartedRef.current) {
        startInterview({
          agentPath: selectedAgent,
          modelId,
        });
      }
    },
    [hasUserStarted, selectedAgent, startInterview],
  );

  const resetInterview = useCallback(() => {
    setMessages([]);
    setInputValue("");
    setIsLoading(false);
    setIsSending(false);
    setHasUserStarted(false);
    hasStartedRef.current = false;
    messageHandler.send("interview:reset", {});

    // Start a new interview immediately
    startInterview();
  }, [startInterview]);

  return {
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
    startInterview,
    resumeInterview,
    resetInterview,
    handleAgentSelect,
    handleModelSelect,
  };
}
