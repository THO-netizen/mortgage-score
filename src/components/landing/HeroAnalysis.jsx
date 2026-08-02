// ── Hero — Premium private-banking aesthetic ─────────────────────

export default function HeroAnalysis({ onStart }) {
  const scrollToProcess = (e) => {
    e.preventDefault()
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="min-h-[100svh] bg-dark-900 flex flex-col items-center justify-center px-5 sm:px-6 py-16 sm:py-20 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-xl w-full text-center animate-fade-up">

        {/* Identity mark */}
        <div className="flex items-center justify-center gap-2 mb-10 sm:mb-14">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#C9A96E' }}>
            <svg
              width="14" height="14" viewBox="0 0 16 16"
              fill="none" xmlns="http://www.w3.org/2000/svg"
              className="sm:w-4 sm:h-4"
            >
              <rect x="1" y="9" width="3" height="6" rx="1" fill="white" fillOpacity=".7" />
              <rect x="6" y="5" width="3" height="10" rx="1" fill="white" fillOpacity=".9" />
              <rect x="11" y="1" width="3" height="14" rx="1" fill="white" />
            </svg>
          </div>
          <span className="font-display font-extrabold tracking-tight leading-none text-sm sm:text-base" style={{ color: '#FAFAF5' }}>
            MORTGAGE{' '}
            <span style={{ color: '#C9A96E' }}>SCORE</span>
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-display text-[1.65rem] sm:text-[2.5rem] md:text-[3rem] font-extrabold leading-[1.12] tracking-tight mb-5 sm:mb-6"
          style={{ color: '#FAFAF5' }}
        >
          Clarity before your next<br className="hidden sm:inline" /> property decision.
        </h1>

        {/* Supporting sentence */}
        <p
          className="text-[15px] sm:text-base max-w-md mx-auto mb-8 sm:mb-10 leading-relaxed"
          style={{ color: '#A8B2C1' }}
        >
          A private assessment of your Czech mortgage position, borrowing range and strongest next step.
        </p>

        {/* Primary CTA */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={onStart}
            type="button"
            className="btn-cta w-full sm:w-auto mx-auto text-base px-10 sm:px-14"
          >
            Begin Private Assessment
          </button>
        </div>

        {/* Trust line */}
        <p className="text-[13px] sm:text-sm mb-10 sm:mb-14 tracking-wide" style={{ color: '#6B7A8D' }}>
          4 minutes
          <span className="mx-2" style={{ color: '#C9A96E', opacity: 0.5 }}>&middot;</span>
          No documents
          <span className="mx-2" style={{ color: '#C9A96E', opacity: 0.5 }}>&middot;</span>
          Private
        </p>

        {/* Andy Le — compact trust element */}
        <div className="mb-8 sm:mb-10">
          <a
            href="https://www.facebook.com/p/Andy-Le-100079180972737/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 group py-2"
          >
            <img
              src="/andy-le.png"
              alt="Andy Le"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover object-top flex-shrink-0 transition-opacity duration-150 group-hover:opacity-80"
              style={{ border: '2px solid rgba(201,169,110,0.3)' }}
            />
            <div className="text-left">
              <p className="text-[13px] sm:text-sm font-medium leading-tight transition-colors duration-150" style={{ color: '#FAFAF5' }}>
                Andy Le
                <span className="font-normal text-[11px] sm:text-xs ml-1.5" style={{ color: '#6B7A8D' }}>
                  Mortgage Specialist
                </span>
              </p>
              <p className="text-[12px] sm:text-[13px] italic mt-0.5 leading-snug" style={{ color: '#C9A96E', opacity: 0.8 }}>
                &ldquo;Understand your position before speaking to the bank.&rdquo;
              </p>
            </div>
          </a>
        </div>

        {/* Scroll indicator — replaces the old modal link */}
        <button
          type="button"
          onClick={scrollToProcess}
          className="inline-flex items-center gap-1.5 transition-colors py-2 px-3 min-h-[44px]"
          style={{ color: '#6B7A8D' }}
          aria-label="Scroll to how it works"
        >
          <span className="text-[13px]">How does this work?</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mt-px">
            <path d="M6 2.5v7M3 7l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

      </div>
    </main>
  )
}
