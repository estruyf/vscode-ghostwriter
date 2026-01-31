import * as vscode from "vscode";
import { GhostwriterViewProvider } from "./providers/GhostwriterViewProvider";
import { StateService } from "./services/StateService";
import { PromptConfigService } from "./services/PromptConfigService";

export function activate(context: vscode.ExtensionContext) {
  console.log("Ghostwriter extension is now active!");

  // Initialize state services
  StateService.initialize(context);
  PromptConfigService.initialize(context);

  // Set the extension context for the provider
  GhostwriterViewProvider.setExtensionContext(context);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-ghostwriter.openView", () => {
      GhostwriterViewProvider.create(context.extensionUri);
    }),
  );
}

export function deactivate() {
  GhostwriterViewProvider.close();
}
