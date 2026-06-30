import { useState } from 'react'
import { Mail, Phone, User, ChevronDown, Download } from 'lucide-react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const GF_URL    = 'https://docs.google.com/forms/d/e/1FAIpQLSddO9mI3_GJL4W4TzS2atu4vbKAIiI2TUEVRN__GaQJeqeogA/formResponse'
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
          <Icon size={14} className="text-ink-subtle" />
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

export default function InlineLeadCapture({ formData }) {
  const [open,        setOpen]        = useState(false)
  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [phone,       setPhone]       = useState('')
  const [gdpr,        setGdpr]        = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [submitted,   setSubmitted]   = useState(false)

  const canSubmit = name.trim().length >= 2 && EMAIL_RE.test(email) && gdpr && !submitting

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)

    const parts     = name.trim().split(/\s+/)
    const gfName    = parts[0] ?? ''
    const gfSurname = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] ?? ''

    fetch(GF_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        [GF_FIELDS.name]:    gfName,
        [GF_FIELDS.surname]: gfSurname,
        [GF_FIELDS.email]:   email,
        [GF_FIELDS.phone]:   phone,
      }).toString(),
    }).catch(() => {})

    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
    }, 400)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-success-border bg-success-light px-6 py-8 mt-8 text-center animate-fade-up">
        <div className="w-12 h-12 rounded-full bg-success-DEFAULT/10 flex items-center justify-center mx-auto mb-4">
          <Mail size={22} className="text-success-DEFAULT" />
        </div>
        <p className="font-display text-[15px] font-bold text-success-text mb-1">
          Assessment sent
        </p>
        <p className="text-[12px] text-success-text/80 leading-relaxed">
          Your eligibility assessment has been sent to <strong>{email}</strong>.
          Check your inbox within a few minutes.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card mt-8 overflow-hidden">

      {/* Collapsed trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 hover:bg-surface transition-colors focus:outline-none group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
            <Download size={16} className="text-brand-600" />
          </div>
          <div className="text-left">
            <p className="text-[14px] font-semibold text-ink">Email my assessment</p>
            <p className="text-[11px] text-ink-subtle mt-0.5">
              Optional — receive the full output by email
            </p>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={[
            'text-ink-subtle flex-shrink-0 transition-transform duration-200',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      {/* Expanded form */}
      {open && (
        <form onSubmit={handleSubmit} className="px-6 pb-6 border-t border-border animate-fade-up">
          <p className="text-[12px] text-ink-muted leading-relaxed mt-5 mb-5">
            Enter your details below and we will email your full eligibility assessment,
            document checklist, and next steps. No account required.
          </p>

          <div className="space-y-4 mb-5">
            <InputRow
              id="il-name" label="Full Name" icon={User}
              value={name} onChange={setName}
              placeholder="Your full name" required disabled={submitting}
            />
            <InputRow
              id="il-email" label="Email Address" icon={Mail} type="email"
              value={email} onChange={setEmail}
              placeholder="you@example.com" required disabled={submitting}
            />
            <InputRow
              id="il-phone" label="Phone Number (optional)" icon={Phone} type="tel"
              value={phone} onChange={setPhone}
              placeholder="+420 or international format" disabled={submitting}
            />
          </div>

          {/* GDPR */}
          <label className="flex items-start gap-3 cursor-pointer group mb-5">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox" checked={gdpr}
                onChange={(e) => setGdpr(e.target.checked)}
                disabled={submitting} className="sr-only"
              />
              <div className={[
                'w-5 h-5 rounded-[5px] border-2 flex items-center justify-center',
                'transition-all duration-150',
                gdpr ? 'bg-brand-600 border-brand-600' : 'bg-card border-border group-hover:border-brand-400',
                submitting ? 'opacity-50' : '',
              ].join(' ')}>
                {gdpr && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-[11px] text-ink-muted leading-relaxed">
              I agree to receive my assessment by email. Data processed under Czech GDPR
              regulations and not shared with third parties without consent.{' '}
              <span className="text-brand-600 font-medium">Required *</span>
            </span>
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className={[
              'btn-cta w-full text-sm',
              !canSubmit ? 'opacity-40 cursor-not-allowed' : '',
            ].join(' ')}
          >
            {submitting ? 'Sending…' : 'Send assessment output'}
          </button>
        </form>
      )}

    </div>
  )
}
