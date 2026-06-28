import { useEffect, useRef, useState } from 'react'
import { Briefcase, Building2, Check, Loader2, CheckCircle, XCircle } from 'lucide-react'
import FunnelCard from '../funnel/FunnelCard.jsx'
import ActionBar  from '../funnel/ActionBar.jsx'

// ── ARES legal-form → entity-type mapping ──────────────
// Source: číselník právních forem ARES / MF ČR
const OSVC_FORMS = new Set(['101', '102', '103', '104', '105', '106', '107', '108', '109'])
const SRO_FORMS  = new Set(['112'])

function mapLegalForm(pravniForma) {
  if (OSVC_FORMS.has(pravniForma)) return 'osvc'
  if (SRO_FORMS.has(pravniForma))  return 'sro'
  return ''
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
  const [ico,          setIco]          = useState('')
  const [status,       setStatus]       = useState('idle')  // idle|loading|found|error
  const [businessName, setBusinessName] = useState('')
  const [ageMonths,    setAgeMonths]    = useState(null)
  const [qualified,    setQualified]    = useState(false)
  const abortRef = useRef(null)

  useEffect(() => {
    if (ico.length !== 8) { setStatus('idle'); return }

    // Cancel any previous in-flight request
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setStatus('loading')
    setBusinessName('')
    setAgeMonths(null)

    fetch(
      `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`,
      { signal: ctrl.signal },
    )
      .then((r) => {
        if (!r.ok) throw new Error('not_found')
        return r.json()
      })
      .then((data) => {
        const name       = data.obchodniJmeno  ?? ''
        const formCode   = String(data.pravniForma ?? '')
        const dateStr    = data.datumVzniku    ?? ''
        const months     = calcAgeMonths(dateStr)
        const entityType = mapLegalForm(formCode)

        setBusinessName(name)
        setAgeMonths(months)
        setQualified(months !== null && months >= 24)
        setStatus('found')

        onResult({
          ico,
          businessName:     name,
          businessAgeMonths: months,
          datumVzniku:      dateStr,
          entityType,
        })
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setStatus('error')
        onResult({ ico, businessName: '', businessAgeMonths: null, datumVzniku: '', entityType: '' })
      })

    return () => ctrl.abort()
  }, [ico])  // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 8)
    setIco(val)
    if (val.length < 8) { setStatus('idle'); setBusinessName(''); setAgeMonths(null) }
  }

  return (
    <div className="mb-7 pb-7 border-b border-border">
      <label htmlFor="ico" className="section-label mb-2 block">
        Zadejte Vaše IČO
      </label>

      <div className="relative">
        <input
          id="ico"
          type="text"
          inputMode="numeric"
          value={ico}
          onChange={handleChange}
          placeholder="Např. 12345678"
          maxLength={8}
          className="input-field pr-11 tabular-nums tracking-widest"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {status === 'loading' && <Loader2  size={16} className="text-ink-subtle animate-spin" />}
          {status === 'found'   && <CheckCircle size={16} className="text-success-DEFAULT" />}
          {status === 'error'   && <XCircle    size={16} className="text-risk-DEFAULT" />}
        </span>
      </div>

      {/* Status rows */}
      {status === 'loading' && (
        <p className="text-xs text-ink-muted mt-2">Hledám v registru ARES…</p>
      )}

      {status === 'found' && businessName && (
        <div className="mt-3 rounded-xl bg-success-light border border-success-border px-4 py-3 space-y-1.5">
          <div className="flex items-start gap-2">
            <CheckCircle size={13} className="text-success-DEFAULT flex-shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-success-text leading-tight">{businessName}</p>
          </div>
          {ageMonths !== null && (
            <div className="flex items-center gap-2 ml-[21px]">
              <p className="text-[11px] text-success-text">
                Founded {formatAge(ageMonths)} ago
              </p>
              {qualified ? (
                <span className="badge-success text-[10px] px-1.5 py-0.5">24-month requirement met</span>
              ) : (
                <span className="badge-warning text-[10px] px-1.5 py-0.5">Under 24 months — limited options</span>
              )}
            </div>
          )}
          <p className="text-[11px] text-success-text/70 ml-[21px]">
            Entity type and path selected automatically below
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-1.5 mt-2">
          <XCircle size={12} className="text-risk-DEFAULT flex-shrink-0" />
          <p className="text-xs text-risk-text">
            IČO nebylo nalezeno, prosím zadejte údaje ručně
          </p>
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

// ── Main component ─────────────────────────────────────

export default function Step1EntityType({ value, onChange, onIcoResult, onContinue }) {
  return (
    <FunnelCard
      stepLabel="Step 1 of 7 · Business Structure"
      title="How do you earn income in Czechia?"
      subtitle="Your business structure determines your document requirements and which banks can assess your application. Both paths are fully supported."
      footer={
        <ActionBar
          isFirst
          canContinue={!!value}
          onContinue={onContinue}
        />
      }
    >
      {/* IČO auto-lookup */}
      <IcoLookup
        onResult={(result) => {
          onIcoResult(result)
          if (result.entityType) onChange(result.entityType)
        }}
      />

      {/* Manual entity selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ENTITY_OPTIONS.map((opt) => (
          <EntityCard
            key={opt.value}
            option={opt}
            selected={value === opt.value}
            onSelect={() => onChange(opt.value)}
          />
        ))}
      </div>
    </FunnelCard>
  )
}
