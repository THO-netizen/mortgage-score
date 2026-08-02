import { Info } from 'lucide-react'
import FunnelCard    from '../funnel/FunnelCard.jsx'
import ActionBar     from '../funnel/ActionBar.jsx'
import CurrencyInput from '../ui/CurrencyInput.jsx'
import { formatCZK } from '../../utils/formatters.js'

export default function Step3Liabilities({ data, onChange, onBack, onContinue }) {
  const {
    monthlyLoanPayments = 0,
    creditCardLimits    = 0,
    monthlyLeasing      = 0,
    otherObligations    = 0,
  } = data

  const creditCard5pct = Math.round(creditCardLimits * 0.05)
  const totalMonthly   =
    monthlyLoanPayments + creditCard5pct + monthlyLeasing + otherObligations

  const summaryRows = [
    { label: 'Loan Repayments',   value: monthlyLoanPayments, amber: false },
    { label: 'Leasing Payments',  value: monthlyLeasing,      amber: false },
    { label: 'Credit Cards (5%)', value: creditCard5pct,      amber: creditCardLimits > 0 },
    { label: 'Other Obligations', value: otherObligations,    amber: false },
  ]

  return (
    <FunnelCard
      title="What are your existing monthly debt payments?"
      subtitle="Enter 0 for categories that don't apply. These are factored into your borrowing capacity."
      hint={creditCardLimits > 0 ? `Banks count 5% of your credit card limits (${formatCZK(creditCard5pct)}/mo) as a fixed cost — even if unused.` : undefined}
      footer={
        <ActionBar
          canContinue
          onBack={onBack}
          onContinue={onContinue}
          continueLabel="Save obligations"
        />
      }
    >

      {/* Input grid — single column on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-6">

        <CurrencyInput
          id="monthlyLoans"
          label="Monthly Loan Repayments"
          sublabel="consumer, car, other"
          value={monthlyLoanPayments}
          onChange={(v) => onChange('monthlyLoanPayments', v)}
          max={500_000}
        />

        <CurrencyInput
          id="monthlyLeasing"
          label="Monthly Leasing Payments"
          sublabel="car, equipment, operational"
          value={monthlyLeasing}
          onChange={(v) => onChange('monthlyLeasing', v)}
          max={100_000}
        />

        <CurrencyInput
          id="creditCardLimits"
          label="Total Credit Card Limits"
          sublabel="combined limits (not balance)"
          value={creditCardLimits}
          onChange={(v) => onChange('creditCardLimits', v)}
          max={2_000_000}
          hint={
            creditCardLimits > 0
              ? `Banks count this as ${formatCZK(creditCard5pct)} / month (5% rule)`
              : undefined
          }
        />

        <CurrencyInput
          id="otherObligations"
          label="Other Monthly Obligations"
          sublabel="alimony, co-signed, maintenance"
          value={otherObligations}
          onChange={(v) => onChange('otherObligations', v)}
          max={200_000}
        />

      </div>

      {/* Credit card rule callout */}
      <div className="flex items-start gap-3 rounded-xl bg-warning-light border border-warning-border p-3.5 sm:p-4 mb-5">
        <Info size={15} className="text-warning-DEFAULT flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-warning-text mb-0.5">
            Czech 5% Credit Card Rule
          </p>
          <p className="text-xs text-warning-text leading-relaxed">
            Banks count <strong>5% of total credit card limits</strong> as a fixed monthly cost regardless of usage. Closing unused cards directly increases your borrowing capacity.
          </p>
        </div>
      </div>

      {/* Live obligation summary */}
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <p className="section-label mb-3 sm:mb-4">Monthly Obligation Summary</p>
        <div className="space-y-2.5">
          {summaryRows.map(({ label, value, amber }) => (
            <div key={label} className="flex items-center justify-between">
              <span className={`text-sm ${amber ? 'font-medium text-warning-text' : 'text-ink-muted'}`}>
                {label}
              </span>
              <span className={`text-sm font-semibold tabular-nums ${amber ? 'text-warning-text' : 'text-ink'}`}>
                {formatCZK(value)}
              </span>
            </div>
          ))}
          <div className="pt-3 mt-0.5 border-t border-border flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-ink leading-tight">Total</span>
            <span className="font-display text-lg sm:text-xl font-extrabold text-ink tabular-nums flex-shrink-0">
              {formatCZK(totalMonthly)}
            </span>
          </div>
        </div>
      </div>

    </FunnelCard>
  )
}
