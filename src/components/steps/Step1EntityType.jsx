import { useEffect, useRef, useState } from 'react'
import {
  Briefcase, Building2, UserCheck,
  Check, Loader2, CheckCircle, XCircle, ChevronDown, AlertTriangle,
} from 'lucide-react'
import FunnelCard from '../funnel/FunnelCard.jsx'
import ActionBar  from '../funnel/ActionBar.jsx'

// ── ARES legal-form → entity-type mapping ──────────────
const OSVC_FORMS = new Set(['101', '102', '103', '104', '105', '106', '107', '108', '109'])
const SRO_FORMS  = new Set(['112'])

function mapLegalForm(pravniForma) {
  if (OSVC_FORMS.has(pravniForma)) return 'osvc'
  if (SRO_FORMS.has(pravniForma))  return 'sro'
  return ''
}

// ARES pravniForma code → English display label
const LEGAL_FORM_LABELS = {
  '101': 'Sole Trader (živnostník)',
  '102': 'Sole Trader (živnostník)',
  '103': 'Sole Trader — Agriculture',
  '104': 'Sole Trader — Liberal Profession',
  '105': 'Sole Trader (OSVČ)',
  '106': 'Sole Trader (OSVČ)',
  '107': 'Sole Trader (OSVČ)',
  '108': 'Sole Trader (OSVČ)',
  '109': 'Sole Trader (OSVČ)',
  '112': 'Limited Liability Company (s.r.o.)',
  '121': 'Joint-Stock Company (a.s.)',
  '141': 'Cooperative (Družstvo)',
  '205': 'State Enterprise',
  '301': 'Branch of Foreign Entity',
  '325': 'European Company (SE)',
}

function getLegalFormLabel(code) {
  return LEGAL_FORM_LABELS[String(code)] ?? `Registered Entity (form ${code})`
}

function calcAgeMonths(datumVzniku) {
  if (!datumVzniku) return null
  const founded = new Date(datumVzniku)
  const now     = new Date()
  return (now.getFullYear() - founded.getFullYear()) * 12
    + (now.getMonth() - founded.getMonth())
}

function formatAge(months) {
  if (months === null) return ''
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0) return `${m} month${m !== 1 ? 's' : ''}`
  if (m === 0) return `${y} year${y !== 1 ? 's' : ''}`
  return `${y} yr ${m} mo`
}

// ── IČO lookup widget ──────────────────────────────────

