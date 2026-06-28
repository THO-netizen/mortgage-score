import { AlertTriangle, CheckCircle } from 'lucide-react'
import FunnelCard     from '../funnel/FunnelCard.jsx'
import ActionBar      from '../funnel/ActionBar.jsx'
import CurrencySlider from '../ui/CurrencySlider.jsx'
import { formatCZK }  from '../../utils/formatters.js'

const PROPERTY_PURPOSES = [
  { value: '',           label: 'Select purpose…'        },
  { value: 'primary',    label: 'Primary Residence'      },
  { value: 'investment', label: 'Investment / Rental'    },
  { value: 'holiday',    label: 'Holiday / Second Home'  },
]

const PURCHASE_TIMELINES = [
  { value: '',          label: 'Select timeline…'    },
  { value: '3months',   label: 'Within 3 months'     },
  { value: '6months',   label: 'Within 6 months'     },
  { value: '12months',  label: '6 – 12 months'       },
  { value: 'exploring', label: 'Exploring options'   },
]

function LTVBar({ ltv }) {
  const pct      = Math.min(100, Math.max(0, ltv))
  const barColor = ltv >= 80 ? '#EF4444' : ltv >= 70 ? '#F59E0B' : '#10B981'

  return (
    <div>
      {/* Track with zone backgrounds */}
      <div className="relative h-2.5 rounded-full overflow-hidden bg-border">
        <div className="absolute inset-0 flex">
          <div style={{ width: '70%' }} className="bg-success-DEFAULT/20" />
          <div style={{ width: '10%' }} className="bg-warning-DEFAULT/20" />
          <div style={{ width: '20%' }} className="bg-risk-DEFAULT/20"    />
        </div>
        {/* Zone dividers */}
        <div className="absolute top-0 bottom-0 w-px bg-white/60" style={{ left: '70%' }} />
        <div className="absolute top-0 bottom-0 w-px bg-white/60" style={{ left: '80%' }} />
        {/* Active fill */}
        <div
          className="absolute inset-y-0 left-0 transition-all duration-500"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>

      {/* Zone labels */}
      <div className="relative mt-1.5" style={{ height: '14px' }}>
        <span className="absolute left-0 text-[10px] text-ink-subtle">0%</span>
        <span
          className="absolute text-[10px] text-success-text font-medium"
          style={{ left: '70%', transform: 'translateX(-50%)' }}
        >
          70%
        </span>
        <span
          className="absolute text-[10px] text-warning-text font-medium"
          style={{ left: '80%', transform: 'translateX(-50%)' }}
        >
          80%
        </span>
        <span className="absolute right-0 text-[10px] text-ink-subtle">100%</span>
      </div>
    </div>
  )
}

