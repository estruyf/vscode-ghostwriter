# Change Log

All notable changes to the "vscode-ghostwriter" extension will be documented in
this file.

## [0.0.8] - 2026-02-06

- [#19](https://github.com/estruyf/vscode-ghostwriter/issues/19): Add image
  support during the interview and writing process
    - Image persistence in .ghostwriter/attachments folder with automatic
      markdown image reference insertion
    - Image support in markdown rendering with proper webview URI handling
    - MarkdownRenderer now processes and displays local image files correctly
    - Image remapping support during article saving, allowing users to specify
      the production path for images in the final markdown output
- Improved ChatMessage component with image display and captions
- Webview now automatically returns to home view when interview ends (manually
  or automatically)
- Added configurable attachment folder for image storage
    - VS Code workspace setting `vscode-ghostwriter.attachmentFolder` for
      default folder
    - Per-interview override via `StateService` for custom attachment locations
    - Interactive folder selection UI in interview view
- Smart draft titles

## [0.0.7] - 2026-02-04

- Style updates
- Dialog for the external link safety warning updated with new design and
  content
- [#20](https://github.com/estruyf/vscode-ghostwriter/issues/20): Sanitize and
  shorten transcript filenames, using AI-assisted slugs for long topics
- [#21](https://github.com/estruyf/vscode-ghostwriter/issues/21): Allow resizing
  the interview input textarea
- [#22](https://github.com/estruyf/vscode-ghostwriter/issues/22): Fix in the
  override of the transcript when the interview completed

## [0.0.6] - 2026-02-02

- Fixed missing loading/thinking state indicator during AI response generation
  in interview
- [#14](https://github.com/estruyf/vscode-ghostwriter/issues/14): Improved the
  header on the interview view
- [#15](https://github.com/estruyf/vscode-ghostwriter/issues/15): Better and
  cleaner rendering for the frontmatter section
- [#18](https://github.com/estruyf/vscode-ghostwriter/issues/18): Add the
  ability to reset the interview with a warning/confirmation dialog

## [0.0.5] - 2026-02-02

- [#6](https://github.com/estruyf/vscode-ghostwriter/issues/6): Draft Iteration
  Mode. Conversational refinement instead of one-shot generation
- [#8](https://github.com/estruyf/vscode-ghostwriter/issues/8): Multi-language
  support for content generation
- [#9](https://github.com/estruyf/vscode-ghostwriter/issues/9): Have the ability
  to resume interviews

## [0.0.4] - 2026-01-31

- [#5](https://github.com/estruyf/vscode-ghostwriter/issues/5): Allow
  customizable and saveable system prompts for different content domains

## [0.0.3] - 2026-01-30

- Added keyboard shortcut (Alt+G) to open Ghostwriter
- Added editor title menu icon for quick access to Ghostwriter
- Updated transcript metadata to include today's date

## [0.0.2] - 2026-01-30

- [#2](https://github.com/estruyf/vscode-ghostwriter/issues/2): Updated tab icon
- [#3](https://github.com/estruyf/vscode-ghostwriter/issues/3): Voice generation
  support for up to 10 markdown files
- [#4](https://github.com/estruyf/vscode-ghostwriter/issues/4): Update the
  extension icon

## [0.0.1] - 2026-01-30

- Initial release of the Ghostwriter VS Code extension.