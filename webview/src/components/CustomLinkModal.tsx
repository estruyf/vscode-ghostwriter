import { LinkSafetyModalProps } from "streamdown";
import { ExternalLink, ShieldAlert } from "lucide-react";

export function CustomLinkModal({ url, isOpen, onClose, onConfirm }: LinkSafetyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-xl bg-card border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-full">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
          </div>
          <h3 id="modal-title" className="text-xl font-semibold text-card-foreground">External Link</h3>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-base text-muted-foreground leading-relaxed">
            You are about to navigate to an external website. This link will open in your default browser.
          </p>

          <div className="p-3 rounded-md bg-muted/50 border border-border break-all group relative">
            <code className="text-sm text-primary font-mono">{url}</code>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3 justify-end items-center bg-muted/20">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary text-secondary-foreground hover:opacity-80 font-medium rounded-lg transition-all hover:cursor-pointer text-sm"
          >
            Cancel
          </button>
          <a
            href={url}
            onClick={() => onConfirm()}
            className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 font-medium rounded-lg transition-all hover:cursor-pointer flex items-center gap-2 text-sm shadow-sm no-underline"
          >
            <span>Open Link</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}