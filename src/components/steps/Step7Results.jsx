import { useState, useEffect } from 'react'
import {
  AlertTriangle, CheckCircle, TrendingUp, Home,
  Shield, DollarSign, FileText, BarChart2, Calendar,
  Users, Award, MapPin, RotateCcw, Info,
  Briefcase, Activity, ChevronDown, Building2,
} from 'lucide-react'
import { formatCZK, formatCZKShort } from '../../utils/formatters.js'
import { generateMortgagePdf } from '../../utils/generatePdf.js'
import {
  computeScore, computeMortgageProfile,
  monthlyPayment, annuityFactor,
  getMaxLTV, getMaxDTI, calcMaxMaturity,
  BANK_NAMES, BANK_KEYS,
  CONTRACT_RATE_PA, DUAL_STRESS_RATE_PA,
} from '../../utils/scoringEngine.js'
import HowItWorks        from '../results/HowItWorks.jsx'
import InlineLeadCapture from '../results/InlineLeadCapture.jsx'

// ── Constants ──────────────────────────────────────────

const GAUGE_R    = 60
const GAUGE_CIRC = 2 * Math.PI * GAUGE_R

const TIMELINE_STEPS = [
  { label: 'Pre-scoring Check',        desc: 'Free eligibility assessment complete — you are here.',                                                              done: true,  current: true  },
  { label: 'Property Search & Offer',  desc: 'Locate your property and agree a purchase price with the seller.',                                                  done: false, current: false },
  { label: 'Reservation Agreement',    desc: 'Reservation Agreement — secure the property with a 3–5% deposit paid to the seller.',                             done: false, current: false },
  { label: 'Bank Pre-approval',        desc: 'Submit indicative application to selected lenders for competing offers.',                                           done: false, current: false },
  { label: 'Property Appraisal',       desc: 'Property Appraisal — bank-commissioned valuer confirms market value.',                         done: false, current: false },
  { label: 'Full Mortgage Application',desc: 'Submit complete document package: income evidence, bank statements, company financials.',                           done: false, current: false },
  { label: 'Bank Underwriting',        desc: 'Credit committee review — typically 10–20 working days for self-employed and company director applicants.',        done: false, current: false },
  { label: 'Mortgage Contract',        desc: 'Mortgage Contract signed; disbursement conditions and drawdown date confirmed.',                                    done: false, current: false },
  { label: 'Land Registry Filing',     desc: 'Land Registry — property lien registered against the title deed.',                                                  done: false, current: false },
  { label: 'Property Handover',        desc: 'Property Handover — keys exchanged, mortgage live, ownership transferred.',                                         done: false, current: false },
]

const STATUS_CFG = {
  strong: { label: 'Strong',       cls: 'badge-success' },
  good:   { label: 'Good',         cls: 'badge bg-brand-50 text-brand-700 border border-brand-100' },
  review: { label: 'Needs Review', cls: 'badge-warning' },
  risk:   { label: 'Risk',         cls: 'badge-risk'    },
}

const RISK_MATRIX_CFG = {
  zelena:   { label: 'Strong Profile',        color: '#10B981', bg: 'bg-success-light',  border: 'border-success-border',  text: 'text-success-text'  },
  oranzova: { label: 'Review Suggested',      color: '#F59E0B', bg: 'bg-warning-light',  border: 'border-warning-border',  text: 'text-warning-text'  },
  cervena:  { label: 'Significant Constraint',color: '#EF4444', bg: 'bg-risk-light',     border: 'border-risk-border',     text: 'text-risk-text'     },
}

// ── scoreCfg ──────────────────────────────────────────

function scoreCfg(score) {
  if (score >= 75) return { label: 'Strong Applicant', color: '#10B981', badge: 'badge-success' }
  if (score >= 55) return { label: 'Good Standing',    color: '#3B82F6', badge: 'bg-brand-50 text-brand-700 border border-brand-100 badge' }
  if (score >= 35) return { label: 'Needs Review',     color: '#F59E0B', badge: 'badge-warning' }
  return               { label: 'High Risk',           color: '#EF4444', badge: 'badge-risk' }
}

// ── Readiness factor builder ───────────────────────────

