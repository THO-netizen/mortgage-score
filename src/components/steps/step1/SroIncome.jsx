import { useState } from 'react'
import { Building2, Check, CheckCircle, AlertTriangle } from 'lucide-react'
import FunnelCard from '../../funnel/FunnelCard.jsx'
import ActionBar  from '../../funnel/ActionBar.jsx'
import { Toggle, STREAM_OPTIONS, EXPENSE_LUMP_OPTIONS } from './shared.jsx'

function formatAge(months) {
  if (months === null) return ''
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0) return `${m} month${m !== 1 ? 's' : ''}`
  if (m === 0) return `${y} year${y !== 1 ? 's' : ''}`
  return `${y} yr ${m} mo`
}

export default function SroIncome({ data, onChange, onBack, onContinue }) {
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
    businessName                 = '',
    datumVzniku                  = '',
  } = data

  const aresVerified = !!businessName && !!datumVzniku

  const hasA = companyIncomeStream.includes('A')
  const hasB = companyIncomeStream.includes('B')
  const hasC = companyIncomeStream.includes('C')

  const toggleStream = (s) => {
    const active = new Set([...companyIncomeStream].filter(c => ['A', 'B', 'C'].includes(c)))
    if (active.has(s)) active.delete(s)
    else               active.add(s)
    onChange('companyIncomeStream', ['A', 'B', 'C'].filter(c => active.has(c)).join(''))
  }

  const equityVal  = companyEquity          !== null ? Number(companyEquity)          : null
  const afterTaxV  = companyAfterTaxResult  !== null ? Number(companyAfterTaxResult)  : null
  const existMoV   = companyExistenceMonths !== null ? Number(companyExistenceMonths) : null

  const negEquity  = equityVal !== null && equityVal < 0
  const negPnL     = afterTaxV !== null && afterTaxV < 0
  const noHistory  = existMoV  !== null && existMoV < 12
  const hardBlock  = negEquity || negPnL || noHistory
  const mediumRisk = !hardBlock && existMoV !== null && existMoV >= 12 && existMoV < 24

  const ownPct     = Number(companyOwnershipPct          ?? 0)
  const famPct     = Number(familyOwnershipPctAggregate  ?? 0)
  const totalPct   = ownPct + famPct
  const fullAudit  = ownPct > 50

  const canContinue = companyOwnershipPct !== null && companyOwnershipPct !== '' && !!companyIncomeStream

  return (
    <FunnelCard
      title="Tell us about your company income"
      subtitle="Enter ownership, financials, and income streams for ESSO methodology."
      hint="Czech banks assess s.r.o. directors via ESSO — a stricter audit requiring financials and ownership verification."
      footer={<ActionBar canContinue={canContinue} onBack={onBack} onContinue={onContinue} />}
    >
      <div className="space-y-6">

        {/* ARES verified banner */}
        {aresVerified && (
          <div className="flex items-center gap-3 rounded-xl bg-success-light border border-success-border px-4 py-3">
            <CheckCircle size={16} className="text-success-DEFAULT flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-success-text leading-snug truncate">{businessName}</p>
              <p className="text-[10px] text-success-text/80 mt-0.5">Verified via ARES</p>
            </div>
          </div>
        )}

        {/* 1. Corporate Financial Health */}
        <div>
          <p className="section-label mb-3 block">1. Financial Health</p>
          <div className="space-y-3">
            <div>
              <label htmlFor="companyEquity" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
                Company Net Equity (CZK)
              </label>
              <div className="relative">
                <input
                  id="companyEquity"
                  type="text"
                  inputMode="numeric"
                  value={companyEquity ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d-]/g, '')
                    onChange('companyEquity', raw === '' || raw === '-' ? null : Number(raw))
                  }}
                  placeholder="e.g. 2 500 000"
                  className={`input-field pr-28 tabular-nums text-base${negEquity ? ' input-error' : ''}`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium whitespace-nowrap">CZK</span>
              </div>
              {negEquity
                ? <p className="text-xs text-risk-text mt-1">Negative equity prevents ESSO income recognition.</p>
                : equityVal !== null && <p className="text-[11px] text-success-text mt-1">Positive equity — passed.</p>
              }
            </div>

            <div>
              <label htmlFor="companyAfterTaxResult" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
                After-Tax Net Result (CZK)
              </label>
              <div className="relative">
                <input
                  id="companyAfterTaxResult"
                  type="text"
                  inputMode="numeric"
                  value={companyAfterTaxResult ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d-]/g, '')
                    onChange('companyAfterTaxResult', raw === '' || raw === '-' ? null : Number(raw))
                  }}
                  placeholder="e.g. 800 000"
                  className={`input-field pr-24 tabular-nums text-base${negPnL ? ' input-error' : ''}`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium whitespace-nowrap">CZK / yr</span>
              </div>
              {negPnL
                ? <p className="text-xs text-risk-text mt-1">Net loss prevents ESSO income recognition.</p>
                : <p className="text-[11px] text-ink-subtle mt-1">Net profit after corporate tax.</p>
              }
            </div>
          </div>
        </div>

        {/* 2. Company History */}
        <div>
          <p className="section-label mb-1.5">2. Company History</p>

          {aresVerified && existMoV !== null ? (
            <div>
              {existMoV < 12 ? (
                <div className="rounded-xl bg-risk-light border border-risk-border px-4 py-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-risk-text leading-relaxed">
                      Active for <strong>{formatAge(existMoV)}</strong>. Minimum 12 months required.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-success-border bg-success-light px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-success-DEFAULT flex-shrink-0" />
                    <span className="text-xs font-semibold text-success-text">
                      Active for {formatAge(existMoV)}
                    </span>
                  </div>
                  {existMoV >= 24
                    ? <span className="badge-success text-[10px]">Low Risk</span>
                    : <span className="badge-warning text-[10px]">Medium</span>
                  }
                </div>
              )}
              {mediumRisk && (
                <p className="text-[11px] text-warning-text mt-1.5">
                  Income capped at 50% until 2nd full fiscal year.
                </p>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="companyExistenceMonths" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
                Total Months in Operation
              </label>
              <div className="relative">
                <input
                  id="companyExistenceMonths"
                  type="text"
                  inputMode="numeric"
                  min={0}
                  value={companyExistenceMonths ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '')
                    onChange('companyExistenceMonths', raw === '' ? null : Math.round(Number(raw)))
                  }}
                  placeholder="e.g. 36"
                  className={`input-field pr-20 tabular-nums text-base${noHistory ? ' input-error' : ''}`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium">months</span>
              </div>
              {noHistory && <p className="text-xs text-risk-text mt-1.5">Minimum 12 months required.</p>}
              {mediumRisk && <p className="text-[11px] text-warning-text mt-1.5">Income capped at 50%.</p>}
              {existMoV !== null && existMoV >= 24 && <p className="text-[11px] text-success-text mt-1.5">2+ fiscal years — full recognition.</p>}
            </div>
          )}
        </div>

        {/* Hard block callout */}
        {hardBlock && (
          <div className="rounded-xl bg-risk-light border border-risk-border px-4 py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
              <p className="text-xs text-risk-text leading-relaxed">
                <strong>ESSO Assessment Failed</strong> — continue to see your pre-score report and explore alternatives.
              </p>
            </div>
          </div>
        )}

        {/* 3. Ownership Structure */}
        <div>
          <p className="section-label mb-3">3. Ownership</p>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <label htmlFor="companyOwnershipPct" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
                Your Ownership
                <span className="text-risk-DEFAULT ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  id="companyOwnershipPct"
                  type="text"
                  inputMode="numeric"
                  value={companyOwnershipPct ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '')
                    onChange('companyOwnershipPct', raw === '' ? null : Math.min(100, Math.max(0, Number(raw))))
                  }}
                  placeholder="e.g. 100"
                  className="input-field pr-8 tabular-nums text-base"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium">%</span>
              </div>
            </div>
            <div>
              <label htmlFor="familyOwnershipPctAggregate" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
                Family Aggregate
              </label>
              <div className="relative">
                <input
                  id="familyOwnershipPctAggregate"
                  type="text"
                  inputMode="numeric"
                  value={familyOwnershipPctAggregate ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '')
                    onChange('familyOwnershipPctAggregate', raw === '' ? null : Math.min(100, Math.max(0, Number(raw))))
                  }}
                  placeholder="e.g. 0"
                  className="input-field pr-8 tabular-nums text-base"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium">%</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-ink-subtle mb-2 leading-relaxed">
            Combined ownership {'>'}= 20% triggers ESSO classification.
          </p>
          {ownPct > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {totalPct >= 20  && <span className="badge-warning text-[10px]">ESSO ({totalPct}%)</span>}
              {fullAudit       && <span className="badge-risk text-[10px]">Full Audit &gt;50%</span>}
            </div>
          )}
        </div>

        {/* 4. Income Streams */}
        <div>
          <p className="section-label mb-1">4. Income Streams</p>
          <p className="text-[11px] text-ink-muted mb-3">
            Select all income sources you receive from the company.
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
                    'relative text-left rounded-xl border-2 px-3.5 py-3 transition-all duration-150',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
                    active ? 'border-brand-600 bg-brand-50' : 'border-border bg-card hover:border-border-strong active:border-brand-300',
                  ].join(' ')}
                >
                  {active && (
                    <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-brand-600 flex items-center justify-center">
                      <Check size={8} className="text-white" strokeWidth={3} />
                    </span>
                  )}
                  <p className={`text-xs font-bold mb-0.5 ${active ? 'text-brand-700' : 'text-ink'}`}>{title}</p>
                  <p className={`text-[10px] font-semibold mb-1 ${active ? 'text-brand-600' : 'text-ink-muted'}`}>{subtitle}</p>
                  <p className="text-[10px] text-ink-subtle leading-relaxed">{desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* 5. Stream-specific income details */}
        {(hasA || hasB || hasC) && (
          <div className="space-y-4">
            <p className="section-label">5. Income Details</p>

            {hasA && (
              <div className="rounded-xl border-2 border-brand-200 bg-brand-50/60 p-4 space-y-3">
                <p className="text-xs font-bold text-brand-700">Stream A — Director Salary</p>
                <div>
                  <label htmlFor="sroDirectorSalary" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
                    Net Monthly Salary (CZK)
                  </label>
                  <div className="relative">
                    <input
                      id="sroDirectorSalary"
                      type="text"
                      inputMode="numeric"
                      value={sroDirectorSalary ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '')
                        onChange('sroDirectorSalary', raw === '' ? null : Number(raw))
                      }}
                      placeholder="e.g. 60 000"
                      className="input-field pr-20 tabular-nums text-base"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium whitespace-nowrap">CZK / mo</span>
                  </div>
                  {ownPct > 33
                    ? <p className="text-[11px] text-risk-text mt-1.5">UCB caps at <strong>45 000 CZK/mo</strong> for &gt;33% shareholders.</p>
                    : <p className="text-[11px] text-ink-subtle mt-1.5">Net take-home after tax and social contributions.</p>
                  }
                </div>
              </div>
            )}

            {hasB && (
              <div className="rounded-xl border-2 border-brand-200 bg-brand-50/60 p-4 space-y-3">
                <p className="text-xs font-bold text-brand-700">Stream B — Dividends</p>
                <div>
                  <label htmlFor="dividendsPaidLast3Years" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
                    Total Dividends — Last 3 Years (CZK)
                  </label>
                  <div className="relative">
                    <input
                      id="dividendsPaidLast3Years"
                      type="text"
                      inputMode="numeric"
                      value={dividendsPaidLast3Years ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '')
                        onChange('dividendsPaidLast3Years', raw === '' ? null : Number(raw))
                      }}
                      placeholder="e.g. 1 800 000"
                      className="input-field pr-24 tabular-nums text-base"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium whitespace-nowrap">CZK / 3 yrs</span>
                  </div>
                  <p className="text-[11px] text-ink-subtle mt-1.5">Gross dividends distributed over 3 fiscal years.</p>
                </div>
              </div>
            )}

            {hasC && (
              <div className="rounded-xl border-2 border-brand-200 bg-brand-50/60 p-4 space-y-3">
                <p className="text-xs font-bold text-brand-700">Stream C — Director Fees</p>
                <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${directorContractExists ? 'bg-success-light border-success-border' : 'border-border bg-card'}`}>
                  <p className={`text-xs font-medium ${directorContractExists ? 'text-success-text' : 'text-ink'}`}>
                    Signed Director Agreement exists
                  </p>
                  <Toggle on={directorContractExists} onToggle={() => onChange('directorContractExists', !directorContractExists)} />
                </div>
                {!directorContractExists && (
                  <p className="text-xs text-risk-text">Required for Stream C recognition.</p>
                )}
                {directorContractExists && (
                  <div>
                    <label htmlFor="sroDirectorFees" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
                      Monthly Director Fees (CZK)
                    </label>
                    <div className="relative">
                      <input
                        id="sroDirectorFees"
                        type="text"
                        inputMode="numeric"
                        value={sroDirectorFees ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^\d]/g, '')
                          onChange('sroDirectorFees', raw === '' ? null : Number(raw))
                        }}
                        placeholder="e.g. 30 000"
                        className="input-field pr-20 tabular-nums text-base"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium whitespace-nowrap">CZK / mo</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 6. Company Revenue & Tax Details */}
        <div>
          <p className="section-label mb-3">6. Revenue &amp; Tax</p>
          <div className="space-y-4">

            <div>
              <label htmlFor="annualGrossRevenues" className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
                Annual Gross Revenues (CZK)
              </label>
              <div className="relative">
                <input
                  id="annualGrossRevenues"
                  type="text"
                  inputMode="numeric"
                  value={annualGrossRevenues ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '')
                    onChange('annualGrossRevenues', raw === '' ? null : Number(raw))
                  }}
                  placeholder="e.g. 6 000 000"
                  className="input-field pr-24 tabular-nums text-base"
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
                  type="text"
                  inputMode="numeric"
                  value={avgMonthlyCreditTurnover ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '')
                    onChange('avgMonthlyCreditTurnover', raw === '' ? null : Number(raw))
                  }}
                  placeholder="e.g. 500 000"
                  className="input-field pr-28 tabular-nums text-base"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium whitespace-nowrap">CZK / mo</span>
              </div>
              <p className="text-[11px] text-ink-subtle mt-1">Average inbound payments (last 6 months).</p>
            </div>

            {/* Tax regime */}
            <div>
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-2">Tax Filing Regime</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'tax_return', label: 'Standard Tax Return' },
                  { value: 'flat_tax',   label: 'Flat Tax / Turnover' },
                ].map(({ value: v, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onChange('taxRegime', v)}
                    className={[
                      'relative text-left rounded-xl border-2 px-3.5 py-3 transition-all duration-150',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
                      taxRegime === v ? 'border-brand-600 bg-brand-50' : 'border-border bg-card hover:border-border-strong active:border-brand-300',
                    ].join(' ')}
                  >
                    {taxRegime === v && (
                      <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-brand-600 flex items-center justify-center">
                        <Check size={8} className="text-white" strokeWidth={3} />
                      </span>
                    )}
                    <p className={`text-xs font-bold ${taxRegime === v ? 'text-brand-700' : 'text-ink'}`}>{label}</p>
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
                        expenseLumpSumPct === v ? 'border-brand-600 bg-brand-50' : 'border-border bg-card hover:border-border-strong active:border-brand-300',
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
    </FunnelCard>
  )
}
