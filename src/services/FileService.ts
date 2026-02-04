import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export class FileService {
  private static GHOSTWRITER_FOLDER = ".ghostwriter";
  private static TRANSCRIPTS_FOLDER = "transcripts";
  private static VOICES_FOLDER = "voices";

  /**
   * Get or create the .ghostwriter folder in the workspace
   */
  static async getGhostwriterFolder(): Promise<string | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showWarningMessage("No workspace folder open");
      return undefined;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const ghostwriterPath = path.join(rootPath, this.GHOSTWRITER_FOLDER);

    // Create folder if it doesn't exist
    if (!fs.existsSync(ghostwriterPath)) {
      fs.mkdirSync(ghostwriterPath, { recursive: true });
    }

    return ghostwriterPath;
  }

  /**
   * Get or create the transcripts folder
   */
  private static async getTranscriptsFolder(): Promise<string | undefined> {
    const ghostwriterPath = await this.getGhostwriterFolder();
    if (!ghostwriterPath) {
      return undefined;
    }

    const transcriptsPath = path.join(ghostwriterPath, this.TRANSCRIPTS_FOLDER);
    if (!fs.existsSync(transcriptsPath)) {
      fs.mkdirSync(transcriptsPath, { recursive: true });
    }

    return transcriptsPath;
  }

  /**
   * Get or create the voices folder
   */
  private static async getVoicesFolder(): Promise<string | undefined> {
    const ghostwriterPath = await this.getGhostwriterFolder();
    if (!ghostwriterPath) {
      return undefined;
    }

    const voicesPath = path.join(ghostwriterPath, this.VOICES_FOLDER);
    if (!fs.existsSync(voicesPath)) {
      fs.mkdirSync(voicesPath, { recursive: true });
    }

    return voicesPath;
  }

  /**
   * Get all transcript files from .ghostwriter/transcripts folder
   */
  static async getTranscriptFiles(): Promise<
    Array<{ path: string; name: string; date?: string }>
  > {
    const transcriptsPath = await this.getTranscriptsFolder();
    if (!transcriptsPath) {
      return [];
    }

    try {
      const files = fs.readdirSync(transcriptsPath);
      const transcripts = files
        .filter((file) => file.endsWith(".md"))
        .map((file) => {
          const filePath = path.join(transcriptsPath, file);
          const stats = fs.statSync(filePath);
          return {
            path: filePath,
            name: file,
            date: stats.mtime.toISOString().split("T")[0],
          };
        })
        .sort((a, b) => b.date!.localeCompare(a.date!));

      return transcripts;
    } catch (error) {
      console.error("Error reading transcript files:", error);
      return [];
    }
  }

  /**
   * Get all voice files from .ghostwriter/voices folder
   */
  static async getVoiceFiles(): Promise<Array<{ path: string; name: string }>> {
    const voicesPath = await this.getVoicesFolder();
    if (!voicesPath) {
      return [];
    }

    try {
      const files = fs.readdirSync(voicesPath);
      const voiceFiles = files
        .filter((file) => file.endsWith(".md"))
        .map((file) => ({
          path: path.join(voicesPath, file),
          name: file,
        }));

      return voiceFiles;
    } catch (error) {
      console.error("Error reading voice files:", error);
      return [];
    }
  }

  /**
   * Create a new transcript file in .ghostwriter/transcripts folder
   */
  static async createTranscript(
    topic: string,
    content: string = "",
    modelId?: string,
  ): Promise<string | undefined> {
    const transcriptsPath = await this.getTranscriptsFolder();
    if (!transcriptsPath) {
      return undefined;
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5); // YYYY-MM-DDTHH-MM-SS
    const fileName = `transcript-${topic.toLowerCase().replace(/\s+/g, "-")}-${timestamp}.md`;
    const filePath = path.join(transcriptsPath, fileName);

    const initialContent =
      content ||
      `# Interview Transcript: ${topic}
      
Date: ${new Date().toLocaleDateString()}
Topic: ${topic || "N/A"}
AI Model: ${modelId || "N/A"}

## Interview Content

`;

    try {
      fs.writeFileSync(filePath, initialContent, "utf-8");
      return filePath;
    } catch (error) {
      console.error("Error creating transcript:", error);
      vscode.window.showErrorMessage("Failed to create transcript file");
      return undefined;
    }
  }

  /**
   * Append content to an existing transcript file
   */
  static async appendToTranscript(
    filePath: string,
    content: string,
  ): Promise<void> {
    try {
      fs.appendFileSync(filePath, content, "utf-8");
    } catch (error) {
      console.error("Error appending to transcript:", error);
      vscode.window.showErrorMessage("Failed to update transcript file");
    }
  }

  /**
   * Read content from a transcript file
   */
  static async readTranscript(filePath: string): Promise<string | undefined> {
    try {
      if (!fs.existsSync(filePath)) {
        return undefined;
      }
      return fs.readFileSync(filePath, "utf-8");
    } catch (error) {
      console.error("Error reading transcript:", error);
      return undefined;
    }
  }

  /**
   * Save interview session data
   */
  static async saveInterviewSession(
    transcriptPath: string,
    session: any,
  ): Promise<void> {
    try {
      const sessionPath = transcriptPath.replace(/\.md$/, ".json");
      fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2), "utf-8");
    } catch (error) {
      console.error("Error saving interview session:", error);
    }
  }

  /**
   * Select a custom file using file picker
   */
  static async selectCustomFile(fileType: string): Promise<string | undefined> {
    const result = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        Markdown: ["md"],
        "All Files": ["*"],
      },
      title: `Select ${fileType} File`,
    });

    if (result && result.length > 0) {
      return result[0].fsPath;
    }

    return undefined;
  }

  /**
   * Delete a file
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
    }
  }
}