function IcoLookup({ onResult }) {
  const [ico,            setIco]            = useState('')
  const [status,         setStatus]         = useState('idle')  // idle|loading|found|error
  const [businessName,   setBusinessName]   = useState('')
  const [ageMonths,      setAgeMonths]      = useState(null)
  const [qualified,      setQualified]      = useState(false)
  const [legalFormLabel, setLegalFormLabel] = useState('')
  const [resolvedType,   setResolvedType]   = useState('')
  const abortRef = useRef(null)

  useEffect(() => {
    if (ico.length !== 8) {
      setStatus('idle')
      setBusinessName('')
      setAgeMonths(null)
      setLegalFormLabel('')
      setResolvedType('')
      return
    }

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setStatus('loading')
    setBusinessName('')
    setAgeMonths(null)
    setLegalFormLabel('')
    setResolvedType('')

    fetch(
      `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`,
      { signal: ctrl.signal },
    )
      .then((r) => {
        if (!r.ok) throw new Error('not_found')
        return r.json()
      })
      .then((data) => {
        const name       = data.obchodniJmeno ?? data.nazev ?? ''
        const formCode   = String(data.pravniForma ?? '')
        const dateStr    = data.datumVzniku ?? ''
        const months     = calcAgeMonths(dateStr)
        const entityType = mapLegalForm(formCode)
        const formLabel  = getLegalFormLabel(formCode)

        setBusinessName(name)
        setAgeMonths(months)
        setQualified(months !== null && months >= 24)
        setLegalFormLabel(formLabel)
        setResolvedType(entityType)
        setStatus('found')

        onResult({ ico, businessName: name, businessAgeMonths: months, datumVzniku: dateStr, entityType, legalFormLabel: formLabel })
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setStatus('error')
        onResult({ ico, businessName: '', businessAgeMonths: null, datumVzniku: '', entityType: '', legalFormLabel: '' })
      })

    return () => ctrl.abort()
  }, [ico])  // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 8)
    setIco(val)
  }

  const entityBadgeClass = resolvedType === 'osvc' ? 'badge-warning' : 'badge-neutral'
  const entityBadgeLabel = resolvedType === 'osvc' ? 'OSVČ' : resolvedType === 'sro' ? 's.r.o.' : 'Other'

  return (
    <div className="mb-7 pb-7 border-b border-border space-y-4">

      {/* ── Registration Number input ──────────────────── */}
      <div>
        <label htmlFor="ico" className="section-label mb-2 block">
          Registration Number (IČO)
        </label>
        <div className="relative">
          <input
            id="ico"
            type="text"
            inputMode="numeric"
            value={ico}
            onChange={handleChange}
            placeholder="e.g. 12345678"
            maxLength={8}
            className="input-field pr-11 tabular-nums tracking-widest"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {status === 'loading' && <Loader2     size={16} className="text-ink-subtle animate-spin" />}
            {status === 'found'   && <CheckCircle size={16} className="text-success-DEFAULT" />}
            {status === 'error'   && <XCircle     size={16} className="text-risk-DEFAULT" />}
          </span>
        </div>
        {status === 'loading' && (
          <p className="text-xs text-ink-muted mt-2">Looking up in ARES registry…</p>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-1.5 mt-2">
            <XCircle size={12} className="text-risk-DEFAULT flex-shrink-0" />
            <p className="text-xs text-risk-text">IČO not found — please enter your details manually</p>
          </div>
        )}
      </div>

      {/* ── Auto-populated fields — visible after successful lookup ── */}
      {status === 'found' && (
        <div className="space-y-3 animate-fade-up">

          {/* Company / Business Name — read-only */}
          <div>
            <label className="section-label mb-1.5 block">Company / Business Name</label>
            <div className="relative">
              <input
                type="text"
                value={businessName}
                readOnly
                className="input-field pr-10 bg-surface cursor-default select-all font-medium"
              />
              <CheckCircle
                size={15}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-success-DEFAULT pointer-events-none"
              />
            </div>
          </div>

          {/* Legal Structure */}
          <div>
            <label className="section-label mb-1.5 block">Legal Structure</label>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
              <span className="flex-1 text-sm font-medium text-ink leading-snug">{legalFormLabel}</span>
              {resolvedType && (
                <span className={entityBadgeClass}>{entityBadgeLabel}</span>
              )}
            </div>
          </div>

          {/* Business age */}
          {ageMonths !== null && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
              <span className="text-xs text-ink-muted">Registered</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink">{formatAge(ageMonths)} ago</span>
                {qualified
                  ? <span className="badge-success text-[10px]">24-month requirement met</span>
                  : <span className="badge-warning text-[10px]">Under 24 months — limited options</span>
                }
              </div>
            </div>
          )}

          {/* ARES verification stamp */}
          <div className="flex items-center gap-2.5 rounded-xl bg-success-light border border-success-border px-4 py-2.5">
            <CheckCircle size={13} className="text-success-DEFAULT flex-shrink-0" />
            <p className="text-[11px] font-semibold text-success-text tracking-wide">
              Verified via Czech Ministry of Finance (ARES)
            </p>
          </div>

        </div>
      )}

    </div>
  )
}

// ── Entity selection cards ─────────────────────────────

