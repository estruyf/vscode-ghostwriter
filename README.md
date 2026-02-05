<h1 align="center">
  <img alt="Ghostwriter for VS Code" src="./assets/ghostwriter-icon-128x128.png" width="64" height="64" />
</h1>

# Ghostwriter for VS Code

AI-assisted content creation tool powered by GitHub Copilot for interviews and
writing workflows. This extension provides an in-editor experience for
conducting AI-driven interviews and generating polished articles from
transcripts.

## Screenshots

<div align="center">

### Home View
<img alt="Ghostwriter Home View" src="./assets/screenshot/app-home-0.0.5.png" width="800" />

### Interview Mode
<img alt="Ghostwriter Interview Mode" src="./assets/screenshot/app-interview.png" width="800" />

### Writer Mode
<img alt="Ghostwriter Writer Mode" src="./assets/screenshot/app-writer-0.0.5.png" width="800" />

### Voice Generator Mode
<img alt="Ghostwriter Voice Generator Mode" src="./assets/screenshot/app-voice.png" width="800" />

</div>

## Features

### AI-Powered Interview Mode
- **Interactive AI Interviews**: Conduct dynamic interviews with GitHub Copilot
  asking relevant questions
- **Smart Conversation Flow**: AI adapts questions based on your responses
- **Instant Transcript Creation**: Transcripts are created immediately when you
  provide the interview topic and saved to `.ghostwriter/transcripts/`
- **Real-time File Updates**: Each question and answer is written to the
  transcript file as it happens, preventing data loss
- **Resume Interrupted Interviews**: Resume an interview from where it left off
  by selecting an existing transcript file
- **Auto-completion Detection**: Automatically detects when the interview is
  complete
- **Model Selection**: Choose from available GitHub Copilot models (GPT-4o,
  GPT-4o mini, etc.)
- **Multi-Language Support**: Conduct interviews in over 20 languages including
  Spanish, French, German, Chinese, Japanese, and more
- **Interviewer Agents**: Create, manage, and select custom interviewer prompts
  stored in `.ghostwriter/interviewer`
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
- **Multi-Language Support**: Generate content in over 20 languages including
  Spanish, French, German, Chinese, Japanese, and more
- **Writer Agents**: Create, manage, and select custom writer prompts stored in
  `.ghostwriter/writer`
- **Writing Style Options**:
  - Formal, Casual, or Conversational tone
  - Automatic heading generation
  - SEO optimization
- **Keyword Optimization**: Define target keywords for improved search engine
  visibility
- **Frontmatter Templates**: Create reusable YAML frontmatter templates for
  consistent article metadata
- **Front Matter CMS Integration**: Seamlessly integrate with Front Matter CMS
  for content management
  - Automatically save articles to Front Matter's content directory
  - Open saved articles in Front Matter's interface
  - Leverage Front Matter's workflow and publishing features
- **Real-time Streaming**: Watch your article being generated in real-time
- **Direct File Save**: Save generated articles directly to your workspace
- **Draft Iteration Mode**: Refine your articles conversationally with iterative
  improvements

### Draft Iteration Mode
- **Conversational Refinement**: Instead of one-shot generation, refine your
  articles with natural language prompts
  - "Make the intro more engaging"
  - "Add more technical depth to section 3"
  - "This sounds too formal, make it more like my other posts"
- **Revision History**: Track all changes with automatic revision management
- **Version Navigation**: Browse through previous versions with prev/next
  controls
- **Side-by-side History**: View revision history sidebar showing all refinement
  prompts
- **Persistent Drafts**: Drafts saved to `.ghostwriter/drafts/` and accessible
  from home page
- **Export Options**: Export final version as markdown at any time

### Voice Generator Mode
- **Writing Style Analysis**: Automatically analyze your existing writing to
  create a personalized voice profile
- **Smart Content Discovery**: Recursively searches for markdown files in your
  selected folder
- **Recent Content Priority**: Analyzes your most recent writing (up to 20
  files) to capture your current style
- **Comprehensive Voice Profile**: Generates detailed analysis including:
  - Voice characteristics (tone, pacing, formality)
  - Style rules and guidelines
  - Lexicon (favorite phrases, words to avoid)
  - Structure patterns
- **Automatic Storage**: Voice profiles saved to `.ghostwriter/voices/` folder
- **Easy Integration**: Use generated voice files in Writer mode for consistent
  content

### State Persistence
- **Model Preferences**: Selected GitHub Copilot model persists across sessions
- **Language Preferences**: Selected content language persists across sessions
- **Frontmatter Templates**: Save and reuse frontmatter templates for all
  articles
- **Agent Selection**: Selected interviewer and writer agents persist across
  sessions
- **Prompt Configuration**: Selected prompt configuration persists across
  sessions

## Getting Started

1. Install the extension
2. Ensure you have GitHub Copilot subscription and extension installed
3. Open a workspace folder in VS Code
4. Use the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and run
   `Ghostwriter: Open Ghostwriter`
5. Choose between Interview, Writer, or Voice Generator mode

## Usage

### Conducting an AI Interview

