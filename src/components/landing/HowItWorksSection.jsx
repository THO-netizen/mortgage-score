// ── How It Works — minimal numbered steps ──────────────────────

const STEPS = [
  { n: '01', title: 'Your situation',     desc: 'Income structure, employment type and applicant profile.' },
  { n: '02', title: 'Financial position',  desc: 'Existing obligations and debt service capacity.' },
  { n: '03', title: 'Property & goals',    desc: 'Purchase price, own funds and financing timeline.' },
  { n: '04', title: 'Your assessment',     desc: 'Eligibility score, borrowing range and recommended next step.' },
]

export default function HowItWorksSection({ onStart }) {
  return (
    <section id="how-it-works" className="py-16 sm:py-24 px-5 sm:px-6" style={{ backgroundColor: '#FAFAF5' }}>
      <div className="max-w-lg mx-auto">

        {/* Section header */}
        <p
          className="text-[11px] font-semibold tracking-[0.15em] uppercase mb-3"
          style={{ color: '#C9A96E' }}
        >
          Process
        </p>
        <h2
          className="font-display text-xl sm:text-2xl font-extrabold leading-tight mb-10 sm:mb-12"
          style={{ color: '#0F172A' }}
        >
          Four steps to clarity
        </h2>

        {/* Steps */}
        <div className="mb-10 sm:mb-12">
          {STEPS.map(({ n, title, desc }, i) => (
            <div key={n}>
              {i > 0 && (
                <div className="h-px mx-0" style={{ backgroundColor: '#E2E8F0' }} />
              )}
              <div className="py-5 sm:py-6 flex gap-4 sm:gap-5 items-baseline">
                <span
                  className="font-display text-[13px] sm:text-sm font-bold flex-shrink-0 tabular-nums"
                  style={{ color: '#C9A96E' }}
                >
                  {n}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] sm:text-[15px] font-semibold mb-0.5" style={{ color: '#0F172A' }}>
                    {title}
                  </p>
                  <p className="text-[13px] sm:text-sm leading-relaxed" style={{ color: '#64748B' }}>
                    {desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Secondary CTA */}
        <button
          onClick={onStart}
          type="button"
          className="btn-cta w-full sm:w-auto"
        >
          Begin Private Assessment
        </button>

      </div>
    </section>
  )
}
