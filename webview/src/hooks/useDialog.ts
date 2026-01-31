import { useState, useCallback } from "react";

export interface DialogState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Custom hook for managing dialog/modal state
 * Reduces boilerplate for open/close state management
 *
 * @param initialState - Initial open state (default: false)
 * @returns Dialog state object with open, close, and toggle methods
 *
 * @example
 * const dialog = useDialog();
 * return (
 *   <>
 *     <button onClick={dialog.open}>Open</button>
 *     {dialog.isOpen && <Modal onClose={dialog.close} />}
 *   </>
 * );
 */
export function useDialog(initialState = false): DialogState {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}
