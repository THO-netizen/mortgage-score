import { useRef } from 'react'
import { Check } from 'lucide-react'
import FunnelCard from '../../funnel/FunnelCard.jsx'

export default function ApplicantCount({ value, onChange, onBack, onContinue }) {
  const advancingRef = useRef(false)

  const handleSelect = (n) => {
    if (advancingRef.current) return
    onChange(n)
    advancingRef.current = true
    setTimeout(() => {
      onContinue()
      setTimeout(() => { advancingRef.current = false }, 300)
    }, 280)
  }

  return (
    <FunnelCard
      title="Are you applying alone or with someone?"
      subtitle="Joint applications combine incomes and may increase your borrowing capacity."
      hint={value > 1 ? 'Joint applications combine both incomes. Each applicant is verified individually.' : undefined}
    >
      <div className="grid grid-cols-2 gap-3 max-w-sm" role="radiogroup" aria-label="Application type">
        {[
          { n: 1, label: 'Solo', sublabel: 'Just me' },
          { n: 2, label: 'Joint', sublabel: 'With a partner' },
        ].map(({ n, label, sublabel }) => {
          const active = value === n
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => handleSelect(n)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSelect(n)
                }
              }}
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

      {/* Back button only — no Continue needed for auto-advance */}
      {onBack && (
        <div className="pt-6 border-t border-[#E2E8F0] mt-6">
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-1.5 min-h-[48px] text-sm font-medium text-ink-muted active:text-ink transition-colors mx-auto sm:mx-0"
            type="button"
          >
            Back
          </button>
        </div>
      )}
    </FunnelCard>
  )
}
