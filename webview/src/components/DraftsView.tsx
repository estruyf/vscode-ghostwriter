import { useState, useEffect, useCallback } from 'react';
import { messageHandler } from '@estruyf/vscode/dist/client';
import { Draft } from '../types';
import { FileEdit, Trash2, Clock } from 'lucide-react';
import DraftIterationView from './DraftIterationView';

interface DraftsViewProps {
  onBack: () => void;
}

export default function DraftsView({ onBack }: DraftsViewProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDraft, setActiveDraft] = useState<Draft | null>(null);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const allDrafts = await messageHandler.request<Draft[]>('getAllDrafts');
      setDrafts(allDrafts || []);
    } catch (error) {
      console.error('Failed to load drafts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenDraft = useCallback(async (draft: Draft) => {
    try {
      const loadedDraft = await messageHandler.request<Draft>('setActiveDraft', {
        draftId: draft.id,
      });
      if (loadedDraft) {
        setActiveDraft(loadedDraft);
      }
    } catch (error) {
      console.error('Failed to open draft:', error);
      alert('Failed to open draft');
    }
  }, []);

  const handleDeleteDraft = useCallback(async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const confirmed = confirm('Are you sure you want to delete this draft? This cannot be undone.');
    if (!confirmed) return;

    try {
      await messageHandler.send('deleteDraft', { draftId });
      setDrafts(drafts.filter(d => d.id !== draftId));
    } catch (error) {
      console.error('Failed to delete draft:', error);
      alert('Failed to delete draft');
    }
  }, [drafts]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (activeDraft) {
    return (
      <DraftIterationView
        draft={activeDraft}
        onBack={() => {
          setActiveDraft(null);
          loadDrafts();
        }}
        onClose={() => {
          setActiveDraft(null);
          loadDrafts();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-200 transition-colors hover:cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">My Drafts</h2>
            <p className="text-base text-slate-400">Continue working on your drafts</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-12">
              <FileEdit className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No drafts yet</h3>
              <p className="text-slate-500">
                Create your first draft by generating an article in Writer mode and clicking "Iterate Draft"
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {drafts.map((draft) => {
                const currentRevision = draft.revisions.find(r => r.id === draft.currentRevisionId);
                const preview = currentRevision?.content.substring(0, 200) || '';
                
                return (
                  <button
                    key={draft.id}
                    onClick={() => handleOpenDraft(draft)}
                    className="text-left p-6 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                          <FileEdit className="w-5 h-5 text-purple-400" />
                          {draft.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(draft.updatedAt)}
                          </span>
                          <span>
                            {draft.revisions.length} revision{draft.revisions.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteDraft(draft.id, e)}
                        className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-all"
                        title="Delete draft"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-2">
                      {preview}...
                    </p>
                    {currentRevision?.prompt && (
                      <div className="mt-3 pt-3 border-t border-slate-800">
                        <p className="text-xs text-slate-500">
                          Last refinement: <span className="text-slate-400">"{currentRevision.prompt}"</span>
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
