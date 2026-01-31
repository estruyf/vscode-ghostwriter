import { useState, useCallback } from "react";
import { messageHandler } from "@estruyf/vscode/dist/client";

export interface FileSelectionState {
  selectedFile: string;
  setSelectedFile: (file: string) => void;
  selectFile: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Custom hook for file selection via VS Code file picker
 * Handles the request, loading state, and error handling
 *
 * @param messageType - The message type to send to the extension (e.g., 'selectCustomTranscript')
 * @returns File selection state with selectedFile, setSelectedFile, selectFile method, and isLoading flag
 *
 * @example
 * const transcript = useFileSelection('selectCustomTranscript');
 * return (
 *   <>
 *     <button onClick={transcript.selectFile} disabled={transcript.isLoading}>
 *       Browse...
 *     </button>
 *     {transcript.selectedFile && <p>Selected: {transcript.selectedFile}</p>}
 *   </>
 * );
 */
export function useFileSelection(messageType: string): FileSelectionState {
  const [selectedFile, setSelectedFile] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const selectFile = useCallback(async () => {
    setIsLoading(true);
    try {
      const file = await messageHandler.request<string>(messageType);
      if (file) {
        setSelectedFile(file);
      }
    } catch (error) {
      console.error(`Error selecting file (${messageType}):`, error);
    } finally {
      setIsLoading(false);
    }
  }, [messageType]);

  return { selectedFile, setSelectedFile, selectFile, isLoading };
}
