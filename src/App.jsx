import { useState, useCallback, useEffect } from 'react'
import { carouselRegistry } from './hooks/carouselRegistry.js'
import { analytics }           from './services/analytics.js'
import Header                  from './components/layout/Header.jsx'
import HeroAnalysis            from './components/landing/HeroAnalysis.jsx'
import HowItWorksSection       from './components/landing/HowItWorksSection.jsx'
import LandingFooter           from './components/landing/LandingFooter.jsx'
import Step1EntityType         from './components/steps/Step1EntityType.jsx'
import Step2Residence          from './components/steps/Step2Residence.jsx'
import Step3Liabilities        from './components/steps/Step3Liabilities.jsx'
import Step4Property           from './components/steps/Step4Property.jsx'
import ProcessingScreen        from './components/funnel/ProcessingScreen.jsx'
import Step7Results            from './components/steps/Step7Results.jsx'
import TestimonialsCarousel    from './components/testimonials/TestimonialsCarousel.jsx'
import ClientStories           from './components/testimonials/ClientStories.jsx'

// ─── Initial form state ───────────────────────────────
const INITIAL_FORM = {
  // Step 1 — entity type + applicant count
  entityType:         'zamestnanec',
  numberOfApplicants: 1,
  ico:               '',
  businessName:      '',
  legalFormLabel:    '',
  businessAgeMonths: null,
  datumVzniku:       '',

  // Step 1 — ARES verification
  icoActiveStatus:          '',    // '' | 'AKTIVNÍ' | other ARES status string
  businessActivityGap:      false, // true if ARES reports suspension or dissolution history

  // Step 1 — OSVČ / s.r.o. income fields
  taxRegime:                '',    // 'tax_return' | 'flat_tax'
  annualTurnover:           null,  // Integer CZK/year  (tax_return path)
  avgMonthlyCreditTurnover: null,  // Integer CZK/month (flat_tax path)

  // Step 1 — employee eligibility gate (hard-block toggles)
  isProbation:           false,
  isNoticePeriod:        false,
  isOnSickLeave:         false,
  isEmployerDistressed:  false,

  // Step 1 — employee income fields
  netMonthlySalary:      null,   // CZK/mo — clean base salary after taxes
  hasMonthlyDiety:       false,
  monthlyDiety:          null,
  hasFxIncome:           false,
  foreignSalaryAmount:   null,
  foreignSalaryCurrency: 'EUR',
  hasBonus:              false,
  bonusAmount:           null,
  bonusFrequency:        'yearly',  // 'yearly' | 'monthly'

  // Kept for backward compat with Step 7 (synced via handleEmployeeChange)
  netIncome:         0,
  contractType:      '',        // 'indefinite' | 'definite' | 'agency' | 'dpc'
  contractEndDate:   '',        // YYYY-MM — only relevant for 'definite'
  probationPeriod:   '',        // 'yes' | 'no'  (synced from isProbation)
  employmentSector:  '',        // 'health' | 'education' | 'other'

  // Step 1 — s.r.o. director corporate income assessment (ESSO v2)
  // Income stream classification
  companyIncomeStream:         '',     // 'A' | 'B' | 'C' | 'AB' | 'AC'
  companyOwnershipPct:         null,   // integer 0-100
  familyOwnershipPctAggregate: null,   // integer 0-100
  // Corporate financials (actual values — replace boolean flags)
  companyExistenceMonths:      null,   // integer months
  companyAfterTaxResult:       null,   // CZK — positive = profit, negative = hard block
  companyEquity:               null,   // CZK — positive = healthy, negative = hard block
  dividendsPaidLast3Years:     null,   // CZK total over last 3 fiscal years (Stream B)
  annualGrossRevenues:         null,   // CZK/year
  expenseLumpSumPct:           null,   // 30 | 40 | 60 | 80
  directorContractExists:      false,
  // Stream income fields (legacy names kept; Stream A = salary, Stream C = fees)
  sroDirectorSalary:           null,   // CZK/mo — Stream A (odměna jednatele)
  sroDirectorFees:             null,   // CZK/mo — Stream C (Smlouva o výkonu funkce)
  // Deprecated boolean flags (kept for backward compat — engine uses numeric fields above)
  sroNegativeEquity: false,
  sroNegativeProfit: false,
  sroFullFiscalYear: true,
  sroOwnershipPct:   null,
  sroProfitShare:    null,

  // NACE-derived income recognition (set via IČO ARES lookup)
  primaryNace:       '',    // raw NACE code from ARES (e.g. '6201')
  naceSector:        '',    // mapped Czech sector label (e.g. 'IT a technologie')
  turnoverIncomePct: null,  // income recognition % (40|50|60|70); null = use engine default

  // Step 2 — residence + applicant age (for maturity model)
  applicantAge:      35,

  // Step 2 — residence
  residenceStatus: '',
  yearsInCZ:       '',

  // Step 3 — Liabilities
  monthlyLoanPayments: 0,
  creditCardLimits:    0,
  monthlyLeasing:      0,
  otherObligations:    0,

  // Step 4 — Property & LTV
  propertyMode:     'defined',    // 'defined' | 'discovering'
  purchasePrice:    5_500_000,
  ownFunds:         1_200_000,
  propertyPurpose:  '',
  purchaseTimeline: '',

  // Step 5 — Consultation booking
  bankAnalysisStatus: '',   // '' | 'skipped' (set on book/continue)

  // Step 6 — Lead capture
  leadName:    '',
  email:       '',
  leadPhone:   '',
  gdprConsent: false,
}

