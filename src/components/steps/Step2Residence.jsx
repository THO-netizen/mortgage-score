import { Info } from 'lucide-react'
import FunnelCard from '../funnel/FunnelCard.jsx'
import ActionBar  from '../funnel/ActionBar.jsx'

const RESIDENCE_OPTIONS = [
  {
    value:   'eu',
    label:   'EU / EEA Citizen',
    desc:    'Passport from any EU or EEA member state — same mortgage rights as Czech citizens',
    risk:    'low',
  },
  {
    value:   'permanent',
    label:   'Permanent Residence',
    desc:    'Approved permanent residency granted by Czech authorities (TP)',
    risk:    'low',
  },
  {
    value:   'longterm5plus',
    label:   'Long-term Residence — 5 or more years',
    desc:    'Long-term residence permit held continuously for 5+ years',
    risk:    'med',
  },
  {
    value:   'longterm',
    label:   'Long-term Residence — under 5 years',
    desc:    'Long-term residence permit held for fewer than 5 years',
    risk:    'med',
  },
  {
    value:   'employment',
    label:   'Long-term Residence (Work/Business Permit)',
    desc:    'Work or business visa with long-term stay entitlement',
    risk:    'med',
  },
  {
    value:   'other',
    label:   'Other / Student / Digital Nomad',
    desc:    'Short-stay Schengen visa, student permit, or non-standard arrangement',
    risk:    'high',
  },
]


const YEARS_OPTIONS = [
  { value: '',        label: 'Select years in Czechia…' },
  { value: 'less1',   label: 'Less than 1 year'          },
  { value: '1-2',     label: '1 – 2 years'               },
  { value: '2-5',     label: '2 – 5 years'               },
  { value: '5-10',    label: '5 – 10 years'              },
  { value: '10plus',  label: '10 or more years'           },
]

function ResidenceOption({ option, selected, onSelect }) {
  const { label, desc } = option

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'w-full flex items-center gap-4 rounded-xl border px-5 py-4 text-left',
        'transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
        selected
          ? 'border-brand-600 bg-brand-50'
          : 'border-border bg-card hover:border-border-strong hover:bg-surface',
      ].join(' ')}
    >
      {/* Custom radio indicator */}
      <span
        className={[
          'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
          'transition-colors duration-150',
          selected ? 'border-brand-600' : 'border-border-strong',
        ].join(' ')}
      >
        {selected && (
          <span className="w-2.5 h-2.5 rounded-full bg-brand-600 block" />
        )}
      </span>

      {/* Text */}
      <span className="flex-1 min-w-0">
        <span
          className={[
            'block text-sm font-semibold leading-snug',
            selected ? 'text-brand-700' : 'text-ink',
          ].join(' ')}
        >
          {label}
        </span>
        <span className="block text-xs text-ink-muted mt-0.5 leading-relaxed">
          {desc}
        </span>
      </span>
    </button>
  )
}

/**
 * Step 2 — Residence Status
 * The most critical eligibility factor for Czech mortgage applications.
 */
export default function Step2Residence({
  value,
  yearsValue,
  ageValue,
  onChange,
  onYearsChange,
  onAgeChange,
  onBack,
  onContinue,
}) {
  const canContinue = !!value && !!yearsValue && ageValue >= 18 && ageValue <= 80

  return (
    <FunnelCard
      stepLabel="Step 2 of 4 · Residence & Background"
      title="What is your residence status in Czechia?"
      subtitle="This is the single most important eligibility factor. Czech banks apply fundamentally different underwriting criteria based on your residence title."
      footer={
        <ActionBar
          canContinue={canContinue}
          onBack={onBack}
          onContinue={onContinue}
        />
      }
    >

      {/* ── Residence options ──────────────────────────── */}
      <div className="space-y-2 mb-7">
        {RESIDENCE_OPTIONS.map((opt) => (
          <ResidenceOption
            key={opt.value}
            option={opt}
            selected={value === opt.value}
            onSelect={() => onChange(opt.value)}
          />
        ))}
      </div>

      {/* ── Years in Czechia dropdown ─────────────────── */}
      <div className="mb-7">
        <label
          htmlFor="yearsInCZ"
          className="section-label mb-2 block"
        >
          How long have you lived in the Czech Republic?
        </label>
        <select
          id="yearsInCZ"
          value={yearsValue}
          onChange={(e) => onYearsChange(e.target.value)}
          className="select-field"
        >
          {YEARS_OPTIONS.map(({ value: v, label }) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      {/* ── Applicant age ─────────────────────────────── */}
      <div className="mb-7">
        <label htmlFor="applicantAge" className="section-label mb-2 block">
          Your current age
          <span className="text-risk-DEFAULT ml-1">*</span>
        </label>
        <div className="relative">
          <input
            id="applicantAge"
            type="number"
            inputMode="numeric"
            min={18}
            max={80}
            value={ageValue || ''}
            onChange={(e) => onAgeChange(Number(e.target.value))}
            placeholder="e.g. 35"
            className="input-field pr-14 tabular-nums"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium">
            yrs
          </span>
        </div>
        <p className="text-[11px] text-ink-subtle mt-1.5 leading-relaxed">
          Determines maximum loan maturity. Banks typically require full repayment by age 75. Under 36 — eligible for 90% mortgage, 10% required.
          {ageValue >= 60 && (
            <span className="text-warning-DEFAULT font-medium"> Age 60+ — UCB &amp; mBank reduce maximum payoff age to 65.</span>
          )}
        </p>
      </div>

      {/* ── Context callout ───────────────────────────── */}
      <div className="flex items-start gap-3 rounded-xl bg-brand-50 border border-brand-100 p-4">
        <Info size={16} className="text-brand-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-brand-700 leading-relaxed">
          <span className="font-semibold">Why this matters: </span>
          EU citizens and permanent residents have access to all 6 major Czech
          banks with no additional conditions. Non-EU long-term permit holders are
          eligible at approximately 60% of lenders. Employment and student permits
          are declined by the majority of Czech banks — specialist pre-filtering is
          required before any application is submitted.
        </p>
      </div>

    </FunnelCard>
  )
}
