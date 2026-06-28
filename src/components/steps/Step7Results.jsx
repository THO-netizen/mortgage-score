import { useState, useEffect } from 'react'
import {
  AlertTriangle, CheckCircle, TrendingUp, Home,
  Shield, DollarSign, FileText, BarChart2, Calendar,
  Users, Award, MapPin, RotateCcw, ArrowLeft, Info,
  Briefcase, Activity,
} from 'lucide-react'
import { formatCZK, formatCZKShort } from '../../utils/formatters.js'
import {
  computeScore, computeMortgageProfile,
  monthlyPayment, annuityFactor,
  getMaxLTV, getMaxDTI, calcMaxMaturity,
} from '../../utils/scoringEngine.js'

// ── Constants ──────────────────────────────────────────

const GAUGE_R    = 60
const GAUGE_CIRC = 2 * Math.PI * GAUGE_R

const TIMELINE_STEPS = [
  { label: 'Pre-scoring Check',        desc: 'Free eligibility assessment complete — you are here.',                                  done: true,  current: true  },
  { label: 'Property Search & Offer',  desc: 'Locate your property and agree a purchase price with the seller.',                     done: false, current: false },
  { label: 'Reservation Contract',     desc: 'Rezervační smlouva — secure the property with a 3–5% deposit.',                        done: false, current: false },
  { label: 'Bank Pre-approval',        desc: 'Submit indicative application to selected lenders for competing offers.',              done: false, current: false },
  { label: 'Property Appraisal',       desc: 'Odhad nemovitosti — bank-commissioned valuer confirms market value.',                  done: false, current: false },
  { label: 'Full Mortgage Application',desc: 'Submit complete document package: income, bank statements, company financials.',       done: false, current: false },
  { label: 'Bank Underwriting',        desc: 'Credit committee review — typically 10–20 working days for self-employed applicants.', done: false, current: false },
  { label: 'Mortgage Contract',        desc: 'Úvěrová smlouva signed; disbursement conditions and drawdown date confirmed.',         done: false, current: false },
  { label: 'Cadastre Registration',    desc: 'Katastr nemovitostí — zástavní právo (lien) registered against the property.',        done: false, current: false },
  { label: 'Property Handover',        desc: 'Předání nemovitosti — keys exchanged, mortgage live, ownership transferred.',          done: false, current: false },
]

const STATUS_CFG = {
  strong: { label: 'Strong',       cls: 'badge-success' },
  good:   { label: 'Good',         cls: 'badge bg-brand-50 text-brand-700 border border-brand-100' },
  review: { label: 'Needs Review', cls: 'badge-warning' },
  risk:   { label: 'Risk',         cls: 'badge-risk'    },
}

