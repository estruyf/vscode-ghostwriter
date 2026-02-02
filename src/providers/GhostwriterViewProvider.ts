import * as vscode from "vscode";
import { MessageHandlerData } from "@estruyf/vscode";
import { FileService } from "../services/FileService";
import { InterviewService } from "../services/InterviewService";
import { WriterService } from "../services/WriterService";
import { CopilotService } from "../services/CopilotService";
import { StateService } from "../services/StateService";
import { VoiceService } from "../services/VoiceService";
import { PromptConfigService } from "../services/PromptConfigService";
import { AgentService } from "../services/AgentService";
import { DraftService } from "../services/DraftService";
import { Uri } from "vscode";

export class GhostwriterViewProvider {
  public static readonly viewType = "ghostwriter.mainView";
  private static webview: vscode.WebviewPanel | null = null;
  private static isDisposed = true;
  private static currentInterviewId: string | null = null;
  private static extensionContext: vscode.ExtensionContext | null = null;

  public static get isOpen(): boolean {
    return !this.isDisposed;
  }

  public static setExtensionContext(context: vscode.ExtensionContext) {
    this.extensionContext = context;
  }

  private static get isProductionMode(): boolean {
    return (
      this.extensionContext?.extensionMode === vscode.ExtensionMode.Production
    );
  }