function buildFactors(f, simNetIncome) {
  const {
    entityType = '', residenceStatus = '', yearsInCZ = '',
    monthlyLoanPayments = 0, creditCardLimits = 0,
    monthlyLeasing = 0, otherObligations = 0,
    purchasePrice = 0, ownFunds = 0,
    propertyPurpose = '', purchaseTimeline = '',
    bankAnalysisStatus = '',
    businessName = '', businessAgeMonths = null,
    contractType = '', probationPeriod = '', isProbation = false, employmentSector = '',
    applicantAge = 35,
    // ESSO v2 fields
    companyIncomeStream = '', companyOwnershipPct = null, companyExistenceMonths = null,
    companyAfterTaxResult = null, companyEquity = null, directorContractExists = false,
    sroDirectorSalary = null, sroDirectorFees = null,
    // v1 boolean fallbacks
    sroNegativeEquity = false, sroNegativeProfit = false, sroFullFiscalYear = true,
    sroOwnershipPct = null,
  } = f

  // Use sim income if formData has none (non-employee path)
  const resolvedIncome = f.netMonthlySalary > 0 ? f.netMonthlySalary : f.netIncome
  const incomeForCalc = (resolvedIncome > 0 ? resolvedIncome : simNetIncome) || 0

  const profile = computeMortgageProfile({ ...f, netIncome: incomeForCalc })
  const { existingDebt, ltvPct, maxLTVPct, dtiRatio, maxDTIVal, maturity,
    eX, eXStress, eXBase, varX, dstiAtEX, bottleneck, flags, redFlags } = profile

  const loan = Math.max(0, purchasePrice - ownFunds)
  const own  = purchasePrice > 0 ? (ownFunds / purchasePrice) * 100 : 0

  const RL = {
    eu: 'EU / EEA Citizen', permanent: 'Permanent Residence',
    longterm5plus: 'Long-term 5+ yrs', longterm: 'Long-term Residence',
    employment: 'Long-term (Work/Business)', other: 'Other / Student',
  }
  const YL = { 'less1': '<1 yr', '1-2': '1–2 yrs', '2-5': '2–5 yrs', '5-10': '5–10 yrs', '10plus': '10+ yrs' }
  const PL = { primary: 'Primary Residence', investment: 'Investment / Rental', holiday: 'Holiday Home' }
  const TL = { '3months': 'Within 3 months', '6months': 'Within 6 months', '12months': '6–12 months', 'exploring': 'Exploring' }

  // Business structure or employment status factor (context-sensitive)
  const isEmployee = entityType === 'zamestnanec'
  const businessOrEmploymentFactor = isEmployee ? {
    title:  'Employment Status',
    icon:   Briefcase,
    detail: { indefinite: 'Indefinite contract', definite: 'Fixed-term contract', agency: 'Agency / temp worker', dpc: 'Supplemental employment agreement' }[contractType] ?? 'Contract not specified',
    desc: (() => {
      const parts = []
      const inProbation = isProbation || probationPeriod === 'yes'
      if (inProbation) {
        if (employmentSector === 'health' || employmentSector === 'education')
          parts.push('Probation — CSOB exception applies (Healthcare/Education); manual HQ underwriting route.')
        else
          parts.push('In probation period — most banks will decline until probation ends.')
      } else {
        parts.push('Not in probation — standard underwriting applies.')
      }
      if (contractType === 'definite') {
        if (flags.includes('fixed_term_expiring_soon'))
          parts.push('Fixed-term contract expiring soon — lenders may request evidence of renewal. Advisor review recommended.')
        else
          parts.push('Fixed-term contract — assessed identically to an indefinite contract when end date is >2 months away.')
      }
      if (contractType === 'agency')   parts.push('Agency contract: 25% income haircut; higher variance across banks.')
      if (contractType === 'dpc')      parts.push('Supplemental agreement: treated as supplemental income; 30% haircut applied.')
      if (contractType === 'indefinite') parts.push('Indefinite contract — preferred by all 19 covered banks.')
      const sectorLabel = { health: 'Healthcare', education: 'Education', other: 'Private sector' }[employmentSector] ?? 'Not specified'
      parts.push(`Sector: ${sectorLabel}.`)
      return parts.join(' ')
    })(),
    status: (() => {
      if (redFlags.includes('probation') || redFlags.includes('notice_period') || redFlags.includes('sick_leave') || redFlags.includes('employer_distressed')) return 'risk'
      if (flags.includes('probation_csob_exception')) return 'review'
      if (contractType === 'agency' || contractType === 'dpc') return 'review'
      if (contractType === 'definite') return flags.includes('fixed_term_expiring_soon') ? 'review' : 'strong'
      if (contractType === 'indefinite') return 'strong'
      return 'review'
    })(),
  } : {
    title:  'Business Structure',
    icon:   Users,
    detail: (() => {
      if (entityType === 'osvc') return 'Self-employed'
      if (entityType === 'sro') {
        const essoBlock = redFlags.includes('sro_negative_financials') || redFlags.includes('sro_insufficient_history')
        if (essoBlock) return 's.r.o. Director — ESSO Hard Block'
        if (flags.includes('sro_medium_risk_50pct_cap')) return 's.r.o. Director — Medium Risk (50% cap)'
        if (flags.includes('sro_full_audit_required'))   return 's.r.o. Director — Full Audit Mode'
        const streams = companyIncomeStream || '—'
        return `s.r.o. Director — ESSO Low Risk (Stream ${streams})`
      }
      return '—'
    })(),
    desc: (() => {
      if (entityType === 'osvc') {
        const base = 'Sole traders assessed on 2-year average net profit from tax returns.'
        if (businessAgeMonths === null) return base
        const y = Math.floor(businessAgeMonths / 12)
        const m = businessAgeMonths % 12
        const age = y > 0 ? `${y} yr ${m > 0 ? m + ' mo' : ''}`.trim() : `${m} months`
        const ageNote = businessAgeMonths >= 24
          ? `Business age ${age} — 24-month requirement met by all banks.`
          : businessAgeMonths >= 12
          ? `Business age ${age} — below 24 months; 15% income haircut applied by most lenders.`
          : `Business age ${age} — below 12 months; transition path required (same NACE + single B2B client).`
        return `${base} ${ageNote}${businessName ? ` Registered: ${businessName}.` : ''}`
      }
      if (entityType === 'sro') {
        const essoHardBlock = redFlags.includes('sro_negative_financials') || redFlags.includes('sro_insufficient_history')
        if (essoHardBlock) {
          return 'ESSO hard block: negative equity, net loss, or insufficient fiscal history prevents income recognition. Continue with your advisor to explore alternative pathways.'
        }
        const ownerPct = Number(companyOwnershipPct ?? sroOwnershipPct ?? 0)
        const salary   = Number(sroDirectorSalary   || 0)
        const fees     = Number(sroDirectorFees     || 0)
        const streams  = companyIncomeStream || '—'
        const existMo  = companyExistenceMonths !== null ? Number(companyExistenceMonths) : businessAgeMonths

        const baseParts = [
          `ESSO assessment — ownership ${ownerPct > 0 ? ownerPct + '%' : 'not specified'}.`,
          `Active streams: ${streams}.`,
        ]
        if (salary > 0)  baseParts.push(`Stream A salary: ${formatCZK(salary)}/mo.`)
        if (fees > 0 && directorContractExists) baseParts.push(`Stream C fees: ${formatCZK(fees)}/mo.`)
        if (companyAfterTaxResult !== null) baseParts.push(`After-tax result: ${formatCZK(Number(companyAfterTaxResult))}.`)
        if (flags.includes('sro_medium_risk_50pct_cap'))
          baseParts.push('Medium risk tier — income recognised at 50% pending 2nd full fiscal year.')
        if (flags.includes('sro_full_audit_required'))
          baseParts.push('Full audit mode — all corporate statements and UBO declaration required.')
        if (existMo !== null && existMo >= 24)
          baseParts.push(`24-month requirement met (${existMo} months) — Low Risk ESSO tier.`)
        return baseParts.join(' ')
      }
      return 'Not specified.'
    })(),
    status: (() => {
      if (!entityType) return 'review'
      if (entityType === 'sro') {
        if (redFlags.includes('sro_negative_financials') || redFlags.includes('sro_insufficient_history')) return 'risk'
        if (flags.includes('sro_medium_risk_50pct_cap')) return 'review'
        if (flags.includes('sro_full_audit_required'))   return 'review'
        return 'strong'
      }
      if (businessAgeMonths !== null) {
        if (businessAgeMonths < 12) return 'risk'
        if (businessAgeMonths < 24) return 'review'
      }
      return 'good'
    })(),
  }

  // Loan capacity card — uses engine E[X] / Var[X]
  const bonityFactor = {
    title:  'Loan Capacity (Bonita)',
    icon:   TrendingUp,
    detail: incomeForCalc > 0 && eX > 0 ? `E[X] ≈ ${formatCZKShort(eX)}` : incomeForCalc > 0 ? 'Capacity exhausted' : 'Set income below →',
    desc: incomeForCalc > 0
      ? `Max maturity: ${maturity.maxYears} yrs (payoff by age ${Number(applicantAge) + maturity.maxYears}). Bottleneck: ${bottleneck ?? '—'}. Variance across banks: ±${formatCZKShort(varX)}.`
      : 'Enter your net monthly income in the Scenario Simulator below.',
    status: incomeForCalc > 0 && eX > 0 ? (eX > 3_000_000 ? 'strong' : eX > 1_000_000 ? 'good' : 'review') : 'review',
    // Pass through for extended card display
    eX, eXStress, eXBase, varX, dstiAtEX, bottleneck, maturity,
    netIncome: incomeForCalc, existingDebt,
  }

  return [
    {
      title: 'Residence & Visa', icon: MapPin,
      detail: RL[residenceStatus] ?? '—',
      desc: !residenceStatus ? 'Not specified'
        : residenceStatus === 'eu' || residenceStatus === 'permanent'
          ? 'Full access — all 19 covered Czech banks eligible with no extra conditions.'
          : residenceStatus === 'longterm5plus' || residenceStatus === 'longterm' || residenceStatus === 'employment'
          ? 'Limited access — ~60% of banks eligible; specialist pre-filtering required.'
          : 'Restricted — very few lenders consider this visa category.',
      status: !residenceStatus ? 'review'
        : (residenceStatus === 'eu' || residenceStatus === 'permanent') ? 'strong'
        : (residenceStatus === 'longterm5plus' || residenceStatus === 'longterm' || residenceStatus === 'employment') ? 'good'
        : 'risk',
    },
    {
      title: 'Czech Tenure', icon: Calendar,
      detail: YL[yearsInCZ] ?? '—',
      desc: !yearsInCZ ? 'Not specified'
        : (yearsInCZ === '10plus' || yearsInCZ === '5-10') ? 'Strong — multi-year residency builds lender confidence.'
        : yearsInCZ === '2-5' ? 'Moderate — most specialist lenders accept 2+ years.'
        : 'Short — under 2 years is a high barrier for most lenders.',
      status: !yearsInCZ ? 'review'
        : (yearsInCZ === '10plus' || yearsInCZ === '5-10') ? 'strong'
        : yearsInCZ === '2-5' ? 'good'
        : yearsInCZ === '1-2' ? 'review' : 'risk',
    },
    businessOrEmploymentFactor,
    {
      title: 'LTV Position', icon: Home,
      detail: purchasePrice > 0 ? `${ltvPct.toFixed(1)}% LTV (limit ${maxLTVPct}%)` : '—',
      desc: !purchasePrice ? 'Not specified'
        : profile.ltvBreached
          ? `Exceeds the ${maxLTVPct}% cap for this purpose/age combination — own funds must increase.`
          : ltvPct > 70
          ? `Acceptable — above 70% LTV some banks add a risk premium. Cap is ${maxLTVPct}% (${propertyPurpose === 'investment' ? 'investment hard limit' : applicantAge < 36 ? 'First Home scheme' : 'regulatory standard'}).`
          : `Below 70% LTV — unlocks competitive fixed rates across all lenders.`,
      status: !purchasePrice ? 'review'
        : profile.ltvBreached ? 'risk'
        : ltvPct > 70 ? 'good' : 'strong',
    },
    {
      title: 'Cash Reserve Adequacy', icon: DollarSign,
      detail: purchasePrice > 0 ? `${own.toFixed(0)}% own funds` : '—',
      desc: own >= 30 ? 'Excellent — above 30% signals financial strength to underwriters.'
        : own >= 20 ? 'Adequate — meets CNB minimum. Allow buffer for transaction fees & transfer tax.'
        : own > 0   ? 'Insufficient — CNB requires at least 20% own funds (10% for First Housing under 36).'
        : 'Not specified.',
      status: !purchasePrice ? 'review' : own >= 30 ? 'strong' : own >= 20 ? 'good' : 'risk',
    },
    {
      title: 'Monthly Obligation Load', icon: BarChart2,
      detail: `${formatCZK(existingDebt)} / mo`,
      desc: existingDebt === 0 ? 'No existing obligations — maximises available borrowing capacity.'
        : existingDebt < 15_000 ? 'Light load — substantial DSTI headroom remains.'
        : existingDebt < 30_000 ? 'Moderate — noticeably reduces maximum loan amount.'
        : 'Heavy — significantly constrains borrowing; consider reducing debts before applying.',
      status: existingDebt === 0 ? 'strong' : existingDebt < 15_000 ? 'good' : existingDebt < 30_000 ? 'review' : 'risk',
    },
    {
      title: 'Property Use Case', icon: Home,
      detail: PL[propertyPurpose] ?? '—',
      desc: propertyPurpose === 'primary'
        ? `Most favourable — primary residence. Max LTV ${maxLTVPct}%, DTI ${maxDTIVal}.`
        : propertyPurpose === 'investment'
        ? `Investment property — hard LTV cap 70%, DTI cap 7 across all banks. No exceptions.`
        : propertyPurpose === 'holiday'
        ? 'Holiday home — limited lenders; requires larger own-funds buffer.'
        : 'Not specified.',
      status: propertyPurpose === 'primary' ? 'strong' : propertyPurpose === 'investment' ? 'good'
        : propertyPurpose === 'holiday' ? 'review' : 'review',
    },
    {
      title: 'Bank Statement Review', icon: FileText,
      detail: bankAnalysisStatus === 'skipped' ? 'Scheduled — Consultation Booked' : 'Pending — Consultation Required',
      desc: 'Bank statement review will be conducted securely during your strategy session in full compliance with 2026 Czech banking data-privacy requirements. No document upload required.',
      status: bankAnalysisStatus === 'skipped' ? 'good' : 'review',
    },
    bonityFactor,
    {
      title: 'Loan Term & Age Cap', icon: Activity,
      detail: maturity.maxYears > 0 ? `Max ${maturity.maxYears} years` : 'Calculate below',
      desc: (() => {
        const payoffAge = Number(applicantAge) + maturity.maxYears
        const parts = [`Payoff at age ${payoffAge} (UCB/mBank limit: ${maturity.payoffAgeConservative}, KB: ${maturity.payoffAgeGenerous}).`]
        if (maturity.canExtend)
          parts.push('mBank 40-year exception eligible (LTV ≤80%, DSTI ≤45%, DTI ≤8.5).')
        else
          parts.push('40-year mBank extension not available at current LTV/DSTI/DTI.')
        return parts.join(' ')
      })(),
      status: maturity.maxYears >= 25 ? 'strong' : maturity.maxYears >= 15 ? 'good' : maturity.maxYears >= 10 ? 'review' : 'risk',
    },
    {
      title: 'Purchase Readiness', icon: Award,
      detail: TL[purchaseTimeline] ?? '—',
      desc: purchaseTimeline === '3months' ? 'Urgent — prioritise pre-approval now; some lenders need 3–4 weeks.'
        : purchaseTimeline === '6months'   ? 'Good window — enough time to compare offers and negotiate conditions.'
        : purchaseTimeline === '12months'  ? 'Comfortable — use this period to strengthen weak factors before applying.'
        : purchaseTimeline === 'exploring' ? 'Exploring — ideal time to resolve LTV and document gaps before committing.'
        : 'Not specified.',
      status: purchaseTimeline === '6months' ? 'strong'
        : (purchaseTimeline === '3months' || purchaseTimeline === '12months') ? 'good'
        : 'review',
    },
  ]
}

// ── Sub-components ─────────────────────────────────────

