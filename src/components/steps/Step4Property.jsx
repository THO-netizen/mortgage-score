import { useState } from 'react'
import { AlertTriangle, CheckCircle, Home, Search } from 'lucide-react'
import FunnelCard from '../funnel/FunnelCard.jsx'
import ActionBar  from '../funnel/ActionBar.jsx'
import { formatCZK, formatCZKShort } from '../../utils/formatters.js'

const PROPERTY_PURPOSES = [
  { value: '',           label: 'Select purpose…'       },
  { value: 'primary',    label: 'Primary Residence'     },
  { value: 'investment', label: 'Investment / Rental'   },
  { value: 'holiday',    label: 'Holiday / Second Home' },
]

const PURCHASE_TIMELINES = [
  { value: '',          label: 'Select timeline…'  },
  { value: '3months',   label: 'Within 3 months'   },
  { value: '6months',   label: 'Within 6 months'   },
  { value: '12months',  label: '6 – 12 months'     },
  { value: 'exploring', label: 'Exploring options' },
]

const FIRST_HOME_AGE_LIMIT = 36  // ČNB — strictly under 36 → up to 90% LTV eligible

// ── LTV progress bar ───────────────────────────────────
function LTVBar({ ltv }) {
  const pct      = Math.min(100, Math.max(0, ltv))
  const barColor = ltv >= 80 ? '#EF4444' : ltv >= 70 ? '#F59E0B' : '#10B981'

  return (
    <div>
      <div className="relative h-2.5 rounded-full overflow-hidden bg-border">
        <div className="absolute inset-0 flex">
          <div style={{ width: '70%' }} className="bg-success-DEFAULT/20" />
          <div style={{ width: '10%' }} className="bg-warning-DEFAULT/20" />
          <div style={{ width: '20%' }} className="bg-risk-DEFAULT/20"    />
        </div>
        <div className="absolute top-0 bottom-0 w-px bg-white/60" style={{ left: '70%' }} />
        <div className="absolute top-0 bottom-0 w-px bg-white/60" style={{ left: '80%' }} />
        <div
          className="absolute inset-y-0 left-0 transition-all duration-500"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <div className="relative mt-1.5" style={{ height: '14px' }}>
        <span className="absolute left-0 text-[10px] text-ink-subtle">0%</span>
        <span className="absolute text-[10px] text-success-text font-medium" style={{ left: '70%', transform: 'translateX(-50%)' }}>70%</span>
        <span className="absolute text-[10px] text-warning-text font-medium" style={{ left: '80%', transform: 'translateX(-50%)' }}>80%</span>
        <span className="absolute right-0 text-[10px] text-ink-subtle">100%</span>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────
export default function Step4Property({ data, onChange, onBack, onContinue }) {
  const {
    propertyMode     = 'defined',
    purchasePrice    = 5_500_000,
    ownFunds         = 1_200_000,
    propertyPurpose  = '',
    purchaseTimeline = '',
    applicantAge     = 35,
  } = data

  const isDiscovering = propertyMode === 'discovering'

  // Local raw strings for numeric inputs (allow free typing)
  const [purchasePriceRaw, setPurchasePriceRaw] = useState(String(purchasePrice ?? ''))
  const [ownFundsRaw,      setOwnFundsRaw]      = useState(String(ownFunds ?? ''))

  const parsedPurchasePrice = Math.max(0, Number(purchasePriceRaw.replace(/\s/g, '')) || 0)
  const parsedOwnFunds      = Math.max(0, Number(ownFundsRaw.replace(/\s/g, '')) || 0)
  const loanAmount          = Math.max(0, parsedPurchasePrice - parsedOwnFunds)
  const ltv                 = parsedPurchasePrice > 0 ? (loanAmount / parsedPurchasePrice) * 100 : 0
  const ownFundsPct         = parsedPurchasePrice > 0 ? (parsedOwnFunds / parsedPurchasePrice) * 100 : 0

  const isInvestment       = propertyPurpose === 'investment'
  const firstHomeEligible  = !isInvestment && Number(applicantAge) < FIRST_HOME_AGE_LIMIT
  const maxLTVPct          = isInvestment ? 70 : (firstHomeEligible ? 90 : 80)
  const amberLTVPct        = isInvestment ? 65 : 70

  const ltvColor     = ltv > maxLTVPct ? 'text-risk-DEFAULT' : ltv > amberLTVPct ? 'text-warning-DEFAULT' : 'text-success-DEFAULT'
  const metricBorder = ltv > maxLTVPct ? 'border-risk-border bg-risk-light' : ltv > amberLTVPct ? 'border-warning-border bg-warning-light' : 'border-success-border bg-success-light'
  const minOwnFundsNeeded = ltv > maxLTVPct
    ? Math.ceil(parsedPurchasePrice * ((100 - maxLTVPct) / 100)) - parsedOwnFunds
    : 0

  // canContinue: discovery → always true (mode switch auto-navigates); defined → purpose + timeline
  const canContinue = isDiscovering ? true : !!propertyPurpose && !!purchaseTimeline

  // ── Switch mode ────────────────────────────────────────
  function switchMode(mode) {
    onChange('propertyMode', mode)
    if (mode === 'discovering') {
      // Clear property specifics — engine will skip krok_6 (LTV cap = Infinity)
      onChange('purchasePrice', 0)
      onChange('ownFunds',      0)
      setPurchasePriceRaw('')
      setOwnFundsRaw('')
      // Navigate immediately — no property fields required in discovery mode
      onContinue()
    } else {
      // Restore sensible defaults so the LTV bar has something to show
      onChange('purchasePrice', 5_500_000)
      onChange('ownFunds',      1_200_000)
      setPurchasePriceRaw('5 500 000')
      setOwnFundsRaw('1 200 000')
    }
  }

  return (
    <FunnelCard
      stepLabel="Step 4 of 4 · Property & Financing"
      title="Property parameters and financing structure"
      subtitle="Tell us whether you have a specific property in mind or are still exploring your budget."
      footer={<ActionBar canContinue={canContinue} onBack={onBack} onContinue={onContinue} />}
    >

      {/* ── Mode toggle ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-7">
        <button
          type="button"
          onClick={() => switchMode('defined')}
          className={[
            'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-left transition-all duration-200',
            !isDiscovering
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-border bg-card text-ink-muted hover:border-brand-300',
          ].join(' ')}
        >
          <Home size={20} className={!isDiscovering ? 'text-brand-600' : 'text-ink-subtle'} />
          <div>
            <p className="text-xs font-bold leading-tight">I have a property</p>
            <p className="text-[10px] mt-0.5 leading-snug opacity-75">Enter price &amp; own funds</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => switchMode('discovering')}
          className={[
            'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-left transition-all duration-200',
            isDiscovering
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-border bg-card text-ink-muted hover:border-brand-300',
          ].join(' ')}
        >
          <Search size={20} className={isDiscovering ? 'text-brand-600' : 'text-ink-subtle'} />
          <div>
            <p className="text-xs font-bold leading-tight">I&apos;m exploring</p>
            <p className="text-[10px] mt-0.5 leading-snug opacity-75">Show me my budget range</p>
          </div>
        </button>
      </div>

      {/* ── DISCOVERY MODE ──────────────────────────── */}
      {isDiscovering && (
        <div className="space-y-6">

          <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
            <p className="text-xs font-semibold text-brand-700 mb-1">Budget Discovery Mode</p>
            <p className="text-[11px] text-brand-600 leading-relaxed">
              Based on your income and obligations we&apos;ll calculate your maximum borrowing capacity
              and reverse-derive the property price range you can target — including the minimum
              own funds you&apos;ll need to bring.
            </p>
          </div>

          {/* Dropdowns (optional — improve score accuracy) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="propertyPurposeD" className="section-label mb-2 block">
                Intended Property Use <span className="text-ink-subtle font-normal">(optional)</span>
              </label>
              <select
                id="propertyPurposeD"
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
              <label htmlFor="purchaseTimelineD" className="section-label mb-2 block">
                Buying Timeline
              </label>
              <select
                id="purchaseTimelineD"
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

          <p className="text-[11px] text-ink-subtle leading-relaxed">
            Your results will show the estimated maximum property price and minimum own funds based
            on ČNB regulations ({Number(applicantAge) < FIRST_HOME_AGE_LIMIT ? '90% LTV — First Home Buyer eligible' : '80% LTV — standard cap'}).
          </p>

        </div>
      )}

      {/* ── DEFINED MODE ────────────────────────────── */}
      {!isDiscovering && (
        <>
          {/* Purchase price */}
          <div className="mb-7">
            <label htmlFor="purchasePrice" className="section-label mb-1 block">
              Purchase Price
            </label>
            <div className="relative">
              <input
                id="purchasePrice"
                type="text"
                inputMode="numeric"
                value={purchasePriceRaw}
                placeholder="e.g. 5 500 000"
                onChange={(e) => {
                  const raw    = e.target.value.replace(/[^\d\s]/g, '')
                  setPurchasePriceRaw(raw)
                  const parsed = Math.max(0, Number(raw.replace(/\s/g, '')) || 0)
                  onChange('purchasePrice', parsed)
                }}
                onBlur={() => {
                  if (parsedPurchasePrice > 0) setPurchasePriceRaw(parsedPurchasePrice.toLocaleString('cs-CZ'))
                }}
                className="input-field pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-ink-subtle pointer-events-none">CZK</span>
            </div>
            {parsedPurchasePrice > 0 && (
              <p className="text-[12px] font-semibold text-ink mt-1.5 tabular-nums">= {formatCZK(parsedPurchasePrice)}</p>
            )}
          </div>

          {/* Own funds */}
          <div className="mb-7">
            <label htmlFor="ownFunds" className="section-label mb-1 block">
              Available Own Funds
            </label>
            <p className="text-[11px] text-ink-subtle mb-2">cash · savings · confirmed gift equity</p>
            <div className="relative">
              <input
                id="ownFunds"
                type="text"
                inputMode="numeric"
                value={ownFundsRaw}
                placeholder="e.g. 1 200 000"
                onChange={(e) => {
                  const raw    = e.target.value.replace(/[^\d\s]/g, '')
                  setOwnFundsRaw(raw)
                  const parsed = Math.max(0, Number(raw.replace(/\s/g, '')) || 0)
                  onChange('ownFunds', parsed)
                }}
                onBlur={() => {
                  if (parsedOwnFunds > 0) setOwnFundsRaw(parsedOwnFunds.toLocaleString('cs-CZ'))
                }}
                className="input-field pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-ink-subtle pointer-events-none">CZK</span>
            </div>
            <p className="text-[11px] text-ink-subtle mt-2 leading-relaxed">
              Include only confirmed liquid funds — not expected income, unsold assets, or pending loans
            </p>
            {parsedOwnFunds > 0 && (
              <p className="text-[12px] font-semibold text-ink mt-1.5 tabular-nums">= {formatCZK(parsedOwnFunds)}</p>
            )}
          </div>

          {/* Live LTV card */}
          <div className={`rounded-xl border p-5 mb-4 transition-colors duration-300 ${metricBorder}`}>
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div>
                <p className="section-label mb-1.5">Loan</p>
                <p className="font-display text-base sm:text-lg font-extrabold text-ink tabular-nums leading-tight">
                  {formatCZKShort(loanAmount)}
                </p>
              </div>
              <div className="text-center border-x border-black/10 px-2">
                <p className="section-label mb-1.5">LTV</p>
                <p className={`font-display text-2xl sm:text-3xl font-black tabular-nums leading-tight ${ltvColor}`}>
                  {ltv.toFixed(0)}%
                </p>
              </div>
              <div className="text-right">
                <p className="section-label mb-1.5">Own Funds</p>
                <p className="font-display text-base sm:text-lg font-extrabold text-ink tabular-nums leading-tight">
                  {ownFundsPct.toFixed(0)}%
                </p>
              </div>
            </div>
            <LTVBar ltv={ltv} />
          </div>

          {/* LTV messages */}
          {ltv > maxLTVPct && (
            <div className="flex items-start gap-3 rounded-xl bg-risk-light border border-risk-border p-4 mb-6">
              <AlertTriangle size={15} className="text-risk-DEFAULT flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-risk-text mb-0.5">
                  {isInvestment ? 'LTV Exceeds Investment Property Cap (70%)' : `LTV Exceeds ČNB Limit (${maxLTVPct}%)`}
                </p>
                <p className="text-xs text-risk-text leading-relaxed">
                  {isInvestment
                    ? <>Czech banks cap investment / rental property LTV at <strong>70%</strong>. You need at least <strong>{formatCZK(minOwnFundsNeeded)}</strong> more in confirmed own funds to meet this limit.</>
                    : firstHomeEligible
                      ? <>The maximum LTV under the First Home Buyer scheme (applicants under 36) is <strong>90%</strong>. You need at least <strong>{formatCZK(minOwnFundsNeeded)}</strong> more in confirmed own funds to reach this threshold.</>
                      : <>The Czech National Bank caps mortgage LTV at <strong>80%</strong> for standard applicants. You need at least <strong>{formatCZK(minOwnFundsNeeded)}</strong> more in confirmed own funds to qualify.</>
                  }
                </p>
              </div>
            </div>
          )}

          {ltv > amberLTVPct && ltv <= maxLTVPct && (
            <div className="flex items-start gap-3 rounded-xl bg-warning-light border border-warning-border p-4 mb-6">
              <AlertTriangle size={15} className="text-warning-DEFAULT flex-shrink-0 mt-0.5" />
              <p className="text-xs text-warning-text leading-relaxed">
                {isInvestment
                  ? <><strong>{ltv.toFixed(0)}% LTV</strong> is approaching the 70% investment property cap. Increasing own funds provides headroom and may improve available rate options.</>
                  : firstHomeEligible && ltv > 80
                    ? <><strong>{ltv.toFixed(0)}% LTV</strong> — as an applicant under 36, you may be eligible for up to 90% LTV under the First Home Buyer scheme. Approval depends on individual lender assessment and income qualification.</>
                    : <><strong>70–80% LTV</strong> is accepted by most banks but limits your rate options. Some lenders apply a risk premium above 75% LTV — bringing this below 70% typically unlocks the best fixed rates.</>
                }
              </p>
            </div>
          )}

          {ltv > 0 && ltv <= amberLTVPct && (
            <div className="flex items-start gap-3 rounded-xl bg-success-light border border-success-border p-4 mb-6">
              <CheckCircle size={15} className="text-success-DEFAULT flex-shrink-0 mt-0.5" />
              <p className="text-xs text-success-text leading-relaxed">
                <strong>Strong LTV position.</strong>{' '}
                {isInvestment
                  ? 'Below 65% LTV on an investment property signals low collateral risk and gives you the strongest negotiating position for rate and terms.'
                  : firstHomeEligible
                    ? 'Below 70% LTV is well within limits for all Czech banks. As an applicant under 36, you also retain the option to apply up to 90% LTV under the First Home Buyer scheme if needed.'
                    : 'Below 70% LTV unlocks competitive fixed rates across covered Czech banks and signals low collateral risk to underwriters.'
                }
              </p>
            </div>
          )}

          {/* Dropdowns */}
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
              {isInvestment && parsedPurchasePrice > 0 && (
                <p className="mt-2 text-[11px] text-warning-text leading-relaxed">
                  <span className="font-semibold">Required own funds (min. 30%):</span>{' '}
                  {formatCZK(Math.ceil(parsedPurchasePrice * 0.30))}
                </p>
              )}
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
        </>
      )}

    </FunnelCard>
  )
}
