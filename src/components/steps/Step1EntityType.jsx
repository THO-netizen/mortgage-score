import { useEffect, useRef, useState } from 'react'
import {
  Briefcase, Building2, UserCheck, ExternalLink,
  Check, Loader2, CheckCircle, XCircle, ChevronDown, AlertTriangle,
} from 'lucide-react'
import FunnelCard          from '../funnel/FunnelCard.jsx'
import ActionBar           from '../funnel/ActionBar.jsx'
import { mapNaceToSector, NACE_SECTOR_OPTIONS } from '../../utils/scoringEngine.js'

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
  '101': 'Sole Trader',
  '102': 'Sole Trader',
  '103': 'Sole Trader — Agriculture',
  '104': 'Sole Trader — Liberal Profession',
  '105': 'Sole Trader',
  '106': 'Sole Trader',
  '107': 'Sole Trader',
  '108': 'Sole Trader',
  '109': 'Sole Trader',
  '112': 'Limited Liability Company (s.r.o.)',
  '121': 'Joint-Stock Company (a.s.)',
  '141': 'Cooperative',
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

function IcoLookup({ onResult, entityType }) {
  const [icoInput,        setIcoInput]        = useState('')
  const [status,          setStatus]          = useState('idle')  // idle|loading|found|inactive|error
  const [businessName,    setBusinessName]    = useState('')
  const [ageMonths,       setAgeMonths]       = useState(null)
  const [qualified,       setQualified]       = useState(false)
  const [legalFormLabel,  setLegalFormLabel]  = useState('')
  const [resolvedType,    setResolvedType]    = useState('')
  const [activeStatus,    setActiveStatus]    = useState('')   // raw stavEkonSubjektu from ARES
  const [naceSector,      setNaceSector]      = useState('')
  const [nacePct,         setNacePct]         = useState(null)
  const [primaryNace,     setPrimaryNace]     = useState('')
  const [hasGap,          setHasGap]          = useState(false)
  const [manualSector,    setManualSector]    = useState('')
  const abortRef = useRef(null)

  const CLEAR_RESULT = {
    ico: '', businessName: '', businessAgeMonths: null, datumVzniku: '',
    entityType: '', legalFormLabel: '', icoActiveStatus: '',
    primaryNace: '', naceSector: '', turnoverIncomePct: null, businessActivityGap: false,
  }

  const resetResult = () => {
    setStatus('idle')
    setBusinessName('')
    setAgeMonths(null)
    setLegalFormLabel('')
    setResolvedType('')
    setActiveStatus('')
    setNaceSector('')
    setNacePct(null)
    setPrimaryNace('')
    setHasGap(false)
    setManualSector('')
  }

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 8)
    setIcoInput(val)
    if (status !== 'idle' && status !== 'loading') {
      resetResult()
      onResult({ ...CLEAR_RESULT, ico: val })
    }
  }

  const handleVerify = () => {
    if (icoInput.length !== 8 || status === 'loading') return

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setStatus('loading')
    setBusinessName('')
    setAgeMonths(null)
    setLegalFormLabel('')
    setResolvedType('')
    setActiveStatus('')

    fetch(
      `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${icoInput}`,
      { signal: ctrl.signal },
    )
      .then((r) => {
        if (!r.ok) throw new Error('not_found')
        return r.json()
      })
      .then((data) => {
        const name         = data.obchodniJmeno ?? data.nazev ?? ''
        const formCode     = String(data.pravniForma ?? '')
        const dateStr      = data.datumVzniku ?? ''
        const months       = calcAgeMonths(dateStr)
        const resolvedEntityType = mapLegalForm(formCode)
        const formLabel    = getLegalFormLabel(formCode)
        // stavEkonSubjektu: 'AKTIVNÍ' | 'ZANIKLÝ' | 'POZASTAVENÝ' | etc.
        const icoStatus    = data.stavEkonSubjektu ?? 'AKTIVNÍ'
        // Gap: currently suspended or has a dissolution date on record
        const gap = icoStatus === 'POZASTAVENÝ' || !!data.datumZaniku

        // NACE — primary business activity code (first in array, any length)
        const rawNace  = (data.czNace ?? [])[0] ?? ''
        const { pct: nPct, sector: nSector } = mapNaceToSector(rawNace)

        setBusinessName(name)
        setAgeMonths(months)
        setQualified(months !== null && months >= 24)
        setLegalFormLabel(formLabel)
        setResolvedType(resolvedEntityType)
        setActiveStatus(icoStatus)
        setPrimaryNace(rawNace)
        setNaceSector(nSector)
        setNacePct(nPct)
        setHasGap(gap)
        setManualSector('')
        setStatus(icoStatus === 'AKTIVNÍ' ? 'found' : 'inactive')

        onResult({
          ico: icoInput, businessName: name, businessAgeMonths: months,
          datumVzniku: dateStr, entityType: resolvedEntityType, legalFormLabel: formLabel,
          icoActiveStatus: icoStatus,
          primaryNace: rawNace, naceSector: nSector, turnoverIncomePct: nPct,
          businessActivityGap: gap,
        })
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setStatus('error')
        onResult({ ...CLEAR_RESULT, ico: icoInput })
      })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleVerify()
  }

  const entityBadgeClass = resolvedType === 'osvc' ? 'badge-warning' : 'badge-neutral'
  const entityBadgeLabel = resolvedType === 'osvc' ? 'Self-employed' : resolvedType === 'sro' ? 'Company Director' : 'Other'
  const canVerify = icoInput.length === 8 && status !== 'loading'
  const hasResult = status === 'found' || status === 'inactive'

  return (
    <div className="mt-6 pt-6 border-t border-border space-y-4 animate-fade-up">

      <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide">
        Business Registry Verification
      </p>

      {/* ── IČO input + Verify button ─────────────────── */}
      <div>
        <label htmlFor="ico" className="section-label mb-2 block">
          {entityType === 'osvc' ? 'Trade License Number (IČO)' : 'Company Registration Number (IČO)'}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              id="ico"
              type="text"
              inputMode="numeric"
              value={icoInput}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 12345678"
              maxLength={8}
              className="input-field pr-11 tabular-nums tracking-widest w-full"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              {status === 'found'    && <CheckCircle size={16} className="text-success-DEFAULT" />}
              {status === 'inactive' && <XCircle     size={16} className="text-warning-DEFAULT" />}
              {status === 'error'    && <XCircle     size={16} className="text-risk-DEFAULT" />}
            </span>
          </div>
          <button
            type="button"
            onClick={handleVerify}
            disabled={!canVerify}
            className={[
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
              canVerify
                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                : 'bg-surface text-ink-subtle border border-border cursor-not-allowed',
            ].join(' ')}
          >
            {status === 'loading'
              ? <><Loader2 size={14} className="animate-spin" /> Verifying…</>
              : 'Verify Company'
            }
          </button>
        </div>

        {status === 'error' && (
          <div className="flex items-center gap-1.5 mt-2">
            <XCircle size={12} className="text-risk-DEFAULT flex-shrink-0" />
            <p className="text-xs text-risk-text">Company not found. Please check the registration number and try again.</p>
          </div>
        )}
      </div>

      {/* ── Auto-populated fields — visible after lookup ── */}
      {hasResult && (
        <div className="space-y-3 animate-fade-up">

          {/* Primary result banner — active (green) vs inactive (amber) */}
          {status === 'inactive' ? (
            <div className="flex items-start gap-3 rounded-xl bg-warning-light border border-warning-border px-4 py-3">
              <AlertTriangle size={16} className="text-warning-DEFAULT flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-warning-text leading-snug truncate">{businessName}</p>
                <p className="text-[11px] text-warning-text mt-0.5">
                  This company registration is not currently active ({activeStatus}). Please verify
                  your registration status with the Czech Business Register.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-success-light border border-success-border px-4 py-3">
              <CheckCircle size={18} className="text-success-DEFAULT flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-success-text leading-snug truncate">{businessName}</p>
                <p className="text-[10px] text-success-text/80 mt-0.5">
                  Active — Verified via Czech Business Register (ARES)
                </p>
              </div>
            </div>
          )}

          {/* Legal Structure */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
            <span className="flex-1 text-sm font-medium text-ink leading-snug">{legalFormLabel}</span>
          </div>

          {/* Business age */}
          {ageMonths !== null && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
              <span className="text-xs text-ink-muted">Registered</span>
              <span className="text-xs font-semibold text-ink">{formatAge(ageMonths)}</span>
            </div>
          )}

          {/* NACE business sector — shown for OSVČ after lookup */}
          {resolvedType === 'osvc' && naceSector && (
            <div className="rounded-xl border border-border bg-surface px-4 py-3">
              <span className="text-xs text-ink-muted block mb-0.5">Business sector (NACE)</span>
              <span className="text-xs font-semibold text-ink">{naceSector}</span>
              {nacePct !== null && (
                <span className="text-[11px] text-ink-subtle ml-2">({nacePct}% income recognition)</span>
              )}
            </div>
          )}

          {/* Manual sector fallback — when NACE code has no automatic mapping */}
          {resolvedType === 'osvc' && status === 'found' && nacePct === null && (
            <div className="rounded-xl border border-warning-border bg-warning-light px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-warning-text">
                Business activity not recognised automatically. Please select your industry:
              </p>
              <select
                className="select-field text-xs"
                value={manualSector}
                onChange={(e) => {
                  const chosen = NACE_SECTOR_OPTIONS.find((o) => o.sector === e.target.value)
                  setManualSector(e.target.value)
                  if (chosen) {
                    setNaceSector(chosen.sector)
                    setNacePct(chosen.pct)
                    onResult({ naceSector: chosen.sector, turnoverIncomePct: chosen.pct })
                  }
                }}
              >
                <option value="">Select your business sector…</option>
                {NACE_SECTOR_OPTIONS.map((o) => (
                  <option key={o.sector} value={o.sector}>{o.sector} — {o.pct}% income recognition</option>
                ))}
              </select>
            </div>
          )}

        </div>
      )}

    </div>
  )
}

