import { useState } from 'react';
import { messageHandler } from '@estruyf/vscode/dist/client';

export default function InterviewView() {
  const [topic, setTopic] = useState('');
  const [isStarted, setIsStarted] = useState(false);

  const startInterview = () => {
    if (!topic.trim()) {
      return;
    }
    
    messageHandler.send('startInterview', { topic });
    
    setIsStarted(true);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Start New Interview</h1>
      <p className="mb-6 opacity-80">
        Begin a new interview session. The transcript will be saved in the .ghostwriter folder.
      </p>
      
      {!isStarted ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="topic" className="block mb-2 font-medium">
              Interview Topic
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 bg-vscode-input border border-vscode-border rounded focus:outline-none focus:ring-2 focus:ring-vscode-button"
              placeholder="Enter the topic for your interview..."
            />
          </div>
          
          <button
            onClick={startInterview}
            disabled={!topic.trim()}
            className="px-4 py-2 bg-vscode-button hover:bg-vscode-button-hover text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Interview
          </button>
        </div>
      ) : (
        <div className="bg-vscode-input p-4 rounded border border-vscode-border">
          <h2 className="font-medium mb-2">Interview in Progress</h2>
          <p className="opacity-80">Topic: {topic}</p>
          <p className="mt-4 text-sm opacity-60">
            The interview session has been started. The transcript will be saved to your .ghostwriter folder.
          </p>
        </div>
      )}
    </div>
  );
}
