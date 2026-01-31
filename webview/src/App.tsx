import { useState } from 'react';
import HomePage from './components/HomePage';
import InterviewView from './components/InterviewView';
import WriterView from './components/WriterView';
import VoiceGeneratorView from './components/VoiceGeneratorView';
import DraftsView from './components/DraftsView';

type Page = 'home' | 'interview' | 'writer' | 'voice-generator' | 'drafts';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100">
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

      {/* Listen for navigation events */}
      {currentPage === 'home' &&
        typeof window !== 'undefined' &&
        (() => {
          const handleNavigate = (e: any) => {
            handleNavigation(e.detail.page);
          };
          window.addEventListener('navigate', handleNavigate);
          return null;
        })()}
    </div>
  );
}

export default App;
