import { useState, useEffect } from 'react'
import { analytics }        from './services/analytics.js'
import Header               from './components/layout/Header.jsx'
import TrustSidebar         from './components/funnel/TrustSidebar.jsx'
import Step1EntityType      from './components/steps/Step1EntityType.jsx'
import Step2Residence       from './components/steps/Step2Residence.jsx'
import Step3Liabilities     from './components/steps/Step3Liabilities.jsx'
import Step4Property        from './components/steps/Step4Property.jsx'
import Step5BankStatement   from './components/steps/Step5BankStatement.jsx'
import Step6LeadCapture     from './components/steps/Step6LeadCapture.jsx'
import Step7Results         from './components/steps/Step7Results.jsx'

// ─── Initial form state ───────────────────────────────
const INITIAL_FORM = {
  // Step 1 — entity type + shared
  entityType:        '',
  ico:               '',
  businessName:      '',
  legalFormLabel:    '',
  businessAgeMonths: null,
  datumVzniku:       '',

  // Step 1 — ARES verification
  icoActiveStatus:          '',    // '' | 'AKTIVNÍ' | other ARES status string

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
  employmentStartDate:   '',     // YYYY-MM
  netMonthlySalary:      null,   // CZK/mo — replaces netIncome for employees
  verificationMethod:    '',     // 'payslips' | 'bank_statement' | 'employer_letter'
  hasMonthlyDiety:       false,
  monthlyDiety:          null,
  hasFxIncome:           false,
  foreignSalaryAmount:   null,
  foreignSalaryCurrency: 'EUR',
  hasOwnership:          false,
  employerOwnershipPct:  null,

  // Kept for backward compat with Step 7 (synced via handleEmployeeChange)
  netIncome:         0,
  contractType:      '',        // 'indefinite' | 'definite' | 'agency' | 'dpc'
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

// ─── Landing page placeholder ─────────────────────────
function LandingPlaceholder({ onStart }) {
  return (
    <main className="min-h-screen bg-hero flex items-center justify-center px-4">
      <div className="text-center max-w-xl animate-fade-up">
        <h1 className="font-display text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight mb-10">
          Check Your Czech Mortgage
          <br />
          <span className="text-brand-400">Eligibility in 3 Minutes</span>
        </h1>
        <button onClick={onStart} className="btn-cta mx-auto text-base px-10" type="button">
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
    analytics.track('landing_page_viewed', { referrer: document.referrer || 'direct' })
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
    analytics.track('step_completed', { stepIndex: 1, stepName: 'Entity Type', entityType: formData.entityType })
    goNext()
  }

  const handleStep2Continue = () => {
    analytics.track('step_completed', { stepIndex: 2, stepName: 'Residence Status', residenceStatus: formData.residenceStatus, yearsInCZ: formData.yearsInCZ })
    goNext()
  }

  const handleStep3Continue = () => {
    const cc5 = Math.round(formData.creditCardLimits * 0.05)
    analytics.track('step_completed', {
      stepIndex: 3, stepName: 'Liabilities',
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
      stepIndex: 4, stepName: 'Property & LTV',
      purchasePrice:    formData.purchasePrice,
      ownFunds:         formData.ownFunds,
      loanAmount, ltv,
      propertyPurpose:  formData.propertyPurpose,
      purchaseTimeline: formData.purchaseTimeline,
    })
    goNext()
  }

  const handleStep5Continue = () => {
    analytics.track('step_completed', {
      stepIndex: 5, stepName: 'Consultation Booking',
      booked:    formData.bankAnalysisStatus === 'skipped',
    })
    goNext()
  }

  const handleStep6Continue = () => {
    analytics.track('step_completed', {
      stepIndex: 6, stepName: 'Lead Capture',
      hasEmail:  !!formData.email,
      hasPhone:  !!formData.leadPhone,
    })
    goNext()  // → step 7 = Results Dashboard
  }

  // ── Layout flags ─────────────────────────────────────
  const isLanding = currentStep === 0
  const isFunnel  = currentStep >= 1 && currentStep <= 6
  const isResults = currentStep === 7

  // ── Render ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface">

      {/* Header — visible for all funnel and results steps */}
      {!isLanding && (
        <Header currentStep={Math.min(currentStep, 7)} totalSteps={7} />
      )}

      {/* ── Landing ──────────────────────────────────── */}
      {isLanding && <LandingPlaceholder onStart={handleStart} />}

      {/* ── Funnel steps 1-6 (8+4 col grid) ─────────── */}
      {isFunnel && (
        <main className="py-8 sm:py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              <div className="lg:col-span-8">
                <div key={currentStep} className="animate-fade-up">

                  {currentStep === 1 && (
                    <Step1EntityType
                      value={formData.entityType}
                      onChange={(v) => setField('entityType', v)}
                      onIcoResult={(r) => setFormData((prev) => ({
                        ...prev,
                        ico:                    r.ico               ?? prev.ico,
                        businessName:           r.businessName      ?? prev.businessName,
                        legalFormLabel:         r.legalFormLabel    ?? prev.legalFormLabel,
                        businessAgeMonths:      r.businessAgeMonths ?? prev.businessAgeMonths,
                        datumVzniku:            r.datumVzniku       ?? prev.datumVzniku,
                        icoActiveStatus:        r.icoActiveStatus   ?? prev.icoActiveStatus,
                        // Auto-fill existence months from ARES for both OSVČ and s.r.o.
                        companyExistenceMonths: r.businessAgeMonths ?? prev.companyExistenceMonths,
                      }))}
                      employeeData={{
                        isProbation:           formData.isProbation,
                        isNoticePeriod:        formData.isNoticePeriod,
                        isOnSickLeave:         formData.isOnSickLeave,
                        isEmployerDistressed:  formData.isEmployerDistressed,
                        contractType:          formData.contractType,
                        employmentStartDate:   formData.employmentStartDate,
                        netMonthlySalary:      formData.netMonthlySalary,
                        verificationMethod:    formData.verificationMethod,
                        hasMonthlyDiety:       formData.hasMonthlyDiety,
                        monthlyDiety:          formData.monthlyDiety,
                        hasFxIncome:           formData.hasFxIncome,
                        foreignSalaryAmount:   formData.foreignSalaryAmount,
                        foreignSalaryCurrency: formData.foreignSalaryCurrency,
                        hasOwnership:          formData.hasOwnership,
                        employerOwnershipPct:  formData.employerOwnershipPct,
                        employmentSector:      formData.employmentSector,
                      }}
                      onEmployeeChange={handleEmployeeChange}
                      businessData={{
                        taxRegime:                   formData.taxRegime,
                        annualTurnover:              formData.annualTurnover,
                        avgMonthlyCreditTurnover:    formData.avgMonthlyCreditTurnover,
                        // ARES-verified identity
                        businessName:                formData.businessName,
                        datumVzniku:                 formData.datumVzniku,
                        icoActiveStatus:             formData.icoActiveStatus,
                        // ESSO v2 fields
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

                  {currentStep === 5 && (
                    <Step5BankStatement
                      formData={formData}
                      onChange={setField}
                      onBack={goBack}
                      onContinue={handleStep5Continue}
                    />
                  )}

                  {currentStep === 6 && (
                    <Step6LeadCapture
                      data={{
                        leadName:    formData.leadName,
                        email:       formData.email,
                        leadPhone:   formData.leadPhone,
                        gdprConsent: formData.gdprConsent,
                      }}
                      formData={formData}
                      onChange={setField}
                      onBack={goBack}
                      onContinue={handleStep6Continue}
                    />
                  )}

                </div>
              </div>

              <div className="lg:col-span-4">
                <TrustSidebar />
              </div>

            </div>
          </div>
        </main>
      )}

      {/* ── Results Dashboard (full-width, step 7) ─── */}
      {isResults && (
        <Step7Results
          formData={formData}
          onBack={goBack}
          onRestart={() => { setFormData(INITIAL_FORM); goToStep(0) }}
        />
      )}

    </div>
  )
}
