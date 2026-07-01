import { useState } from 'react'
import { Clock, X } from 'lucide-react'

// ── How-it-works modal ────────────────────────────────

const MODAL_STEPS = [
  {
    n: 1,
    title: 'Income profile',
    time: '~30 sec',
    desc: 'Select your income structure — salaried employment, self-employed (OSVČ), or company director (s.r.o.). Determines the underwriting methodology applied.',
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
            className="text-ink-subtle hover:text-ink transition-colors p-1 rounded-lg hover:bg-surface"
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

      <main className="min-h-screen bg-hero flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-xl w-full text-center animate-fade-up">

          {/* Overline */}
          <p className="text-[10px] font-bold tracking-widest uppercase text-brand-400 mb-6">
            Czech Mortgage Eligibility Analyzer
          </p>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight mb-5">
            Understand your<br />
            <span className="text-brand-400">mortgage eligibility</span><br />
            before speaking to a bank.
          </h1>

          {/* Sub */}
          <p className="text-slate-400 text-sm sm:text-[15px] max-w-md mx-auto mb-10 leading-relaxed">
            Built for expats, freelancers, and business owners navigating Czech mortgage approval.
          </p>

          {/* Primary CTA */}
          <button
            onClick={onStart}
            type="button"
            className="btn-cta mx-auto text-base px-14 mb-5"
          >
            Start Assessment
          </button>

          {/* Human trust block */}
          <a
            href="https://www.facebook.com/p/Andy-Le-100079180972737/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3.5 mb-5 group"
          >
            <img
              src="/andy-le.png"
              alt="Andy Le"
              className="w-16 h-16 rounded-full object-cover object-top flex-shrink-0 ring-2 ring-white/10 transition-opacity duration-150 group-hover:opacity-80"
            />
            <div className="text-left">
              <p className="text-white text-[13px] font-semibold leading-tight group-hover:text-brand-400 transition-colors duration-150">
                Andy Le
              </p>
              <p className="text-slate-400 text-[11px] leading-snug mt-0.5">
                Mortgage &amp; Property Financing Specialist
              </p>
              <p className="text-brand-400 text-[11px] italic mt-1 leading-snug">
                "Understand your mortgage readiness<br />before speaking to the bank."
              </p>
            </div>
          </a>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 flex-wrap mb-10">
            {['No credit impact', 'No documents required', 'Based on Czech lender criteria'].map((badge) => (
              <span key={badge} className="flex items-center gap-1 text-slate-500 text-[11px]">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="flex-shrink-0">
                  <path d="M2 5L4 7L8 3" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {badge}
              </span>
            ))}
          </div>

          {/* Secondary CTA */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="text-slate-400 hover:text-slate-200 text-sm underline underline-offset-4 decoration-slate-600 hover:decoration-slate-400 transition-colors"
            >
              I'm not sure how it works?
            </button>
          </div>

          {/* Tertiary CTA */}
          <div>
            <a
              href="https://calendly.com/andy-le/15min"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-500 text-[12px] transition-colors"
            >
              Need help understanding your situation?
            </a>
          </div>

        </div>
      </main>
    </>
  )
}
