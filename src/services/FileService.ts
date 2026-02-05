import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { CopilotService } from "./CopilotService";

export class FileService {
  private static GHOSTWRITER_FOLDER = ".ghostwriter";
  private static TRANSCRIPTS_FOLDER = "transcripts";
  private static VOICES_FOLDER = "voices";
  private static ATTACHMENTS_FOLDER = "attachments";

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
   * Get or create the attachments folder
   */
  private static async getAttachmentsFolder(): Promise<string | undefined> {
    const ghostwriterPath = await this.getGhostwriterFolder();
    if (!ghostwriterPath) {
      return undefined;
    }

    const attachmentsPath = path.join(ghostwriterPath, this.ATTACHMENTS_FOLDER);
    if (!fs.existsSync(attachmentsPath)) {
      fs.mkdirSync(attachmentsPath, { recursive: true });
    }

    return attachmentsPath;
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
    const slug = await this.generateTranscriptSlug(topic);
    const fileName = `transcript-${slug}-${timestamp}.md`;
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

  private static sanitizeSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private static async generateTranscriptSlug(topic: string): Promise<string> {
    if (!topic?.trim()) {
      return "untitled";
    }

    const fallback = this.sanitizeSlug(topic);
    const wordCount = topic.trim().split(/\s+/).length;

    if (wordCount > 4) {
      try {
        const response = await CopilotService.promptCopilot(
          'Create a short, descriptive slug for a filename. Return only the slug, lowercase, hyphen-separated, max 60 characters, only letters a-z, digits 0-9, and hyphens. Topic: "' +
            topic +
            '".',
        );
        const aiSlug = response ? this.sanitizeSlug(response) : "";
        if (aiSlug) {
          return aiSlug.slice(0, 60);
        }
      } catch (error) {
        console.error("Error generating transcript slug:", error);
      }
    }

    if (fallback) {
      return fallback.slice(0, 60);
    }

    return "untitled";
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

  /**
   * Save an image to the .ghostwriter/attachments folder
   * @param base64Data - Base64 encoded image data (with or without data URI prefix)
   * @param fileName - Optional filename, will generate one if not provided
   * @returns The absolute path to the saved image file
   */
  static async saveImage(
    base64Data: string,
    fileName?: string,
  ): Promise<string | undefined> {
    try {
      const imagesPath = await this.getAttachmentsFolder();
      if (!imagesPath) {
        return undefined;
      }

      // Remove data URI prefix if present
      const base64Regex = /^data:image\/[a-zA-Z+]+;base64,/;
      const cleanBase64 = base64Data.replace(base64Regex, "");

      // Generate filename if not provided
      let finalFileName = fileName;
      if (!finalFileName) {
        const timestamp = new Date()
          .toISOString()
          .replace(/[:.]/g, "-")
          .slice(0, -5);
        const randomId = Math.random().toString(36).substring(2, 9);

        // Try to detect image format from data URI
        const formatMatch = base64Data.match(
          /^data:image\/([a-zA-Z+]+);base64,/,
        );
        const format = formatMatch ? formatMatch[1].replace("+", "") : "png";

        finalFileName = `image-${timestamp}-${randomId}.${format}`;
      }

      const filePath = path.join(imagesPath, finalFileName);

      // Write the image file
      const buffer = Buffer.from(cleanBase64, "base64");
      fs.writeFileSync(filePath, buffer);

      return filePath;
    } catch (error) {
      console.error("Error saving image:", error);
      vscode.window.showErrorMessage(
        `Failed to save image: ${(error as Error).message}`,
      );
      return undefined;
    }
  }

  /**
   * Get the relative path from the ghostwriter folder to an image
   * @param absolutePath - The absolute path to the image
   * @returns The relative path from the .ghostwriter folder
   */
  static async getRelativeImagePath(
    absolutePath: string,
  ): Promise<string | undefined> {
    const ghostwriterPath = await this.getGhostwriterFolder();
    if (!ghostwriterPath) {
      return undefined;
    }

    return path.relative(ghostwriterPath, absolutePath);
  }

  /**
   * Get the absolute path to an image from a relative path
   * @param relativePath - The relative path from the .ghostwriter folder
   * @returns The absolute path to the image
   */
  static async getAbsoluteImagePath(
    relativePath: string,
  ): Promise<string | undefined> {
    const ghostwriterPath = await this.getGhostwriterFolder();
    if (!ghostwriterPath) {
      return undefined;
    }

    return path.join(ghostwriterPath, relativePath);
  }

  /**
   * Read an image file and return its base64 data URI
   * @param filePath - The absolute or relative path to the image file
   * @returns The base64 data URI string
   */
  static async readImage(filePath: string): Promise<string | undefined> {
    try {
      let absolutePath = filePath;

      if (filePath.startsWith(this.GHOSTWRITER_FOLDER)) {
        filePath = filePath.replace(`${this.GHOSTWRITER_FOLDER}/`, "");
      }

      // If path is relative to ghostwriter folder (e.g. starts with attachments/), resolve it
      if (!path.isAbsolute(filePath)) {
        const ghostwriterPath = await this.getGhostwriterFolder();
        if (ghostwriterPath) {
          absolutePath = path.join(ghostwriterPath, filePath);
        }
      }

      if (!fs.existsSync(absolutePath)) {
        return undefined;
      }

      return absolutePath;
    } catch (error) {
      console.error(`Error reading image ${filePath}:`, error);
      return undefined;
    }
  }
}
