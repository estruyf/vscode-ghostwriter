import * as vscode from "vscode";
import { LanguageModelChatMessage } from "vscode";
import { FileService } from "./FileService";
import { CopilotService } from "./CopilotService";
import { GhostwriterViewProvider } from "../providers/GhostwriterViewProvider";
import { PROMPTS } from "../constants";
import { AgentService } from "./AgentService";
import { ImageService } from "./ImageService";

export interface InterviewMessage {
  role: "user" | "assistant";
  content:
    | string
    | {
        text?: string;
        images?: Array<{
          data: string;
          mimeType: string;
          name?: string;
          width?: number;
          height?: number;
        }>;
      };
}

export interface InterviewSession {
  id: string;
  messages: InterviewMessage[];
  conversationHistory: LanguageModelChatMessage[];
  createdAt: number;
  modelId?: string;
  topic?: string;
  transcriptPath?: string;
  isNewSession?: boolean; // Track if this is a new session (should delete transcript on discard) or loaded from existing file
}

export class InterviewService {
  private static readonly SYSTEM_PROMPT = PROMPTS.INTERVIEWER;
  private static readonly RESUME_SEPARATOR = "---";
  private static readonly RESUME_NOTICE_PREFIX = "*Interview resumed on ";
  private static readonly RESUME_NOTICE_SUFFIX = "*";

  private static sessions = new Map<string, InterviewSession>();

  /**
   * Start a new interview session
   */
  static async startInterview(
    agentPath?: string,
    modelId?: string,
  ): Promise<InterviewSession> {
    try {
      // Get system prompt
      let systemPrompt = this.SYSTEM_PROMPT;

      if (agentPath) {
        const agent = await AgentService.getInterviewerAgentByPath(agentPath);
        if (agent) {
          const customPrompt = AgentService.extractAgentPrompt(agent.content);
          systemPrompt = AgentService.buildInterviewerPrompt(customPrompt);
        }
      }

      // Create a new session (don't persist yet)
      const sessionId =
        Date.now().toString(36) + Math.random().toString(36).substring(2);
      const session: InterviewSession = {
        id: sessionId,
        messages: [],
        conversationHistory: [],
        createdAt: Date.now(),
        modelId,
        isNewSession: true, // Mark as new so transcript will be deleted on discard if needed
      };

      // Store the session
      this.sessions.set(sessionId, session);

      // Ask for the topic first
      const topicQuestion =
        "Welcome! Before we begin the interview, what topic would you like to discuss today?";

      // Send the topic question to the webview
      GhostwriterViewProvider.postMessage("interviewMessage", {
        role: "assistant",
        content: topicQuestion,
      });

      // Store the topic question in messages
      session.messages.push({
        role: "assistant",
        content: topicQuestion,
      });

      return session;
    } catch (error) {
      console.error("Error starting interview:", error);
      throw error;
    }
  }

