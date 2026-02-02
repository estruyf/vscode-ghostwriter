import { LanguageSelector } from './LanguageSelector';

/**
 * Unescape literal escape sequences in frontmatter text
 * Converts \n to actual newlines, \" to quotes, etc.
 * Handles escaped backslashes (\\) correctly by using a placeholder approach
 */
function unescapeFrontmatter(text: string): string {
  // Use a unique placeholder that won't appear in normal text
  const BACKSLASH_PLACEHOLDER = '\u0000BACKSLASH\u0000';
  
  return text
    // First, protect escaped backslashes by replacing \\ with a placeholder
    .replace(/\\\\/g, BACKSLASH_PLACEHOLDER)
    // Now safely replace other escape sequences
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\t/g, '\t')
    // Finally, restore the escaped backslashes as single backslashes
    .replace(new RegExp(BACKSLASH_PLACEHOLDER, 'g'), '\\');
}

interface WritingOptionsProps {
  writingStyle: 'formal' | 'casual' | 'conversational';
  onStyleChange: (style: 'formal' | 'casual' | 'conversational') => void;
  includeHeadings: boolean;
  onHeadingsChange: (value: boolean) => void;
  includeSEO: boolean;
  onSEOChange: (value: boolean) => void;
  keywords: string;
  onKeywordsChange: (value: string) => void;
  frontmatter: string;
  onFrontmatterChange: (value: string) => void;
  onFrontmatterClear: () => void;
  hasVoiceFile: boolean;
  showFrontmatterEditor: boolean;
  setShowFrontmatterEditor: (value: boolean) => void;
  language: string;
  onLanguageChange: (language: string) => void;
}

export function WritingOptions({
  writingStyle,
  onStyleChange,
  includeHeadings,
  onHeadingsChange,
  includeSEO,
  onSEOChange,
  keywords,
  onKeywordsChange,
  frontmatter,
  onFrontmatterChange,
  onFrontmatterClear,
  hasVoiceFile,
  showFrontmatterEditor,
  setShowFrontmatterEditor,
  language,
  onLanguageChange,
}: WritingOptionsProps) {
  return (
    <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
      <h3 className="text-xl font-semibold text-white mb-4">Writing Options</h3>

      {hasVoiceFile && (
        <div className="mb-4 p-2 bg-blue-500/10 border-l-2 border-blue-500/50 rounded">
          <p className="text-base text-blue-300/90">
            Voice file selected. Writing style and additional options are disabled to maintain consistency with the chosen voice.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 mb-4">
        <div>
          <label className="block text-base font-medium text-slate-300 mb-2">Writing Style</label>
          <select
            value={writingStyle}
            onChange={(e) => onStyleChange(e.target.value as any)}
            disabled={hasVoiceFile}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
            <option value="conversational">Conversational</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-base text-slate-300">
          <input
            type="checkbox"
            checked={includeHeadings}
            onChange={(e) => onHeadingsChange(e.target.checked)}
            disabled={hasVoiceFile}
            className="w-4 h-4 bg-slate-700 border border-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className={hasVoiceFile ? 'opacity-50' : ''}>Include Headings</span>
        </label>
        <label className="flex items-center gap-2 text-base text-slate-300">
          <input
            type="checkbox"
            checked={includeSEO}
            onChange={(e) => onSEOChange(e.target.checked)}
            disabled={hasVoiceFile}
            className="w-4 h-4 bg-slate-700 border border-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className={hasVoiceFile ? 'opacity-50' : ''}>Optimize for SEO</span>
        </label>
      </div>



      {/* Language Selector */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <LanguageSelector
          value={language}
          onChange={onLanguageChange}
          className="mb-4"
        />
      </div>

      {/* Keyword Optimization */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <label className="block text-base font-medium text-slate-300 mb-2">
          Keyword Optimization
          <span className="text-slate-500 font-normal ml-1">(Optional)</span>
        </label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => onKeywordsChange(e.target.value)}
          placeholder="Enter keywords separated by commas (e.g., AI, machine learning, automation)"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
        <p className="mt-2 text-sm text-slate-500">
          {keywords.trim() ? `Keywords: ${keywords.split(',').map(k => k.trim()).filter(k => k).join(', ')}` : 'Add target keywords to optimize article for search engines'}
        </p>
      </div>

      {/* Frontmatter Template */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-base font-medium text-slate-300">
            Frontmatter Template
            <span className="text-slate-500 font-normal ml-1">(Optional)</span>
          </label>
          {frontmatter && (
            <button
              onClick={onFrontmatterClear}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {!showFrontmatterEditor ? (
          <div className="space-y-2">
            {frontmatter ? (
              <>
                <div className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg">
                  <pre className="text-sm text-slate-200 font-mono overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
                    {unescapeFrontmatter(frontmatter)}
                  </pre>
                </div>
                <button
                  onClick={() => setShowFrontmatterEditor(true)}
                  className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 text-base transition-colors"
                >
                  Edit Frontmatter
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowFrontmatterEditor(true)}
                className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 text-base transition-colors"
              >
                Add Frontmatter Template
              </button>
            )}
            <p className="text-sm text-slate-500">
              Define YAML frontmatter to include in all generated articles
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              value={frontmatter}
              onChange={(e) => onFrontmatterChange(e.target.value)}
              placeholder="---&#10;title: &quot;&quot;&#10;date: &quot;&quot;&#10;tags: []&#10;---"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono text-base"
              rows={10}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onFrontmatterChange(frontmatter);
                  setShowFrontmatterEditor(false);
                }}
                className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-base transition-colors"
              >
                Save Template
              </button>
              <button
                onClick={() => setShowFrontmatterEditor(false)}
                className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-base transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
