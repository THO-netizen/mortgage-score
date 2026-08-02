import { Briefcase, Building2, UserCheck, Check } from 'lucide-react'
import FunnelCard from '../../funnel/FunnelCard.jsx'
import ActionBar  from '../../funnel/ActionBar.jsx'

const ENTITY_OPTIONS = [
  {
    value: 'zamestnanec',
    Icon:  UserCheck,
    title: 'Employed',
    subtitle: 'Zaměstnanec',
    desc:  'Salary-based income from an employer',
    note:  'Most common path',
  },
  {
    value: 'osvc',
    Icon:  Briefcase,
    title: 'Self-Employed',
    subtitle: 'OSVČ',
    desc:  'Income from your own trade license',
    note:  'IČO verification required',
  },
  {
    value: 'sro',
    Icon:  Building2,
    title: 's.r.o. Director',
    subtitle: 'Jednatel s.r.o.',
    desc:  'Director salary, dividends, or fees',
    note:  'IČO verification required',
  },
]

export default function EntitySelect({ value, onChange, onBack, onContinue }) {
  const canContinue = !!value

  // Auto-advance after selection on mobile
  const handleSelect = (optValue) => {
    onChange(optValue)
    // Small delay so user sees the selection feedback before advancing
    setTimeout(() => {
      if (window.innerWidth < 640) {
        onContinue()
      }
    }, 250)
  }

  return (
    <FunnelCard
      title="First, how do you receive most of your income?"
      subtitle="This determines how banks will assess your application."
      footer={<ActionBar isFirst={!onBack} canContinue={canContinue} onBack={onBack} onContinue={onContinue} />}
    >
      {/* Mobile: compact stacked list */}
      <div className="flex flex-col gap-3 sm:hidden">
        {ENTITY_OPTIONS.map((opt) => {
          const selected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={[
                'relative w-full flex items-center gap-4 rounded-xl border-2 px-4 py-4 text-left',
                'transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
                selected
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-border bg-card active:border-brand-300',
              ].join(' ')}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selected ? 'bg-brand-100' : 'bg-surface'}`}>
                <opt.Icon size={20} className={selected ? 'text-brand-600' : 'text-ink-muted'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold leading-tight ${selected ? 'text-brand-700' : 'text-ink'}`}>
                  {opt.title}
                </p>
                <p className={`text-xs mt-0.5 ${selected ? 'text-brand-600' : 'text-ink-muted'}`}>
                  {opt.desc}
                </p>
              </div>
              {selected && (
                <span className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-white" strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}

        {/* Advisor link */}
        <p className="text-center text-xs text-ink-muted mt-2">
          None of these?{' '}
          <a
            href="https://calendly.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 font-medium underline underline-offset-2"
          >
            Talk to an advisor
          </a>
        </p>
      </div>

      {/* Desktop: 3-column card grid */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-4">
        {ENTITY_OPTIONS.map((opt) => {
          const selected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={[
                'relative w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 flex flex-col',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
                selected
                  ? 'border-brand-600 bg-brand-50 shadow-card-md'
                  : 'border-border bg-card hover:border-border-strong hover:shadow-card-md',
              ].join(' ')}
            >
              {selected && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center">
                  <Check size={11} className="text-white" strokeWidth={3} />
                </span>
              )}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${selected ? 'bg-brand-100' : 'bg-surface'}`}>
                <opt.Icon size={20} className={selected ? 'text-brand-600' : 'text-ink-muted'} />
              </div>
              <h3 className={`font-display text-lg font-extrabold leading-tight mb-0.5 ${selected ? 'text-brand-700' : 'text-ink'}`}>
                {opt.title}
              </h3>
              <p className={`text-xs mb-2 ${selected ? 'text-brand-600' : 'text-ink-muted'}`}>{opt.subtitle}</p>
              <p className="text-xs text-ink-muted leading-relaxed flex-1">{opt.desc}</p>
              <div className={`pt-3 border-t mt-4 text-[11px] font-medium ${selected ? 'border-brand-200 text-brand-600' : 'border-border text-ink-subtle'}`}>
                {opt.note}
              </div>
            </button>
          )
        })}
      </div>

      {/* Desktop advisor link */}
      <p className="hidden sm:block text-xs text-ink-muted mt-4">
        Foreign income, mixed employment, or multiple entities?{' '}
        <a
          href="https://calendly.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 font-medium underline underline-offset-2"
        >
          Book a free consultation
        </a>
      </p>
    </FunnelCard>
  )
}
