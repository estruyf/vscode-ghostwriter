/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./webview/index.html",
    "./webview/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vscode-foreground': 'var(--vscode-foreground)',
        'vscode-background': 'var(--vscode-editor-background)',
        'vscode-button': 'var(--vscode-button-background)',
        'vscode-button-hover': 'var(--vscode-button-hoverBackground)',
        'vscode-input': 'var(--vscode-input-background)',
        'vscode-border': 'var(--vscode-panel-border)',
      }
    },
  },
  plugins: [],
}
