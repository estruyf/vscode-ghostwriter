import * as vscode from "vscode";
import { LanguageModelChatMessage } from "vscode";
import { FileService } from "./FileService";
import { CopilotService } from "./CopilotService";
import { GhostwriterViewProvider } from "../providers/GhostwriterViewProvider";
import { PROMPTS } from "../constants";

export interface InterviewMessage {
  role: "user" | "assistant";
  content: string;
}

export interface InterviewSession {
  id: string;
  messages: InterviewMessage[];
  conversationHistory: LanguageModelChatMessage[];
  createdAt: number;
}

export class InterviewService {
  private static readonly SYSTEM_PROMPT = PROMPTS.INTERVIEWER;

  private static sessions = new Map<string, InterviewSession>();

  /**
   * Start a new interview session
   */
  static async startInterview(): Promise<InterviewSession> {
    try {
      // Create a new session (don't persist yet)
      const sessionId =
        Date.now().toString(36) + Math.random().toString(36).substring(2);
      const session: InterviewSession = {
        id: sessionId,
        messages: [],
        conversationHistory: [],
        createdAt: Date.now(),
      };

      // Store the session
      this.sessions.set(sessionId, session);

      // Initialize conversation with system prompt and request for first question
      const conversationMessages = [
        LanguageModelChatMessage.User(this.SYSTEM_PROMPT),
      ];

      const response =
        await CopilotService.sendChatRequest(conversationMessages);

      if (response) {
        // Store the system prompt and assistant's response in conversation history
        session.conversationHistory.push(
          LanguageModelChatMessage.User(this.SYSTEM_PROMPT),
          LanguageModelChatMessage.Assistant(response),
        );

        // Store only the assistant's response in messages (not the system prompt)
        session.messages.push({
          role: "assistant",
          content: response,
        });

        // Send the message to the webview
        GhostwriterViewProvider.postMessage("interviewMessage", {
          role: "assistant",
          content: response,
        });
      }

      return session;
    } catch (error) {
      console.error("Error starting interview:", error);
      throw error;
    }
  }

  /**
   * Send a message in an interview session
   */
  static async sendMessage(
    sessionId: string,
    message: string,
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

      // Get AI response using the full conversation history
      const response = await CopilotService.sendChatRequest(
        session.conversationHistory,
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
   * @param topic - The interview topic
   * @param isManualStop - True if user manually stopped, false if AI ended naturally
   */
  static async endInterview(
    sessionId: string,
    topic: string,
    isManualStop: boolean = false,
  ): Promise<string> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error("Interview session not found");
      }

      // For natural end, try to extract transcript from the last assistant message
      // (where AI provides complete formatted transcript)
      // For manual stop, always generate transcript from all messages
      let transcript = "";

      if (!isManualStop) {
        // Natural end - extract from last assistant message
        for (let i = session.messages.length - 1; i >= 0; i--) {
          if (session.messages[i].role === "assistant") {
            transcript = session.messages[i].content;
            break;
          }
        }
      }

      // If manual stop or no transcript found, generate it from messages
      if (!transcript || isManualStop) {
        transcript = this.generateTranscript(session);
      }

      // Generate a title for the interview
      const titlePrompt = `Based on this interview transcript about "${topic}", generate a short, concise title (max 5 words) that captures the main topic.\n\n${transcript}`;
      const title = await CopilotService.promptCopilot(titlePrompt);
      const cleanTitle = title
        ? title
            .trim()
            .replace(/^["']|["']$/g, "")
            .replace(/[^a-zA-Z0-9\s-]/g, "")
        : "Interview";

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
   * Generate a markdown transcript from the interview messages
   */
  private static generateTranscript(session: InterviewSession): string {
    let transcript = `# Interview:\n\n`;
    transcript += `Date: ${new Date(session.createdAt).toLocaleDateString()}\n\n`;

    for (const message of session.messages) {
      const roleDisplay = message.role === "user" ? "You" : "Interviewer";
      transcript += `## ${roleDisplay}\n\n${message.content}\n\n`;
    }

    return transcript;
  }
}
