import { useState, useEffect } from 'react'
import { analytics }       from './services/analytics.js'
import Header              from './components/layout/Header.jsx'
import TrustSidebar        from './components/funnel/TrustSidebar.jsx'
import Step1EntityType     from './components/steps/Step1EntityType.jsx'
import Step2Residence      from './components/steps/Step2Residence.jsx'
import Step3Liabilities    from './components/steps/Step3Liabilities.jsx'
import Step4Property       from './components/steps/Step4Property.jsx'

// ─── Initial form state ───────────────────────────────
const INITIAL_FORM = {
  // Step 1
  entityType: '',

  // Step 2
  residenceStatus: '',
  yearsInCZ: '',

  // Step 3 — Liabilities
  monthlyLoanPayments: 0,
  creditCardLimits:    0,
  monthlyLeasing:      0,
  otherObligations:    0,

  // Step 4 — Property & LTV
  purchasePrice:    5_500_000,
  ownFunds:         1_200_000,
  propertyPurpose:  '',
  purchaseTimeline: '',

  // Step 5 — Bank statement (client-side only)
  bankStatementFile:   null,
  bankAnalysisStatus:  '',
  bankAnalysisResults: null,

  // Step 6 — Email gate
  email: '',

  // Step 7 — Results (derived fields stored for dashboard)
  creditHistory: '',
  primaryGoal:   '',
}

// ─── Landing page placeholder ─────────────────────────
function LandingPlaceholder({ onStart }) {
  return (
    <main className="min-h-screen bg-hero flex items-center justify-center px-4">
      <div className="text-center max-w-xl animate-fade-up">
        <p className="section-label text-slate-400 mb-4">
          Free · Private · Instant
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight mb-4">
          Check Your Czech Mortgage
          <br />
          <span className="text-brand-400">Eligibility in 3 Minutes</span>
        </h1>
        <p className="text-slate-400 text-base mb-10 leading-relaxed">
          Private. Instant. Built for OSVČ and s.r.o.
          <br />No uploads. No hidden checks. No bank commitment.
        </p>
        <button
          onClick={onStart}
          className="btn-cta mx-auto text-base px-10"
          type="button"
        >
          Start Free Check
        </button>
        <p className="mt-4 text-xs text-slate-500">
          No impact on credit score · Takes ~4 minutes
        </p>
      </div>
    </main>
  )
}

