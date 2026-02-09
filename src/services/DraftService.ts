import * as vscode from "vscode";
import { LanguageModelChatMessage } from "vscode";
import * as fs from "fs";
import * as path from "path";
import { CopilotService } from "./CopilotService";
import { GhostwriterViewProvider } from "../providers/GhostwriterViewProvider";
import { FileService } from "./FileService";
import { v4 as uuidv4 } from "uuid";

export interface DraftRevision {
  id: string;
  content: string;
  prompt?: string;
  timestamp: number;
}

export interface Draft {
  id: string;
  title: string;
  transcript: string;
  voice?: string;
  currentRevisionId: string;
  revisions: DraftRevision[];
  createdAt: number;
  updatedAt: number;
  options?: {
    style?: "formal" | "casual" | "conversational";
    includeHeadings?: boolean;
    includeSEO?: boolean;
    keywords?: string;
  };
  frontmatter?: string;
  writerAgentPath?: string;
}

export class DraftService {
  private static draftsFolder: string | undefined;
  private static activeDraft: Draft | undefined;

  /**
   * Initialize the drafts folder
   */
  private static async ensureDraftsFolder(): Promise<string> {
    if (this.draftsFolder) {
      return this.draftsFolder;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    const workspaceFolder = workspaceFolders?.[0];

    if (!workspaceFolder) {
      throw new Error("No workspace folder is open");
    }

    const ghostwriterPath = path.join(
      workspaceFolder.uri.fsPath,
      ".ghostwriter",
    );
    const draftsPath = path.join(ghostwriterPath, "drafts");

    if (!fs.existsSync(draftsPath)) {
      fs.mkdirSync(draftsPath, { recursive: true });
    }

    this.draftsFolder = draftsPath;
    return draftsPath;
  }

  /**
   * Create a new draft from initial content
   */
  static async createDraft(
    title: string,
    transcript: string,
    initialContent: string,
    voice?: string,
    options?: Draft["options"],
    frontmatter?: string,
    writerAgentPath?: string,
  ): Promise<Draft> {
    const now = Date.now();
    const revisionId = uuidv4();

    const draft: Draft = {
      id: uuidv4(),
      title,
      transcript,
      voice,
      currentRevisionId: revisionId,
      revisions: [
        {
          id: revisionId,
          content: initialContent,
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
      options,
      frontmatter,
      writerAgentPath,
    };

    this.activeDraft = draft;
    await this.saveDraft(draft);

    return draft;
  }

  /**
   * Refine the current draft with a user prompt
   */
  static async refineDraft(
    draftId: string,
    refinementPrompt: string,
    modelId?: string,
  ): Promise<void> {
    if (!this.activeDraft || this.activeDraft.id !== draftId) {
      const draft = await this.loadDraft(draftId);
      if (!draft) {
        throw new Error("Draft not found");
      }
      this.activeDraft = draft;
    }

    const currentRevision = this.activeDraft.revisions.find(
      (r) => r.id === this.activeDraft!.currentRevisionId,
    );

    if (!currentRevision) {
      throw new Error("Current revision not found");
    }

    // Build context for refinement
    const messages = [
      LanguageModelChatMessage.Assistant(
        `You are an expert content editor. The user has a draft article and wants to refine it based on their feedback. Here is the current draft:

${currentRevision.content}

${
  this.activeDraft.voice && fs.existsSync(this.activeDraft.voice)
    ? `Please maintain the writing style from this voice profile:

${fs.readFileSync(this.activeDraft.voice, "utf-8")}`
    : ""
}

Apply the user's refinement request while maintaining the overall structure and quality of the article. Only modify the parts that need to be changed based on the request.`,
      ),
      LanguageModelChatMessage.User(refinementPrompt),
    ];

    let refinedContent = "";
    const onChunk = (chunk: string) => {
      refinedContent += chunk;
      GhostwriterViewProvider.postMessage("draftRefinementStream", { chunk });
    };

    await CopilotService.sendChatRequestStream(messages, onChunk, modelId);

    // Create new revision
    const newRevisionId = uuidv4();
    const newRevision: DraftRevision = {
      id: newRevisionId,
      content: refinedContent,
      prompt: refinementPrompt,
      timestamp: Date.now(),
    };

    this.activeDraft.revisions.push(newRevision);
    this.activeDraft.currentRevisionId = newRevisionId;
    this.activeDraft.updatedAt = Date.now();

    await this.saveDraft(this.activeDraft);

    GhostwriterViewProvider.postMessage("draftRefinementComplete", {
      draft: this.activeDraft,
      revision: newRevision,
    });
  }

  /**
   * Save draft to file system
   */
  private static async saveDraft(draft: Draft): Promise<void> {
    const draftsFolder = await this.ensureDraftsFolder();
    const draftPath = path.join(draftsFolder, `${draft.id}.json`);

    fs.writeFileSync(draftPath, JSON.stringify(draft, null, 2), "utf-8");
  }

  /**
   * Load draft from file system
   */
  private static async loadDraft(draftId: string): Promise<Draft | undefined> {
    const draftsFolder = await this.ensureDraftsFolder();
    const draftPath = path.join(draftsFolder, `${draftId}.json`);

    if (!fs.existsSync(draftPath)) {
      return undefined;
    }

    const content = fs.readFileSync(draftPath, "utf-8");
    return JSON.parse(content) as Draft;
  }

  /**
   * Get all drafts
   */
  static async getAllDrafts(): Promise<Draft[]> {
    const draftsFolder = await this.ensureDraftsFolder();
    const files = fs.readdirSync(draftsFolder);

    const drafts: Draft[] = [];
    for (const file of files) {
      if (file.endsWith(".json")) {
        const content = fs.readFileSync(path.join(draftsFolder, file), "utf-8");
        drafts.push(JSON.parse(content) as Draft);
      }
    }

    // Sort by most recently updated
    return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Get the active draft
   */
  static getActiveDraft(): Draft | undefined {
    return this.activeDraft;
  }

  /**
   * Set the active draft
   */
  static async setActiveDraft(draftId: string): Promise<Draft | undefined> {
    const draft = await this.loadDraft(draftId);
    this.activeDraft = draft;
    return draft;
  }

  /**
   * Switch to a specific revision
   */
  static async switchToRevision(
    draftId: string,
    revisionId: string,
  ): Promise<void> {
    if (!this.activeDraft || this.activeDraft.id !== draftId) {
      const draft = await this.loadDraft(draftId);
      if (!draft) {
        throw new Error("Draft not found");
      }
      this.activeDraft = draft;
    }

    const revision = this.activeDraft.revisions.find(
      (r) => r.id === revisionId,
    );

    if (!revision) {
      throw new Error("Revision not found");
    }

    this.activeDraft.currentRevisionId = revisionId;
    this.activeDraft.updatedAt = Date.now();

    await this.saveDraft(this.activeDraft);

    GhostwriterViewProvider.postMessage("draftRevisionSwitched", {
      draft: this.activeDraft,
      revision,
    });
  }

  /**
   * Delete a draft
   */
  static async deleteDraft(draftId: string): Promise<void> {
    const draftsFolder = await this.ensureDraftsFolder();
    const draftPath = path.join(draftsFolder, `${draftId}.json`);

    if (fs.existsSync(draftPath)) {
      fs.unlinkSync(draftPath);
    }

    if (this.activeDraft?.id === draftId) {
      this.activeDraft = undefined;
    }
  }

  /**
   * Export draft as markdown
   * @param draftId - The draft ID to export
   * @param imageTargetFolder - Optional target folder for images (relative to workspace root)
   * @param imageProductionPath - Optional path for production image links (e.g., "/uploads/2026/02")
   */
  static async exportDraft(
    draftId: string,
    imageTargetFolder?: string,
    imageProductionPath?: string,
  ): Promise<void> {
    const draft = await this.loadDraft(draftId);
    if (!draft) {
      throw new Error("Draft not found");
    }

    const currentRevision = draft.revisions.find(
      (r) => r.id === draft.currentRevisionId,
    );

    if (!currentRevision) {
      throw new Error("Current revision not found");
    }

    const safeTitle = draft.title || "draft";
    const slug = FileService.sanitizeSlug(safeTitle);
    const defaultFileName = `${slug || "draft"}.md`;

    await FileService.saveMarkdownFile(
      currentRevision.content,
      defaultFileName,
      imageTargetFolder,
      imageProductionPath,
      "Draft exported successfully!",
      {
        fileName: slug || "draft",
        title: safeTitle,
        date: new Date(),
      },
    );
  }
}
