import { Clock } from 'lucide-react'

const STEPS = [
  {
    n: 1,
    title: 'Income profile',
    time: '~30 sec',
    desc: 'Select your income structure — salaried employment, self-employed, or company director. Determines the applicable underwriting methodology and income recognition rules.',
  },
  {
    n: 2,
    title: 'Residence & background',
    time: '~20 sec',
    desc: 'Residence status and time spent in the Czech Republic. Determines which lenders apply to your profile and which LTV limits are enforced.',
  },
  {
    n: 3,
    title: 'Existing debt obligations',
    time: '~30 sec',
    desc: 'Current monthly obligations — loan repayments, leasing, and credit card limits. Used to calculate your debt service ratio against the regulatory 45% ceiling.',
  },
  {
    n: 4,
    title: 'Property & financing',
    time: '~30 sec',
    desc: 'Purchase price, available own funds, and property purpose. Determines your LTV position and the maximum eligible loan amount under regulatory guidelines.',
  },
]

export default function HowItWorksSection({ onStart }) {
  return (
    <section id="how-it-works" className="bg-surface border-t border-border py-16 sm:py-24 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] font-bold tracking-widest uppercase text-brand-600 mb-3">
            Process
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-ink mb-4 leading-tight">
            How it works
          </h2>
          <div className="flex items-center gap-1.5 text-ink-muted text-sm">
            <Clock size={13} className="flex-shrink-0" />
            <span>Approximately 2 minutes. No documents required.</span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-10">
          {STEPS.map(({ n, title, time, desc }) => (
            <div key={n} className="card-surface p-5 sm:p-6 flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                  <span className="font-display text-sm font-black text-brand-600">{n}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-ink text-[15px]">{title}</p>
                  <span className="text-[10px] font-semibold text-ink-subtle bg-surface border border-border rounded-full px-2 py-0.5">
                    {time}
                  </span>
                </div>
                <p className="text-sm text-ink-muted leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          type="button"
          className="btn-cta"
        >
          Start Assessment
        </button>

      </div>
    </section>
  )
}
