import { useRef, useState } from 'react'
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import FunnelCard from '../../funnel/FunnelCard.jsx'
import ActionBar  from '../../funnel/ActionBar.jsx'
import { mapNaceToSector, NACE_SECTOR_OPTIONS } from '../../../utils/scoringEngine.js'

const OSVC_FORMS = new Set(['101', '102', '103', '104', '105', '106', '107', '108', '109'])
const SRO_FORMS  = new Set(['112'])

function mapLegalForm(pravniForma) {
  if (OSVC_FORMS.has(pravniForma)) return 'osvc'
  if (SRO_FORMS.has(pravniForma))  return 'sro'
  return ''
}

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
  '112': 'Limited Liability Company',
  '121': 'Joint-Stock Company',
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

export default function IcoVerify({ entityType, onResult, businessData, onBack, onContinue }) {
  const [icoInput,        setIcoInput]        = useState(businessData?.ico || '')
  const [status,          setStatus]          = useState(businessData?.businessName && businessData?.icoActiveStatus === 'AKTIVNÍ' ? 'found' : 'idle')
  const [businessName,    setBusinessName]    = useState(businessData?.businessName || '')
  const [ageMonths,       setAgeMonths]       = useState(businessData?.businessAgeMonths ?? null)
  const [legalFormLabel,  setLegalFormLabel]  = useState(businessData?.legalFormLabel || '')
  const [resolvedType,    setResolvedType]    = useState('')
  const [activeStatus,    setActiveStatus]    = useState(businessData?.icoActiveStatus || '')
  const [naceSector,      setNaceSector]      = useState(businessData?.naceSector || '')
  const [nacePct,         setNacePct]         = useState(businessData?.turnoverIncomePct ?? null)
  const [primaryNace,     setPrimaryNace]     = useState(businessData?.primaryNace || '')
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
    if (icoInput.length < 8 || status === 'loading') return

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
        const icoStatus    = data.stavEkonSubjektu ?? 'AKTIVNÍ'
        const gap = icoStatus === 'POZASTAVENÝ' || !!data.datumZaniku

        const rawNace  = (data.czNace ?? [])[0] ?? ''
        const { pct: nPct, sector: nSector } = mapNaceToSector(rawNace)

        setBusinessName(name)
        setAgeMonths(months)
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

  const canVerify = icoInput.length >= 8 && status !== 'loading'
  const hasResult = status === 'found' || status === 'inactive'
  const icoVerified = status === 'found'

  return (
    <FunnelCard
      title={entityType === 'osvc' ? 'Verify your trade license (ICO)' : 'Verify your company registration (ICO)'}
      subtitle="We auto-populate company details via the Czech Business Register (ARES)."
      footer={<ActionBar canContinue={icoVerified} onBack={onBack} onContinue={onContinue} />}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="ico" className="section-label mb-2 block">
            {entityType === 'osvc' ? 'Trade License Number (ICO)' : 'Company Registration Number (ICO)'}
          </label>
          {/* Mobile: stack input and button; desktop: inline */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                id="ico"
                type="text"
                inputMode="numeric"
                value={icoInput}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 12345678"
                maxLength={12}
                className="input-field pr-11 tabular-nums tracking-widest w-full text-base"
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
                'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap min-h-[48px] sm:min-h-0',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze/40',
                canVerify
                  ? 'bg-ink text-white hover:bg-dark-800 active:bg-dark-700 shadow-sm'
                  : 'bg-surface text-ink-subtle border border-border cursor-not-allowed',
              ].join(' ')}
            >
              {status === 'loading'
                ? <><Loader2 size={14} className="animate-spin" /> Verifying...</>
                : 'Verify'
              }
            </button>
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-1.5 mt-2">
              <XCircle size={12} className="text-risk-DEFAULT flex-shrink-0" />
              <p className="text-xs text-risk-text">Company not found. Check the registration number and try again.</p>
            </div>
          )}
        </div>

        {hasResult && (
          <div className="space-y-3 animate-fade-up">
            {status === 'inactive' ? (
              <div className="flex items-start gap-3 rounded-xl bg-warning-light border border-warning-border px-4 py-3">
                <AlertTriangle size={16} className="text-warning-DEFAULT flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-warning-text leading-snug truncate">{businessName}</p>
                  <p className="text-[11px] text-warning-text mt-0.5">
                    Registration not currently active ({activeStatus}).
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl bg-success-light border border-success-border px-4 py-3">
                <CheckCircle size={18} className="text-success-DEFAULT flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-success-text leading-snug truncate">{businessName}</p>
                  <p className="text-[10px] text-success-text/80 mt-0.5">
                    Active — Verified via ARES
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
              <span className="flex-1 text-sm font-medium text-ink leading-snug">{legalFormLabel}</span>
            </div>

            {ageMonths !== null && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
                <span className="text-xs text-ink-muted">Registered</span>
                <span className="text-xs font-semibold text-ink">{formatAge(ageMonths)}</span>
              </div>
            )}

            {resolvedType === 'osvc' && naceSector && (
              <div className="rounded-xl border border-border bg-surface px-4 py-3">
                <span className="text-xs text-ink-muted block mb-0.5">Business sector (NACE)</span>
                <span className="text-xs font-semibold text-ink">{naceSector}</span>
                {nacePct !== null && (
                  <span className="text-[11px] text-ink-subtle ml-2">({nacePct}% income recognition)</span>
                )}
              </div>
            )}

            {resolvedType === 'osvc' && status === 'found' && nacePct === null && (
              <div className="rounded-xl border border-warning-border bg-warning-light px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-warning-text">
                  Activity not recognised automatically. Select your industry:
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
                  <option value="">Select your business sector...</option>
                  {NACE_SECTOR_OPTIONS.map((o) => (
                    <option key={o.sector} value={o.sector}>{o.sector} — {o.pct}% income recognition</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    </FunnelCard>
  )
}
