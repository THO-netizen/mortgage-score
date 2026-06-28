import { Calendar, Shield, Lock } from 'lucide-react'
import FunnelCard from '../funnel/FunnelCard.jsx'
import ActionBar  from '../funnel/ActionBar.jsx'

const CALENDLY_URL = 'https://calendly.com/andy-le/15min'

export default function Step5BankStatement({ onChange, onBack, onContinue }) {
  const handleBook = () => {
    window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer')
    onChange('bankAnalysisStatus', 'skipped')
    onContinue()
  }

  return (
    <FunnelCard
      stepLabel="Step 5 of 7 · Strategy Consultation"
      title="Secure Your Consultation"
      subtitle="To guarantee 100% data privacy, we never ask you to upload sensitive bank statements online. We will review your numbers securely during your strategy session."
      footer={
        <ActionBar
          canContinue
          onBack={onBack}
          onContinue={() => {
            onChange('bankAnalysisStatus', 'skipped')
            onContinue()
          }}
        />
      }
    >

      {/* Privacy-first booking card */}
      <div className="rounded-2xl border-2 border-brand-100 overflow-hidden bg-gradient-to-br from-brand-50/70 to-white">

        {/* Top accent bar */}
        <div className="h-[3px] bg-gradient-to-r from-brand-500 to-brand-700" />

        <div className="p-6">

          {/* Icon + headline */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-11 h-11 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-cta">
              <Lock size={20} className="text-white" />
            </div>
            <div>
              <p className="font-display text-[15px] font-extrabold text-ink leading-snug mb-1">
                Your documents stay completely private
              </p>
              <p className="text-sm text-ink-muted leading-relaxed">
                We review your bank statements and financial history securely during your free
                15-minute strategy session — no uploads, no data exposure, no risk.
              </p>
            </div>
          </div>

          {/* Primary CTA — opens Calendly in new tab AND advances to Step 6 */}
          <button
            type="button"
            onClick={handleBook}
            className={[
              'flex items-center justify-center gap-2.5 w-full rounded-input mb-4',
              'bg-brand-600 text-white font-display font-bold text-[15px]',
              'transition-all duration-200 select-none',
              'hover:bg-brand-700 hover:-translate-y-px hover:shadow-cta-hover',
              'active:translate-y-0 active:shadow-none',
            ].join(' ')}
            style={{ height: '56px' }}
          >
            <Calendar size={17} />
            Book Free Strategy Call via Calendly
          </button>

          {/* Advisor + meta row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                <span className="font-display text-[9px] font-extrabold text-white tracking-tight">AL</span>
              </div>
              <span className="text-xs text-ink-muted font-medium">Andy Le · Mortgage Specialist</span>
            </div>
            <span className="text-[11px] text-ink-subtle">Free · 15 min · No commitment</span>
          </div>

          {/* Privacy guarantee */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-brand-100/80">
            <Shield size={12} className="text-success-DEFAULT flex-shrink-0" />
            <p className="text-[10px] text-ink-subtle leading-relaxed">
              <span className="font-semibold text-ink-muted">100% privacy guaranteed — </span>
              your financial documents are never uploaded, stored, or transmitted online.
            </p>
          </div>

        </div>
      </div>

    </FunnelCard>
  )
}