// ─── Main App ─────────────────────────────────────────
export default function App() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData,    setFormData]    = useState(INITIAL_FORM)

  useEffect(() => {
    analytics.track('landing_page_viewed', {
      referrer: document.referrer || 'direct',
    })
  }, [])

  // ── Form helpers ─────────────────────────────────────
  const setField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  // ── Navigation ───────────────────────────────────────
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const goToStep = (n) => {
    setCurrentStep(n)
    scrollTop()
  }

  const goNext = () => goToStep(currentStep + 1)
  const goBack = () => goToStep(Math.max(1, currentStep - 1))

  // ── Per-step Continue handlers ────────────────────────
  const handleStart = () => {
    analytics.track('funnel_started')
    goToStep(1)
  }

  const handleStep1Continue = () => {
    analytics.track('step_completed', {
      stepIndex:  1,
      stepName:   'Entity Type',
      entityType: formData.entityType,
    })
    goNext()
  }

  const handleStep2Continue = () => {
    analytics.track('step_completed', {
      stepIndex:       2,
      stepName:        'Residence Status',
      residenceStatus: formData.residenceStatus,
      yearsInCZ:       formData.yearsInCZ,
    })
    goNext()
  }

  const handleStep3Continue = () => {
    const creditCard5pct = Math.round(formData.creditCardLimits * 0.05)
    analytics.track('step_completed', {
      stepIndex:           3,
      stepName:            'Liabilities',
      monthlyLoanPayments: formData.monthlyLoanPayments,
      creditCardLimits:    formData.creditCardLimits,
      creditCard5pct,
      monthlyLeasing:      formData.monthlyLeasing,
      otherObligations:    formData.otherObligations,
      totalObligations:
        formData.monthlyLoanPayments +
        creditCard5pct +
        formData.monthlyLeasing +
        formData.otherObligations,
    })
    goNext()
  }

  const handleStep4Continue = () => {
    const loanAmount = Math.max(0, formData.purchasePrice - formData.ownFunds)
    const ltv = formData.purchasePrice > 0
      ? Math.round((loanAmount / formData.purchasePrice) * 100)
      : 0
    analytics.track('step_completed', {
      stepIndex:       4,
      stepName:        'Property & LTV',
      purchasePrice:   formData.purchasePrice,
      ownFunds:        formData.ownFunds,
      loanAmount,
      ltv,
      propertyPurpose: formData.propertyPurpose,
      purchaseTimeline: formData.purchaseTimeline,
    })
    goNext()
  }

  // ── Layout flags ─────────────────────────────────────
  const isLanding = currentStep === 0
  const isFunnel  = currentStep >= 1 && currentStep <= 7
  const isResults = currentStep === 8

  // ── Render ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface">

      {!isLanding && (
        <Header currentStep={currentStep} totalSteps={7} />
      )}

      {isLanding && (
        <LandingPlaceholder onStart={handleStart} />
      )}

      {isFunnel && (
        <main className="py-8 sm:py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Main funnel area — 8 cols */}
              <div className="lg:col-span-8">
                {/* key re-mounts on each step, re-triggering fade-up */}
                <div key={currentStep} className="animate-fade-up">

                  {currentStep === 1 && (
                    <Step1EntityType
                      value={formData.entityType}
                      onChange={(v) => setField('entityType', v)}
                      onContinue={handleStep1Continue}
                    />
                  )}

                  {currentStep === 2 && (
                    <Step2Residence
                      value={formData.residenceStatus}
                      yearsValue={formData.yearsInCZ}
                      onChange={(v)      => setField('residenceStatus', v)}
                      onYearsChange={(v) => setField('yearsInCZ', v)}
                      onBack={goBack}
                      onContinue={handleStep2Continue}
                    />
                  )}

                  {currentStep === 3 && (
                    <Step3Liabilities
                      data={{
                        monthlyLoanPayments: formData.monthlyLoanPayments,
                        creditCardLimits:    formData.creditCardLimits,
                        monthlyLeasing:      formData.monthlyLeasing,
                        otherObligations:    formData.otherObligations,
                      }}
                      onChange={setField}
                      onBack={goBack}
                      onContinue={handleStep3Continue}
                    />
                  )}

                  {currentStep === 4 && (
                    <Step4Property
                      data={{
                        purchasePrice:    formData.purchasePrice,
                        ownFunds:         formData.ownFunds,
                        propertyPurpose:  formData.propertyPurpose,
                        purchaseTimeline: formData.purchaseTimeline,
                      }}
                      onChange={setField}
                      onBack={goBack}
                      onContinue={handleStep4Continue}
                    />
                  )}

                  {/* Steps 5–7 added in next sessions */}
                  {currentStep > 4 && currentStep <= 7 && (
                    <div className="card-surface px-8 py-12 text-center">
                      <p className="section-label mb-3">
                        Step {currentStep} of 7
                      </p>
                      <p className="text-ink-muted text-sm">
                        Coming in the next build session.
                      </p>
                      <button
                        onClick={goBack}
                        className="btn-ghost mt-6 mx-auto"
                        type="button"
                      >
                        ← Back
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* Trust sidebar — 4 cols, desktop only */}
              <div className="lg:col-span-4">
                <TrustSidebar />
              </div>

            </div>
          </div>
        </main>
      )}

      {isResults && (
        <main className="py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="text-center text-ink-muted">
              Results dashboard — coming soon.
            </p>
          </div>
        </main>
      )}

    </div>
  )
}
