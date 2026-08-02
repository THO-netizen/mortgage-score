import { useState } from 'react'
import { Check, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import FunnelCard from '../../funnel/FunnelCard.jsx'
import ActionBar  from '../../funnel/ActionBar.jsx'

function formatAge(months) {
  if (months === null) return ''
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0) return `${m} month${m !== 1 ? 's' : ''}`
  if (m === 0) return `${y} year${y !== 1 ? 's' : ''}`
  return `${y} yr ${m} mo`
}

const TAX_REGIME_OPTIONS = [
  {
    value:    'tax_return',
    label:    'Standard Tax Return',
    sublabel: 'DAP',
    desc:     'Annual personal tax return',
  },
  {
    value:    'flat_tax',
    label:    'Flat Tax Regime',
    sublabel: 'Pausalni dan',
    desc:     'Income from bank turnover',
  },
]

export default function BusinessIncome({ data, onChange, onBack, onContinue }) {
  const {
    taxRegime                = '',
    annualTurnover           = null,
    avgMonthlyCreditTurnover = null,
    businessName             = '',
    datumVzniku              = '',
    companyExistenceMonths   = null,
    icoActiveStatus          = '',
    naceSector               = '',
    turnoverIncomePct        = null,
  } = data

  const [turnoverTouched, setTurnoverTouched] = useState(false)

  const handleRegimeChange = (newRegime) => {
    onChange('taxRegime', newRegime)
    setTurnoverTouched(false)
  }

  const turnoverError = turnoverTouched && !!taxRegime && !(Number(annualTurnover) >= 1)

  const aresVerified    = !!businessName && !!datumVzniku
  const isInactive      = aresVerified && icoActiveStatus && icoActiveStatus !== 'AKTIVNÍ'
  const existMo         = companyExistenceMonths !== null ? Number(companyExistenceMonths) : null
  const aresAgeResolved = aresVerified && existMo !== null

  const canContinue = !!taxRegime && (
    (taxRegime === 'tax_return' && Number(annualTurnover ?? 0) >= 1) ||
    (taxRegime === 'flat_tax'   && Number(annualTurnover ?? 0) >= 1)
  )

  return (
    <FunnelCard
      title="How do you file your business income?"
      subtitle="Select your tax regime and enter your annual turnover."
      footer={<ActionBar canContinue={canContinue} onBack={onBack} onContinue={onContinue} />}
    >
      <div className="space-y-5">

        {/* ARES identity block */}
        {aresVerified && (
          <div className="space-y-3">
            {isInactive ? (
              <div className="flex items-start gap-3 rounded-xl bg-risk-light border border-risk-border px-4 py-3">
                <XCircle size={15} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-risk-text mb-0.5">{businessName}</p>
                  <p className="text-[11px] text-risk-text leading-relaxed">
                    Registration not currently active ({icoActiveStatus}).
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl bg-success-light border border-success-border px-4 py-3">
                <CheckCircle size={15} className="text-success-DEFAULT flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-success-text truncate">{businessName}</p>
                  <p className="text-[10px] text-success-text/80 mt-0.5">Verified via ARES</p>
                </div>
              </div>
            )}

            {aresAgeResolved && !isInactive && (
              existMo < 12 ? (
                <div className="flex items-start gap-3 rounded-xl bg-risk-light border border-risk-border px-4 py-3">
                  <AlertTriangle size={14} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-risk-text mb-0.5">Insufficient Business History</p>
                    <p className="text-[11px] text-risk-text leading-relaxed">
                      Active for <strong>{formatAge(existMo)}</strong>. Minimum 12 months required.
                    </p>
                  </div>
                </div>
              ) : existMo < 24 ? (
                <div className="flex items-center gap-2 rounded-xl border border-warning-border bg-warning-light px-4 py-3">
                  <AlertTriangle size={13} className="text-warning-DEFAULT flex-shrink-0" />
                  <span className="text-xs font-semibold text-warning-text">
                    Active for {formatAge(existMo)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-success-border bg-success-light px-4 py-3">
                  <CheckCircle size={13} className="text-success-DEFAULT flex-shrink-0" />
                  <span className="text-xs font-semibold text-success-text">
                    Active for {formatAge(existMo)}
                  </span>
                </div>
              )
            )}
          </div>
        )}

        {/* Tax regime selector — 2-col grid */}
        <div>
          <label className="section-label mb-2 block">
            Tax filing regime
            <span className="text-risk-DEFAULT ml-1">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {TAX_REGIME_OPTIONS.map(({ value, label, sublabel, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleRegimeChange(value)}
                className={[
                  'relative text-left rounded-xl border-2 px-3.5 py-3 transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze/40',
                  taxRegime === value
                    ? 'border-ink bg-surface'
                    : 'border-border bg-card hover:border-border-strong active:border-ink/30',
                ].join(' ')}
              >
                {taxRegime === value && (
                  <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-ink flex items-center justify-center">
                    <Check size={8} className="text-white" strokeWidth={3} />
                  </span>
                )}
                <p className={`text-xs font-bold mb-0.5 ${taxRegime === value ? 'text-ink' : 'text-ink'}`}>
                  {label}
                </p>
                <p className="text-[10px] text-ink-subtle leading-relaxed">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Standard tax return -> Gross Annual Turnover */}
        {taxRegime === 'tax_return' && (
          <div className="animate-fade-up">
            <label htmlFor="annualTurnover" className="section-label mb-1.5 block">
              Gross Annual Turnover (Obrat)
              <span className="text-risk-DEFAULT ml-1">*</span>
            </label>
            <div className="relative">
              <input
                id="annualTurnover"
                type="text"
                inputMode="numeric"
                value={annualTurnover ?? ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, '')
                  onChange('annualTurnover', raw === '' ? null : Math.round(Number(raw)))
                }}
                onBlur={() => setTurnoverTouched(true)}
                placeholder="e.g. 2 400 000"
                className={`input-field pr-24 tabular-nums text-base${turnoverError ? ' input-error' : ''}`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium whitespace-nowrap">
                CZK / year
              </span>
            </div>
            {turnoverError ? (
              <p className="text-xs text-risk-text mt-1.5">
                Required — enter your gross annual business turnover.
              </p>
            ) : (
              <p className="text-[11px] text-ink-subtle mt-1.5 leading-relaxed">
                Total declared revenues from your last Tax Return (DAP).
              </p>
            )}
          </div>
        )}

        {/* Flat tax -> Annual Turnover + NACE income estimate */}
        {taxRegime === 'flat_tax' && (
          <div className="animate-fade-up">
            <label htmlFor="annualTurnoverFlat" className="section-label mb-1.5 block">
              Gross Annual Turnover (Obrat)
              <span className="text-risk-DEFAULT ml-1">*</span>
            </label>
            <div className="relative">
              <input
                id="annualTurnoverFlat"
                type="text"
                inputMode="numeric"
                value={annualTurnover ?? ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, '')
                  onChange('annualTurnover', raw === '' ? null : Math.round(Number(raw)))
                }}
                onBlur={() => setTurnoverTouched(true)}
                placeholder="e.g. 2 400 000"
                className={`input-field pr-24 tabular-nums text-base${turnoverError ? ' input-error' : ''}`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium whitespace-nowrap">
                CZK / year
              </span>
            </div>
            {turnoverError ? (
              <p className="text-xs text-risk-text mt-1.5">
                Required — enter your gross annual business turnover.
              </p>
            ) : (
              <p className="text-[11px] text-ink-subtle mt-1.5 leading-relaxed">
                Total gross annual revenues. Income is calculated using your NACE sector expense ratio.
              </p>
            )}

            {Number(annualTurnover) >= 1 && turnoverIncomePct !== null && (
              <div className="mt-3 rounded-xl bg-surface border border-border p-4 animate-fade-up">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-ink uppercase tracking-wide">
                    Estimated Recognised Income
                  </p>
                  <span className="badge-success text-[10px]">{turnoverIncomePct}% of turnover</span>
                </div>
                {naceSector && (
                  <p className="text-[11px] text-bronze mb-2">{naceSector}</p>
                )}
                <p className="font-display text-xl sm:text-2xl font-black text-ink tabular-nums">
                  {Math.round(Number(annualTurnover) * turnoverIncomePct / 100 / 12).toLocaleString('cs-CZ')}
                  <span className="text-sm font-semibold text-bronze ml-1.5">CZK / month</span>
                </p>
                <p className="text-[10px] text-bronze mt-1">
                  {Number(annualTurnover).toLocaleString('cs-CZ')} x {turnoverIncomePct}% / 12
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </FunnelCard>
  )
}
