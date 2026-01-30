import * as vscode from "vscode";
import { LanguageModelChatMessage } from "vscode";
import * as fs from "fs";
import * as path from "path";
import { CopilotService } from "./CopilotService";
import { FileService } from "./FileService";
import { GhostwriterViewProvider } from "../providers/GhostwriterViewProvider";
import { PROMPTS } from "../constants";

export class VoiceService {
  private static readonly SYSTEM_PROMPT = PROMPTS.VOICE_GENERATOR;

  /**
   * Generate a voice profile based on content in a selected location
   */
  static async generateVoice(
    contentLocation?: string,
    modelId?: string,
  ): Promise<void> {
    try {
      // If no content location provided, prompt user to select one
      let folderPath = contentLocation;
      if (!folderPath) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const workspaceFolder = workspaceFolders?.[0];

        if (!workspaceFolder) {
          vscode.window.showErrorMessage("No workspace folder is open");
          return;
        }

        // Show save dialog to let user choose content location
        const selectedFolder = await vscode.window.showOpenDialog({
          defaultUri: workspaceFolder.uri,
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false,
          openLabel: "Select Content Location",
          title: "Select folder containing your writing samples",
        });

        if (!selectedFolder || selectedFolder.length === 0) {
          // User cancelled - notify the webview
          GhostwriterViewProvider.postMessage("voiceGenerationCancelled", {});
          return;
        }

        folderPath = selectedFolder[0].fsPath;
      }

      vscode.window.showInformationMessage("Analyzing your writing style...");

      // Find markdown files in the selected location
      const markdownFiles = await this.findMarkdownFiles(folderPath);

      if (markdownFiles.length === 0) {
        vscode.window.showWarningMessage(
          "No markdown files found in the selected location. Please select a different folder.",
        );
        GhostwriterViewProvider.postMessage("voiceGenerationFailed", {
          error: "No markdown files found",
        });
        return;
      }

      // Read content from markdown files (limit to avoid token overflow)
      const contentSamples = await this.readContentSamples(markdownFiles);

      // Generate voice profile using Copilot
      const voiceProfile = await this.generateVoiceProfile(
        folderPath,
        contentSamples,
        modelId,
      );

      if (!voiceProfile) {
        vscode.window.showErrorMessage("Failed to generate voice profile");
        GhostwriterViewProvider.postMessage("voiceGenerationFailed", {
          error: "Failed to generate voice profile",
        });
        return;
      }

      // Save voice profile to .ghostwriter/voices folder
      const savedPath = await this.saveVoiceProfile(voiceProfile);

      if (savedPath) {
        vscode.window.showInformationMessage(
          `Voice profile generated and saved successfully!`,
        );
        GhostwriterViewProvider.postMessage("voiceGenerationComplete", {
          path: savedPath,
        });
      }
    } catch (error) {
      console.error("Error generating voice profile:", error);
      vscode.window.showErrorMessage("Failed to generate voice profile");
      GhostwriterViewProvider.postMessage("voiceGenerationFailed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Find all markdown files in a directory (recursive)
   */
  private static async findMarkdownFiles(
    dirPath: string,
    maxFiles: number = 10,
  ): Promise<string[]> {
    const markdownFiles: Array<{ path: string; mtime: number }> = [];

    const searchDir = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          // Skip common ignored directories
          if (
            entry.isDirectory() &&
            !entry.name.startsWith(".") &&
            entry.name !== "node_modules" &&
            entry.name !== "dist" &&
            entry.name !== "build"
          ) {
            searchDir(fullPath);
          } else if (entry.isFile() && entry.name.endsWith(".md")) {
            try {
              const stats = fs.statSync(fullPath);
              markdownFiles.push({
                path: fullPath,
                mtime: stats.mtimeMs,
              });
            } catch (error) {
              console.error(`Error reading file stats ${fullPath}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
      }
    };

    searchDir(dirPath);

    // Sort by modification time (newest first) and take maxFiles
    return markdownFiles
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, maxFiles)
      .map((file) => file.path);
  }

  /**
   * Read content samples from markdown files
   */
  private static async readContentSamples(
    filePaths: string[],
    maxCharsPerFile: number = 3000,
  ): Promise<string> {
    const samples: string[] = [];

    for (const filePath of filePaths.slice(0, 10)) {
      // Limit to first 10 files
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const fileName = path.basename(filePath);
        const sample = content.slice(0, maxCharsPerFile);
        samples.push(`## File: ${fileName}\n\n${sample}\n\n---\n`);
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
      }
    }

    return samples.join("\n");
  }

  /**
   * Generate voice profile using Copilot
   */
  private static async generateVoiceProfile(
    contentLocation: string,
    contentSamples: string,
    modelId?: string,
  ): Promise<string> {
    try {
      const systemPrompt = this.SYSTEM_PROMPT.replace(
        "{{contentLocation}}",
        contentLocation,
      );

      const userMessage = `I've found the following writing samples from ${contentLocation}:\n\n${contentSamples}\n\nPlease analyze these samples and create a comprehensive voice profile.`;

      const messages = [
        LanguageModelChatMessage.Assistant(systemPrompt),
        LanguageModelChatMessage.User(userMessage),
      ];

      const response = await CopilotService.sendChatRequest(messages, modelId);

      return response || "";
    } catch (error) {
      console.error("Error generating voice profile:", error);
      return "";
    }
  }

  /**
   * Save voice profile to .ghostwriter/voices folder
   */
  private static async saveVoiceProfile(
    voiceProfile: string,
  ): Promise<string | undefined> {
    try {
      const ghostwriterPath = await FileService.getGhostwriterFolder();
      if (!ghostwriterPath) {
        return undefined;
      }

      const voicesPath = path.join(ghostwriterPath, "voices");
      if (!fs.existsSync(voicesPath)) {
        fs.mkdirSync(voicesPath, { recursive: true });
      }

      // Create filename with current date
      const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const fileName = `voice-${date}.md`;
      const filePath = path.join(voicesPath, fileName);

      // If file already exists, append timestamp
      let finalPath = filePath;
      if (fs.existsSync(filePath)) {
        const timestamp = Date.now();
        finalPath = path.join(voicesPath, `voice-${date}-${timestamp}.md`);
      }

      // Write the voice profile
      fs.writeFileSync(finalPath, voiceProfile, "utf-8");

      // Open the file in the editor
      const document = await vscode.workspace.openTextDocument(finalPath);
      await vscode.window.showTextDocument(document);

      return finalPath;
    } catch (error) {
      console.error("Error saving voice profile:", error);
      return undefined;
    }
  }
}
