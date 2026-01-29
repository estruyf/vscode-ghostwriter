import { useState, useEffect } from 'react';

interface HomePageProps {
}

export default function HomePage() {
  const handleGetInterviewed = () => {
    const event = new CustomEvent('navigate', { detail: { page: 'interview' } });
    window.dispatchEvent(event);
  };

  const handleWriteArticle = () => {
    const event = new CustomEvent('navigate', { detail: { page: 'writer' } });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex h-full items-center justify-center px-6 py-12">
      <div className="w-full max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">Ghostwriter</h1>
          <p className="mt-3 text-lg text-slate-300">AI-powered content creation for writers</p>
          <p className="mt-2 text-sm text-slate-400">
            Part of Ghostwriter Agents
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <button
            className="group relative flex h-full flex-col rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/85 via-slate-900/75 to-slate-950/85 p-6 text-left shadow-[0_15px_50px_rgba(0,0,0,0.45)] transition duration-200 hover:-translate-y-1 hover:border-purple-400/80 hover:shadow-[0_22px_65px_rgba(124,58,237,0.35)] focus:outline-none focus:ring-2 focus:ring-purple-500/40 hover:cursor-pointer"
            onClick={handleGetInterviewed}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15 text-2xl text-purple-200 shadow-inner shadow-purple-500/20">🎤</div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">Get Interviewed</h2>
            <p className="mt-2 text-base leading-relaxed text-slate-300">
              Start with an interactive interview. Answer questions and share your expertise while our AI assistant helps gather content material.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-purple-200 transition group-hover:text-cyan-200">
              Begin Interview
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>

          <button
            className="group relative flex h-full flex-col rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/85 via-slate-900/75 to-slate-950/85 p-6 text-left shadow-[0_15px_50px_rgba(0,0,0,0.45)] transition duration-200 hover:-translate-y-1 hover:border-purple-400/80 hover:shadow-[0_22px_65px_rgba(124,58,237,0.35)] focus:outline-none focus:ring-2 focus:ring-purple-500/40 hover:cursor-pointer"
            onClick={handleWriteArticle}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/20 text-2xl text-amber-100 shadow-inner shadow-amber-500/20">✍️</div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">Write Article</h2>
            <p className="mt-2 text-base leading-relaxed text-slate-300">
              Have an interview already? Upload your interview markdown and let our writer transform it into a polished, comprehensive article.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-purple-200 transition group-hover:text-cyan-200">
              Start Writing
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-slate-400">
          Powered by GitHub Copilot
          <br />
          <span className="text-xs">
            Created by Elio Struyf
          </span>
        </div>
      </div>
    </div>
  );
}
