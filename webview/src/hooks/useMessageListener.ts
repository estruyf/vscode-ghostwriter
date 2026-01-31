import { useEffect } from "react";

type MessageHandler = (payload: any) => void;

/**
 * Custom hook for handling VS Code webview messages
 * Encapsulates the message listener setup and cleanup logic
 *
 * @param handlers - Object mapping command names to handler functions
 *
 * @example
 * useMessageListener({
 *   'interviewMessage': (payload) => {
 *     setMessages(prev => [...prev, payload]);
 *   },
 *   'interviewComplete': () => {
 *     setStatus('complete');
 *   },
 * });
 */
export function useMessageListener(handlers: Record<string, MessageHandler>) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { command, payload } = event.data;
      handlers[command]?.(payload);
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handlers]);
}