  /**
   * Set the topic for the interview and create the transcript file
   */
  static async setInterviewTopic(
    sessionId: string,
    topic: string,
    images?: Array<{ data: string; mimeType: string; name?: string }>,
  ): Promise<string | undefined> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error("Interview session not found");
      }

      session.topic = topic;

      // Create the transcript file immediately
      const transcriptPath = await FileService.createTranscript(
        topic,
        "",
        session.modelId,
      );
      if (!transcriptPath) {
        throw new Error("Failed to create transcript file");
      }

      session.transcriptPath = transcriptPath;

      // Write the topic question and answer to the file
      await FileService.appendToTranscript(
        transcriptPath,
        `### Interviewer\n\n${session.messages[0].content}\n\n`,
      );

      // Save images if provided and add references to transcript
      let topicContent = topic;
      if (images && images.length > 0) {
        const savedImagePaths = await ImageService.saveImageAttachments(images);
        if (savedImagePaths.length > 0) {
          topicContent += "\n\n";
          for (const imagePath of savedImagePaths) {
            const relativePath =
              await FileService.getRelativeImagePath(imagePath);
            if (relativePath) {
              topicContent += `![Image](${relativePath})\n`;
            }
          }
        }
      }

      await FileService.appendToTranscript(
        transcriptPath,
        `### You\n\n${topicContent}\n\n`,
      );

      return transcriptPath;
    } catch (error) {
      console.error("Error setting interview topic:", error);
      throw error;
    }
  }

  /**
   * Start the actual interview after topic is set
   */
  static async startInterviewQuestions(
    sessionId: string,
    modelId?: string,
  ): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error("Interview session not found");
      }

      if (!session.topic) {
        throw new Error("Interview topic not set");
      }

      // Get system prompt
      let systemPrompt = this.SYSTEM_PROMPT;

      // Initialize conversation with system prompt and request for first question
      let finalSystemPrompt = systemPrompt.replace(
        "{{date}}",
        new Date().toLocaleDateString(),
      );

      const conversationMessages = [
        LanguageModelChatMessage.User(
          finalSystemPrompt +
            `\n\nThe interview topic is: "${session.topic}". Please start the interview with your first question.`,
        ),
      ];

      const response = await CopilotService.sendChatRequest(
        conversationMessages,
        modelId ?? session.modelId,
      );

      if (response) {
        // Store the system prompt and assistant's response in conversation history
        session.conversationHistory.push(
          LanguageModelChatMessage.User(finalSystemPrompt),
          LanguageModelChatMessage.User(`Interview topic: ${session.topic}`),
          LanguageModelChatMessage.Assistant(response),
        );

        // Store the assistant's response in messages
        session.messages.push({
          role: "assistant",
          content: response,
        });

        // Write the first question to the transcript file
        if (session.transcriptPath) {
          await FileService.appendToTranscript(
            session.transcriptPath,
            `### Interviewer\n\n${response}\n\n`,
          );
        }

        // Send the message to the webview
        GhostwriterViewProvider.postMessage("interviewMessage", {
          role: "assistant",
          content: response,
        });
      }
    } catch (error) {
      console.error("Error starting interview questions:", error);
      throw error;
    }
  }

  /**
   * Send a message in an interview session
   */
  static async sendMessage(
    sessionId: string,
    message: string,
    modelId?: string,
    images?: Array<{ data: string; mimeType: string; name?: string }>,
  ): Promise<string> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error("Interview session not found");
      }

      // Add user message to both histories
      session.messages.push({
        role: "user",
        content: message,
      });

      session.conversationHistory.push(LanguageModelChatMessage.User(message));

      // Save images if provided and add references to transcript
      let messageContent = message;
      if (images && images.length > 0) {
        const savedImagePaths = await ImageService.saveImageAttachments(images);
        if (savedImagePaths.length > 0) {
          messageContent += "\n\n";
          for (const imagePath of savedImagePaths) {
            const relativePath =
              await FileService.getRelativeImagePath(imagePath);
            if (relativePath) {
              messageContent += `![Image](${relativePath})\n`;
            }
          }
        }
      }

      // Write user message to transcript file
      if (session.transcriptPath) {
        await FileService.appendToTranscript(
          session.transcriptPath,
          `### You\n\n${messageContent}\n\n`,
        );
      }

      // Get AI response using the full conversation history
      const effectiveModelId = modelId ?? session.modelId;
      if (modelId && modelId !== session.modelId) {
        session.modelId = modelId;
      }

      const response = await CopilotService.sendChatRequest(
        session.conversationHistory,
        effectiveModelId,
      );

      if (response) {
        // Add assistant response to conversation history
        session.conversationHistory.push(
          LanguageModelChatMessage.Assistant(response),
        );

        session.messages.push({
          role: "assistant",
          content: response,
        });

        // Write assistant response to transcript file
        if (session.transcriptPath) {
          await FileService.appendToTranscript(
            session.transcriptPath,
            `### Interviewer\n\n${response}\n\n`,
          );
        }

        // Send the message to the webview
        GhostwriterViewProvider.postMessage("interviewMessage", {
          role: "assistant",
          content: response,
        });

        return response;
      }

      return "";
    } catch (error) {
      console.error("Error sending interview message:", error);
      throw error;
    }
  }

  /**
   * End the interview and save the transcript
   * @param sessionId - The interview session ID
   * @param topic - The interview topic (optional, as it's now stored in session)
   * @param isManualStop - True if user manually stopped, false if AI ended naturally
   */
  static async endInterview(
    sessionId: string,
    topic?: string,
    isManualStop: boolean = false,
  ): Promise<string> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error("Interview session not found");
      }

      // If transcript file already exists, just open it
      if (session.transcriptPath) {
        const document = await vscode.workspace.openTextDocument(
          session.transcriptPath,
        );
        await vscode.window.showTextDocument(document);

        vscode.window.showInformationMessage(
          `Interview saved: ${session.topic || topic || "Interview"}`,
        );

        // Clean up the session
        this.sessions.delete(sessionId);

        return session.transcriptPath;
      }

      // Fallback: If no transcript path (shouldn't happen with new flow), create it
      // We generate the transcript from the documented messages
      const transcript = this.generateTranscript(session);

      // Generate a title for the interview
      const interviewTopic = session.topic || topic || "Interview";
      const titlePrompt = `Based on this interview transcript about "${interviewTopic}", generate a short, concise title (max 5 words) that captures the main topic.\n\n${transcript}`;
      const title = await CopilotService.promptCopilot(titlePrompt);
      const cleanTitle = title
        ? title
            .trim()
            .replace(/^["']|["']$/g, "")
            .replace(/[^a-zA-Z0-9\s-]/g, "")
        : interviewTopic;

      // Create and save the transcript file
      const transcriptPath = await FileService.createTranscript(
        cleanTitle,
        transcript,
      );

      if (!transcriptPath) {
        throw new Error("Failed to create transcript file");
      }

      // Open the transcript file
      const document = await vscode.workspace.openTextDocument(transcriptPath);
      await vscode.window.showTextDocument(document);

      vscode.window.showInformationMessage(`Interview saved: ${cleanTitle}`);

      // Clean up the session
      this.sessions.delete(sessionId);

      return transcriptPath;
    } catch (error) {
      console.error("Error ending interview:", error);
      throw error;
    }
  }

  /**
   * Resume an interview from an existing transcript file
   */
  static async resumeInterview(
    transcriptPath: string,
    agentPath?: string,
    modelId?: string,
  ): Promise<InterviewSession> {
    try {
      // Read the existing transcript
      const transcriptContent =
        await FileService.readTranscript(transcriptPath);
      if (!transcriptContent) {
        throw new Error("Could not read transcript file");
      }

      // Parse the transcript to extract messages
      const { topic, messages } = await this.parseTranscript(transcriptContent);

      // Create a new session
      const sessionId =
        Date.now().toString(36) + Math.random().toString(36).substring(2);
      const session: InterviewSession = {
        id: sessionId,
        messages: [],
        conversationHistory: [],
        createdAt: Date.now(),
        modelId,
        topic,
        transcriptPath,
        isNewSession: false, // Mark as existing session so transcript won't be deleted on discard
      };

      // Store the session
      this.sessions.set(sessionId, session);

      // Get system prompt
      let systemPrompt = this.SYSTEM_PROMPT;

      if (agentPath) {
        const agent = await AgentService.getInterviewerAgentByPath(agentPath);
        if (agent) {
          const customPrompt = AgentService.extractAgentPrompt(agent.content);
          systemPrompt = AgentService.buildInterviewerPrompt(customPrompt);
        }
      }

      // Build conversation history from parsed messages
      session.conversationHistory.push(
        LanguageModelChatMessage.User(systemPrompt),
        LanguageModelChatMessage.User(`Interview topic: ${topic}`),
      );

      // Add all messages to the session
      for (const message of messages) {
        session.messages.push(message);
        const textContent =
          typeof message.content === "string"
            ? message.content
            : message.content.text || "";

        if (message.role === "user") {
          session.conversationHistory.push(
            LanguageModelChatMessage.User(textContent),
          );
        } else {
          session.conversationHistory.push(
            LanguageModelChatMessage.Assistant(textContent),
          );
        }
      }

      // Send all messages to the webview to display the conversation
      for (const message of messages) {
        GhostwriterViewProvider.postMessage("interviewMessage", {
          role: message.role,
          content: message.content,
        });
      }

      // Ask for the next response
      const continuePrompt =
        "The interview is being resumed. Please continue with your next question.";

      session.conversationHistory.push(
        LanguageModelChatMessage.User(continuePrompt),
      );

      const response = await CopilotService.sendChatRequest(
        session.conversationHistory,
        modelId,
      );

      if (response) {
        session.conversationHistory.push(
          LanguageModelChatMessage.Assistant(response),
        );

        session.messages.push({
          role: "assistant",
          content: response,
        });

        // Write the continuation to the transcript file
        await FileService.appendToTranscript(
          transcriptPath,
          `${this.RESUME_SEPARATOR}\n\n${this.RESUME_NOTICE_PREFIX}${new Date().toLocaleString()}${this.RESUME_NOTICE_SUFFIX}\n\n### Interviewer\n\n${response}\n\n`,
        );

        // Send the message to the webview
        GhostwriterViewProvider.postMessage("interviewMessage", {
          role: "assistant",
          content: response,
        });
      }

      return session;
    } catch (error) {
      console.error("Error resuming interview:", error);
      throw error;
    }
  }

  /**
   * Parse a transcript file to extract the topic and messages
   */
  private static async parseTranscript(content: string): Promise<{
    topic: string;
    messages: InterviewMessage[];
  }> {
    const messages: InterviewMessage[] = [];
    let topic = "Resumed Interview";

    // Extract topic from the header (e.g., "# Interview Transcript: Topic")
    const topicMatch = content.match(/^#\s*Interview Transcript:\s*(.+)$/m);
    if (topicMatch && topicMatch[1]) {
      topic = topicMatch[1].trim();
    }

    // Split content by ## headers (role markers)
    const sections = content.split(/^### /m).filter((s) => s.trim());

    for (const section of sections) {
      const lines = section.split("\n");
      const roleHeader = lines[0].trim().toLowerCase();

      // Determine the role
      let role: "user" | "assistant" | null = null;
      if (roleHeader === "you") {
        role = "user";
      } else if (roleHeader === "interviewer") {
        role = "assistant";
      }

      if (role) {
        // Get the content (everything after the role header)
        const resumeNoticePattern = new RegExp(
          `${this.RESUME_NOTICE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*?${this.RESUME_NOTICE_SUFFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
          "g",
        );
        let messageContent = lines
          .slice(1)
          .join("\n")
          .trim()
          .replace(new RegExp(`^${this.RESUME_SEPARATOR}.*$`, "gm"), "") // Remove resume markers
          .replace(resumeNoticePattern, "") // Remove resume notices
          .trim();

        if (messageContent) {
          // Check for images
          const images: Array<{
            data: string;
            mimeType: string;
            name?: string;
          }> = [];

          // Regex to find markdown images: ![alt](path)
          const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
          let match;
          const imageReplacements: {
            start: number;
            end: number;
            path: string;
          }[] = [];

          while ((match = imageRegex.exec(messageContent)) !== null) {
            imageReplacements.push({
              start: match.index,
              end: match.index + match[0].length,
              path: match[2],
            });

            // Read the image
            const imagePath = match[2];
            const imageData = await FileService.readImage(imagePath);
            if (imageData) {
              const mimeType = imageData.split(";")[0].split(":")[1];
              images.push({
                data: imageData,
                mimeType,
                name: match[1] || undefined,
              });
            }
          }

          // Remove images from text content (in reverse order to preserve indices)
          for (let i = imageReplacements.length - 1; i >= 0; i--) {
            const replacement = imageReplacements[i];
            messageContent =
              messageContent.substring(0, replacement.start) +
              messageContent.substring(replacement.end);
          }

          messageContent = messageContent.trim();

          if (images.length > 0) {
            messages.push({
              role,
              content: {
                text: messageContent,
                images,
              },
            });
          } else {
            messages.push({
              role,
              content: messageContent,
            });
          }
        }
      }
    }

    return { topic, messages };
  }

  /**
   * Discard an interview session without saving a transcript
   * @param sessionId - The interview session ID
   */
  static async discardInterview(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    try {
      // Only delete transcript file if this is a new session being discarded.
      // Don't delete transcripts from resumed/existing sessions.
      if (session.isNewSession && session.transcriptPath) {
        await FileService.deleteFile(session.transcriptPath);
      }

      this.sessions.delete(sessionId);
    } catch (error) {
      console.error("Error discarding interview:", error);
    }
  }

  /**
   * Generate a markdown transcript from the interview messages
   */
  private static generateTranscript(session: InterviewSession): string {
    let transcript = `# Interview:
    
Date: ${new Date(session.createdAt).toLocaleDateString()}
Topic: ${session.topic || "N/A"}
AI Model: ${session.modelId || "N/A"}

`;

    for (const message of session.messages) {
      const roleDisplay = message.role === "user" ? "You" : "Interviewer";
      const content =
        typeof message.content === "string"
          ? message.content
          : message.content.text || "";
      // Note: Images are currently not re-serialized to the transcript in this method
      // They are presumed to be already in the file or handled elsewhere if this method is used for fresh transcripts
      transcript += `### ${roleDisplay}\n\n${content}\n\n`;
    }

    return transcript;
  }
}