const ENTITY_OPTIONS = [
  {
    value:    'osvc',
    Icon:     Briefcase,
    title:    'Self-employed (OSVČ)',
    subtitle: 'Freelancer · Sole trader · Trade licence holder',
    desc:     'You operate under a Czech trade licence as an individual. Income declared via personal tax return (Tax Return / DAP).',
    docs: [
      'Trade licence — Živnostenský list',
      'Personal tax returns (DAP / DPFO) — last 2 years',
      'Social & health insurance clearances (ČSSZ)',
    ],
    note: 'Simpler document path — one set of financials',
  },
  {
    value:    'sro',
    Icon:     Building2,
    title:    'Company Director (s.r.o.)',
    subtitle: 'Limited company owner · Director · Shareholder',
    desc:     'You receive income as a director, employee, or dividend recipient of a Czech Limited Company (s.r.o. / spol. s r.o.).',
    docs: [
      'Corporate financials (DPPO) — last 2 years',
      'Director salary slips or dividend history',
      'UBO beneficial ownership declaration',
    ],
    note: 'Both company and personal documents required',
  },
  {
    value:    'zamestnanec',
    Icon:     UserCheck,
    title:    'Employed',
    subtitle: 'Salary employee · Contract worker · Expat hire',
    desc:     'You receive a regular salary from a Czech or foreign employer. Income verified via payslips and employer confirmation.',
    docs: [
      'Last 3 payslips (výplatní pásky)',
      'Employer income confirmation letter',
      'Employment contract — type and duration',
    ],
    note: 'Fastest path — automated scoring by most banks',
  },
]

function EntityCard({ option, selected, onSelect }) {
  const { Icon, title, subtitle, desc, docs, note } = option
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'relative w-full text-left rounded-2xl border-2 p-6',
        'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
        selected
          ? 'border-brand-600 bg-brand-50 shadow-card-md'
          : 'border-border bg-card hover:border-border-strong hover:shadow-card-md',
      ].join(' ')}
    >
      {selected && (
        <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center">
          <Check size={13} className="text-white" strokeWidth={3} />
        </span>
      )}
      <div className={[
        'w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-200',
        selected ? 'bg-brand-600' : 'bg-surface',
      ].join(' ')}>
        <Icon size={22} className={selected ? 'text-white' : 'text-ink-muted'} />
      </div>
      <h3 className="font-display text-xl font-extrabold text-ink leading-tight mb-0.5">{title}</h3>
      <p className="text-xs text-ink-muted mb-3">{subtitle}</p>
      <p className="text-sm text-ink-muted leading-relaxed mb-5">{desc}</p>
      <ul className="space-y-2 mb-5">
        {docs.map((d) => (
          <li key={d} className="flex items-start gap-2.5 text-xs text-ink-muted">
            <span className={['mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0', selected ? 'bg-brand-600' : 'bg-ink-subtle'].join(' ')} />
            {d}
          </li>
        ))}
      </ul>
      <div className={['pt-4 border-t text-xs font-medium', selected ? 'border-brand-200 text-brand-600' : 'border-border text-ink-subtle'].join(' ')}>
        {note}
      </div>
    </button>
  )
}

// ── Business income sub-section (OSVČ / s.r.o.) ───────

const TAX_REGIME_OPTIONS = [
  {
    value:    'tax_return',
    label:    'Standard Tax Return',
    sublabel: 'Tax Return (DAP) — §7 / §16',
    desc:     'Income declared via annual personal or corporate tax return (DAP)',
  },
  {
    value:    'flat_tax',
    label:    'Flat Tax Regime',
    sublabel: 'Flat Tax (Paušální daň)',
    desc:     'Fixed quarterly flat-tax payments; no annual return required',
  },
]

