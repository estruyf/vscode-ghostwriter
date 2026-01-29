import * as vscode from 'vscode';
import { GhostwriterViewProvider } from './providers/GhostwriterViewProvider';
import { InterviewService } from './services/InterviewService';
import { WriterService } from './services/WriterService';

export function activate(context: vscode.ExtensionContext) {
	console.log('Ghostwriter extension is now active!');

	// Register the webview provider
	const provider = new GhostwriterViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(GhostwriterViewProvider.viewType, provider)
	);

	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-ghostwriter.openView', () => {
			vscode.commands.executeCommand('ghostwriter.mainView.focus');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-ghostwriter.startInterview', async () => {
			const topic = await vscode.window.showInputBox({
				prompt: 'Enter the topic for your interview',
				placeHolder: 'e.g., Blog post about AI'
			});

			if (topic) {
				await InterviewService.startInterview(topic);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-ghostwriter.startWriter', async () => {
			vscode.commands.executeCommand('ghostwriter.mainView.focus');
		})
	);
}

export function deactivate() {}