1. Open the Ghostwriter panel
2. Click on "Start Interview"
3. (Optional) Select or create an interviewer agent to shape the interview
4. Select your preferred GitHub Copilot model
5. The AI will first ask you for the interview topic
6. Once you provide the topic, a transcript file is immediately created in
   `.ghostwriter/transcripts/`
7. Answer the AI's questions in the chat interface
8. Each question and answer is saved to the transcript file in real-time
9. The AI will automatically detect completion and save the final transcript
10. If the editor closes unexpectedly, your progress is saved in the transcript
    file

### Resuming an Interrupted Interview

1. Open the Ghostwriter panel
2. Click on "Start Interview"
3. Click the "Resume Interview" button in the header
4. Select the transcript file you want to continue from the dialog
5. Click "Resume"
6. The interview will continue from where it left off, with all previous Q&As
   loaded

### Generating Content from Transcripts

1. Open the Ghostwriter panel
2. Click on "Write Article"
3. (Optional) Select or create a writer agent to guide generation
4. Select a transcript from your workspace or browse for a custom file
5. (Optional) Select a voice file to maintain consistent writing style
6. Configure writing options:
  - Choose writing style (Formal/Casual/Conversational)
  - Select content language (English, Spanish, French, German, etc.)
  - Enable/disable headings and SEO optimization
  - Add target keywords for SEO
  - Configure frontmatter template
7. Select your preferred GitHub Copilot model
8. Click "Start Writing"
9. Watch the article generate in real-time
10. Choose to either:
    - Click "Iterate Draft" to enter Draft Iteration Mode for refinement
    - Click "Save Article" to save directly to your workspace

### Using Draft Iteration Mode

1. After generating an article in Writer mode, click "Iterate Draft"
2. The draft is automatically saved to `.ghostwriter/drafts/`
3. Use the refinement input to conversationally improve your content:
   - Example: "Make the intro more engaging"
   - Example: "Add more technical depth to section 3"
   - Example: "This sounds too formal, make it more conversational"
4. Each refinement creates a new revision with full history
5. Navigate between revisions using prev/next buttons
6. View all revisions in the history sidebar (toggle with History button)
7. Export the final version using the "Export" button
8. Access saved drafts anytime from the "My Drafts" card on the home page

### Managing Drafts

1. From the home page, click "My Drafts"
2. View all saved drafts with preview and metadata
3. Click on any draft to continue working on it
4. Delete drafts you no longer need

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

### Generating a Voice Profile

1. Open the Ghostwriter panel
2. Click on "Generate Voice"
3. Select your preferred GitHub Copilot model
4. Click "Generate Voice Profile"
5. Select a folder containing your writing samples (blog posts, articles, etc.)
6. Wait for the AI to analyze your writing style
7. Voice profile is automatically saved to
   `.ghostwriter/voices/voice-YYYY-MM-DD.md`
8. Review and customize the generated profile if needed
9. Use the voice file in Writer mode to maintain your unique style

## Front Matter CMS Integration

Ghostwriter integrates seamlessly with [Front Matter CMS](https://frontmatter.codes/), 
a powerful content management system for VS Code. When Front Matter CMS is installed, 
Ghostwriter automatically enhances the article saving workflow:

### Features
- **Automatic Detection**: Ghostwriter detects if Front Matter CMS is installed
- **Smart Save Location**: Articles are saved to Front Matter's configured content 
  directory when available
- **Seamless Handoff**: Saved articles automatically open in Front Matter's interface
- **Workflow Integration**: Leverage Front Matter's publishing and workflow features

### How to Use
1. Install [Front Matter CMS extension](https://marketplace.visualstudio.com/items?itemName=eliostruyf.vscode-front-matter)
2. Configure Front Matter CMS in your workspace
3. Generate articles using Ghostwriter as usual
4. When saving, Ghostwriter will automatically:
   - Use Front Matter's content directory
   - Open the article in Front Matter's interface
   - Enable Front Matter's metadata and workflow features

This integration creates a complete content creation pipeline: conduct AI interviews, 
generate articles with Ghostwriter, then manage and publish with Front Matter CMS.

## File Structure

The extension creates a `.ghostwriter` folder in your workspace root:
```
.ghostwriter/
├── transcripts/     # Interview transcripts (.md files)
├── voices/          # Voice files for writing style (.md files)
├── interviewer/     # Interviewer agents (.md files)
├── writer/          # Writer agents (.md files)
├── drafts/          # Draft iterations (.json files)
└── attachments/     # Uploaded images and files
```

## Commands

- `Ghostwriter: Open Ghostwriter` - Open the main editor panel

## Requirements

- VS Code 1.108.1 or higher
- GitHub Copilot subscription
- GitHub Copilot extension installed
- An open workspace folder
- (Optional) [Front Matter CMS extension](https://marketplace.visualstudio.com/items?itemName=eliostruyf.vscode-front-matter) for enhanced content management

## Extension Settings

This extension stores the following in workspace state:
- Selected GitHub Copilot model ID
- Selected content language
- Frontmatter template for articles
- Selected interviewer and writer agents

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
