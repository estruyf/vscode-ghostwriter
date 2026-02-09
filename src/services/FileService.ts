import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { CopilotService } from "./CopilotService";
import { StateService } from "./StateService";
import { TemplateResolver, TemplateResolverContext } from "../utils";

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
   * Resolution priority: StateService override > VS Code setting > .ghostwriter/attachments
   */
  private static async getAttachmentsFolder(): Promise<string | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return undefined;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;

    // Priority 1: Per-interview override from StateService
    const stateFolder = StateService.getAttachmentFolder();
    if (stateFolder) {
      const attachmentsPath = path.join(rootPath, stateFolder);
      if (!fs.existsSync(attachmentsPath)) {
        fs.mkdirSync(attachmentsPath, { recursive: true });
      }
      return attachmentsPath;
    }

    // Priority 2: VS Code workspace setting
    const configFolder = vscode.workspace
      .getConfiguration("vscode-ghostwriter")
      .get<string>("attachmentFolder");
    if (configFolder) {
      const attachmentsPath = path.join(rootPath, configFolder);
      if (!fs.existsSync(attachmentsPath)) {
        fs.mkdirSync(attachmentsPath, { recursive: true });
      }
      return attachmentsPath;
    }

    // Priority 3: Default .ghostwriter/attachments
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

  static sanitizeSlug(value: string): string {
    return TemplateResolver.sanitizeSlug(value);
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
   * Get the topic from a transcript's session file
   * @param transcriptPath - Path to the transcript .md file
   * @returns The topic string if found, undefined otherwise
   */
  static async getTranscriptTopic(
    transcriptPath: string,
  ): Promise<string | undefined> {
    try {
      const sessionPath = transcriptPath.replace(/\.md$/, ".json");
      if (!fs.existsSync(sessionPath)) {
        return undefined;
      }

      const sessionContent = fs.readFileSync(sessionPath, "utf-8");
      const session = JSON.parse(sessionContent);
      return session.topic;
    } catch (error) {
      console.error("Error reading transcript topic:", error);
      return undefined;
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
   * Open a folder picker and return the selected path relative to workspace root
   */
  static async selectFolder(): Promise<string | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return undefined;
    }

    const result = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      defaultUri: workspaceFolders[0].uri,
      title: "Select Attachment Folder",
    });

    if (result && result.length > 0) {
      const rootPath = workspaceFolders[0].uri.fsPath;
      return path.relative(rootPath, result[0].fsPath);
    }

    return undefined;
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

  /**
   * Resolve an image path to an absolute path.
   * Tries: absolute path, relative to .ghostwriter/, relative to workspace root.
   */
  private static async resolveImagePath(
    imagePath: string,
  ): Promise<string | undefined> {
    if (path.isAbsolute(imagePath) && fs.existsSync(imagePath)) {
      return imagePath;
    }

    // Try relative to .ghostwriter folder (the transcript format)
    const ghostwriterPath = await this.getGhostwriterFolder();
    if (ghostwriterPath) {
      let cleanPath = imagePath;
      if (cleanPath.startsWith(`${this.GHOSTWRITER_FOLDER}/`)) {
        cleanPath = cleanPath.replace(`${this.GHOSTWRITER_FOLDER}/`, "");
      }
      const absPath = path.join(ghostwriterPath, cleanPath);
      if (fs.existsSync(absPath)) {
        return absPath;
      }
    }

    // Try relative to workspace root
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const rootPath = workspaceFolders[0].uri.fsPath;
      const absPath = path.join(rootPath, imagePath);
      if (fs.existsSync(absPath)) {
        return absPath;
      }
    }

    return undefined;
  }

  /**
   * Remap image references in markdown content.
   * Replaces image paths that match the targetImageFolder with the imageProductionPath.
   *
   * @param content - The markdown content containing image references
   * @param targetImageFolder - Absolute path to the target folder for images
   * @param articleFilePath - Absolute path where the article will be saved (unused, kept for compatibility)
   * @param imageProductionPath - Optional path for production image links (e.g., "/uploads/2026/02")
   * @returns The content with rewritten image paths
   */
  static async remapImages(
    content: string,
    targetImageFolder: string,
    articleFilePath: string,
    imageProductionPath?: string,
  ): Promise<string> {
    // If no production path is specified, return content unchanged
    if (!imageProductionPath) {
      return content;
    }

    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let result = content;
    const replacements: Array<{ original: string; replacement: string }> = [];

    let match;
    while ((match = imageRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const alt = match[1];
      const imagePath = match[2];

      // Skip URLs
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        continue;
      }

      // Resolve the absolute path for the image
      const resolvedPath = await this.resolveImagePath(imagePath);
      if (!resolvedPath) {
        continue;
      }

      // Check if the resolved path is within the targetImageFolder
      if (resolvedPath.startsWith(targetImageFolder)) {
        // Extract just the filename
        const fileName = path.basename(resolvedPath);

        // Create the production path, ensuring no double slashes
        const normalizedProductionPath = imageProductionPath.replace(
          /\/+$/,
          "",
        ); // Remove trailing slashes
        const imageLink = `${normalizedProductionPath}/${fileName}`;

        replacements.push({
          original: fullMatch,
          replacement: `![${alt}](${imageLink})`,
        });
      }
    }

    // Apply replacements
    for (const { original, replacement } of replacements) {
      result = result.replace(original, replacement);
    }

    return result;
  }

  private static resolveSaveDialogUri(
    workspaceFolder: vscode.WorkspaceFolder,
    defaultFileName: string,
    templateContext?: TemplateResolverContext,
  ): { defaultUri: vscode.Uri; defaultDir: string } {
    const rootPath = workspaceFolder.uri.fsPath;
    const baseFileName = path.basename(defaultFileName);
    const baseName = baseFileName.replace(/\.[^/.]+$/, "");

    const context: TemplateResolverContext = {
      date: templateContext?.date || new Date(),
      fileName: templateContext?.fileName || baseName,
      title: templateContext?.title,
      slug: templateContext?.slug,
    };

    const stateLocation = StateService.getDefaultSaveLocation();
    const stateFilenameTemplate = StateService.getFilenameTemplate();
    const config = vscode.workspace.getConfiguration("vscode-ghostwriter");

    const configLocation = config.get<string>("defaultSaveLocation");
    const configFilenameTemplate = config.get<string>("filenameTemplate");

    const locationTemplate =
      stateLocation !== undefined ? stateLocation : configLocation || "";
    const filenameTemplate =
      stateFilenameTemplate !== undefined
        ? stateFilenameTemplate
        : configFilenameTemplate || "";

    let resolvedLocation = locationTemplate
      ? TemplateResolver.resolveTemplate(locationTemplate, context)
      : "";
    let resolvedFileName = filenameTemplate
      ? TemplateResolver.resolveTemplate(filenameTemplate, context)
      : baseFileName;

    if (!resolvedFileName) {
      resolvedFileName = baseFileName;
    }

    const fileNameDir = path.dirname(resolvedFileName);
    if (fileNameDir && fileNameDir !== ".") {
      resolvedLocation = resolvedLocation
        ? path.join(resolvedLocation, fileNameDir)
        : fileNameDir;
      resolvedFileName = path.basename(resolvedFileName);
    }

    const resolvedDir = resolvedLocation
      ? path.isAbsolute(resolvedLocation)
        ? resolvedLocation
        : path.join(rootPath, resolvedLocation)
      : rootPath;

    const usesTemplate =
      Boolean(locationTemplate) ||
      Boolean(filenameTemplate) ||
      (fileNameDir && fileNameDir !== ".");

    if (usesTemplate && !fs.existsSync(resolvedDir)) {
      fs.mkdirSync(resolvedDir, { recursive: true });
    }

    return {
      defaultUri: vscode.Uri.file(path.join(resolvedDir, resolvedFileName)),
      defaultDir: resolvedDir,
    };
  }

  /**
   * Save markdown content to a file with optional image remapping.
   * Unified method used by WriterService and DraftService.
   *
   * @param content - The markdown content to save
   * @param defaultFileName - Default filename for the save dialog
   * @param imageTargetFolder - Optional target folder for images (relative to workspace root)
   * @param imageProductionPath - Optional path for production image links (e.g., "/uploads/2026/02")
   * @param successMessage - Message to show on successful save
   * @param templateContext - Optional template context for resolving placeholders
   */
  static async saveMarkdownFile(
    content: string,
    defaultFileName: string,
    imageTargetFolder?: string,
    imageProductionPath?: string,
    successMessage: string = "File saved successfully!",
    templateContext?: TemplateResolverContext,
  ): Promise<void> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const workspaceFolder = workspaceFolders?.[0];

      if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder is open");
        return;
      }

      const { defaultUri } = this.resolveSaveDialogUri(
        workspaceFolder,
        defaultFileName,
        templateContext,
      );

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

      const targetDir = path.dirname(fileUri.fsPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      let finalContent = content;

      // Remap images if a target folder is specified
      if (imageTargetFolder) {
        const rootPath = workspaceFolder.uri.fsPath;
        const targetAbsPath = path.join(rootPath, imageTargetFolder);
        finalContent = await this.remapImages(
          content,
          targetAbsPath,
          fileUri.fsPath,
          imageProductionPath,
        );
      }

      // Write the file
      fs.writeFileSync(fileUri.fsPath, finalContent, "utf-8");

      // Open the file in the editor
      const document = await vscode.workspace.openTextDocument(fileUri);
      await vscode.window.showTextDocument(document);

      vscode.window.showInformationMessage(successMessage);
    } catch (error) {
      console.error("Error saving markdown file:", error);
      vscode.window.showErrorMessage("Failed to save file");
    }
  }
}
