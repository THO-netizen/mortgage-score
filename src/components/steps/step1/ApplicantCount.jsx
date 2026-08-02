import { Check } from 'lucide-react'
import FunnelCard from '../../funnel/FunnelCard.jsx'
import ActionBar  from '../../funnel/ActionBar.jsx'

export default function ApplicantCount({ value, onChange, onBack, onContinue }) {

  // Auto-advance on selection (mobile behavior)
  const handleSelect = (n) => {
    onChange(n)
    setTimeout(() => {
      onContinue()
    }, 250)
  }

  return (
    <FunnelCard
      title="Are you applying alone or with someone?"
      subtitle="Joint applications combine incomes and may increase your borrowing capacity."
      hint={value > 1 ? 'Joint applications combine both incomes. Each applicant is verified individually.' : undefined}
    >
      {/* Segmented control — full width, large touch targets */}
      <div className="grid grid-cols-2 gap-3 max-w-sm">
        {[
          { n: 1, label: 'Solo', sublabel: 'Just me' },
          { n: 2, label: 'Joint', sublabel: 'With a partner' },
        ].map(({ n, label, sublabel }) => {
          const active = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => handleSelect(n)}
              className={[
                'relative rounded-xl border-2 px-3 py-3.5 sm:py-4 text-center transition-all duration-150',
                'flex flex-col items-center justify-center gap-0.5',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze/40',
                active ? 'border-ink bg-surface' : 'border-border bg-card hover:border-border-strong active:border-ink/30',
              ].join(' ')}
            >
              {active && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-ink flex items-center justify-center">
                  <Check size={9} className="text-white" strokeWidth={3} />
                </span>
              )}
              <span className={`font-display text-sm sm:text-base font-extrabold ${active ? 'text-ink' : 'text-ink'}`}>
                {label}
              </span>
              <span className={`text-[11px] ${active ? 'text-ink-muted' : 'text-ink-subtle'}`}>
                {sublabel}
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-[11px] text-ink-subtle mt-4 leading-relaxed">
        <span className="font-semibold text-ink">Note:</span> If you are married, Czech mortgage applications generally require both spouses as joint applicants.
      </p>

      {/* Footer with ActionBar for non-auto-advance (desktop shows it) */}
      <div className="mt-6">
        <ActionBar canContinue={true} onBack={onBack} onContinue={onContinue} />
      </div>
    </FunnelCard>
  )
}
