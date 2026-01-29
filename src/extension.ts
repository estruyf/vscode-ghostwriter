import * as vscode from "vscode";
import { GhostwriterViewProvider } from "./providers/GhostwriterViewProvider";
import { InterviewService } from "./services/InterviewService";
import { StateService } from "./services/StateService";

export function activate(context: vscode.ExtensionContext) {
  console.log("Ghostwriter extension is now active!");

  // Initialize state service
  StateService.initialize(context);

  // Set the extension context for the provider
  GhostwriterViewProvider.setExtensionContext(context);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-ghostwriter.openView", () => {
      GhostwriterViewProvider.create(context.extensionUri);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-ghostwriter.startInterview",
      async () => {
        await InterviewService.startInterview();
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-ghostwriter.startWriter",
      async () => {
        GhostwriterViewProvider.create(context.extensionUri);
      },
    ),
  );
}

export function deactivate() {
  GhostwriterViewProvider.close();
}
