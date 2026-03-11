import { useState, useEffect } from 'react';
import { Home, MessagesSquare, Signature, Sparkles, FileEdit } from 'lucide-react';
import { messageHandler, Messenger } from '@estruyf/vscode/dist/client';
import HomePage from './components/views/HomePage';
import InterviewView from './components/views/InterviewView';
import WriterView from './components/views/WriterView';
import VoiceGeneratorView from './components/views/VoiceGeneratorView';
import DraftsView from './components/views/DraftsView';

type Page = 'home' | 'interview' | 'writer' | 'voice-generator' | 'drafts';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (e.detail && e.detail.page) {
        handleNavigation(e.detail.page);
      }
    };
    window.addEventListener('navigate', handleNavigate);
    return () => {
      window.removeEventListener('navigate', handleNavigate);
    };
  }, []);

  useEffect(() => {
    messageHandler.send('appReady');

    const handleBackendMessage = (event: MessageEvent) => {
      const command = event.data?.command;
      const page = event.data?.payload?.page as Page | undefined;

      if (command === 'navigateToPage' && page) {
        handleNavigation(page);
      }
    };

    Messenger.listen(handleBackendMessage);
    return () => {
      Messenger.unlisten(handleBackendMessage);
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Navigation Bar */}
      {
        currentPage !== 'home' && (
          <div className="flex border-b border-slate-800 bg-slate-950/50 pt-2 pb-1 justify-center shrink-0 z-10">
            <div className="flex space-x-1 sm:space-x-2 bg-slate-950/50 p-1  overflow-x-auto max-w-full no-scrollbar">
              <button
                onClick={() => handleNavigation('home')}
                className={`flex items-center px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-colors hover:cursor-pointer whitespace-nowrap text-slate-400 hover:text-slate-200 hover:bg-slate-800/50`}
                title="Home"
              >
                <Home className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Home</span>
              </button>
              <button
                onClick={() => handleNavigation('interview')}
                className={`flex items-center px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-colors hover:cursor-pointer whitespace-nowrap ${currentPage === 'interview' ? 'bg-purple-500/20 text-purple-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                title="Interview"
              >
                <MessagesSquare className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Interview</span>
              </button>
              <button
                onClick={() => handleNavigation('voice-generator')}
                className={`flex items-center px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-colors hover:cursor-pointer whitespace-nowrap ${currentPage === 'voice-generator' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                title="Voice Profile"
              >
                <Sparkles className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Voice Profile</span>
              </button>
              <button
                onClick={() => handleNavigation('writer')}
                className={`flex items-center px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-colors hover:cursor-pointer whitespace-nowrap ${currentPage === 'writer' ? 'bg-amber-500/20 text-amber-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                title="Write Article"
              >
                <Signature className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Write Article</span>
              </button>
              <button
                onClick={() => handleNavigation('drafts')}
                className={`flex items-center px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-colors hover:cursor-pointer whitespace-nowrap ${currentPage === 'drafts' ? 'bg-emerald-500/20 text-emerald-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                title="Drafts"
              >
                <FileEdit className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Drafts</span>
              </button>
            </div>
          </div>
        )
      }

      <div className="flex-1 min-h-0 relative">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'interview' && (
          <InterviewView onBack={() => handleNavigation('home')} />
        )}
        {currentPage === 'writer' && (
          <WriterView onBack={() => handleNavigation('home')} />
        )}
        {currentPage === 'voice-generator' && (
          <VoiceGeneratorView onBack={() => handleNavigation('home')} />
        )}
        {currentPage === 'drafts' && (
          <DraftsView onBack={() => handleNavigation('home')} />
        )}
      </div>
    </div>
  );
}

export default App;
