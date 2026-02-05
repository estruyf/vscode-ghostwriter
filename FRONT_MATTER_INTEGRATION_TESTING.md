# Front Matter CMS Integration - Testing Guide

This document provides guidance on how to manually test the Front Matter CMS integration.

## Prerequisites

1. Install Front Matter CMS extension from the VS Code marketplace:
   - Extension ID: `eliostruyf.vscode-front-matter`
   - Or install via command: `code --install-extension eliostruyf.vscode-front-matter`

2. Set up a workspace with Front Matter CMS:
   - Create a `frontmatter.json` file in your workspace root
   - Configure content folders in the Front Matter settings

## Testing the Integration

### Test 1: Basic Detection

1. Open Ghostwriter in a workspace where Front Matter CMS is NOT installed
2. Generate an article using the Writer mode
3. Click "Save Article"
4. Expected: Standard VS Code save dialog appears
5. Verify: Article saves normally to chosen location

### Test 2: Front Matter CMS Integration

1. Install Front Matter CMS extension
2. Configure Front Matter in your workspace with a content folder (e.g., `content/posts`)
3. Open Ghostwriter and generate an article
4. Click "Save Article"
5. Expected: 
   - Save dialog opens with default location in Front Matter's content directory
   - After saving, article opens in Front Matter's interface
   - Article is registered in Front Matter's content dashboard
6. Verify:
   - File is saved in the correct content directory
   - Front Matter dashboard shows the new article
   - Frontmatter in the article is properly formatted

### Test 3: Content Directory Detection

1. Configure Front Matter with custom content folders in `frontmatter.json`
2. Generate and save an article
3. Expected: Save dialog defaults to the configured content folder
4. Verify: File path matches Front Matter's configuration

### Test 4: Frontmatter Extraction

1. Create an article with YAML frontmatter:
   ```yaml
   ---
   title: "Test Article"
   date: "2026-01-31"
   tags: ["test", "integration"]
   ---
   ```
2. Save the article through Ghostwriter
3. Expected: Frontmatter is preserved and properly formatted
4. Verify: Front Matter CMS can parse and display the frontmatter

## Integration Points Tested

- ✅ Detection of Front Matter CMS installation
- ✅ Content directory resolution from Front Matter config
- ✅ Automatic opening of saved articles in Front Matter interface
- ✅ Dashboard integration for content management
- ✅ Frontmatter preservation and formatting

## Known Limitations

1. The integration requires Front Matter CMS to be installed and activated
2. If Front Matter's configuration is invalid or missing, falls back to standard save
3. Content type selection and advanced Front Matter features are planned for future updates

## Future Enhancements

- Support for Front Matter content types
- Automatic metadata extraction and mapping
- Integration with Front Matter's publishing workflow
- Support for Front Matter's taxonomy system
