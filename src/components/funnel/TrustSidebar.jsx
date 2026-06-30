import { BookOpen, Lightbulb } from 'lucide-react'


export default function TrustSidebar() {
  return (
    <aside className="hidden lg:flex flex-col gap-4 sticky top-24">

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
          <p className="section-label">Assessment Methodology</p>
        </div>
        <p className="text-xs text-ink-muted leading-relaxed">
          Built around standard Czech mortgage evaluation factors, including income
          stability, debt-to-income (DTI), debt service ratios (DSTI), and
          loan-to-value (LTV) considerations. Designed to help expats and
          self-employed applicants better understand mortgage readiness before
          approaching a lender.
        </p>
      </div>

    </aside>
  )
}
