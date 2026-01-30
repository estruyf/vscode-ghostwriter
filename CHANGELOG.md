# Change Log

All notable changes to the "vscode-ghostwriter" extension will be documented in
this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how
to structure this file.

## [0.0.1] - 2026-01-30

### Added

#### Interview Features
- AI-powered interview mode using GitHub Copilot Language Model API
- Interactive chat interface for conducting interviews
- Real-time AI question generation based on responses
- Auto-focus on input field after AI responds
- Automatic interview completion detection
- Model selector for choosing GitHub Copilot models (GPT-4o, GPT-4o mini, etc.)
- Formatted transcript generation and extraction from AI conversation
- Automatic transcript saving to `.ghostwriter/transcripts/` folder

#### Writer Features
- Advanced content generation from interview transcripts
- Model selection for content generation
- Transcript selection from workspace or custom file browser
- Voice file integration for consistent writing style
- Real-time streaming content generation
- Writing style options (Formal, Casual, Conversational)
- Automatic heading generation toggle
- SEO optimization toggle
- Keyword optimization for search engine visibility
- Frontmatter template support with YAML format
- Frontmatter template editor with save/clear functionality
- Direct file save to workspace with file picker
- Markdown rendering with code syntax highlighting

#### State Management
- Persistent model selection across sessions (workspace state)
- Persistent frontmatter templates (workspace state)
- State service for centralized state management

#### Development Features
- Hot Module Replacement (HMR) with Vite dev server
- React 18 with TypeScript
- Tailwind CSS 4 integration with @tailwindcss/vite plugin
- Webview panel architecture for main editor view
- Message handler for webview-extension communication
- Clean script for removing build artifacts

#### UI/UX Enhancements
- Modern dark theme with gradient accents
- Responsive layout with flex and grid
- Loading states with animated indicators
- Disabled states for contextual options
- Model selector component with persistence
- Collapsible frontmatter template editor
- Keyword preview in input field
- Voice file auto-selection when only one available

### Technical Details
- VS Code Language Model API integration
- Proper LanguageModelChatMessage usage with User/Assistant roles
- Streaming response handling with CancellationTokenSource
- File service for transcript and voice file management
- Interview service with conversation history
- Writer service with streaming and frontmatter support
- Copilot service with model selection by ID
- State service using VS Code workspace state API

### Fixed
- React StrictMode double-mount causing duplicate interview starts
  (hasStartedRef)
- Tailwind CSS 4 configuration with proper plugin setup
- HMR WebSocket connection for development
- Model selection fallback logic
- Writing options disabled when voice file selected (except keywords)

## [Unreleased]

### Planned
- Activity bar icon for quick access
- Sidebar view with quick actions
- Multi-language support
- Export options (PDF, HTML)
- Interview session history view