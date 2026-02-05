# Visual Studio Code Ghostwriter - Codebase Instructions

## Project Overview

This is a VS Code extension that leverages the GitHub Copilot API (`vscode.lm`) to assist users in creating content.

- **Back-end**: TypeScript Extension Host (`src/`).
- **Front-end**: React Webview (`webview/src/`) built with Vite.
- **Styling**: Tailwind CSS v4.

## Architecture & Patterns

### 1. Service Layer (`src/services/`)

- **Pattern**: Use static methods for service logic (Singleton-like access).
- **Core Services**:
  - `CopilotService`: Wrapper around `vscode.lm` for AI interactions.
  - `StateService`: Manages persistence using `vscode.ExtensionContext` global/workspace state.
  - `AgentService`: Manages file-based agents located in `.ghostwriter/`.
  - `GhostwriterViewProvider`: The main bridge between VS Code and the Webview.

### 2. Webview Communication

- **Pattern**: Request/Response model via `postMessage`.
- **Frontend**: Use the `useMessageListener` hook in `webview/src/hooks/` to listen for backend events.
- **Backend**: Handle messages in `GhostwriterViewProvider.messageListener`.
- **Typing**: Use `MessageHandlerData` for typed payloads.

### 3. Agent System

- **Location**: Agents are Markdown files stored in `.ghostwriter/interviewer/` or `.ghostwriter/writer/`.
- **Format**: Markdown with YAML frontmatter (defining `name`, etc.).
- **Loading**: `AgentService` reads these files to configure AI behavior.

## Critical Workflows

### Build & Run

- **Watch Mode**: `npm run watch` (concurrently builds extension and webview).
- **Build**: `npm run build` (production build).
- **Diffing**: When changing `webview/src/types/index.ts`, ensure corresponding usage in backend is updated.

### Copilot Integration

- **API**: Use `vscode.lm.selectChatModels` with family `gpt-4o-mini`.
- **Streaming**: Use `CopilotService.promptCopilotStream` for real-time feedback.
- **Messages**: Construct conversational context using `LanguageModelChatMessage`.

## Common Tasks

### Adding a New Webview Feature

1. **Types**: Define payload types in `webview/src/types/index.ts`.
2. **Frontend**: Add UI component + `vscode.postMessage('command', payload)`.
3. **Backend**: Add case to `switch(command)` in `GhostwriterViewProvider.ts`.
4. **Service**: Implement logic in relevant `Service` class.

### Creating a New Agent

1. Create a `.md` file in `.ghostwriter/{type}/`.
2. Add frontmatter:
   ```yaml
   ---
   name: My Agent
   description: purpose
   ---
   ```
3. Add the system prompt as the markdown body.

## UI & Styling Guidelines

- **Buttons**: All `button` elements must have the `hover:cursor-pointer` class.