// ── Entity selection cards ─────────────────────────────

const ENTITY_OPTIONS = [
  {
    value:    'zamestnanec',
    Icon:     UserCheck,
    title:    'Employed',
    subtitle: 'Salary employee · Contract worker · Expat hire',
    desc:     'You receive a regular salary from a Czech or foreign employer. Income verified via payslips and employer confirmation.',
    docs: [
      'Last 3 payslips',
      'Income confirmation letter',
      'Employment contract',
    ],
    note: 'Fastest path — automated scoring by most banks',
  },
  {
    value:    'osvc',
    Icon:     Briefcase,
    title:    'Self-employed',
    subtitle: 'Freelancer · Sole trader · Trade licence holder',
    desc:     'You operate under a Czech trade licence as an individual. Income declared via personal tax return (Tax Return / DAP).',
    docs: [
      'Trade licence',
      'Tax returns — last 2 years',
      'Social insurance clearance',
    ],
    note: 'Simpler document path — one set of financials',
  },
  {
    value:    'other',
    Icon:     Building2,
    title:    'Other / Complex situation',
    subtitle: 'International residency · Mixed income · Other',
    desc:     'For complex income structures, international tax residency, or other situations, let\'s discuss your case personally.',
    docs:     [],
    note:     'Open a personal consultation',
    external: true,
    href:     'https://calendly.com/andy-lkadvisor/30min',
  },
]

function EntityCard({ option, selected, onSelect }) {
  const { Icon, title, subtitle, desc, docs, note } = option
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'relative w-full text-left rounded-2xl border-2 p-4 sm:p-6',
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
        'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-5 transition-colors duration-200',
        selected ? 'bg-brand-600' : 'bg-surface',
      ].join(' ')}>
        <Icon size={20} className={selected ? 'text-white' : 'text-ink-muted'} />
      </div>
      <h3 className="font-display text-lg sm:text-xl font-extrabold text-ink leading-tight mb-0.5">{title}</h3>
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
    sublabel: 'Flat Tax Regime',
    desc:     'Average monthly business turnover (from bank statements) — We use your average monthly business credit turnover, not a tax-return figure. Flat-tax filers don\'t declare turnover in a return; banks read it from your last 3–6 months of statements.',
  },
]

