import { Check } from 'lucide-react'

export function Toggle({ on, onToggle, danger = false }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={[
        'relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze/40',
        on ? (danger ? 'bg-risk-DEFAULT' : 'bg-ink') : 'bg-border',
      ].join(' ')}
    >
      <span className={[
        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
        on ? 'translate-x-4' : 'translate-x-0',
      ].join(' ')} />
    </button>
  )
}

export const CONTRACT_TYPES = [
  { value: 'indefinite', label: 'Indefinite contract' },
  { value: 'definite',   label: 'Fixed-term contract' },
  { value: 'agency',     label: 'Agency / Temp'       },
  { value: 'dpc',        label: 'Supplemental agreement' },
]

export const STREAM_OPTIONS = [
  {
    value: 'A',
    title: 'Stream A',
    subtitle: 'Director salary',
    desc: 'Regular monthly salary paid through the company payroll as director compensation.',
    varNote: 'CSOB / UCB / mBank / CS',
  },
  {
    value: 'B',
    title: 'Stream B',
    subtitle: 'Profit share',
    desc: 'Profit share or dividends — based on actual distributed dividends over last 3 fiscal years.',
    varNote: 'UCB / mBank / CSOB / CS',
  },
  {
    value: 'C',
    title: 'Stream C',
    subtitle: 'Service agreement fees',
    desc: "Director's Service Agreement fees — requires a signed contract.",
    varNote: 'CSOB / UCB (contract req.)',
  },
]

export const EXPENSE_LUMP_OPTIONS = [
  { value: 80, label: '80%', desc: 'Crafts, agriculture' },
  { value: 60, label: '60%', desc: 'Trade, most services' },
  { value: 40, label: '40%', desc: 'Licensed professions' },
  { value: 30, label: '30%', desc: 'Rental income' },
]

export function EntityCard({ option, selected, onSelect }) {
  const opt = option
  return (
    <button
      key={opt.value}
      type="button"
      onClick={onSelect}
      className={[
        'relative w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 flex flex-col',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze/40',
        selected
          ? 'border-ink bg-surface shadow-card-md'
          : 'border-border bg-card hover:border-border-strong hover:shadow-card-md',
      ].join(' ')}
    >
      {selected && (
        <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-ink flex items-center justify-center">
          <Check size={11} className="text-white" strokeWidth={3} />
        </span>
      )}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${selected ? 'bg-surface border border-border' : 'bg-surface'}`}>
        <opt.Icon size={20} className={selected ? 'text-ink' : 'text-ink-muted'} />
      </div>
      <h3 className={`font-display text-lg font-extrabold leading-tight mb-0.5 ${selected ? 'text-ink' : 'text-ink'}`}>
        {opt.title}
      </h3>
      <p className={`text-xs mb-2 ${selected ? 'text-ink-muted' : 'text-ink-muted'}`}>{opt.subtitle}</p>
      <p className="text-xs text-ink-muted leading-relaxed flex-1">{opt.desc}</p>
      {opt.note && (
        <div className={`pt-3 border-t mt-4 text-[11px] font-medium ${selected ? 'border-border text-ink-muted' : 'border-border text-ink-subtle'}`}>
          {opt.note}
        </div>
      )}
    </button>
  )
}
