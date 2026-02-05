import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { FileService } from "./FileService";

export class ImageService {
  private static readonly SUPPORTED_IMAGE_TYPES = [
    { label: "PNG Images", extensions: ["png"] },
    { label: "JPEG Images", extensions: ["jpg", "jpeg"] },
    { label: "GIF Images", extensions: ["gif"] },
    { label: "WebP Images", extensions: ["webp"] },
    { label: "All Images", extensions: ["png", "jpg", "jpeg", "gif", "webp"] },
  ];

  /**
   * Opens a file picker for selecting an image file
   * @returns Object containing base64 data, mime type, and filename
   */
  public static async selectImageFile(): Promise<
    | {
        data: string;
        mimeType: string;
        name: string;
      }
    | undefined
  > {
    try {
      const fileUri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: "Select Image",
        filters: {
          Images: ["png", "jpg", "jpeg", "gif", "webp"],
        },
      });

      if (!fileUri || fileUri.length === 0) {
        return undefined;
      }

      const filePath = fileUri[0].fsPath;
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath).toLowerCase().slice(1);

      // Read file and convert to base64
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString("base64");

      // Determine MIME type
      const mimeType = this.getMimeType(fileExtension);

      // Create data URI
      const dataUri = `data:${mimeType};base64,${base64Data}`;

      return {
        data: dataUri,
        mimeType,
        name: fileName,
      };
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to load image: ${(error as Error).message}`,
      );
      return undefined;
    }
  }

  /**
   * Gets the MIME type for a given file extension
   * @param extension - File extension without the dot
   * @returns MIME type string
   */
  private static getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
    };

    return mimeTypes[extension] || "image/png";
  }

  /**
   * Validates image file size
   * @param filePath - Path to the image file
   * @param maxSizeInMB - Maximum file size in megabytes (default: 5MB)
   * @returns True if file size is valid
   */
  public static validateImageSize(
    filePath: string,
    maxSizeInMB: number = 5,
  ): boolean {
    try {
      const stats = fs.statSync(filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      return fileSizeInMB <= maxSizeInMB;
    } catch {
      return false;
    }
  }

  /**
   * Save image attachments to disk and return their file paths
   * @param images - Array of image attachments with base64 data
   * @returns Array of saved image file paths (absolute paths)
   */
  public static async saveImageAttachments(
    images: Array<{ data: string; mimeType: string; name?: string }>,
  ): Promise<string[]> {
    const savedPaths: string[] = [];

    for (const image of images) {
      try {
        const savedPath = await FileService.saveImage(image.data, image.name);
        if (savedPath) {
          savedPaths.push(savedPath);
        }
      } catch (error) {
        console.error("Error saving image attachment:", error);
      }
    }

    return savedPaths;
  }

  /**
   * Read an image file and convert to base64 data URI
   * @param filePath - Absolute path to the image file
   * @returns Object with base64 data URI, mime type, and filename
   */
  public static async readImageFile(filePath: string): Promise<
    | {
        data: string;
        mimeType: string;
        name: string;
      }
    | undefined
  > {
    try {
      if (!fs.existsSync(filePath)) {
        return undefined;
      }

      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath).toLowerCase().slice(1);

      // Read file and convert to base64
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString("base64");

      // Determine MIME type
      const mimeType = this.getMimeType(fileExtension);

      // Create data URI
      const dataUri = `data:${mimeType};base64,${base64Data}`;

      return {
        data: dataUri,
        mimeType,
        name: fileName,
      };
    } catch (error) {
      console.error(`Error reading image file ${filePath}:`, error);
      return undefined;
    }
  }
}
