import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class FileService {
  private static GHOSTWRITER_FOLDER = '.ghostwriter';

  /**
   * Get or create the .ghostwriter folder in the workspace
   */
  static async getGhostwriterFolder(): Promise<string | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showWarningMessage('No workspace folder open');
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
   * Get all transcript files from .ghostwriter folder
   */
  static async getTranscriptFiles(): Promise<Array<{ path: string; name: string; date?: string }>> {
    const ghostwriterPath = await this.getGhostwriterFolder();
    if (!ghostwriterPath) {
      return [];
    }

    try {
      const files = fs.readdirSync(ghostwriterPath);
      const transcripts = files
        .filter(file => file.endsWith('.md') && file.includes('transcript'))
        .map(file => {
          const filePath = path.join(ghostwriterPath, file);
          const stats = fs.statSync(filePath);
          return {
            path: filePath,
            name: file,
            date: stats.mtime.toISOString().split('T')[0]
          };
        })
        .sort((a, b) => b.date!.localeCompare(a.date!));

      return transcripts;
    } catch (error) {
      console.error('Error reading transcript files:', error);
      return [];
    }
  }

  /**
   * Get all voice files from .ghostwriter folder
   */
  static async getVoiceFiles(): Promise<Array<{ path: string; name: string }>> {
    const ghostwriterPath = await this.getGhostwriterFolder();
    if (!ghostwriterPath) {
      return [];
    }

    try {
      const files = fs.readdirSync(ghostwriterPath);
      const voiceFiles = files
        .filter(file => file.endsWith('.md') && file.includes('voice'))
        .map(file => ({
          path: path.join(ghostwriterPath, file),
          name: file
        }));

      return voiceFiles;
    } catch (error) {
      console.error('Error reading voice files:', error);
      return [];
    }
  }

  /**
   * Create a new transcript file
   */
  static async createTranscript(topic: string, content: string = ''): Promise<string | undefined> {
    const ghostwriterPath = await this.getGhostwriterFolder();
    if (!ghostwriterPath) {
      return undefined;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // YYYY-MM-DDTHH-MM-SS
    const fileName = `transcript-${topic.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.md`;
    const filePath = path.join(ghostwriterPath, fileName);

    const initialContent = content || `# Interview Transcript: ${topic}\n\nDate: ${new Date().toLocaleDateString()}\n\n## Interview Content\n\n`;

    try {
      fs.writeFileSync(filePath, initialContent, 'utf-8');
      return filePath;
    } catch (error) {
      console.error('Error creating transcript:', error);
      vscode.window.showErrorMessage('Failed to create transcript file');
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
        'Markdown': ['md'],
        'All Files': ['*']
      },
      title: `Select ${fileType} File`
    });

    if (result && result.length > 0) {
      return result[0].fsPath;
    }

    return undefined;
  }
}
