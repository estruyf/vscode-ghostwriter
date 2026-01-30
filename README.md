<h1 align="center">
  <img alt="Ghostwriter for VS Code" src="./assets/ghostwriter-icon-128x128.png" width="64" height="64" />
</h1>

# Ghostwriter for VS Code

AI-assisted content creation tool powered by GitHub Copilot for interviews and
writing workflows. This extension provides an in-editor experience for
conducting AI-driven interviews and generating polished articles from
transcripts.

## Features

### AI-Powered Interview Mode
- **Interactive AI Interviews**: Conduct dynamic interviews with GitHub Copilot
  asking relevant questions
- **Smart Conversation Flow**: AI adapts questions based on your responses
- **Auto-completion Detection**: Automatically detects when the interview is
  complete
- **Model Selection**: Choose from available GitHub Copilot models (GPT-4o,
  GPT-4o mini, etc.)
- **Transcript Management**: Automatically saves formatted transcripts to the
  `.ghostwriter` folder
- **Hot Module Replacement**: Fast development with HMR support

### Advanced Writer Mode
- **Transcript Selection**: Browse interview transcripts from your workspace or
  select custom files
- **Voice File Integration**: Apply writing style from voice files for
  consistent tone
- **Model Selection**: Choose specific GitHub Copilot models for content
  generation
- **Writing Style Options**:
  - Formal, Casual, or Conversational tone
  - Automatic heading generation
  - SEO optimization
- **Keyword Optimization**: Define target keywords for improved search engine
  visibility
- **Frontmatter Templates**: Create reusable YAML frontmatter templates for
  consistent article metadata
- **Real-time Streaming**: Watch your article being generated in real-time
- **Direct File Save**: Save generated articles directly to your workspace

### State Persistence
- **Model Preferences**: Selected GitHub Copilot model persists across sessions
- **Frontmatter Templates**: Save and reuse frontmatter templates for all
  articles

## Getting Started

1. Install the extension
2. Ensure you have GitHub Copilot subscription and extension installed
3. Open a workspace folder in VS Code
4. Use the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and run
   `Ghostwriter: Open Ghostwriter`
5. Choose between Interview or Writer mode

## Usage

### Conducting an AI Interview

1. Open the Ghostwriter panel
2. Click on "Start Interview"
3. Select your preferred GitHub Copilot model
4. Answer the AI's questions in the chat interface
5. The AI will automatically detect completion and generate a formatted
   transcript
6. Transcript is saved to `.ghostwriter/transcripts/` folder

### Generating Content from Transcripts

1. Open the Ghostwriter panel
2. Click on "Write Article"
3. Select a transcript from your workspace or browse for a custom file
4. (Optional) Select a voice file to maintain consistent writing style
5. Configure writing options:
   - Choose writing style (Formal/Casual/Conversational)
   - Enable/disable headings and SEO optimization
   - Add target keywords for SEO
   - Configure frontmatter template
6. Select your preferred GitHub Copilot model
7. Click "Start Writing"
8. Watch the article generate in real-time
9. Save the article to your workspace

### Setting Up Frontmatter Templates

1. In the Writer view, expand "Writing Options"
2. Click "Add Frontmatter Template"
3. Enter your YAML frontmatter template:
   ```yaml
   ---
   title: ""
   date: ""
   tags: []
   draft: false
   ---
   ```
4. Click "Save Template"
5. The template will be applied to all future articles

## File Structure

The extension creates a `.ghostwriter` folder in your workspace root:
```
.ghostwriter/
├── transcripts/     # Interview transcripts (.md files)
└── voices/          # Voice files for writing style (.md files)
```

## Commands

- `Ghostwriter: Open Ghostwriter` - Open the main editor panel

## Requirements

- VS Code 1.108.1 or higher
- GitHub Copilot subscription
- GitHub Copilot extension installed
- An open workspace folder

## Extension Settings

This extension stores the following in workspace state:
- Selected GitHub Copilot model ID
- Frontmatter template for articles

## Development

### Building
- `npm run compile` - Compile TypeScript
- `npm run watch` - Watch mode for TypeScript
- `npm run build:webview` - Build webview with Vite
- `npm run dev` - Start Vite dev server with HMR
- `npm run clean` - Remove build artifacts

## Contributing

This extension is part of the Ghostwriter ecosystem:
- [ghostwriter-app](https://github.com/estruyf/ghostwriter-app) - Electron app
- [ghostwriter-agents-ai](https://github.com/estruyf/ghostwriter-agents-ai) - AI
  agent services

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

<p align="center">
  <a href="https://github.com/sponsors/estruyf" title="Sponsor Elio Struyf" target="_blank">
    <img src="https://img.shields.io/badge/Sponsor-Elio%20Struyf%20%E2%9D%A4-%23fe8e86?logo=GitHub&style=flat-square" height="25px" alt="Sponsor @estruyf" />
  </a>
</p>

<br />

<p align="center">
  <a href="https://visitorbadge.io/status?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fvscode-ghostwriter">
    <img src="https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fvscode-ghostwriter&labelColor=%23555555&countColor=%2397ca00" height="25px" alt="Ghostwriter visitors" />
  </a>
</p>

<br />

<p align="center">
  <a href="https://struyfconsulting.com" title="Hire Elio Struyf via Struyf Consulting" target="_blank">
    <img src="./assets/struyf-consulting.webp" height="25px" alt="Struyf Consulting Logo" />
  </a>
</p>


**Enjoy writing with Ghostwriter and GitHub Copilot!**
