import * as vscode from 'vscode';
import { FileService } from './FileService';

export class InterviewService {
  /**
   * Start a new interview session
   */
  static async startInterview(topic: string): Promise<void> {
    try {
      // Create a new transcript file
      const transcriptPath = await FileService.createTranscript(topic);
      
      if (!transcriptPath) {
        return;
      }

      // Open the transcript file in the editor
      const document = await vscode.workspace.openTextDocument(transcriptPath);
      await vscode.window.showTextDocument(document);

      vscode.window.showInformationMessage(
        `Interview started: ${topic}. Transcript saved to .ghostwriter folder.`
      );

      // TODO: Integrate with ghostwriter-agents-ai for actual interview flow
      // This is a placeholder - actual implementation would connect to the AI service
    } catch (error) {
      console.error('Error starting interview:', error);
      vscode.window.showErrorMessage('Failed to start interview');
    }
  }
}
