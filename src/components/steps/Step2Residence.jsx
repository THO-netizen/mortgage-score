import { Info } from 'lucide-react'
import FunnelCard from '../funnel/FunnelCard.jsx'
import ActionBar  from '../funnel/ActionBar.jsx'

const RESIDENCE_OPTIONS = [
  {
    value:   'eu',
    label:   'EU / EEA Citizen',
    desc:    'Same mortgage rights as Czech citizens',
  },
  {
    value:   'permanent',
    label:   'Permanent Residence',
    desc:    'Approved permanent residency (TP)',
  },
  {
    value:   'longterm5plus',
    label:   'Long-term — 5+ years',
    desc:    'Continuously held for 5+ years',
  },
  {
    value:   'longterm',
    label:   'Long-term — under 5 years',
    desc:    'Held for fewer than 5 years',
  },
  {
    value:   'employment',
    label:   'Work/Business Permit',
    desc:    'Long-term stay for work or business',
  },
  {
    value:   'other',
    label:   'Other / Student / Digital Nomad',
    desc:    'Short-stay, student, or non-standard',
  },
]


const YEARS_OPTIONS = [
  { value: '',        label: 'Select years in Czechia...' },
  { value: 'less1',   label: 'Less than 1 year'          },
  { value: '1-2',     label: '1 - 2 years'               },
  { value: '2-5',     label: '2 - 5 years'               },
  { value: '5-10',    label: '5 - 10 years'              },
  { value: '10plus',  label: '10 or more years'           },
]

function ResidenceOption({ option, selected, onSelect }) {
  const { label, desc } = option

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'w-full flex items-center gap-3 sm:gap-4 rounded-xl border px-4 sm:px-5 py-3.5 sm:py-4 text-left',
        'transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze/40',
        selected
          ? 'border-ink bg-surface'
          : 'border-border bg-card hover:border-border-strong active:border-ink/30',
      ].join(' ')}
    >
      {/* Custom radio indicator */}
      <span
        className={[
          'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
          'transition-colors duration-150',
          selected ? 'border-ink' : 'border-border-strong',
        ].join(' ')}
      >
        {selected && (
          <span className="w-2.5 h-2.5 rounded-full bg-ink block" />
        )}
      </span>

      {/* Text */}
      <span className="flex-1 min-w-0">
        <span
          className={[
            'block text-sm font-semibold leading-snug',
            selected ? 'text-ink' : 'text-ink',
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
 * Mobile-first: compact radio list, proper touch targets, no horizontal overflow.
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
      title="What is your residence status in Czechia?"
      subtitle="This is the single most important eligibility factor for Czech mortgage applications."
      hint={value === 'other' ? 'Short-stay and student permits are declined by most Czech banks. We can help find specialist options.' : undefined}
      footer={
        <ActionBar
          canContinue={canContinue}
          onBack={onBack}
          onContinue={onContinue}
          continueLabel="Confirm residence"
        />
      }
    >

      {/* Residence options */}
      <div className="space-y-2 mb-6">
        {RESIDENCE_OPTIONS.map((opt) => (
          <ResidenceOption
            key={opt.value}
            option={opt}
            selected={value === opt.value}
            onSelect={() => onChange(opt.value)}
          />
        ))}
      </div>

      {/* Years in Czechia dropdown */}
      <div className="mb-6">
        <label
          htmlFor="yearsInCZ"
          className="section-label mb-2 block"
        >
          How long have you lived in Czechia?
        </label>
        <select
          id="yearsInCZ"
          value={yearsValue}
          onChange={(e) => onYearsChange(e.target.value)}
          className="select-field text-base"
        >
          {YEARS_OPTIONS.map(({ value: v, label }) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      {/* Applicant age */}
      <div className="mb-6">
        <label htmlFor="applicantAge" className="section-label mb-2 block">
          Your current age
          <span className="text-risk-DEFAULT ml-1">*</span>
        </label>
        <div className="relative">
          <input
            id="applicantAge"
            type="text"
            inputMode="numeric"
            min={18}
            max={80}
            value={ageValue || ''}
            onChange={(e) => onAgeChange(Number(e.target.value.replace(/[^\d]/g, '')))}
            placeholder="e.g. 35"
            className="input-field pr-14 tabular-nums text-base"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-subtle pointer-events-none font-medium">
            yrs
          </span>
        </div>
        <p className="text-[11px] text-ink-subtle mt-1.5 leading-relaxed">
          Banks typically require full repayment by age 75. Under 36 — eligible for 90% LTV.
          {ageValue >= 60 && (
            <span className="text-warning-DEFAULT font-medium"> Age 60+ — maximum payoff age reduced to 65.</span>
          )}
        </p>
      </div>

      {/* Context callout */}
      <div className="flex items-start gap-3 rounded-xl bg-surface border border-border p-3.5 sm:p-4">
        <Info size={15} className="text-bronze flex-shrink-0 mt-0.5" />
        <p className="text-xs text-ink-muted leading-relaxed">
          <span className="font-semibold">Why this matters: </span>
          EU citizens and permanent residents access all 6 major Czech banks. Non-EU long-term permit holders are eligible at ~60% of lenders.
        </p>
      </div>

    </FunnelCard>
  )
}
