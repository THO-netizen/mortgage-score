import { Lock, Shield, Users, TrendingUp, BookOpen } from 'lucide-react'

const stats = [
  { value: '2,400+', label: 'expats assessed'       },
  { value: '19',     label: 'Czech banks covered'    },
  { value: '87%',    label: 'received pre-approval'  },
  { value: '4 min',  label: 'average completion'     },
]

const privacyPoints = [
  'No documents uploaded to any server',
  'No data shared with banks or third parties',
  'No account or registration required',
  'All document analysis runs inside your browser',
]

/**
 * Dark sticky sidebar — visible on lg+ breakpoints during the funnel.
 * Communicates privacy, methodology, and social proof.
 */
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

      {/* ── Social proof (light card) ─────────────────── */}
      <div className="card-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={13} className="text-ink-subtle" />
          <p className="section-label">Trusted by expats in Czechia</p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <p className="font-display text-xl font-extrabold text-ink leading-none">
                {value}
              </p>
              <p className="text-xs text-ink-muted mt-1">{label}</p>
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
