import { useState } from 'react';
import { ViewMode, VSCodeAPI } from './types';
import InterviewView from './components/InterviewView';
import WriterView from './components/WriterView';

declare const acquireVsCodeApi: () => VSCodeAPI;

const vscode = acquireVsCodeApi();

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('interview');

  return (
    <div className="h-screen flex flex-col bg-vscode-background text-vscode-foreground">
      <div className="flex border-b border-vscode-border">
        <button
          onClick={() => setViewMode('interview')}
          className={`flex-1 px-4 py-3 font-medium ${
            viewMode === 'interview'
              ? 'bg-vscode-button text-white'
              : 'hover:bg-vscode-input'
          }`}
        >
          Interview
        </button>
        <button
          onClick={() => setViewMode('writer')}
          className={`flex-1 px-4 py-3 font-medium ${
            viewMode === 'writer'
              ? 'bg-vscode-button text-white'
              : 'hover:bg-vscode-input'
          }`}
        >
          Writer
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {viewMode === 'interview' ? (
          <InterviewView vscode={vscode} />
        ) : (
          <WriterView vscode={vscode} />
        )}
      </div>
    </div>
  );
}

export default App;
