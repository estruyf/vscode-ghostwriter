import * as vscode from "vscode";

interface AppState {
  selectedModelId?: string;
  frontmatterTemplate?: string;
}

export class StateService {
  private static context: vscode.ExtensionContext;
  private static readonly STATE_KEY = "ghostwriter.appState";

  public static initialize(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Get the current app state
   */
  public static getState(): AppState {
    return this.context.workspaceState.get<AppState>(this.STATE_KEY) || {};
  }

  /**
   * Get the selected model ID
   */
  public static getSelectedModelId(): string | undefined {
    const state = this.getState();
    return state.selectedModelId;
  }

  /**
   * Set the selected model ID
   */
  public static async setSelectedModelId(
    modelId: string | undefined,
  ): Promise<void> {
    const state = this.getState();
    await this.context.workspaceState.update(this.STATE_KEY, {
      ...state,
      selectedModelId: modelId,
    });
  }

  /**
   * Get the frontmatter template
   */
  public static getFrontmatterTemplate(): string | undefined {
    const state = this.getState();
    return state.frontmatterTemplate;
  }

  /**
   * Set the frontmatter template
   */
  public static async setFrontmatterTemplate(
    template: string | undefined,
  ): Promise<void> {
    const state = this.getState();
    await this.context.workspaceState.update(this.STATE_KEY, {
      ...state,
      frontmatterTemplate: template,
    });
  }

  /**
   * Clear all state
   */
  public static async clearState() {
    await this.context.workspaceState.update(this.STATE_KEY, undefined);
  }
}
