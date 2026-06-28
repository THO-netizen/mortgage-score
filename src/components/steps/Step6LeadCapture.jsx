import { Mail, Phone, User, ChevronRight } from 'lucide-react'
import FunnelCard from '../funnel/FunnelCard.jsx'
import ActionBar  from '../funnel/ActionBar.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function InputRow({ id, label, icon: Icon, type = 'text', value, onChange, placeholder, required }) {
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
          className="input-field pl-10"
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

export default function Step6LeadCapture({ data, onChange, onBack, onContinue }) {
  const { leadName = '', email = '', leadPhone = '', gdprConsent = false } = data

  const canContinue =
    leadName.trim().length >= 2 &&
    EMAIL_RE.test(email) &&
    gdprConsent

  return (
    <FunnelCard
      stepLabel="Step 6 of 7 · Get Your Full Report"
      title="Where should we send your personalised results?"
      subtitle="We can save your result and send you the full report, checklist and next steps by email."
      footer={
        <ActionBar
          canContinue={canContinue}
          onBack={onBack}
          onContinue={onContinue}
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
        />

        <InputRow
          id="leadPhone"
          label="Phone Number"
          icon={Phone}
          type="tel"
          value={leadPhone}
          onChange={(v) => onChange('leadPhone', v)}
          placeholder="+420 or international format"
        />

      </div>

      {/* ── GDPR consent ─────────────────────────────── */}
      <label className="flex items-start gap-3 cursor-pointer group mb-6">
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={gdprConsent}
            onChange={(e) => onChange('gdprConsent', e.target.checked)}
            className="sr-only"
          />
          <div
            className={[
              'w-5 h-5 rounded-[5px] border-2 flex items-center justify-center',
              'transition-all duration-150',
              gdprConsent
                ? 'bg-brand-600 border-brand-600'
                : 'bg-card border-border group-hover:border-brand-400',
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
