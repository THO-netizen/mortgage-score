import { useState, useEffect } from 'react'
import {
  AlertTriangle, CheckCircle, TrendingUp, Home,
  Shield, DollarSign, FileText, BarChart2, Calendar,
  Users, Award, MapPin, RotateCcw, ArrowLeft, Info,
  Briefcase, Activity, ChevronDown,
} from 'lucide-react'
import { formatCZK, formatCZKShort } from '../../utils/formatters.js'
import {
  computeScore, computeMortgageProfile,
  monthlyPayment, annuityFactor,
  getMaxLTV, getMaxDTI, calcMaxMaturity,
} from '../../utils/scoringEngine.js'
import HowItWorks        from '../results/HowItWorks.jsx'
import InlineLeadCapture from '../results/InlineLeadCapture.jsx'

// ── Constants ──────────────────────────────────────────

const GAUGE_R    = 60
const GAUGE_CIRC = 2 * Math.PI * GAUGE_R

const TIMELINE_STEPS = [
  { label: 'Pre-scoring Check',        desc: 'Free eligibility assessment complete — you are here.',                                                              done: true,  current: true  },
  { label: 'Property Search & Offer',  desc: 'Locate your property and agree a purchase price with the seller.',                                                  done: false, current: false },
  { label: 'Reservation Agreement',    desc: 'Reservation Agreement (Rezervační smlouva) — secure the property with a 3–5% deposit.',                            done: false, current: false },
  { label: 'Bank Pre-approval',        desc: 'Submit indicative application to selected lenders for competing offers.',                                           done: false, current: false },
  { label: 'Property Appraisal',       desc: 'Property Appraisal (Odhad nemovitosti) — bank-commissioned valuer confirms market value.',                         done: false, current: false },
  { label: 'Full Mortgage Application',desc: 'Submit complete document package: income evidence, bank statements, company financials.',                           done: false, current: false },
  { label: 'Bank Underwriting',        desc: 'Credit committee review — typically 10–20 working days for Self-employed (OSVČ) and Company Director applicants.', done: false, current: false },
  { label: 'Mortgage Contract',        desc: 'Mortgage Contract (Úvěrová smlouva) signed; disbursement conditions and drawdown date confirmed.',                 done: false, current: false },
  { label: 'Land Registry Filing',     desc: 'Land Registry (Katastr nemovitostí) — property lien (zástavní právo) registered against the title.',               done: false, current: false },
  { label: 'Property Handover',        desc: 'Property Handover (Předání nemovitosti) — keys exchanged, mortgage live, ownership transferred.',                  done: false, current: false },
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
    eX, eXStress, varX, dstiAtEX, bottleneck, flags, redFlags } = profile

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
    detail: { indefinite: 'Indefinite contract (HPP)', definite: 'Fixed-term contract', agency: 'Agency / temp worker', dpc: 'DPČ / DPP agreement' }[contractType] ?? 'Contract not specified',
    desc: (() => {
      const parts = []
      const inProbation = isProbation || probationPeriod === 'yes'
      if (inProbation) {
        if (employmentSector === 'health' || employmentSector === 'education')
          parts.push('Probation — ČSOB exception applies (Healthcare/Education); manual HQ underwriting route.')
        else
          parts.push('In probation period — most banks will decline until probation ends.')
      } else {
        parts.push('Not in probation — standard underwriting applies.')
      }
      if (contractType === 'definite') {
        if (flags.includes('fixed_term_expiring_soon'))
          parts.push('Fixed-term contract expiring soon — lenders may request evidence of renewal. Advisor review recommended.')
        else
          parts.push('Fixed-term contract — assessed identically to indefinite HPP when end date is >2 months away.')
      }
      if (contractType === 'agency')   parts.push('Agency contract: 25% income haircut; higher variance across banks.')
      if (contractType === 'dpc')      parts.push('DPČ/DPP: treated as supplemental income; 30% haircut applied.')
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
      if (entityType === 'osvc') return 'Self-employed (OSVČ)'
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
        const base = 'Sole traders assessed on 2-year average net profit from DPFO tax returns.'
        if (businessAgeMonths === null) return base
        const y = Math.floor(businessAgeMonths / 12)
        const m = businessAgeMonths % 12
        const age = y > 0 ? `${y} yr ${m > 0 ? m + ' mo' : ''}`.trim() : `${m} months`
        const ageNote = businessAgeMonths >= 24
          ? `Business age ${age} — 24-month requirement met by all banks.`
          : businessAgeMonths >= 12
          ? `Business age ${age} — below 24 months; 15% income haircut applied; ČS/mBank require 24 months.`
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
    eX, eXStress, varX, dstiAtEX, bottleneck, maturity,
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
          ? `Acceptable — above 70% LTV some banks add a risk premium. Cap is ${maxLTVPct}% (${propertyPurpose === 'investment' ? 'investment hard limit' : applicantAge < 36 ? 'První bydlení' : 'CNB standard'}).`
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
      <text x="80" y="76" textAnchor="middle"
        fill="#0F172A" fontSize="30" fontWeight="800"
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
    DSTI: `DSTI ${dstiAtEX.toFixed(0)}% at or near 45% CNB ceiling`,
    AGE:  `Age constraint limits maturity to ${maturity.maxYears} years`,
  }[bottleneck] ?? 'Profile within all limits'

  const MetricCell = ({ label, value, warn }) => (
    <div className={`rounded-xl px-4 py-3 border ${warn ? 'bg-risk-light border-risk-border' : 'bg-surface border-border'}`}>
      <p className="text-[10px] font-semibold text-ink-subtle uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`font-display text-sm font-extrabold tabular-nums ${warn ? 'text-risk-DEFAULT' : 'text-ink'}`}>{value}</p>
    </div>
  )

  return (
    <div className={`rounded-card border-2 ${cfg.border} overflow-hidden`}>
      {/* Header */}
      <div className={`${cfg.bg} px-6 py-5`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
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
              <p className={`font-display text-2xl font-black tabular-nums ${cfg.text}`}>
                {eX > 0 ? formatCZKShort(eX) : '—'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="p-5 bg-card">
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
    eX, eXStress, varX, dstiAtEX, bottleneck, maturity, netIncome, existingDebt } = factor
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
          <div className="flex justify-between text-xs">
            <span className="text-ink-muted">Expected loan @ 4.5% / {maturity?.maxYears ?? 20} yr</span>
            <span className="font-bold text-ink tabular-nums">{formatCZK(eX)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-muted">Stress test @ 6.5%</span>
            <span className="font-semibold text-warning-text tabular-nums">{formatCZK(eXStress)}</span>
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
    <div className="card-surface p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp size={16} className="text-brand-600" />
        <h3 className="font-display text-lg font-extrabold text-ink">Scenario Simulator</h3>
        {simMaxYears < 30 && (
          <span className="badge-warning text-[10px] ml-auto">Age cap: max {simMaxYears} yr</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 mb-7">
        <SliderRow label="Purchase Price" value={s.price}
          min={1_000_000} max={25_000_000} step={100_000}
          format={(v) => formatCZK(v)} onChange={(v) => upd('price', v)} />
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
          <span className="section-label">Monthly Net Income</span>
          <span className="font-display text-base font-extrabold text-ink tabular-nums">{formatCZK(s.netIncome)}</span>
        </div>
        <input type="range" min={20_000} max={500_000} step={5_000} value={s.netIncome}
          onChange={(e) => upd('netIncome', Number(e.target.value))} className="slider-field" />
        <p className="text-[11px] text-ink-subtle mt-1">Updates the loan capacity estimate in real time.</p>
      </div>

      {/* Results */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <p className="section-label mb-1">Loan</p>
            <p className="font-display text-lg font-extrabold text-ink tabular-nums leading-tight">
              {formatCZKShort(loanAmt)}
            </p>
          </div>
          <div className="text-center border-x border-border px-2">
            <p className="section-label mb-1">LTV</p>
            <p className={`font-display text-lg font-extrabold tabular-nums leading-tight ${ltvAlert ? 'text-risk-DEFAULT' : simLTV > 70 ? 'text-warning-DEFAULT' : 'text-success-DEFAULT'}`}>
              {simLTV.toFixed(0)}%
            </p>
          </div>
          <div className="text-center border-r border-border px-2">
            <p className="section-label mb-1">DTI</p>
            <p className={`font-display text-lg font-extrabold tabular-nums leading-tight ${dtiAlert ? 'text-risk-DEFAULT' : 'text-success-DEFAULT'}`}>
              {s.netIncome > 0 ? `${simDTI.toFixed(1)}×` : '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="section-label mb-1">DSTI</p>
            <p className={`font-display text-lg font-extrabold tabular-nums leading-tight ${dstiAlert ? 'text-risk-DEFAULT' : simDSTI > 35 ? 'text-warning-DEFAULT' : 'text-success-DEFAULT'}`}>
              {s.netIncome > 0 ? `${simDSTI.toFixed(0)}%` : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm font-semibold text-ink">Estimated Monthly Payment</p>
          <p className="font-display text-2xl font-black text-ink tabular-nums">{formatCZK(Math.round(payment))}</p>
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
    <div className="card-surface p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-6">
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
    osvc:        'Self-employed (OSVČ)',
    sro:         'Company director (s.r.o.)',
  }[formData.entityType] ?? 'Income assessed'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

      <div className={`rounded-2xl border p-5 ${riskMeta.bg}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-subtle mb-2">Risk Band</p>
        <p className={`font-display text-2xl font-black ${riskMeta.text}`}>{riskMeta.label}</p>
        <p className="text-[11px] text-ink-subtle mt-1">Based on your profile inputs</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-subtle mb-2">Borrowing Range</p>
        <p className="font-display text-2xl font-black text-ink tabular-nums">
          {eX > 0 ? formatCZKShort(eX) : '—'}
        </p>
        {eXStress > 0 && (
          <p className="text-[11px] text-ink-subtle mt-1">Stress test: {formatCZKShort(eXStress)}</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-subtle mb-2">Income Structure</p>
        <p className="font-display text-sm font-bold text-ink">{entityLabel}</p>
        <p className="text-[11px] text-ink-subtle mt-1">Czech bank methodology applied</p>
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

    onUnlock()
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
      <div className="rounded-b-2xl border border-t-0 border-border bg-card shadow-lg px-6 sm:px-10 py-8 sm:py-10">

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
        className="w-full flex items-center gap-4 px-6 py-5 hover:bg-surface transition-colors focus:outline-none group"
      >
        <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-brand-600" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-[14px] font-semibold text-ink leading-snug">{title}</p>
          <p className="text-[11px] text-ink-subtle mt-0.5">{subtitle}</p>
        </div>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-ink-subtle transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-6 border-t border-border animate-fade-in">
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
  const [simNetIncome, setSimNetIncome] = useState(
    (formData.netMonthlySalary || formData.netIncome) > 0
      ? (formData.netMonthlySalary || formData.netIncome)
      : 80_000
  )

  const factors = buildFactors(formData, simNetIncome)

  // E[X] for sticky header and summary card
  const resolvedIncome    = formData.netMonthlySalary > 0 ? formData.netMonthlySalary : formData.netIncome
  const incomeForHeader   = (resolvedIncome > 0 ? resolvedIncome : simNetIncome) || 0
  const headerProfile     = computeMortgageProfile({ ...formData, netIncome: incomeForHeader })
  const maxLoanForHeader  = headerProfile.eX

  // ESSO flags
  const essoProfile   = formData.entityType === 'sro' ? computeMortgageProfile(formData) : null
  const essoHardBlock = essoProfile?.redFlags.includes('sro_negative_financials') || essoProfile?.redFlags.includes('sro_insufficient_history')
  const essoMedRisk   = essoProfile && !essoHardBlock && essoProfile.flags.includes('sro_medium_risk_50pct_cap')

  return (
    <main className="animate-fade-up">

      {/* ── Sticky result header ─────────────────────── */}
      <div className="sticky top-16 z-40 bg-dark-900/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4 sm:gap-6">

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

        {/* ── Insight trigger ──────────────────────────── */}
        <div className="card-surface p-7 sm:p-9">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <ScoreGauge score={score} color={cfg.color} />
            <div className="text-center sm:text-left">
              <p className="section-label mb-2">Eligibility Assessment</p>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-ink mb-3 leading-tight">
                Your result is based on Czech bank logic.
              </h2>
              <p className="text-sm text-ink-muted mb-4 max-w-md leading-relaxed">
                This simulation runs your profile through the same parameters Czech banks apply
                in 2026. Your risk band and borrowing range are shown below. Save your assessment
                to unlock the full breakdown.
              </p>
              <span className={`badge ${cfg.badge} text-xs`}>{cfg.label}</span>
            </div>
          </div>
        </div>

        {/* ── Summary card (always visible) ───────────────── */}
        <SummaryCard profile={headerProfile} formData={formData} />

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

        {/* ── Soft lock gate OR full content ──────────────── */}
        {!isUnlocked ? (
          <SoftLockGate onUnlock={() => setIsUnlocked(true)} formData={formData} />
        ) : (
          <>
            {/* 4 accordions */}
            <div className="space-y-3 animate-fade-in">

              <AccordionSection
                title="Score breakdown"
                subtitle="10 eligibility factors evaluated against Czech bank criteria"
                icon={Shield}
                defaultOpen
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  {factors.map((f) => <ReadinessCard key={f.title} factor={f} />)}
                </div>
              </AccordionSection>

              <AccordionSection
                title="Loan capacity estimate"
                subtitle="Maximum borrowing range, stress test, and scenario analysis"
                icon={TrendingUp}
              >
                <div className="space-y-4 pt-4">
                  <RiskMatrix formData={formData} simNetIncome={simNetIncome} />
                  <ScenarioSimulator formData={formData} onIncomeChange={setSimNetIncome} />
                </div>
              </AccordionSection>

              <AccordionSection
                title="How this was calculated"
                subtitle="Czech bank underwriting methodology and model parameters"
                icon={BarChart2}
              >
                <div className="pt-2">
                  <HowItWorks />
                </div>
              </AccordionSection>

              <AccordionSection
                title="Next steps"
                subtitle="Czech mortgage process from pre-scoring to property handover"
                icon={Calendar}
              >
                <div className="pt-4">
                  <JourneyTimeline />
                </div>
              </AccordionSection>

            </div>

            {/* Primary CTA — Consultation */}
            <div className="rounded-2xl bg-dark-900 border border-white/10 px-6 sm:px-10 py-8 text-center">
              <p className="text-[11px] font-bold tracking-widest uppercase text-brand-400 mb-3">
                Professional Review
              </p>
              <h3 className="font-display text-xl sm:text-2xl font-black text-white mb-3 leading-tight">
                Review findings with a specialist
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-7 max-w-md mx-auto">
                Understand the simulation model outcomes and how they translate
                into a real Czech bank application for your specific profile.
              </p>
              <a
                href="https://calendly.com/andy-le/15min"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-cta mx-auto"
              >
                Schedule a review session
              </a>
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
