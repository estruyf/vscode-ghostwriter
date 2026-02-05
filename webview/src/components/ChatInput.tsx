import { useState, useRef, useEffect } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { ImageAttachment } from '../types';
import { messageHandler } from '@estruyf/vscode/dist/client';

interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onSubmit: (e: React.FormEvent, images?: ImageAttachment[]) => void;
  isSending: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

/**
 * Chat input component
 * Textarea for user input with send button
 * Supports Shift+Enter for new lines, Enter to send
 * Supports image attachments via file selection or clipboard paste
 * Resizable from the top border
 */
export default function ChatInput({
  inputValue,
  setInputValue,
  onSubmit,
  isSending,
  textareaRef,
}: ChatInputProps) {
  const [height, setHeight] = useState(140);
  const isResizing = useRef(false);
  const [attachedImages, setAttachedImages] = useState<ImageAttachment[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;

      const newHeight = window.innerHeight - e.clientY;
      const maxHeight = window.innerHeight - 100; // Keep some space for header

      if (newHeight >= 140 && newHeight <= maxHeight) {
        setHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Handle paste events for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await handleImageFile(file);
          }
        }
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('paste', handlePaste as any);
    }

    return () => {
      if (textarea) {
        textarea.removeEventListener('paste', handlePaste as any);
      }
    };
  }, [textareaRef]);

  const handleImageFile = async (file: File) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      console.warn('Unsupported image type:', file.type);
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.warn('Image too large. Max size is 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        const imageAttachment: ImageAttachment = {
          data: dataUrl,
          mimeType: file.type,
          name: file.name,
          width: img.width,
          height: img.height,
        };

        setAttachedImages(prev => [...prev, imageAttachment]);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = async () => {
    try {
      const response = await messageHandler.request<{
        data: string;
        mimeType: string;
        name: string;
      }>('selectImageFile');

      if (response) {
        const imageAttachment: ImageAttachment = {
          data: response.data,
          mimeType: response.mimeType,
          name: response.name,
        };

        setAttachedImages(prev => [...prev, imageAttachment]);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e, attachedImages.length > 0 ? attachedImages : undefined);
    setAttachedImages([]); // Clear images after sending
  };

  return (
    <div
      className="relative bg-slate-900 px-6 py-4 border-t border-slate-700 flex flex-col"
      style={{ height: `${height}px`, minHeight: attachedImages.length > 0 ? '240px' : '140px' }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1.5 -mt-0.5 cursor-ns-resize z-50 hover:bg-purple-500/50 transition-colors"
        onMouseDown={(e) => {
          isResizing.current = true;
          document.body.style.cursor = 'ns-resize';
          e.preventDefault();
        }}
        title="Drag to resize"
      />

      <form onSubmit={handleSubmit} className="space-y-2 flex-1 flex flex-col h-full">
        {/* Image previews */}
        {attachedImages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto p-2">
            {attachedImages.map((image, idx) => (
              <div key={idx} className="relative group shrink-0">
                <img
                  src={image.data}
                  alt={image.name || `Preview ${idx + 1}`}
                  className="h-20 w-20 object-cover rounded border border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:cursor-pointer"
                  title="Remove image"
                >
                  <X size={14} />
                </button>
                {image.name && (
                  <p className="text-xs text-slate-400 mt-1 truncate w-20" title={image.name}>
                    {image.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as any);
            }
          }}
          placeholder="Type your answer (or 'stop' to end)... Shift+Enter for new line. Paste images directly or click the image button."
          disabled={isSending}
          className="w-full flex-1 min-h-24 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50 resize-none"
        />
        <div className="flex justify-between items-center shrink-0">
          <p className="text-sm text-slate-500">Type "stop" or "done" when you want to end the interview.</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleImageSelect}
              disabled={isSending}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center gap-2 hover:cursor-pointer"
              title="Attach image"
            >
              <ImagePlus size={18} />
              <span className="text-sm">Image</span>
            </button>
            <button
              type="submit"
              disabled={isSending || (!inputValue.trim() && attachedImages.length === 0)}
              className="px-6 py-2 bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all hover:cursor-pointer"
            >
              Send
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
