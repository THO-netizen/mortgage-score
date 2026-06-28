import { useState, useEffect } from 'react'
import {
  AlertTriangle, CheckCircle, TrendingUp, Home,
  Shield, DollarSign, FileText, BarChart2, Calendar,
  Users, Award, MapPin, RotateCcw, ArrowLeft, Info,
} from 'lucide-react'
import { formatCZK, formatCZKShort } from '../../utils/formatters.js'

// ── Constants ──────────────────────────────────────────

const CNB_DSTI_LIMIT  = 0.45
const LIVING_MINIMUM  = 4_860   // CZK/mo, single person
const GAUGE_R         = 60
const GAUGE_CIRC      = 2 * Math.PI * GAUGE_R  // ≈ 376.99

const TIMELINE_STEPS = [
  { label: 'Pre-scoring Check',       desc: 'Free eligibility assessment complete — you are here.',                                  done: true,  current: true  },
  { label: 'Property Search & Offer', desc: 'Locate your property and agree a purchase price with the seller.',                     done: false, current: false },
  { label: 'Reservation Contract',    desc: 'Rezervační smlouva — secure the property with a 3–5% deposit.',                        done: false, current: false },
  { label: 'Bank Pre-approval',       desc: 'Submit indicative application to selected lenders for competing offers.',              done: false, current: false },
  { label: 'Property Appraisal',      desc: 'Odhad nemovitosti — bank-commissioned valuer confirms market value.',                  done: false, current: false },
  { label: 'Full Mortgage Application', desc: 'Submit complete document package: income, bank statements, company financials.',     done: false, current: false },
  { label: 'Bank Underwriting',       desc: 'Credit committee review — typically 10–20 working days for self-employed applicants.', done: false, current: false },
  { label: 'Mortgage Contract',       desc: 'Úvěrová smlouva signed; disbursement conditions and drawdown date confirmed.',         done: false, current: false },
  { label: 'Cadastre Registration',   desc: 'Katastr nemovitostí — zástavní právo (lien) registered against the property.',        done: false, current: false },
  { label: 'Property Handover',       desc: 'Předání nemovitosti — keys exchanged, mortgage live, ownership transferred.',          done: false, current: false },
]

const STATUS_CFG = {
  strong: { label: 'Strong',       cls: 'badge-success' },
  good:   { label: 'Good',         cls: 'badge bg-brand-50 text-brand-700 border border-brand-100' },
  review: { label: 'Needs Review', cls: 'badge-warning' },
  risk:   { label: 'Risk',         cls: 'badge-risk'    },
}

// ── Scoring engine ─────────────────────────────────────

function computeScore(f) {
  const { entityType, residenceStatus, yearsInCZ,
    monthlyLoanPayments = 0, creditCardLimits = 0,
    monthlyLeasing = 0, otherObligations = 0,
    purchasePrice = 0, ownFunds = 0,
    propertyPurpose, purchaseTimeline,
    bankAnalysisStatus, bankAnalysisResults } = f

  let s = 0

  s += { eu: 20, permanent: 20, longterm5plus: 14, longterm: 9, employment: 4, other: 2 }[residenceStatus] ?? 6
  s += { '10plus': 10, '5-10': 8, '2-5': 6, '1-2': 4, 'less1': 2 }[yearsInCZ] ?? 5

  const ltv = purchasePrice > 0 ? ((purchasePrice - ownFunds) / purchasePrice) * 100 : 0
  if      (purchasePrice === 0) s += 10
  else if (ltv <= 60)           s += 20
  else if (ltv <= 70)           s += 16
  else if (ltv <= 80)           s += 10

  const cc5 = Math.round(creditCardLimits * 0.05)
  const tot = monthlyLoanPayments + cc5 + monthlyLeasing + otherObligations
  if      (tot === 0)      s += 15
  else if (tot < 10_000)  s += 12
  else if (tot < 20_000)  s += 8
  else if (tot < 35_000)  s += 4

  s += { primary: 8, investment: 5, holiday: 3 }[propertyPurpose] ?? 0
  s += { '3months': 7, '6months': 5, '12months': 3, 'exploring': 1 }[purchaseTimeline] ?? 0

  if      (bankAnalysisStatus === 'done' && !bankAnalysisResults?.hasRedFlags) s += 10
  else if (bankAnalysisStatus === 'skipped' || !bankAnalysisStatus)            s += 6

  s += { sro: 10, osvc: 7 }[entityType] ?? 0

  if (bankAnalysisResults?.hasRedFlags) s = Math.max(0, s - 15)
  return Math.min(100, s)
}

