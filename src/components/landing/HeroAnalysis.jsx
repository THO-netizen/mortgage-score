import { useState } from 'react'
import { Clock, X } from 'lucide-react'

// ── How-it-works modal ────────────────────────────────

const MODAL_STEPS = [
  {
    n: 1,
    title: 'Income profile',
    time: '~30 sec',
    desc: 'Select your income structure — salaried employment, self-employed, or company director. Determines the underwriting methodology applied.',
  },
  {
    n: 2,
    title: 'Residence & background',
    time: '~20 sec',
    desc: 'Residence status and time in the Czech Republic. Sets which lenders and LTV limits apply to your profile.',
  },
  {
    n: 3,
    title: 'Existing debt obligations',
    time: '~30 sec',
    desc: 'Current monthly obligations — loans, leasing, and credit card limits. Used to calculate your debt service ratio.',
  },
  {
    n: 4,
    title: 'Property & financing',
    time: '~30 sec',
    desc: 'Purchase price, own funds, and property purpose. Determines your LTV position and maximum eligible loan.',
  },
]

function HowItWorksModal({ onClose, onStart }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-black text-ink">How the assessment works</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-subtle hover:text-ink transition-colors p-2 -mr-2 rounded-lg hover:bg-surface min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={17} />
          </button>
        </div>

        <p className="text-sm text-ink-muted leading-relaxed mb-6">
          Four short questions. No documents required. The tool runs your inputs through Czech
          bank underwriting parameters and returns an eligibility score and borrowing range.
        </p>

        {/* Steps */}
        <div className="space-y-4 mb-6">
          {MODAL_STEPS.map(({ n, title, time, desc }) => (
            <div key={n} className="flex gap-3.5">
              <div className="w-7 h-7 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-brand-600">
                {n}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-ink">{title}</p>
                  <span className="text-[10px] text-ink-subtle">{time}</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Time summary */}
        <div className="flex items-center gap-2 text-[11px] text-ink-subtle border-t border-border pt-4 mb-6">
          <Clock size={11} className="flex-shrink-0" />
          <span>Total: approximately 2 minutes. No account or documents required.</span>
        </div>

        {/* CTA */}
        <button type="button" onClick={onStart} className="btn-cta w-full justify-center">
          Start Assessment
        </button>
      </div>
    </div>
  )
}

// ── Hero ──────────────────────────────────────────────

export default function HeroAnalysis({ onStart }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      {showModal && (
        <HowItWorksModal
          onClose={() => setShowModal(false)}
          onStart={onStart}
        />
      )}

      <main className="min-h-[100svh] bg-hero flex flex-col items-center justify-center px-5 sm:px-6 py-12 sm:py-16 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-xl w-full text-center animate-fade-up">

          {/* Headline — concise, scannable on mobile */}
          <h1 className="font-display text-[1.75rem] sm:text-4xl md:text-5xl font-black text-white leading-[1.15] tracking-tight mb-3 sm:mb-5">
            See how much you<br className="sm:hidden" /> may borrow{' '}
            <span className="text-brand-400">in Czechia</span>
          </h1>

          {/* Subheadline — one sentence */}
          <p className="text-slate-400 text-[15px] sm:text-base max-w-sm sm:max-w-md mx-auto mb-6 sm:mb-8 leading-relaxed">
            Get an instant estimate of your mortgage range, approval risks and next best step.
          </p>

          {/* Trust badges — compact horizontal row */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap mb-6 sm:mb-8">
            {[
              { label: '2 min', icon: true },
              { label: 'No documents', icon: true },
              { label: 'No credit check', icon: true },
            ].map(({ label }) => (
              <span key={label} className="flex items-center gap-1.5 text-slate-400 text-[13px] sm:text-sm">
                <svg width="12" height="12" viewBox="0 0 10 10" fill="none" className="flex-shrink-0">
                  <path d="M2 5L4 7L8 3" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {label}
              </span>
            ))}
          </div>

          {/* Primary CTA — large touch target */}
          <div className="mb-6 sm:mb-8">
            <button
              onClick={onStart}
              type="button"
              className="btn-cta w-full sm:w-auto mx-auto text-base px-10 sm:px-14"
            >
              Check My Mortgage Options
            </button>
          </div>

          {/* Andy Le trust block — compact single row on mobile */}
          <div className="mb-5 sm:mb-6">
            <a
              href="https://www.facebook.com/p/Andy-Le-100079180972737/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 group py-2"
            >
              <img
                src="/andy-le.png"
                alt="Andy Le"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover object-top flex-shrink-0 ring-2 ring-white/10 transition-opacity duration-150 group-hover:opacity-80"
              />
              <div className="text-left">
                <p className="text-white text-[13px] sm:text-sm font-semibold leading-tight group-hover:text-brand-400 transition-colors duration-150">
                  Andy Le
                  <span className="text-slate-500 font-normal text-[11px] sm:text-xs ml-1.5">
                    Mortgage Specialist
                  </span>
                </p>
                <p className="text-brand-400/80 text-[12px] sm:text-[13px] italic mt-0.5 leading-snug">
                  &ldquo;Understand your readiness before speaking to the bank.&rdquo;
                </p>
              </div>
            </a>
          </div>

          {/* Secondary CTA */}
          <div className="mb-3 sm:mb-4">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="text-slate-400 hover:text-slate-200 text-sm underline underline-offset-4 decoration-slate-600 hover:decoration-slate-400 transition-colors py-2 px-3 min-h-[44px] inline-flex items-center"
            >
              I&apos;m not sure how it works?
            </button>
          </div>

          {/* Tertiary CTA */}
          <div>
            <a
              href="https://calendly.com/andy-lkadvisor/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-400 text-[13px] transition-colors py-2 px-3 min-h-[44px] inline-flex items-center"
            >
              Need help understanding your situation?
            </a>
          </div>

        </div>
      </main>
    </>
  )
}
