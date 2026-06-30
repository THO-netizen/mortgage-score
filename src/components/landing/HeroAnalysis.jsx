import { BarChart2, Lock, Shield } from 'lucide-react'

export default function HeroAnalysis({ onStart }) {
  return (
    <main className="min-h-screen bg-hero flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full text-center animate-fade-up">

        {/* Headline */}
        <h1 className="font-display text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight mb-4">
          Czech Mortgage<br />
          <span className="text-brand-400">Eligibility Analyzer</span>
        </h1>

        {/* Tool description — neutral, system tone */}
        <p className="text-slate-400 text-sm sm:text-[15px] max-w-md mx-auto mb-10 leading-relaxed">
          This tool estimates how Czech banks evaluate mortgage applications
          based on income structure, residence status, and debt profile.
          No sales pitch. No credit check.
        </p>

        {/* Primary CTA */}
        <button
          onClick={onStart}
          type="button"
          className="btn-cta mx-auto text-base px-12 mb-8"
        >
          Start Analysis
        </button>

        {/* Trust signals — factual only */}
        <div className="flex items-center justify-center gap-5 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Lock size={11} />
            <span>No data stored</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Shield size={11} />
            <span>No credit check</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <BarChart2 size={11} />
            <span>Simulation model — not a bank decision</span>
          </div>
        </div>

      </div>
    </main>
  )
}
