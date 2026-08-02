import { useState } from 'react'
import { AlertTriangle, Check, ChevronDown } from 'lucide-react'
import FunnelCard from '../../funnel/FunnelCard.jsx'
import ActionBar  from '../../funnel/ActionBar.jsx'
import { Toggle, CONTRACT_TYPES } from './shared.jsx'

export default function EmployeeDetails({ data, onChange, onBack, onContinue }) {
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

  const [showExtras, setShowExtras] = useState(hasMonthlyDiety || hasFxIncome || hasBonus)

  const anyAdvisory = isProbation || isNoticePeriod || isOnSickLeave || isEmployerDistressed

  const isContractExpiringSoon = (() => {
    if (contractType !== 'definite' || !contractEndDate) return false
    const now = new Date()
    const twoMo = new Date(now.getFullYear(), now.getMonth() + 2, 1)
    const threshold = twoMo.toISOString().slice(0, 7)
    return contractEndDate <= threshold
  })()

  const canContinue = (netMonthlySalary ?? 0) > 0

  return (
    <FunnelCard
      title="Tell us about your employment"
      subtitle="Your contract type and base salary determine your core borrowing capacity."
      footer={<ActionBar canContinue={canContinue} onBack={onBack} onContinue={onContinue} />}
    >
      <div className="space-y-5">

        {/* Eligibility gate — compact toggles */}
        <div>
          <label className="section-label mb-2 block">Eligibility Check</label>
          <div className="space-y-2">
            {[
              { field: 'isProbation',          label: 'Currently in probation period' },
              { field: 'isNoticePeriod',       label: 'Serving a notice period' },
              { field: 'isOnSickLeave',        label: 'On extended sick leave' },
              { field: 'isEmployerDistressed', label: 'Employer in insolvency' },
            ].map(({ field, label }) => {
              const active = !!data[field]
              return (
                <div key={field} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <p className="text-xs font-medium text-ink pr-2">{label}</p>
                  <Toggle on={active} onToggle={() => onChange(field, !active)} />
                </div>
              )
            })}
          </div>
        </div>

        {anyAdvisory && (
          <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 animate-fade-up">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-brand-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-brand-700 leading-relaxed">
                Some lenders may view these conditions as non-standard. We recommend discussing during your free strategy call.
              </p>
            </div>
          </div>
        )}

        {/* Contract type — 2-col grid */}
        <div>
          <label className="section-label mb-2 block">Contract Type</label>
          <div className="grid grid-cols-2 gap-2.5">
            {CONTRACT_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange('contractType', value)}
                className={[
                  'relative text-left rounded-xl border-2 px-3.5 py-3 transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
                  contractType === value
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-border bg-card hover:border-border-strong active:border-brand-300',
                ].join(' ')}
              >
                {contractType === value && (
                  <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-brand-600 flex items-center justify-center">
                    <Check size={8} className="text-white" strokeWidth={3} />
                  </span>
                )}
                <p className={`text-xs font-bold leading-tight ${contractType === value ? 'text-brand-700' : 'text-ink'}`}>{label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Fixed-term end date */}
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
                  <p className="text-xs text-brand-700 leading-relaxed">
                    Contract expires within 2 months. Some lenders may request evidence of renewal.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Net monthly salary */}
        <div>
          <label htmlFor="netMonthlySalary" className="section-label mb-2 block">
            Net Monthly Salary (CZK)
            <span className="text-risk-DEFAULT ml-1">*</span>
          </label>
          <div className="relative">
            <input
              id="netMonthlySalary"
              type="text"
              inputMode="numeric"
              value={netMonthlySalary ?? ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, '')
                onChange('netMonthlySalary', raw === '' ? null : Number(raw))
              }}
              placeholder="e.g. 55 000"
              className="input-field pr-16 tabular-nums text-base"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium">
              CZK / mo
            </span>
          </div>
          <p className="text-[11px] text-ink-subtle mt-1.5">
            After taxes and social deductions. Do not include bonuses.
          </p>
        </div>

        {/* Expandable additional income section */}
        <div>
          <button
            type="button"
            onClick={() => setShowExtras(!showExtras)}
            className="flex items-center gap-2 text-xs font-semibold text-brand-600 py-2"
          >
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${showExtras ? 'rotate-180' : ''}`}
            />
            Additional income (dietary, FX, bonus)
          </button>

          {showExtras && (
            <div className="space-y-4 mt-2 animate-fade-up">

              {/* Monthly dietary allowance */}
              <div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-ink">Monthly dietary allowance?</p>
                    <p className="text-[11px] text-ink-subtle mt-0.5">Meal vouchers or tax-exempt allowance</p>
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
                      type="text"
                      inputMode="numeric"
                      value={monthlyDiety ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '')
                        onChange('monthlyDiety', raw === '' ? null : Number(raw))
                      }}
                      placeholder="e.g. 3 500"
                      className="input-field pr-20 tabular-nums text-base"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium">
                      CZK / mo
                    </span>
                  </div>
                )}
              </div>

              {/* FX salary component */}
              <div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-ink">Foreign currency salary?</p>
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
                  <div className="mt-2 animate-fade-up grid grid-cols-[100px_1fr] gap-2">
                    <select
                      value={foreignSalaryCurrency}
                      onChange={(e) => onChange('foreignSalaryCurrency', e.target.value)}
                      className="select-field text-base"
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                      <option value="CHF">CHF</option>
                    </select>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={foreignSalaryAmount ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^\d]/g, '')
                          onChange('foreignSalaryAmount', raw === '' ? null : Number(raw))
                        }}
                        placeholder="Amount per month"
                        className="input-field pr-14 tabular-nums text-base"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium">
                        / mo
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bonus income */}
              <div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-ink">Receive a bonus?</p>
                    <p className="text-[11px] text-ink-subtle mt-0.5">Performance or contractual bonus</p>
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
                  <div className="mt-2 animate-fade-up grid grid-cols-[130px_1fr] gap-2">
                    <select
                      value={bonusFrequency}
                      onChange={(e) => onChange('bonusFrequency', e.target.value)}
                      className="select-field text-base"
                    >
                      <option value="yearly">Yearly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={bonusAmount ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^\d]/g, '')
                          onChange('bonusAmount', raw === '' ? null : Number(raw))
                        }}
                        placeholder={bonusFrequency === 'yearly' ? 'e.g. 120 000' : 'e.g. 10 000'}
                        className="input-field pr-20 tabular-nums text-base"
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
                      Recognised at 50% by most banks — ~{Math.round(monthly * 0.5).toLocaleString('cs-CZ')} CZK/mo added.
                    </p>
                  )
                })()}
              </div>

            </div>
          )}
        </div>

      </div>
    </FunnelCard>
  )
}
