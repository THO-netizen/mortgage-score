import { BarChart2, Lock, Shield } from 'lucide-react'

export default function HeroAnalysis({ onStart }) {
  return (
    <main className="min-h-screen bg-hero flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full text-center animate-fade-up">

        {/* Score preview chip */}
        <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 mb-10">
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
            {/* Track */}
            <circle cx="20" cy="20" r="15" fill="none"
              stroke="rgba(255,255,255,0.08)" strokeWidth="3.5"
              strokeDasharray={`${15 * 2 * Math.PI * 0.75} ${15 * 2 * Math.PI * 0.25}`}
              strokeLinecap="round"
              transform="rotate(135 20 20)"
            />
            {/* Fill — static 68% placeholder */}
            <circle cx="20" cy="20" r="15" fill="none"
              stroke="#3B82F6" strokeWidth="3.5"
              strokeDasharray={`${15 * 2 * Math.PI * 0.75 * 0.68} ${15 * 2 * Math.PI * (1 - 0.75 * 0.68)}`}
              strokeLinecap="round"
              transform="rotate(135 20 20)"
            />
            <text x="20" y="24" textAnchor="middle"
              fill="white" fontSize="10"
              fontFamily="Manrope, Inter, sans-serif"
              fontWeight="800">
              68
            </text>
          </svg>
          <div className="text-left">
            <p className="text-white text-[13px] font-semibold">Sample Eligibility Score</p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Full analysis generated in ~2 minutes
            </p>
          </div>
        </div>

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
