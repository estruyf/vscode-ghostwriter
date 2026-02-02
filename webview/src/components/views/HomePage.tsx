import { MessagesSquare, Signature, Sparkles, FileEdit } from 'lucide-react';

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

  const handleGenerateVoice = () => {
    const event = new CustomEvent('navigate', { detail: { page: 'voice-generator' } });
    window.dispatchEvent(event);
  };

  const handleViewDrafts = () => {
    const event = new CustomEvent('navigate', { detail: { page: 'drafts' } });
    window.dispatchEvent(event);
  };

  return (
    <div className="relative flex h-full items-center justify-center px-4 py-6 sm:px-6 sm:py-8 md:py-12 overflow-auto">
      <div className="w-full max-w-7xl flex flex-col">
        <div className="mb-6 sm:mb-8 md:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">Ghostwriter</h1>
          <p className="mt-2 sm:mt-3 text-lg sm:text-xl text-slate-300">AI-powered content creation for writers</p>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-400">
            Part of Ghostwriter Agents
          </p>
        </div>

        <div className="absolute top-0 right-0 overflow-hidden">
          <svg className='-mt-12 -mr-12 h-80 w-80 opacity-60' version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
            viewBox="0 0 1024 1024" enableBackground="new 0 0 1024 1024" xmlSpace="preserve">
            <g>
              <g>
                <path className='fill-slate-50' d="M534,0c-0.1,0.1,1.5,0.8,2,0.9l11.7,0.9c255.8,19.8,457.2,222.6,474.5,477.1l0.9,12.9c0.1,0.8,0.8,2.4,0.9,2.3v31
        c-0.1-0.2-0.9,1.5-0.9,2.1l-0.8,12.9C1009.5,736,892.9,903.8,713.7,981.6c-52.6,22.8-108.5,37.5-165.5,40.7l-16.1,0.9
        c-0.6,0-2.3,0.8-2.1,0.9h-35c-1.9-0.9-5.1-1-8-1.2l-13.3-0.8c-58.6-3.7-116-19.1-169.4-43.1c-135.8-61.1-239-177.9-282.1-320.5
        C11,621,4.5,582.3,1.9,543.1C1.6,537.5,1.2,532.6,0,528v-32c0-2.3,1.1-6.5,1.2-8.9L2,475.9C19.1,225,224,19,474.7,2l12.3-0.8
        c3.7-0.3,7.3,0,10.1-1.2H534z M693.6,600.9l-35.5,21.3l-29.4,17.6L605.8,653L595.6,630l126-74.4L791,514
        c8.7-5.2,14.8-13.4,16.2-23.5c1.8-12.8-3.7-24.5-13.4-31.2c-10.5-7.2-23.6-7.3-34.6-0.9l-65.5,38.2l-19.3-104.1
        c-5.3-28.5-17.4-54.4-34.4-77.5c-16-21.7-36.2-38.9-60.8-50.3c-40.5-18.9-87.3-19.1-128.5-2c-27.6,11.5-51,31.7-68.4,55.6
        c-17.5,24-28.2,51.1-33.6,80.4l-18.5,100.7L268,460.1c-15-9.4-33.9-7.4-44.5,6.9c-10.3,13.8-7.8,33.3,6,44.5l14.2,10L317,574
        l-40.9,118.1l-26.9,77l-30,87.4l106-23.1l20.6-71.5l46.3-157.4c1.9,2,1,5.1,0.4,8.2l-65.7,318.1c14.6,6.4,28.9,12,43.9,16.8
        c24.9-8.4,47.1-18.6,70-30.9l6.8,17.3l-4.4,14.5c-1.4,4.4-1.5,9.3-0.7,13.3l-3.7,2.4c18.1,2.8,34.5,4.5,51.8,5.2l-8.9-12.4
        l7.1-11.8l20,0.2l0.2,24.7l14.8,0l0.2-24.6l19.4,0.2c2.6,3.1,5.5,7.8,7,11.4l-8.7,12.1c117.8-7.1,228.2-61.1,308.1-148
        c154.3-168,160.8-426.3,13.8-601.7C801.6,145,718.3,91.7,624.1,67.8C497.6,35.7,361.3,60,254,133.8
        C144.5,208.5,72.2,327.4,57,458.9C41,596.6,87.9,733.9,184.8,832L235,687.1l33.9-98l-40.7-29.3c-8.9-6.4-17.8-11.8-26.3-18.9
        c-8.3-6.9-16-16.7-19.4-27.1c-8.9-27.2-7.3-32,1-58.4c1.8-5.7,6.6-10.3,9.7-15.2c3.8-5.9,9.5-9.8,15.1-13.9
        c6.1-4.5,12.5-7.8,20.1-9c7.2-1.2,14.9-4.7,22.2-3.8c8.9,1.1,17.7,3.1,26.2,5.8c8.9,2.9,16,9.1,24.7,14l7.6-41.2l4.8-20.3
        c4.3-18.3,10.3-35.9,19.6-52.4c9.5-16.7,20.2-31.7,33.1-46.1c15.2-16.9,33.7-29.9,53.5-41.3c15.4-8.9,32-13,49.1-17.1
        c20.7-4.9,35.4-6.8,56.7-5.4c10.7,0.7,20.5,3.3,31,5.4c26.5,5.2,50.4,15.8,71.9,32.2c10.7,8.2,21,15.9,29.8,26.2
        c27.5,32.2,45.7,64.9,54.1,107l10.4,52.1c26.6-15.8,17.2-11.3,44.1-18.4c5.8-1.5,11.8-1.5,17.6,0c6.9,1.8,14.2,2.8,20.8,5.5
        c10.9,4.4,20,12.8,27.2,21.4c7,8.3,9.8,17,12.5,26.9c3.6,12.9,3.4,24.2-0.2,37.1c-2.3,8.3-4.6,15.3-9.8,22.3
        c-5.7,7.7-11.5,14.1-20,19.2L765,577l-31.3,18.7c0.5,3,1.1,5.7,0.9,7.8c-2.4,29-12.9,67.8-24.5,94.7
        c-11.8,27.1-25.4,52.7-41.1,77.7c-4.5,7.2-12.5,14.2-21.5,16.3l3.6-13.1c1.7-6.1,2.6-12,1.1-18c-2-7.9-4.3-14.8-7.9-22.4l11.3-21
        C673.4,684.5,692.8,639.3,693.6,600.9z M289.9,912.4l6.6-31.9l-42.6,9.5L289.9,912.4z"/>
                <path className='fill-slate-50' d="M509,801.1l0,130.3c-6,0.6-11.3,0.6-18,0.5l-23.8-56.3l-47.7-109.8l59.1-131.4c10.2-0.5,20-0.5,30.3,0.1l0.1,112.8
        c-13.7,3.8-21.8,15.7-20.3,29.9C489.9,788.3,496.9,797.4,509,801.1z"/>
                <path className='fill-slate-50' d="M524,931.8l0-131c13.7-3.8,21-15.5,20.1-28.9c-0.8-11.9-8.8-21.2-20.1-24.7l0-112.8l29.3,0.1l60,133.8l-70.3,163.3
        C536.7,932,531.5,932.1,524,931.8z"/>
                <path className='fill-slate-50' d="M598.2,391c15.9,24.4,5.7,60.4-15,62.9c-7.5,0.9-15-1.3-19.9-7.4c-13-16.1-13.5-40.5-1.1-56.9c4.7-6.2,11.2-9.8,18.2-9.4
        C587.3,380.6,594,384.5,598.2,391z"/>
                <path className='fill-slate-50' d="M442.1,454.5c-7.4-0.3-14.4-4.9-18.1-11.2c-9.5-16.2-9.6-36.2,0.4-51.9c5.8-9,16.9-13.8,26.7-9.1
        c18.5,8.9,22.3,38.4,12.9,57.7C459.7,448.6,452,455,442.1,454.5z"/>
              </g>
            </g>
          </svg>

          <div className='absolute top-0 right-0 h-8 w-8 bg-slate-950'></div>
        </div>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
          <button
            className="group relative flex h-full flex-col justify-between rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/85 via-slate-900/75 to-slate-950/85 p-4 sm:p-5 md:p-6 text-left shadow-[0_15px_50px_rgba(0,0,0,0.45)] transition duration-200 hover:-translate-y-1 hover:border-purple-400/80 hover:shadow-[0_22px_65px_rgba(124,58,237,0.35)] focus:outline-none focus:ring-2 focus:ring-purple-500/40 hover:cursor-pointer"
            onClick={handleGetInterviewed}
          >
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-purple-500/15 text-2xl sm:text-3xl text-purple-200 shadow-inner shadow-purple-500/20"><MessagesSquare /></div>
            <h2 className="mt-3 sm:mt-4 text-xl sm:text-2xl md:text-3xl font-semibold text-slate-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">Get Interviewed</h2>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-300">
              Start with an interactive interview. Answer questions and share your expertise while our AI assistant helps gather content material.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-base font-semibold text-purple-200 transition group-hover:text-cyan-200">
              Begin Interview
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>

          <button
            className="group relative flex h-full flex-col justify-between rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/85 via-slate-900/75 to-slate-950/85 p-4 sm:p-5 md:p-6 text-left shadow-[0_15px_50px_rgba(0,0,0,0.45)] transition duration-200 hover:-translate-y-1 hover:border-purple-400/80 hover:shadow-[0_22px_65px_rgba(124,58,237,0.35)] focus:outline-none focus:ring-2 focus:ring-purple-500/40 hover:cursor-pointer"
            onClick={handleWriteArticle}
          >
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-amber-400/20 text-2xl sm:text-3xl text-amber-100 shadow-inner shadow-amber-500/20"><Signature /></div>
            <h2 className="mt-3 sm:mt-4 text-xl sm:text-2xl md:text-3xl font-semibold text-slate-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">Write Article</h2>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-300">
              Have an interview already? Upload your interview markdown and let our writer transform it into a polished, comprehensive article.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-base font-semibold text-purple-200 transition group-hover:text-cyan-200">
              Start Writing
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>

          <button
            className="group relative flex h-full flex-col justify-between rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/85 via-slate-900/75 to-slate-950/85 p-4 sm:p-5 md:p-6 text-left shadow-[0_15px_50px_rgba(0,0,0,0.45)] transition duration-200 hover:-translate-y-1 hover:border-purple-400/80 hover:shadow-[0_22px_65px_rgba(124,58,237,0.35)] focus:outline-none focus:ring-2 focus:ring-purple-500/40 hover:cursor-pointer"
            onClick={handleGenerateVoice}
          >
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-cyan-500/15 text-2xl sm:text-3xl text-cyan-200 shadow-inner shadow-cyan-500/20"><Sparkles /></div>
            <h2 className="mt-3 sm:mt-4 text-xl sm:text-2xl md:text-3xl font-semibold text-slate-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">Generate Voice</h2>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-300">
              Analyze your existing writing to create a voice profile. Let AI learn your unique style and tone for consistent content.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-base font-semibold text-purple-200 transition group-hover:text-cyan-200">
              Create Voice Profile
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>

          <button
            className="group relative flex h-full flex-col justify-between rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/85 via-slate-900/75 to-slate-950/85 p-4 sm:p-5 md:p-6 text-left shadow-[0_15px_50px_rgba(0,0,0,0.45)] transition duration-200 hover:-translate-y-1 hover:border-purple-400/80 hover:shadow-[0_22px_65px_rgba(124,58,237,0.35)] focus:outline-none focus:ring-2 focus:ring-purple-500/40 hover:cursor-pointer"
            onClick={handleViewDrafts}
          >
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-2xl sm:text-3xl text-emerald-200 shadow-inner shadow-emerald-500/20"><FileEdit /></div>
            <h2 className="mt-3 sm:mt-4 text-xl sm:text-2xl md:text-3xl font-semibold text-slate-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">My Drafts</h2>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-300">
              Continue working on your drafts with iterative refinement. Review history and make conversational improvements.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-base font-semibold text-purple-200 transition group-hover:text-cyan-200">
              View Drafts
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>

        <div className="mt-6 sm:mt-8 text-center text-sm sm:text-base text-slate-400 space-y-1 sm:space-y-2">
          <p>Powered by GitHub Copilot</p>
          <p className="text-sm sm:text-base">
            Created by <a href="https://eliostruyf.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition" title="Visit Elio Struyf's website">Elio Struyf</a>
          </p>
          <p>
            <a href="https://github.com/sponsors/estruyf" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:text-rose-300 transition font-medium" title="Support Elio via GitHub Sponsors">💖 Support this project</a>
          </p>
        </div>
      </div>
    </div>
  );
}
