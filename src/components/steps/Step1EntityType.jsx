import { Briefcase, Building2, Check } from 'lucide-react'
import FunnelCard from '../funnel/FunnelCard.jsx'
import ActionBar  from '../funnel/ActionBar.jsx'

const ENTITY_OPTIONS = [
  {
    value:    'osvc',
    Icon:     Briefcase,
    title:    'OSVČ',
    subtitle: 'Self-employed · Freelancer · Živnostník',
    desc:     'You operate under a Czech trade license as an individual. Income declared via personal tax return (DPFO).',
    docs: [
      'Trade license — Živnostenský list',
      'Personal tax returns (DPFO) — last 2 years',
      'ČSSZ & health insurer clearances',
    ],
    note: 'Simpler document path — one set of financials',
  },
  {
    value:    'sro',
    Icon:     Building2,
    title:    's.r.o. Director',
    subtitle: 'Limited company owner · Director · Shareholder',
    desc:     'You receive income as a director, employee, or dividend recipient of a Czech s.r.o. (spol. s r.o.).',
    docs: [
      'Corporate financials (DPPO) — last 2 years',
      'Director salary slips or dividend history',
      'UBO ownership structure declaration',
    ],
    note: 'Both company and personal documents required',
  },
]

function EntityCard({ option, selected, onSelect }) {
  const { Icon, title, subtitle, desc, docs, note } = option

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'relative w-full text-left rounded-2xl border-2 p-6',
        'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
        selected
          ? 'border-brand-600 bg-brand-50 shadow-card-md'
          : 'border-border bg-card hover:border-border-strong hover:shadow-card-md',
      ].join(' ')}
    >
      {/* Selected checkmark */}
      {selected && (
        <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center">
          <Check size={13} className="text-white" strokeWidth={3} />
        </span>
      )}

      {/* Icon */}
      <div
        className={[
          'w-12 h-12 rounded-xl flex items-center justify-center mb-5',
          'transition-colors duration-200',
          selected ? 'bg-brand-600' : 'bg-surface',
        ].join(' ')}
      >
        <Icon size={22} className={selected ? 'text-white' : 'text-ink-muted'} />
      </div>

      {/* Title + subtitle */}
      <h3 className="font-display text-xl font-extrabold text-ink leading-tight mb-0.5">
        {title}
      </h3>
      <p className="text-xs text-ink-muted mb-3">{subtitle}</p>

      {/* Description */}
      <p className="text-sm text-ink-muted leading-relaxed mb-5">{desc}</p>

      {/* Document list */}
      <ul className="space-y-2 mb-5">
        {docs.map((d) => (
          <li key={d} className="flex items-start gap-2.5 text-xs text-ink-muted">
            <span
              className={[
                'mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0',
                selected ? 'bg-brand-600' : 'bg-ink-subtle',
              ].join(' ')}
            />
            {d}
          </li>
        ))}
      </ul>

      {/* Footer note */}
      <div
        className={[
          'pt-4 border-t text-xs font-medium',
          selected
            ? 'border-brand-200 text-brand-600'
            : 'border-border text-ink-subtle',
        ].join(' ')}
      >
        {note}
      </div>
    </button>
  )
}

/**
 * Step 1 — Business Structure
 * User chooses between OSVČ (sole trader) and s.r.o. (company director).
 */
export default function Step1EntityType({ value, onChange, onContinue }) {
  return (
    <FunnelCard
      stepLabel="Step 1 of 7 · Business Structure"
      title="How do you earn income in Czechia?"
      subtitle="Your business structure determines your document requirements and which banks can assess your application. Both paths are fully supported."
      footer={
        <ActionBar
          isFirst
          canContinue={!!value}
          onContinue={onContinue}
        />
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ENTITY_OPTIONS.map((opt) => (
          <EntityCard
            key={opt.value}
            option={opt}
            selected={value === opt.value}
            onSelect={() => onChange(opt.value)}
          />
        ))}
      </div>
    </FunnelCard>
  )
}