export default function Step4Property({ data, onChange, onBack, onContinue }) {
  const {
    purchasePrice    = 5_500_000,
    ownFunds         = 1_200_000,
    propertyPurpose  = '',
    purchaseTimeline = '',
  } = data

  const safeOwnFunds = Math.min(ownFunds, purchasePrice)
  const loanAmount   = Math.max(0, purchasePrice - safeOwnFunds)
  const ltv          = purchasePrice > 0 ? (loanAmount / purchasePrice) * 100 : 0
  const ownFundsPct  = purchasePrice > 0 ? (safeOwnFunds / purchasePrice) * 100 : 0

  const ltvColor =
    ltv >= 80 ? 'text-risk-DEFAULT' :
    ltv >= 70 ? 'text-warning-DEFAULT' :
    'text-success-DEFAULT'

  const metricBorder =
    ltv >= 80 ? 'border-risk-border   bg-risk-light'    :
    ltv >= 70 ? 'border-warning-border bg-warning-light' :
    'border-success-border bg-success-light'

  const minOwnFundsNeeded =
    ltv > 80 ? Math.ceil(purchasePrice * 0.20) - safeOwnFunds : 0

  const canContinue = !!propertyPurpose && !!purchaseTimeline

  return (
    <FunnelCard
      stepLabel="Step 4 of 7 · Property & Cash Reserves"
      title="What property are you planning to purchase?"
      subtitle="Your Loan-to-Value (LTV) ratio is the single most critical number Czech banks assess for Self-employed (OSVČ) and Company Director (s.r.o.) applicants. Adjust the sliders to see it update live."
      footer={
        <ActionBar
          canContinue={canContinue}
          onBack={onBack}
          onContinue={onContinue}
        />
      }
    >

      {/* ── Sliders ────────────────────────────────────── */}
      <div className="space-y-8 mb-7">
        <CurrencySlider
          id="purchasePrice"
          label="Purchase Price"
          value={purchasePrice}
          onChange={(v) => {
            onChange('purchasePrice', v)
            if (safeOwnFunds > v) onChange('ownFunds', v)
          }}
          min={1_000_000}
          max={25_000_000}
          step={100_000}
        />

        <CurrencySlider
          id="ownFunds"
          label="Available Own Funds (Vlastní zdroje)"
          sublabel="cash · savings · confirmed gift equity"
          value={safeOwnFunds}
          onChange={(v) => onChange('ownFunds', v)}
          min={0}
          max={purchasePrice}
          step={50_000}
          hint="Include only confirmed liquid funds (Vlastní zdroje) — not expected income, unsold assets, or pending loans"
        />
      </div>

      {/* ── Live LTV card ──────────────────────────────── */}
      <div className={`rounded-xl border p-5 mb-4 transition-colors duration-300 ${metricBorder}`}>

        {/* Three metric tiles */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div>
            <p className="section-label mb-1.5">Loan Amount</p>
            <p className="font-display text-lg font-extrabold text-ink tabular-nums leading-tight">
              {formatCZK(loanAmount)}
            </p>
          </div>
          <div className="text-center border-x border-black/10 px-2">
            <p className="section-label mb-1.5">LTV Ratio</p>
            <p className={`font-display text-3xl font-black tabular-nums leading-tight ${ltvColor}`}>
              {ltv.toFixed(0)}%
            </p>
          </div>
          <div className="text-right">
            <p className="section-label mb-1.5">Own Funds</p>
            <p className="font-display text-lg font-extrabold text-ink tabular-nums leading-tight">
              {ownFundsPct.toFixed(0)}%
            </p>
          </div>
        </div>

        <LTVBar ltv={ltv} />
      </div>

      {/* ── Contextual LTV message ─────────────────────── */}
      {ltv > 80 && (
        <div className="flex items-start gap-3 rounded-xl bg-risk-light border border-risk-border p-4 mb-6">
          <AlertTriangle size={15} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-risk-text mb-0.5">
              LTV Exceeds CNB Limit for Self-Employed Applicants
            </p>
            <p className="text-xs text-risk-text leading-relaxed">
              The Czech National Bank (ČNB) caps mortgage LTV at <strong>80%</strong> for
              Self-employed (OSVČ) and Company Directors (s.r.o.). You need at least{' '}
              <strong>{formatCZK(minOwnFundsNeeded)}</strong> more in confirmed own funds
              (Vlastní zdroje) before any Czech bank can consider this application.
            </p>
          </div>
        </div>
      )}

      {ltv > 70 && ltv <= 80 && (
        <div className="flex items-start gap-3 rounded-xl bg-warning-light border border-warning-border p-4 mb-6">
          <AlertTriangle size={15} className="text-warning-DEFAULT flex-shrink-0 mt-0.5" />
          <p className="text-xs text-warning-text leading-relaxed">
            <strong>70–80% LTV</strong> is accepted by most banks but limits your rate
            options. Some lenders apply a risk premium above 75% LTV for self-employed
            applicants — bringing this below 70% typically unlocks the best fixed rates.
          </p>
        </div>
      )}

      {ltv > 0 && ltv <= 70 && (
        <div className="flex items-start gap-3 rounded-xl bg-success-light border border-success-border p-4 mb-6">
          <CheckCircle size={15} className="text-success-DEFAULT flex-shrink-0 mt-0.5" />
          <p className="text-xs text-success-text leading-relaxed">
            <strong>Strong LTV position.</strong> Below 70% LTV unlocks competitive fixed
            rates across all 19 covered Czech banks and signals low collateral risk to
            underwriters — the optimal position for Self-employed (OSVČ) and Company Director
            (s.r.o.) applications.
          </p>
        </div>
      )}

      {/* ── Dropdowns ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="propertyPurpose" className="section-label mb-2 block">
            Property Purpose
          </label>
          <select
            id="propertyPurpose"
            value={propertyPurpose}
            onChange={(e) => onChange('propertyPurpose', e.target.value)}
            className="select-field"
          >
            {PROPERTY_PURPOSES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="purchaseTimeline" className="section-label mb-2 block">
            Purchase Timeline
          </label>
          <select
            id="purchaseTimeline"
            value={purchaseTimeline}
            onChange={(e) => onChange('purchaseTimeline', e.target.value)}
            className="select-field"
          >
            {PURCHASE_TIMELINES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

    </FunnelCard>
  )
}
