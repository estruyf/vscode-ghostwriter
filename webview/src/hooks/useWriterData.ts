import { useState, useEffect, useCallback } from "react";
import { messageHandler } from "@estruyf/vscode/dist/client";
import { TranscriptFile, VoiceFile, AgentFile } from "../types";

export interface WriterData {
  transcripts: TranscriptFile[];
  voiceFiles: VoiceFile[];
  writerAgents: AgentFile[];
  frontmatter: string;
  selectedPromptConfigId: string;
  selectedWriterAgent: string;
}

export interface WriterDataHandlers {
  selectCustomTranscript: () => Promise<void>;
  selectCustomVoice: () => Promise<void>;
  saveFrontmatter: (template: string) => void;
  clearFrontmatter: () => void;
  handleWriterAgentSelect: (agentPath: string) => Promise<void>;
  handleCreateWriterAgent: (agentName: string) => Promise<AgentFile>;
  handleEditWriterAgent: (agent: AgentFile) => Promise<void>;
  setFrontmatter: (value: string) => void;
  setSelectedPromptConfigId: (value: string) => void;
  setSelectedWriterAgent: (value: string) => void;
  setWriterAgents: (agents: AgentFile[]) => void;
  setTranscripts: (transcripts: TranscriptFile[]) => void;
  setVoiceFiles: (files: VoiceFile[]) => void;
}

export function useWriterData(): [WriterData, WriterDataHandlers] {
  const [transcripts, setTranscripts] = useState<TranscriptFile[]>([]);
  const [voiceFiles, setVoiceFiles] = useState<VoiceFile[]>([]);
  const [writerAgents, setWriterAgents] = useState<AgentFile[]>([]);
  const [frontmatter, setFrontmatter] = useState<string>("");
  const [selectedPromptConfigId, setSelectedPromptConfigId] =
    useState<string>("");
  const [selectedWriterAgent, setSelectedWriterAgent] = useState<string>("");

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          transcriptsData,
          voiceFilesData,
          frontmatterData,
          promptConfigData,
          agentsData,
          selectedAgentData,
        ] = await Promise.all([
          messageHandler
            .request<TranscriptFile[]>("getTranscripts")
            .catch(() => []),
          messageHandler.request<VoiceFile[]>("getVoiceFiles").catch(() => []),
          messageHandler
            .request<string>("getFrontmatterTemplate")
            .catch(() => ""),
          messageHandler
            .request<string>("getSelectedPromptConfigId")
            .catch(() => ""),
          messageHandler
            .request<AgentFile[]>("getWriterAgents")
            .catch(() => []),
          messageHandler
            .request<string>("getSelectedWriterAgent")
            .catch(() => ""),
        ]);

        setTranscripts(transcriptsData || []);
        setVoiceFiles(voiceFilesData || []);
        setFrontmatter(frontmatterData || "");
        setSelectedPromptConfigId(promptConfigData || "");
        setWriterAgents(agentsData || []);
        setSelectedWriterAgent(selectedAgentData || "");
      } catch (error) {
        console.error("Error loading writer data:", error);
      }
    };

    loadData();
  }, []);

  const selectCustomTranscript = useCallback(async () => {
    try {
      const response = await messageHandler.request<string>(
        "selectCustomTranscript",
      );
      return response ? Promise.resolve() : Promise.resolve();
    } catch (error) {
      console.error("Error selecting custom transcript:", error);
    }
  }, []);

  const selectCustomVoice = useCallback(async () => {
    try {
      const response =
        await messageHandler.request<string>("selectCustomVoice");
      return response ? Promise.resolve() : Promise.resolve();
    } catch (error) {
      console.error("Error selecting custom voice:", error);
    }
  }, []);

  const saveFrontmatter = useCallback((template: string) => {
    messageHandler.send("setFrontmatterTemplate", {
      template: template.trim() || undefined,
    });
  }, []);

  const clearFrontmatter = useCallback(() => {
    setFrontmatter("");
    messageHandler.send("setFrontmatterTemplate", { template: undefined });
  }, []);

  const handleWriterAgentSelect = useCallback(async (agentPath: string) => {
    setSelectedWriterAgent(agentPath);
    messageHandler.send("setSelectedWriterAgent", { agentPath });
  }, []);

  const handleCreateWriterAgent = useCallback(
    async (agentName: string): Promise<AgentFile> => {
      if (!agentName.trim()) {
        throw new Error("Agent name is required");
      }

      const agent = await messageHandler.request<AgentFile>(
        "createWriterAgent",
        { name: agentName },
      );
      setWriterAgents([...writerAgents, agent]);
      await messageHandler.send("openAgentFile", { agentPath: agent.path });
      return agent;
    },
    [writerAgents],
  );

  const handleEditWriterAgent = useCallback(async (agent: AgentFile) => {
    await messageHandler.send("openAgentFile", { agentPath: agent.path });
  }, []);

  return [
    {
      transcripts,
      voiceFiles,
      writerAgents,
      frontmatter,
      selectedPromptConfigId,
      selectedWriterAgent,
    },
    {
      selectCustomTranscript,
      selectCustomVoice,
      saveFrontmatter,
      clearFrontmatter,
      handleWriterAgentSelect,
      handleCreateWriterAgent,
      handleEditWriterAgent,
      setFrontmatter,
      setSelectedPromptConfigId,
      setSelectedWriterAgent,
      setWriterAgents,
      setTranscripts,
      setVoiceFiles,
    },
  ];
}
