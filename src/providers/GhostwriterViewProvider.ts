import * as vscode from 'vscode';
import { MessageHandlerData } from '@estruyf/vscode';
import { FileService } from '../services/FileService';
import { InterviewService } from '../services/InterviewService';
import { WriterService } from '../services/WriterService';

export class GhostwriterViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ghostwriter.mainView';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'out', 'webview')
      ]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (message: MessageHandlerData<any>) => {
      const { command, requestId, payload } = message;

      switch (command) {
        case 'startInterview':
          await InterviewService.startInterview(payload.topic);
          break;

        case 'getTranscripts':
          const transcripts = await FileService.getTranscriptFiles();
          webviewView.webview.postMessage({
            command,
            requestId,
            payload: transcripts
          } as MessageHandlerData<any>);
          break;

        case 'getVoiceFiles':
          const voiceFiles = await FileService.getVoiceFiles();
          webviewView.webview.postMessage({
            command,
            requestId,
            payload: voiceFiles
          } as MessageHandlerData<any>);
          break;

        case 'selectCustomTranscript':
          const transcriptPath = await FileService.selectCustomFile('Transcript');
          webviewView.webview.postMessage({
            command,
            requestId,
            payload: transcriptPath
          } as MessageHandlerData<string>);
          break;

        case 'selectCustomVoice':
          const voicePath = await FileService.selectCustomFile('Voice');
          webviewView.webview.postMessage({
            command,
            requestId,
            payload: voicePath
          } as MessageHandlerData<string>);
          break;

        case 'startWriting':
          await WriterService.startWriting(
            payload.transcript,
            payload.voice
          );
          break;
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'assets', 'index.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'assets', 'index.css')
    );

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <link href="${styleUri}" rel="stylesheet">
  <title>Ghostwriter</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
