import { useState, useRef, useEffect } from 'react'
import { Shield, Lock, CheckCircle } from 'lucide-react'
import { analytics } from '../../services/analytics.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const GF_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSddO9mI3_GJL4W4TzS2atu4vbKAIiI2TUEVRN__GaQJeqeogA/formResponse'
const GF_FIELDS = {
  name: 'entry.1796948790',
  surname: 'entry.1494908840',
  email: 'entry.80055551',
  phone: 'entry.1807846036',
}

export default function LeadGate({ onUnlock }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const nameRef = useRef(null)
  const emailRef = useRef(null)
  const errorRef = useRef(null)

  useEffect(() => {
    analytics.track('lead_gate_viewed')
  }, [])

  const validate = () => {
    const e = {}
    if (!name.trim() || name.trim().length < 2) e.name = 'Please enter your full name.'
    if (!email.trim()) e.email = 'Please enter your email address.'
    else if (!EMAIL_RE.test(email.trim())) e.email = 'Please enter a valid email address.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting || submitted) return

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      const firstField = validationErrors.name ? nameRef.current : emailRef.current
      firstField?.focus()
      return
    }

    setErrors({})
    setSubmitError('')
    setSubmitting(true)
    analytics.track('lead_submission_started')

    try {
      const trimmedName = name.trim()
      const parts = trimmedName.split(/\s+/)
      const gfName = parts[0] ?? ''
      const gfSurname = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] ?? ''

      await fetch(GF_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          [GF_FIELDS.name]: gfName,
          [GF_FIELDS.surname]: gfSurname,
          [GF_FIELDS.email]: email.trim().toLowerCase(),
          [GF_FIELDS.phone]: phone.trim(),
        }).toString(),
      })

      setSubmitted(true)
      analytics.track('lead_submission_succeeded')

      setTimeout(() => {
        onUnlock(trimmedName)
      }, 600)
    } catch (err) {
      console.error('[LeadGate] submission error:', err)
      setSubmitting(false)
      setSubmitError("We couldn't unlock your assessment right now. Your answers are saved. Please try again.")
      analytics.track('lead_submission_failed')
      setTimeout(() => errorRef.current?.focus(), 100)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface">
        <div className="text-center animate-fade-up">
          <div className="w-14 h-14 rounded-full bg-success-DEFAULT/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-success-DEFAULT" />
          </div>
          <p className="font-display text-xl font-black text-ink">Opening your assessment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 bg-surface">
      <div className="w-full max-w-[400px]">

        <div className="text-center mb-6">
          <p className="text-[10px] font-bold tracking-widest uppercase text-bronze mb-2">
            Your private assessment is ready
          </p>
          <h1 className="font-display text-xl sm:text-2xl font-black text-ink leading-tight mb-2">
            See your mortgage position and strongest next step.
          </h1>
          <p className="text-[13px] text-ink-muted leading-relaxed">
            Enter your details to unlock your personalised assessment.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 mb-5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-subtle mb-2">Your assessment includes:</p>
          <ul className="space-y-1.5">
            {[
              'Estimated mortgage capacity',
              'Financing position & risk band',
              'Key strengths identified',
              'Primary limiting factor',
              'Tailored action plan',
              'Videos selected for your situation',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-[12px] text-ink-muted">
                <CheckCircle size={11} className="text-success-DEFAULT flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
          <div>
            <label htmlFor="gate-name" className="text-[11px] font-semibold text-ink-subtle uppercase tracking-wide mb-1.5 block">
              Full Name <span className="text-risk-DEFAULT">*</span>
            </label>
            <input
              ref={nameRef}
              id="gate-name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: '' })) }}
              placeholder="Your full name"
              disabled={submitting}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'gate-name-error' : undefined}
              className="input-field disabled:opacity-50"
            />
            {errors.name && (
              <p id="gate-name-error" role="alert" className="text-[11px] text-risk-DEFAULT mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="gate-email" className="text-[11px] font-semibold text-ink-subtle uppercase tracking-wide mb-1.5 block">
              Email Address <span className="text-risk-DEFAULT">*</span>
            </label>
            <input
              ref={emailRef}
              id="gate-email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: '' })) }}
              placeholder="your@email.com"
              disabled={submitting}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'gate-email-error' : undefined}
              className="input-field disabled:opacity-50"
            />
            {errors.email && (
              <p id="gate-email-error" role="alert" className="text-[11px] text-risk-DEFAULT mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="gate-phone" className="text-[11px] font-semibold text-ink-subtle uppercase tracking-wide mb-1.5 block">
              Phone <span className="text-ink-subtle font-normal">(optional)</span>
            </label>
            <input
              id="gate-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+420 ..."
              disabled={submitting}
              className="input-field disabled:opacity-50"
            />
          </div>

          {submitError && (
            <div ref={errorRef} role="alert" aria-live="assertive" tabIndex={-1}
              className="rounded-lg border border-risk-border bg-risk-light px-4 py-3">
              <p className="text-[12px] text-risk-text leading-relaxed">{submitError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-cta w-full justify-center text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>
                Unlocking...
              </span>
            ) : (
              <>
                <Lock size={14} className="flex-shrink-0" />
                Reveal my assessment
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-ink-subtle leading-relaxed mt-4 text-center">
          We'll use your details to deliver this assessment and contact you about your mortgage situation.{' '}
          <a href="https://www.mortgagescore.cz/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
            Privacy Policy
          </a>
        </p>

        <div className="flex items-center justify-center gap-2 mt-5 opacity-60">
          <Shield size={12} className="text-ink-subtle" />
          <span className="text-[10px] text-ink-subtle">Assessed by Andy Le — Czech mortgage specialist</span>
        </div>

      </div>
    </div>
  )
}