function BusinessIncomeSection({ data, onChange }) {
  const {
    taxRegime                = '',
    annualTurnover           = null,
    avgMonthlyCreditTurnover = null,
    // ARES-verified identity
    businessName             = '',
    datumVzniku              = '',
    companyExistenceMonths   = null,
    icoActiveStatus          = '',
    // NACE-derived income recognition
    naceSector               = '',
    turnoverIncomePct        = null,
  } = data

  const [turnoverTouched, setTurnoverTouched] = useState(false)

  const handleRegimeChange = (newRegime) => {
    onChange('taxRegime', newRegime)
    setTurnoverTouched(false)
  }

  const turnoverError = turnoverTouched && !!taxRegime && !(Number(annualTurnover) >= 1)

  // ARES-derived state
  const aresVerified    = !!businessName && !!datumVzniku
  const isInactive      = aresVerified && icoActiveStatus && icoActiveStatus !== 'AKTIVNÍ'
  const existMo         = companyExistenceMonths !== null ? Number(companyExistenceMonths) : null
  const aresAgeResolved = aresVerified && existMo !== null

  return (
    <div className="mt-7 pt-7 border-t border-border space-y-5 animate-fade-up">

      {/* ── ARES identity block ───────────────────────── */}
      {aresVerified && (
        <div className="space-y-3">

          {/* Inactive trade licence — hard block */}
          {isInactive ? (
            <div className="flex items-start gap-3 rounded-xl bg-risk-light border border-risk-border px-4 py-3">
              <XCircle size={15} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-risk-text mb-0.5">{businessName}</p>
                <p className="text-[11px] text-risk-text leading-relaxed">
                  This company registration is not currently active ({icoActiveStatus}). Inactive
                  registrations cannot be assessed for mortgage underwriting. Please verify your
                  registration status at the Czech Business Register (ARES).
                </p>
              </div>
            </div>
          ) : (
            /* Active — verified company badge */
            <div className="flex items-center gap-3 rounded-xl bg-success-light border border-success-border px-4 py-3">
              <CheckCircle size={15} className="text-success-DEFAULT flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-success-text truncate">{businessName}</p>
                <p className="text-[10px] text-success-text/80 mt-0.5">
                  Verified via Czech Business Register (ARES)
                </p>
              </div>
            </div>
          )}

          {/* Business age — auto-resolved from ARES */}
          {aresAgeResolved && !isInactive && (
            existMo < 12 ? (
              <div className="flex items-start gap-3 rounded-xl bg-risk-light border border-risk-border px-4 py-3">
                <AlertTriangle size={14} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-risk-text mb-0.5">Hard Block — Insufficient Business History</p>
                  <p className="text-[11px] text-risk-text leading-relaxed">
                    According to the Czech Business Register, your trade licence has been active for{' '}
                    <strong>{formatAge(existMo)}</strong>. Our underwriting criteria require at least
                    12 months of active business history (major Czech lenders). UCB and mBank
                    may consider applications from 6 months, but with significant income restrictions.
                  </p>
                </div>
              </div>
            ) : existMo < 24 ? (
              <div className="flex items-center gap-2 rounded-xl border border-warning-border bg-warning-light px-4 py-3">
                <AlertTriangle size={13} className="text-warning-DEFAULT flex-shrink-0" />
                <span className="text-xs font-semibold text-warning-text">
                  Active for {formatAge(existMo)} — auto-resolved from ARES
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-success-border bg-success-light px-4 py-3">
                <CheckCircle size={13} className="text-success-DEFAULT flex-shrink-0" />
                <span className="text-xs font-semibold text-success-text">
                  Active for {formatAge(existMo)} — auto-resolved from ARES
                </span>
              </div>
            )
          )}
        </div>
      )}

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
              revenues from the Profit &amp; Loss statement.
            </p>
          )}

        </div>
      )}

      {/* Branch B — Flat tax → Annual Turnover + NACE income estimate */}
      {taxRegime === 'flat_tax' && (
        <div className="animate-fade-up">
          <label htmlFor="annualTurnoverFlat" className="section-label mb-1.5 block">
            Gross Annual Turnover (Obrat)
            <span className="text-risk-DEFAULT ml-1">*</span>
          </label>
          <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide mb-2">
            Enter your gross annual business turnover for the NACE-based income calculation
          </p>
          <div className="relative">
            <input
              id="annualTurnoverFlat"
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
              Enter your total gross annual revenues. The recognised income is calculated automatically
              using the sector expense ratio derived from your NACE business activity.
            </p>
          )}

          {/* NACE-derived income estimate */}
          {Number(annualTurnover) >= 1 && turnoverIncomePct !== null && (
            <div className="mt-3 rounded-xl bg-brand-50 border border-brand-100 p-4 animate-fade-up">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wide">
                  Estimated Recognised Income
                </p>
                <span className="badge-success text-[10px]">{turnoverIncomePct}% of turnover</span>
              </div>
              {naceSector && (
                <p className="text-[11px] text-brand-600 mb-2">{naceSector}</p>
              )}
              <p className="font-display text-2xl font-black text-brand-800 tabular-nums">
                {Math.round(Number(annualTurnover) * turnoverIncomePct / 100 / 12).toLocaleString('cs-CZ')}
                <span className="text-sm font-semibold text-brand-600 ml-1.5">CZK / month</span>
              </p>
              <p className="text-[10px] text-brand-500 mt-1">
                {Number(annualTurnover).toLocaleString('cs-CZ')} × {turnoverIncomePct}% ÷ 12 months
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

// ── Employee detail fields ─────────────────────────────

const CONTRACT_TYPES = [
  { value: 'indefinite', label: 'Indefinite period (HPP)' },
  { value: 'definite',   label: 'Fixed-term contract'      },
  { value: 'agency',     label: 'Agency / temp worker'     },
  { value: 'dpc',        label: 'Supplemental agreement'  },
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

// ── s.r.o. Director — ESSO corporate income assessment (v2) ──

const STREAM_OPTIONS = [
  {
    value:   'A',
    title:   'Stream A — Director Salary',
    subtitle: "Director's Salary",
    desc:    'Regular monthly salary paid by the company, net after personal income tax and social contributions.',
    varNote: '+10–20% Var(X) by stake',
  },
  {
    value:   'B',
    title:   'Stream B — Profit Share',
    subtitle: 'Dividends / Profit Share',
    desc:    'Annual profit distributions based on company after-tax result and ownership stake. Requires 3-year dividend history.',
    varNote: '+35% Var(X) penalty',
  },
  {
    value:   'C',
    title:   'Stream C — Director Fees',
    subtitle: "Director's Service Agreement",
    desc:    "Fees under a signed Director's Service Agreement. Verified contract document required by all lenders.",
    varNote: '+15% Var(X) penalty',
  },
]

const EXPENSE_LUMP_OPTIONS = [
  { value: 80, label: '80%', desc: 'Agricultural / retail trades' },
  { value: 60, label: '60%', desc: 'Craft trades' },
  { value: 40, label: '40%', desc: 'Capital income / rentals' },
  { value: 30, label: '30%', desc: 'Liberal professions / IT consulting' },
]

function SroIncomeSection({ data, onChange }) {
  const {
    companyIncomeStream          = '',
    companyOwnershipPct          = null,
    familyOwnershipPctAggregate  = null,
    companyExistenceMonths       = null,
    companyAfterTaxResult        = null,
    companyEquity                = null,
    dividendsPaidLast3Years      = null,
    annualGrossRevenues          = null,
    expenseLumpSumPct            = null,
    directorContractExists       = false,
    sroDirectorSalary            = null,
    sroDirectorFees              = null,
    avgMonthlyCreditTurnover     = null,
    taxRegime                    = '',
    // ARES-verified identity
    businessName                 = '',
    datumVzniku                  = '',
  } = data

  // True when company history was resolved from ARES (not manually entered)
  const aresVerified = !!businessName && !!datumVzniku

  // ── Parse active streams ──────────────────────────────
  const hasA = companyIncomeStream.includes('A')
  const hasB = companyIncomeStream.includes('B')
  const hasC = companyIncomeStream.includes('C')

  const toggleStream = (s) => {
    const active = new Set([...companyIncomeStream].filter(c => ['A', 'B', 'C'].includes(c)))
    if (active.has(s)) active.delete(s)
    else               active.add(s)
    onChange('companyIncomeStream', ['A', 'B', 'C'].filter(c => active.has(c)).join(''))
  }

  // ── Eligibility ───────────────────────────────────────
  const equityVal  = companyEquity          !== null ? Number(companyEquity)          : null
  const afterTaxV  = companyAfterTaxResult  !== null ? Number(companyAfterTaxResult)  : null
  const existMoV   = companyExistenceMonths !== null ? Number(companyExistenceMonths) : null

  const negEquity  = equityVal !== null && equityVal < 0
  const negPnL     = afterTaxV !== null && afterTaxV < 0
  const noHistory  = existMoV  !== null && existMoV < 12
  const hardBlock  = negEquity || negPnL || noHistory
  const mediumRisk = !hardBlock && existMoV !== null && existMoV >= 12 && existMoV < 24

  // ── Ownership ─────────────────────────────────────────
  const ownPct     = Number(companyOwnershipPct          ?? 0)
  const famPct     = Number(familyOwnershipPctAggregate  ?? 0)
  const totalPct   = ownPct + famPct
  const fullAudit  = ownPct > 50

  return (
    <div className="mt-7 pt-7 border-t border-border space-y-6 animate-fade-up">

      {/* ── ESSO banner ───────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={14} className="text-brand-600 flex-shrink-0" />
          <p className="font-display text-sm font-extrabold text-ink">Corporate Income Assessment</p>
        </div>

        {/* ARES-verified company badge */}
        {aresVerified && (
          <div className="flex items-center gap-3 rounded-xl bg-success-light border border-success-border px-4 py-3">
            <CheckCircle size={16} className="text-success-DEFAULT flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-success-text leading-snug truncate">{businessName}</p>
              <p className="text-[10px] text-success-text/80 mt-0.5">Verified company — data auto-filled from ARES</p>
            </div>
          </div>
        )}

        <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">
          <p className="text-[11px] font-semibold text-brand-700 uppercase tracking-wide mb-1">
            ESSO — Economically Self-related Subject Owner
          </p>
          <p className="text-xs text-brand-700 leading-relaxed">
            Czech banks assess Company Director income via ESSO methodology — a stricter audit path
            requiring corporate financial statements, ownership verification, and profitability evidence.
            Select your income streams and enter the required financial data below.
          </p>
        </div>
      </div>

      {/* ── 1. Corporate Financial Health ─────────────── */}
      <div>
        <p className="section-label mb-3 block">1. Corporate Financial Health</p>
        <div className="space-y-3">

          <div>
            <label htmlFor="companyEquity" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
              Company Net Equity (CZK)
            </label>
            <div className="relative">
              <input
                id="companyEquity"
                type="number"
                inputMode="numeric"
                value={companyEquity ?? ''}
                onChange={(e) => onChange('companyEquity', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="e.g. 2 500 000"
                className={`input-field pr-28 tabular-nums${negEquity ? ' input-error' : ''}`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium whitespace-nowrap">CZK / yr-end</span>
            </div>
            {negEquity
              ? <p className="text-xs text-risk-text mt-1">Hard Block — negative equity prevents ESSO income recognition.</p>
              : equityVal !== null && <p className="text-[11px] text-success-text mt-1">Positive equity — ESSO financial health gate passed.</p>
            }
          </div>

          <div>
            <label htmlFor="companyAfterTaxResult" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
              After-Tax Net Result (CZK)
            </label>
            <div className="relative">
              <input
                id="companyAfterTaxResult"
                type="number"
                inputMode="numeric"
                value={companyAfterTaxResult ?? ''}
                onChange={(e) => onChange('companyAfterTaxResult', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="e.g. 800 000"
                className={`input-field pr-24 tabular-nums${negPnL ? ' input-error' : ''}`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium whitespace-nowrap">CZK / yr</span>
            </div>
            {negPnL
              ? <p className="text-xs text-risk-text mt-1">Hard Block — net loss prevents ESSO income recognition.</p>
              : <p className="text-[11px] text-ink-subtle mt-1">Net profit after DPPO. Used directly in Stream B (ČSOB formula).</p>
            }
          </div>

        </div>
      </div>

      {/* ── 2. Company History ────────────────────────── */}
      <div>
        <p className="section-label mb-1.5">2. Company Existence</p>

        {/* ARES auto-resolved — hide manual input, show verified status */}
        {aresVerified && existMoV !== null ? (
          <div>
            {existMoV < 12 ? (
              <div className="rounded-xl bg-risk-light border border-risk-border px-4 py-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-risk-text mb-1">Hard Block — Insufficient History</p>
                    <p className="text-[11px] text-risk-text leading-relaxed">
                      According to the Czech Business Register, your company has been active for{' '}
                      <strong>{formatAge(existMoV)}</strong>. This does not meet the minimum 12-month
                      underwriting criteria required by all Czech banks under ESSO methodology.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-success-border bg-success-light px-4 py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-success-DEFAULT flex-shrink-0" />
                  <span className="text-xs font-semibold text-success-text">
                    Company active for {formatAge(existMoV)} — auto-resolved from ARES
                  </span>
                </div>
                {existMoV >= 24
                  ? <span className="badge-success text-[10px]">Low Risk</span>
                  : <span className="badge-warning text-[10px]">Medium Risk</span>
                }
              </div>
            )}
            {mediumRisk && (
              <p className="text-[11px] text-warning-text mt-1.5">
                1–2 fiscal years active. Income capped at 50% across all banks until the 2nd full fiscal year completes.
              </p>
            )}
          </div>
        ) : (
          /* Manual entry — shown when ARES not verified or no date available */
          <div>
            <label htmlFor="companyExistenceMonths" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
              Total Months in Operation
            </label>
            <div className="relative">
              <input
                id="companyExistenceMonths"
                type="number"
                inputMode="numeric"
                min={0}
                value={companyExistenceMonths ?? ''}
                onChange={(e) => onChange('companyExistenceMonths', e.target.value === '' ? null : Math.round(Number(e.target.value)))}
                placeholder="e.g. 36"
                className={`input-field pr-20 tabular-nums${noHistory ? ' input-error' : ''}`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium">months</span>
            </div>
            {noHistory && (
              <p className="text-xs text-risk-text mt-1.5">
                Hard Block — minimum 12 months required. All Czech banks require at least one complete fiscal year under ESSO.
              </p>
            )}
            {mediumRisk && (
              <p className="text-[11px] text-warning-text mt-1.5">
                Medium Risk — 1–2 fiscal years. Income capped at 50% across all banks until 2nd full fiscal year completes.
              </p>
            )}
            {existMoV !== null && existMoV >= 24 && (
              <p className="text-[11px] text-success-text mt-1.5">Low Risk — 2+ fiscal years. Full ESSO income recognition available.</p>
            )}
            <p className="text-[10px] text-ink-subtle mt-1.5">
              Tip: Verify your company registration number above to auto-fill company age from the Czech Business Register.
            </p>
          </div>
        )}
      </div>

      {/* Eligibility callouts */}
      {hardBlock && (
        <div className="rounded-xl bg-risk-light border border-risk-border px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-risk-text mb-1">Hard Block — ESSO Assessment Failed</p>
              <p className="text-[11px] text-risk-text leading-relaxed">
                Your corporate financials do not currently meet the standard underwriting criteria
                for an owned-company income assessment. Continue to see your pre-score report and
                explore alternative pathways with your advisor.
              </p>
            </div>
          </div>
        </div>
      )}
      {mediumRisk && (
        <div className="rounded-xl bg-warning-light border border-warning-border px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-warning-DEFAULT flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-warning-text leading-relaxed">
              <strong>50% Income Cap applies.</strong> Due to current company risk rating, this income
              source is recognised up to 50% of your total borrowing capacity under Czech bank ESSO methodology.
            </p>
          </div>
        </div>
      )}

      {/* ── 3. Ownership Structure ────────────────────── */}
      <div>
        <p className="section-label mb-3">3. Ownership Structure</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
          <div>
            <label htmlFor="companyOwnershipPct" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
              Your Direct Ownership
              <span className="text-risk-DEFAULT ml-1">*</span>
            </label>
            <div className="relative">
              <input
                id="companyOwnershipPct"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={companyOwnershipPct ?? ''}
                onChange={(e) => onChange('companyOwnershipPct', e.target.value === '' ? null : Math.min(100, Math.max(0, Number(e.target.value))))}
                placeholder="e.g. 100"
                className="input-field pr-8 tabular-nums"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium">%</span>
            </div>
          </div>
          <div>
            <label htmlFor="familyOwnershipPctAggregate" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
              Family Aggregate Ownership
            </label>
            <div className="relative">
              <input
                id="familyOwnershipPctAggregate"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={familyOwnershipPctAggregate ?? ''}
                onChange={(e) => onChange('familyOwnershipPctAggregate', e.target.value === '' ? null : Math.min(100, Math.max(0, Number(e.target.value))))}
                placeholder="e.g. 0"
                className="input-field pr-8 tabular-nums"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium">%</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-ink-subtle mb-2 leading-relaxed">
          Family aggregate includes spouse, parents, and related-party holdings. Combined ≥ 20% triggers ESSO classification.
        </p>
        {ownPct > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {totalPct >= 20  && <span className="badge-warning text-[10px]">ESSO Classification ({totalPct}% combined)</span>}
            {fullAudit       && <span className="badge-risk text-[10px]">Full Audit &gt;50%</span>}
            {ownPct > 25 && ownPct <= 33 && <span className="badge-warning text-[10px]">ČSOB: 15% salary haircut (&gt;25%)</span>}
            {ownPct > 33     && <span className="badge-risk text-[10px]">UCB: 45 000 CZK salary cap (&gt;33%)</span>}
          </div>
        )}
      </div>

      {/* ── 4. Income Streams ─────────────────────────── */}
      <div>
        <p className="section-label mb-1">4. Income Streams</p>
        <p className="text-[11px] text-ink-muted mb-3">
          Select all income sources you receive from the company — each is scored per Czech bank methodology.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STREAM_OPTIONS.map(({ value: s, title, subtitle, desc, varNote }) => {
            const active = companyIncomeStream.includes(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStream(s)}
                className={[
                  'relative text-left rounded-xl border-2 px-4 py-3.5 transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
                  active ? 'border-brand-600 bg-brand-50' : 'border-border bg-card hover:border-border-strong',
                ].join(' ')}
              >
                {active && (
                  <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-brand-600 flex items-center justify-center">
                    <Check size={9} className="text-white" strokeWidth={3} />
                  </span>
                )}
                <p className={`text-xs font-bold mb-0.5 ${active ? 'text-brand-700' : 'text-ink'}`}>{title}</p>
                <p className={`text-[10px] font-semibold mb-1.5 ${active ? 'text-brand-600' : 'text-ink-muted'}`}>{subtitle}</p>
                <p className="text-[10px] text-ink-subtle leading-relaxed mb-2">{desc}</p>
                <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${active ? 'bg-brand-100 text-brand-700' : 'bg-surface text-ink-subtle'}`}>
                  {varNote}
                </span>
              </button>
            )
          })}
        </div>
        {!hasA && hasB && hasC && (
          <p className="text-[11px] text-warning-text mt-2">Stream B + C without Stream A is non-standard under Czech ESSO methodology — consider adding Stream A.</p>
        )}
      </div>

      {/* ── 5. Stream-specific income details ─────────── */}
      {(hasA || hasB || hasC) && (
        <div className="space-y-4">
          <p className="section-label">5. Income Details by Stream</p>

          {/* Stream A */}
          {hasA && (
            <div className="rounded-xl border-2 border-brand-200 bg-brand-50/60 p-4 space-y-3">
              <p className="text-xs font-bold text-brand-700">Stream A — Director Salary</p>
              <div>
                <label htmlFor="sroDirectorSalary" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
                  Net Monthly Director Salary (CZK)
                </label>
                <div className="relative">
                  <input
                    id="sroDirectorSalary"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={sroDirectorSalary ?? ''}
                    onChange={(e) => onChange('sroDirectorSalary', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="e.g. 60 000"
                    className="input-field pr-20 tabular-nums"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium whitespace-nowrap">CZK / mo</span>
                </div>
                {ownPct > 33
                  ? <p className="text-[11px] text-risk-text mt-1.5">UCB caps owner salary at <strong>45 000 CZK / mo</strong> for &gt;33% shareholders — income above this threshold is excluded.</p>
                  : ownPct > 25
                  ? <p className="text-[11px] text-ink-subtle mt-1.5">ČSOB applies a 15% haircut to director salary for &gt;25% ownership.</p>
                  : <p className="text-[11px] text-ink-subtle mt-1.5">Net take-home after personal income tax and social contributions.</p>
                }
              </div>
            </div>
          )}

          {/* Stream B */}
          {hasB && (
            <div className="rounded-xl border-2 border-brand-200 bg-brand-50/60 p-4 space-y-3">
              <p className="text-xs font-bold text-brand-700">Stream B — Profit Share / Dividends</p>
              <div>
                <label htmlFor="dividendsPaidLast3Years" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
                  Total Dividends Paid — Last 3 Fiscal Years (CZK)
                </label>
                <div className="relative">
                  <input
                    id="dividendsPaidLast3Years"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={dividendsPaidLast3Years ?? ''}
                    onChange={(e) => onChange('dividendsPaidLast3Years', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="e.g. 1 800 000"
                    className="input-field pr-24 tabular-nums"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium whitespace-nowrap">CZK / 3 yrs</span>
                </div>
                <p className="text-[11px] text-ink-subtle mt-1.5">Gross dividends distributed over 3 fiscal years. Used by UCB (÷36) and mBank (net 15% withholding, ÷36).</p>
              </div>
              {/* Per-bank methodology breakdown */}
              <div className="rounded-lg bg-white border border-brand-100 px-3 py-2.5">
                <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5">Per-bank Stream B methodology</p>
                <div className="space-y-1">
                  <p className="text-[11px] text-ink-muted"><span className="font-semibold text-ink">ČSOB:</span> (After-tax result × ownership%) ÷ 12 × 0.85</p>
                  <p className="text-[11px] text-ink-muted"><span className="font-semibold text-ink">mBank:</span> Dividends paid × 0.85 ÷ 36 mo (15% withholding deducted)</p>
                  <p className="text-[11px] text-ink-muted"><span className="font-semibold text-ink">UCB:</span> Dividends paid ÷ 36 mo (gross)</p>
                  <p className="text-[11px] text-ink-muted"><span className="font-semibold text-ink">ČS:</span> (After-tax result × ownership%) ÷ 12 × 0.80 (conservative)</p>
                </div>
              </div>
            </div>
          )}

          {/* Stream C */}
          {hasC && (
            <div className="rounded-xl border-2 border-brand-200 bg-brand-50/60 p-4 space-y-3">
              <p className="text-xs font-bold text-brand-700">Stream C — Director Fees</p>
              <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${directorContractExists ? 'bg-success-light border-success-border' : 'border-border bg-card'}`}>
                <div>
                  <p className={`text-xs font-medium ${directorContractExists ? 'text-success-text' : 'text-ink'}`}>
                    Signed Director's Service Agreement exists
                  </p>
                  <p className="text-[10px] text-ink-subtle mt-0.5">Director's Service Agreement — required by all banks</p>
                </div>
                <Toggle on={directorContractExists} onToggle={() => onChange('directorContractExists', !directorContractExists)} />
              </div>
              {!directorContractExists && (
                <p className="text-xs text-risk-text">Stream C income cannot be recognised without a signed Director's Service Agreement — all banks will exclude this source.</p>
              )}
              {directorContractExists && (
                <div>
                  <label htmlFor="sroDirectorFees" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
                    Monthly Director Fees (CZK)
                  </label>
                  <div className="relative">
                    <input
                      id="sroDirectorFees"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={sroDirectorFees ?? ''}
                      onChange={(e) => onChange('sroDirectorFees', e.target.value === '' ? null : Number(e.target.value))}
                      placeholder="e.g. 30 000"
                      className="input-field pr-20 tabular-nums"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium whitespace-nowrap">CZK / mo</span>
                  </div>
                  <p className="text-[11px] text-ink-subtle mt-1.5">Same bank haircuts apply as Stream A (ČSOB 15% for &gt;25%, UCB 45k cap for &gt;33%).</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 6. Company Revenue & Tax Details ─────────── */}
      <div>
        <p className="section-label mb-3">6. Company Revenue &amp; Tax Details</p>
        <div className="space-y-4">

          <div>
            <label htmlFor="annualGrossRevenues" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
              Annual Gross Revenues — Obrat (CZK)
            </label>
            <div className="relative">
              <input
                id="annualGrossRevenues"
                type="number"
                inputMode="numeric"
                min={0}
                value={annualGrossRevenues ?? ''}
                onChange={(e) => onChange('annualGrossRevenues', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="e.g. 6 000 000"
                className="input-field pr-24 tabular-nums"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium whitespace-nowrap">CZK / year</span>
            </div>
          </div>

          <div>
            <label htmlFor="avgMonthlyCreditTurnover_sro" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
              Avg. Monthly Credit Turnover (CZK)
            </label>
            <div className="relative">
              <input
                id="avgMonthlyCreditTurnover_sro"
                type="number"
                inputMode="numeric"
                min={0}
                value={avgMonthlyCreditTurnover ?? ''}
                onChange={(e) => onChange('avgMonthlyCreditTurnover', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="e.g. 500 000"
                className="input-field pr-28 tabular-nums"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium whitespace-nowrap">CZK / month</span>
            </div>
            <p className="text-[11px] text-ink-subtle mt-1">Average inbound business payments to the company account (last 6 months).</p>
          </div>

          {/* Tax regime */}
          <div>
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-2">Tax Filing Regime</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: 'tax_return', label: 'Standard Tax Return',   sublabel: 'Corporate or personal annual tax return' },
                { value: 'flat_tax',   label: 'Flat Tax Regime',       sublabel: 'Avg. monthly credit turnover — read from bank statements (last 3–6 months)' },
              ].map(({ value: v, label, sublabel }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onChange('taxRegime', v)}
                  className={[
                    'relative text-left rounded-xl border-2 px-4 py-3 transition-all duration-150',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
                    taxRegime === v ? 'border-brand-600 bg-brand-50' : 'border-border bg-card hover:border-border-strong',
                  ].join(' ')}
                >
                  {taxRegime === v && (
                    <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-brand-600 flex items-center justify-center">
                      <Check size={9} className="text-white" strokeWidth={3} />
                    </span>
                  )}
                  <p className={`text-xs font-bold mb-0.5 ${taxRegime === v ? 'text-brand-700' : 'text-ink'}`}>{label}</p>
                  <p className="text-[10px] text-ink-subtle">{sublabel}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Expense lump sum — tax_return only */}
          {taxRegime === 'tax_return' && (
            <div className="animate-fade-up">
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-2">
                Expense Lump Sum (%)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EXPENSE_LUMP_OPTIONS.map(({ value: v, label, desc }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onChange('expenseLumpSumPct', v)}
                    className={[
                      'relative text-left rounded-xl border-2 px-3 py-3 transition-all duration-150',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
                      expenseLumpSumPct === v ? 'border-brand-600 bg-brand-50' : 'border-border bg-card hover:border-border-strong',
                    ].join(' ')}
                  >
                    {expenseLumpSumPct === v && (
                      <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-brand-600 flex items-center justify-center">
                        <Check size={8} className="text-white" strokeWidth={3} />
                      </span>
                    )}
                    <p className={`text-sm font-bold mb-0.5 ${expenseLumpSumPct === v ? 'text-brand-700' : 'text-ink'}`}>{label}</p>
                    <p className="text-[9px] text-ink-subtle leading-tight">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}

function EmployeeDetails({ data, onChange }) {
  const {
    isProbation           = false,
    isNoticePeriod        = false,
    isOnSickLeave         = false,
    isEmployerDistressed  = false,
    contractType          = '',
    contractEndDate       = '',
    netMonthlySalary      = null,
    hasMonthlyDiety       = false,
    monthlyDiety          = null,
    hasFxIncome           = false,
    foreignSalaryAmount   = null,
    foreignSalaryCurrency = 'EUR',
    hasBonus              = false,
    bonusAmount           = null,
    bonusFrequency        = 'yearly',
  } = data

  const anyAdvisory    = isProbation || isNoticePeriod || isOnSickLeave || isEmployerDistressed

  const isContractExpiringSoon = (() => {
    if (contractType !== 'definite' || !contractEndDate) return false
    const now = new Date()
    const twoMo = new Date(now.getFullYear(), now.getMonth() + 2, 1)
    const threshold = twoMo.toISOString().slice(0, 7)
    return contractEndDate <= threshold
  })()

  return (
    <div className="mt-7 pt-7 border-t border-border space-y-5 animate-fade-up">

      {/* Methodology box */}
      <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">
        <p className="text-[11px] font-semibold text-brand-700 uppercase tracking-wide mb-2">
          How banks evaluate employees
        </p>
        <p className="text-xs text-brand-700 leading-relaxed">
          Current market-leading mortgage underwriting guidelines are applied to your net
          monthly take-home pay (after taxes and social deductions), contract type, tenure,
          and supplemental income components to compute your borrowing capacity across
          leading lending institutions simultaneously.
        </p>
      </div>

      {/* ── Eligibility gate ─────────────────────────────── */}
      <div>
        <label className="section-label mb-2 block">Initial Eligibility Check</label>
        <div className="space-y-2">
          {[
            { field: 'isProbation',          label: 'Currently in probation period'             },
            { field: 'isNoticePeriod',       label: 'Serving a notice period' },
            { field: 'isOnSickLeave',        label: 'Currently on extended sick leave'           },
            { field: 'isEmployerDistressed', label: 'Employer in insolvency or restructuring'    },
          ].map(({ field, label }) => {
            const active = !!data[field]
            return (
              <div key={field} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                <p className="text-xs font-medium text-ink">{label}</p>
                <Toggle on={active} onToggle={() => onChange(field, !active)} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Advisory — shown when any condition is active */}
      {anyAdvisory && (
        <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 animate-fade-up">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-brand-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-brand-700 mb-1">Advisory</p>
              <p className="text-[11px] text-brand-700 leading-relaxed">
                Important: Some lenders may view these conditions as non-standard. We recommend
                discussing these details during your free strategy call so we can assess your
                specific situation and find the right banking partner.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* ── Contract type ─────────────────────────────────── */}
      <div>
        <label className="section-label mb-2 block">Employment Contract Type</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CONTRACT_TYPES.map(({ value, label }) => (
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
              <p className={`text-xs font-bold ${contractType === value ? 'text-brand-700' : 'text-ink'}`}>{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Fixed-term end date ──────────────────────────── */}
      {contractType === 'definite' && (
        <div className="animate-fade-up">
          <label htmlFor="contractEndDate" className="section-label mb-2 block">
            Contract End Date
          </label>
          <input
            id="contractEndDate"
            type="month"
            value={contractEndDate}
            onChange={(e) => onChange('contractEndDate', e.target.value)}
            min={new Date().toISOString().slice(0, 7)}
            className="input-field"
          />
          {isContractExpiringSoon && (
            <div className="mt-3 rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 animate-fade-up">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-brand-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-brand-700 mb-1">Advisory — Contract Expiring Soon</p>
                  <p className="text-[11px] text-brand-700 leading-relaxed">
                    Your fixed-term contract ends within 2 months. Some lenders may request
                    evidence of renewal or an offer of extension. We recommend discussing this
                    during your free strategy call so we can identify the right banking partner
                    for your situation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
          Enter your clean monthly salary after taxes and social deductions. Do not include bonuses, 13th/14th salaries, or irregular income.
        </p>
      </div>

      {/* ── Monthly dietary allowance ────────────────────── */}
      <div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-ink">Receives monthly dietary allowance (diety)?</p>
            <p className="text-[11px] text-ink-subtle mt-0.5">Meal voucher or tax-exempt meal allowance</p>
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
          <div className="mt-2 animate-fade-up grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-2">
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

      {/* ── Bonus income ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-ink">Do you receive a bonus?</p>
            <p className="text-[11px] text-ink-subtle mt-0.5">Performance or contractual bonus income</p>
          </div>
          <Toggle
            on={hasBonus}
            onToggle={() => {
              onChange('hasBonus', !hasBonus)
              if (hasBonus) onChange('bonusAmount', null)
            }}
          />
        </div>
        {hasBonus && (
          <div className="mt-2 animate-fade-up grid grid-cols-[140px_1fr] gap-2">
            <select
              value={bonusFrequency}
              onChange={(e) => onChange('bonusFrequency', e.target.value)}
              className="select-field"
            >
              <option value="yearly">Yearly</option>
              <option value="monthly">Monthly</option>
            </select>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={bonusAmount ?? ''}
                onChange={(e) => onChange('bonusAmount', e.target.value === '' ? null : Number(e.target.value))}
                placeholder={bonusFrequency === 'yearly' ? 'e.g. 120 000' : 'e.g. 10 000'}
                className="input-field pr-20 tabular-nums"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium whitespace-nowrap">
                CZK / {bonusFrequency === 'yearly' ? 'yr' : 'mo'}
              </span>
            </div>
          </div>
        )}
        {hasBonus && Number(bonusAmount) > 0 && (() => {
          const monthly = bonusFrequency === 'yearly'
            ? Math.round(Number(bonusAmount) / 12)
            : Number(bonusAmount)
          return (
            <p className="text-[11px] text-ink-subtle mt-1.5">
              Recognised at 50% by most banks — equivalent to ~{Math.round(monthly * 0.5).toLocaleString('cs-CZ')} CZK/mo added to your assessed income.
            </p>
          )
        })()}
      </div>

    </div>
  )
}

// ── Main component ─────────────────────────────────────

export default function Step1EntityType({ value, onChange, onIcoResult, numberOfApplicants = 1, onApplicantCountChange, employeeData, onEmployeeChange, businessData, onBusinessChange, onContinue }) {
  const isEmployee = value === 'zamestnanec'
  const isOSVC     = value === 'osvc'
  const isSRODir   = value === 'sro'

  const icoVerified = !!businessData?.businessName && businessData?.icoActiveStatus === 'AKTIVNÍ'

  const canContinue = !!value && (
    !isEmployee || (
      (employeeData?.netMonthlySalary ?? 0) > 0
    )
  ) && (
    !isOSVC || (
      icoVerified &&
      !!businessData?.taxRegime && (
        (businessData.taxRegime === 'tax_return' && Number(businessData.annualTurnover           ?? 0) >= 1) ||
        (businessData.taxRegime === 'flat_tax'   && Number(businessData.annualTurnover ?? 0) >= 1)
      )
    )
  ) && (
    !isSRODir || (
      icoVerified &&
      businessData?.companyOwnershipPct !== null &&
      businessData?.companyOwnershipPct !== '' &&
      !!businessData?.companyIncomeStream
    )
  )

  return (
    <FunnelCard
      stepLabel="Step 1 of 4 · Income Profile"
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
      {/* Entity selection — 3-column on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ENTITY_OPTIONS.map((opt) =>
          opt.external ? (
            <a
              key={opt.value}
              href={opt.href}
              target="_blank"
              rel="noopener noreferrer"
              className="relative w-full text-left rounded-2xl border-2 border-border bg-card hover:border-border-strong hover:shadow-card-md p-6 transition-all duration-200 flex flex-col"
            >
              <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center mb-5">
                <opt.Icon size={22} className="text-ink-muted" />
              </div>
              <h3 className="font-display text-xl font-extrabold text-ink leading-tight mb-0.5">{opt.title}</h3>
              <p className="text-xs text-ink-muted mb-3">{opt.subtitle}</p>
              <p className="text-sm text-ink-muted leading-relaxed flex-1">{opt.desc}</p>
              <div className="pt-4 border-t border-border text-xs font-medium text-ink-subtle flex items-center gap-1.5 mt-5">
                <ExternalLink size={11} />
                {opt.note}
              </div>
            </a>
          ) : (
            <EntityCard
              key={opt.value}
              option={opt}
              selected={value === opt.value}
              onSelect={() => onChange(opt.value)}
            />
          )
        )}
      </div>

      {/* ── Number of applicants — applies to all income types ── */}
      <div className="mt-6 pt-6 border-t border-border">
        <p className="section-label mb-3 block">Number of applicants</p>
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          {[
            { n: 1, sub: 'Solo'  },
            { n: 2, sub: 'Joint' },
          ].map(({ n, sub }) => {
            const active = numberOfApplicants === n
            return (
              <button
                key={n}
                type="button"
                onClick={() => onApplicantCountChange(n)}
                className={[
                  'relative rounded-xl border-2 py-3.5 text-center transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
                  active ? 'border-brand-600 bg-brand-50' : 'border-border bg-card hover:border-border-strong',
                ].join(' ')}
              >
                {active && (
                  <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-brand-600 flex items-center justify-center">
                    <Check size={8} className="text-white" strokeWidth={3} />
                  </span>
                )}
                <span className={`font-display text-xl font-extrabold block ${active ? 'text-brand-700' : 'text-ink'}`}>{n}</span>
                <span className={`text-[10px] mt-0.5 block ${active ? 'text-brand-600' : 'text-ink-subtle'}`}>{sub}</span>
              </button>
            )
          })}
        </div>
        {numberOfApplicants > 1 && (
          <p className="text-[11px] text-ink-subtle mt-2 leading-relaxed">
            Joint applications combine incomes. Each applicant's documents and identity will be verified individually by the bank. Household living costs are factored into the DSTI calculation per applicant.
          </p>
        )}
        <p className="text-[11px] text-ink-subtle mt-3 leading-relaxed">
          <span className="font-semibold text-ink">Note:</span> If you are married, mortgage applications in Czechia generally require both spouses to be included as joint applicants.
        </p>
      </div>

      {/* IČO lookup — slides in below cards when OSVČ or s.r.o. is selected */}
      {(isOSVC || isSRODir) && (
        <IcoLookup
          entityType={value}
          onResult={(result) => {
            onIcoResult(result)
            if (result.entityType) onChange(result.entityType)
          }}
        />
      )}

      {/* OSVČ — tax regime + turnover */}
      {isOSVC && (
        <BusinessIncomeSection
          data={businessData ?? {}}
          onChange={onBusinessChange}
        />
      )}

      {/* s.r.o. Director — ESSO corporate income assessment */}
      {isSRODir && (
        <SroIncomeSection
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