  public static async create(extensionUri: vscode.Uri) {
    if (this.webview) {
      this.webview.reveal();
      return;
    }

    // Create the editor webview
    this.webview = vscode.window.createWebviewPanel(
      this.viewType,
      "Ghostwriter",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "out", "webview"),
        ],
      },
    );

    this.webview.iconPath = {
      light: Uri.joinPath(extensionUri, "assets", `ghostwriter-vscode.png`),
      dark: Uri.joinPath(extensionUri, "assets", `ghostwriter-vscode.png`),
    };

    this.isDisposed = false;

    this.webview.webview.html = this._getHtmlForWebview(
      this.webview.webview,
      extensionUri,
    );

    // Handle messages from the webview
    this.webview.webview.onDidReceiveMessage(
      async (message: MessageHandlerData<any>) => {
        await this.messageListener(message);
      },
    );

    this.webview.onDidDispose(() => {
      this.isDisposed = true;
      this.webview = null;
    });
  }

  private static async messageListener(message: MessageHandlerData<any>) {
    const { command, requestId, payload } = message;

    try {
      switch (command) {
        case "getSelectedModelId": {
          const modelId = StateService.getSelectedModelId();
          if (requestId) {
            this.postRequestMessage(command, requestId, modelId);
          }
          break;
        }

        case "setSelectedModelId": {
          await StateService.setSelectedModelId(payload.modelId);
          break;
        }

        case "getFrontmatterTemplate": {
          const template = StateService.getFrontmatterTemplate();
          if (requestId) {
            this.postRequestMessage(command, requestId, template);
          }
          break;
        }

        case "setFrontmatterTemplate": {
          await StateService.setFrontmatterTemplate(payload.template);
          break;
        }

        case "getSelectedLanguage": {
          const language = StateService.getSelectedLanguage();
          if (requestId) {
            this.postRequestMessage(command, requestId, language);
          }
          break;
        }

        case "setSelectedLanguage": {
          await StateService.setSelectedLanguage(payload.language);
          break;
        }

        case "interview:start": {
          if (this.currentInterviewId) {
            await InterviewService.discardInterview(this.currentInterviewId);
            this.currentInterviewId = null;
          }
          const session = await InterviewService.startInterview(
            payload.agentPath,
            payload.modelId,
          );
          this.currentInterviewId = session.id;
          break;
        }

        case "interview:resume": {
          if (this.currentInterviewId) {
            await InterviewService.discardInterview(this.currentInterviewId);
            this.currentInterviewId = null;
          }
          const session = await InterviewService.resumeInterview(
            payload.transcriptPath,
            payload.agentPath,
            payload.modelId,
          );
          this.currentInterviewId = session.id;
          break;
        }

        case "interview:setTopic": {
          if (!this.currentInterviewId) {
            throw new Error("No active interview session");
          }
          const transcriptPath = await InterviewService.setInterviewTopic(
            this.currentInterviewId,
            payload.topic,
          );
          await InterviewService.startInterviewQuestions(
            this.currentInterviewId,
            payload.modelId,
          );
          // Send transcript path to webview
          if (transcriptPath) {
            this.postMessage("transcriptCreated", { transcriptPath });
          }
          break;
        }

        case "interview:message": {
          if (!this.currentInterviewId) {
            throw new Error("No active interview session");
          }
          await InterviewService.sendMessage(
            this.currentInterviewId,
            payload.message,
            payload.modelId,
          );
          break;
        }

        case "interview:end": {
          if (!this.currentInterviewId) {
            throw new Error("No active interview session");
          }
          await InterviewService.endInterview(
            this.currentInterviewId,
            payload.topic,
            payload.isManualStop ?? false,
          );
          this.currentInterviewId = null;
          break;
        }

        case "interview:reset": {
          if (this.currentInterviewId) {
            await InterviewService.discardInterview(this.currentInterviewId);
            this.currentInterviewId = null;
          }
          break;
        }

        case "getModels": {
          const models = await CopilotService.getAllModels();
          const modelData = models.map((model) => ({
            id: model.id,
            name: model.name,
            family: model.family,
          }));
          if (requestId) {
            this.postRequestMessage(command, requestId, modelData);
          }
          break;
        }

        case "getTranscripts": {
          const transcripts = await FileService.getTranscriptFiles();
          if (requestId) {
            this.postRequestMessage(command, requestId, transcripts);
          }
          break;
        }

        case "getVoiceFiles": {
          const voiceFiles = await FileService.getVoiceFiles();
          if (requestId) {
            this.postRequestMessage(command, requestId, voiceFiles);
          }
          break;
        }

        case "selectCustomTranscript": {
          const transcriptPath =
            await FileService.selectCustomFile("Transcript");
          if (requestId) {
            this.postRequestMessage(command, requestId, transcriptPath);
          }
          break;
        }

        case "selectCustomVoice": {
          const voicePath = await FileService.selectCustomFile("Voice");
          if (requestId) {
            this.postRequestMessage(command, requestId, voicePath);
          }
          break;
        }

        case "startWriting": {
          const customSystemPrompt = payload.promptConfigId
            ? PromptConfigService.getById(payload.promptConfigId)?.systemPrompt
            : undefined;

          await WriterService.startWriting(
            payload.transcript,
            payload.voice,
            payload.options,
            payload.modelId,
            payload.frontmatter,
            customSystemPrompt,
            payload.writerAgentPath,
          );
          break;
        }

        case "saveArticle": {
          await WriterService.saveArticle(payload.content);
          break;
        }

        case "generateVoice": {
          await VoiceService.generateVoice(
            payload.contentLocation,
            payload.modelId,
          );
          break;
        }

        case "getPromptConfigs": {
          const configs = PromptConfigService.getAll();
          if (requestId) {
            this.postRequestMessage(command, requestId, configs);
          }
          break;
        }

        case "getPromptConfig": {
          const config = PromptConfigService.getById(payload.id);
          if (requestId) {
            this.postRequestMessage(command, requestId, config);
          }
          break;
        }

        case "createPromptConfig": {
          const config = await PromptConfigService.create(payload);
          if (requestId) {
            this.postRequestMessage(command, requestId, config);
          }
          break;
        }

        case "updatePromptConfig": {
          const config = await PromptConfigService.update(
            payload.id,
            payload.updates,
          );
          if (requestId) {
            this.postRequestMessage(command, requestId, config);
          }
          break;
        }

        case "deletePromptConfig": {
          const deleted = await PromptConfigService.delete(payload.id);
          if (requestId) {
            this.postRequestMessage(command, requestId, deleted);
          }
          break;
        }

        case "exportPromptConfig": {
          const json = PromptConfigService.export(payload.config);
          if (requestId) {
            this.postRequestMessage(command, requestId, json);
          }
          break;
        }

        case "exportAllPromptConfigs": {
          const json = PromptConfigService.exportAll();
          if (requestId) {
            this.postRequestMessage(command, requestId, json);
          }
          break;
        }

        case "importPromptConfig": {
          const config = await PromptConfigService.import(payload.json);
          if (requestId) {
            this.postRequestMessage(command, requestId, config);
          }
          break;
        }

        case "importAllPromptConfigs": {
          const configs = await PromptConfigService.importAll(payload.json);
          if (requestId) {
            this.postRequestMessage(command, requestId, configs);
          }
          break;
        }

        case "getInterviewerAgents": {
          const agents = await AgentService.getInterviewerAgents();
          if (requestId) {
            this.postRequestMessage(command, requestId, agents);
          }
          break;
        }

        case "getWriterAgents": {
          const agents = await AgentService.getWriterAgents();
          if (requestId) {
            this.postRequestMessage(command, requestId, agents);
          }
          break;
        }

        case "createInterviewerAgent": {
          const agent = await AgentService.createInterviewerAgent(payload.name);
          if (requestId) {
            this.postRequestMessage(command, requestId, agent);
          }
          break;
        }

        case "createWriterAgent": {
          const agent = await AgentService.createWriterAgent(payload.name);
          if (requestId) {
            this.postRequestMessage(command, requestId, agent);
          }
          break;
        }

        case "updateInterviewerAgent": {
          const agent = await AgentService.updateInterviewerAgent(
            payload.agentPath,
            payload.name,
            payload.prompt,
          );
          if (requestId) {
            this.postRequestMessage(command, requestId, agent);
          }
          break;
        }

        case "updateWriterAgent": {
          const agent = await AgentService.updateWriterAgent(
            payload.agentPath,
            payload.name,
            payload.prompt,
          );
          if (requestId) {
            this.postRequestMessage(command, requestId, agent);
          }
          break;
        }

        case "getSelectedInterviewerAgent": {
          const agentPath = StateService.getSelectedInterviewerAgent();
          if (requestId) {
            this.postRequestMessage(command, requestId, agentPath);
          }
          break;
        }

        case "setSelectedInterviewerAgent": {
          await StateService.setSelectedInterviewerAgent(payload.agentPath);
          break;
        }

        case "getSelectedWriterAgent": {
          const agentPath = StateService.getSelectedWriterAgent();
          if (requestId) {
            this.postRequestMessage(command, requestId, agentPath);
          }
          break;
        }

        case "setSelectedWriterAgent": {
          await StateService.setSelectedWriterAgent(payload.agentPath);
          break;
        }

        case "getSelectedPromptConfigId": {
          const id = StateService.getSelectedPromptConfigId();
          if (requestId) {
            this.postRequestMessage(command, requestId, id);
          }
          break;
        }

        case "setSelectedPromptConfigId": {
          await StateService.setSelectedPromptConfigId(payload.id);
          break;
        }

        case "openAgentFile": {
          const agentPath = payload.agentPath;
          if (agentPath) {
            const uri = vscode.Uri.file(agentPath);
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc);
          }
          break;
        }

        case "createDraft": {
          const draft = await DraftService.createDraft(
            payload.title,
            payload.transcript,
            payload.initialContent,
            payload.voice,
            payload.options,
            payload.frontmatter,
            payload.writerAgentPath,
          );
          if (requestId) {
            this.postRequestMessage(command, requestId, draft);
          }
          break;
        }

        case "refineDraft": {
          await DraftService.refineDraft(
            payload.draftId,
            payload.refinementPrompt,
            payload.modelId,
          );
          break;
        }

        case "getAllDrafts": {
          const drafts = await DraftService.getAllDrafts();
          if (requestId) {
            this.postRequestMessage(command, requestId, drafts);
          }
          break;
        }

        case "getActiveDraft": {
          const draft = DraftService.getActiveDraft();
          if (requestId) {
            this.postRequestMessage(command, requestId, draft);
          }
          break;
        }

        case "setActiveDraft": {
          const draft = await DraftService.setActiveDraft(payload.draftId);
          if (requestId) {
            this.postRequestMessage(command, requestId, draft);
          }
          break;
        }

        case "switchToRevision": {
          await DraftService.switchToRevision(
            payload.draftId,
            payload.revisionId,
          );
          break;
        }

        case "deleteDraft": {
          await DraftService.deleteDraft(payload.draftId);
          break;
        }

        case "exportDraft": {
          await DraftService.exportDraft(payload.draftId);
          break;
        }
      }
    } catch (error) {
      console.error("Error in message listener:", error);
      this.postMessage("error", {
        message: error instanceof Error ? error.message : "An error occurred",
      });
    }
  }

  public static postMessage(command: string, payload?: any) {
    if (this.isDisposed) {
      return;
    }

    this.webview?.webview.postMessage({
      command,
      payload,
    } as MessageHandlerData<any>);
  }

  public static postRequestMessage(
    command: string,
    requestId: string,
    payload: any,
  ) {
    if (this.isDisposed) {
      return;
    }

    this.webview?.webview.postMessage({
      command,
      requestId,
      payload,
    } as MessageHandlerData<any>);
  }

  public static close() {
    this.webview?.dispose();
  }

  private static _getHtmlForWebview(
    webview: vscode.Webview,
    extensionUri: vscode.Uri,
  ): string {
    if (this.isProductionMode) {
      // PRODUCTION MODE
      const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(
          extensionUri,
          "out",
          "webview",
          "assets",
          "index.js",
        ),
      );
      const styleUri = webview.asWebviewUri(
        vscode.Uri.joinPath(
          extensionUri,
          "out",
          "webview",
          "assets",
          "index.css",
        ),
      );

      // Use a nonce to only allow specific scripts to be run
      const nonce = this.getNonce();

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet">
  <title>Ghostwriter</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    } else {
      // DEVELOPMENT MODE - Enable HMR with Vite dev server
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <script type="module">
    import RefreshRuntime from "http://localhost:5173/@react-refresh"
    RefreshRuntime.injectIntoGlobalHook(window)
    window.$RefreshReg$ = () => {}
    window.$RefreshSig$ = () => (type) => type
    window.__vite_plugin_react_preamble_installed__ = true
  </script>

  <script type="module" src="http://localhost:5173/@vite/client"></script>

  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ghostwriter</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="http://localhost:5173/src/main.tsx"></script>
</body>
</html>`;
    }
  }

  private static getNonce(): string {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
