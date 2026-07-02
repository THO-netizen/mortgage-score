import { useState } from 'react'
import { ChevronDown, Info } from 'lucide-react'

const SECTIONS = [
  {
    q: 'What does this score represent?',
    a: 'The score is a simulation of how Czech mortgage underwriters assess applicant risk. It aggregates income stability, debt-to-income ratios, residence status, and property parameters into a single composite index. It is not a credit score and does not involve any real bank system.',
  },
  {
    q: 'How does Czech bank underwriting work?',
    a: 'Czech National Bank (CNB) regulations require banks to assess three ratios: DTI (total debt-to-income, capped at 9.5×), DSTI (debt-service-to-income, capped at 45% of net income), and LTV (loan-to-value, capped at 80% generally or 90% for applicants under 36). Banks apply these constraints simultaneously — the most restrictive binding constraint determines the maximum loan.',
  },
  {
    q: 'How is self-employed income assessed?',
    a: 'Self-employed sole traders using standard tax returns are assessed on taxable profit after expenses. Banks typically average the last two fiscal years. Those using the flat-tax regime face a structurally lower taxable base, which directly limits borrowing capacity. Minimum 2 years of self-employment history is required by most lenders.',
  },
  {
    q: 'How is company director income assessed?',
    a: 'Company directors are assessed under ESSO (Economically Self-related Subject Owner) methodology. Banks assess income across three streams: Stream A (director salary), Stream B (dividends), and Stream C (service fees). Ownership percentage, company profitability, equity, and dividend history all factor into the eligible income calculation. Not all banks accept all streams.',
  },
  {
    q: 'What is DSTI and why does it matter?',
    a: 'DSTI (Debt Service-to-Income ratio) measures total monthly debt obligations — including the proposed new mortgage — as a percentage of net monthly income. Regulatory rules cap this at 45%. Household minimum living costs are deducted from income before applying the cap, which is why liabilities and income precision both matter significantly.',
  },
  {
    q: 'Is this assessment binding or official?',
    a: 'No. This is a simulation model built on publicly available Czech National Bank regulation parameters and observed Czech bank underwriting practice. It is designed to help applicants understand their likely position before speaking to a bank or broker. Individual bank decisions may differ based on internal credit policy, document verification, and applicant-specific factors not captured here.',
  },
]

function AccordionItem({ q, a, isOpen, onToggle }) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 py-4 text-left focus:outline-none group"
      >
        <span className="text-[13px] font-semibold text-ink group-hover:text-brand-700 transition-colors leading-snug">
          {q}
        </span>
        <ChevronDown
          size={16}
          className={[
            'flex-shrink-0 text-ink-subtle mt-0.5 transition-transform duration-200',
            isOpen ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>
      {isOpen && (
        <p className="text-[12px] text-ink-muted leading-relaxed pb-4 animate-fade-in">
          {a}
        </p>
      )}
    </div>
  )
}

export default function HowItWorks() {
  const [openIdx, setOpenIdx] = useState(null)

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card p-6 mt-8">

      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
          <Info size={15} className="text-brand-600" />
        </div>
        <div>
          <h3 className="font-display text-[15px] font-bold text-ink">
            How this evaluation works
          </h3>
          <p className="text-[11px] text-ink-subtle mt-0.5">
            Methodology, data sources, and limitations of this simulation
          </p>
        </div>
      </div>

      <div className="divide-y divide-border">
        {SECTIONS.map((s, i) => (
          <AccordionItem
            key={i}
            q={s.q}
            a={s.a}
            isOpen={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          />
        ))}
      </div>

      <p className="mt-5 text-[11px] text-ink-subtle leading-relaxed border-t border-border pt-4">
        <span className="font-semibold text-ink-muted">Disclaimer: </span>
        This tool is a simulation model only. Output does not constitute financial advice,
        a credit decision, or a guarantee of mortgage approval. Consult a licensed mortgage
        advisor before submitting any application.
      </p>

    </div>
  )
}
