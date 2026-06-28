import { useState } from 'react'
import { Mail, Phone, User, ChevronRight } from 'lucide-react'
import FunnelCard from '../funnel/FunnelCard.jsx'
import ActionBar  from '../funnel/ActionBar.jsx'

const EMAIL_RE      = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FORMSPREE_URL = 'https://formspree.io/f/maqgjlbn'

// Google Forms — extracted entry IDs from FB_PUBLIC_LOAD_DATA_
// Form: "Mortgage Score Leads"
const GF_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSddO9mI3_GJL4W4TzS2atu4vbKAIiI2TUEVRN__GaQJeqeogA/formResponse'
const GF_FIELDS = {
  name:    'entry.1796948790',
  surname: 'entry.1494908840',
  email:   'entry.80055551',
  phone:   'entry.1807846036',
}

function InputRow({ id, label, icon: Icon, type = 'text', value, onChange, placeholder, required, disabled }) {
  return (
    <div>
      <label htmlFor={id} className="section-label mb-2 block">
        {label}
        {required && <span className="text-risk-DEFAULT ml-1">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon size={15} className="text-ink-subtle" />
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="input-field pl-10 disabled:opacity-50 disabled:cursor-not-allowed"
          autoComplete={type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'name'}
        />
      </div>
    </div>
  )
}

const BENEFITS = [
  'Your personalised eligibility score with bank recommendations',
  'Czech mortgage document checklist tailored to your entity type',
  'Step-by-step action plan and timeline for your application',
]

export default function Step6LeadCapture({ data, formData, onChange, onBack, onContinue }) {
  const { leadName = '', email = '', leadPhone = '', gdprConsent = false } = data
  const [submitting, setSubmitting] = useState(false)

  const canContinue =
    leadName.trim().length >= 2 &&
    EMAIL_RE.test(email) &&
    gdprConsent

  const handleSubmit = () => {
    if (!canContinue || submitting) return
    setSubmitting(true)

    // Split "First Surname" → separate Name / Surname fields for Google Forms
    const parts     = leadName.trim().split(/\s+/)
    const gfName    = parts[0] ?? ''
    const gfSurname = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] ?? ''

    // ── Google Forms (fire and forget — no-cors returns opaque response) ──
    const gfBody = new URLSearchParams({
      [GF_FIELDS.name]:    gfName,
      [GF_FIELDS.surname]: gfSurname,
      [GF_FIELDS.email]:   email,
      [GF_FIELDS.phone]:   leadPhone,
    })
    fetch(GF_URL, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    gfBody.toString(),
    }).catch(() => {})

    // ── Formspree (full wizard payload — runs in parallel) ──
    fetch(FORMSPREE_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:  leadName,
        email,
        phone: leadPhone,

        entityType:        formData?.entityType        ?? '',
        ico:               formData?.ico               ?? '',
        businessName:      formData?.businessName      ?? '',
        legalFormLabel:    formData?.legalFormLabel    ?? '',
        businessAgeMonths: formData?.businessAgeMonths ?? null,
        datumVzniku:       formData?.datumVzniku       ?? '',

        tax_regime:                      formData?.taxRegime                    ?? 'N/A',
        annual_turnover_czk:             formData?.annualTurnover               ?? '',
        avg_monthly_credit_turnover_czk: formData?.avgMonthlyCreditTurnover    ?? '',

        contractType:    formData?.contractType    ?? '',
        probationPeriod: formData?.probationPeriod ?? '',
        netIncome:       formData?.netIncome       ?? 0,

        residenceStatus: formData?.residenceStatus ?? '',
        yearsInCZ:       formData?.yearsInCZ       ?? '',

        monthlyLoanPayments: formData?.monthlyLoanPayments ?? 0,
        creditCardLimits:    formData?.creditCardLimits    ?? 0,
        monthlyLeasing:      formData?.monthlyLeasing      ?? 0,
        otherObligations:    formData?.otherObligations    ?? 0,

        purchasePrice:    formData?.purchasePrice    ?? 0,
        ownFunds:         formData?.ownFunds         ?? 0,
        propertyPurpose:  formData?.propertyPurpose  ?? '',
        purchaseTimeline: formData?.purchaseTimeline ?? '',

        bankAnalysisStatus:  formData?.bankAnalysisStatus                    ?? '',
        bankHasRedFlags:     formData?.bankAnalysisResults?.hasRedFlags       ?? null,
        bankRedFlagKeywords: formData?.bankAnalysisResults?.redFlagKeywords   ?? [],

        _subject: `Mortgage prescoring — ${leadName} (${email})`,
      }),
    }).catch(() => {})

    // Advance immediately — both fetches run in background
    // no-cors gives no readable response; Formspree captures full data async
    setTimeout(() => {
      setSubmitting(false)
      onContinue()
    }, 350)
  }

  return (
    <FunnelCard
      stepLabel="Step 6 of 7 · Get Your Full Report"
      title="Where should we send your personalised results?"
      subtitle="We can save your result and send you the full report, checklist and next steps by email."
      footer={
        <ActionBar
          canContinue={canContinue}
          loading={submitting}
          loadingLabel="Sending…"
          onBack={onBack}
          onContinue={handleSubmit}
        />
      }
    >

      {/* ── What you'll receive ───────────────────────── */}
      <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 mb-6">
        <p className="text-xs font-semibold text-brand-700 mb-2.5">
          What you'll receive:
        </p>
        <ul className="space-y-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <ChevronRight size={12} className="text-brand-500 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-brand-700 leading-relaxed">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Form fields ───────────────────────────────── */}
      <div className="space-y-4 mb-6">

        <InputRow
          id="leadName"
          label="Full Name"
          icon={User}
          value={leadName}
          onChange={(v) => onChange('leadName', v)}
          placeholder="Your full name"
          required
          disabled={submitting}
        />

        <InputRow
          id="email"
          label="Email Address"
          icon={Mail}
          type="email"
          value={email}
          onChange={(v) => onChange('email', v)}
          placeholder="you@example.com"
          required
          disabled={submitting}
        />

        <InputRow
          id="leadPhone"
          label="Phone Number"
          icon={Phone}
          type="tel"
          value={leadPhone}
          onChange={(v) => onChange('leadPhone', v)}
          placeholder="+420 or international format"
          disabled={submitting}
        />

      </div>

      {/* ── GDPR consent ─────────────────────────────── */}
      <label className="flex items-start gap-3 cursor-pointer group mb-6">
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={gdprConsent}
            onChange={(e) => onChange('gdprConsent', e.target.checked)}
            disabled={submitting}
            className="sr-only"
          />
          <div
            className={[
              'w-5 h-5 rounded-[5px] border-2 flex items-center justify-center',
              'transition-all duration-150',
              gdprConsent
                ? 'bg-brand-600 border-brand-600'
                : 'bg-card border-border group-hover:border-brand-400',
              submitting ? 'opacity-50' : '',
            ].join(' ')}
          >
            {gdprConsent && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path
                  d="M1 4L3.5 6.5L9 1"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
        <span className="text-xs text-ink-muted leading-relaxed">
          I agree to receive my mortgage eligibility report and related guidance by email.
          My data will be processed in accordance with Czech GDPR regulations and will
          never be shared with banks or third parties without my explicit consent.{' '}
          <span className="text-brand-600 font-medium">Required *</span>
        </span>
      </label>

    </FunnelCard>
  )
}
