export default function LandingFooter({ onStart }) {
  const scrollToHowItWorks = (e) => {
    e.preventDefault()
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="bg-dark-900 border-t border-white/10 py-5 sm:py-7 px-5 sm:px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

        <p className="text-slate-600 text-[12px] sm:text-[11px] text-center sm:text-left">
          Czech Mortgage Eligibility Analyzer
        </p>

        <div className="flex items-center gap-4 sm:gap-5">
          <a
            href="#how-it-works"
            onClick={scrollToHowItWorks}
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors min-h-[44px] inline-flex items-center px-2"
          >
            How it works
          </a>
          <button
            onClick={onStart}
            type="button"
            className="btn-cta text-sm px-6 sm:px-7 py-2.5"
          >
            Start Assessment
          </button>
        </div>

      </div>
    </footer>
  )
}