function BusinessIncomeSection({ data, onChange }) {
  const {
    taxRegime                = '',
    annualTurnover           = null,
    avgMonthlyCreditTurnover = null,
  } = data

  const [turnoverTouched, setTurnoverTouched]   = useState(false)
  const [creditTouched,   setCreditTouched]     = useState(false)

  const handleRegimeChange = (newRegime) => {
    onChange('taxRegime', newRegime)
    if (newRegime === 'tax_return') { onChange('avgMonthlyCreditTurnover', null); setCreditTouched(false) }
    if (newRegime === 'flat_tax')   { onChange('annualTurnover', null);           setTurnoverTouched(false) }
  }

  const turnoverError = turnoverTouched && taxRegime === 'tax_return' && !(Number(annualTurnover) >= 1)
  const creditError   = creditTouched   && taxRegime === 'flat_tax'   && !(Number(avgMonthlyCreditTurnover) >= 1)

  return (
    <div className="mt-7 pt-7 border-t border-border space-y-5 animate-fade-up">

      {/* Tax regime selector */}
      <div>
        <label className="section-label mb-2 block">
          What is your current tax filing regime?
          <span className="text-risk-DEFAULT ml-1">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TAX_REGIME_OPTIONS.map(({ value, label, sublabel, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleRegimeChange(value)}
              className={[
                'relative text-left rounded-xl border-2 px-4 py-3.5 transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
                taxRegime === value
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-border bg-card hover:border-border-strong',
              ].join(' ')}
            >
              {taxRegime === value && (
                <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-brand-600 flex items-center justify-center">
                  <Check size={9} className="text-white" strokeWidth={3} />
                </span>
              )}
              <p className={`text-xs font-bold mb-0.5 ${taxRegime === value ? 'text-brand-700' : 'text-ink'}`}>
                {label}
              </p>
              <p className={`text-[10px] font-semibold mb-1 ${taxRegime === value ? 'text-brand-600' : 'text-ink-muted'}`}>
                {sublabel}
              </p>
              <p className="text-[10px] text-ink-subtle leading-relaxed">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Branch A — Standard tax return → Gross Annual Turnover */}
      {taxRegime === 'tax_return' && (
        <div className="animate-fade-up">
          <label htmlFor="annualTurnover" className="section-label mb-1.5 block">
            Gross Annual Turnover (Obrat)
            <span className="text-risk-DEFAULT ml-1">*</span>
          </label>
          <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide mb-2">
            Enter your gross annual business turnover as declared in your Tax Return (DAP)
          </p>
          <div className="relative">
            <input
              id="annualTurnover"
              type="number"
              inputMode="numeric"
              min={1}
              max={999_000_000}
              step={1}
              value={annualTurnover ?? ''}
              onChange={(e) => onChange('annualTurnover', e.target.value === '' ? null : Math.round(Number(e.target.value)))}
              onBlur={() => setTurnoverTouched(true)}
              placeholder="e.g. 2 400 000"
              className={`input-field pr-24 tabular-nums${turnoverError ? ' input-error' : ''}`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium whitespace-nowrap">
              CZK / year
            </span>
          </div>
          {turnoverError ? (
            <p className="text-xs text-risk-text mt-1.5">
              Required — enter your gross annual business turnover to calculate borrowing capacity.
            </p>
          ) : (
            <p className="text-[11px] text-ink-subtle mt-1.5 leading-relaxed">
              Enter your total declared revenues from your last Tax Return (DAP), Appendix 1,
              line 101–102. For Company Directors (s.r.o.), use the company's total annual
              revenues from the Profit &amp; Loss statement (Výsledovka).
            </p>
          )}
        </div>
      )}

      {/* Branch B — Flat tax → Average Monthly Credit Turnover */}
      {taxRegime === 'flat_tax' && (
        <div className="animate-fade-up">
          <label htmlFor="avgMonthlyCreditTurnover" className="section-label mb-1.5 block">
            Average Monthly Credit Turnover (Kreditní obrat)
            <span className="text-risk-DEFAULT ml-1">*</span>
          </label>
          <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide mb-2">
            Average monthly incoming business payments credited to your business account
          </p>
          <div className="relative">
            <input
              id="avgMonthlyCreditTurnover"
              type="number"
              inputMode="numeric"
              min={1}
              max={12_500_000}
              step={1}
              value={avgMonthlyCreditTurnover ?? ''}
              onChange={(e) => onChange('avgMonthlyCreditTurnover', e.target.value === '' ? null : Math.round(Number(e.target.value)))}
              onBlur={() => setCreditTouched(true)}
              placeholder="e.g. 120 000"
              className={`input-field pr-28 tabular-nums${creditError ? ' input-error' : ''}`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium whitespace-nowrap">
              CZK / month
            </span>
          </div>
          {creditError ? (
            <p className="text-xs text-risk-text mt-1.5">
              Required — enter your average monthly credit turnover to calculate borrowing capacity.
            </p>
          ) : (
            <p className="text-[11px] text-ink-subtle mt-1.5 leading-relaxed">
              Average the last 3–6 months of inbound business payments to your business account
              (Kreditní obrat). Exclude internal transfers, personal deposits, loan drawdowns,
              and any one-off non-recurring receipts.
            </p>
          )}
        </div>
      )}

    </div>
  )
}

// ── Employee detail fields ─────────────────────────────

const CONTRACT_TYPES = [
  { value: 'indefinite', label: 'Indefinite period (HPP)',    info: 'Preferred by all banks — no haircut' },
  { value: 'definite',   label: 'Fixed-term contract',         info: '20% income haircut applied'         },
  { value: 'agency',     label: 'Agency / temp worker',        info: 'Higher variance; limited lenders'   },
  { value: 'dpc',        label: 'DPČ / DPP agreement',        info: 'Treated as supplemental income'     },
]

const SECTORS = [
  { value: 'health',    label: 'Healthcare',     desc: 'Doctors, nurses, medical staff'  },
  { value: 'education', label: 'Education',       desc: 'Teachers, academics, university' },
  { value: 'other',     label: 'Other sector',    desc: 'Private sector or other field'   },
]

function Toggle({ on, onToggle, danger = false }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        'relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200',
        on ? (danger ? 'bg-risk-DEFAULT' : 'bg-brand-600') : 'bg-border',
      ].join(' ')}
    >
      <span className={[
        'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
        on ? 'translate-x-4' : 'translate-x-0',
      ].join(' ')} />
    </button>
  )
}

