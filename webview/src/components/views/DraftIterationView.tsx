import { useState, useEffect, useRef, useCallback } from 'react';
import { messageHandler } from '@estruyf/vscode/dist/client';
import { Draft } from '../../types';
import { History, Save, FileText, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useDialog } from '../../hooks/useDialog';
import ConfirmDialog from '../ConfirmDialog';
import ImageRemapModal from '../ImageRemapModal';
import { VisitorBadge } from '../VisitorBadge';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { parseContent } from '../../utils/markdown';

interface DraftIterationViewProps {
  draft: Draft;
  onBack: () => void;
  onClose: () => void;
}

export default function DraftIterationView({ draft: initialDraft, onBack, onClose }: DraftIterationViewProps) {
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [showRemapModal, setShowRemapModal] = useState(false);
  const deleteDialog = useDialog();
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentRevision = draft.revisions.find(r => r.id === draft.currentRevisionId);
  const currentRevisionIndex = draft.revisions.findIndex(r => r.id === draft.currentRevisionId);
  const canGoBack = currentRevisionIndex > 0;
  const canGoForward = currentRevisionIndex < draft.revisions.length - 1;

  // Auto-scroll to bottom when streaming
  useEffect(() => {
    if (contentRef.current && streamingContent) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamingContent]);

  // Handle messages from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === 'draftRefinementStream') {
        if (message.payload?.chunk) {
          setStreamingContent((prev) => prev + message.payload.chunk);
        }
      } else if (message.command === 'draftRefinementComplete') {
        setIsRefining(false);
        setStreamingContent('');
        setRefinementPrompt('');
        if (message.payload?.draft) {
          setDraft(message.payload.draft);
        }
      } else if (message.command === 'draftRevisionSwitched') {
        if (message.payload?.draft) {
          setDraft(message.payload.draft);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleRefinement = useCallback(() => {
    if (!refinementPrompt.trim() || isRefining) return;

    setIsRefining(true);
    setStreamingContent('');
    setRefinementPrompt('');

    messageHandler.send('refineDraft', {
      draftId: draft.id,
      refinementPrompt: refinementPrompt.trim(),
      modelId: selectedModelId,
    });
  }, [draft.id, refinementPrompt, selectedModelId, isRefining]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleRefinement();
    }
  }, [handleRefinement]);

  const switchRevision = useCallback((revisionId: string) => {
    messageHandler.send('switchToRevision', {
      draftId: draft.id,
      revisionId,
    });
  }, [draft.id]);

  const goToPreviousRevision = useCallback(() => {
    if (canGoBack) {
      const prevRevision = draft.revisions[currentRevisionIndex - 1];
      switchRevision(prevRevision.id);
    }
  }, [canGoBack, currentRevisionIndex, draft.revisions, switchRevision]);

  const goToNextRevision = useCallback(() => {
    if (canGoForward) {
      const nextRevision = draft.revisions[currentRevisionIndex + 1];
      switchRevision(nextRevision.id);
    }
  }, [canGoForward, currentRevisionIndex, draft.revisions, switchRevision]);

  const handleExportDraft = useCallback((imageProductionPath: string) => {
    messageHandler.send('exportDraft', {
      draftId: draft.id,
      imageProductionPath: imageProductionPath || undefined,
    });
    setShowRemapModal(false);
  }, [draft.id]);

  const handleExport = useCallback(async () => {
    // Check if content has images (markdown image syntax)
    const content = currentRevision?.content || '';
    const hasImages = /!\[([^\]]*)\]\(([^)]+)\)/g.test(content);

    if (hasImages) {
      setShowRemapModal(true);
    } else {
      // No images, export directly
      handleExportDraft('');
    }
  }, [currentRevision, handleExportDraft]);

  const handleDeleteClick = useCallback(() => {
    deleteDialog.open();
  }, [deleteDialog]);

  const handleDeleteConfirm = useCallback(() => {
    messageHandler.send('deleteDraft', { draftId: draft.id });
    deleteDialog.close();
    onClose();
  }, [draft.id, deleteDialog, onClose]);

  const displayContent = isRefining && streamingContent ? streamingContent : currentRevision?.content || '';

  const { frontmatter, markdown: markdownContent } = parseContent(displayContent);

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-200 transition-colors hover:cursor-pointer"
            title="Back to Writer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">{draft.title}</h2>
            <p className="text-sm text-slate-400">
              Draft Iteration Mode • Revision {currentRevisionIndex + 1} of {draft.revisions.length}
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {/* Navigation buttons */}
          <button
            onClick={goToPreviousRevision}
            disabled={!canGoBack}
            className="p-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:cursor-pointer"
            title="Previous revision"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNextRevision}
            disabled={!canGoForward}
            className="p-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:cursor-pointer"
            title="Next revision"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* History button */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-lg transition-all ${showHistory ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'} hover:cursor-pointer`}
            title="View revision history"
          >
            <History className="w-5 h-5" />
          </button>

          {/* Export button */}
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all flex items-center gap-2 hover:cursor-pointer"
            title="Export as Markdown"
          >
            <Save className="w-4 h-4" />
            Save Article
          </button>

          {/* Delete button */}
          <button
            onClick={handleDeleteClick}
            className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-all hover:cursor-pointer"
            title="Delete draft"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Content Display */}
          <div className="flex-1 overflow-y-auto p-6" ref={contentRef}>
            <div className="max-w-4xl mx-auto">
              {frontmatter && (
                <div className="mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Frontmatter</h3>
                  <pre className="text-sm text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap">
                    {frontmatter}
                  </pre>
                </div>
              )}

              <MarkdownRenderer
                content={markdownContent}
              />
            </div>
          </div>

          {/* Refinement Input */}
          <div className="border-t border-slate-700 bg-slate-900/50 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <textarea
                  ref={inputRef}
                  value={refinementPrompt}
                  onChange={(e) => setRefinementPrompt(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Refine your draft... (e.g., 'Make the intro more engaging', 'Add more technical depth to section 3')"
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                  rows={2}
                  disabled={isRefining}
                />
                <button
                  onClick={handleRefinement}
                  disabled={!refinementPrompt.trim() || isRefining}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
                >
                  {isRefining ? 'Refining...' : 'Refine'}
                </button>
              </div>
              {currentRevision?.prompt && (
                <p className="mt-2 text-sm text-slate-500">
                  Last refinement: "{currentRevision.prompt}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Revision History Sidebar */}
        {showHistory && (
          <div className="w-80 border-l border-slate-700 bg-slate-900 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Revision History
              </h3>
              <div className="space-y-2">
                {draft.revisions.slice().reverse().map((revision, idx) => {
                  const revisionIndex = draft.revisions.length - 1 - idx;
                  const isCurrent = revision.id === draft.currentRevisionId;
                  const date = new Date(revision.timestamp);

                  return (
                    <button
                      key={revision.id}
                      onClick={() => !isCurrent && switchRevision(revision.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${isCurrent
                        ? 'bg-purple-600/20 border-2 border-purple-500'
                        : 'bg-slate-800 hover:bg-slate-700 border-2 border-transparent'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className={`text-sm font-semibold ${isCurrent ? 'text-purple-300' : 'text-slate-300'}`}>
                          Revision {revisionIndex + 1}
                          {isCurrent && ' (Current)'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {revision.prompt && (
                        <p className="text-xs text-slate-400 line-clamp-2">
                          "{revision.prompt}"
                        </p>
                      )}
                      {!revision.prompt && revisionIndex === 0 && (
                        <p className="text-xs text-slate-500 italic">
                          Initial version
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Remap Modal */}
      <ImageRemapModal
        isOpen={showRemapModal}
        onConfirm={(data) => handleExportDraft(data.imageProductionPath)}
        onCancel={() => setShowRemapModal(false)}
        confirmButtonText="Export Draft"
        title="Image Link Remapping"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Draft"
        message="Are you sure you want to delete this draft? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={deleteDialog.close}
      />
      <VisitorBadge viewType="draft-iteration" />
    </div>
  );
}