function scoreCfg(score) {
  if (score >= 75) return { label: 'Strong Applicant', color: '#10B981', badge: 'badge-success' }
  if (score >= 55) return { label: 'Good Standing',    color: '#3B82F6', badge: 'bg-brand-50 text-brand-700 border border-brand-100 badge' }
  if (score >= 35) return { label: 'Needs Review',     color: '#F59E0B', badge: 'badge-warning' }
  return               { label: 'High Risk',           color: '#EF4444', badge: 'badge-risk' }
}

// ── Readiness factors ──────────────────────────────────

function buildFactors(f, netIncome) {
  const { entityType, residenceStatus, yearsInCZ,
    monthlyLoanPayments = 0, creditCardLimits = 0,
    monthlyLeasing = 0, otherObligations = 0,
    purchasePrice = 0, ownFunds = 0,
    propertyPurpose, purchaseTimeline,
    bankAnalysisStatus, bankAnalysisResults,
    businessName = '', businessAgeMonths = null } = f

  const cc5   = Math.round(creditCardLimits * 0.05)
  const total = monthlyLoanPayments + cc5 + monthlyLeasing + otherObligations
  const loan  = Math.max(0, purchasePrice - ownFunds)
  const ltv   = purchasePrice > 0 ? (loan / purchasePrice) * 100 : 0
  const own   = purchasePrice > 0 ? (ownFunds / purchasePrice) * 100 : 0

  // Bonity
  const r20   = 0.045 / 12
  const r20s  = 0.065 / 12
  const af20  = (1 - Math.pow(1 + r20,  -240)) / r20
  const af20s = (1 - Math.pow(1 + r20s, -240)) / r20s
  const cap   = Math.max(0, netIncome * CNB_DSTI_LIMIT - total)
  const eX    = Math.round(cap * af20)
  const eXs   = Math.round(cap * af20s)
  const varX  = Math.abs(eX - eXs)

  const RL = {
    eu: 'EU / EEA Citizen', permanent: 'Permanent Residence',
    longterm5plus: 'Long-term 5+ yrs', longterm: 'Long-term Residence',
    employment: 'Employment Permit', other: 'Other / Student',
  }
  const YL = { 'less1': '<1 yr', '1-2': '1–2 yrs', '2-5': '2–5 yrs', '5-10': '5–10 yrs', '10plus': '10+ yrs' }
  const PL = { primary: 'Primary Residence', investment: 'Investment / Rental', holiday: 'Holiday Home' }
  const TL = { '3months': 'Within 3 months', '6months': 'Within 6 months', '12months': '6–12 months', 'exploring': 'Exploring' }

  return [
    {
      title: 'Residence & Visa',        icon: MapPin,
      detail: RL[residenceStatus] ?? '—',
      desc: !residenceStatus ? 'Not specified'
        : residenceStatus === 'eu' || residenceStatus === 'permanent'
          ? 'Full access — all 19 covered Czech banks eligible with no extra conditions.'
          : residenceStatus === 'longterm5plus' || residenceStatus === 'longterm'
          ? 'Limited access — ~60% of banks eligible; specialist pre-filtering required.'
          : 'Restricted — very few lenders consider this visa category; specialist required.',
      status: !residenceStatus ? 'review'
        : residenceStatus === 'eu' || residenceStatus === 'permanent' ? 'strong'
        : residenceStatus === 'longterm5plus' || residenceStatus === 'longterm' ? 'good'
        : 'risk',
    },
    {
      title: 'Czech Tenure',            icon: Calendar,
      detail: YL[yearsInCZ] ?? '—',
      desc: !yearsInCZ ? 'Not specified'
        : yearsInCZ === '10plus' || yearsInCZ === '5-10'
          ? 'Strong — multi-year residency builds lender confidence significantly.'
          : yearsInCZ === '2-5'
          ? 'Moderate — most specialist lenders accept applicants with 2+ years.'
          : 'Short — under 2 years in Czechia is a high barrier for most lenders.',
      status: !yearsInCZ ? 'review'
        : yearsInCZ === '10plus' || yearsInCZ === '5-10' ? 'strong'
        : yearsInCZ === '2-5' ? 'good'
        : yearsInCZ === '1-2' ? 'review' : 'risk',
    },
    {
      title: 'Business Structure',      icon: Users,
      detail: entityType === 'osvc' ? 'OSVČ' : entityType === 'sro' ? 's.r.o. Director' : '—',
      desc: (() => {
        const base = entityType === 'sro'
          ? 'Directors can evidence income via salary slips or dividends — preferred by most banks.'
          : entityType === 'osvc'
          ? 'Sole traders assessed on 2-year average net profit from tax returns (DPFO).'
          : 'Not specified.'
        if (businessAgeMonths === null) return base
        const y = Math.floor(businessAgeMonths / 12)
        const m = businessAgeMonths % 12
        const age = y > 0 ? `${y} yr ${m > 0 ? m + ' mo' : ''}`.trim() : `${m} months`
        const ageNote = businessAgeMonths >= 24
          ? `Business age ${age} — 24-month bank requirement met.`
          : `Business age ${age} — below the 24-month threshold required by most Czech banks.`
        return `${base} ${ageNote}${businessName ? ` Registered as: ${businessName}.` : ''}`
      })(),
      status: (() => {
        if (!entityType) return 'review'
        if (businessAgeMonths !== null) {
          if (businessAgeMonths < 12)  return 'risk'
          if (businessAgeMonths < 24)  return 'review'
        }
        return entityType === 'sro' ? 'strong' : 'good'
      })(),
    },
    {
      title: 'LTV Position',            icon: Home,
      detail: purchasePrice > 0 ? `${ltv.toFixed(1)}% LTV` : '—',
      desc: !purchasePrice ? 'Not specified'
        : ltv > 80 ? 'Exceeds CNB 80% cap — application blocked until own funds increase.'
        : ltv > 70 ? 'Acceptable — some banks add a risk premium above 75% LTV for self-employed.'
        : 'Strong — below 70% LTV unlocks competitive fixed rates across all lenders.',
      status: !purchasePrice ? 'review' : ltv > 80 ? 'risk' : ltv > 70 ? 'good' : 'strong',
    },
    {
      title: 'Cash Reserve Adequacy',   icon: DollarSign,
      detail: purchasePrice > 0 ? `${own.toFixed(0)}% own funds` : '—',
      desc: own >= 30 ? 'Excellent — above 30% signals financial strength to underwriters.'
        : own >= 20 ? 'Adequate — meets CNB 20% minimum. Allow extra buffer for fees & taxes.'
        : own > 0   ? 'Insufficient — CNB requires at least 20% own funds for any application.'
        : 'Not specified.',
      status: !purchasePrice ? 'review' : own >= 30 ? 'strong' : own >= 20 ? 'good' : 'risk',
    },
    {
      title: 'Monthly Obligation Load', icon: BarChart2,
      detail: `${formatCZK(total)} / mo`,
      desc: total === 0 ? 'No obligations — maximises available borrowing capacity.'
        : total < 15_000 ? 'Light load — substantial capacity remains for a mortgage payment.'
        : total < 30_000 ? 'Moderate — will noticeably reduce your maximum loan amount.'
        : 'Heavy — significantly constrains borrowing; consider paying down debts first.',
      status: total === 0 ? 'strong' : total < 15_000 ? 'good' : total < 30_000 ? 'review' : 'risk',
    },
    {
      title: 'Property Use Case',       icon: Home,
      detail: PL[propertyPurpose] ?? '—',
      desc: propertyPurpose === 'primary'   ? 'Most favourable — primary residence gets best underwriting treatment.'
        : propertyPurpose === 'investment' ? 'Investment — rental income can supplement your income assessment.'
        : propertyPurpose === 'holiday'    ? 'Holiday home — limited lenders; requires larger own-funds buffer.'
        : 'Not specified.',
      status: propertyPurpose === 'primary' ? 'strong' : propertyPurpose === 'investment' ? 'good'
        : propertyPurpose === 'holiday' ? 'review' : 'review',
    },
    {
      title: 'Transaction History',     icon: FileText,
      detail: bankAnalysisStatus === 'done'
        ? bankAnalysisResults?.hasRedFlags ? 'Risk signals found' : 'Clear'
        : bankAnalysisStatus === 'skipped' ? 'Skipped' : 'Not analysed',
      desc: bankAnalysisStatus === 'done' && !bankAnalysisResults?.hasRedFlags
        ? 'Passed all 7 risk checks — no gambling, enforcement or exchange activity detected.'
        : bankAnalysisStatus === 'done' && bankAnalysisResults?.hasRedFlags
        ? `Risk keywords: ${bankAnalysisResults.redFlagKeywords.join(', ')} — impacts bank eligibility.`
        : 'Statement not analysed — banks will request 3–6 months statements; risk unknown.',
      status: bankAnalysisStatus === 'done' && !bankAnalysisResults?.hasRedFlags ? 'strong'
        : bankAnalysisStatus === 'done' && bankAnalysisResults?.hasRedFlags ? 'risk' : 'review',
    },
    {
      title: 'Bonity / Loan Capacity',  icon: TrendingUp,
      detail: netIncome > 0 && cap > 0 ? `E[X] ≈ ${formatCZKShort(eX)}` : netIncome > 0 ? 'Capacity exhausted' : 'Set income →',
      desc: netIncome > 0
        ? `At ${formatCZK(netIncome)}/mo net and 45% DSTI ceiling. Stress variance ±${formatCZKShort(varX)} across banks.`
        : 'Enter your net monthly income in the Scenario Simulator below to calculate E[X].',
      status: netIncome > 0 && cap > 0 ? (eX > 2_000_000 ? 'strong' : 'good') : netIncome > 0 ? 'risk' : 'review',
      eX, varX, eXs, cap, netIncome,
    },
    {
      title: 'Purchase Readiness',      icon: Award,
      detail: TL[purchaseTimeline] ?? '—',
      desc: purchaseTimeline === '3months' ? 'Urgent — prioritise pre-approval now; some lenders need 3–4 weeks.'
        : purchaseTimeline === '6months'   ? 'Good window — enough time to compare offers and negotiate conditions.'
        : purchaseTimeline === '12months'  ? 'Comfortable — use this period to strengthen weak factors before applying.'
        : purchaseTimeline === 'exploring' ? 'Exploring — ideal time to resolve LTV and document gaps before committing.'
        : 'Not specified.',
      status: purchaseTimeline === '6months' ? 'strong'
        : purchaseTimeline === '3months' || purchaseTimeline === '12months' ? 'good'
        : purchaseTimeline === 'exploring' ? 'review' : 'review',
    },
  ]
}

