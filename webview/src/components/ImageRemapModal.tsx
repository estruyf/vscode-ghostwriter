import { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { messageHandler } from '@estruyf/vscode/dist/client';

interface ImageRemapModalProps {
  isOpen: boolean;
  onConfirm: (data: { imageProductionPath: string }) => void;
  onCancel: () => void;
  confirmButtonText?: string;
  title?: string;
}

export default function ImageRemapModal({
  isOpen,
  onConfirm,
  onCancel,
  confirmButtonText = 'Save Article',
  title = 'Image Link Remapping',
}: ImageRemapModalProps) {
  const [imageTargetFolder, setImageTargetFolder] = useState<string>('');
  const [imageProductionPath, setImageProductionPath] = useState('');

  const handleConfirm = useCallback(() => {
    // Save the imageProductionPath to state
    messageHandler.send('setImageProductionPath', { path: imageProductionPath });
    onConfirm({ imageProductionPath });
  }, [imageProductionPath, onConfirm]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  useEffect(() => {
    // Load the attachment folder
    messageHandler.request<string>('getAttachmentFolder').then((folderPath) => {
      if (folderPath) {
        setImageTargetFolder(folderPath);
      }
    }).catch((error) => {
      console.error('Error selecting image target folder:', error);
    });

    // Load the saved imageProductionPath
    messageHandler.request<string>('getImageProductionPath').then((path) => {
      if (path) {
        setImageProductionPath(path);
      }
    }).catch((error) => {
      console.error('Error loading image production path:', error);
    });
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-200 transition-colors hover:cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-300">
            Configure how image links should be remapped in your final article.
          </p>

          {imageTargetFolder && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-1">
                Image Storage Folder
              </p>
              <p className="text-sm text-blue-200 font-mono">{imageTargetFolder}</p>
            </div>
          )}

          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-semibold text-slate-300 mb-2 block">
                Production Image Path
              </span>
              <p className="text-sm text-slate-400 mb-3">
                The path where images will be served in your final blog/article.
                Leave empty to use relative paths from the article location.
              </p>
              <input
                type="text"
                value={imageProductionPath}
                onChange={(e) => setImageProductionPath(e.target.value)}
                placeholder="/uploads/2026/02"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
              />
              <p className="text-sm text-slate-500 mt-2 leading-loose">
                Example: <code className="bg-slate-800 px-2 py-1 rounded">/uploads/2026/</code> will transform
                image links like <code className="bg-slate-800 px-2 py-1 rounded">{imageTargetFolder || "public/uploads/2026"}/image.jpg</code> to <code className="bg-slate-800 px-2 py-1 rounded">/uploads/2026/02/image.jpg</code>
              </p>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-700">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors hover:cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-lg transition-colors hover:cursor-pointer"
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
