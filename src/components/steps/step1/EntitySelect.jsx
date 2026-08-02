import { useRef } from 'react'
import FunnelCard from '../../funnel/FunnelCard.jsx'

const ENTITY_OPTIONS = [
  {
    value: 'zamestnanec',
    title: 'Employed',
    subtitle: 'Regular salary from an employer',
  },
  {
    value: 'osvc',
    title: 'Self-employed',
    subtitle: 'Trade licence or freelance income',
  },
  {
    value: 'sro',
    title: 'Company director',
    subtitle: 'Salary, director fee or dividends',
  },
]

export default function EntitySelect({ value, onChange, onBack, onContinue }) {
  const advancingRef = useRef(false)

  const handleSelect = (optValue) => {
    if (advancingRef.current) return
    onChange(optValue)
    advancingRef.current = true
    setTimeout(() => {
      onContinue()
      setTimeout(() => { advancingRef.current = false }, 300)
    }, 280)
  }

  return (
    <FunnelCard
      title="How do you receive most of your income?"
      subtitle="This determines how banks assess your application."
    >
      <div className="flex flex-col gap-3 sm:gap-4 sm:max-w-md sm:mx-auto" role="radiogroup" aria-label="Income type">
        {ENTITY_OPTIONS.map((opt) => {
          const selected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => handleSelect(opt.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSelect(opt.value)
                }
              }}
              className={[
                'w-full flex items-center gap-3 sm:gap-4 rounded-xl border px-4 py-3 text-left',
                'min-h-[56px] transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E]/40',
                selected
                  ? 'border-[#0F172A] bg-[#FAFAF8]'
                  : 'border-[#E2E8F0] bg-white active:border-[#0F172A]/40',
              ].join(' ')}
            >
              <span
                className={[
                  'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                  selected
                    ? 'border-[#0F172A]'
                    : 'border-[#E2E8F0]',
                ].join(' ')}
                aria-hidden="true"
              >
                {selected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0F172A]" />
                )}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold leading-tight text-[#0F172A]">
                  {opt.title}
                </p>
                <p className="text-[12px] mt-0.5 leading-snug text-[#64748B]">
                  {opt.subtitle}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-center text-xs text-[#64748B] mt-4">
        Foreign, mixed or multiple income sources?{' '}
        <a
          href="https://calendly.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#64748B] underline underline-offset-2 hover:text-[#0F172A] transition-colors"
        >
          Talk to an advisor
        </a>
      </p>
    </FunnelCard>
  )
}
