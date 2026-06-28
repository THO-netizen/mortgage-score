import { Lock, Shield, TrendingUp, Target, BarChart2, BookOpen, Lightbulb } from 'lucide-react'

const privacyPoints = [
  'No documents uploaded to any server',
  'No data shared with banks or third parties',
  'No account or registration required',
  'All document analysis runs inside your browser',
]

const pillars = [
  {
    icon: TrendingUp,
    title: 'Financial Potential',
    desc: 'Helping individuals and entrepreneurs understand their numbers',
  },
  {
    icon: Target,
    title: 'Mortgage Readiness',
    desc: 'Optimizing your profile before official bank submission',
  },
  {
    icon: BarChart2,
    title: 'Smarter Decisions',
    desc: 'Data-backed guidance for property financing',
  },
]

export default function TrustSidebar() {
  return (
    <aside className="hidden lg:flex flex-col gap-4 sticky top-24">

      {/* ── Privacy guarantee (dark card) ────────────── */}
      <div className="bg-hero rounded-card p-6 text-white">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <Lock size={16} className="text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-sm leading-tight">
              End-to-End Privacy
            </p>
            <p className="text-slate-400 text-xs mt-0.5">
              Zero-upload architecture
            </p>
          </div>
        </div>

        <ul className="space-y-2.5">
          {privacyPoints.map((pt) => (
            <li key={pt} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-success-DEFAULT/20 flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4L3 5.5L6.5 2" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="text-xs text-slate-300 leading-relaxed">{pt}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Advisor profile (light card) ─────────────── */}
      <div className="card-surface p-6">

        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <Lightbulb size={13} className="text-brand-500 flex-shrink-0" />
          <p className="section-label">Mortgage &amp; Financial Intelligence</p>
        </div>

        {/* Avatar + name block */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-cta">
            <span className="font-display text-sm font-extrabold text-white tracking-tight">AL</span>
          </div>
          <div>
            <p className="font-display text-sm font-extrabold text-ink leading-tight">Andy Le</p>
            <p className="text-[11px] text-ink-muted leading-snug mt-0.5">
              Mortgage &amp; Financial Intelligence Specialist
            </p>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-xs font-semibold text-brand-600 italic mb-4 leading-snug">
          "Know your mortgage power before the bank does."
        </p>

        {/* Bio */}
        <p className="text-xs text-ink-muted leading-relaxed mb-5">
          At Mortgage Score, we transform complex financial data into clear
          mortgage insights. Our mission is to help you evaluate your financial
          health, understand your borrowing capacity, and unlock better mortgage
          opportunities with confidence, speed, and precision.
        </p>

        {/* Pillars */}
        <div className="space-y-3 pt-4 border-t border-border">
          {pillars.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={12} className="text-brand-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-ink leading-tight">{title}</p>
                <p className="text-[10px] text-ink-muted leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ── Methodology note (light card) ────────────── */}
      <div className="card-surface p-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={13} className="text-ink-subtle" />
          <p className="section-label">Scoring methodology</p>
        </div>
        <p className="text-xs text-ink-muted leading-relaxed">
          Calibrated against Czech National Bank (CNB) regulations and live
          underwriting criteria from 19 active Czech mortgage lenders.
          Updated quarterly by specialist mortgage brokers.
        </p>
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-brand-500 flex-shrink-0" />
            <p className="text-[11px] text-ink-subtle italic">
              Not a sales tool. Built by Czech mortgage specialists
              for international clients.
            </p>
          </div>
        </div>
      </div>

    </aside>
  )
}