const RISK_MATRIX_CFG = {
  zelena:   { label: 'ZELENÁ',   labelEn: 'Green Light',   color: '#10B981', bg: 'bg-success-light',  border: 'border-success-border',  text: 'text-success-text'  },
  oranzova: { label: 'ORANŽOVÁ', labelEn: 'Amber Review',  color: '#F59E0B', bg: 'bg-warning-light',  border: 'border-warning-border',  text: 'text-warning-text'  },
  cervena:  { label: 'ČERVENÁ',  labelEn: 'Red Flag',      color: '#EF4444', bg: 'bg-risk-light',     border: 'border-risk-border',     text: 'text-risk-text'     },
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
    bankAnalysisStatus = '', bankAnalysisResults = null,
    businessName = '', businessAgeMonths = null,
    contractType = '', probationPeriod = '', isProbation = false, employmentSector = '',
    applicantAge = 35,
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
    employment: 'Employment Permit', other: 'Other / Student',
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
      if (contractType === 'definite') parts.push('Fixed-term: 20% income haircut applied per ČS/ČSOB/KB methodology.')
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
      if (contractType === 'definite' || contractType === 'agency' || contractType === 'dpc') return 'review'
      if (contractType === 'indefinite') return 'strong'
      return 'review'
    })(),
  } : {
    title:  'Business Structure',
    icon:   Users,
    detail: entityType === 'osvc' ? 'OSVČ' : entityType === 'sro' ? 's.r.o. Director' : '—',
    desc: (() => {
      const base = entityType === 'sro'
        ? 'Directors evidence income via salary slips or dividends — preferred by most banks.'
        : entityType === 'osvc'
        ? 'Sole traders assessed on 2-year average net profit from DPFO tax returns.'
        : 'Not specified.'
      if (businessAgeMonths === null) return base
      const y = Math.floor(businessAgeMonths / 12)
      const m = businessAgeMonths % 12
      const age = y > 0 ? `${y} yr ${m > 0 ? m + ' mo' : ''}`.trim() : `${m} months`
      let ageNote = businessAgeMonths >= 24
        ? `Business age ${age} — 24-month requirement met by all banks.`
        : businessAgeMonths >= 12
        ? `Business age ${age} — below 24 months; 15% income haircut applied; ČS/mBank require 24 months.`
        : `Business age ${age} — below 12 months; transition path required (same NACE + single B2B client).`
      return `${base} ${ageNote}${businessName ? ` Registered: ${businessName}.` : ''}`
    })(),
    status: (() => {
      if (!entityType) return 'review'
      if (businessAgeMonths !== null) {
        if (businessAgeMonths < 12) return 'risk'
        if (businessAgeMonths < 24) return 'review'
      }
      return entityType === 'sro' ? 'strong' : 'good'
    })(),
  }

  // Bonity card — uses engine E[X] / Var[X]
  const bonityFactor = {
    title:  'Bonity / Loan Capacity',
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
          : residenceStatus === 'longterm5plus' || residenceStatus === 'longterm'
          ? 'Limited access — ~60% of banks eligible; specialist pre-filtering required.'
          : 'Restricted — very few lenders consider this visa category.',
      status: !residenceStatus ? 'review'
        : (residenceStatus === 'eu' || residenceStatus === 'permanent') ? 'strong'
        : (residenceStatus === 'longterm5plus' || residenceStatus === 'longterm') ? 'good'
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
      title: 'Transaction History', icon: FileText,
      detail: bankAnalysisStatus === 'done'
        ? (bankAnalysisResults?.hasRedFlags ? 'Risk signals found' : 'Clear')
        : bankAnalysisStatus === 'skipped' ? 'Skipped / Calendly' : 'Not analysed',
      desc: bankAnalysisStatus === 'done' && !bankAnalysisResults?.hasRedFlags
        ? 'Passed all 7 risk checks — no gambling, enforcement or exchange activity detected.'
        : bankAnalysisStatus === 'done' && bankAnalysisResults?.hasRedFlags
        ? `Risk keywords: ${bankAnalysisResults.redFlagKeywords.join(', ')} — impacts bank eligibility.`
        : 'Statement not analysed — banks will request 3–6 months statements; risk unknown.',
      status: bankAnalysisStatus === 'done' && !bankAnalysisResults?.hasRedFlags ? 'strong'
        : bankAnalysisStatus === 'done' && bankAnalysisResults?.hasRedFlags ? 'risk' : 'review',
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
              <p className="text-[10px] font-bold tracking-widest uppercase text-ink-subtle mb-0.5">Risk Matrix</p>
              <p className={`font-display text-xl font-black ${cfg.text}`}>
                {cfg.label} <span className="text-sm font-semibold opacity-70">— {cfg.labelEn}</span>
              </p>
            </div>
          </div>
          {incomeForCalc > 0 && (
            <div className="text-right">
              <p className="text-[10px] text-ink-subtle mb-0.5">E[X] Expected Loan</p>
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
          {incomeForCalc > 0 && eX > 0 && (
            <div className="flex items-center gap-4 text-xs flex-shrink-0">
              <span className="text-ink-muted">
                Stress <span className="font-bold tabular-nums text-warning-text">{formatCZKShort(eXStress)}</span>
              </span>
              <span className="text-ink-muted">
                Var[X] <span className="font-bold tabular-nums">±{formatCZKShort(varX)}</span>
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
            <span className="text-ink-muted">E[X] @ 4.5% / {maturity?.maxYears ?? 20} yr</span>
            <span className="font-bold text-ink tabular-nums">{formatCZK(eX)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-muted">Stress E[X] @ 6.5%</span>
            <span className="font-semibold text-warning-text tabular-nums">{formatCZK(eXStress)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-muted">Var[X] bank spread</span>
            <span className="font-semibold text-ink-muted tabular-nums">±{formatCZKShort(varX)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-muted">DSTI at E[X]</span>
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
        <p className="text-[11px] text-ink-subtle mt-1">Updates E[X] and the Bonity factor card above in real time.</p>
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

// ── Main Results Dashboard ────────────────────────────

export default function Step7Results({ formData, onBack, onRestart }) {
  const score  = computeScore(formData)
  const cfg    = scoreCfg(score)
  const hasRed = formData.bankAnalysisResults?.hasRedFlags ?? false
  const redKws = formData.bankAnalysisResults?.redFlagKeywords ?? []

  // simNetIncome is owned here so the Risk Matrix and Bonity card stay in sync
  const [simNetIncome, setSimNetIncome] = useState(
    formData.netIncome > 0 ? formData.netIncome : 80_000
  )

  const factors = buildFactors(formData, simNetIncome)

  return (
    <main className="py-8 sm:py-12 animate-fade-up">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">

        {/* ── Score header ─────────────────────────── */}
        <div className="card-surface p-7 sm:p-9">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <ScoreGauge score={score} color={cfg.color} />
            <div className="text-center sm:text-left">
              <p className="section-label mb-2">Czech Mortgage Readiness Score</p>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-ink mb-2 leading-tight">
                {cfg.label}
              </h2>
              <p className="text-sm text-ink-muted mb-4 max-w-md leading-relaxed">
                Computed across 10 eligibility dimensions, ČNB regulatory limits, and 2026
                underwriting criteria from ČS, ČSOB, KB, mBank, and UniCredit Bank.
              </p>
              <span className={`badge ${cfg.badge} text-xs`}>{cfg.label}</span>
            </div>
          </div>
        </div>

        {/* ── Red-flag warning ─────────────────────── */}
        {hasRed && (
          <div className="flex items-start gap-4 rounded-card bg-risk-light border border-risk-border p-6">
            <AlertTriangle size={20} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-risk-text mb-1">Risk Warning: High-risk transactions detected</p>
              <p className="text-sm text-risk-text leading-relaxed">
                Gambling or betting platform activity was identified ({redKws.join(', ')}).
                Czech banks routinely decline applications with active gambling history.
                A specialist broker can advise on lenders that may still consider your case.
              </p>
            </div>
          </div>
        )}

        {/* ── Risk Matrix ───────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} className="text-brand-600" />
            <h3 className="font-display text-xl font-extrabold text-ink">Bank Risk Matrix</h3>
          </div>
          <RiskMatrix formData={formData} simNetIncome={simNetIncome} />
        </section>

        {/* ── 10-Factor Readiness Cards ─────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={15} className="text-brand-600" />
            <h3 className="font-display text-xl font-extrabold text-ink">10-Factor Readiness Assessment</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {factors.map((f) => (
              <ReadinessCard key={f.title} factor={f} />
            ))}
          </div>
        </section>

        {/* ── Scenario Simulator ───────────────────── */}
        <ScenarioSimulator
          formData={formData}
          onIncomeChange={setSimNetIncome}
        />

        {/* ── Journey Timeline ─────────────────────── */}
        <JourneyTimeline />

        {/* ── Action buttons ───────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button onClick={onBack} className="btn-ghost w-full sm:w-auto">
            <ArrowLeft size={15} /> Back
          </button>
          <button onClick={onRestart} className="btn-ghost w-full sm:w-auto">
            <RotateCcw size={15} /> Start Over
          </button>
        </div>

        {/* ── Regulatory footer ────────────────────── */}
        <div className="flex items-start gap-2 pt-2 pb-4">
          <Info size={12} className="text-ink-subtle flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-ink-subtle leading-relaxed">
            This assessment is indicative only and reflects 2026 Czech bank underwriting
            guidelines (ČS, ČSOB, KB, mBank, UniCredit). Final mortgage approval always
            depends on individual bank assessment, document verification, and credit committee
            decisions. Variance (Var[X]) reflects cross-bank methodology divergence, not
            investment risk. This tool does not constitute financial advice.
          </p>
        </div>

      </div>
    </main>
  )
}
