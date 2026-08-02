import { Clock } from 'lucide-react'

const STEPS = [
  {
    n: 1,
    title: 'Income profile',
    time: '~30 sec',
    desc: 'Select your income structure — salaried, self-employed, or company director.',
  },
  {
    n: 2,
    title: 'Residence & background',
    time: '~20 sec',
    desc: 'Your residence status determines which lenders and LTV limits apply.',
  },
  {
    n: 3,
    title: 'Existing debt obligations',
    time: '~30 sec',
    desc: 'Current monthly obligations used to calculate your debt service ratio.',
  },
  {
    n: 4,
    title: 'Property & financing',
    time: '~30 sec',
    desc: 'Purchase price, own funds, and property purpose determine your LTV position.',
  },
]

export default function HowItWorksSection({ onStart }) {
  return (
    <section id="how-it-works" className="bg-surface border-t border-border py-12 sm:py-24 px-5 sm:px-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <p className="text-[10px] font-bold tracking-widest uppercase text-brand-600 mb-2 sm:mb-3">
            Process
          </p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-ink mb-3 sm:mb-4 leading-tight">
            How it works
          </h2>
          <div className="flex items-center gap-1.5 text-ink-muted text-sm">
            <Clock size={13} className="flex-shrink-0" />
            <span>~2 minutes. No documents required.</span>
          </div>
        </div>

        {/* Steps — compact on mobile */}
        <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
          {STEPS.map(({ n, title, time, desc }) => (
            <div key={n} className="card-surface p-4 sm:p-6 flex gap-3 sm:gap-5">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                  <span className="font-display text-xs sm:text-sm font-black text-brand-600">{n}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5 sm:mb-1">
                  <p className="font-semibold text-ink text-[14px] sm:text-[15px]">{title}</p>
                  <span className="text-[10px] font-semibold text-ink-subtle bg-surface border border-border rounded-full px-2 py-0.5">
                    {time}
                  </span>
                </div>
                <p className="text-[13px] sm:text-sm text-ink-muted leading-relaxed line-clamp-2">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          type="button"
          className="btn-cta w-full sm:w-auto"
        >
          Start Assessment
        </button>

      </div>
    </section>
  )
}