function ScoreGauge({ score, color }) {
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 120)
    return () => clearTimeout(t)
  }, [score])

  const offset = GAUGE_CIRC * (1 - animated / 100)

  return (
    <svg viewBox="0 0 160 160" className="w-36 h-36 flex-shrink-0">
      <circle cx="80" cy="80" r={GAUGE_R} fill="none" stroke="#E2E8F0" strokeWidth="11" />
      <circle
        cx="80" cy="80" r={GAUGE_R} fill="none"
        stroke={color} strokeWidth="11"
        strokeDasharray={`${GAUGE_CIRC}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 80 80)"
        className="gauge-glow"
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)' }}
      />
      {/* Dark inner fill so score text is always readable regardless of container bg */}
      <circle cx="80" cy="80" r="28" fill="#0F172A" />
      <text x="80" y="76" textAnchor="middle"
        fill="#FFFFFF" fontSize="30" fontWeight="800"
        fontFamily="Manrope, Inter, sans-serif">{score}</text>
      <text x="80" y="96" textAnchor="middle"
        fill="#94A3B8" fontSize="11"
        fontFamily="Inter, sans-serif">/ 100</text>
    </svg>
  )
}

// ── Risk Matrix ────────────────────────────────────────

function RiskMatrix({ formData, simNetIncome }) {
  const resolvedIncome = formData.netMonthlySalary > 0 ? formData.netMonthlySalary : formData.netIncome
  const incomeForCalc = (resolvedIncome > 0 ? resolvedIncome : simNetIncome) || 0
  const profile = computeMortgageProfile({ ...formData, netIncome: incomeForCalc })
  const { riskStatus, eX, eXStress, varX, bottleneck, ltvPct, maxLTVPct, dtiRatio, maxDTIVal,
    dstiAtEX, tentativeDSTI, maturity, ltvBreached, dtiBreached, flags, redFlags } = profile

  const cfg = RISK_MATRIX_CFG[riskStatus]

  const bottleneckDesc = {
    LTV:  `LTV ${ltvPct.toFixed(0)}% exceeds ${maxLTVPct}% cap`,
    DTI:  `DTI ${dtiRatio.toFixed(1)}× exceeds ${maxDTIVal}× limit`,
    DSTI: `Debt service ratio ${dstiAtEX.toFixed(0)}% at or near 45% ČNB ceiling`,
    DI:   `Disposable income (after living costs & reserve) is the binding constraint`,
    AGE:  `Age constraint limits maturity to ${maturity.maxYears} years`,
  }[bottleneck] ?? 'Profile within all limits'

  const MetricCell = ({ label, value, warn }) => (
    <div className={`rounded-xl px-3 py-2.5 border ${warn ? 'bg-risk-light border-risk-border' : 'bg-surface border-border'}`}>
      <p className="text-[10px] font-semibold text-ink-subtle uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`font-display text-sm font-extrabold tabular-nums ${warn ? 'text-risk-DEFAULT' : 'text-ink'}`}>{value}</p>
    </div>
  )

  return (
    <div className={`rounded-card border-2 ${cfg.border} overflow-hidden`}>
      {/* Header */}
      <div className={`${cfg.bg} px-4 sm:px-6 py-4 sm:py-5`}>
        <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-ink-subtle mb-0.5">Loan Assessment</p>
              <p className={`font-display text-xl font-black ${cfg.text}`}>
                {cfg.label}
              </p>
            </div>
          </div>
          {incomeForCalc > 0 && (
            <div className="text-right">
              <p className="text-[10px] text-ink-subtle mb-0.5">Expected Loan</p>
              <p className={`font-display text-xl sm:text-2xl font-black tabular-nums ${cfg.text}`}>
                {eX > 0 ? formatCZKShort(eX) : '—'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="p-4 sm:p-5 bg-card">
        {incomeForCalc > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <MetricCell label="LTV" value={`${ltvPct.toFixed(0)}% / ${maxLTVPct}%`} warn={ltvBreached} />
            <MetricCell label="DTI" value={incomeForCalc > 0 ? `${dtiRatio.toFixed(1)}× / ${maxDTIVal}×` : '—'} warn={dtiBreached} />
            <MetricCell label="DSTI" value={`${dstiAtEX.toFixed(0)}% / 45%`} warn={dstiAtEX > 45} />
            <MetricCell label="Max term" value={`${maturity.maxYears} yrs`} warn={maturity.maxYears < 15} />
          </div>
        )}

        {/* Bottleneck row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Info size={12} className="text-ink-subtle flex-shrink-0" />
            <p className="text-xs text-ink-muted">
              <span className="font-semibold text-ink">Limiting factor:</span> {bottleneckDesc}
            </p>
          </div>
          {incomeForCalc > 0 && eX > 0 && eXStress > 0 && (
            <div className="flex items-center gap-4 text-xs flex-shrink-0">
              <span className="text-ink-muted">
                Stress test <span className="font-bold tabular-nums text-warning-text">{formatCZKShort(eXStress)}</span>
              </span>
            </div>
          )}
        </div>

        {/* Active flags */}
        {(flags.length > 0 || redFlags.length > 0) && (
          <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1.5">
            {redFlags.map((f) => (
              <span key={f} className="badge-risk text-[10px]">{f.replace(/_/g,' ')}</span>
            ))}
            {flags.map((f) => (
              <span key={f} className="badge-warning text-[10px]">{f.replace(/_/g,' ')}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Readiness card ─────────────────────────────────────

function ReadinessCard({ factor }) {
  const { title, icon: Icon, detail, desc, status,
    eX, eXStress, eXBase, varX, dstiAtEX, bottleneck, maturity, netIncome, existingDebt } = factor
  const { label, cls } = STATUS_CFG[status]

  return (
    <div className="card-surface p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
            <Icon size={15} className="text-ink-muted" />
          </div>
          <p className="text-sm font-semibold text-ink leading-tight">{title}</p>
        </div>
        <span className={`${cls} flex-shrink-0 text-[10px]`}>{label}</span>
      </div>

      <p className="text-[13px] font-bold text-ink mb-1">{detail}</p>
      <p className="text-xs text-ink-muted leading-relaxed">{desc}</p>

      {/* Bonity extended display */}
      {eX !== undefined && netIncome > 0 && eX > 0 && (
        <div className="mt-3 pt-3 border-t border-border space-y-1.5">
          <div className="flex justify-between text-xs gap-2">
            <span className="text-ink-muted min-w-0">Base capacity @ {CONTRACT_RATE_PA}% / {maturity?.maxYears ?? 20} yr</span>
            <span className="font-bold text-ink tabular-nums flex-shrink-0">{formatCZKShort(eXBase ?? eX)}</span>
          </div>
          <div className="flex justify-between text-xs gap-2">
            <span className="text-ink-muted min-w-0">Stress capacity @ {DUAL_STRESS_RATE_PA}%</span>
            <span className="font-semibold text-warning-text tabular-nums flex-shrink-0">{formatCZKShort(eXStress)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-muted">Debt service ratio</span>
            <span className={`font-semibold tabular-nums ${dstiAtEX > 45 ? 'text-risk-DEFAULT' : 'text-ink-muted'}`}>
              {dstiAtEX.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Discovery Budget Card ──────────────────────────────

function DiscoveryBudgetCard({ profile, formData }) {
  const { maxPropertyPrice, minOwnFunds, discoveryLTVPct, eX } = profile
  const isYoung = Number(formData.applicantAge) < 36

  if (eX <= 0) return null

  return (
    <div className="rounded-card border-2 border-brand-200 overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-brand-200 bg-brand-50/80">
        <p className="text-[10px] font-bold tracking-widest uppercase text-brand-700">Budget Discovery</p>
        <p className="text-sm font-semibold text-brand-900 mt-0.5">Indicative property price range based on your income capacity</p>
      </div>
      <div className="bg-card p-5 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 rounded-xl border border-brand-200 bg-brand-50/40 p-5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-brand-600 mb-1">Estimated Property Budget</p>
            <p className="font-display text-3xl sm:text-4xl font-black text-brand-800 tabular-nums">
              {formatCZKShort(maxPropertyPrice)}
            </p>
            <p className="text-xs text-brand-600 mt-2">
              Income capacity ÷ {discoveryLTVPct}% ·{' '}
              {isYoung ? 'First Home Buyer — under 36' : 'Standard ČNB limit'}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-subtle mb-1">Min. Own Funds</p>
            <p className="font-display text-2xl font-black text-ink tabular-nums">
              {formatCZKShort(minOwnFunds)}
            </p>
            <p className="text-xs text-ink-subtle mt-2">{100 - discoveryLTVPct}% of purchase price</p>
          </div>
        </div>
        <div className="rounded-xl bg-surface border border-border px-4 py-3">
          <p className="text-[11px] text-ink-muted leading-relaxed">
            <strong className="text-ink">How this works:</strong> Your income capacity of {formatCZKShort(eX)} divided by {discoveryLTVPct}%
            gives the maximum property price you can target. You will need at least {formatCZKShort(minOwnFunds)} ({100 - discoveryLTVPct}%) in
            confirmed own funds. Figures are indicative — final amounts depend on the specific property, bank assessment, and
            prevailing rates at time of application.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Applicant Profile Panel ────────────────────────────

function ApplicantProfilePanel({ formData, profile }) {
  const {
    entityType = '',
    businessName = '',
    icoActiveStatus = '',
    naceSector = '',
    turnoverIncomePct = null,
    businessAgeMonths = null,
    businessActivityGap = false,
    taxRegime = '',
    annualTurnover = null,
    avgMonthlyCreditTurnover = null,
    contractType = '',
    probationPeriod = '',
    isProbation = false,
    employmentSector = '',
    isNoticePeriod = false,
  } = formData

  const { effectiveIncome, flags } = profile

  const DetailCell = ({ label, value, warn = false }) => (
    <div className={`rounded-xl border p-4 ${warn ? 'bg-risk-light border-risk-border' : 'bg-surface border-border'}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${warn ? 'text-risk-text' : 'text-ink-subtle'}`}>{label}</p>
      <p className={`text-sm font-bold leading-snug ${warn ? 'text-risk-text' : 'text-ink'}`}>{value}</p>
    </div>
  )

  const businessDurationStr = businessAgeMonths !== null
    ? (() => {
        const y = Math.floor(businessAgeMonths / 12)
        const m = businessAgeMonths % 12
        if (y > 0 && m > 0) return `Active for ${y} yr ${m} mo`
        if (y > 0) return `Active for ${y} yr`
        return `Active for ${m} mo`
      })()
    : 'Not verified'

  // ── OSVČ ────────────────────────────────────────────────
  if (entityType === 'osvc') {
    const coeff     = (turnoverIncomePct ?? 70) / 100
    const coeffLabel = `${turnoverIncomePct ?? 70}%`
    const annualNum  = Number(annualTurnover ?? 0)
    const monthlyNum = Number(avgMonthlyCreditTurnover ?? 0)

    const methodAIncome = annualNum > 0
      ? Math.min(Math.round(annualNum / 12 * coeff), 150_000)
      : null
    const methodBIncome = monthlyNum > 0
      ? Math.min(Math.round(monthlyNum * coeff), 150_000)
      : null

    const activeMethod = flags.includes('flat_tax_method') ? 'B' : 'A'
    const statusLabel  = icoActiveStatus === 'AKTIVNÍ' ? 'Verified — Active' : icoActiveStatus ? 'Suspended / Inactive' : 'Not verified'
    const statusBadge  = icoActiveStatus === 'AKTIVNÍ' ? 'badge-success' : 'badge-warning'
    const historyLabel = businessActivityGap ? 'Interrupted' : businessAgeMonths !== null ? 'Continuous' : 'Unknown'
    const taxLabel     = taxRegime === 'flat_tax' ? 'Flat Tax Regime' : taxRegime === 'tax_return' ? 'Standard Tax Return' : 'Not specified'

    return (
      <div className="space-y-5 pt-4">

        {/* Business identity */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
            <Building2 size={16} className="text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink leading-tight">{businessName || 'Self-Employed Applicant'}</p>
            <p className="text-xs text-ink-subtle">Sole Trader · {taxLabel}</p>
          </div>
          {icoActiveStatus && (
            <span className={`${statusBadge} text-[10px] flex-shrink-0`}>{statusLabel}</span>
          )}
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <DetailCell label="Verified Industry" value={naceSector || 'Not resolved'} />
          <DetailCell label="Income Bracket" value={`${coeffLabel} of turnover`} />
          <DetailCell label="Business Duration" value={businessDurationStr} />
          <DetailCell label="History Status" value={historyLabel} warn={businessActivityGap} />
        </div>

        {/* Income recognition comparison */}
        <div>
          <p className="section-label mb-3">Income Recognition — Method Comparison</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Method A — Tax Return */}
            <div className={`rounded-xl border p-5 ${activeMethod === 'A' ? 'border-brand-200 bg-brand-50/40' : 'border-border bg-surface'}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="section-label">Method A — Tax Return</p>
                {activeMethod === 'A' && <span className="badge-success text-[10px]">Applied</span>}
              </div>
              <p className="text-[11px] text-ink-subtle mb-4 leading-relaxed">
                Annual turnover ÷ 12 × {coeffLabel} recognition rate
              </p>
              {methodAIncome !== null ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-muted">Recognised income</span>
                    <span className="font-bold text-ink tabular-nums">{formatCZK(methodAIncome)}/mo</span>
                  </div>
                  {annualNum > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-subtle">Annual turnover basis</span>
                      <span className="text-ink-subtle tabular-nums">{formatCZK(annualNum)}/yr</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-ink-subtle">Annual turnover not entered</p>
              )}
            </div>

            {/* Method B — Bank Turnover */}
            <div className={`rounded-xl border p-5 ${activeMethod === 'B' ? 'border-brand-200 bg-brand-50/40' : 'border-border bg-surface'}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="section-label">Method B — Bank Turnover</p>
                {activeMethod === 'B' && <span className="badge-success text-[10px]">Applied</span>}
              </div>
              <p className="text-[11px] text-ink-subtle mb-4 leading-relaxed">
                Avg monthly credit turnover × {coeffLabel} recognition rate
              </p>
              {methodBIncome !== null ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-muted">Recognised income</span>
                    <span className="font-bold text-ink tabular-nums">{formatCZK(methodBIncome)}/mo</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-subtle">Monthly turnover basis</span>
                    <span className="text-ink-subtle tabular-nums">{formatCZK(monthlyNum)}/mo</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ink-subtle">
                  {taxRegime === 'flat_tax'
                    ? 'Monthly bank turnover not entered — required for flat-tax applicants.'
                    : 'Not applicable for standard tax-return filing.'}
                </p>
              )}
            </div>
          </div>

          {/* Active recognised income summary */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4 mt-3">
            <div>
              <p className="section-label mb-0.5">Recognised Monthly Income (used in calculation)</p>
              <p className="text-[11px] text-ink-subtle">Method {activeMethod} · Cap: 150,000 CZK/mo</p>
            </div>
            <p className="font-display text-xl font-black text-ink tabular-nums">{formatCZK(effectiveIncome)}/mo</p>
          </div>
        </div>

        {/* Under-24-month warning */}
        {businessAgeMonths !== null && businessAgeMonths < 24 && (
          <div className="flex items-start gap-3 rounded-xl bg-warning-light border border-warning-border p-4">
            <AlertTriangle size={14} className="text-warning-DEFAULT flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-warning-text mb-0.5">
                {businessAgeMonths < 12 ? 'Under 12 Months — Transition Path Required' : 'Under 24 Months — Income Haircut Applied'}
              </p>
              <p className="text-xs text-warning-text leading-relaxed">
                {businessAgeMonths < 12
                  ? 'Businesses under 12 months must demonstrate continuity from prior employment in the same sector with a single B2B client to qualify for income recognition at most banks.'
                  : 'Businesses between 12 and 24 months receive a 15% income haircut at most Czech banks. Full recognition activates once the 24-month threshold is crossed.'}
              </p>
            </div>
          </div>
        )}

        {/* Interrupted history warning */}
        {businessActivityGap && (
          <div className="flex items-start gap-3 rounded-xl bg-risk-light border border-risk-border p-4">
            <AlertTriangle size={14} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-risk-text mb-0.5">Risk Alert: Interrupted Business Activity</p>
              <p className="text-xs text-risk-text leading-relaxed">
                The Czech Business Register (ARES) shows a suspension or dissolution record on file.
                Most Czech lenders treat interrupted business history as a risk factor — it may trigger
                additional underwriting scrutiny or income haircuts.
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Zamestnanec ─────────────────────────────────────────
  if (entityType === 'zamestnanec') {
    const inProbation = isProbation || probationPeriod === 'yes'
    const contractLabels = {
      indefinite: 'Indefinite contract',
      definite:   'Fixed-term contract',
      agency:     'Agency / temporary',
      dpc:        'Supplemental agreement (DPC)',
    }
    const sectorLabels = {
      health:    'Healthcare',
      education: 'Education',
      other:     'Private sector',
    }
    const stabilityStatus = (() => {
      if (isNoticePeriod) return { label: 'Notice Period — Hard Block', cls: 'badge-risk' }
      if (inProbation && employmentSector !== 'health' && employmentSector !== 'education')
        return { label: 'Probation — Most Banks Decline', cls: 'badge-risk' }
      if (inProbation) return { label: 'Probation — CSOB Exception', cls: 'badge-warning' }
      if (contractType === 'agency' || contractType === 'dpc') return { label: 'Needs Review', cls: 'badge-warning' }
      if (contractType === 'indefinite') return { label: 'Strong', cls: 'badge-success' }
      return { label: 'Good', cls: 'badge bg-brand-50 text-brand-700 border border-brand-100' }
    })()

    return (
      <div className="space-y-5 pt-4">

        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
            <Briefcase size={16} className="text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink">Salaried Employment</p>
            <p className="text-xs text-ink-subtle">{sectorLabels[employmentSector] ?? 'Sector not specified'}</p>
          </div>
          <span className={`${stabilityStatus.cls} text-[10px] flex-shrink-0`}>{stabilityStatus.label}</span>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <DetailCell label="Contract Type" value={contractLabels[contractType] ?? 'Not specified'} />
          <DetailCell
            label="Probation Status"
            value={inProbation ? 'In probation period' : 'Not in probation'}
            warn={inProbation && employmentSector !== 'health' && employmentSector !== 'education'}
          />
          <DetailCell label="Employment Sector" value={sectorLabels[employmentSector] ?? 'Not specified'} />
        </div>

        {/* Contextual notes */}
        {contractType === 'indefinite' && !inProbation && (
          <div className="flex items-start gap-3 rounded-xl bg-success-light border border-success-border p-4">
            <CheckCircle size={14} className="text-success-DEFAULT flex-shrink-0 mt-0.5" />
            <p className="text-xs text-success-text leading-relaxed">
              <strong>Indefinite contract — preferred by all Czech banks.</strong> No income haircut applies.
              Standard underwriting path with the widest lender access.
            </p>
          </div>
        )}
        {contractType === 'agency' && (
          <div className="flex items-start gap-3 rounded-xl bg-warning-light border border-warning-border p-4">
            <Info size={14} className="text-warning-DEFAULT flex-shrink-0 mt-0.5" />
            <p className="text-xs text-warning-text leading-relaxed">
              <strong>Agency contract — 25% income haircut applied.</strong> Recognised income used in calculation:{' '}
              <span className="font-semibold tabular-nums">{formatCZK(effectiveIncome)}/mo</span>.
              Higher income variance across banks; specialist lender pre-filtering required.
            </p>
          </div>
        )}
        {contractType === 'dpc' && (
          <div className="flex items-start gap-3 rounded-xl bg-warning-light border border-warning-border p-4">
            <Info size={14} className="text-warning-DEFAULT flex-shrink-0 mt-0.5" />
            <p className="text-xs text-warning-text leading-relaxed">
              <strong>Supplemental agreement (DPC) — 30% income haircut applied.</strong> DPC income is treated as
              secondary by most Czech lenders. Recognised income:{' '}
              <span className="font-semibold tabular-nums">{formatCZK(effectiveIncome)}/mo</span>.
            </p>
          </div>
        )}
        {inProbation && (employmentSector === 'health' || employmentSector === 'education') && (
          <div className="flex items-start gap-3 rounded-xl bg-warning-light border border-warning-border p-4">
            <Info size={14} className="text-warning-DEFAULT flex-shrink-0 mt-0.5" />
            <p className="text-xs text-warning-text leading-relaxed">
              <strong>CSOB Exception — Healthcare / Education Sector.</strong> Applicants in probation within
              healthcare or education may qualify via CSOB manual HQ underwriting. Other banks will decline
              until probation ends.
            </p>
          </div>
        )}
        {inProbation && employmentSector !== 'health' && employmentSector !== 'education' && (
          <div className="flex items-start gap-3 rounded-xl bg-risk-light border border-risk-border p-4">
            <AlertTriangle size={14} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
            <p className="text-xs text-risk-text leading-relaxed">
              <strong>Probation period — most banks will decline.</strong> Standard Czech banks require the probation
              period to have ended at the point of application. We recommend reapplying once probation is confirmed
              complete.
            </p>
          </div>
        )}
        {isNoticePeriod && (
          <div className="flex items-start gap-3 rounded-xl bg-risk-light border border-risk-border p-4">
            <AlertTriangle size={14} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
            <p className="text-xs text-risk-text leading-relaxed">
              <strong>Notice period — hard block across all banks.</strong> Active employment must be confirmed at the
              point of application. Any formal notice of termination prevents approval until new employment is started
              and confirmed.
            </p>
          </div>
        )}
      </div>
    )
  }

  return null
}

// ── Per-Bank Dual Test Table ───────────────────────────

function BankResultsTable({ profile }) {
  const { bankResults, winnerBank } = profile
  if (!bankResults) return null

  const bindingColor = {
    DSTI: 'bg-brand-50 text-brand-700',
    DTI:  'bg-risk-light text-risk-text',
    LTV:  'bg-surface text-ink-muted border border-border',
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden mt-4">
      <div className="bg-surface px-5 py-3 border-b border-border flex items-center justify-between">
        <p className="text-[11px] font-bold text-ink-subtle uppercase tracking-wide">Bank Loan Capacity</p>
        <p className="text-[10px] text-ink-subtle">Test A @ {CONTRACT_RATE_PA}% · Test B @ {DUAL_STRESS_RATE_PA}%</p>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="min-w-max w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-surface/50">
              <th className="text-left px-4 py-2.5 font-semibold text-ink-subtle whitespace-nowrap">Bank</th>
              <th className="text-right px-3 py-2.5 font-semibold text-ink-subtle whitespace-nowrap">DSTI cap</th>
              <th className="text-right px-3 py-2.5 font-semibold text-ink-subtle whitespace-nowrap">Test A ({CONTRACT_RATE_PA}%)</th>
              <th className="text-right px-3 py-2.5 font-semibold text-ink-subtle whitespace-nowrap">Test B ({DUAL_STRESS_RATE_PA}%)</th>
              <th className="text-right px-4 py-2.5 font-semibold text-ink-subtle whitespace-nowrap">Max Loan</th>
              <th className="text-center px-3 py-2.5 font-semibold text-ink-subtle whitespace-nowrap">Binding</th>
            </tr>
          </thead>
          <tbody>
            {BANK_KEYS.map((key) => {
              const r        = bankResults[key]
              const isWinner = key === winnerBank
              return (
                <tr key={key} className={`border-b border-border last:border-0 transition-colors ${isWinner ? 'bg-success-light' : 'hover:bg-surface/60'}`}>
                  <td className="px-4 py-3 font-semibold text-ink whitespace-nowrap">
                    {BANK_NAMES[key]}
                    {isWinner && <span className="ml-2 badge-success text-[9px] py-0.5 px-1.5">Selected</span>}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-ink-muted">
                    {r.effectiveDSTI !== null ? `${(r.effectiveDSTI * 100).toFixed(0)}%` : 'No limit'}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-ink-muted">
                    {isFinite(r.maxByDSTI) ? formatCZKShort(r.maxByDSTI) : '—'}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-ink-muted">
                    {isFinite(r.maxByDSTI_stress) ? formatCZKShort(r.maxByDSTI_stress) : '—'}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold tabular-nums ${isWinner ? 'text-success-text' : 'text-ink'}`}>
                    {formatCZKShort(r.maxLoan)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${bindingColor[r.binding] ?? 'bg-surface text-ink-muted'}`}>
                      {r.binding}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-border bg-surface/50 flex items-center gap-2 flex-wrap">
        <Info size={11} className="text-ink-subtle flex-shrink-0" />
        <p className="text-[10px] text-ink-subtle leading-relaxed">
          Bonita = MIN(Test A @ {CONTRACT_RATE_PA}%, Test B @ {DUAL_STRESS_RATE_PA}%). Max Loan = MIN(Bonita, DTI cap, LTV cap).
          Selected bank has the highest effective DSTI limit; ties broken by highest max loan.
        </p>
      </div>
    </div>
  )
}

// ── Scenario Simulator ─────────────────────────────────

function ScenarioSimulator({ formData, onIncomeChange }) {
  const cc5   = Math.round((formData.creditCardLimits ?? 0) * 0.05)
  const total = (formData.monthlyLoanPayments ?? 0) + cc5
    + (formData.monthlyLeasing ?? 0) + (formData.otherObligations ?? 0)

  const applicantAge  = Number(formData.applicantAge ?? 35)
  const propertyPurpose = formData.propertyPurpose ?? 'primary'
  const maxLTVForPurpose = getMaxLTV(propertyPurpose, applicantAge)
  const maxDTIForPurpose = getMaxDTI(propertyPurpose)

  const initDown = formData.purchasePrice > 0
    ? Math.round((formData.ownFunds / formData.purchasePrice) * 100)
    : 22

  const [s, setS] = useState({
    price:     formData.purchasePrice || 5_500_000,
    downPct:   Math.min(99, Math.max(5, initDown)),
    rate:      4.5,
    years:     20,
    netIncome: (formData.netMonthlySalary || formData.netIncome) > 0 ? (formData.netMonthlySalary || formData.netIncome) : 80_000,
  })

  const upd = (k, v) => {
    setS((p) => ({ ...p, [k]: v }))
    if (k === 'netIncome') onIncomeChange(v)
  }

  const loanAmt   = Math.round(s.price * (1 - s.downPct / 100))
  const payment   = monthlyPayment(loanAmt, s.rate, s.years)
  const simLTV    = s.price > 0 ? (loanAmt / s.price) * 100 : 0
  const simDSTI   = s.netIncome > 0 ? ((payment + total) / s.netIncome) * 100 : 0
  const simDTI    = s.netIncome > 0 ? loanAmt / (s.netIncome * 12) : 0
  const dstiAlert = simDSTI > 45
  const dtiAlert  = simDTI > maxDTIForPurpose
  const ltvAlert  = simLTV > maxLTVForPurpose

  // Age-aware max maturity
  const matCheck = calcMaxMaturity(applicantAge, simLTV, simDSTI, simDTI)
  const simMaxYears = Math.floor(matCheck.maxMonths / 12)

  const SliderRow = ({ label, value, min, max, step, format, onChange }) => (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="section-label">{label}</span>
        <span className="font-display text-base font-extrabold text-ink tabular-nums">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="slider-field" />
    </div>
  )

  return (
    <div className="card-surface p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-5 sm:mb-6">
        <TrendingUp size={16} className="text-brand-600" />
        <h3 className="font-display text-base sm:text-lg font-extrabold text-ink">Scenario Simulator</h3>
        {simMaxYears < 30 && (
          <span className="badge-warning text-[10px] ml-auto">Age cap: max {simMaxYears} yr</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 mb-7">
        <SliderRow label="Purchase Price" value={s.price}
          min={1_000_000} max={25_000_000} step={100_000}
          format={(v) => formatCZKShort(v)} onChange={(v) => upd('price', v)} />
        <SliderRow label="Down-payment" value={s.downPct}
          min={5} max={70} step={1}
          format={(v) => `${v}%`} onChange={(v) => upd('downPct', v)} />
        <SliderRow label="Interest Rate" value={s.rate}
          min={1.0} max={9.0} step={0.1}
          format={(v) => `${v.toFixed(1)}%`} onChange={(v) => upd('rate', v)} />
        <SliderRow label="Maturity" value={s.years}
          min={5} max={Math.max(5, simMaxYears)} step={1}
          format={(v) => `${v} years`} onChange={(v) => upd('years', Math.min(v, simMaxYears))} />
      </div>

      <div className="mb-7">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="section-label">Net Income</span>
          <span className="font-display text-base font-extrabold text-ink tabular-nums">{formatCZKShort(s.netIncome)}</span>
        </div>
        <input type="range" min={20_000} max={500_000} step={5_000} value={s.netIncome}
          onChange={(e) => upd('netIncome', Number(e.target.value))} className="slider-field" />
        <p className="text-[11px] text-ink-subtle mt-1">Updates the loan capacity estimate in real time.</p>
      </div>

      {/* Results */}
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <div>
            <p className="section-label mb-1">Loan</p>
            <p className="font-display text-base sm:text-lg font-extrabold text-ink tabular-nums leading-tight">
              {formatCZKShort(loanAmt)}
            </p>
          </div>
          <div className="text-right sm:text-center sm:border-x sm:border-border sm:px-2">
            <p className="section-label mb-1">LTV</p>
            <p className={`font-display text-base sm:text-lg font-extrabold tabular-nums leading-tight ${ltvAlert ? 'text-risk-DEFAULT' : simLTV > 70 ? 'text-warning-DEFAULT' : 'text-success-DEFAULT'}`}>
              {simLTV.toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="section-label mb-1">DTI</p>
            <p className={`font-display text-base sm:text-lg font-extrabold tabular-nums leading-tight ${dtiAlert ? 'text-risk-DEFAULT' : 'text-success-DEFAULT'}`}>
              {s.netIncome > 0 ? `${simDTI.toFixed(1)}×` : '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="section-label mb-1">DSTI</p>
            <p className={`font-display text-base sm:text-lg font-extrabold tabular-nums leading-tight ${dstiAlert ? 'text-risk-DEFAULT' : simDSTI > 35 ? 'text-warning-DEFAULT' : 'text-success-DEFAULT'}`}>
              {s.netIncome > 0 ? `${simDSTI.toFixed(0)}%` : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
          <p className="text-sm font-semibold text-ink min-w-0">Estimated Monthly Payment</p>
          <p className="font-display text-xl sm:text-2xl font-black text-ink tabular-nums flex-shrink-0">{formatCZK(Math.round(payment))}</p>
        </div>
      </div>

      {/* Alerts */}
      {dstiAlert && s.netIncome > 0 && (
        <div className="flex items-start gap-3 mt-4 rounded-xl bg-risk-light border border-risk-border p-4">
          <AlertTriangle size={14} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
          <p className="text-xs text-risk-text leading-relaxed">
            <strong>DSTI {simDSTI.toFixed(0)}% exceeds the CNB 45% ceiling.</strong>{' '}
            Increase the down-payment, extend maturity, or raise income to bring DSTI below 45%.
          </p>
        </div>
      )}
      {dtiAlert && s.netIncome > 0 && (
        <div className="flex items-start gap-3 mt-3 rounded-xl bg-risk-light border border-risk-border p-4">
          <AlertTriangle size={14} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
          <p className="text-xs text-risk-text leading-relaxed">
            <strong>DTI {simDTI.toFixed(1)}× exceeds the {maxDTIForPurpose}× limit</strong>
            {propertyPurpose === 'investment' ? ' (investment property hard cap — no exceptions).' : ' (CNB standard limit).'}
            {' '}Reduce the loan amount or increase annual income to resolve.
          </p>
        </div>
      )}
      {ltvAlert && (
        <div className="flex items-start gap-3 mt-3 rounded-xl bg-risk-light border border-risk-border p-4">
          <AlertTriangle size={14} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
          <p className="text-xs text-risk-text leading-relaxed">
            <strong>LTV {simLTV.toFixed(0)}% exceeds the {maxLTVForPurpose}% cap</strong>{' '}
            for this property purpose and applicant age. Increase down-payment to proceed.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Journey Timeline ───────────────────────────────────

function JourneyTimeline() {
  return (
    <div className="card-surface p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-5 sm:mb-6">
        <Calendar size={16} className="text-brand-600" />
        <h3 className="font-display text-lg font-extrabold text-ink">Czech Mortgage Journey</h3>
      </div>
      <div>
        {TIMELINE_STEPS.map((step, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold z-10',
                step.done ? 'bg-success-DEFAULT text-white'
                  : step.current ? 'bg-brand-600 text-white'
                  : 'bg-surface border-2 border-border text-ink-subtle',
              ].join(' ')}>
                {step.done ? <CheckCircle size={13} /> : <span>{i + 1}</span>}
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={`w-px flex-1 my-1 min-h-[1.25rem] ${step.done ? 'bg-success-DEFAULT/25' : 'bg-border'}`} />
              )}
            </div>
            <div className="pb-4 pt-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className={`text-sm font-semibold leading-tight ${step.current ? 'text-brand-700' : step.done ? 'text-success-text' : 'text-ink-muted'}`}>
                  {step.label}
                </p>
                {step.current && <span className="badge-success text-[10px] px-2 py-0.5">You are here</span>}
              </div>
              <p className="text-xs text-ink-subtle leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Summary Card (always visible, pre-gate) ───────────

function SummaryCard({ profile, formData }) {
  const { riskStatus, eX, eXStress } = profile

  const riskMeta = {
    zelena:   { label: 'Low Risk',     text: 'text-success-text', bg: 'bg-success-light border-success-border' },
    oranzova: { label: 'Moderate Risk',text: 'text-warning-text', bg: 'bg-warning-light border-warning-border' },
    cervena:  { label: 'Higher Risk',  text: 'text-risk-text',    bg: 'bg-risk-light border-risk-border'       },
  }[riskStatus] ?? { label: 'Under Assessment', text: 'text-ink', bg: 'bg-surface border-border' }

  const entityLabel = {
    zamestnanec: 'Salaried employment',
    osvc:        'Self-employed',
    sro:         'Company director (s.r.o.)',
  }[formData.entityType] ?? 'Income assessed'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">

      <div className={`rounded-2xl border p-4 sm:p-5 ${riskMeta.bg}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-subtle mb-2">Risk Band</p>
        <p className={`font-display text-xl sm:text-2xl font-black leading-tight ${riskMeta.text}`}>{riskMeta.label}</p>
        <p className="text-[11px] text-ink-subtle mt-1">Based on your profile inputs</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-subtle mb-2">Borrowing Range</p>
        <p className="font-display text-xl sm:text-2xl font-black text-ink tabular-nums leading-tight">
          {eX > 0 ? formatCZKShort(eX) : '—'}
        </p>
        {eXStress > 0 && (
          <p className="text-[11px] text-ink-subtle mt-1">Stress: {formatCZKShort(eXStress)}</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-subtle mb-2">Income Structure</p>
        <p className="font-display text-sm font-bold text-ink leading-snug">{entityLabel}</p>
        <p className="text-[11px] text-ink-subtle mt-1">Czech bank methodology applied</p>
      </div>

    </div>
  )
}

// ── Headline Verdict ───────────────────────────────────

function HeadlineVerdict({ score, cfg, profile, formData }) {
  const { eX, eXStress, eXBase, riskStatus, bottleneck, effectiveIncome,
    maxPropertyPrice, discoveryLTVPct } = profile
  const isDiscovering = formData.propertyMode === 'discovering'

  const riskBand = {
    zelena:   'Low Risk',
    oranzova: 'Moderate Risk',
    cervena:  'Higher Risk',
  }[riskStatus] ?? 'Under Assessment'

  const genericBottleneckLabel = {
    DSTI: 'income capacity',
    DTI:  'debt load',
    AGE:  'loan term',
    LTV:  'equity position',
  }[bottleneck] ?? 'profile limits'

  const insightSentence = (() => {
    if (eX <= 0) return 'Enter your income to see your full borrowing capacity estimate.'
    if (isDiscovering) {
      if (bottleneck === 'DSTI' || bottleneck === 'DI' || bottleneck === 'DTI')
        return `Your ${genericBottleneckLabel} is the key constraint. Reducing monthly obligations before applying would directly expand your budget range.`
      return `Your estimated maximum loan is ${formatCZKShort(eX)}. See the Budget Discovery section below for the estimated property price range.`
    }
    if (bottleneck === 'LTV')
      return 'Your down-payment is the key lever — increasing own funds directly expands your maximum loan.'
    if (bottleneck === 'DI')
      return 'Your disposable income after living costs and obligations is the binding constraint. Reducing monthly commitments is the highest-impact action.'
    if (bottleneck === 'DTI')
      return 'Your total debt load is the binding constraint. Reducing existing obligations before applying will have the highest impact on capacity.'
    if (formData.entityType === 'osvc')
      return 'As a self-employed applicant, your income recognition method determines which lender to approach first — and it may not be the most obvious one.'
    if (formData.entityType === 'sro')
      return 'Your income is assessed under ESSO methodology. How your company financials are structured directly determines the recognised base.'
    return `Your profile qualifies for up to ${formatCZKShort(eX)} under Czech bank dual-test methodology (contract ${CONTRACT_RATE_PA}% / stress ${DUAL_STRESS_RATE_PA}%). The conservative dual-rate result is binding.`
  })()

  return (
    <div className="rounded-card bg-dark-900 border border-white/10 overflow-hidden">
      <div className="h-0.5 w-full flex-shrink-0" style={{ background: cfg.color }} />
      <div className="px-5 sm:px-10 py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-10">

          {/* Left: Gauge + verdict */}
          <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
            <ScoreGauge score={score} color={cfg.color} />
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1.5">Eligibility Score</p>
              <p className="font-display text-xl sm:text-2xl font-black text-white leading-tight">{cfg.label}</p>
              <div className="flex items-center gap-2 mt-2.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                <span className="text-xs text-slate-400 font-medium">{riskBand}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px self-stretch bg-white/10 flex-shrink-0" />

          {/* Right: Loan figures + insight */}
          <div className="flex-1 min-w-0 space-y-5">
            <div className="grid grid-cols-2 gap-4 sm:gap-8">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
                  Maximum Loan Estimate
                </p>
                <p className="font-display text-2xl sm:text-3xl font-black text-white tabular-nums leading-tight">
                  {eX > 0 ? formatCZKShort(eX) : '—'}
                </p>
              </div>
              {!isDiscovering && (eXBase > 0 && eXBase !== eX) ? (
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
                    Base Rate · {CONTRACT_RATE_PA}%
                  </p>
                  <p className="font-display text-xl sm:text-2xl font-black text-slate-300 tabular-nums leading-tight">
                    {formatCZKShort(eXBase)}
                  </p>
                </div>
              ) : null}
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">{insightSentence}</p>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Binding Constraint Bars ────────────────────────────

function BindingConstraintBars({ profile, isDiscovering = false }) {
  const {
    eX, effectiveIncome, dstiAtEX, ltvPct, maxLTVPct,
    winnerBank, bankResults, maturity, existingDebt, bottleneck,
  } = profile

  const netIncome = effectiveIncome || 0
  if (netIncome <= 0 || eX <= 0) return null

  const winnerResult  = bankResults?.[winnerBank]
  const dstiLimit     = winnerResult?.effectiveDSTI != null ? winnerResult.effectiveDSTI * 100 : 45
  const stressPayment = eX > 0 && maturity?.maxYears > 0
    ? monthlyPayment(eX, DUAL_STRESS_RATE_PA, maturity.maxYears)
    : 0
  const stressDSTI    = netIncome > 0
    ? Math.min(99, ((stressPayment + (existingDebt || 0)) / netIncome) * 100)
    : 0

  // PRAVIDLO_ANONYMITY: in discovery mode use generic labels — no DSTI/DTI/LTV terminology
  const bars = isDiscovering
    ? [
        {
          label:    'Income Capacity',
          sub:      `debt service at contract rate · limit ${dstiLimit.toFixed(0)}%`,
          value:    dstiAtEX,
          limit:    dstiLimit,
          isActive: bottleneck === 'DSTI',
        },
        {
          label:    'Debt Load',
          sub:      `obligation ratio at stress rate · same limit ${dstiLimit.toFixed(0)}%`,
          value:    stressDSTI,
          limit:    dstiLimit,
          isActive: bottleneck === 'DSTI',
        },
        {
          label:    'Loan Term',
          sub:      `age-based maturity cap`,
          value:    maturity?.maxYears > 0 ? (maturity.maxYears / 40) * 100 : 0,
          limit:    100,
          isActive: bottleneck === 'AGE',
          displayValue: maturity?.maxYears > 0 ? `${maturity.maxYears} yr` : '—',
          displayLimit: '40 yr max',
        },
      ]
    : [
        {
          label:    'Debt Service (DSTI)',
          sub:      `Test A at ${CONTRACT_RATE_PA}% contract rate · limit ${dstiLimit.toFixed(0)}%`,
          value:    dstiAtEX,
          limit:    dstiLimit,
          isActive: bottleneck === 'DSTI' || bottleneck === 'DI',
        },
        {
          label:    'Stress Test / DI',
          sub:      `Test B at ${DUAL_STRESS_RATE_PA}% stress rate · income after living costs & obligations`,
          value:    stressDSTI,
          limit:    dstiLimit,
          isActive: bottleneck === 'DSTI' || bottleneck === 'DI',
        },
        {
          label:    'LTV (Loan-to-Value)',
          sub:      `property collateral · cap ${maxLTVPct}%`,
          value:    ltvPct,
          limit:    maxLTVPct,
          isActive: bottleneck === 'LTV',
        },
      ]

  return (
    <div className="rounded-card border border-border bg-card overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-border">
        <p className="text-[10px] font-bold tracking-widest uppercase text-ink-subtle">
          {isDiscovering ? 'Capacity Assessment' : 'Binding Constraint'}
        </p>
        <p className="text-sm font-semibold text-ink mt-0.5">
          {isDiscovering
            ? 'How your financial profile scores against key qualification limits'
            : 'How your profile scores against each key regulatory limit'}
        </p>
      </div>
      <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {bars.map(({ label, sub, value, limit, isActive, displayValue, displayLimit }) => {
          const pct      = Math.min(100, limit > 0 ? (value / limit) * 100 : 0)
          const breached = value > limit
          const color    = breached ? '#EF4444' : isActive ? '#F59E0B' : '#10B981'
          return (
            <div key={label} className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink leading-tight">{label}</p>
                  <p className="text-[10px] text-ink-subtle mt-0.5 leading-tight">{sub}</p>
                </div>
                {breached && <span className="badge-risk text-[9px] flex-shrink-0">Exceeded</span>}
                {!breached && isActive && <span className="badge-warning text-[9px] flex-shrink-0">Binding</span>}
              </div>
              <div className="relative h-2.5 bg-surface rounded-full overflow-hidden border border-border">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-display font-black tabular-nums text-base" style={{ color }}>
                  {displayValue ?? `${value.toFixed(1)}%`}
                </span>
                <span className="text-[10px] text-ink-subtle">
                  {displayLimit ?? `limit ${limit.toFixed(0)}%`}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Profile Breakdown Grid ─────────────────────────────

function ProfileBreakdownGrid({ formData, profile }) {
  const {
    residenceStatus = '', yearsInCZ = '', entityType = '',
    contractType = '', isProbation = false, probationPeriod = '', employmentSector = '',
    purchasePrice = 0, ownFunds = 0, propertyPurpose = '',
    businessName = '', naceSector = '', businessAgeMonths = null,
  } = formData
  const { effectiveIncome, ltvPct, maxLTVPct, ltvBreached } = profile

  const inProbation = isProbation || probationPeriod === 'yes'
  const own = purchasePrice > 0 ? (ownFunds / purchasePrice) * 100 : 0

  const residenceLabels = {
    eu: 'EU / EEA Citizen', permanent: 'Permanent Residence',
    longterm5plus: 'Long-term 5+ yrs', longterm: 'Long-term Residence',
    employment: 'Long-term (Work/Business)', other: 'Other / Student',
  }
  const purposeLabels   = { primary: 'Primary Residence', investment: 'Investment / Rental', holiday: 'Holiday Home' }
  const contractLabels  = { indefinite: 'Indefinite', definite: 'Fixed-term', agency: 'Agency', dpc: 'DPC (Supplemental)' }
  const yrsLabels       = { less1: '<1 yr', '1-2': '1–2 yrs', '2-5': '2–5 yrs', '5-10': '5–10 yrs', '10plus': '10+ yrs' }
  const sectorLabels    = { health: 'Healthcare', education: 'Education', other: 'Private sector' }

  const bizDuration = businessAgeMonths !== null ? (() => {
    const y = Math.floor(businessAgeMonths / 12)
    const m = businessAgeMonths % 12
    if (y > 0 && m > 0) return `Active for ${y} yr ${m} mo`
    if (y > 0) return `Active for ${y} yr`
    return `Active for ${m} mo`
  })() : null

  const cards = [
    {
      title: 'Residence',
      CardIcon: MapPin,
      primary: residenceLabels[residenceStatus] ?? '—',
      secondary: yearsInCZ
        ? `${yrsLabels[yearsInCZ] ?? yearsInCZ} in Czech Republic`
        : 'Tenure not specified',
      status: !residenceStatus ? 'review'
        : (residenceStatus === 'eu' || residenceStatus === 'permanent') ? 'strong'
        : (residenceStatus === 'longterm5plus' || residenceStatus === 'longterm' || residenceStatus === 'employment') ? 'good'
        : 'risk',
    },
    {
      title: entityType === 'zamestnanec' ? 'Employment' : 'Business Structure',
      CardIcon: entityType === 'zamestnanec' ? Briefcase : Building2,
      primary: entityType === 'zamestnanec'
        ? (contractLabels[contractType] ?? 'Contract not specified')
        : entityType === 'osvc' ? (businessName || 'Self-Employed')
        : entityType === 'sro' ? 's.r.o. Director' : '—',
      secondary: entityType === 'zamestnanec'
        ? (inProbation
            ? `Probation active · ${sectorLabels[employmentSector] ?? 'Sector not specified'}`
            : `Not in probation · ${sectorLabels[employmentSector] ?? 'Sector not specified'}`)
        : bizDuration ?? (naceSector || 'Industry not resolved'),
      status: entityType === 'zamestnanec'
        ? (inProbation && employmentSector !== 'health' && employmentSector !== 'education' ? 'risk'
           : inProbation ? 'review'
           : contractType === 'indefinite' ? 'strong' : contractType ? 'good' : 'review')
        : !entityType ? 'review'
        : businessAgeMonths !== null ? (businessAgeMonths < 12 ? 'risk' : businessAgeMonths < 24 ? 'review' : 'good')
        : 'review',
    },
    {
      title: 'Recognised Income',
      CardIcon: DollarSign,
      primary: effectiveIncome > 0 ? `${formatCZK(effectiveIncome)}/mo` : '—',
      secondary: entityType === 'osvc' ? 'Recognised from annual / monthly turnover'
        : entityType === 'sro'         ? 'ESSO-assessed director income'
        : entityType === 'zamestnanec' ? 'Net monthly salary (after deductions)'
        : 'Income not assessed',
      status: effectiveIncome > 0
        ? (effectiveIncome > 80_000 ? 'strong' : effectiveIncome > 40_000 ? 'good' : 'review')
        : 'review',
    },
    {
      title: 'Property',
      CardIcon: Home,
      primary: purchasePrice > 0 ? formatCZKShort(purchasePrice) : '—',
      secondary: purchasePrice > 0
        ? `${purposeLabels[propertyPurpose] ?? 'Purpose not set'} · ${own.toFixed(0)}% own funds · LTV ${ltvPct.toFixed(0)}% / ${maxLTVPct}%`
        : 'Property details not entered',
      status: !purchasePrice ? 'review' : ltvBreached ? 'risk' : ltvPct > 70 ? 'good' : 'strong',
    },
  ]

  const dotColor = { strong: '#10B981', good: '#3B82F6', review: '#F59E0B', risk: '#EF4444' }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ title, CardIcon, primary, secondary, status }) => (
        <div key={title} className="rounded-card border border-border bg-card p-5 flex flex-col gap-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0">
                <CardIcon size={14} className="text-ink-muted" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-subtle truncate">{title}</p>
            </div>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor[status] ?? '#94A3B8' }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink leading-snug break-words">{primary}</p>
            <p className="text-[11px] text-ink-subtle mt-1 leading-relaxed break-words">{secondary}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Recommended Strategy ──────────────────────────────

function RecommendedStrategy({ score, profile, formData }) {
  const { bottleneck, redFlags, ltvPct, maxLTVPct, eX } = profile

  const actions = []

  if (redFlags.length > 0) {
    actions.push({
      priority: 'Critical', color: '#EF4444',
      title: 'Resolve Hard Blocks Before Applying',
      text: `Your profile has ${redFlags.length} critical flag${redFlags.length > 1 ? 's' : ''} that will trigger automatic decline at most banks. Address these before any formal application.`,
    })
  }

  if (bottleneck === 'LTV' || ltvPct > maxLTVPct * 0.92) {
    actions.push({
      priority: 'High Impact', color: '#F59E0B',
      title: 'Increase Down-Payment',
      text: `LTV is the binding constraint at ${ltvPct.toFixed(0)}% against a ${maxLTVPct}% cap. Increasing own funds by 5–10% directly expands borrowing capacity and unlocks better rate pricing.`,
    })
  } else if (bottleneck === 'DSTI' || bottleneck === 'DI') {
    actions.push({
      priority: 'High Impact', color: '#F59E0B',
      title: 'Reduce Monthly Obligation Load',
      text: bottleneck === 'DI'
        ? 'Disposable income after living costs is the binding limit. Closing credit card limits and clearing loans before application directly expands available capacity — each CZK of freed monthly budget multiplies to significant additional loan headroom.'
        : 'Debt service ratio is the binding constraint. Closing credit card limits and paying down loans before application directly increases available DSTI headroom.',
    })
  } else if (bottleneck === 'DTI') {
    actions.push({
      priority: 'High Impact', color: '#F59E0B',
      title: 'Reduce Outstanding Debt (DTI)',
      text: 'Total debt-to-income ratio is the cap. Reducing outstanding loan balances or increasing the annual income base are the highest-return actions available.',
    })
  }

  if (formData.entityType === 'osvc') {
    actions.push({
      priority: 'Strategy', color: '#3B82F6',
      title: 'Select the Right Income Recognition Method',
      text: 'Two assessment methods are available (Tax Return vs Bank Turnover). The method applied determines your recognised income — and therefore which lender to approach first. This is the highest-value decision for self-employed applicants.',
    })
  }

  if (formData.entityType === 'osvc' && formData.businessAgeMonths !== null && formData.businessAgeMonths < 24) {
    actions.push({
      priority: formData.businessAgeMonths < 12 ? 'Critical' : 'High Impact',
      color: formData.businessAgeMonths < 12 ? '#EF4444' : '#F59E0B',
      title: formData.businessAgeMonths < 12 ? 'Establish 12-Month Trading History' : 'Reach 24-Month Threshold',
      text: formData.businessAgeMonths < 12
        ? 'Under 12 months of trading history — most banks require at least 12 months. A continuity path from prior employment in the same sector and NACE code may be the fastest route.'
        : `At ${formData.businessAgeMonths} months, a 15% income haircut applies. Crossing the 24-month mark removes this haircut and unlocks full income recognition at most Czech banks.`,
    })
  }

  actions.push({
    priority: score >= 75 ? 'Next Step' : 'Recommended', color: '#10B981',
    title: 'Book a Strategy Session',
    text: score >= 75
      ? 'Your profile is submission-ready. A focused session identifies the optimal lender, locks in the best rate, and initiates pre-approval — typically within 2–3 weeks of submission.'
      : 'A strategy session maps your lender options, identifies the income recognition path that works in your favour, and sets a realistic timeline for improving the profile before application.',
  })

  return (
    <div className="rounded-card border border-border bg-card overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-border">
        <p className="text-[10px] font-bold tracking-widest uppercase text-ink-subtle">Recommended Strategy</p>
        <p className="text-sm font-semibold text-ink mt-0.5">Priority actions based on your profile</p>
      </div>
      <div className="p-5 sm:p-6 space-y-5">
        {actions.slice(0, 4).map(({ priority, color, title, text }, i) => (
          <div key={i} className="flex gap-4 min-w-0">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold mt-0.5"
              style={{ background: color }}
            >
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-sm font-semibold text-ink leading-tight break-words">{title}</p>
                <span
                  className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ color, background: `${color}18`, border: `1px solid ${color}40` }}
                >
                  {priority}
                </span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed break-words">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Hero Verdict Post-Gate ────────────────────────────

function HeroVerdictPost({ score, cfg, profile, formData }) {
  const { eX, eXStress, eXBase, riskStatus, bottleneck, effectiveIncome,
    maxPropertyPrice, minOwnFunds, discoveryLTVPct } = profile
  const isDiscovering = formData.propertyMode === 'discovering'

  const riskBand = {
    zelena:   'Low Risk',
    oranzova: 'Moderate Risk',
    cervena:  'Higher Risk',
  }[riskStatus] ?? 'Under Assessment'

  // Dynamic 2-3 sentence summary — no bank names; generic labels in discovery mode
  const summary = (() => {
    const s1 = isDiscovering
      ? eX > 0
        ? `Based on your income profile, your estimated maximum loan is ${formatCZKShort(eX)}. See the Budget Discovery section for your estimated property price range and minimum own funds required.`
        : 'Your profile has been assessed under Czech bank dual-test methodology.'
      : eX > 0
        ? `Based on your profile, you qualify for an estimated maximum loan of ${formatCZKShort(eX)} under the dual-rate stress test (${CONTRACT_RATE_PA}% / ${DUAL_STRESS_RATE_PA}%). The lower of the two results is applied.`
        : 'Your profile has been assessed under the Czech bank dual-test methodology.'

    const s2 = isDiscovering
      ? (bottleneck === 'DSTI' || bottleneck === 'DTI')
        ? 'Your obligation load is the key constraint — reducing monthly commitments before applying would directly expand your available budget range.'
        : 'Your income capacity and debt load are within qualifying bounds for the estimated budget range shown above.'
      : bottleneck === 'LTV'
        ? 'Your loan-to-value ratio is the primary constraint — increasing your down-payment is the single highest-impact action to expand capacity.'
        : bottleneck === 'DI'
        ? 'Your disposable income (after living costs and obligations) is the binding constraint — reducing monthly commitments before application is the highest-impact action.'
        : bottleneck === 'DSTI'
        ? 'Debt service ratio is the binding constraint; reducing monthly obligations before application directly expands available borrowing capacity.'
        : bottleneck === 'DTI'
        ? 'Your total debt-to-income ratio is the cap — reducing outstanding loan balances or growing the annual income base are the highest-return actions before applying.'
        : formData.entityType === 'osvc'
        ? 'As a self-employed applicant, your income recognition method and turnover structure are the key variables — a specialist lender match significantly affects your final offer.'
        : formData.entityType === 'sro'
        ? 'Director income is assessed under ESSO methodology; the recognised figure depends on company financials, ownership structure, and fiscal history.'
        : riskStatus === 'zelena'
        ? 'Your profile scores in the strong band — most lenders will process this application through standard underwriting without additional conditions.'
        : 'Income recognised is within standard bounds; a targeted lender selection will determine the best offer.'

    const s3 = score >= 75
      ? 'Your profile is submission-ready — the next step is lender pre-approval, which typically completes within 2–3 weeks of a full application submission.'
      : score >= 55
      ? 'With focused preparation, this profile can reach submission stage. Book a session to map the fastest path to pre-approval.'
      : 'A strategy session will identify the specific steps needed and the realistic timeline to reach a bankable position.'

    return `${s1} ${s2} ${s3}`
  })()

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="h-0.5 w-full" style={{ background: cfg.color }} />
      <div className="px-5 sm:px-8 py-6">
        <p className="text-[10px] font-bold tracking-widest uppercase text-ink-subtle mb-5">Your Assessment Result</p>
        <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">

          {/* Score number */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <p className="font-display text-[72px] font-black text-blue-900 leading-none tabular-nums w-36 text-center flex-shrink-0">{score}</p>
            <div className="min-w-0">
              <p className="text-[10px] text-ink-subtle uppercase tracking-wide mb-0.5">Readiness Score</p>
              <p className="font-display text-xl font-black text-ink leading-tight">{cfg.label}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                <span className="text-xs text-ink-muted">{riskBand}</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block w-px bg-border self-stretch flex-shrink-0" />

          {/* Loan figures + summary */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-4">
              <div>
                <p className="text-[10px] text-ink-subtle uppercase tracking-wide mb-1">
                  Maximum Loan Estimate
                </p>
                <p className="font-display text-2xl font-black text-ink tabular-nums leading-tight">
                  {eX > 0 ? formatCZKShort(eX) : '—'}
                </p>
              </div>
              {!isDiscovering && (eXBase > 0 && eXBase !== eX) ? (
                <div>
                  <p className="text-[10px] text-ink-subtle uppercase tracking-wide mb-1">Base Rate · {CONTRACT_RATE_PA}%</p>
                  <p className="font-display text-xl font-black text-ink-muted tabular-nums leading-tight">
                    {formatCZKShort(eXBase)}
                  </p>
                </div>
              ) : null}
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">{summary}</p>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Soft Lock Gate ────────────────────────────────────

const GFORM_ENDPOINT = 'https://docs.google.com/forms/d/e/1FAIpQLSddO9mI3_GJL4W4TzS2atu4vbKAIiI2TUEVRN__GaQJeqeogA/formResponse'

const GATE_SECTIONS = [
  { title: 'Score breakdown',         sub: '10 eligibility factors evaluated' },
  { title: 'Loan capacity estimate',  sub: 'Maximum borrowing range and scenario analysis' },
  { title: 'How this was calculated', sub: 'Czech bank underwriting methodology' },
  { title: 'Next steps',              sub: 'From pre-scoring to property handover' },
]

function SoftLockGate({ onUnlock, formData }) {
  const [form, setForm]             = useState({ name: '', email: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    setSubmitting(true)

    // Google Forms — fire and forget (no-cors; opaque response is expected)
    const gf    = new URLSearchParams()
    const parts = form.name.trim().split(' ')
    gf.append('entry.1796948790', parts[0])
    gf.append('entry.1494908840', parts.slice(1).join(' ') || parts[0])
    gf.append('entry.80055551',   form.email)
    gf.append('entry.1807846036', form.phone || '')
    fetch(GFORM_ENDPOINT, { method: 'POST', mode: 'no-cors', body: gf }).catch(() => {})

    onUnlock(form.name.trim())
  }

  const canSubmit = !submitting && form.name.trim() && form.email.trim()

  return (
    <div>
      {/* Blurred peek of locked sections */}
      <div className="rounded-t-2xl border border-b-0 border-border overflow-hidden">
        <div
          className="pointer-events-none select-none bg-card px-6 py-4 space-y-3"
          style={{ filter: 'blur(3px)', opacity: 0.22 }}
          aria-hidden="true"
        >
          {GATE_SECTIONS.map(({ title, sub }) => (
            <div key={title} className="flex items-center gap-4 py-2">
              <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-ink">{title}</p>
                <p className="text-[11px] text-ink-subtle mt-0.5">{sub}</p>
              </div>
              <ChevronDown size={16} className="text-ink-subtle flex-shrink-0" />
            </div>
          ))}
        </div>
        {/* Fade out the peek */}
        <div className="h-14 bg-gradient-to-b from-card to-surface" />
      </div>

      {/* Gate form card — visually connected below */}
      <div className="rounded-b-2xl border border-t-0 border-border bg-card shadow-lg px-4 sm:px-8 py-6 sm:py-10">

        <p className="text-[10px] font-bold tracking-widest uppercase text-brand-600 mb-3">
          Full Assessment
        </p>
        <h3 className="font-display text-xl sm:text-2xl font-black text-ink mb-3 leading-tight">
          Access your full mortgage assessment
        </h3>
        <p className="text-sm text-ink-muted leading-relaxed mb-7 max-w-lg">
          We generate a preliminary mortgage assessment based on standard Czech mortgage
          evaluation criteria. Save your result to access the full breakdown — DTI, DSTI,
          income structure, and risk factors.
        </p>

        <form onSubmit={handleSubmit} className="max-w-sm space-y-4">

          <div>
            <label htmlFor="gate-name" className="section-label mb-1.5 block">
              Full Name <span className="text-risk-DEFAULT">*</span>
            </label>
            <input
              id="gate-name"
              type="text"
              required
              value={form.name}
              onChange={set('name')}
              placeholder="Your full name"
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="gate-email" className="section-label mb-1.5 block">
              Email Address <span className="text-risk-DEFAULT">*</span>
            </label>
            <input
              id="gate-email"
              type="email"
              required
              value={form.email}
              onChange={set('email')}
              placeholder="your@email.com"
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="gate-phone" className="section-label mb-1.5 block">
              Phone{' '}
              <span className="text-ink-subtle font-normal text-[11px]">(optional)</span>
            </label>
            <input
              id="gate-phone"
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="+420 …"
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-cta w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {submitting ? 'Sending…' : 'Send me my full assessment'}
          </button>

          <p className="text-[11px] text-ink-subtle text-center pt-1">
            No spam. Your data is used only to deliver your report.
          </p>

        </form>
      </div>
    </div>
  )
}

// ── Accordion section ─────────────────────────────────

function AccordionSection({ title, subtitle, icon: Icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 hover:bg-surface transition-colors focus:outline-none group"
      >
        <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-brand-600" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-[14px] font-semibold text-ink leading-snug">{title}</p>
          <p className="text-[11px] text-ink-subtle mt-0.5 leading-relaxed">{subtitle}</p>
        </div>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-ink-subtle transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-border animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Main Results Dashboard ────────────────────────────

export default function Step7Results({ formData, onBack, onRestart }) {
  const score = computeScore(formData)
  const cfg   = scoreCfg(score)

  const [isUnlocked,    setIsUnlocked]    = useState(false)
  const [unlockedName,  setUnlockedName]  = useState('')
  const [pdfLoading,    setPdfLoading]    = useState(false)

  const isDiscovering = formData.propertyMode === 'discovering'

  // E[X] for sticky header
  const resolvedIncome    = formData.netMonthlySalary > 0 ? formData.netMonthlySalary : formData.netIncome
  const incomeForHeader   = resolvedIncome || 0
  const headerProfile     = computeMortgageProfile({ ...formData, netIncome: incomeForHeader })
  const maxLoanForHeader  = headerProfile.eX

  // ESSO flags
  const essoProfile   = formData.entityType === 'sro' ? computeMortgageProfile(formData) : null
  const essoHardBlock = essoProfile?.redFlags.includes('sro_negative_financials') || essoProfile?.redFlags.includes('sro_insufficient_history')
  const essoMedRisk   = essoProfile && !essoHardBlock && essoProfile.flags.includes('sro_medium_risk_50pct_cap')

  return (
    <main className="animate-fade-up">

      {/* ── Sticky result header ─────────────────────── */}
      <div className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-6 min-w-0">

          {/* Mini gauge + score */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <svg viewBox="0 0 44 44" className="w-9 h-9" aria-hidden="true">
              <circle cx="22" cy="22" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
              <circle cx="22" cy="22" r="16" fill="none"
                stroke={cfg.color} strokeWidth="3.5"
                strokeDasharray={`${2 * Math.PI * 16 * (score / 100)} ${2 * Math.PI * 16 * (1 - score / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 22 22)"
              />
              <text x="22" y="26" textAnchor="middle" fill="white" fontSize="9"
                fontWeight="800" fontFamily="Manrope, Inter, sans-serif">{score}</text>
            </svg>
            <div>
              <p className="text-[10px] text-slate-500 leading-tight">Score</p>
              <p className="text-white text-[13px] font-semibold leading-tight">{cfg.label}</p>
            </div>
          </div>

          <div className="w-px h-8 bg-white/10 flex-shrink-0 hidden sm:block" />

          {/* Max loan */}
          {incomeForHeader > 0 && maxLoanForHeader > 0 && (
            <div className="flex-shrink-0">
              <p className="text-[10px] text-slate-500 leading-tight">Max loan estimate</p>
              <p className="text-white font-display font-black text-base tabular-nums leading-tight">
                {formatCZKShort(maxLoanForHeader)}
              </p>
            </div>
          )}

          {/* Spacer + restart */}
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={onRestart}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-[11px] transition-colors"
            >
              <RotateCcw size={11} />
              <span className="hidden sm:inline">Restart analysis</span>
            </button>
          </div>

        </div>
      </div>

      {/* ── Page content ─────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">

        {/* ── Headline Verdict ─────────────────────────── */}
        <HeadlineVerdict score={score} cfg={cfg} profile={headerProfile} formData={formData} />

        {/* ── ESSO callouts (s.r.o. only, always visible) ─ */}
        {essoHardBlock && (
          <div className="flex items-start gap-4 rounded-card border-2 border-risk-border bg-risk-light p-5">
            <AlertTriangle size={18} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-display text-base font-bold text-risk-text mb-1">ESSO Assessment — Hard Block</p>
              <p className="text-sm text-risk-text leading-relaxed">
                Your corporate financials do not currently meet the standard underwriting criteria
                for an owned-company income assessment. No income from this source can be recognised
                under current ESSO methodology. Your advisor will walk you through alternative income
                pathways during your strategy session.
              </p>
            </div>
          </div>
        )}
        {essoMedRisk && (
          <div className="flex items-start gap-4 rounded-card border-2 border-warning-border bg-warning-light p-5">
            <AlertTriangle size={18} className="text-warning-DEFAULT flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-display text-base font-bold text-warning-text mb-1">ESSO Medium Risk — 50% Income Recognition Cap</p>
              <p className="text-sm text-warning-text leading-relaxed">
                Due to current company risk rating (1–2 completed fiscal years), this income source
                is recognised at <strong>50%</strong> of the declared base under Czech bank ESSO
                methodology. Full recognition becomes available once the company completes its second
                full fiscal year.
              </p>
            </div>
          </div>
        )}

        {/* ── Business activity gap warning ───────────────── */}
        {formData.entityType !== 'zamestnanec' && formData.businessActivityGap && (
          <div className="flex items-start gap-4 rounded-card border-2 border-warning-border bg-warning-light p-5">
            <AlertTriangle size={18} className="text-warning-DEFAULT flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-display text-base font-bold text-warning-text mb-1">Risk Alert: Interrupted Business Activity</p>
              <p className="text-sm text-warning-text leading-relaxed">
                The Czech Business Register (ARES) indicates that this business registration was
                suspended or has a dissolution record on file. Most Czech lenders treat interrupted
                business history as a risk factor — it may trigger additional underwriting scrutiny
                or income haircuts. We recommend discussing this with your mortgage advisor before
                submitting any formal application.
              </p>
            </div>
          </div>
        )}

        {/* ── Soft lock gate OR full content ──────────────── */}
        {!isUnlocked ? (
          <SoftLockGate
            onUnlock={(name) => { setIsUnlocked(true); setUnlockedName(name || '') }}
            formData={formData}
          />
        ) : (
          <>
            {/* ── Binding Constraint Bars ─────────────── */}
            <BindingConstraintBars profile={headerProfile} isDiscovering={isDiscovering} />

            {/* ── Discovery Budget Card (discovering mode only) ── */}
            {isDiscovering && (
              <DiscoveryBudgetCard profile={headerProfile} formData={formData} />
            )}

            {/* ── Profile Breakdown Grid ──────────────── */}
            <ProfileBreakdownGrid formData={formData} profile={headerProfile} />

            {/* ── Income Recognition ──────────────────── */}
            <AccordionSection
              title={formData.entityType === 'zamestnanec' ? 'Employment Profile' : 'Income Recognition'}
              subtitle={
                formData.entityType === 'zamestnanec'
                  ? 'Contract type, stability assessment, and recognised income'
                  : 'Assessment method, recognised monthly income, and verification status'
              }
              icon={formData.entityType === 'zamestnanec' ? Briefcase : Building2}
              defaultOpen
            >
              <ApplicantProfilePanel formData={formData} profile={headerProfile} />
            </AccordionSection>

            {/* ── Hero Verdict (post-gate summary) ────────── */}
            <HeroVerdictPost score={score} cfg={cfg} profile={headerProfile} formData={formData} />

            {/* ── Recommended Strategy ────────────────── */}
            <RecommendedStrategy score={score} profile={headerProfile} formData={formData} />

            {/* ── Strategy call + PDF — combined CTA ───── */}
            <div className="rounded-2xl bg-dark-900 border border-white/10 px-5 sm:px-10 py-8">
              <p className="text-[10px] font-bold tracking-widest uppercase text-brand-400 mb-3">
                Next Steps
              </p>
              <h3 className="font-display text-xl sm:text-2xl font-black text-white mb-3 leading-tight break-words">
                Turn your assessment into an approved mortgage
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-7 max-w-lg break-words">
                Book a 30-minute strategy call to discuss these results and get matched with the right lender.
                Or download your personalised Mortgage Intelligence Report as PDF.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <a
                  href="https://calendly.com/andy-lkadvisor/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-cta justify-center"
                >
                  <Calendar size={15} className="flex-shrink-0" />
                  Book a 30-minute strategy call
                </a>
                <button
                  type="button"
                  disabled={pdfLoading}
                  onClick={async () => {
                    setPdfLoading(true)
                    try {
                      const resolvedIncome = (formData.netMonthlySalary > 0 ? formData.netMonthlySalary : formData.netIncome) || 0
                      const blob = await generateMortgagePdf({ ...formData, netIncome: resolvedIncome }, unlockedName)
                      const safeName = (unlockedName || 'applicant').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'applicant'
                      const url  = URL.createObjectURL(blob)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = `mortgage-assessment-${safeName}.pdf`
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                      URL.revokeObjectURL(url)
                    } catch (err) {
                      console.error('[MortgageScore] PDF error:', err)
                    } finally {
                      setPdfLoading(false)
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold px-6 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed break-words"
                >
                  <FileText size={15} className="flex-shrink-0" />
                  {pdfLoading ? 'Generating…' : 'Download Intelligence Report (PDF)'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Regulatory footer ─────────────────────────── */}
        <div className="flex items-start gap-2 pt-2 pb-8">
          <Info size={12} className="text-ink-subtle flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-ink-subtle leading-relaxed">
            This assessment is indicative only and reflects 2026 Czech bank underwriting
            guidelines. Final mortgage approval always
            depends on individual bank assessment, document verification, and credit committee
            decisions. This tool does not constitute financial advice.
          </p>
        </div>

      </div>
    </main>
  )
}