// ─── Step routing constants ────────────────────────────
// 0: landing  1-4: data collection  5: processing  6: results
const STEP_LANDING    = 0
const STEP_RESULTS    = 6
const STEP_PROCESSING = 5
const TOTAL_DATA_STEPS = 4

// ─── Main App ─────────────────────────────────────────
export default function App() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData,    setFormData]    = useState(INITIAL_FORM)

  useEffect(() => {
    analytics.track('landing_page_viewed', { referrer: document.referrer || 'direct' })
  }, [])

  // ── Global keyboard navigation ────────────────────────
  useEffect(() => {
    function isInViewport(el, threshold = 0.4) {
      if (!el) return false
      const rect = el.getBoundingClientRect()
      const vh   = window.innerHeight
      const overlap = Math.min(rect.bottom, vh) - Math.max(rect.top, 0)
      return overlap / Math.min(rect.height, vh) >= threshold
    }

    function handleKeyDown(e) {
      const tag      = document.activeElement?.tagName?.toUpperCase() ?? ''
      const editable = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || !!document.activeElement?.isContentEditable

      // Enter → click the active Continue/CTA button (skip when typing)
      if (e.key === 'Enter' && !editable) {
        const cta = document.querySelector('button.btn-cta:not([disabled])')
        if (cta) { e.preventDefault(); cta.click(); return }
      }

      // All remaining shortcuts are suppressed when an input has focus
      if (editable) return

      // ArrowLeft / ArrowRight → carousel navigation (priority over page scroll)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const goRight = e.key === 'ArrowRight'
        for (const [, c] of carouselRegistry) {
          if (!isInViewport(c.getElement())) continue
          if (goRight && c.canScrollNext()) { e.preventDefault(); c.scrollNext(); return }
          if (!goRight && c.canScrollPrev()) { e.preventDefault(); c.scrollPrev(); return }
          // Carousel in view but at its end — fall through to natural behaviour
          return
        }
        return
      }

      // ArrowUp / ArrowDown → smooth page scroll
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        window.scrollBy({ top: e.key === 'ArrowDown' ? 350 : -350, behavior: 'smooth' })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ── Form helpers ─────────────────────────────────────
  const setField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  // Employee field handler — syncs legacy fields for Step 7 backward compat
  const handleEmployeeChange = (field, value) =>
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'netMonthlySalary') next.netIncome = Number(value) || 0
      if (field === 'isProbation')      next.probationPeriod = value ? 'yes' : 'no'
      return next
    })

  // ── Navigation ───────────────────────────────────────
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const goToStep  = (n) => { setCurrentStep(n); scrollTop() }
  const goNext    = ()  => goToStep(currentStep + 1)
  const goBack    = ()  => goToStep(Math.max(1, currentStep - 1))

  // ── Step Continue handlers ────────────────────────────
  const handleStart = () => {
    analytics.track('funnel_started')
    goToStep(1)
  }

  const handleStep1Continue = () => {
    analytics.track('step_completed', { stepIndex: 1, stepName: 'Income Profile', entityType: formData.entityType })
    goNext()
  }

  const handleStep2Continue = () => {
    analytics.track('step_completed', { stepIndex: 2, stepName: 'Residence', residenceStatus: formData.residenceStatus, yearsInCZ: formData.yearsInCZ })
    goNext()
  }

  const handleStep3Continue = () => {
    const cc5 = Math.round(formData.creditCardLimits * 0.05)
    analytics.track('step_completed', {
      stepIndex: 3, stepName: 'Existing Debt',
      monthlyLoanPayments: formData.monthlyLoanPayments,
      creditCardLimits:    formData.creditCardLimits,
      creditCard5pct:      cc5,
      monthlyLeasing:      formData.monthlyLeasing,
      otherObligations:    formData.otherObligations,
      totalObligations:    formData.monthlyLoanPayments + cc5 + formData.monthlyLeasing + formData.otherObligations,
    })
    goNext()
  }

  const handleStep4Continue = () => {
    const loanAmount = Math.max(0, formData.purchasePrice - formData.ownFunds)
    const ltv = formData.purchasePrice > 0
      ? Math.round((loanAmount / formData.purchasePrice) * 100) : 0
    analytics.track('step_completed', {
      stepIndex: 4, stepName: 'Property & Financing',
      purchasePrice:    formData.purchasePrice,
      ownFunds:         formData.ownFunds,
      loanAmount, ltv,
      propertyPurpose:  formData.propertyPurpose,
      purchaseTimeline: formData.purchaseTimeline,
    })
    goNext()  // → step 5 = processing screen
  }

  // Called by ProcessingScreen when animation completes
  const handleProcessingComplete = useCallback(() => {
    analytics.track('step_completed', { stepIndex: 5, stepName: 'Processing' })
    goToStep(STEP_RESULTS)
  }, [])

  // ── Layout flags ─────────────────────────────────────
  const isLanding    = currentStep === STEP_LANDING
  const isFunnel     = currentStep >= 1 && currentStep <= TOTAL_DATA_STEPS
  const isProcessing = currentStep === STEP_PROCESSING
  const isResults    = currentStep === STEP_RESULTS

  // ── Render ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface">

      {/* Header — only during data-collection steps (progress 1-4 of 4) */}
      {isFunnel && (
        <Header currentStep={currentStep} totalSteps={TOTAL_DATA_STEPS} />
      )}

      {/* ── Landing ──────────────────────────────────── */}
      {isLanding && (
        <>
          <HeroAnalysis onStart={handleStart} />
          <HowItWorksSection onStart={handleStart} />
          <ClientStories />
          <LandingFooter onStart={handleStart} />
        </>
      )}

      {/* ── Funnel steps 1–4 (8+4 col grid) ─────────── */}
      {isFunnel && (
        <main className="py-8 sm:py-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div key={currentStep} className="animate-fade-up">

                  {currentStep === 1 && (
                    <Step1EntityType
                      value={formData.entityType}
                      onChange={(v) => setField('entityType', v)}
                      numberOfApplicants={formData.numberOfApplicants}
                      onApplicantCountChange={(n) => setField('numberOfApplicants', n)}
                      onIcoResult={(r) => setFormData((prev) => ({
                        ...prev,
                        ico:                    r.ico                    !== undefined ? r.ico                    : prev.ico,
                        businessName:           r.businessName           !== undefined ? r.businessName           : prev.businessName,
                        legalFormLabel:         r.legalFormLabel         !== undefined ? r.legalFormLabel         : prev.legalFormLabel,
                        businessAgeMonths:      r.businessAgeMonths      !== undefined ? r.businessAgeMonths      : prev.businessAgeMonths,
                        datumVzniku:            r.datumVzniku            !== undefined ? r.datumVzniku            : prev.datumVzniku,
                        icoActiveStatus:        r.icoActiveStatus        !== undefined ? r.icoActiveStatus        : prev.icoActiveStatus,
                        companyExistenceMonths: r.businessAgeMonths      !== undefined ? r.businessAgeMonths      : prev.companyExistenceMonths,
                        primaryNace:            r.primaryNace            !== undefined ? r.primaryNace            : prev.primaryNace,
                        naceSector:             r.naceSector             !== undefined ? r.naceSector             : prev.naceSector,
                        turnoverIncomePct:      r.turnoverIncomePct      !== undefined ? r.turnoverIncomePct      : prev.turnoverIncomePct,
                        businessActivityGap:    r.businessActivityGap    !== undefined ? r.businessActivityGap    : prev.businessActivityGap,
                      }))}
                      employeeData={{
                        isProbation:           formData.isProbation,
                        isNoticePeriod:        formData.isNoticePeriod,
                        isOnSickLeave:         formData.isOnSickLeave,
                        isEmployerDistressed:  formData.isEmployerDistressed,
                        contractType:          formData.contractType,
                        contractEndDate:       formData.contractEndDate,
                        netMonthlySalary:      formData.netMonthlySalary,
                        hasMonthlyDiety:       formData.hasMonthlyDiety,
                        monthlyDiety:          formData.monthlyDiety,
                        hasFxIncome:           formData.hasFxIncome,
                        foreignSalaryAmount:   formData.foreignSalaryAmount,
                        foreignSalaryCurrency: formData.foreignSalaryCurrency,
                        hasBonus:              formData.hasBonus,
                        bonusAmount:           formData.bonusAmount,
                        bonusFrequency:        formData.bonusFrequency,
                        employmentSector:      formData.employmentSector,
                      }}
                      onEmployeeChange={handleEmployeeChange}
                      businessData={{
                        taxRegime:                   formData.taxRegime,
                        annualTurnover:              formData.annualTurnover,
                        avgMonthlyCreditTurnover:    formData.avgMonthlyCreditTurnover,
                        businessName:                formData.businessName,
                        datumVzniku:                 formData.datumVzniku,
                        icoActiveStatus:             formData.icoActiveStatus,
                        naceSector:                  formData.naceSector,
                        turnoverIncomePct:           formData.turnoverIncomePct,
                        companyIncomeStream:         formData.companyIncomeStream,
                        companyOwnershipPct:         formData.companyOwnershipPct,
                        familyOwnershipPctAggregate: formData.familyOwnershipPctAggregate,
                        companyExistenceMonths:      formData.companyExistenceMonths,
                        companyAfterTaxResult:       formData.companyAfterTaxResult,
                        companyEquity:               formData.companyEquity,
                        dividendsPaidLast3Years:     formData.dividendsPaidLast3Years,
                        annualGrossRevenues:         formData.annualGrossRevenues,
                        expenseLumpSumPct:           formData.expenseLumpSumPct,
                        directorContractExists:      formData.directorContractExists,
                        sroDirectorSalary:           formData.sroDirectorSalary,
                        sroDirectorFees:             formData.sroDirectorFees,
                        businessActivityGap:         formData.businessActivityGap,
                      }}
                      onBusinessChange={setField}
                      onContinue={handleStep1Continue}
                    />
                  )}

                  {currentStep === 2 && (
                    <Step2Residence
                      value={formData.residenceStatus}
                      yearsValue={formData.yearsInCZ}
                      ageValue={formData.applicantAge}
                      onChange={(v)      => setField('residenceStatus', v)}
                      onYearsChange={(v) => setField('yearsInCZ', v)}
                      onAgeChange={(v)   => setField('applicantAge', v)}
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
                        propertyMode:     formData.propertyMode,
                        purchasePrice:    formData.purchasePrice,
                        ownFunds:         formData.ownFunds,
                        propertyPurpose:  formData.propertyPurpose,
                        purchaseTimeline: formData.purchaseTimeline,
                        applicantAge:     formData.applicantAge,
                      }}
                      onChange={setField}
                      onBack={goBack}
                      onContinue={handleStep4Continue}
                    />
                  )}

            </div>
          </div>
        </main>
      )}

      {/* ── Processing screen (step 5) — full-screen, no header ── */}
      {isProcessing && (
        <ProcessingScreen onComplete={handleProcessingComplete} />
      )}

      {/* ── Results Dashboard (step 6) — full-width ── */}
      {isResults && (
        <>
          <Step7Results
            formData={formData}
            onBack={() => goToStep(STEP_LANDING)}
            onRestart={() => { setFormData(INITIAL_FORM); goToStep(STEP_LANDING) }}
          />
          <TestimonialsCarousel />
        </>
      )}

    </div>
  )
}
