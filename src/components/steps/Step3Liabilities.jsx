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
      stepLabel="Step 3 of 4 · Existing Debt"
      title="Existing monthly debt obligations"
      subtitle="Existing obligations are factored into DSTI calculation. Enter 0 for categories that do not apply."
      footer={
        <ActionBar
          canContinue
          onBack={onBack}
          onContinue={onContinue}
        />
      }
    >

      {/* ── Input grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">

        <CurrencyInput
          id="monthlyLoans"
          label="Monthly Loan Repayments"
          sublabel="consumer · car · other"
          value={monthlyLoanPayments}
          onChange={(v) => onChange('monthlyLoanPayments', v)}
          max={500_000}
        />

        <CurrencyInput
          id="monthlyLeasing"
          label="Monthly Leasing Payments"
          sublabel="car · equipment · operational"
          value={monthlyLeasing}
          onChange={(v) => onChange('monthlyLeasing', v)}
          max={100_000}
        />

        <CurrencyInput
          id="creditCardLimits"
          label="Total Credit Card Limits (KK)"
          sublabel="combined credit card limits (KK) — not the current balance"
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
          sublabel="alimony · co-signed liabilities · maintenance"
          value={otherObligations}
          onChange={(v) => onChange('otherObligations', v)}
          max={200_000}
        />

      </div>

      {/* ── Czech 5% credit-card rule callout ─────────── */}
      <div className="flex items-start gap-3 rounded-xl bg-warning-light border border-warning-border p-4 mb-5">
        <Info size={15} className="text-warning-DEFAULT flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-warning-text mb-0.5">
            Czech Bank Rule — Credit Card Limit Haircut
          </p>
          <p className="text-xs text-warning-text leading-relaxed">
            Regardless of actual usage or current balance, Czech banks count{' '}
            <strong>5% of your total credit card limits</strong> as a fixed monthly
            cost. Closing unused cards before submitting your application directly
            reduces your DSTI ratio and increases your borrowing capacity.
          </p>
        </div>
      </div>

      {/* ── Live obligation summary ────────────────────── */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="section-label mb-4">Monthly Obligation Summary</p>
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
          <div className="pt-3 mt-0.5 border-t border-border flex items-center justify-between">
            <span className="text-sm font-bold text-ink">Total Monthly Obligations</span>
            <span className="font-display text-xl font-extrabold text-ink tabular-nums">
              {formatCZK(totalMonthly)}
            </span>
          </div>
        </div>
      </div>

    </FunnelCard>
  )
}
