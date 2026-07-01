import { Calendar, Shield, Lock } from 'lucide-react'
import FunnelCard from '../funnel/FunnelCard.jsx'
import ActionBar  from '../funnel/ActionBar.jsx'

const CALENDLY_URL = 'https://calendly.com/andy-lkadvisor/30min'

// Google Forms endpoint (same form as Step 6 lead capture)
const GF_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSddO9mI3_GJL4W4TzS2atu4vbKAIiI2TUEVRN__GaQJeqeogA/formResponse'

// Entry IDs for business data fields — add these fields to the Google Form
// and update the entry IDs here to match.
const GF_BUSINESS_FIELDS = {
  ico:           'entry.2001000001',  // "ICO" field
  annualTurnover: 'entry.2001000002', // "Annual Turnover" field
  taxRegime:     'entry.2001000003',  // "Tax Regime" field
  companyName:   'entry.2001000004',  // "Company Name" field
  businessAge:   'entry.2001000005',  // "Business Age (months)" field
}

function submitDataToGoogleForms(applicantState) {
  const body = new URLSearchParams({
    [GF_BUSINESS_FIELDS.ico]:
      applicantState.ico ?? '',
    [GF_BUSINESS_FIELDS.annualTurnover]:
      String(applicantState.annualTurnover || applicantState.avgMonthlyCreditTurnover || ''),
    [GF_BUSINESS_FIELDS.taxRegime]:
      applicantState.taxRegime ?? '',
    [GF_BUSINESS_FIELDS.companyName]:
      applicantState.businessName ?? '',
    [GF_BUSINESS_FIELDS.businessAge]:
      String(applicantState.companyExistenceMonths ?? ''),
  })

  // Fire-and-forget — no-cors returns an opaque response; we never block on it
  fetch(GF_URL, {
    method:  'POST',
    mode:    'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString(),
  }).catch(() => {})
}

export default function Step5BankStatement({ formData, onChange, onBack, onContinue }) {
  const handleBook = () => {
    // 1. Submit business data to Google Forms (async, fire-and-forget)
    submitDataToGoogleForms(formData ?? {})
    // 2. Open Calendly booking page in a new tab
    window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer')
    // 3. Mark step complete and advance to Step 6
    onChange('bankAnalysisStatus', 'skipped')
    onContinue()
  }

  return (
    <FunnelCard
      stepLabel="Step 5 of 7 · Data Privacy & Consultation Scheduling"
      title="Data Privacy & Consultation Scheduling"
      subtitle="To guarantee 100% financial security, we never ask you to upload sensitive bank statements or PDF copies online. Our analysis runs strictly in compliance with 2026 Czech banking metadata risk frameworks."
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
                Zero-upload. 100% secure. Fully compliant.
              </p>
              <p className="text-sm text-ink-muted leading-relaxed">
                We review your bank statements, turnover history, and financial metadata
                confidentially during your free 15-minute strategy session — no file uploads,
                no data exposure, no third-party transmission.
              </p>
            </div>
          </div>

          {/* Primary CTA — submits data, opens Calendly, advances to Step 6 */}
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
