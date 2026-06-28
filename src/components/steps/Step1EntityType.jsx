import { useEffect, useRef, useState } from 'react'
import {
  Briefcase, Building2, UserCheck,
  Check, Loader2, CheckCircle, XCircle, ChevronDown,
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
    title:    'OSVČ',
    subtitle: 'Self-employed · Freelancer · Živnostník',
    desc:     'You operate under a Czech trade license as an individual. Income declared via personal tax return (DPFO).',
    docs: [
      'Trade license — Živnostenský list',
      'Personal tax returns (DPFO) — last 2 years',
      'ČSSZ & health insurer clearances',
    ],
    note: 'Simpler document path — one set of financials',
  },
  {
    value:    'sro',
    Icon:     Building2,
    title:    's.r.o. Director',
    subtitle: 'Limited company owner · Director · Shareholder',
    desc:     'You receive income as a director, employee, or dividend recipient of a Czech s.r.o. (spol. s r.o.).',
    docs: [
      'Corporate financials (DPPO) — last 2 years',
      'Director salary slips or dividend history',
      'UBO ownership structure declaration',
    ],
    note: 'Both company and personal documents required',
  },
  {
    value:    'zamestnanec',
    Icon:     UserCheck,
    title:    'Zaměstnanec',
    subtitle: 'Employed · Contract worker · Expat employee',
    desc:     'You receive a regular salary from a Czech employer. Income verified via payslips and employer confirmation.',
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

// ── Employee detail fields ─────────────────────────────

const CONTRACT_TYPES = [
  { value: 'indefinite', label: 'Indefinite period contract' },
  { value: 'definite',   label: 'Fixed-term contract'        },
]

const SECTORS = [
  { value: 'health',    label: 'Healthcare',     desc: 'Doctors, nurses, medical staff'  },
  { value: 'education', label: 'Education',       desc: 'Teachers, academics, university' },
  { value: 'other',     label: 'Other sector',    desc: 'Private sector or other field'   },
]

function EmployeeDetails({ data, onChange }) {
  const { netIncome = '', contractType = '', probationPeriod = '', employmentSector = '' } = data

  return (
    <div className="mt-7 pt-7 border-t border-border space-y-5 animate-fade-up">

      {/* Methodology explanation */}
      <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">
        <p className="text-[11px] font-semibold text-brand-700 uppercase tracking-wide mb-2">
          How banks evaluate employees
        </p>
        <p className="text-xs text-brand-700 leading-relaxed">
          Mortgage underwriting guidelines represent the internal rules banks use to assess
          an applicant's repayment capacity and property collateral value. These directives
          determine your maximum borrowing power and approval conditions.
        </p>
      </div>

      {/* Net monthly income */}
      <div>
        <label htmlFor="netIncome" className="section-label mb-2 block">
          Net Monthly Income (CZK)
          <span className="text-risk-DEFAULT ml-1">*</span>
        </label>
        <div className="relative">
          <input
            id="netIncome"
            type="number"
            inputMode="numeric"
            min={0}
            value={netIncome}
            onChange={(e) => onChange('netIncome', Number(e.target.value))}
            placeholder="e.g. 55 000"
            className="input-field pr-16 tabular-nums"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium">
            CZK / mo
          </span>
        </div>
        <p className="text-[11px] text-ink-subtle mt-1.5">
          Use your average net income from the last 3–6 months after taxes and deductions.
        </p>
      </div>

      {/* Contract type */}
      <div>
        <label className="section-label mb-2 block">Employment Contract Type</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CONTRACT_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange('contractType', value)}
              className={[
                'relative text-left rounded-xl border-2 px-4 py-3.5 text-xs font-medium',
                'transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
                contractType === value
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-border bg-card text-ink-muted hover:border-border-strong',
              ].join(' ')}
            >
              {contractType === value && (
                <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-brand-600 flex items-center justify-center">
                  <Check size={9} className="text-white" strokeWidth={3} />
                </span>
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Probation period */}
      <div>
        <label className="section-label mb-2 block">Are you currently in a probation period?</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'no',  label: 'No — probation period ended'    },
            { value: 'yes', label: 'Yes — currently in probation'   },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange('probationPeriod', value)}
              className={[
                'relative text-left rounded-xl border-2 px-4 py-3.5 text-xs font-medium',
                'transition-all duration-150 focus:outline-none',
                probationPeriod === value
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-border bg-card text-ink-muted hover:border-border-strong',
              ].join(' ')}
            >
              {probationPeriod === value && (
                <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-brand-600 flex items-center justify-center">
                  <Check size={9} className="text-white" strokeWidth={3} />
                </span>
              )}
              {label}
            </button>
          ))}
        </div>
        {probationPeriod === 'yes' && (
          <div className="mt-2 flex items-start gap-2 rounded-lg bg-warning-light border border-warning-border px-3 py-2.5">
            <ChevronDown size={13} className="text-warning-DEFAULT flex-shrink-0 mt-0.5 rotate-[-90deg]" />
            <p className="text-[11px] text-warning-text leading-relaxed">
              Most banks will decline a mortgage application during a probation period. We recommend
              applying after probation ends. Exception: ČSOB allows Healthcare and Education
              employees to proceed via manual headquarters underwriting.
            </p>
          </div>
        )}
      </div>

      {/* Employment sector — ČSOB exception applies to Health / Education */}
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
              <p className={`text-xs font-bold mb-0.5 ${employmentSector === value ? 'text-brand-700' : 'text-ink'}`}>
                {label}
              </p>
              <p className="text-[10px] text-ink-subtle">{desc}</p>
            </button>
          ))}
        </div>
        {(employmentSector === 'health' || employmentSector === 'education') && (
          <div className="mt-2 flex items-start gap-2 rounded-lg bg-success-light border border-success-border px-3 py-2.5">
            <Check size={11} className="text-success-DEFAULT flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-success-text leading-relaxed">
              ČSOB compensating strength rule: Healthcare and Education employees may proceed
              even during probation via manual headquarters underwriting review.
            </p>
          </div>
        )}
      </div>

    </div>
  )
}

// ── Main component ─────────────────────────────────────

export default function Step1EntityType({ value, onChange, onIcoResult, employeeData, onEmployeeChange, onContinue }) {
  const isEmployee = value === 'zamestnanec'

  const canContinue = !!value && (
    !isEmployee || (
      (employeeData?.netIncome ?? 0) > 0 &&
      !!employeeData?.contractType
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