// ── Annuity payment ────────────────────────────────────

function monthlyPayment(principal, annualRate, years) {
  if (principal <= 0 || years <= 0) return 0
  const r = annualRate / 100 / 12
  const n = years * 12
  if (r === 0) return principal / n
  return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
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
        fontFamily="Manrope, Inter, sans-serif"
      >{score}</text>
      <text x="80" y="96" textAnchor="middle"
        fill="#94A3B8" fontSize="11"
        fontFamily="Inter, sans-serif"
      >/ 100</text>
    </svg>
  )
}

function ReadinessCard({ factor }) {
  const { title, icon: Icon, detail, desc, status, eX, varX, eXs, cap, netIncome } = factor
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
      {eX !== undefined && netIncome > 0 && cap > 0 && (
        <div className="mt-3 pt-3 border-t border-border space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-ink-muted">E[X] at 4.5% / 20 yr</span>
            <span className="font-bold text-ink tabular-nums">{formatCZK(eX)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-muted">Stress at 6.5% (±Var)</span>
            <span className="font-semibold text-warning-text tabular-nums">{formatCZK(eXs)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-muted">Bank-to-bank variance</span>
            <span className="font-semibold text-ink-muted tabular-nums">±{formatCZKShort(varX)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function ScenarioSimulator({ formData }) {
  const cc5   = Math.round((formData.creditCardLimits ?? 0) * 0.05)
  const total = (formData.monthlyLoanPayments ?? 0) + cc5
    + (formData.monthlyLeasing ?? 0) + (formData.otherObligations ?? 0)

  const initDown = formData.purchasePrice > 0
    ? Math.round((formData.ownFunds / formData.purchasePrice) * 100)
    : 22

  const [s, setS] = useState({
    price:     formData.purchasePrice || 5_500_000,
    downPct:   Math.min(99, Math.max(5, initDown)),
    rate:      4.5,
    years:     20,
    netIncome: 80_000,
  })

  const upd = (k, v) => setS((p) => ({ ...p, [k]: v }))

  const loanAmt   = Math.round(s.price * (1 - s.downPct / 100))
  const payment   = monthlyPayment(loanAmt, s.rate, s.years)
  const simLTV    = s.price > 0 ? (loanAmt / s.price) * 100 : 0
  const simDSTI   = s.netIncome > 0 ? ((payment + total) / s.netIncome) * 100 : 0
  const dstiAlert = simDSTI > 45

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
          min={5} max={30} step={1}
          format={(v) => `${v} years`} onChange={(v) => upd('years', v)} />
      </div>

      {/* Net income input */}
      <div className="mb-7">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="section-label">Monthly Net Income</span>
          <span className="font-display text-base font-extrabold text-ink tabular-nums">{formatCZK(s.netIncome)}</span>
        </div>
        <input type="range" min={20_000} max={500_000} step={5_000} value={s.netIncome}
          onChange={(e) => upd('netIncome', Number(e.target.value))} className="slider-field" />
        <p className="text-[11px] text-ink-subtle mt-1">Used to calculate DSTI and Bonity E[X] — updates the Loan Capacity card above</p>
      </div>

      {/* Results row */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="section-label mb-1">Loan Amount</p>
            <p className="font-display text-xl font-extrabold text-ink tabular-nums leading-tight">
              {formatCZKShort(loanAmt)}
            </p>
          </div>
          <div className="text-center border-x border-border px-2">
            <p className="section-label mb-1">LTV</p>
            <p className={`font-display text-xl font-extrabold tabular-nums leading-tight ${
              simLTV > 80 ? 'text-risk-DEFAULT' : simLTV > 70 ? 'text-warning-DEFAULT' : 'text-success-DEFAULT'
            }`}>{simLTV.toFixed(0)}%</p>
          </div>
          <div className="text-right">
            <p className="section-label mb-1">DSTI</p>
            <p className={`font-display text-xl font-extrabold tabular-nums leading-tight ${
              simDSTI > 45 ? 'text-risk-DEFAULT' : simDSTI > 35 ? 'text-warning-DEFAULT' : 'text-success-DEFAULT'
            }`}>{s.netIncome > 0 ? `${simDSTI.toFixed(0)}%` : '—'}</p>
          </div>
        </div>

        {/* Monthly payment highlight */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm font-semibold text-ink">Estimated Monthly Payment</p>
          <p className="font-display text-2xl font-black text-ink tabular-nums">{formatCZK(Math.round(payment))}</p>
        </div>
      </div>

      {/* DSTI alert */}
      {dstiAlert && s.netIncome > 0 && (
        <div className="flex items-start gap-3 mt-4 rounded-xl bg-risk-light border border-risk-border p-4">
          <AlertTriangle size={14} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
          <p className="text-xs text-risk-text leading-relaxed">
            <strong>DSTI {simDSTI.toFixed(0)}% exceeds the CNB 45% ceiling.</strong>{' '}
            This combination of income, obligations, and payment is above the regulatory limit.
            Increase the down-payment, extend maturity, or raise income to bring DSTI below 45%.
          </p>
        </div>
      )}
    </div>
  )
}

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
            {/* Connector column */}
            <div className="flex flex-col items-center">
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold z-10',
                step.done
                  ? 'bg-success-DEFAULT text-white'
                  : step.current
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface border-2 border-border text-ink-subtle',
              ].join(' ')}>
                {step.done
                  ? <CheckCircle size={13} />
                  : <span>{i + 1}</span>}
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={`w-px flex-1 my-1 min-h-[1.25rem] ${step.done ? 'bg-success-DEFAULT/25' : 'bg-border'}`} />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 pt-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className={`text-sm font-semibold leading-tight ${step.current ? 'text-brand-700' : step.done ? 'text-success-text' : 'text-ink-muted'}`}>
                  {step.label}
                </p>
                {step.current && (
                  <span className="badge-success text-[10px] px-2 py-0.5">You are here</span>
                )}
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

  const cc5   = Math.round((formData.creditCardLimits ?? 0) * 0.05)
  const total = (formData.monthlyLoanPayments ?? 0) + cc5
    + (formData.monthlyLeasing ?? 0) + (formData.otherObligations ?? 0)

  // factors are rebuilt when sim income changes — ScenarioSimulator owns that state
  // We pass netIncome=80_000 as default for initial factor render; real value is in simulator
  const factors = buildFactors(formData, 80_000)

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
                Computed across 10 eligibility dimensions, CNB regulatory limits, and
                live underwriting criteria from 19 Czech mortgage lenders.
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
              <p className="font-bold text-risk-text mb-1">
                Risk Warning: High-risk transactions detected
              </p>
              <p className="text-sm text-risk-text leading-relaxed">
                Gambling or betting platform activity was identified in your bank statement
                ({redKws.join(', ')}). Czech banks routinely decline applications with
                active gambling history. This has been factored into your score.
                A specialist broker can advise on lenders that may still consider your case.
              </p>
            </div>
          </div>
        )}

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
        <ScenarioSimulator formData={formData} />

        {/* ── Journey Timeline ─────────────────────── */}
        <JourneyTimeline />

        {/* ── Action buttons ───────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button onClick={onBack} className="btn-ghost w-full sm:w-auto">
            <ArrowLeft size={15} />
            Back
          </button>
          <button onClick={onRestart} className="btn-ghost w-full sm:w-auto">
            <RotateCcw size={15} />
            Start Over
          </button>
        </div>

        {/* ── Regulatory footer ────────────────────── */}
        <div className="flex items-start gap-2 pt-2 pb-4">
          <Info size={12} className="text-ink-subtle flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-ink-subtle leading-relaxed">
            This assessment is indicative only. Every bank has different underwriting
            criteria and risk appetite. Final mortgage approval always depends on
            individual bank assessment, document verification, and credit committee
            decisions. This tool does not constitute financial advice.
          </p>
        </div>

      </div>
    </main>
  )
}