function EmployeeDetails({ data, onChange }) {
  const {
    isProbation           = false,
    isNoticePeriod        = false,
    isOnSickLeave         = false,
    isEmployerDistressed  = false,
    contractType          = '',
    employmentStartDate   = '',
    netMonthlySalary      = null,
    verificationMethod    = '',
    hasMonthlyDiety       = false,
    monthlyDiety          = null,
    hasFxIncome           = false,
    foreignSalaryAmount   = null,
    foreignSalaryCurrency = 'EUR',
    hasOwnership          = false,
    employerOwnershipPct  = null,
    employmentSector      = '',
  } = data

  const lookbackMonths = (() => {
    if (!employmentStartDate) return null
    const [y, m] = employmentStartDate.split('-').map(Number)
    const now = new Date()
    const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m)
    return Math.max(0, Math.min(24, months))
  })()

  const anyHardBlock   = isProbation || isNoticePeriod || isOnSickLeave || isEmployerDistressed
  const csobException  = isProbation && (employmentSector === 'health' || employmentSector === 'education')
  const ownershipPct   = Number(employerOwnershipPct || 0)
  const maxMonthStr    = new Date().toISOString().slice(0, 7)

  return (
    <div className="mt-7 pt-7 border-t border-border space-y-5 animate-fade-up">

      {/* Methodology box */}
      <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">
        <p className="text-[11px] font-semibold text-brand-700 uppercase tracking-wide mb-2">
          How banks evaluate employees
        </p>
        <p className="text-xs text-brand-700 leading-relaxed">
          Underwriting guidelines from ČS, ČSOB, mBank, and UCB are applied to your net
          monthly take-home pay (after taxes and social deductions), contract type, tenure,
          and supplemental income components to compute your borrowing capacity across all
          four banks simultaneously.
        </p>
      </div>

      {/* ── Eligibility gate ─────────────────────────────── */}
      <div>
        <label className="section-label mb-2 block">Initial Eligibility Check</label>
        <div className="space-y-2">
          {[
            { field: 'isProbation',          label: 'Currently in probation period'             },
            { field: 'isNoticePeriod',       label: 'Serving a notice period (výpovědní lhůta)' },
            { field: 'isOnSickLeave',        label: 'Currently on extended sick leave'           },
            { field: 'isEmployerDistressed', label: 'Employer in insolvency or restructuring'    },
          ].map(({ field, label }) => {
            const active = !!data[field]
            return (
              <div key={field} className={[
                'flex items-center justify-between rounded-xl border px-4 py-3',
                active ? 'bg-risk-light border-risk-border' : 'border-border bg-card',
              ].join(' ')}>
                <p className={`text-xs font-medium ${active ? 'text-risk-text' : 'text-ink'}`}>{label}</p>
                <Toggle on={active} onToggle={() => onChange(field, !active)} danger />
              </div>
            )
          })}
        </div>
      </div>

      {/* ČSOB exception or hard-block warning */}
      {csobException && (
        <div className="rounded-xl bg-warning-light border border-warning-border px-4 py-3 animate-fade-up">
          <p className="text-xs font-semibold text-warning-text mb-1">ČSOB Exception: Healthcare / Education</p>
          <p className="text-[11px] text-warning-text leading-relaxed">
            ČSOB allows Healthcare and Education employees to proceed during probation via manual
            headquarters underwriting. All other banks will decline until probation ends.
          </p>
        </div>
      )}
      {anyHardBlock && !csobException && (
        <div className="rounded-xl bg-risk-light border border-risk-border px-4 py-3 animate-fade-up">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-risk-text mb-1">Hard Block — Approval Unlikely</p>
              <p className="text-[11px] text-risk-text leading-relaxed">
                One or more conditions above will cause automatic decline at most banks.
                Resolve before applying. You can continue to see your projected capacity.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Employment sector ─────────────────────────────── */}
      <div>
        <label className="section-label mb-2 block">Employment Sector</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SECTORS.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange('employmentSector', value)}
              className={[
                'relative text-left rounded-xl border-2 px-4 py-3.5 transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
                employmentSector === value
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-border bg-card hover:border-border-strong',
              ].join(' ')}
            >
              {employmentSector === value && (
                <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-brand-600 flex items-center justify-center">
                  <Check size={9} className="text-white" strokeWidth={3} />
                </span>
              )}
              <p className={`text-xs font-bold mb-0.5 ${employmentSector === value ? 'text-brand-700' : 'text-ink'}`}>{label}</p>
              <p className="text-[10px] text-ink-subtle">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Contract type ─────────────────────────────────── */}
      <div>
        <label className="section-label mb-2 block">Employment Contract Type</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CONTRACT_TYPES.map(({ value, label, info }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange('contractType', value)}
              className={[
                'relative text-left rounded-xl border-2 px-4 py-3.5 transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
                contractType === value
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-border bg-card hover:border-border-strong',
              ].join(' ')}
            >
              {contractType === value && (
                <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-brand-600 flex items-center justify-center">
                  <Check size={9} className="text-white" strokeWidth={3} />
                </span>
              )}
              <p className={`text-xs font-bold mb-0.5 ${contractType === value ? 'text-brand-700' : 'text-ink'}`}>{label}</p>
              <p className={`text-[10px] ${contractType === value ? 'text-brand-500' : 'text-ink-subtle'}`}>{info}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Employment start date ─────────────────────────── */}
      <div>
        <label htmlFor="employmentStartDate" className="section-label mb-2 block">
          Employment Start Date
        </label>
        <input
          id="employmentStartDate"
          type="month"
          value={employmentStartDate}
          onChange={(e) => onChange('employmentStartDate', e.target.value)}
          max={maxMonthStr}
          className="input-field"
        />
        {lookbackMonths !== null && (
          <p className="text-[11px] text-ink-subtle mt-1.5">
            Income lookback:{' '}
            <strong className={lookbackMonths < 3 ? 'text-risk-text' : 'text-ink'}>{lookbackMonths} months</strong>
            {lookbackMonths < 3 && ' — insufficient history; minimum 3 months required by all banks.'}
            {lookbackMonths >= 3 && lookbackMonths < 12 && ' — short tenure; some banks apply additional review.'}
            {lookbackMonths >= 12 && ' — sufficient for standard assessment.'}
          </p>
        )}
      </div>

      {/* ── Net monthly salary ───────────────────────────── */}
      <div>
        <label htmlFor="netMonthlySalary" className="section-label mb-2 block">
          Net Monthly Take-Home Pay (CZK)
          <span className="text-risk-DEFAULT ml-1">*</span>
        </label>
        <div className="relative">
          <input
            id="netMonthlySalary"
            type="number"
            inputMode="numeric"
            min={0}
            value={netMonthlySalary ?? ''}
            onChange={(e) => onChange('netMonthlySalary', e.target.value === '' ? null : Number(e.target.value))}
            placeholder="e.g. 55 000"
            className="input-field pr-16 tabular-nums"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium">
            CZK / mo
          </span>
        </div>
        <p className="text-[11px] text-ink-subtle mt-1.5">
          Net monthly take-home pay after taxes and social deductions — average of the last 3–6 months.
        </p>
      </div>

      {/* ── Verification method ──────────────────────────── */}
      <div>
        <label htmlFor="verificationMethod" className="section-label mb-2 block">
          Income Verification Method
        </label>
        <select
          id="verificationMethod"
          value={verificationMethod}
          onChange={(e) => onChange('verificationMethod', e.target.value)}
          className="select-field"
        >
          <option value="">Select method…</option>
          <option value="payslips">Payslips (výplatní pásky) — last 3 months</option>
          <option value="bank_statement">Bank statement income credits</option>
          <option value="employer_letter">Employer income confirmation letter</option>
        </select>
        <p className="text-[11px] text-ink-subtle mt-1.5">
          Most banks require at least 3 payslips. Digital nomads may use bank statement credits.
        </p>
      </div>

      {/* ── Monthly dietary allowance ────────────────────── */}
      <div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-ink">Receives monthly dietary allowance (diety)?</p>
            <p className="text-[11px] text-ink-subtle mt-0.5">Stravenkový benefit or tax-exempt meal allowance</p>
          </div>
          <Toggle
            on={hasMonthlyDiety}
            onToggle={() => {
              onChange('hasMonthlyDiety', !hasMonthlyDiety)
              if (hasMonthlyDiety) onChange('monthlyDiety', null)
            }}
          />
        </div>
        {hasMonthlyDiety && (
          <div className="mt-2 animate-fade-up relative">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={monthlyDiety ?? ''}
              onChange={(e) => onChange('monthlyDiety', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="e.g. 3 500"
              className="input-field pr-20 tabular-nums"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium">
              CZK / mo
            </span>
          </div>
        )}
      </div>

      {/* ── FX salary component ──────────────────────────── */}
      <div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-ink">Part of salary paid in foreign currency?</p>
            <p className="text-[11px] text-ink-subtle mt-0.5">EUR, USD, GBP or CHF component</p>
          </div>
          <Toggle
            on={hasFxIncome}
            onToggle={() => {
              onChange('hasFxIncome', !hasFxIncome)
              if (hasFxIncome) onChange('foreignSalaryAmount', null)
            }}
          />
        </div>
        {hasFxIncome && (
          <div className="mt-2 animate-fade-up grid grid-cols-[120px_1fr] gap-2">
            <select
              value={foreignSalaryCurrency}
              onChange={(e) => onChange('foreignSalaryCurrency', e.target.value)}
              className="select-field"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="CHF">CHF</option>
            </select>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={foreignSalaryAmount ?? ''}
                onChange={(e) => onChange('foreignSalaryAmount', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="Amount per month"
                className="input-field pr-14 tabular-nums"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium">
                / mo
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Employer ownership stake ─────────────────────── */}
      <div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-ink">Do you own a stake in your employer?</p>
            <p className="text-[11px] text-ink-subtle mt-0.5">Affects ČSOB and UCB ownership-based assessment</p>
          </div>
          <Toggle
            on={hasOwnership}
            onToggle={() => {
              onChange('hasOwnership', !hasOwnership)
              if (hasOwnership) onChange('employerOwnershipPct', null)
            }}
          />
        </div>
        {hasOwnership && (
          <div className="mt-2 animate-fade-up">
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                value={employerOwnershipPct ?? ''}
                onChange={(e) => onChange('employerOwnershipPct', e.target.value === '' ? null : Math.min(100, Math.max(0, Number(e.target.value))))}
                placeholder="e.g. 40"
                className="input-field pr-10 tabular-nums"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium">%</span>
            </div>
            {ownershipPct > 33 && (
              <p className="text-xs text-risk-text mt-1.5">
                Above 33% — UCB will treat you as self-employed. ČSOB applies a 15% income haircut.
              </p>
            )}
            {ownershipPct > 25 && ownershipPct <= 33 && (
              <p className="text-xs text-warning-text mt-1.5">
                Above 25% — ČSOB applies a 15% income haircut.
              </p>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

// ── Main component ─────────────────────────────────────

export default function Step1EntityType({ value, onChange, onIcoResult, employeeData, onEmployeeChange, businessData, onBusinessChange, onContinue }) {
  const isEmployee     = value === 'zamestnanec'
  const isSelfEmployed = value === 'osvc' || value === 'sro'

  const canContinue = !!value && (
    !isEmployee || (
      (employeeData?.netMonthlySalary ?? 0) > 0 &&
      !!employeeData?.contractType
    )
  ) && (
    !isSelfEmployed || (
      !!businessData?.taxRegime && (
        (businessData.taxRegime === 'tax_return' && Number(businessData.annualTurnover           ?? 0) >= 1) ||
        (businessData.taxRegime === 'flat_tax'   && Number(businessData.avgMonthlyCreditTurnover ?? 0) >= 1)
      )
    )
  )

  return (
    <FunnelCard
      stepLabel="Step 1 of 7 · Business Structure"
      title="How do you earn income in Czechia?"
      subtitle="Your income structure determines your document requirements and which banks can assess your application. All three paths are fully supported."
      footer={
        <ActionBar
          isFirst
          canContinue={canContinue}
          onContinue={onContinue}
        />
      }
    >
      {/* IČO auto-lookup — only relevant for OSVČ / s.r.o. */}
      {!isEmployee && (
        <IcoLookup
          onResult={(result) => {
            onIcoResult(result)
            if (result.entityType) onChange(result.entityType)
          }}
        />
      )}

      {/* Entity selection — 3-column on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ENTITY_OPTIONS.map((opt) => (
          <EntityCard
            key={opt.value}
            option={opt}
            selected={value === opt.value}
            onSelect={() => onChange(opt.value)}
          />
        ))}
      </div>

      {/* Business income sub-section — shown for OSVČ / s.r.o. */}
      {isSelfEmployed && (
        <BusinessIncomeSection
          data={businessData ?? {}}
          onChange={onBusinessChange}
        />
      )}

      {/* Employee detail fields — shown inline when Zaměstnanec selected */}
      {isEmployee && (
        <EmployeeDetails
          data={employeeData ?? {}}
          onChange={onEmployeeChange}
        />
      )}
    </FunnelCard>
  )
}
