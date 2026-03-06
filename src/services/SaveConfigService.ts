/**
 * SaveConfigService - Manages article save location and filename template configuration
 * Stores settings in VS Code workspace/global settings or extension state
 */

import * as vscode from "vscode";
import { StateService } from "./StateService";

export interface SaveConfig {
  defaultSaveLocation?: string; // Template for save path: e.g., "articles/{{year}}/{{month}}"
  filenameTemplate?: string; // Template for filename: e.g., "{{date|yyyy-MM-dd}}-{{slug}}.md"
  usePageBundle?: boolean; // When true, creates a slug-named folder with index.md
  moveImagesToPageBundle?: boolean; // When true, moves images into the page bundle folder
}

export class SaveConfigService {
  private static readonly SETTING_KEY = "vscode-ghostwriter";
  private static readonly SETTING_KEY_FILENAME_TEMPLATE = "filenameTemplate";
  private static readonly SETTING_KEY_DEFAULT_SAVE_LOCATION =
    "defaultSaveLocation";
  private static readonly SETTING_KEY_USE_PAGE_BUNDLE = "usePageBundle";
  private static readonly SETTING_KEY_MOVE_IMAGES_TO_PAGE_BUNDLE =
    "moveImagesToPageBundle";
  private static readonly DEFAULT_FILENAME_TEMPLATE = "{{slug}}.md";
  private static readonly DEFAULT_SAVE_LOCATION = "";
  private static readonly DEFAULT_USE_PAGE_BUNDLE = false;
  private static readonly DEFAULT_MOVE_IMAGES_TO_PAGE_BUNDLE = true;

  /**
   * Get the complete save configuration
   * Priority: workspace state > workspace settings > global settings > defaults
   */
  static getConfig(): SaveConfig {
    // Priority 1: Check workspace/global state (per-session overrides)
    const stateLocation = StateService.getDefaultSaveLocation();
    const stateFilenameTemplate = StateService.getFilenameTemplate();

    // Priority 2: Check VS Code settings
    const config = vscode.workspace.getConfiguration(this.SETTING_KEY);
    return {
      defaultSaveLocation:
        stateLocation !== undefined
          ? stateLocation
          : config.get<string>(this.SETTING_KEY_DEFAULT_SAVE_LOCATION) ||
            this.DEFAULT_SAVE_LOCATION,
      filenameTemplate:
        stateFilenameTemplate !== undefined
          ? stateFilenameTemplate
          : config.get<string>(this.SETTING_KEY_FILENAME_TEMPLATE) ||
            this.DEFAULT_FILENAME_TEMPLATE,
      usePageBundle:
        config.get<boolean>(this.SETTING_KEY_USE_PAGE_BUNDLE) ??
        this.DEFAULT_USE_PAGE_BUNDLE,
      moveImagesToPageBundle:
        config.get<boolean>(this.SETTING_KEY_MOVE_IMAGES_TO_PAGE_BUNDLE) ??
        this.DEFAULT_MOVE_IMAGES_TO_PAGE_BUNDLE,
    };
  }

  /**
   * Get only the filename format
   */
  static getFilenameTemplate(): string {
    return this.getConfig().filenameTemplate || this.DEFAULT_FILENAME_TEMPLATE;
  }

  /**
   * Get only the save location
   */
  static getDefaultSaveLocation(): string {
    return this.getConfig().defaultSaveLocation || this.DEFAULT_SAVE_LOCATION;
  }

  /**
   * Get whether page bundle mode is enabled
   */
  static getUsePageBundle(): boolean {
    return this.getConfig().usePageBundle ?? this.DEFAULT_USE_PAGE_BUNDLE;
  }

  /**
   * Get whether images should be moved into the page bundle
   */
  static getMoveImagesToPageBundle(): boolean {
    return (
      this.getConfig().moveImagesToPageBundle ??
      this.DEFAULT_MOVE_IMAGES_TO_PAGE_BUNDLE
    );
  }

  /**
   * Update save configuration (persists to workspace settings)
   */
  static async updateConfig(config: Partial<SaveConfig>): Promise<void> {
    const currentConfig = await vscode.workspace.getConfiguration(
      this.SETTING_KEY,
    );

    // Update individual settings
    if (config.filenameTemplate !== undefined) {
      await currentConfig.update(
        this.SETTING_KEY_FILENAME_TEMPLATE,
        config.filenameTemplate,
        vscode.ConfigurationTarget.Workspace,
      );
    }

    if (config.defaultSaveLocation !== undefined) {
      await currentConfig.update(
        this.SETTING_KEY_DEFAULT_SAVE_LOCATION,
        config.defaultSaveLocation,
        vscode.ConfigurationTarget.Workspace,
      );
    }

    if (config.usePageBundle !== undefined) {
      await currentConfig.update(
        this.SETTING_KEY_USE_PAGE_BUNDLE,
        config.usePageBundle,
        vscode.ConfigurationTarget.Workspace,
      );
    }

    if (config.moveImagesToPageBundle !== undefined) {
      await currentConfig.update(
        this.SETTING_KEY_MOVE_IMAGES_TO_PAGE_BUNDLE,
        config.moveImagesToPageBundle,
        vscode.ConfigurationTarget.Workspace,
      );
    }
  }

  /**
   * Save per-session override to state
   * Useful for remembering user's choice during current session
   */
  static async setStateConfig(config: SaveConfig): Promise<void> {
    await StateService.setDefaultSaveLocation(config.defaultSaveLocation);
    await StateService.setFilenameTemplate(config.filenameTemplate);
  }

  /**
   * Clear per-session override
   */
  static async clearStateConfig(): Promise<void> {
    await StateService.setDefaultSaveLocation(undefined);
    await StateService.setFilenameTemplate(undefined);
  }

  /**
   * Reset configuration to defaults
   */
  static async resetConfig(): Promise<void> {
    await this.updateConfig({
      defaultSaveLocation: this.DEFAULT_SAVE_LOCATION,
      filenameTemplate: this.DEFAULT_FILENAME_TEMPLATE,
      usePageBundle: this.DEFAULT_USE_PAGE_BUNDLE,
      moveImagesToPageBundle: this.DEFAULT_MOVE_IMAGES_TO_PAGE_BUNDLE,
    });
  }

  /**
   * Get default configuration
   */
  static getDefaults(): SaveConfig {
    return {
      defaultSaveLocation: this.DEFAULT_SAVE_LOCATION,
      filenameTemplate: this.DEFAULT_FILENAME_TEMPLATE,
      usePageBundle: this.DEFAULT_USE_PAGE_BUNDLE,
      moveImagesToPageBundle: this.DEFAULT_MOVE_IMAGES_TO_PAGE_BUNDLE,
    };
  }

  /**
   * Check if configuration is properly set up (not using defaults)
   */
  static isConfigured(): boolean {
    const config = this.getConfig();
    return !!(
      (config.defaultSaveLocation &&
        config.defaultSaveLocation !== this.DEFAULT_SAVE_LOCATION) ||
      (config.filenameTemplate &&
        config.filenameTemplate !== this.DEFAULT_FILENAME_TEMPLATE)
    );
  }
}
