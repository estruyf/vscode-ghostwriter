import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export interface FrontMatterContentType {
  name: string;
  fields: FrontMatterField[];
}

export interface FrontMatterField {
  name: string;
  type: string;
  required?: boolean;
  default?: any;
}

export class FrontMatterService {
  private static readonly FRONT_MATTER_EXTENSION_ID = "eliostruyf.vscode-front-matter";

  /**
   * Check if Front Matter CMS extension is installed and active
   */
  static isFrontMatterInstalled(): boolean {
    const extension = vscode.extensions.getExtension(this.FRONT_MATTER_EXTENSION_ID);
    return extension !== undefined;
  }

  /**
   * Get Front Matter CMS extension instance
   */
  private static getFrontMatterExtension() {
    const extension = vscode.extensions.getExtension(this.FRONT_MATTER_EXTENSION_ID);
    if (!extension) {
      return null;
    }
    return extension;
  }

  /**
   * Check if Front Matter CMS is available and active
   */
  static async isFrontMatterAvailable(): Promise<boolean> {
    const extension = this.getFrontMatterExtension();
    if (!extension) {
      return false;
    }

    // Activate the extension if it's not already active
    if (!extension.isActive) {
      try {
        await extension.activate();
      } catch (error) {
        console.error("Failed to activate Front Matter CMS:", error);
        return false;
      }
    }

    return true;
  }

  /**
   * Create a content item in Front Matter CMS
   * This opens the file with Front Matter's interface
   */
  static async createContentItem(
    filePath: string,
    contentType?: string
  ): Promise<void> {
    try {
      if (!(await this.isFrontMatterAvailable())) {
        vscode.window.showWarningMessage(
          "Front Matter CMS extension is not installed or active"
        );
        return;
      }

      // Open the file in VS Code
      const uri = vscode.Uri.file(filePath);
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document);

      // Try to register the file with Front Matter CMS
      // This will make Front Matter aware of the new content
      try {
        await vscode.commands.executeCommand("frontMatter.dashboard.open");
      } catch (error) {
        console.log("Front Matter dashboard command not available:", error);
      }

      vscode.window.showInformationMessage(
        "Article saved and opened in Front Matter CMS"
      );
    } catch (error) {
      console.error("Error creating content item in Front Matter:", error);
      throw error;
    }
  }

  /**
   * Sync article metadata with Front Matter CMS by opening the Front Matter panel
   */
  static async syncWithFrontMatter(filePath: string): Promise<void> {
    try {
      if (!(await this.isFrontMatterAvailable())) {
        return;
      }

      // Open the file
      const uri = vscode.Uri.file(filePath);
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document);

      // Open Front Matter panel for this file
      try {
        await vscode.commands.executeCommand("frontMatter.panel.open");
      } catch (error) {
        console.log("Front Matter panel command not available:", error);
      }
    } catch (error) {
      console.error("Error syncing with Front Matter:", error);
    }
  }

  /**
   * Get content directory from Front Matter CMS configuration
   */
  static async getContentDirectory(): Promise<string | null> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return null;
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const fmConfigPath = path.join(workspaceRoot, "frontmatter.json");

      if (!fs.existsSync(fmConfigPath)) {
        return null;
      }

      const configContent = fs.readFileSync(fmConfigPath, "utf-8");
      const config = JSON.parse(configContent);

      // Front Matter typically uses 'content' or 'contentFolder' in config
      if (config.frontMatter?.content?.pageFolders) {
        const pageFolders = config.frontMatter.content.pageFolders;
        if (Array.isArray(pageFolders) && pageFolders.length > 0) {
          return path.join(workspaceRoot, pageFolders[0].path || pageFolders[0]);
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting Front Matter content directory:", error);
      return null;
    }
  }

  /**
   * Extract frontmatter from markdown content
   */
  static extractFrontmatter(content: string): { frontmatter: string; body: string } | null {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (match) {
      return {
        frontmatter: match[1],
        body: match[2],
      };
    }

    return null;
  }

  /**
   * Save article with Front Matter CMS integration
   */
  static async saveWithFrontMatter(
    content: string,
    defaultFileName?: string
  ): Promise<string | null> {
    try {
      // Get the content directory from Front Matter config
      let defaultUri: vscode.Uri;
      const contentDir = await this.getContentDirectory();
      
      if (contentDir) {
        // Use Front Matter's content directory
        defaultUri = vscode.Uri.file(
          path.join(contentDir, defaultFileName || `${new Date().getTime()}_article.md`)
        );
      } else {
        // Fallback to workspace root
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
          vscode.window.showErrorMessage("No workspace folder is open");
          return null;
        }
        defaultUri = vscode.Uri.joinPath(
          workspaceFolders[0].uri,
          defaultFileName || `${new Date().getTime()}_article.md`
        );
      }

      // Show save dialog
      const fileUri = await vscode.window.showSaveDialog({
        defaultUri,
        filters: {
          "Markdown files": ["md"],
          "All files": ["*"],
        },
      });

      if (!fileUri) {
        return null; // User cancelled
      }

      // Write the file
      fs.writeFileSync(fileUri.fsPath, content, "utf-8");

      // Integrate with Front Matter - create content item and open in FM interface
      await this.createContentItem(fileUri.fsPath);

      return fileUri.fsPath;
    } catch (error) {
      console.error("Error saving with Front Matter:", error);
      vscode.window.showErrorMessage("Failed to save article");
      return null;
    }
  }
}
