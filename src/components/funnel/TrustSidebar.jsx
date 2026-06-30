import { Shield, BookOpen, Lightbulb } from 'lucide-react'

const securityPoints = [
  'Zero-exposure data architecture',
  'Private, local-first assessment',
  'Bank-grade methodology standards',
  'No account registration required',
]


export default function TrustSidebar() {
  return (
    <aside className="hidden lg:flex flex-col gap-4 sticky top-24">

      {/* ── Mortgage Intelligence & Security (dark card) ── */}
      <div className="bg-hero rounded-card p-6 text-white">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-sm leading-tight">
              Mortgage Intelligence &amp; Security
            </p>
            <p className="text-slate-400 text-xs mt-0.5">
              Built for expat &amp; self-employed applicants
            </p>
          </div>
        </div>

        <ul className="space-y-2.5 mb-5">
          {securityPoints.map((pt) => (
            <li key={pt} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-success-DEFAULT/20 flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4L3 5.5L6.5 2" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="text-xs text-slate-300 leading-relaxed">{pt}</span>
            </li>
          ))}
        </ul>

        <p className="text-[11px] text-slate-400 leading-relaxed border-t border-white/10 pt-4">
          We transform complex Czech financial data into clear mortgage insights. Our
          mission is to evaluate your borrowing capacity with total discretion and precision.
        </p>
      </div>

      {/* ── Advisor profile (light card) ─────────────── */}
      <div className="card-surface p-6">

        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <Lightbulb size={13} className="text-brand-500 flex-shrink-0" />
          <p className="section-label">Mortgage &amp; Financial Assessment</p>
        </div>

        {/* Avatar + name block */}
        <a
          href="https://www.facebook.com/p/Andy-Le-100079180972737/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 mb-4 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-cta transition-opacity duration-150 group-hover:opacity-80">
            <span className="font-display text-sm font-extrabold text-white tracking-tight">AL</span>
          </div>
          <div>
            <p className="font-display text-sm font-extrabold text-ink leading-tight group-hover:text-brand-600 transition-colors duration-150">Andy Le</p>
            <p className="text-[11px] text-ink-muted leading-snug mt-0.5">
              Mortgage &amp; Property Financing Specialist
            </p>
          </div>
        </a>

        {/* Tagline */}
        <p className="text-xs font-semibold text-brand-600 italic mb-4 leading-snug">
          "Understand your mortgage readiness before speaking to the bank."
        </p>

        {/* Bio */}
        <p className="text-xs text-ink-muted leading-relaxed mb-4">
          At Mortgage Score, we help expats, freelancers, and business owners
          understand how Czech lenders evaluate their financial profile. Our goal
          is to provide clarity on borrowing capacity, risk factors, and mortgage
          readiness before entering the bank process.
        </p>

        {/* Summary line */}
        <p className="text-[11px] text-ink-subtle leading-relaxed pt-4 border-t border-border">
          Financial Clarity, Mortgage Readiness, and Informed Decisions — all in one place.
        </p>

      </div>

      {/* ── Methodology note (light card) ────────────── */}
      <div className="card-surface p-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={13} className="text-ink-subtle" />
          <p className="section-label">Scoring methodology</p>
        </div>
        <p className="text-xs text-ink-muted leading-relaxed">
          Calibrated against Czech National Bank (CNB) regulations and live
          underwriting criteria from 19 active Czech mortgage lenders.
          Updated quarterly by specialist mortgage brokers.
        </p>
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-brand-500 flex-shrink-0" />
            <p className="text-[11px] text-ink-subtle italic">
              Not a sales tool. Built by Czech mortgage specialists
              for international clients.
            </p>
          </div>
        </div>
      </div>

    </aside>
  )
}
