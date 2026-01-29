# Ghostwriter for VS Code

AI-assisted content creation tool for interviews and writing workflows. This extension serves as the frontend for the Ghostwriter app, providing an in-editor experience for managing interviews and writing content.

## Features

### Interview Mode
- Start new interview sessions directly within VS Code
- Automatically save transcripts to the `.ghostwriter` folder in your workspace
- Keep track of all your interview sessions in one place

### Writer Mode
- Browse and select interview transcripts from your workspace
- Support for custom transcript files from any location
- Optional voice file integration for personalized content generation
- Single voice file auto-selection or multi-file picker

## Getting Started

1. Open a workspace folder in VS Code
2. Click on the Ghostwriter icon in the Activity Bar
3. Choose between Interview or Writer mode:
   - **Interview**: Start a new interview session
   - **Writer**: Generate content from existing transcripts

## Usage

### Starting an Interview

1. Open the Ghostwriter panel
2. Click on the "Interview" tab
3. Enter your interview topic
4. Click "Start Interview"
5. The transcript will be created in the `.ghostwriter` folder

### Using the Writer

1. Open the Ghostwriter panel
2. Click on the "Writer" tab
3. Select a transcript from your workspace or browse for a custom file
4. Optionally select a voice file for personalization
5. Click "Start Writing"

## File Structure

The extension creates a `.ghostwriter` folder in your workspace root to store:
- Interview transcripts (`.md` files)
- Voice files (`.md` files)

## Commands

- `Ghostwriter: Open Ghostwriter` - Open the main panel
- `Ghostwriter: Start New Interview` - Quick start a new interview
- `Ghostwriter: Start Writer` - Open the writer interface

## Requirements

- VS Code 1.108.1 or higher
- An open workspace folder

## Extension Settings

This extension does not add any VS Code settings at this time.

## Known Issues

- Integration with ghostwriter-agents-ai is planned for future releases
- Voice file support currently accepts markdown files

## Contributing

This extension integrates with:
- [ghostwriter-app](https://github.com/estruyf/ghostwriter-app) - Electron app
- [ghostwriter-agents-ai](https://github.com/estruyf/ghostwriter-agents-ai) - AI agent services

## Release Notes

### 0.0.1

Initial release of Ghostwriter for VS Code
- Interview mode for starting new sessions
- Writer mode for content generation
- File management in `.ghostwriter` folder
- Custom file selection support
- Voice file integration

---

**Enjoy writing with Ghostwriter!**
