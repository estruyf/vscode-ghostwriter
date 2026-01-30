import { useState, useEffect } from 'react';
import { messageHandler } from '@estruyf/vscode/dist/client';
import ModelSelector from './ModelSelector';

export default function VoiceGeneratorView({ onBack }: { onBack: () => void }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Handle messages from the extension
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === 'voiceGenerationComplete') {
        setStatus('complete');
        setIsGenerating(false);
      } else if (message.command === 'voiceGenerationFailed') {
        setStatus('error');
        setIsGenerating(false);
        setErrorMessage(message.payload?.error || 'Failed to generate voice profile');
      } else if (message.command === 'voiceGenerationCancelled') {
        setStatus('idle');
        setIsGenerating(false);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleGenerateVoice = () => {
    setIsGenerating(true);
    setStatus('generating');
    setErrorMessage('');

    // Send message to backend - it will handle the folder selection dialog
    messageHandler.send('generateVoice', {
      modelId: selectedModelId || undefined,
    });
  };

  const handleReset = () => {
    setStatus('idle');
    setErrorMessage('');
  };

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
          <div>
            <h2 className="text-lg font-semibold text-white">Generate Voice Profile</h2>
            <p className="text-sm text-slate-400">
              Analyze your writing to create a personalized voice profile
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          {status === 'idle' && (
            <div className="space-y-6">
              <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-6">
                <h3 className="text-xl font-semibold text-white mb-3">How It Works</h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  The voice generator will analyze your existing writing samples to understand your unique style, tone, and voice.
                  This creates a profile that can be used when generating future articles to maintain consistency.
                </p>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Select a folder containing your writing samples (blog posts, articles, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>AI analyzes your writing style, tone, and patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>A voice profile is automatically saved to <code className="px-2 py-0.5 bg-slate-800 rounded text-cyan-300">.ghostwriter/voices/</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Use the profile when writing articles to match your style</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Select AI Model</h3>
                <ModelSelector
                  value={selectedModelId}
                  onChange={setSelectedModelId}
                />
              </div>

              <button
                onClick={handleGenerateVoice}
                disabled={isGenerating}
                className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/50 hover:cursor-pointer"
              >
                {isGenerating ? 'Generating Voice Profile...' : 'Generate Voice Profile'}
              </button>

              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-amber-200">
                    <p className="font-semibold mb-1">Tip:</p>
                    <p>For best results, select a folder with at least 5-10 markdown files containing your writing. The AI will analyze up to 10 files.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === 'generating' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mt-6">Analyzing Your Writing...</h3>
              <p className="text-slate-400 mt-2 text-center max-w-md">
                This may take a moment. We're reading your content and identifying your unique voice patterns.
              </p>
            </div>
          )}

          {status === 'complete' && (
            <div className="space-y-6">
              <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">Voice Profile Generated!</h3>
                <p className="text-green-200">
                  Your voice profile has been created and saved. The file has been opened in the editor.
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Next Steps</h3>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Review the voice profile that's been opened in the editor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Customize the profile if needed to better capture your style</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Use it when generating articles to maintain your unique voice</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 bg-slate-700 text-slate-200 font-semibold rounded-xl hover:bg-slate-600 transition-all hover:cursor-pointer"
                >
                  Generate Another
                </button>
                <button
                  onClick={onBack}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all hover:cursor-pointer"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">Generation Failed</h3>
                <p className="text-red-200">
                  {errorMessage || 'An error occurred while generating the voice profile.'}
                </p>
              </div>

              <button
                onClick={handleReset}
                className="w-full px-6 py-3 bg-slate-700 text-slate-200 font-semibold rounded-xl hover:bg-slate-600 transition-all hover:cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
