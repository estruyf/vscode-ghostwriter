import * as vscode from "vscode";
import { LanguageModelChatMessage } from "vscode";
import * as fs from "fs";
import { CopilotService } from "./CopilotService";
import { GhostwriterViewProvider } from "../providers/GhostwriterViewProvider";
import { PROMPTS } from "../constants";
import { AgentService } from "./AgentService";

export interface WritingOptions {
  style?: "formal" | "casual" | "conversational";
  length?: "short" | "medium" | "long";
  includeHeadings?: boolean;
  includeSEO?: boolean;
  keywords?: string;
  language?: string;
}

export class WriterService {
  private static readonly SYSTEM_PROMPT = PROMPTS.WRITER;

  /**
   * Start the writing workflow with selected transcript and voice file
   */
  static async startWriting(
    transcriptPath: string,
    voicePath?: string,
    options?: WritingOptions,
    modelId?: string,
    frontmatter?: string,
    customSystemPrompt?: string,
    writerAgentPath?: string,
  ): Promise<void> {
    try {
      // Verify transcript file exists
      if (!fs.existsSync(transcriptPath)) {
        vscode.window.showErrorMessage("Transcript file not found");
        return;
      }

      // Read transcript content
      const transcriptContent = fs.readFileSync(transcriptPath, "utf-8");

      // Read voice file if provided
      let voiceContent: string | undefined;
      if (voicePath && fs.existsSync(voicePath)) {
        voiceContent = fs.readFileSync(voicePath, "utf-8");
      }

      vscode.window.showInformationMessage(
        "Generating content from transcript...",
      );

      // Generate content using Copilot
      const generatedContent = await this.generateContent(
        transcriptContent,
        voiceContent,
        options,
        modelId,
        frontmatter,
        (chunk: string) => {
          // Optionally handle streaming chunks here
        },
        customSystemPrompt,
        writerAgentPath,
      );

      if (!generatedContent) {
        vscode.window.showErrorMessage("Failed to generate content");
        GhostwriterViewProvider.postMessage("failedWriting", {});
        return;
      }

      // Send completion message to webview
      GhostwriterViewProvider.postMessage("writingComplete", generatedContent);
    } catch (error) {
      console.error("Error starting writing workflow:", error);
      vscode.window.showErrorMessage("Failed to start writing workflow");
    }
  }

  /**
   * Generate content based on transcript
   */
  private static async generateContent(
    transcriptContent: string,
    voiceContent?: string,
    options?: WritingOptions,
    modelId?: string,
    frontmatter?: string,
    onChunk?: (chunk: string) => void,
    customSystemPrompt?: string,
    writerAgentPath?: string,
  ): Promise<string> {
    try {
      const styleGuide = this.getStyleGuide(options);

      // Build keyword optimization instructions
      let keywordInstructions = "";
      if (options?.keywords) {
        const keywordList = options.keywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k.length > 0);

        if (keywordList.length > 0) {
          keywordInstructions = `## SEO Instructions
- Target Keywords: Naturally incorporate these keywords throughout the article for SEO optimization: ${keywordList.join(", ")}.
- Use these keywords in headings, subheadings, and body text where contextually appropriate.
- Maintain natural readability while optimizing for these search terms.
          `;
        }
      }

      const voiceBaseOnWritingOptions = `
- Writing style should be: ${styleGuide}.
${options?.includeHeadings ? "- Structure the article with clear headings and subheadings." : ""}
${options?.includeSEO ? "- Optimize the content for SEO by including relevant keywords naturally throughout the text." : ""}
      `;

      // Create message array with system prompt and user request
      let systemPrompt = customSystemPrompt || this.SYSTEM_PROMPT;

      // Use custom writer agent if provided
      if (writerAgentPath && !customSystemPrompt) {
        const agent = await AgentService.getWriterAgentByPath(writerAgentPath);
        if (agent) {
          const customPrompt = AgentService.extractAgentPrompt(agent.content);
          systemPrompt = AgentService.buildWriterPrompt(customPrompt);
        }
      }

      // Apply customizations
      systemPrompt = systemPrompt
        .replace("{{voiceGuide}}", voiceContent || voiceBaseOnWritingOptions)
        .replace(
          "{{seoInstructions}}",
          options?.includeSEO ? keywordInstructions : "",
        );

      if (frontmatter) {
        const frontmatterSection = `## Frontmatter Instructions
- Include the following frontmatter at the beginning of the article:

${frontmatter}

        `;
        systemPrompt = systemPrompt.replace(
          "{{frontmatterSection}}",
          frontmatterSection,
        );
      } else {
        systemPrompt = systemPrompt.replace("{{frontmatterSection}}", "");
      }

      if (options?.language) {
        systemPrompt += `
## Language Instructions

- Write the article in ${options.language}.
        `;
      }

      const messages = [
        LanguageModelChatMessage.Assistant(systemPrompt),
        LanguageModelChatMessage.User(transcriptContent),
      ];

      if (onChunk) {
        let fullContent = "";
        const onChunkHandler = (chunk: string) => {
          fullContent += chunk;
          onChunk(chunk);
          // Send streaming updates to the webview
          GhostwriterViewProvider.postMessage("writingStream", { chunk });
        };

        await CopilotService.sendChatRequestStream(
          messages,
          onChunkHandler,
          modelId,
        );

        return fullContent;
      } else {
        const content = await CopilotService.sendChatRequest(messages, modelId);

        return content || "";
      }
    } catch (error) {
      console.error("Error generating content:", error);
      return "";
    }
  }

  /**
   * Get style guide based on options
   */
  private static getStyleGuide(options?: WritingOptions): string {
    if (!options?.style) {
      return "";
    }

    const styleGuides: Record<string, string> = {
      formal:
        "Use formal, professional language appropriate for academic or business contexts.",
      casual:
        "Use casual, friendly language that feels approachable and easy to read.",
      conversational:
        "Write in a conversational tone as if speaking directly to the reader.",
    };

    return ` ${styleGuides[options.style]}`;
  }

  /**
   * Save the generated article to a file
   */
  static async saveArticle(content: string): Promise<void> {
    try {
      // Get the current workspace folder
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const workspaceFolder = workspaceFolders?.[0];

      if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder is open");
        return;
      }

      // Create default URI in the workspace folder
      const defaultUri = vscode.Uri.joinPath(
        workspaceFolder.uri,
        `${new Date().getTime()}_article.md`,
      );

      // Show save dialog to let user choose where to save
      const fileUri = await vscode.window.showSaveDialog({
        defaultUri,
        filters: {
          "Markdown files": ["md"],
          "All files": ["*"],
        },
      });

      if (!fileUri) {
        return; // User cancelled
      }

      // Write the file
      fs.writeFileSync(fileUri.fsPath, content, "utf-8");

      // Open the file in the editor
      const document = await vscode.workspace.openTextDocument(fileUri);
      await vscode.window.showTextDocument(document);

      vscode.window.showInformationMessage("Article saved successfully!");
    } catch (error) {
      console.error("Error saving article:", error);
      vscode.window.showErrorMessage("Failed to save article");
    }
  }
}
